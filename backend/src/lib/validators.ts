import { z } from 'zod';
import { TransactionType } from '@prisma/client';


const emailSchema = z.string().email({ message: "Invalid email format" });

const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" });

const nameSchema = z.string().min(1, { message: "Name cannot be empty" });


export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
}).strict().refine(data => Object.keys(data).length > 0, { // <-- Add .strict() here
  message: "At least one field must be provided for an update"
});

export const getTransactionsSchema = z.object({
  type: z.enum([TransactionType.INCOME, TransactionType.EXPENSE]).optional(),
  // We use z.coerce.date() to convert the URL string into a Date object
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: passwordSchema, // Re-use our strong password schema
});