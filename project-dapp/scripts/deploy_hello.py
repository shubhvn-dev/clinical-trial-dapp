import os
from brownie import HelloTrial, accounts


def main():
    private_key = os.getenv("PRIVATE_KEY")
    if not private_key:
        raise Exception("PRIVATE_KEY env var not set")

    account = accounts.add(private_key)
    tx = HelloTrial.deploy("Hello, Clinical Trial!", {"from": account})
    print("Deployed HelloTrial at:", tx.address)
