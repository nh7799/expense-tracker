"use client";
import { FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/app/actions/expenses";
import { deleteExpense } from "@/app/actions/manage";
import { PAYMENT_METHODS } from "@/lib/validation/expense";

type Cat = { id: string; name: string };
const inp = "mt-1 w-full rounded-lg border p-3 text-base";

export function AddExpense({ categories, defaultDate, defaultTime }: { categories: Cat[]; defaultDate: string; defaultTime: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});
  const requestId = useRef(crypto.randomUUID());

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const payload = {
      clientRequestId: requestId.current,
      amount: String(f.get("amount") ?? ""),
      categoryId: String(f.get("categoryId") ?? ""),
      expenseDate: String(f.get("expenseDate") ?? ""),
      expenseTime: String(f.get("expenseTime") ?? ""),
      merchant: String(f.get("merchant") ?? ""),
      description: String(f.get("description") ?? ""),
      paymentMethod: String(f.get("paymentMethod") ?? ""),
    };
    setErr(null);
    setFields({});
    start(async () => {
      try {
        const r = await createExpense(payload);
        if (r.ok) {
          requestId.current = crypto.randomUUID();
          form.reset();
          setOpen(false);
          router.refresh();
        } else {
          setErr(r.error);
          setFields(r.fieldErrors ?? {});
        }
      } catch {
        setErr("Your expense was not saved. Please check your connection and try again.");
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-10 rounded-full bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg">+ Add Expense</button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Add expense" className="fixed inset-0 z-20 overflow-y-auto bg-white p-4">
          <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-4 pb-24">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add expense</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-2">Cancel</button>
            </div>
            <label className="text-sm">Amount (£)
              <input name="amount" inputMode="decimal" autoFocus required placeholder="0.00" className={`${inp} text-3xl font-semibold`} />
              {fields.amount && <span role="alert" className="text-red-700">{fields.amount[0]}</span>}
            </label>
            <fieldset>
              <legend className="text-sm">Category</legend>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <label key={c.id} className="cursor-pointer rounded-lg border p-3 text-sm has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50">
                    <input type="radio" name="categoryId" value={c.id} required className="sr-only" />{c.name}
                  </label>
                ))}
              </div>
              {fields.categoryId && <span role="alert" className="text-red-700">Choose a category</span>}
            </fieldset>
            <label className="text-sm">Merchant (optional)<input name="merchant" maxLength={100} className={inp} /></label>
            <label className="text-sm">Description (optional)<input name="description" maxLength={500} className={inp} /></label>
            <label className="text-sm">Payment method (optional)
              <select name="paymentMethod" className={inp} defaultValue=""><option value="">—</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">Date<input type="date" name="expenseDate" defaultValue={defaultDate} required className={inp} /></label>
              <label className="text-sm">Time<input type="time" name="expenseTime" defaultValue={defaultTime} className={inp} /></label>
            </div>
            {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{err}</p>}
            <button disabled={pending} className="rounded-lg bg-emerald-600 p-4 text-lg font-semibold text-white disabled:opacity-50">{pending ? "Saving..." : "Save Expense"}</button>
          </form>
        </div>
      )}
    </>
  );
}

export function DeleteButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete expense ${label}`}
      className="rounded px-2 py-1 text-sm text-red-700 underline disabled:opacity-50"
      onClick={() => {
        if (!confirm(`Delete this expense?\n\n${label}`)) return;
        start(async () => {
          const r = await deleteExpense(id);
          if (!r.ok) alert(r.error);
          else router.refresh();
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
