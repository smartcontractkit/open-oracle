import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as UniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import {
  UniswapAnchoredView__factory,
  UniswapAnchoredView,
  UniswapV3SwapHelper__factory,
  UniswapV3SwapHelper,
  MockV3Aggregator__factory,
  MockV3Aggregator,
} from "../types";
import { WETH9 } from "typechain-common-abi/types/contract-types/ethers";
import { address, uint, keccak256, getWeth9, resetFork } from "./utils";
import { TokenConfig } from "./utils/TokenConfig";

const BigNumber = ethers.BigNumber;
type BigNumber = ReturnType<typeof BigNumber.from>;

// @notice UniswapAnchoredView `validate` test
// Based on price data from Coingecko and Uniswap token pairs
// at block 13152450 (2021-09-03 11:23:34 UTC)
interface TestTokenPair {
  pair: Contract;
  feed: MockV3Aggregator;
}

type TestTokenPairs = {
  [key: string]: TestTokenPair;
};

async function setupTokenPairs(
  deployer: SignerWithAddress
): Promise<TestTokenPairs> {
  // Reversed market for ETH, read value of ETH in USDC
  // USDC/ETH V3 pool (highest liquidity/highest fee) from mainnet
  const usdc_eth_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
  );
  const usdc_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  // DAI/ETH V3 pool from mainnet
  const dai_eth_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8"
  );
  const dai_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  // REPv2 V3 pool from mainnet
  const rep_eth_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0xb055103b7633b61518cd806d95beeb2d4cd217e7"
  );
  const rep_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  // Initialize BAT pair with values from mainnet
  const bat_eth_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0xAE614a7a56cB79c04Df2aeBA6f5dAB80A39CA78E"
  );
  const bat_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  // Initialize ZRX pair with values from mainnet
  // Reversed market
  const eth_zrx_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0x14424eeecbff345b38187d0b8b749e56faa68539"
  );
  const zrx_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  // WBTC/ETH (0.3%) V3 pool from mainnet
  const wbtc_eth_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0xcbcdf9626bc03e24f779434178a73a0b4bad62ed"
  );
  const wbtc_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  // Initialize COMP pair with values from mainnet
  const comp_eth_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0xea4ba4ce14fdd287f380b55419b1c5b6c3f22ab6"
  );
  const comp_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  // Initialize LINK pair with values from mainnet
  const link_eth_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8"
  );
  const link_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  // Initialize KNC pair with values from mainnet
  // Reversed market
  const eth_knc_pair = await ethers.getContractAt(
    UniswapV3Pool.abi,
    "0x76838fd2f22bdc1d3e96069971e65653173edb2a"
  );
  const knc_reporter = await new MockV3Aggregator__factory(deployer).deploy(0);

  return {
    ETH: {
      pair: usdc_eth_pair,
      feed: usdc_reporter,
    },
    DAI: {
      pair: dai_eth_pair,
      feed: dai_reporter,
    },
    REPv2: {
      pair: rep_eth_pair,
      feed: rep_reporter,
    },
    BAT: {
      pair: bat_eth_pair,
      feed: bat_reporter,
    },
    ZRX: {
      pair: eth_zrx_pair,
      feed: zrx_reporter,
    },
    BTC: {
      pair: wbtc_eth_pair,
      feed: wbtc_reporter,
    },
    COMP: {
      pair: comp_eth_pair,
      feed: comp_reporter,
    },
    LINK: {
      pair: link_eth_pair,
      feed: link_reporter,
    },
    KNC: {
      pair: eth_knc_pair,
      feed: knc_reporter,
    },
  };
}

