import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { LOCAL_CATEGORIES } from "./categories";

export type LocalUser = { id: string; email: string; passwordHash: string };
export type LocalExpense = {
  id: string;
  user_id: string;
  category_id: string;
  client_request_id: string;
  amount_minor: number;
  expense_date: string;
  expense_time: string | null;
  merchant: string | null;
  description: string | null;
  payment_method: string | null;
  created_at: string;
};

export type LocalDb = { users: LocalUser[]; expenses: LocalExpense[] };

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

async function empty(): Promise<LocalDb> {
  return { users: [], expenses: [] };
}

export async function readDb(): Promise<LocalDb> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    return { users: parsed.users ?? [], expenses: parsed.expenses ?? [] };
  } catch {
    return empty();
  }
}

export async function writeDb(db: LocalDb): Promise<void> {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function categoryName(id: string): string {
  return LOCAL_CATEGORIES.find((c) => c.id === id)?.name ?? "Other";
}
