"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useWallet } from "../WalletProvider";

const API_BASE = "http://localhost:8000";

type Trial = {
  id: number;
  name: string;
  description: string;
  sponsor: string;
  totalBudgetWei: string;
  active: boolean;
};

export default function TrialsPage() {
  const router = useRouter();
  const { wallet } = useWallet();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) {
      router.push("/");
      return;
    }
    const fetchTrials = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get<Trial[]>(`${API_BASE}/trials`);
        setTrials(res.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load trials");
      } finally {
        setLoading(false);
      }
    };
    fetchTrials();
  }, [wallet, router]);

  const formatEth = (wei: string) => {
    const asNum = Number(wei);
    if (!Number.isFinite(asNum)) return wei;
    return (asNum / 1e18).toFixed(4);
  };

  if (!wallet) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center p-8">
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Available Trials</h1>
          <div className="text-xs text-slate-300">
            Wallet: <span className="font-mono">{wallet}</span>
          </div>
        </header>

        {loading && <p>Loading trials...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="space-y-3">
          {trials.map((t) => (
            <button
              key={t.id}
              onClick={() => router.push(`/trials/${t.id}`)}
              className="w-full text-left rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-sky-600"
            >
              <p className="text-lg font-medium">{t.name}</p>
              <p className="text-sm text-slate-300">{t.description}</p>
              <p className="mt-1 text-xs text-slate-400">
                Sponsor: {t.sponsor.slice(0, 10)}...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Budget: {formatEth(t.totalBudgetWei)} ETH · Active:{" "}
                {t.active ? "Yes" : "No"}
              </p>
            </button>
          ))}
          {!loading && trials.length === 0 && (
            <p className="text-sm text-slate-300">No trials configured.</p>
          )}
        </div>
      </div>
    </main>
  );
}
