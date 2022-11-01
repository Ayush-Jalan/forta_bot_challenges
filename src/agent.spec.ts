import { BlockEvent, HandleBlock } from "forta-agent";
import { MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/test";
import { provideHandleBlock_L1 } from "./agentL1";
import {
  API_URL,
  DAI_TOKEN_ABI,
  HEADERS,
  getFindingL1,
  iface,
  ESCROW_BALANCES_ARR,
  MOCK_DAI_L1_ADD,
  MOCK_OPT_ESCROW_ADD,
  MOCK_ARB_ESCROW_ADD,
  MOCK_FETCHER_DATA,
  BOT_ID,
} from "./utils";
import { ethers } from "ethers";

describe("DAI bridged balance checker bot tests", () => {
  let mockProviderL1 = new MockEthersProvider();

  const mockFetcher = {
    getL2Alert: jest.fn(() => Promise.resolve({ currentTotalSupply: MOCK_FETCHER_DATA })),
  };
  let handleBlock_l1: HandleBlock = provideHandleBlock_L1(
    DAI_TOKEN_ABI,
    MOCK_DAI_L1_ADD,
    mockProviderL1 as unknown as ethers.providers.JsonRpcProvider,
    MOCK_OPT_ESCROW_ADD,
    MOCK_ARB_ESCROW_ADD,
    BOT_ID,
    API_URL,
    HEADERS,
    mockFetcher
  );

  it("returns a finding on L1 when the totalSupply on L2 is MORE than escrow balance for Arbitrium only", async () => {
    const TEST_BLOCK_NUMBER = 10;
    const TEST_BLOCK_TIMESTAMP = 16523773880;

    mockProviderL1
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "balanceOf", {
        inputs: [MOCK_OPT_ESCROW_ADD],
        outputs: [ESCROW_BALANCES_ARR[0]], 
      })
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "balanceOf", {
        inputs: [MOCK_ARB_ESCROW_ADD],
        outputs: [ESCROW_BALANCES_ARR[1]], 
      })
      .setLatestBlock(TEST_BLOCK_NUMBER);

    mockProviderL1.setNetwork(1001);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(TEST_BLOCK_NUMBER).setTimestamp(TEST_BLOCK_TIMESTAMP);
    console.log(await handleBlock_l1(blockEvent));
    expect(await handleBlock_l1(blockEvent)).toStrictEqual([getFindingL1("250", "320", "42161", "Arbitrum")]);
    expect(mockFetcher.getL2Alert).toHaveBeenCalled();
  });

  it("returns a finding on L1 when the totalSupply on L2 is MORE than escrow balance for Optimism only", async () => {
    const TEST_BLOCK_NUMBER = 10;
    const TEST_BLOCK_TIMESTAMP = 16523773880;

    mockProviderL1
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
    console.log(await handleBlock_l1(blockEvent));
    expect(await handleBlock_l1(blockEvent)).toStrictEqual([getFindingL1("250", "320", "10", "Optimism")]);
    expect(mockFetcher.getL2Alert).toHaveBeenCalled();
  });

  it("returns two findings on L1 when the totalSupply on L2 is MORE than escrow balance for both Optimism and Arbitrum", async () => {
    const TEST_BLOCK_NUMBER = 10;
    const TEST_BLOCK_TIMESTAMP = 16523773880;

    // mockProvider_l2 currently returns totalSupply of l2 as 456
    mockProviderL1
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "balanceOf", {
        inputs: [MOCK_OPT_ESCROW_ADD],
        outputs: [ESCROW_BALANCES_ARR[1]], 
      })
      .addCallTo(MOCK_DAI_L1_ADD, TEST_BLOCK_NUMBER, iface, "balanceOf", {
        inputs: [MOCK_ARB_ESCROW_ADD],
        outputs: [ESCROW_BALANCES_ARR[1]], 
      })
      .setLatestBlock(TEST_BLOCK_NUMBER);

    mockProviderL1.setNetwork(1001);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(TEST_BLOCK_NUMBER).setTimestamp(TEST_BLOCK_TIMESTAMP);
    expect(await handleBlock_l1(blockEvent)).toStrictEqual([
      getFindingL1("250", "320", "10", "Optimism"),
      getFindingL1("250", "320", "42161", "Arbitrum"),
    ]);
    expect(mockFetcher.getL2Alert).toHaveBeenCalled();
  });
});
