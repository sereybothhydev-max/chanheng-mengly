"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ornament } from "@/components/Ornament";
import { WEDDING } from "@/lib/config";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.refresh(); // server re-renders /admin, now showing the dashboard
    } else {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error ?? "ចូលមិនបានសម្រេច។");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <form onSubmit={submit} className="glass-card w-full max-w-sm animate-fade-up rounded-[2rem] p-8 text-center">
        <p className="eyebrow">សម្រាប់គូស្វាមីភរិយា</p>
        <h1 className="mt-3 font-moul text-3xl leading-[1.6]">
          <span className="text-gold">{WEDDING.coupleNames}</span>
        </h1>
        <Ornament className="mx-auto mt-4 h-4 w-32 text-gold-300" />

        <label className="mt-6 block text-left">
          <span className="eyebrow">ពាក្យសម្ងាត់</span>
          <input
            type="password"
            className="field mt-1.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>

        {error && (
          <p className="mt-3 text-sm text-[#9a4b3c]" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-gold mt-6 w-full" disabled={busy || !password}>
          {busy ? "កំពុងពិនិត្យ…" : "បើកផ្ទាំងគ្រប់គ្រង"}
        </button>
      </form>
    </main>
  );
}
