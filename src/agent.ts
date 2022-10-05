import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";
import { ethers } from "ethers";
import { asL2Provider } from "@eth-optimism/sdk";

export const ERC20_DEPOSIT_EVENT = "event ERC20DepositInitiated (address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _data)";
export const OPTIMISM_L1_DAI_BRIDGE = "0x10E6593CDda8c58a1d0f14C5164B376352a55f2F";
export const OPTIMISM_L1_ESCROW = "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65";
export const L1_DAI_TOKEN = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const OPTIMISM_L2_DAI_BRIDGE = "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65";
export const L1_ESCROW = "";
export const L2_DAI_TOKEN = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
export const L1_DAI_TOKEN_ABI = ["function balanceOf (address) public view returns (uint256)"];
export const L2_DAI_TOKEN_ABI = ["function totalSupply() view returns (uint256)"];

//{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
const provideHandleTransaction = () : HandleTransaction => {
  return async ( txEvent: TransactionEvent) : Promise<Finding[]> => {
  const findings: Finding[] = [];

  const depositTokenEvent = txEvent.filterLog(
    ERC20_DEPOSIT_EVENT,
    OPTIMISM_L1_DAI_BRIDGE
  );

  const provider = getEthersProvider();
  const daiL1Contract = new ethers.Contract(L1_DAI_TOKEN, L1_DAI_TOKEN_ABI, provider);
  //const l1SignerOrProvider =  new ethers.providers.JsonRpcProvider(process.env.L1URL);
  const l2Provider = asL2Provider(provider);
  //console.log(provider);
  //console.log(l2Provider);
  const daiL2Contract = new ethers.Contract(L2_DAI_TOKEN, L2_DAI_TOKEN_ABI, l2Provider);
  //console.log(daiL2Contract);
  //depositTokenEvent.forEach((transferEvent) => {
  for (const deposit of depositTokenEvent) {
    const balanceL2DAI =  daiL2Contract.totalSupply();
    const balanceL1Escrow = await daiL1Contract.balanceOf(OPTIMISM_L1_ESCROW)
    console.log( balanceL2DAI);
    console.log(balanceL1Escrow);
    if (balanceL1Escrow >= 0) {
      findings.push(
        Finding.fromObject({
          name: "Violation",
          description: "L1DAI.balanceOf(L1Escrow) ≥ L2DAI.totalSupply() is violated",
          alertId: "OPTIMISM-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
          },
        })
      );
    }
  }

  return findings;
};
};

export default {
  handleTransaction: provideHandleTransaction(),
};
