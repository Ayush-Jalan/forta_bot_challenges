# Large Tether Transfer Agent

## Description

This bot checks for the invariant if the total supply of DAI on L2 chain is more than the DAI deposited for L2's escrow account on L1 chain.

## Supported Chains

- Ethereum
- Arbitrum
- Optimism

## Alerts

Describe each of the type of alerts fired by this agent

- L2_DAI_SUPPlY
  - Fired when the total supply of DAI token on L2 chain is updated
  - Severity is always set to "low" 
  - Type is always set to "info" 
  - Metadata contains:
    - prevTotalSupply : previous total supply of DAI on L2
    - currentTotalSupply : current total supply of DAI on L2

- L1-L2_DAI_SUPPLY_IMBALANCE
  - Fired when the total supply of DAI token on L2 chain is mnore than balance of escrow account on L1
  - Severity is always set to "High" 
  - Type is always set to "Exploit" 
  - Metadata contains:
    - balanceOfEscrow : balance of DAI on L1 escrow account
    - totalSupplyOfL2 : total supply of DAI on L2 chain
    - L2Chain : L2 chain name

## Test Data

The bot can be tested by deploying, since it works on multiple chains
