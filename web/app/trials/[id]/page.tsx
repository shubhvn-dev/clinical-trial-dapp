"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { useWallet } from "../../WalletProvider";

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

const TRIAL_CRITERIA = "Stage I-III cancer trial, ECOG 0-1, age 18+";

export default function TrialDetailPage() {
  const params = useParams<{ id: string }>();
  const trialId = Number(params.id);
  const { wallet } = useWallet();

  const [trial, setTrial] = useState<Trial | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadingTrial, setLoadingTrial] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;
    const fetchTrial = async () => {
      try {
        setLoadingTrial(true);
        const res = await axios.get<Trial>(`${API_BASE}/trials/${trialId}`);
        setTrial(res.data);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load trial");
      } finally {
        setLoadingTrial(false);
      }
    };
    fetchTrial();
  }, [trialId, wallet]);

  const loadPatient = async () => {
    if (!wallet) return;
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
    if (!wallet) return;
    try {
      setConsentLoading(true);
      setMessage(null);
      await axios.post(`${API_BASE}/consent/sign`, {
        trialId,
        ipfsHash: "ipfs://demoConsentHash-from-ui",
      });
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

  if (!wallet) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-sm">No wallet set. Go back to the home page.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center p-8">
      <div className="w-full max-w-3xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Trial {trialId} detail &amp; enrollment
          </h1>
          <div className="text-xs text-slate-300">
            Wallet: <span className="font-mono">{wallet}</span>
          </div>
        </header>

        {/* Trial card */}
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2">
          <h2 className="text-xl font-medium">Trial</h2>
          {loadingTrial && <p>Loading trial...</p>}
          {trial && (
            <div className="space-y-1 text-sm">
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
          <h2 className="text-xl font-medium">Patient status</h2>

          <button
            onClick={loadPatient}
            disabled={loadingPatient}
            className="rounded-md bg-sky-600 px-3 py-1 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {loadingPatient ? "Loading..." : "Load patient for this wallet"}
          </button>

          {patient && (
            <div className="space-y-1 text-sm">
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
          <h2 className="text-xl font-medium">AI Match</h2>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">Trial criteria (demo):</p>
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

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-md w-[90%]">
        <div className="rounded-md border border-sky-500 bg-sky-900/90 px-4 py-3 text-sm text-sky-50 shadow-lg">
          {message || "Ready. Actions will show status here."}
        </div>
      </div>
    </main>
  );
}
