import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { updateUserSchema } from '../lib/validators.js';

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ message: 'Invalid input', errors: validation.error.issues });
  }

  try {
    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const updateData: { name?: string } = {};
    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: { id: true, email: true, name: true, createdAt: true },
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- ADD THIS FUNCTION ---
export const deleteAccount = async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
    await prisma.user.delete({
      where: { id: req.userId },
    });
    // The `onDelete: Cascade` in our Prisma schema automatically deletes all related transactions.

    // Clear the session cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};