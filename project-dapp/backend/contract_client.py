# contract_client.py

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

SEPOLIA_RPC_URL = os.getenv("SEPOLIA_RPC_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

if not SEPOLIA_RPC_URL or not CONTRACT_ADDRESS:
    raise RuntimeError("SEPOLIA_RPC_URL or CONTRACT_ADDRESS missing")

w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))

ABI_PATH = Path("../build/contracts/ClinicalTrialManager.json")
with ABI_PATH.open() as f:
    contract_json = json.load(f)
    abi = contract_json["abi"]

contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=abi,
)

backend_account = None
if PRIVATE_KEY:
    backend_account = w3.eth.account.from_key(PRIVATE_KEY)


def get_trial(trial_id: int):
    return contract.functions.trials(trial_id).call()


def get_patient(wallet: str):
    return contract.functions.patients(
        Web3.to_checksum_address(wallet)
    ).call()


def submit_consent_tx(trial_id: int, ipfs_hash: str):
    if backend_account is None:
        raise RuntimeError("PRIVATE_KEY not set for backend signer")

    wallet = backend_account.address
    nonce = w3.eth.get_transaction_count(wallet)

    tx = contract.functions.submitConsent(trial_id, ipfs_hash).build_transaction(
        {
            "from": wallet,
            "nonce": nonce,
            "gas": 300000,
            "maxFeePerGas": w3.to_wei("1", "gwei"),
            "maxPriorityFeePerGas": w3.to_wei("1", "gwei"),
        }
    )
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash.hex(), receipt.status
