// backend/src/controllers/pdf.controller.ts
import type { Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { TransactionType } from '@prisma/client'
import { categorizeTransaction } from '../lib/categorize.js'

/** ---------------- helpers ---------------- **/

// Clean "₹1,23,456.78", "(1,234.00)", "123.00-", "  123.00  " → signed number
const cleanAmount = (raw: string): number => {
  const s = (raw ?? '')
    .replace(/,/g, '')
    .trim()
    .replace(/^\((.*)\)$/, '-$1') // (123.45) -> -123.45
    .replace(/^(.+)-$/, '-$1')    // 123.45-  -> -123.45
  const n = Number(s.replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

// Parse dates: dd/mm/yyyy, dd-mm-yyyy, dd-MMM-yyyy, fallback to Date(...)
const parseDateLoose = (t: string): Date | null => {
  const s = (t || '').trim()

  // dd/mm/yyyy or dd-mm-yyyy
  {
    const m = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/)
    if (m && m.length >= 4) {
      const dd = Number(m[1]); const mm = Number(m[2]); const yyyy = Number(m[3])
      const d = new Date(yyyy, mm - 1, dd)
      return Number.isNaN(+d) ? null : d
    }
  }

  // dd-MMM-yyyy (01-AUG-2025)
  {
    const m = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/)
    if (m && m.length >= 4) {
      const dd = Number(m[1]); const monStr = (m[2] || '').toUpperCase(); const yyyy = Number(m[3])
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
      const idx = months.indexOf(monStr)
      if (idx >= 0) {
        const d = new Date(yyyy, idx, dd)
        return Number.isNaN(+d) ? null : d
      }
    }
  }

  const d = new Date(s)
  return Number.isNaN(+d) ? null : d
}

const detectBank = (text: string): 'ICICI'|'HDFC'|'SBI'|'GENERIC' => {
  const t = text.slice(0, 4000).toUpperCase()
  if (t.includes('ICICI BANK')) return 'ICICI'
  if (t.includes('HDFC BANK')) return 'HDFC'
  if (t.includes('STATE BANK OF INDIA') || t.includes(' SBI ')) return 'SBI'
  return 'GENERIC'
}

/** ---------------- parsers ---------------- **/

// A) One-line rows: "date  description  amount  [DR|CR]"
//  - amount may be "-123", "123-", "(123.00)"
function parseSimpleLines(text: string) {
  const rows: { date: Date; description: string; amount: number; type: TransactionType }[] = []
  const re =
    /^(\d{2}[\/-]\d{2}[\/-]\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([()\-\d,.\s]+?)(?:\s*(CR|DR))?$/gmi

  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    // [0]=full, [1]=date, [2]=desc, [3]=amount, [4]=DR|CR?
    const dateToken = match[1] ?? ''
    const descToken = match[2] ?? ''
    const amtToken  = match[3] ?? ''
    const drcrToken = (match[4] ?? '').toUpperCase()

    const date = parseDateLoose(dateToken)
    if (!date || !descToken) continue

    const amt = cleanAmount(amtToken)
    if (!Number.isFinite(amt)) continue

    const isExpense = drcrToken === 'DR' ? true : drcrToken === 'CR' ? false : amt < 0

    rows.push({
      date,
      description: descToken.trim().replace(/\s+/g, ' '),
      amount: Math.abs(amt),
      type: isExpense ? TransactionType.EXPENSE : TransactionType.INCOME,
    })
  }
  return rows
}

// B) Column layout: "date  description  debit  credit  [balance]"
function parseDebitCreditColumns(text: string) {
  const rows: { date: Date; description: string; amount: number; type: TransactionType }[] = []
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  const amtSrc = '([()\\-]?\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?-?)'
  const dateSrc = '(\\d{2}[\\/-]\\d{2}[\\/-]\\d{4}|\\d{2}-[A-Za-z]{3}-\\d{4})'
  const patternStr = `^${dateSrc}\\s+(.+?)\\s+${amtSrc}\\s+${amtSrc}(?:\\s+${amtSrc})?$`
  const re = new RegExp(patternStr, 'i')

  for (const line of lines) {
    const m = line.match(re)
    if (!m || m.length < 5) continue

    const dateToken = m[1] ?? ''
    const descToken = m[2] ?? ''
    const debitToken = m[3] ?? ''
    const creditToken = m[4] ?? ''

    const date = parseDateLoose(dateToken)
    if (!date) continue

    const desc = descToken.replace(/\s+/g, ' ').trim()
    const debit = cleanAmount(debitToken)
    const credit = cleanAmount(creditToken)

    if (Number.isFinite(debit) && debit > 0) {
      rows.push({ date, description: desc, amount: debit, type: TransactionType.EXPENSE })
    } else if (Number.isFinite(credit) && credit > 0) {
      rows.push({ date, description: desc, amount: credit, type: TransactionType.INCOME })
    }
  }
  return rows
}

/** ---------------- controller ---------------- **/

export const uploadPdfStatement = async (req: Request, res: Response) => {
  if (!req.userId || !req.file) {
    return res.status(400).json({ message: 'Missing PDF file or authentication.' })
  }

  try {
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(415).json({ message: 'Only PDF files are allowed.' })
    }

    // Lazy import pdf-parse to avoid startup issues
    const pdf = (await import('pdf-parse')).default
    const parsed = await pdf(req.file.buffer)
    const text = parsed.text?.trim() || ''
    if (!text) {
      return res.status(422).json({
        message: 'Could not read text from PDF. If this is a scanned PDF, OCR is required.',
      })
    }

    const bank = detectBank(text)

    // Run both generic parsers and merge
    const parsedA = parseSimpleLines(text)
    const parsedB = parseDebitCreditColumns(text)
    const rows = [...parsedA, ...parsedB]

    // De-dup by (date|desc|amount|type)
    const seen = new Set<string>()
    const unique = rows.filter(r => {
      const key = `${r.date.toISOString().slice(0,10)}|${r.description}|${r.amount}|${r.type}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (unique.length === 0) {
      return res.status(400).json({
        message: `No transactions recognized for ${bank} layout. The format might not be supported yet.`,
      })
    }

    const data = unique.map(r => ({
      description: r.description,
      amount: r.amount,
      type: r.type,
      date: r.date,
      userId: req.userId!, // added by auth middleware
      category: categorizeTransaction(r.description),
      // if you later add a Source enum: source: 'PDF'
    }))

    const result = await prisma.transaction.createMany({
      data,
      skipDuplicates: true,
    })

    return res.status(201).json({
      message: `${result.count} of ${data.length} transactions imported from PDF.`,
      detectedLayout: bank,
      inserted: result.count,
    })
  } catch (err) {
    console.error('PDF Upload error:', err)
    return res.status(500).json({ message: 'Failed to process PDF file.' })
  }
}
