"use server";
import { revalidatePath } from "next/cache";
import { insertExpense, getSessionUserId } from "@/lib/data";
import { expenseInputSchema } from "@/lib/validation/expense";

export type ActionResult =
  | { ok: true; id: string; duplicate: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export async function createExpense(raw: unknown): Promise<ActionResult> {
  const parsed = expenseInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const v = parsed.data;

  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Your session has expired. Please sign in again." };

  try {
    const result = await insertExpense({
      userId,
      clientRequestId: v.clientRequestId,
      categoryId: v.categoryId,
      amount: v.amount,
      expenseDate: v.expenseDate,
      expenseTime: v.expenseTime ?? null,
      merchant: v.merchant ?? null,
      description: v.description ?? null,
      paymentMethod: v.paymentMethod ?? null,
    });
    revalidatePath("/dashboard");
    return { ok: true, id: result.id, duplicate: result.duplicate };
  } catch {
    return { ok: false, error: "Your expense was not saved. Please try again." };
  }
}
