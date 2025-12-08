"use client";

import { createContext, useContext, useEffect, useState } from "react";

type WalletContextValue = {
  wallet: string | null;
  setWallet: (w: string | null) => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWalletState] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("wallet");
    if (stored) setWalletState(stored);
  }, []);

  const setWallet = (w: string | null) => {
    setWalletState(w);
    if (w) window.localStorage.setItem("wallet", w);
    else window.localStorage.removeItem("wallet");
  };

  return (
    <WalletContext.Provider value={{ wallet, setWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
