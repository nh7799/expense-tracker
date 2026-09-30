"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUserId, removeExpense } from "@/lib/data";

export async function deleteExpense(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid expense." };
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Your session has expired." };
  const ok = await removeExpense(userId, id);
  if (!ok) return { ok: false, error: "Could not delete. Please try again." };
  revalidatePath("/dashboard");
  return { ok: true };
}
