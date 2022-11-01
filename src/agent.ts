import { BlockEvent, Finding, HandleBlock, getEthersProvider, Initialize } from "forta-agent";
import { ethers } from "ethers";
import { NetworkManager } from "forta-agent-tools";
import provideHandleBlock_L1 from "./agentL1";
import provideHandleBlock_L2 from "./agentL2";

interface NetworkData {
  chainHandler: HandleBlock;
}

const data: Record<number, NetworkData> = {
  1: {
    chainHandler: provideHandleBlock_L1.handleBlock,
  },
  10: {
    chainHandler: provideHandleBlock_L2.handleBlock,
  },
  42161: {
    chainHandler: provideHandleBlock_L2.handleBlock,
  },
};

const networkManagerCurr = new NetworkManager(data);
export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleBlock = (networkManagerCurr: NetworkManager<NetworkData>): HandleBlock => {
  let handler: HandleBlock;
  const blockSwitcher = (blockEvent: BlockEvent): Promise<Finding[]> => {
    handler = networkManagerCurr.get("chainHandler");
    return handler(blockEvent);
  };
  return blockSwitcher;
};

export default {
  initialize: provideInitialize(networkManagerCurr, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManagerCurr),
};
