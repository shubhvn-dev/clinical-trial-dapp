from fastapi import FastAPI
from pydantic import BaseModel

from contract_client import get_trial, get_patient, submit_consent_tx


app = FastAPI()


class ConsentRequest(BaseModel):
    trialId: int
    ipfsHash: str  # e.g. "ipfs://..."


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
