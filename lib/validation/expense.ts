import { z } from "zod";
import { isValidYmd } from "@/lib/dates";
import { parseMoneyToMinorUnits } from "@/lib/money";

export const PAYMENT_METHODS = ["Debit Card", "Credit Card", "Cash", "Bank Transfer", "Apple Pay", "Other"] as const;
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const expenseInputSchema = z.object({
  clientRequestId: z.string().uuid(),
  amount: z.string().transform((s, ctx) => {
    try {
      return parseMoneyToMinorUnits(s);
    } catch (e) {
      ctx.addIssue({ code: "custom", message: (e as Error).message });
      return z.NEVER;
    }
  }),
  categoryId: z.string().uuid(),
  expenseDate: z.string().refine(isValidYmd, "Invalid date"),
  expenseTime: z.preprocess(emptyToNull, z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional()),
  merchant: z.preprocess(emptyToNull, z.string().trim().max(100).nullable().optional()),
  description: z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional()),
  paymentMethod: z.preprocess(emptyToNull, z.enum(PAYMENT_METHODS).nullable().optional()),
}).strict();

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
