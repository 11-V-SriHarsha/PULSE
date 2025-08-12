import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { categorizeTransaction } from '../lib/categorize.js';
import { TransactionType } from '@prisma/client';


const mockAATransactions = [
    { description: 'UPI/CRN/456123/PAYMENT TO FLIPKART', amount: -2500.00, date: '2025-08-10T10:00:00Z' },
    { description: 'ZOMATO ONLINE ORDER', amount: -450.50, date: '2025-08-09T19:30:00Z' },
    { description: 'OLA RIDE TO OFFICE', amount: -180.00, date: '2025-08-08T18:00:00Z' },
    { description: 'AMAZON PRIME VIDEO SUBSCRIPTION', amount: -179.00, date: '2025-08-05T11:00:00Z' },
    { description: 'SALARY CREDIT AUG-25', amount: 75000.00, date: '2025-08-01T09:00:00Z' },
    { description: 'INVESTMENT IN GROWW MUTUAL FUND', amount: -5000.00, date: '2025-07-28T14:00:00Z' },
    { description: 'ELECTRICITY BILL PAYMENT - BESCOM', amount: -850.00, date: '2025-07-25T12:00:00Z' },
    { description: 'ZEPTO GROCERIES ORDER', amount: -1250.75, date: '2025-07-24T20:00:00Z' },
    { description: 'UPI/CRN/321654/PAYMENT TO MYNTRA', amount: -3200.00, date: '2025-07-22T15:30:00Z' },
    { description: 'NETFLIX.COM MONTHLY FEE', amount: -499.00, date: '2025-07-20T08:00:00Z' },
    { description: 'INTEREST CREDIT SAVINGS A/C', amount: 125.50, date: '2025-07-18T16:00:00Z' },
];

export const fetchAndSaveTransactions = async (req: Request, res: Response) => {
    if (!req.userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }
    const userId = req.userId;

    try {
        const transactionsToCreate = mockAATransactions.map(tx => ({
            description: tx.description,
            amount: Math.abs(tx.amount),
            type: tx.amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME,
            date: new Date(tx.date),
            userId: userId,
            category: categorizeTransaction(tx.description),
        }));

        const result = await prisma.transaction.createMany({
            data: transactionsToCreate,
            skipDuplicates: true,
        });

        res.status(200).json({ message: `Successfully fetched and saved ${result.count} new transactions.` });
    } catch (error) {
        console.error("AA fetch error:", error);
        res.status(500).json({ message: 'Failed to fetch and save AA transactions.' });
    }
};