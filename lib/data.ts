import { isSupabaseConfigured } from "@/lib/env";
import { LOCAL_CATEGORIES } from "@/lib/local/categories";
import { getLocalUserId, newId } from "@/lib/local/auth";
import { categoryName, readDb, writeDb, type LocalExpense } from "@/lib/local/db";
import { createClient } from "@/lib/supabase/server";

export type ExpenseRow = {
  id: string;
  amount_minor: number;
  expense_time: string | null;
  merchant: string | null;
  description: string | null;
  payment_method: string | null;
  categories: { name: string } | null;
};

export type CategoryRow = { id: string; name: string };

export async function getSessionUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return getLocalUserId();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listCategories(): Promise<CategoryRow[]> {
  if (!isSupabaseConfigured()) {
    return LOCAL_CATEGORIES.map(({ id, name }) => ({ id, name }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id,name").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

function fromLocal(row: LocalExpense): ExpenseRow {
  return {
    id: row.id,
    amount_minor: row.amount_minor,
    expense_time: row.expense_time,
    merchant: row.merchant,
    description: row.description,
    payment_method: row.payment_method,
    categories: { name: categoryName(row.category_id) },
  };
}

export async function listExpensesForDate(userId: string, date: string): Promise<ExpenseRow[]> {
  if (!isSupabaseConfigured()) {
    const db = await readDb();
    return db.expenses
      .filter((e) => e.user_id === userId && e.expense_date === date)
      .sort((a, b) => {
        const ta = a.expense_time ?? "";
        const tb = b.expense_time ?? "";
        if (ta !== tb) return tb.localeCompare(ta);
        return b.created_at.localeCompare(a.created_at);
      })
      .map(fromLocal);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id,amount_minor,expense_time,merchant,description,payment_method,categories(name)")
    .eq("expense_date", date)
    .order("expense_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => {
    const cat = r.categories as { name: string } | { name: string }[] | null;
    const name = Array.isArray(cat) ? cat[0]?.name : cat?.name;
    return {
      id: r.id as string,
      amount_minor: Number(r.amount_minor),
      expense_time: (r.expense_time as string | null) ?? null,
      merchant: (r.merchant as string | null) ?? null,
      description: (r.description as string | null) ?? null,
      payment_method: (r.payment_method as string | null) ?? null,
      categories: name ? { name } : null,
    };
  });
}

export async function insertExpense(input: {
  userId: string;
  clientRequestId: string;
  categoryId: string;
  amount: number;
  expenseDate: string;
  expenseTime: string | null;
  merchant: string | null;
  description: string | null;
  paymentMethod: string | null;
}): Promise<{ id: string; duplicate: boolean }> {
  if (!isSupabaseConfigured()) {
    const db = await readDb();
    const existing = db.expenses.find(
      (e) => e.user_id === input.userId && e.client_request_id === input.clientRequestId,
    );
    if (existing) return { id: existing.id, duplicate: true };
    const row: LocalExpense = {
      id: newId(),
      user_id: input.userId,
      category_id: input.categoryId,
      client_request_id: input.clientRequestId,
      amount_minor: input.amount,
      expense_date: input.expenseDate,
      expense_time: input.expenseTime,
      merchant: input.merchant,
      description: input.description,
      payment_method: input.paymentMethod,
      created_at: new Date().toISOString(),
    };
    db.expenses.push(row);
    await writeDb(db);
    return { id: row.id, duplicate: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: input.userId,
      client_request_id: input.clientRequestId,
      category_id: input.categoryId,
      amount_minor: input.amount,
      expense_date: input.expenseDate,
      expense_time: input.expenseTime,
      merchant: input.merchant,
      description: input.description,
      payment_method: input.paymentMethod,
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    const { data: existing } = await supabase
      .from("expenses")
      .select("id")
      .eq("user_id", input.userId)
      .eq("client_request_id", input.clientRequestId)
      .single();
    if (existing) return { id: existing.id, duplicate: true };
  }
  if (error || !data) {
    console.error("createExpense failed", { code: error?.code, message: error?.message });
    throw new Error("save_failed");
  }
  return { id: data.id, duplicate: false };
}

export async function removeExpense(userId: string, id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const db = await readDb();
    const next = db.expenses.filter((e) => !(e.id === id && e.user_id === userId));
    if (next.length === db.expenses.length) return false;
    db.expenses = next;
    await writeDb(db);
    return true;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    console.error("deleteExpense failed", error.code, error.message);
    return false;
  }
  return true;
}
