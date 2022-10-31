import { BlockEvent, Finding, HandleBlock, getEthersProvider, ethers } from "forta-agent";
import {
  ARBITRUM_L1_ESCROW,
  DAI_TOKEN_ABI,
  ETH_DAI_TOKEN,
  OPTIMISM_L1_ESCROW,
  getFindingL1,
  BOT_ID,
  Fetcher,
  API_URL,
  QUERY_API,
  HEADERS,
  //callFortaAPI
} from "./utils";

export function provideHandleBlock_L1(
  erc20Abi: any[],
  daiL1Address: string,
  provider: ethers.providers.JsonRpcProvider,
  optEscrowAddress: string,
  arbEscrowAddress: string,
  botId: string,
  //fetch: any
  apiUrl: string,
  headers: {},
  fetcher: Fetcher
): HandleBlock {
  const chainData: { l1EscrowAddress: string; chainId: string; chainName: string }[] = [
    {
      l1EscrowAddress: optEscrowAddress,
      chainId: "10",
      chainName: "Optimism",
    },
    {
      l1EscrowAddress: arbEscrowAddress,
      chainId: "42161",
      chainName: "Arbitrum",
    },
  ];
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    let currentBlockTimeStamp = blockEvent.block.timestamp.toString();
    currentBlockTimeStamp += "000";

    let daiL1Contract = new ethers.Contract(daiL1Address, erc20Abi, provider);
    for (let i = 0; i < chainData.length; i++) {
      let currData: { l1EscrowAddress: string; chainId: string; chainName: string } = chainData[i];
      let balanceEscrow = parseFloat(
        await daiL1Contract.balanceOf(currData.l1EscrowAddress, { blockTag: blockEvent.blockNumber })
      );
      let l2TotalSupply = (
        await fetcher.getL2Alert(apiUrl, QUERY_API(botId, currData.chainId, currentBlockTimeStamp), headers)
      )["currentTotalSupply"];
      
      //let l2TotalSupply = parseFloat(await callFortaAPI(fetch, botId, parseInt(currData.chainId)));
      if(l2TotalSupply != -1 && balanceEscrow < l2TotalSupply) {
        findings.push(
          getFindingL1(balanceEscrow.toString(), l2TotalSupply.toString(), currData.chainId, currData.chainName)
          );
      }
    }
    return findings;
  };
}
export default {
  handleBlock: provideHandleBlock_L1(
    DAI_TOKEN_ABI,
    ETH_DAI_TOKEN,
    getEthersProvider(),
    OPTIMISM_L1_ESCROW,
    ARBITRUM_L1_ESCROW,
    BOT_ID,
    //fetch
    API_URL,
    HEADERS,
    new Fetcher()
  ),
};
