from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from contract_client import get_trial, get_patient, submit_consent_tx
from ai_client import match_patient_to_trial


app = FastAPI()

# CORS so Next.js on 3000 can call FastAPI on 8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConsentRequest(BaseModel):
    trialId: int
    ipfsHash: str  # e.g. "ipfs://..."


class MatchRequest(BaseModel):
    medicalHistory: str
    trialCriteria: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/trials/{trial_id}")
def read_trial(trial_id: int):
    t = get_trial(trial_id)
    return {
        "id": t[0],
        "name": t[1],
        "description": t[2],
        "sponsor": t[3],
        "totalBudgetWei": str(t[4]),
        "active": t[5],
    }


@app.get("/patients/{wallet}")
def read_patient(wallet: str):
    p = get_patient(wallet)
    return {
        "wallet": p[0],
        "enrolledTrialId": p[1],
        "eligibilityScore": p[2],
        "consented": p[3],
        "consentIPFS": p[4],
    }


@app.post("/consent/sign")
def sign_consent(body: ConsentRequest):
    tx_hash, status = submit_consent_tx(body.trialId, body.ipfsHash)
    return {"txHash": tx_hash, "status": status}


@app.post("/match")
def match(body: MatchRequest):
    result = match_patient_to_trial(body.medicalHistory, body.trialCriteria)
    return result
