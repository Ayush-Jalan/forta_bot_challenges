import { BlockEvent, HandleBlock } from "forta-agent";
import { MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/test";
import { provideHandleBlock_L1 } from "./agentL1";
import { ethers } from "ethers";
import {
  DAI_TOKEN_ABI,
  L2_SUPPLY_ARR,
  ESCROW_BALANCES_ARR,
  iface,
  MOCK_DAI_L1_ADD,
  ETH_DAI_TOKEN,
  MOCK_ARB_ESCROW_ADD,
  MOCK_OPT_ESCROW_ADD,
  API_URL,
  BOT_ID,
  getFindingL1,
  MOCK_FETCHER_DATA,
  HEADERS,
  MOCK_DAI_L2_ADD
} from "./utils";
//import fetch from "node-fetch";

describe("DAI bridge balance", () => {
  let mockProviderL1 = new MockEthersProvider();
  const mockFetcher = {
    getL2Alert: jest.fn(() => Promise.resolve({ currentTotalSupply: MOCK_FETCHER_DATA })),
  };
  let handleBlockL1: HandleBlock = provideHandleBlock_L1(
    DAI_TOKEN_ABI,
    ETH_DAI_TOKEN,
    mockProviderL1 as unknown as ethers.providers.JsonRpcProvider,
    MOCK_OPT_ESCROW_ADD,
    MOCK_ARB_ESCROW_ADD,
    BOT_ID,
    //fetch
    API_URL,
    HEADERS,
    mockFetcher
  );

  it("doesn't return a finding on L1 when the total supply on L2 is less than L1 escrow balance", async () => {
    const TEST_BLOCK_NUMBER = 10;
    const TEST_BLOCK_TIMESTAMP = 16523773880;

    mockProviderL1
      .addCallTo(MOCK_DAI_L2_ADD, TEST_BLOCK_NUMBER, iface, "totalSupply", {
        inputs: [],
        outputs: [L2_SUPPLY_ARR[0]],
      })
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "balanceOf", {
        inputs: [MOCK_OPT_ESCROW_ADD],
        outputs: [ESCROW_BALANCES_ARR[0]],
      })
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "balanceOf", {
        inputs: [MOCK_ARB_ESCROW_ADD],
        outputs: [ESCROW_BALANCES_ARR[0]],
      })
      .setLatestBlock(TEST_BLOCK_NUMBER);

    mockProviderL1.setNetwork(1001);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(TEST_BLOCK_NUMBER).setTimestamp(TEST_BLOCK_TIMESTAMP);
    console.log(await handleBlockL1(blockEvent));
    expect(await handleBlockL1(blockEvent)).toStrictEqual([]);
    expect(mockFetcher.getL2Alert).toHaveBeenCalled();
  });

  it("returns a finding on L1 when total supply on L2 is more than L1 escrow balance", async () => {
    const TEST_BLOCK_NUMBER = 10;
    const TEST_BLOCK_TIMESTAMP = 16523773880;

    mockProviderL1
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "totalSupply", {
        inputs: [],
        outputs: [L2_SUPPLY_ARR[1]],
      })
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "balanceOf", {
        inputs: [MOCK_OPT_ESCROW_ADD],
        outputs: [ESCROW_BALANCES_ARR[1]],
      })
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "balanceOf", {
        inputs: [MOCK_ARB_ESCROW_ADD],
        outputs: [ESCROW_BALANCES_ARR[0]],
      })
      .setLatestBlock(TEST_BLOCK_NUMBER);

    mockProviderL1.setNetwork(1001);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(TEST_BLOCK_NUMBER).setTimestamp(TEST_BLOCK_TIMESTAMP);
    expect(await handleBlockL1(blockEvent)).toStrictEqual([
      getFindingL1(ESCROW_BALANCES_ARR[1].toString(), L2_SUPPLY_ARR[1].toString(), "10", "Optimism"),
    ]);
    expect(mockFetcher.getL2Alert).toHaveBeenCalled();
  });
});
