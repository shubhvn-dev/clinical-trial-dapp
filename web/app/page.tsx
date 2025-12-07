"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";

type Trial = {
  id: number;
  name: string;
  description: string;
  sponsor: string;
  totalBudgetWei: string;
  active: boolean;
};

type Patient = {
  wallet: string;
  enrolledTrialId: number;
  eligibilityScore: number;
  consented: boolean;
  consentIPFS: string;
};

type MatchResult = {
  eligible: boolean;
  score: number;
  reasons: string[];
};

const DEFAULT_WALLET = "0xA4351822825Ec89112B4d4f5CB95AA134e001F21";
const TRIAL_CRITERIA = "Stage I-III cancer trial, ECOG 0-1, age 18+";

export default function HomePage() {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [wallet, setWallet] = useState(DEFAULT_WALLET);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadingTrial, setLoadingTrial] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [medicalHistory, setMedicalHistory] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Load trial 0 on mount
  useEffect(() => {
    const fetchTrial = async () => {
      try {
        setLoadingTrial(true);
        setMessage(null);
        const res = await axios.get<Trial>(`${API_BASE}/trials/0`);
        setTrial(res.data);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load trial");
      } finally {
        setLoadingTrial(false);
      }
    };
    fetchTrial();
  }, []);

  const loadPatient = async () => {
    try {
      setLoadingPatient(true);
      const res = await axios.get<Patient>(`${API_BASE}/patients/${wallet}`);
      setPatient(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load patient");
      setPatient(null);
    } finally {
      setLoadingPatient(false);
    }
  };
  

  const signConsent = async () => {
    try {
      setConsentLoading(true);
      setMessage(null);
      await axios.post(`${API_BASE}/consent/sign`, {
        trialId: 0,
        ipfsHash: "ipfs://demoConsentHash-from-ui",
      });
      console.log("consent OK");
      setMessage("Consent transaction sent successfully");
      await loadPatient();
    } catch (err) {
      console.error(err);
      setMessage("Failed to sign consent");
    } finally {
      setConsentLoading(false);
    }
  };

  const runMatch = async () => {
    try {
      setMatchLoading(true);
      setMatchResult(null);
  
      const res = await axios.post<MatchResult>(`${API_BASE}/match`, {
        medicalHistory,
        trialCriteria: TRIAL_CRITERIA,
      });
  
      setMatchResult(res.data);
      setMessage("AI match completed successfully");
    } catch (err) {
      console.error(err);
      setMessage("Failed to run AI match");
    } finally {
      setMatchLoading(false);
    }
  };

  const formatEth = (wei: string) => {
    const asNum = Number(wei);
    if (!Number.isFinite(asNum)) return wei;
    return (asNum / 1e18).toFixed(4);
  };

  const toastText = message || "Ready. Click actions to see status updates here.";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center p-8">
      <div className="w-full max-w-3xl space-y-8">
        <h1 className="text-2xl font-semibold">Clinical Trial Dashboard</h1>

        {/* Trial card */}
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2">
          <h2 className="text-xl font-medium">Trial</h2>
          {loadingTrial && <p>Loading trial...</p>}
          {trial && (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold">ID:</span> {trial.id}
              </p>
              <p>
                <span className="font-semibold">Name:</span> {trial.name}
              </p>
              <p>
                <span className="font-semibold">Description:</span>{" "}
                {trial.description}
              </p>
              <p>
                <span className="font-semibold">Sponsor:</span>{" "}
                {trial.sponsor}
              </p>
              <p>
                <span className="font-semibold">Budget:</span>{" "}
                {formatEth(trial.totalBudgetWei)} ETH
              </p>
              <p>
                <span className="font-semibold">Active:</span>{" "}
                {trial.active ? "Yes" : "No"}
              </p>
            </div>
          )}
        </section>

        {/* Patient card */}
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
          <h2 className="text-xl font-medium">Patient</h2>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
            />
            <button
              onClick={loadPatient}
              disabled={loadingPatient}
              className="rounded-md bg-sky-600 px-3 py-1 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
            >
              {loadingPatient ? "Loading..." : "Load"}
            </button>
          </div>

          {patient && (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold">Wallet:</span>{" "}
                {patient.wallet}
              </p>
              <p>
                <span className="font-semibold">Enrolled trial ID:</span>{" "}
                {patient.enrolledTrialId}
              </p>
              <p>
                <span className="font-semibold">Eligibility score:</span>{" "}
                {patient.eligibilityScore}
              </p>
              <p>
                <span className="font-semibold">Consented:</span>{" "}
                {patient.consented ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold">Consent IPFS:</span>{" "}
                {patient.consentIPFS || "-"}
              </p>
            </div>
          )}

          <button
            onClick={signConsent}
            disabled={consentLoading}
            className="mt-2 rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            {consentLoading ? "Signing..." : "Sign consent (demo)"}
          </button>
        </section>

        {/* AI Match card */}
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
          <h2 className="text-xl font-medium">AI Match (Gemini)</h2>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">Trial criteria (fixed for demo):</p>
            <p className="text-slate-300">{TRIAL_CRITERIA}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold">
              Patient medical history
            </label>
            <textarea
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm min-h-[80px]"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g. Stage II cancer, ECOG 1, prior therapy..."
            />
          </div>

          <button
            onClick={runMatch}
            disabled={matchLoading || !medicalHistory.trim()}
            className="rounded-md bg-purple-600 px-3 py-1 text-sm font-medium hover:bg-purple-500 disabled:opacity-50"
          >
            {matchLoading ? "Running..." : "Run AI match"}
          </button>

          {matchResult && (
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="font-semibold">Eligible:</span>{" "}
                {matchResult.eligible ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold">Score:</span>{" "}
                {matchResult.score}
              </p>
              <div>
                <p className="font-semibold">Reasons:</p>
                <ul className="list-disc list-inside text-slate-300">
                  {matchResult.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Always-visible status toast */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-md w-[90%]">
        <div className="rounded-md border border-sky-500 bg-sky-900/90 px-4 py-3 text-sm text-sky-50 shadow-lg">
          {toastText}
        </div>
      </div>
    </main>
  );
}
