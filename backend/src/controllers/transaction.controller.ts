import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import Papa from 'papaparse';
import { TransactionType } from '@prisma/client';
import { getTransactionsSchema } from '../lib/validators.js';
import { categorizeTransaction } from '../lib/categorize.js';

interface CsvRow {
  Date: string;
  Description: string;
  Amount: string;
}

// CHANGED: Added robust helper function to clean currency strings
const cleanAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  return parseFloat(String(amountStr).replace(/[^0-9.-]/g, ''));
};

export const uploadTransactions = async (req: Request, res: Response) => {
  if (!req.file || !req.userId) {
    return res.status(400).json({ message: 'Missing file or authentication.' });
  }
  const csvFile = req.file.buffer.toString('utf8');

  try {
    const parsedData = Papa.parse<CsvRow>(csvFile, { header: true, skipEmptyLines: true });
    const validRows = parsedData.data.filter(row => row.Date && row.Description && row.Amount);

    if (validRows.length === 0) {
      return res.status(400).json({ message: 'CSV has invalid format or is empty.' });
    }

    const transactionsToCreate = validRows.map(row => {
      const amount = cleanAmount(row.Amount); // CHANGED: Using the robust cleaning function
      if (isNaN(amount)) return null; 

      return {
        description: row.Description,
        amount: Math.abs(amount),
        type: amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME,
        date: new Date(row.Date),
        userId: req.userId!,
        category: categorizeTransaction(row.Description),
      };
    }).filter(Boolean);

    if (transactionsToCreate.length === 0) {
      return res.status(400).json({ message: 'No valid transactions found in the file.' });
    }

    const result = await prisma.transaction.createMany({ 
      data: transactionsToCreate as any[], 
      skipDuplicates: true 
    });

    // CHANGED: Providing a richer, more detailed response
    res.status(201).json({
      message: `${result.count} of ${transactionsToCreate.length} transactions imported successfully.`,
      received: validRows.length,
      processed: transactionsToCreate.length,
      inserted: result.count,
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: 'Failed to process CSV file.' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }
  const validation = getTransactionsSchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({ message: 'Invalid query parameters', errors: validation.error.issues });
  }
  const { type, startDate, endDate } = validation.data;

  const whereClause: any = { userId: req.userId };
  if (type) whereClause.type = type;
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = startDate;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date.lte = endOfDay;
    }
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: 'Failed to retrieve transactions.' });
  }
};

export const getTransactionSummary = async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }
  const validation = getTransactionsSchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({ message: 'Invalid query parameters', errors: validation.error.issues });
  }
  const { startDate, endDate } = validation.data;

  const whereClause: any = { userId: req.userId };
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = startDate;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date.lte = endOfDay;
    }
  }

  try {
    const income = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...whereClause, type: TransactionType.INCOME },
    });
    const expenses = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...whereClause, type: TransactionType.EXPENSE },
    });

    const totalIncome = income._sum.amount ?? 0;
    const totalExpense = expenses._sum.amount ?? 0;
    const netSavings = Number(totalIncome) - Number(totalExpense);

    res.status(200).json({ totalIncome, totalExpense, netSavings });
  } catch (error) {
    console.error("Get summary error:", error);
    res.status(500).json({ message: 'Failed to retrieve transaction summary.' });
  }
};