import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "@nomiclabs/hardhat-waffle";
import { expect, use } from "chai";
import { ethers } from "hardhat";
import {
  MockChainlinkOCRAggregator__factory,
  UniswapAnchoredView__factory,
} from "../types";
import { smock } from "@defi-wonderland/smock";
import * as UniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import { address, uint, keccak256 } from "./utils";
import { TokenConfig } from "./utils/TokenConfig";

// Chai matchers for mocked contracts
use(smock.matchers);

// BigNumber type helpers
export const BigNumber = ethers.BigNumber;
export type BigNumber = ReturnType<typeof BigNumber.from>;

const PriceSource = {
  FIXED_ETH: 0,
  FIXED_USD: 1,
  REPORTER: 2,
};

describe.skip("UniswapAnchoredView", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
  });

  it("handles fixed_usd prices", async () => {
    const USDC: TokenConfig = {
      underlying: address(2),
      symbolHash: keccak256("USDC"),
      baseUnit: uint(1e6),
      priceSource: PriceSource.FIXED_USD,
      fixedPrice: uint(1e6),
      uniswapMarket: address(0),
      feed: address(0),
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    };
    const USDT: TokenConfig = {
      underlying: address(4),
      symbolHash: keccak256("USDT"),
      baseUnit: uint(1e6),
      priceSource: PriceSource.FIXED_USD,
      fixedPrice: uint(1e6),
      uniswapMarket: address(0),
      feed: address(0),
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    };
    const oracle = await new UniswapAnchoredView__factory(deployer).deploy(
      0,
      0
    );
    await oracle.addTokenConfig(USDC);
    await oracle.addTokenConfig(USDT);
    expect(await oracle.price("USDC")).to.equal(uint(1e6));
    expect(await oracle.price("USDT")).to.equal(uint(1e6));
  });

  it("reverts fixed_eth prices if no ETH price", async () => {
    const SAI: TokenConfig = {
      underlying: address(6),
      symbolHash: keccak256("SAI"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.FIXED_ETH,
      fixedPrice: uint(5285551943761727),
      uniswapMarket: address(0),
      feed: address(0),
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    };
    const oracle = await new UniswapAnchoredView__factory(deployer).deploy(
      0,
      0
    );
    await oracle.addTokenConfig(SAI);
    expect(oracle.price("SAI")).to.be.revertedWith(
      "ETH price not set, cannot convert to dollars"
    );
  });

  it("reverts if ETH has no uniswap market", async () => {
    // if (!coverage) {
    // This test for some reason is breaking coverage in CI, skip for now
    const ETH: TokenConfig = {
      underlying: address(6),
      symbolHash: keccak256("ETH"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: address(0),
      feed: address(1),
      feedMultiplier: uint(1e16),
      isUniswapReversed: true,
      failoverActive: false,
    };
    const SAI: TokenConfig = {
      underlying: address(6),
      symbolHash: keccak256("SAI"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.FIXED_ETH,
      fixedPrice: uint(5285551943761727),
      uniswapMarket: address(0),
      feed: address(0),
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    };
    const oracle = await new UniswapAnchoredView__factory(deployer).deploy(
      0,
      0
    );
    await oracle.addTokenConfig(ETH);
    await oracle.addTokenConfig(SAI);
    expect(oracle).to.be.revertedWith("reported prices must have an anchor");
    // }
  });

  it("reverts if non-reporter has a uniswap market", async () => {
    // if (!coverage) {
    const ETH: TokenConfig = {
      underlying: address(6),
      symbolHash: keccak256("ETH"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.FIXED_ETH,
      fixedPrice: uint(14),
      uniswapMarket: address(112),
      feed: address(0),
      feedMultiplier: uint(1e16),
      isUniswapReversed: true,
      failoverActive: false,
    };
    const SAI: TokenConfig = {
      underlying: address(6),
      symbolHash: keccak256("SAI"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.FIXED_ETH,
      fixedPrice: uint(5285551943761727),
      uniswapMarket: address(0),
      feed: address(0),
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    };
    const oracle = await new UniswapAnchoredView__factory(deployer).deploy(
      0,
      0
    );
    await oracle.addTokenConfig(ETH);
    await oracle.addTokenConfig(SAI);
    expect(oracle).to.be.revertedWith("only reported prices utilize an anchor");
    // }
  });

  it("handles fixed_eth prices", async () => {
    // if (!coverage) {
    // Get USDC/ETH V3 pool (highest liquidity/highest fee) from mainnet
    const usdc_eth_pair = await ethers.getContractAt(
      UniswapV3Pool.abi,
      "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
    );
    const ans = await usdc_eth_pair.functions.observe([3600, 0]);
    const tickCumulatives: BigNumber[] = ans[0];

    const timeWeightedAverageTick = tickCumulatives[1]
      .sub(tickCumulatives[0])
      .div("3600");
    const inverseTwap = 1.0001 ** timeWeightedAverageTick.toNumber(); // USDC/ETH
    // console.log(`${inverseTwap} <- inverse TWAP (USDC/ETH) sanity check`);
    // ETH has 1e18 precision, USDC has 1e6 precision
    const twap = 1e18 / (1e6 * inverseTwap); // ETH/USDC
    // console.log(`${twap} <- TWAP (ETH/USDC) sanity check`);
    // Sanity check ~ USDC/ETH mid price at block 13152450
    expect(3957.1861616593173 - twap).to.be.lessThanOrEqual(Number.EPSILON);

    const reporter = await new MockChainlinkOCRAggregator__factory(
      deployer
    ).deploy();

    const ETH: TokenConfig = {
      underlying: address(6),
      symbolHash: keccak256("ETH"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.REPORTER,
      fixedPrice: uint(0),
      uniswapMarket: usdc_eth_pair.address,
      feed: reporter.address,
      feedMultiplier: uint(1e16),
      isUniswapReversed: true,
      failoverActive: false,
    };
    const SAI: TokenConfig = {
      underlying: address(8),
      symbolHash: keccak256("SAI"),
      baseUnit: uint(1e18),
      priceSource: PriceSource.FIXED_ETH,
      fixedPrice: uint(5285551943761727),
      uniswapMarket: address(0),
      feed: address(0),
      feedMultiplier: uint(1e16),
      isUniswapReversed: false,
      failoverActive: false,
    };
    const oracle = await new UniswapAnchoredView__factory(deployer).deploy(
      uint(20e16),
      60
    );
    await oracle.addTokenConfig(ETH);
    await oracle.addTokenConfig(SAI);
    await reporter.setUniswapAnchoredView(oracle.address);

    await ethers.provider.send("evm_increaseTime", [30 * 60]);
    await ethers.provider.send("evm_mine", []);

    // 8 decimals posted
    const ethPrice = 395718616161;
    // 6 decimals stored
    const expectedEthPrice = BigNumber.from(ethPrice).div(100); // enforce int division
    // Feed price via mock reporter -> UAV
    await reporter.validate(ethPrice);
    // console.log(
    //   await oracle.queryFilter(oracle.filters.PriceUpdated(null, null))
    // );
    // const priceGuards = await oracle.queryFilter(
    //   oracle.filters.PriceGuarded(null, null, null)
    // );
    // const priceGuarded = priceGuards[0];
    // console.log('Guarded: reported -> ' + (priceGuarded.args[1] as BigNumber).toString());
    // console.log('Guarded: anchored -> ' + (priceGuarded.args[2] as BigNumber).toString());
    expect(await oracle.price("ETH")).to.equal(expectedEthPrice.toNumber());
    expect(await oracle.price("SAI")).to.equal(20915913);
    // }
  });
});
