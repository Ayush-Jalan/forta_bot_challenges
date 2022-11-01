import { BlockEvent, HandleBlock } from "forta-agent";
import { MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/test";
import { provideHandleBlock_L2 } from "./agentL2";
import { ethers } from "ethers";
import {
  DAI_TOKEN_ABI,
  getFindingL2,
  L2_DAI_TOKEN,
  L2_SUPPLY_ARR,
  FIRST_TEST_BLOCK_NUMBER,
  iface,
  MOCK_DAI_L2_ADD,
} from "./utils";

describe("DAI bridge balance", () => {
  let mockProviderL2 = new MockEthersProvider();

  let handleBlockL2: HandleBlock = provideHandleBlock_L2(
    DAI_TOKEN_ABI,
    L2_DAI_TOKEN,
    mockProviderL2 as unknown as ethers.providers.JsonRpcProvider
  );

  it("doesn't return a finding on L2 when the total supply doesn't change", async () => {
    const TEST_BLOCK_NUMBER = 10;
    mockProviderL2
      .addCallTo(MOCK_DAI_L2_ADD, TEST_BLOCK_NUMBER, iface, "totalSupply", {
        inputs: [],
        outputs: [L2_SUPPLY_ARR[0]],
      })
      .setLatestBlock(FIRST_TEST_BLOCK_NUMBER);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(TEST_BLOCK_NUMBER);
    expect(await handleBlockL2(blockEvent)).toStrictEqual([]);
  });

  it.only("returns a finding when total supply of L2 changes", async () => {
    const TEST_BLOCK_NUMBER = 10;
    mockProviderL2
      .addCallTo(MOCK_DAI_L2_ADD, TEST_BLOCK_NUMBER, iface, "totalSupply", {
        inputs: [],
        outputs: [L2_SUPPLY_ARR[1]],
      })
      .setLatestBlock(TEST_BLOCK_NUMBER);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(TEST_BLOCK_NUMBER);
    expect(await handleBlockL2(blockEvent)).toStrictEqual([
      getFindingL2(L2_SUPPLY_ARR[0].toString(), L2_SUPPLY_ARR[1].toString()),
    ]);
  });
});
