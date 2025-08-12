import { useEffect, useRef, useState } from 'react'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { fmtDate, inr } from '../../utils/format'

type TxType = 'INCOME' | 'EXPENSE'
interface Txn {
  id: string
  description: string
  amount: number | string
  type: TxType
  date: string
  category: string
}

const asNum = (v: unknown) => (typeof v === 'number' ? v : Number(v))

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Txn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Filters
  const [type, setType] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Upload refs/states
  const csvInputRef = useRef<HTMLInputElement | null>(null)
  const pdfInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingCsv, setUploadingCsv] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  const fetchTxns = async (params?: Record<string, string>) => {
    setIsLoading(true)
    setError(null)
    try {
      const query: Record<string, string> = params ?? {}
      const r = await api.get<Txn[]>(API.TXNS, { params: query })
      setTxns(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load transactions')
      setTxns([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchTxns() }, [])

  const applyFilters = async () => {
    const params: Record<string, string> = {}
    if (type) params.type = type
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    await fetchTxns(params)
  }

  const clearFilters = async () => {
    setType('')
    setStartDate('')
    setEndDate('')
    await fetchTxns({})
  }

  // ----- CSV upload -----
  const onUploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setUploadingCsv(true)
    setError(null)
    setNotice(null)
    try {
      const resp = await api.post(API.TXNS_UPLOAD, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setNotice(resp.data?.message ?? 'CSV imported successfully.')
      await applyFilters()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed. Please check the CSV format.')
    } finally {
      setUploadingCsv(false)
      if (csvInputRef.current) csvInputRef.current.value = ''
      setTimeout(() => setNotice(null), 3500)
    }
  }

  // ----- PDF upload -----
  const onUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setUploadingPdf(true)
    setError(null)
    setNotice(null)
    try {
      const resp = await api.post(API.PDF_UPLOAD, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const msg: string =
        resp.data?.message ??
        `PDF imported${resp.data?.detectedLayout ? ` (${resp.data.detectedLayout})` : ''}.`
      setNotice(msg)
      await applyFilters()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'PDF upload failed. Make sure it is a text PDF (not scanned).')
    } finally {
      setUploadingPdf(false)
      if (pdfInputRef.current) pdfInputRef.current.value = ''
      setTimeout(() => setNotice(null), 3500)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters + Import */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          {/* Filters */}
          <div>
            <div className="text-xs text-gray-500">Type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="INCOME">INCOME</option>
              <option value="EXPENSE">EXPENSE</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-gray-500">Start date</div>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <div className="text-xs text-gray-500">End date</div>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <Button onClick={applyFilters} className="md:ml-auto">Apply Filters</Button>
          <button
            onClick={clearFilters}
            className="rounded-xl px-3 py-2 text-sm border border-gray-300 bg-white hover:bg-gray-50"
          >
            Clear
          </button>

          {/* Import controls */}
          <div className="flex flex-wrap gap-2 md:ml-4">
            {/* CSV */}
            <label className={`inline-flex items-center gap-2 ${uploadingCsv ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.CSV,text/csv"
                onChange={onUploadCsv}
                className="hidden"
                disabled={uploadingCsv}
              />
              <span className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">
                {uploadingCsv ? 'Uploading CSV…' : 'Upload CSV'}
              </span>
            </label>

            {/* PDF */}
            <label className={`inline-flex items-center gap-2 ${uploadingPdf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={onUploadPdf}
                className="hidden"
                disabled={uploadingPdf}
              />
              <span className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">
                {uploadingPdf ? 'Uploading PDF…' : 'Upload PDF'}
              </span>
            </label>
          </div>
        </div>

        {notice && (
          <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Type</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">Loading…</td>
              </tr>
            )}

            {!isLoading && !error && txns.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No transactions found. Try Import → AA (Mock), Upload CSV, or Upload PDF.
                </td>
              </tr>
            )}

            {!isLoading && !error && txns.length > 0 && txns.map((t) => {
              const amt = asNum(t.amount) || 0
              return (
                <tr key={t.id} className="border-t">
                  <td className="p-3">{fmtDate(t.date)}</td>
                  <td className="p-3">{t.description}</td>
                  <td className="p-3">{t.category}</td>
                  <td className="p-3 text-right">{t.type}</td>
                  <td className="p-3 text-right">{inr(amt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
