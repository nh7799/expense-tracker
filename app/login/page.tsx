"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, signUpWithPassword } from "@/app/actions/auth";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    const result = mode === "in" ? await signInWithPassword(email, password) : await signUpWithPassword(email, password);
    setBusy(false);
    if (!result.ok) return setMsg(result.error);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <p className="text-sm text-slate-600">Track daily spending in pounds and pence.</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm">Email<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border p-3 text-base" /></label>
        <label className="text-sm">Password<input name="password" type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} className="mt-1 w-full rounded-lg border p-3 text-base" /></label>
        {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
        <button disabled={busy} className="rounded-lg bg-slate-900 p-3 font-medium text-white disabled:opacity-50">{busy ? "Please wait..." : mode === "in" ? "Sign in" : "Sign up"}</button>
      </form>
      <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} className="text-sm underline">{mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}</button>
    </main>
  );
}
