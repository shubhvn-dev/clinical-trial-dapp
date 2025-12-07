import os
import json
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

SEPOLIA_RPC_URL = os.getenv("SEPOLIA_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS") or "0x863CB333b301b70e1F2baD79aE1A498AAAfc337f"

if not SEPOLIA_RPC_URL or not PRIVATE_KEY:
    raise RuntimeError("SEPOLIA_RPC_URL or PRIVATE_KEY missing")

w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)
wallet = account.address

abi_path = Path("build/contracts/ClinicalTrialManager.json")
with abi_path.open() as f:
    abi = json.load(f)["abi"]

ct = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)


def send_tx(fn):
    nonce = w3.eth.get_transaction_count(wallet)
    tx = fn.build_transaction(
        {
            "from": wallet,
            "nonce": nonce,
            "gas": 500000,
            "maxFeePerGas": w3.to_wei("1", "gwei"),
            "maxPriorityFeePerGas": w3.to_wei("1", "gwei"),
        }
    )
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print("Tx:", tx_hash.hex(), "Status:", receipt.status)
    return receipt


def main():
    # 1) Create trial 0
    send_tx(ct.functions.createTrial("Demo Trial", "Test", 10**18))


def seed_rest():
    # 2) Enroll deployer as patient
    send_tx(ct.functions.enrollPatient(wallet, 0, 90))

    # 3) Submit consent
    send_tx(ct.functions.submitConsent(0, "ipfs://demoConsentHash"))


if __name__ == "__main__":
    # Use ONE of these at a time.
    # First run (if trial not created yet):
    # main()

    # Subsequent run to add patient + consent:
    seed_rest()