async function setupUniswapAnchoredView(
  pairs: TestTokenPairs,
  deployer: SignerWithAddress
) {
  const PriceSource = {
    FIXED_ETH: 0,
    FIXED_USD: 1,
    REPORTER: 2,
  };

  const anchorMantissa = BigNumber.from("10").pow("17"); //1e17 equates to 10% tolerance for source price to be above or below anchor
  const anchorPeriod = 30 * 60;

  const tokenConfigs: TokenConfig[] = [
    {
      underlying: address(1),
      symbolHash: keccak256("ETH"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.ETH.pair.address,
      feed: pairs.ETH.feed.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: true,
      failoverActive: false,
    },
    {
      underlying: address(2),
      symbolHash: keccak256("DAI"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.DAI.pair.address,
      feed: pairs.DAI.feed.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    },
    {
      underlying: address(3),
      symbolHash: keccak256("REPv2"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.REPv2.pair.address,
      feed: pairs.REPv2.feed.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    },
    {
      underlying: address(4),
      symbolHash: keccak256("BAT"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.BAT.pair.address,
      feed: pairs.BAT.feed.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    },
    {
      underlying: address(5),
      symbolHash: keccak256("ZRX"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.ZRX.pair.address,
      feed: pairs.ZRX.feed.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: true,
      failoverActive: false,
    },
    {
      underlying: address(6),
      symbolHash: keccak256("BTC"),
      baseUnit: uint(1e8),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.BTC.pair.address,
      feed: pairs.BTC.feed.address,
      feedMultiplier: uint(1e6),
      isUniswapReversed: false,
      failoverActive: false,
    },
    {
      underlying: address(7),
      symbolHash: keccak256("COMP"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.COMP.pair.address,
      feed: pairs.COMP.feed.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    },
    {
      underlying: address(8),
      symbolHash: keccak256("KNC"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.KNC.pair.address,
      feed: pairs.KNC.feed.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: true,
      failoverActive: false,
    },
    {
      underlying: address(9),
      symbolHash: keccak256("LINK"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: pairs.LINK.pair.address,
      feed: pairs.LINK.feed.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    },
  ];

  const oracle = await new UniswapAnchoredView__factory(deployer).deploy(
    anchorMantissa,
    anchorPeriod
  );
  for (const tokenConfig of tokenConfigs) {
    await oracle.addTokenConfig(tokenConfig);
  }
  return oracle;
}

async function setup(deployer: SignerWithAddress) {
  const pairs = await setupTokenPairs(deployer);
  const uniswapAnchoredView = await setupUniswapAnchoredView(pairs, deployer);
  const uniswapV3SwapHelper_ = await new UniswapV3SwapHelper__factory(
    deployer
  ).deploy();
  const uniswapV3SwapHelper = await uniswapV3SwapHelper_.connect(deployer);
  const weth9 = await getWeth9(deployer);

  return {
    uniswapAnchoredView,
    pairs,
    uniswapV3SwapHelper,
    weth9,
  };
}

describe.skip("UniswapAnchoredView", () => {
  // No data for COMP from Coinbase so far, it is not added to the oracle yet
  const prices: Array<[string, BigNumber]> = [
    ["BTC", BigNumber.from("49338784652")],
    ["ETH", BigNumber.from("3793300743")],
    ["DAI", BigNumber.from("999851")],
    ["REPv2", BigNumber.from("28877036")],
    ["ZRX", BigNumber.from("1119738")],
    ["BAT", BigNumber.from("851261")],
    ["KNC", BigNumber.from("2013118")],
    ["LINK", BigNumber.from("30058454")],
  ];
  let deployer: SignerWithAddress;
  let uniswapAnchoredView: UniswapAnchoredView;
  let pairs: TestTokenPairs;
  let uniswapV3SwapHelper: UniswapV3SwapHelper;
  let weth9: WETH9;
  beforeEach(async () => {
    await resetFork();

    const signers = await ethers.getSigners();
    deployer = signers[0];
    ({ uniswapAnchoredView, pairs, uniswapV3SwapHelper, weth9 } = await setup(
      deployer
    ));
  });

  it("basic scenario, use real world data", async () => {
    for (let i = 0; i < prices.length; i++) {
      const element = prices[i];
      const feed = pairs[element[0]].feed;
      // *100 to conform to 8 decimals
      await feed.updateAnswer(element[1].mul("100"));
      const updatedPrice = await uniswapAnchoredView.price(element[0]);
      expect(updatedPrice).to.equal(prices[i][1].toString());
    }
  });

  // TODO: PriceGuarded tests?!
  // it("test price events - PriceUpdated", async () => {
  //   await configureReporters(uniswapAnchoredView.address, pairs);

  //   for (let i = 0; i < prices.length; i++) {
  //     const element = prices[i];
  //     const reporter = pairs[element[0]].reporter;
  //     // *100 to conform to 8 decimals
  //     const validateTx = await reporter.validate(element[1].mul("100"));
  //     const events = await uniswapAnchoredView.queryFilter(
  //       uniswapAnchoredView.filters.PriceUpdated(keccak256(prices[i][0])),
  //       validateTx.blockNumber
  //     );
  //     expect(events.length).to.equal(1);
  //     // Price was updated
  //     expect(events[0].args.price).to.equal(prices[i][1]);
  //   }
  // });

  it("test ETH (USDC/ETH) pair while token reserves change", async () => {
    // Report new price so the UAV TWAP is initialised, and confirm it
    await pairs.ETH.feed.updateAnswer(3950e8);
    const ethAnchorInitial = await uniswapAnchoredView.price("ETH");
    expect(ethAnchorInitial).to.equal(3950e6);

    // Record the ETH mid-price from the pool
    const ethPriceInitial = Math.ceil(
      1e12 * 1.0001 ** -(await pairs.ETH.pair.slot0()).tick
    );
    expect(ethPriceInitial).to.equal(3951);

    const ethToSell = BigNumber.from("20000").mul(String(1e18));
    // Wrap ETH, unlimited allowance to UniswapV3SwapHelper
    await weth9.deposit({ value: ethToSell });
    await weth9.approve(
      uniswapV3SwapHelper.address,
      BigNumber.from("2").pow("256").sub("1")
    );
    // Simulate a swap using the helper
    await uniswapV3SwapHelper.performSwap(
      pairs.ETH.pair.address,
      false, // zeroForOne: false -> swap token1 (ETH) for token0 (USDC)
      ethToSell,
      BigNumber.from("1461446703485210103287273052203988822378723970342").sub(
        "1"
      ) // (MAX_SQRT_RATIO - 1) -> "no price limit"
    );

    // Check that mid-price on the V3 pool has dumped
    const ethPriceAfter = Math.ceil(
      1e12 * 1.0001 ** -(await pairs.ETH.pair.slot0()).tick
    );
    expect(1 - ethPriceAfter / ethPriceInitial).to.be.greaterThan(0.1);
    // TWAP should not be severely affected
    // So feed price should still be returned
    const ethAnchorFinal = await uniswapAnchoredView.price("ETH");
    expect(ethAnchorFinal).to.equal(3950e6);
  });
});
