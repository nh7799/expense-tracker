import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { AddExpense, DeleteButton } from "@/components/expense-ui";
import { getSessionUserId, listCategories, listExpensesForDate } from "@/lib/data";
import { formatExpenseDate, getCurrentTimeInUserTimezone, getTodayInUserTimezone, shiftDate } from "@/lib/dates";
import { formatMinorUnits, sumMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const sp = await searchParams;
  const today = getTodayInUserTimezone();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : today;

  let categories;
  let rows;
  try {
    [categories, rows] = await Promise.all([listCategories(), listExpensesForDate(userId, date)]);
  } catch {
    return (
      <main className="p-6">
        <p role="alert">We couldn&apos;t load your expenses. Please refresh.</p>
      </main>
    );
  }

  const total = sumMoney(rows.map((r) => r.amount_minor));
  const byCat = new Map<string, number>();
  rows.forEach((r) => {
    const name = r.categories?.name ?? "Other";
    byCat.set(name, (byCat.get(name) ?? 0) + r.amount_minor);
  });
  const breakdown = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-4 flex items-center justify-between">
        <nav className="flex items-center gap-2" aria-label="Date navigation">
          <Link href={`/dashboard?date=${shiftDate(date, -1)}`} aria-label="Previous day" className="rounded-lg border px-3 py-2">&lt;</Link>
          <span className="font-medium">{date === today ? "Today" : formatExpenseDate(date)}</span>
          <Link href={`/dashboard?date=${shiftDate(date, 1)}`} aria-label="Next day" className="rounded-lg border px-3 py-2">&gt;</Link>
          {date !== today && <Link href="/dashboard" className="text-sm underline">Today</Link>}
        </nav>
        <form action={signOut}><button className="text-sm underline">Sign out</button></form>
      </header>
      <section className="rounded-2xl bg-slate-900 p-5 text-white">
        <p className="text-sm text-slate-300">Total spent</p>
        <p className="text-4xl font-semibold">{formatMinorUnits(total)}</p>
        <p className="text-sm text-slate-300">{rows.length} {rows.length === 1 ? "expense" : "expenses"}</p>
      </section>
      {breakdown.length > 0 && total > 0 && (
        <section className="mt-4 rounded-2xl bg-white p-4" aria-label="Category breakdown">
          {breakdown.map(([name, v]) => (
            <div key={name} className="mb-2">
              <div className="flex justify-between text-sm"><span>{name}</span><span>{formatMinorUnits(v)}</span></div>
              <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-600" style={{ width: `${Math.max(2, Math.round((v * 100) / total))}%` }} /></div>
            </div>
          ))}
        </section>
      )}
      <section className="mt-4" aria-label="Expenses">
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-slate-600">No expenses recorded {date === today ? "today" : "on this day"}.</p>
        ) : (
          <ul className="divide-y rounded-2xl bg-white">
            {rows.map((r) => {
              const title = r.merchant || r.description || r.categories?.name || "Expense";
              return (
                <li key={r.id} className="flex items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-slate-600">{r.categories?.name}{r.expense_time ? ` · ${String(r.expense_time).slice(0, 5)}` : ""}{r.payment_method ? ` · ${r.payment_method}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMinorUnits(r.amount_minor)}</p>
                    <DeleteButton id={r.id} label={`${formatMinorUnits(r.amount_minor)} ${r.categories?.name ?? ""}`} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <AddExpense categories={categories} defaultDate={date} defaultTime={getCurrentTimeInUserTimezone()} />
    </main>
  );
}
