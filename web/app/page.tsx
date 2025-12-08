"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "./WalletProvider";

export default function LandingPage() {
  const router = useRouter();
  const { setWallet } = useWallet();
  const [value, setValue] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setWallet(trimmed);
    router.push("/trials");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Clinical Trial Portal</h1>
        <p className="text-sm text-slate-300">
          Enter your Sepolia wallet address to view trial matches, enrollment,
          and consent status.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="0x..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-md bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
