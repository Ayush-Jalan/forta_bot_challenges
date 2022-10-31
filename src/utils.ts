import axios from "axios";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { createAddress } from "forta-agent-tools";
import { utils } from "ethers";

export const ERC20_DEPOSIT_EVENT =
  "event ERC20DepositInitiated (address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _data)";
export const OPTIMISM_L1_ESCROW = "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65";
export const ETH_DAI_TOKEN = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const L2_DAI_BRIDGE = "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65";
export const L2_DAI_TOKEN = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
export const DAI_TOKEN_ABI = [
  "function balanceOf (address) public view returns (uint256)",
  "function totalSupply() view returns (uint)",
];
export const ARBITRUM_L1_ESCROW = "0xA10c7CE4b876998858b1a9E12b10092229539400";
export const API_URL = "https://api.forta.network/graphql";
export const BOT_ID = "0x6d342d82497570c316f8d409b970e6b48619dc445029638b6c55bd79ee488037";
export const INITIAL_PREV_SUPPLY_FOR_L2 = 0;

export const MOCK_FETCHER_DATA = "123";
export const MOCK_DAI_L1_ADD = createAddress("0x123");
export const MOCK_DAI_L2_ADD = createAddress("0x456");
export const MOCK_ESCROW_ADD = createAddress("0x789");
export const iface: utils.Interface = new utils.Interface(DAI_TOKEN_ABI);
export const FIRST_TEST_BLOCK_NUMBER = 9;
export const L2_SUPPLY_ARR: number[] = [150, 300];
export const ESCROW_BALANCES_ARR: number[] = [200, 250];
export const MOCK_L1_FINDING = (l1EscrowBalance: string, totalSupply: string, chainName: string): Finding => {
  return Finding.fromObject({
    name: "DAI L1-L2 supply detector",
    description: "Total Supply for DAI token on " + chainName + " is more than balance of L1 Escrow account",
    alertId: "L1-L2_DAI_SUPPLY_IMBALANCE",
    severity: FindingSeverity.High,
    type: FindingType.Exploit,
    protocol: "MakerDAO",
    metadata: {
      balanceOfEscrow: l1EscrowBalance,
      totalSupplyOfL2: totalSupply,
      L2Chain: chainName,
    },
  });
};

export const QUERY_API = (botId: string, chainId: string, endTimestamp: string) => {
  let ret: string =
    `query recentAlerts {
    alerts(
      input: {
        first: 1
        blockSortDirection: desc,
        blockTimestampRange: {
          startTimestamp: 1
          endTimestamp: ` +
    endTimestamp +
    `},
        bots: [
          "`;
  ret = ret + botId;
  ret =
    ret +
    `"
    ]
  chainId: `;
  ret = ret + chainId;
  ret =
    ret +
    `}
  ) {
    pageInfo {
      hasNextPage
    }
    alerts {
      createdAt
      name
      protocol
      metadata
    }
  }
}
`;
  return ret;
};

export class Fetcher {
  getL2Alert(apiUrl: string, querySent: string, headers: {}) {
    async function func(apiUrl: string, querySent: string, headers: {}) {
      const resp = await axios.post(
        apiUrl,
        {
          query: querySent,
        },
        {
          headers: headers,
        }
      );

      const alerts: [] = resp["data"]["data"]["alerts"]["alerts"];
      if (alerts.length === 0) return { currentTotalSupply: -1 };
      return resp["data"]["data"]["alerts"]["alerts"][0]["metadata"];
    }
    return func(apiUrl, querySent, headers);
  }
}


export const HEADERS: {} = {
  "content-type": "application/json",
};


export const callFortaAPI = async (fetch: any, botId: string, chainId?: number) => {
  const headers = {
    "content-type": "application/json",
  };
  const graphqlQuery = {
    operationName: "recentAlerts",
    query: `query recentAlerts($input: AlertsInput) {
        alerts(input: $input) {
          alerts {
            createdAt
            name
            alertId
            protocol
            findingType
            source {
              transactionHash
              block {
                number
                chainId
              }
              bot {
                id
              }
            }
            severity
            metadata
            scanNodeCount
          }
        }
      }`,
    variables: {
      input: {
        bots: [botId],
        chainId: chainId,
      },
    },
  };
  const options = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(graphqlQuery),
  };
  try {
    const response = await fetch(API_URL, options);
    const data = await response.json();
    const findingObject: Finding = data["data"]["alerts"]["alerts"][0];
    return findingObject.metadata.currentSupply;
  } catch (err) {
    throw new Error("Error During Calling External FORTA API");
  }
};

export const getFindingL2 = (prevSupply: string, totalSupply: string) => {
  return Finding.fromObject({
    name: "DAI supply update",
    description: "Returns total supply of DAI token",
    alertId: "L2_DAI",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "MakerDAO",
    metadata: {
      prevTotalSupply: prevSupply,
      currentTotalSupply: totalSupply,
    },
  });
};

export const getFindingL1 = (l1EscrowBalance: string, totalSupply: string, chainId: string, chainName: string) => {
  return Finding.fromObject({
    name: "DAI L1-L2 supply detector",
    description: "Total Supply for DAI token on " + chainName + " is more than balance of L1 Escrow account",
    alertId: "L1-L2_DAI_SUPPLY_IMBALANCE",
    severity: FindingSeverity.High,
    type: FindingType.Exploit,
    protocol: "MakerDAO",
    metadata: {
      balanceOfEscrow: l1EscrowBalance,
      totalSupplyOfL2: totalSupply,
      L2Chain: chainName,
    },
  });
};
