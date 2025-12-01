import os
from brownie import ClinicalTrialManager, accounts

def main():
    private_key = os.getenv("PRIVATE_KEY")
    if not private_key:
        raise Exception("PRIVATE_KEY env var not set")

    deployer = accounts.add(private_key)
    ct = ClinicalTrialManager.deploy({"from": deployer})
    print("ClinicalTrialManager deployed at:", ct.address)
