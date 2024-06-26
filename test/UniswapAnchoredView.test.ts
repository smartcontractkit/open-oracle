import { ethers } from "hardhat";
import { expect, use } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { address, uint, keccak256, exp, resetFork } from "./utils";
import {
  MockChainlinkOCRAggregator,
  MockChainlinkOCRAggregator__factory,
  UniswapAnchoredView,
  UniswapAnchoredView__factory,
} from "../types";
import * as UniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import { BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ANCHOR_PRICES,
  MOCK_REPORTED_PRICES,
} from "./utils/expectedPricesToPush";
const [, , tokenConfigurations] = require("../configuration/parameters.js");

// Chai matchers for mocked contracts
use(smock.matchers);

export const BigNumber = ethers.BigNumber;
export type BigNumber = ReturnType<typeof BigNumber.from>;

const PriceSource = {
  FIXED_ETH: 0,
  FIXED_USD: 1,
  REPORTER: 2,
};

interface CTokenConfig {
  [key: string]: {
    addr: string;
    underlying: string;
    reporter: MockChainlinkOCRAggregator;
  };
}

// struct TokenConfig from UniswapConfig.sol; not exported by Typechain
interface TokenConfig {
  cToken: string;
  underlying: string;
  symbolHash: string; // bytes32
  baseUnit: BigNumberish;
  priceSource: number | string; // enum PriceSource (=uint8)
  fixedPrice: BigNumberish;
  uniswapMarket: string;
  reporter: string;
  reporterMultiplier: BigNumberish;
  isUniswapReversed: boolean;
}

interface SetupOptions {
  isMockedView: boolean;
}

async function setup({ isMockedView }: SetupOptions) {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const newOwner = signers[1];
  const other = signers[2];

  const anchorMantissa = exp(1, 17);
  const anchorPeriod = 60;
  const timestamp = Math.floor(Date.now() / 1000);
  const tokenConfigs: TokenConfig[] = tokenConfigurations;

  // Create mock CTokens with mock underlying ERC-20s
  const cToken: CTokenConfig = (
    await Promise.all(
      tokenConfigs.map(async (config, i) => {
        return {
          symbol: config.symbolHash,
          addr: config.cToken,
          underlying: config.underlying,
          // To simplify things we are going to mock the ValidatorProxy reporter
          // contract that pushes to the UAV Validator.
          // The ValidatorProxy contract is a dependency that is already
          // tested in the Chainlink repo.
          reporter: await new MockChainlinkOCRAggregator__factory(
            deployer
          ).deploy(),
        };
      })
    )
  ).reduce<CTokenConfig>((obj, curr) => {
    obj[curr.symbol] = {
      addr: curr.addr,
      underlying: curr.underlying,
      reporter: curr.reporter,
    };
    return obj;
  }, {});

  const uavTokenConfigs: TokenConfig[] = tokenConfigs.map((config) => ({
    ...config,
    reporter:
      config.priceSource === "2"
        ? cToken[config.symbolHash].reporter.address
        : config.reporter,
  }));

  let uniswapAnchoredView:
    | UniswapAnchoredView
    | MockContract<UniswapAnchoredView>;
  if (isMockedView) {
    const mockedUniswapAnchoredView =
      await smock.mock<UniswapAnchoredView__factory>("UniswapAnchoredView");
    uniswapAnchoredView = await mockedUniswapAnchoredView.deploy(
      anchorMantissa,
      anchorPeriod,
      uavTokenConfigs
    );
  } else {
    uniswapAnchoredView = await new UniswapAnchoredView__factory(
      deployer
    ).deploy(anchorMantissa, anchorPeriod, uavTokenConfigs);
  }

  // Set the UAV to validate against for each mock reporter
  await Promise.all(
    Object.values(cToken)
      .map((c) => c.reporter)
      .map((reporter) =>
        reporter.setUniswapAnchoredView(uniswapAnchoredView.address)
      )
  );

  return {
    anchorMantissa,
    anchorPeriod,
    cToken,
    timestamp,
    tokenConfigs,
    uniswapAnchoredView,
    signers,
    deployer,
    newOwner,
    other,
  };
}

describe("UniswapAnchoredView", () => {
  let cToken: CTokenConfig;
  let reporter;
  let anchorMantissa;
  let anchorPeriod: number;
  let uniswapAnchoredView:
    | UniswapAnchoredView
    | MockContract<UniswapAnchoredView>;
  let tokenConfigs;
  let timestamp: number;
  let deployer: SignerWithAddress;
  let newOwner: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async () => {
    await resetFork();
  });

  describe("Ownable", () => {
    beforeEach(async () => {
      ({
        anchorMantissa,
        cToken,
        tokenConfigs,
        uniswapAnchoredView,
        deployer,
        newOwner,
        other,
      } = await setup({ isMockedView: false }));

      // Temp: shh
      anchorMantissa;
      anchorPeriod;
      tokenConfigs;
      timestamp;
    });

    describe("transferOwnership", () => {
      describe("when called by non owner", async () => {
        it("reverts", async () => {
          await expect(
            uniswapAnchoredView
              .connect(other)
              .transferOwnership(newOwner.address)
          ).to.be.revertedWith("Only callable by owner");
        });
      });

      describe("when called by owner", () => {
        describe("when transferring to self", () => {
          it("reverts", async () => {
            await expect(
              uniswapAnchoredView
                .connect(deployer)
                .transferOwnership(deployer.address)
            ).to.be.revertedWith("Cannot transfer to self");
          });
        });

        describe("when transferring to another address", () => {
          it("emit an event", async () => {
            expect(
              await uniswapAnchoredView
                .connect(deployer)
                .transferOwnership(newOwner.address)
            )
              .to.emit(uniswapAnchoredView, "OwnershipTransferRequested")
              .withArgs(deployer.address, newOwner.address);
          });
        });
      });
    });

    describe("acceptOwnership", () => {
      beforeEach(async () => {
        await uniswapAnchoredView
          .connect(deployer)
          .transferOwnership(newOwner.address);
      });

      describe("when called by an address that is not the new owner", () => {
        it("reverts", async () => {
          await expect(
            uniswapAnchoredView.connect(other).acceptOwnership()
          ).to.be.revertedWith("Must be proposed owner");
        });
      });

      describe("when accepted by an address that is the new proposed owner", () => {
        it("correctly changes the contract ownership", async () => {
          await uniswapAnchoredView.connect(newOwner).acceptOwnership();
          expect(await uniswapAnchoredView.owner()).to.equal(newOwner.address);
        });

        it("emits an event", async () => {
          expect(await uniswapAnchoredView.connect(newOwner).acceptOwnership())
            .to.emit(uniswapAnchoredView, "OwnershipTransferred")
            .withArgs(deployer.address, newOwner.address);
        });
      });
    });
  });

  describe("validate", () => {
    beforeEach(async () => {
      ({ anchorMantissa, cToken, tokenConfigs, uniswapAnchoredView, deployer } =
        await setup({ isMockedView: false }));

      // Temp: shh
      anchorMantissa;
      anchorPeriod;
      tokenConfigs;
      timestamp;
    });

    it("should update view if ETH price is within anchor bounds", async () => {
      const ethSymbol = keccak256("ETH");
      // Price to report (8 decimals of precision)
      const price = BigNumber.from(3950e8); // ETH/USDC = ~$3950 (block 13152450)
      // Expected price from UAV (6 decimals of precision)
      const expectedPrice = BigNumber.from(3950e6);
      reporter = cToken[ethSymbol].reporter;

      // Try to report new price
      const tx_ = await reporter.validate(price);
      const tx = await tx_.wait(1);

      // Check event log and make sure the PriceUpdated event was emitted correctly
      const events = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceUpdated(null, null),
        tx.blockNumber,
        tx.blockNumber
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.symbolHash).to.equal(ethSymbol);
      expect(events[0].args.price).to.equal(expectedPrice);
      const updatedEthPriceData = await uniswapAnchoredView.prices(ethSymbol);
      expect(updatedEthPriceData.price).to.equal(expectedPrice);
    });

    it("should update view if ETH price is within anchor bounds", async () => {
      const ethSymbol = keccak256("ETH");
      // Price to report (8 decimals of precision)
      const price = BigNumber.from(3950e8); // ETH/USDC = ~$3950 (block 13152450)
      // Expected price from UAV (6 decimals of precision)
      const expectedPrice = BigNumber.from(3950e6);
      reporter = cToken[ethSymbol].reporter;

      // Try to report new price
      const tx_ = await reporter.validate(price);
      const tx = await tx_.wait(1);

      // Check event log and make sure the PriceUpdated event was emitted correctly
      const events = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceUpdated(null, null),
        tx.blockNumber,
        tx.blockNumber
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.symbolHash).to.equal(ethSymbol);
      expect(events[0].args.price).to.equal(expectedPrice);
      const updatedEthPriceData = await uniswapAnchoredView.prices(ethSymbol);
      expect(updatedEthPriceData.price).to.equal(expectedPrice);
    });

    it("should update view if ERC20 price is within anchor bounds", async () => {
      // Same as above test but for an ERC-20 / ETH pair (REP/ETH)
      const repSymbol = keccak256("REP");
      const price = BigNumber.from(28e8);
      const expectedPrice = BigNumber.from(28e6);
      reporter = cToken[repSymbol].reporter;
      // Try to report new price
      const tx_ = await reporter.validate(price);
      const tx = await tx_.wait(1);

      // Check event log and make sure the PriceUpdated event was emitted correctly
      const events = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceUpdated(null, null),
        tx.blockNumber,
        tx.blockNumber
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.symbolHash).to.equal(repSymbol);
      expect(events[0].args.price).to.equal(expectedPrice);
      const updatedEthPriceData = await uniswapAnchoredView.prices(repSymbol);
      expect(updatedEthPriceData.price).to.equal(expectedPrice);
    });

    it("should not update view if ETH price is below anchor bounds", async () => {
      const ethSymbol = keccak256("ETH");
      const anchorPrice = 3950860042; // ~UniV3 ETH-USDC TWAP at block 13152450
      // anchorMantissa is 1e17, so 10% tolerance - test with a value outside of this tolerance range
      const postedPrice = 4400e8;
      const convertedPostedPrice = 4400e6;
      reporter = cToken[ethSymbol].reporter;
      // The internal price should be initialised with a value of 1
      expect(await uniswapAnchoredView.price("ETH")).to.equal(1);
      // Try to report new price
      // This validates against the ETH-USDC UniV3 pool's TWAP at block 13152450
      await reporter.validate(postedPrice);
      expect(await uniswapAnchoredView.price("ETH")).to.equal(1);

      // Check event log and make sure the PriceGuarded event was emitted correctly
      const events = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceGuarded(null, null)
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.symbolHash).to.equal(ethSymbol);
      expect(events[0].args.reporterPrice).to.equal(convertedPostedPrice);
      expect(events[0].args.anchorPrice).to.equal(anchorPrice);
      const updatedPrice = await uniswapAnchoredView.price("ETH");
      expect(updatedPrice).to.equal(1);
    });

    it("should not update view if ERC20 price is below anchor bounds", async () => {
      const repSymbol = keccak256("REP");
      const anchorPrice = 29578072;
      const postedPrice = 33e8; // Outside of the anchor tolerance
      const convertedPrice = 33e6;
      reporter = cToken[repSymbol].reporter;

      // The internal price should be initialised with a value of 1
      expect(await uniswapAnchoredView.price("REP")).to.equal(1);
      // Try to report new price
      // This validates against the REP-USDC UniV3 pool's TWAP at block 13152450
      await reporter.validate(postedPrice);
      expect(await uniswapAnchoredView.price("REP")).to.equal(1);

      // Check event log and make sure the PriceGuarded event was emitted correctly
      const events = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceGuarded(null, null)
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.symbolHash).to.equal(repSymbol);
      expect(events[0].args.reporterPrice).to.equal(convertedPrice);
      expect(events[0].args.anchorPrice).to.equal(anchorPrice);
      const updatedPrice = await uniswapAnchoredView.price("REP");
      expect(updatedPrice).to.equal(1);
    });

    it("should not update view if ETH price is above anchor bounds", async () => {
      const ethSymbol = keccak256("ETH");
      const anchorPrice = 3950860042; // ~UniV3 ETH-USDC TWAP at block 13152450
      // anchorMantissa is 1e17, so 10% tolerance - test with a value outside of this tolerance range
      const postedPrice = 3550e8;
      const convertedPostedPrice = 3550e6;
      reporter = cToken[ethSymbol].reporter;
      // The internal price should be initialised with a value of 1
      expect(await uniswapAnchoredView.price("ETH")).to.equal(1);
      // Try to report new price
      // This validates against the ETH-USDC UniV3 pool's TWAP at block 13152450
      await reporter.validate(postedPrice);
      expect(await uniswapAnchoredView.price("ETH")).to.equal(1);

      // Check event log and make sure the PriceGuarded event was emitted correctly
      const events = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceGuarded(null, null)
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.symbolHash).to.equal(ethSymbol);
      expect(events[0].args.reporterPrice).to.equal(convertedPostedPrice);
      expect(events[0].args.anchorPrice).to.equal(anchorPrice);
      const updatedPrice = await uniswapAnchoredView.price("ETH");
      expect(updatedPrice).to.equal(1);
    });

    it("should not update view if ERC20 price is above anchor bounds", async () => {
      const repSymbol = keccak256("REP");
      const anchorPrice = 29578072;
      const postedPrice = 26e8; // Outside of the anchor tolerance
      const convertedPrice = 26e6;
      reporter = cToken[repSymbol].reporter;

      // The internal price should be initialised with a value of 1
      expect(await uniswapAnchoredView.price("REP")).to.equal(1);
      // Try to report new price
      // This validates against the REP-USDC UniV3 pool's TWAP at block 13152450
      await reporter.validate(postedPrice);
      expect(await uniswapAnchoredView.price("REP")).to.equal(1);

      // Check event log and make sure the PriceGuarded event was emitted correctly
      const events = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceGuarded(null, null)
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.symbolHash).to.equal(repSymbol);
      expect(events[0].args.reporterPrice).to.equal(convertedPrice);
      expect(events[0].args.anchorPrice).to.equal(anchorPrice);
      const updatedPrice = await uniswapAnchoredView.price("REP");
      expect(updatedPrice).to.equal(1);
    });

    it("should not update view if reported price is 0", async () => {
      const ethSymbol = keccak256("ETH");
      const anchorPrice = 3950860042; // ~UniV3 ETH-USDC TWAP at block 13152450
      // anchorMantissa is 1e17, so 10% tolerance - test with a value outside of this tolerance range
      const postedPrice = 0;
      reporter = cToken[ethSymbol].reporter;
      // The internal price should be initialised with a value of 1
      expect(await uniswapAnchoredView.price("ETH")).to.equal(1);
      // Try to report new price
      // This validates against the ETH-USDC UniV3 pool's TWAP at block 13152450
      await reporter.validate(postedPrice);
      expect(await uniswapAnchoredView.price("ETH")).to.equal(1);

      // Check event log and make sure the PriceGuarded event was emitted correctly
      const events = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceGuarded(null, null)
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.symbolHash).to.equal(ethSymbol);
      expect(events[0].args.reporterPrice).to.equal(postedPrice);
      expect(events[0].args.anchorPrice).to.equal(anchorPrice);
      const updatedPrice = await uniswapAnchoredView.price("ETH");
      expect(updatedPrice).to.equal(1);
    });

    it("should revert reporter is not associated with a token config", async () => {
      const signers = await ethers.getSigners();
      const deployer = signers[0];
      reporter = await new MockChainlinkOCRAggregator__factory(
        deployer
      ).deploy();
      await reporter.setUniswapAnchoredView(uniswapAnchoredView.address);

      await expect(reporter.validate(95)).to.be.revertedWith("Not found");
    });

    it("should revert reporter if the reported price is negative", async () => {
      reporter = cToken[keccak256("ETH")].reporter;
      // The internal price should be initialised with a value of 1
      expect(await uniswapAnchoredView.price("ETH")).to.equal(1);
      await expect(reporter.validate(-1)).to.be.revertedWith("Cant be neg");
    });

    for (const tokenConfig of (tokenConfigurations as TokenConfig[]).filter(
      (config) => config.priceSource === "2"
    )) {
      const tokenSymbol = tokenConfig.symbolHash;
      it(`should validate and update the price for symbol ${tokenSymbol}`, async () => {
        const { baseUnit, multiplier } = ANCHOR_PRICES[tokenSymbol];
        const reportedPrice = MOCK_REPORTED_PRICES[tokenSymbol];

        reporter = cToken[tokenSymbol].reporter;

        const expectedPrice = reportedPrice.mul(multiplier).div(baseUnit);

        // Try to report new price
        const tx_ = await reporter.validate(reportedPrice);
        const tx = await tx_.wait(1);

        // Check event log and make sure the PriceUpdated event was emitted correctly
        const events = await uniswapAnchoredView.queryFilter(
          uniswapAnchoredView.filters.PriceUpdated(null, null),
          tx.blockNumber,
          tx.blockNumber
        );
        expect(events.length).to.equal(1);
        expect(events[0].args.symbolHash).to.equal(tokenSymbol);
        expect(events[0].args.price).to.equal(expectedPrice);
        const updatedPriceData = await uniswapAnchoredView.prices(tokenSymbol);
        expect(updatedPriceData.price).to.equal(expectedPrice);

        const underlyingPrice = await uniswapAnchoredView.getUnderlyingPrice(
          tokenConfig.cToken
        );
        expect(underlyingPrice).to.equal(
          updatedPriceData.price
            .mul(ethers.utils.parseUnits("1", 30))
            .div(tokenConfig.baseUnit)
        );
      });
    }
  });

  describe("getUnderlyingPrice", () => {
    // everything must return 1e36 - underlying units

    beforeEach(async () => {
      ({ cToken, uniswapAnchoredView, deployer } = await setup({
        isMockedView: false,
      }));
    });

    it("should work correctly for USDT fixed USD price source", async () => {
      // 1 * (1e(36 - 6)) = 1e30
      const expected = exp(1, 30);
      expect(
        await uniswapAnchoredView.getUnderlyingPrice(
          cToken[`${keccak256("USDT")}`].addr
        )
      ).to.equal(expected);
    });

    it("should return fixed ETH amount if SAI", async () => {
      reporter = cToken[keccak256("ETH")].reporter;
      const price = 3950e8;
      await reporter.validate(price);
      // Number should be ETHUSD * saiFixedPrice / 10e18
      expect(
        await uniswapAnchoredView.getUnderlyingPrice(
          cToken[keccak256("SAI")].addr
        )
      ).to.equal(BigNumber.from("20875750000000000000"));
    });

    it("should return reported ETH price", async () => {
      reporter = cToken[keccak256("ETH")].reporter;
      await reporter.validate(3950e8);
      // priceInternal:      returns 3950e6
      // getUnderlyingPrice: 1e30 * 3950e6 / 1e18 = 3950e18
      expect(
        await uniswapAnchoredView.getUnderlyingPrice(
          cToken[keccak256("ETH")].addr
        )
      ).to.equal(BigNumber.from("3950").mul(exp(1, 18)));
    });

    it("should return reported WBTC price", async () => {
      await cToken[keccak256("ETH")].reporter.validate(3950e8);
      await cToken[keccak256("BTC")].reporter.validate(49338e8);

      const btcPrice = await uniswapAnchoredView.price("BTC");
      expect(btcPrice).to.equal(49338e6);
      // priceInternal:      returns 49338e6
      // getUnderlyingPrice: 1e30 * 49338e6 / 1e8 = 1e32
      const expected = BigNumber.from("49338").mul(exp(1, 28));
      expect(
        await uniswapAnchoredView.getUnderlyingPrice(
          cToken[keccak256("BTC")].addr
        )
      ).to.equal(expected);
    });
  });

  describe("constructor", () => {
    beforeEach(async () => {
      ({ cToken, deployer } = await setup({ isMockedView: false }));
    });

    it("should prevent bounds from under/overflow", async () => {
      const anchorPeriod = 30;
      const configs: TokenConfig[] = [];
      const UINT256_MAX = BigNumber.from((1n << 256n) - 1n);

      const anchorMantissa1 = exp(100, 16);
      const view1 = await new UniswapAnchoredView__factory(deployer).deploy(
        anchorMantissa1,
        anchorPeriod,
        configs
      );
      expect(await view1.upperBoundAnchorRatio()).to.equal(exp(2, 18));
      expect(await view1.lowerBoundAnchorRatio()).to.equal(1);

      const anchorMantissa2 = UINT256_MAX.sub(exp(99, 16));
      const view2 = await new UniswapAnchoredView__factory(deployer).deploy(
        anchorMantissa2,
        anchorPeriod,
        configs
      );
      expect(await view2.upperBoundAnchorRatio()).to.equal(UINT256_MAX);
      expect(await view2.lowerBoundAnchorRatio()).to.equal(1);
    });

    it("should fail if baseUnit == 0", async () => {
      const anchorMantissa = exp(1, 17);

      const dummyAddress = address(0);
      const usdcEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
      );
      const daiEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8"
      );
      const repEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0xb055103b7633b61518cd806d95beeb2d4cd217e7"
      );
      const tokenConfigs = [
        // Set dummy address as a uniswap market address
        {
          cToken: address(1),
          underlying: dummyAddress,
          symbolHash: keccak256("ETH"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: usdcEthPair.address,
          reporter: cToken[keccak256("ETH")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: true,
        },
        {
          cToken: address(2),
          underlying: dummyAddress,
          symbolHash: keccak256("DAI"),
          baseUnit: 0,
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: daiEthPair.address,
          reporter: cToken[keccak256("DAI")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
        {
          cToken: address(3),
          underlying: dummyAddress,
          symbolHash: keccak256("REP"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: repEthPair.address,
          reporter: cToken[keccak256("REP")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
      ];
      await expect(
        new UniswapAnchoredView__factory(deployer).deploy(
          anchorMantissa,
          30,
          tokenConfigs
        )
      ).to.be.revertedWith("baseUnit not >0");
    });

    it("should fail if anchorPeriod == 0", async () => {
      const anchorMantissa = exp(1, 17);

      const dummyAddress = address(0);
      const usdcEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
      );
      const daiEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8"
      );
      const repEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0xb055103b7633b61518cd806d95beeb2d4cd217e7"
      );
      const tokenConfigs = [
        // Set dummy address as a uniswap market address
        {
          cToken: address(1),
          underlying: dummyAddress,
          symbolHash: keccak256("ETH"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: usdcEthPair.address,
          reporter: cToken[keccak256("ETH")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: true,
        },
        {
          cToken: address(2),
          underlying: dummyAddress,
          symbolHash: keccak256("DAI"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: daiEthPair.address,
          reporter: cToken[keccak256("DAI")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
        {
          cToken: address(3),
          underlying: dummyAddress,
          symbolHash: keccak256("REP"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: repEthPair.address,
          reporter: cToken[keccak256("REP")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
      ];

      await expect(
        new UniswapAnchoredView__factory(deployer).deploy(
          anchorMantissa,
          0,
          tokenConfigs
        )
      ).to.be.revertedWith("Period not >0");
    });

    it("should fail if the report address is 0", async () => {
      const anchorMantissa = exp(1, 17);

      const dummyAddress = address(0);
      const usdcEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
      );
      const daiEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8"
      );
      const repEthPair = await ethers.getContractAt(
        UniswapV3Pool.abi,
        "0xb055103b7633b61518cd806d95beeb2d4cd217e7"
      );
      const tokenConfigs = [
        // Set dummy address as a uniswap market address
        {
          cToken: address(1),
          underlying: dummyAddress,
          symbolHash: keccak256("ETH"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: usdcEthPair.address,
          reporter: ethers.constants.AddressZero,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: true,
        },
        {
          cToken: address(2),
          underlying: dummyAddress,
          symbolHash: keccak256("DAI"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: daiEthPair.address,
          reporter: cToken[keccak256("DAI")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
        {
          cToken: address(3),
          underlying: dummyAddress,
          symbolHash: keccak256("REP"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: repEthPair.address,
          reporter: cToken[keccak256("REP")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
      ];

      await expect(
        new UniswapAnchoredView__factory(deployer).deploy(
          anchorMantissa,
          30,
          tokenConfigs
        )
      ).to.be.revertedWith("No reporter");
    });

    it("should fail if uniswap market is not defined", async () => {
      const anchorMantissa = exp(1, 17);

      const dummyAddress = address(0);
      const tokenConfigs: TokenConfig[] = [
        // Set dummy address as a uniswap market address
        {
          cToken: cToken[keccak256("ETH")].addr,
          underlying: dummyAddress,
          symbolHash: keccak256("ETH"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: dummyAddress,
          reporter: cToken[keccak256("ETH")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: true,
        },
        {
          cToken: cToken[keccak256("DAI")].addr,
          underlying: dummyAddress,
          symbolHash: keccak256("DAI"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: address(4),
          reporter: cToken[keccak256("DAI")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
        {
          cToken: cToken[keccak256("REP")].addr,
          underlying: dummyAddress,
          symbolHash: keccak256("REP"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.REPORTER,
          fixedPrice: 0,
          uniswapMarket: address(5),
          reporter: cToken[keccak256("REP")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
      ];
      await expect(
        new UniswapAnchoredView__factory(deployer).deploy(
          anchorMantissa,
          30,
          tokenConfigs
        )
      ).to.be.revertedWith("No anchor");
    });

    it("should fail if non-reporter price utilizes an anchor", async () => {
      const anchorMantissa = exp(1, 17);

      const dummyAddress = address(0);
      const tokenConfigs1: TokenConfig[] = [
        {
          cToken: cToken[keccak256("USDT")].addr,
          underlying: dummyAddress,
          symbolHash: keccak256("USDT"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.FIXED_USD,
          fixedPrice: 0,
          uniswapMarket: address(5),
          reporter: address(0),
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
      ];
      await expect(
        new UniswapAnchoredView__factory(deployer).deploy(
          anchorMantissa,
          30,
          tokenConfigs1
        )
      ).to.be.revertedWith("Doesnt need anchor");

      const tokenConfigs2: TokenConfig[] = [
        {
          cToken: cToken[keccak256("USDT")].addr,
          underlying: dummyAddress,
          symbolHash: keccak256("USDT"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.FIXED_ETH,
          fixedPrice: 0,
          uniswapMarket: address(5),
          reporter: cToken[keccak256("DAI")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
      ];
      await expect(
        new UniswapAnchoredView__factory(deployer).deploy(
          anchorMantissa,
          30,
          tokenConfigs2
        )
      ).to.be.revertedWith("Doesnt need anchor");
    });

    it("should fail if non-reporter price utilizes a reporter", async () => {
      const anchorMantissa = exp(1, 17);

      const dummyAddress = address(0);
      const tokenConfigs1: TokenConfig[] = [
        {
          cToken: cToken[keccak256("USDT")].addr,
          underlying: dummyAddress,
          symbolHash: keccak256("USDT"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.FIXED_USD,
          fixedPrice: 0,
          uniswapMarket: address(0),
          reporter: cToken[keccak256("USDT")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
      ];
      await expect(
        new UniswapAnchoredView__factory(deployer).deploy(
          anchorMantissa,
          30,
          tokenConfigs1
        )
      ).to.be.revertedWith("Doesnt need reporter");

      const tokenConfigs2: TokenConfig[] = [
        {
          cToken: cToken[keccak256("USDT")].addr,
          underlying: dummyAddress,
          symbolHash: keccak256("USDT"),
          baseUnit: uint(1e18),
          priceSource: PriceSource.FIXED_ETH,
          fixedPrice: 0,
          uniswapMarket: address(0),
          reporter: cToken[keccak256("USDT")].reporter.address,
          reporterMultiplier: uint(1e16),
          isUniswapReversed: false,
        },
      ];
      await expect(
        new UniswapAnchoredView__factory(deployer).deploy(
          anchorMantissa,
          30,
          tokenConfigs2
        )
      ).to.be.revertedWith("Doesnt need reporter");
    });

    it("basic scenario, successfully initialize initial state", async () => {
      ({
        anchorMantissa,
        anchorPeriod,
        uniswapAnchoredView,
        tokenConfigs,
        cToken,
      } = await setup({ isMockedView: false }));
      expect(await uniswapAnchoredView.anchorPeriod()).to.equal(anchorPeriod);
      expect(await uniswapAnchoredView.upperBoundAnchorRatio()).to.equal(
        BigNumber.from(anchorMantissa).add(exp(1, 18))
      );
      expect(await uniswapAnchoredView.lowerBoundAnchorRatio()).to.equal(
        exp(1, 18).sub(anchorMantissa)
      );
    });
  });

  describe("activateFailover", () => {
    let signers: SignerWithAddress[];

    beforeEach(async () => {
      ({ uniswapAnchoredView, signers, deployer, cToken } = await setup({
        isMockedView: false,
      }));
    });

    it("reverts if called by a non-owner", async () => {
      await expect(
        uniswapAnchoredView
          .connect(signers[1])
          .activateFailover(keccak256("ETH"))
      ).to.be.revertedWith("Only callable by owner");
    });

    it("reverts if trying to activate failover for a non reporter price", async () => {
      await expect(
        uniswapAnchoredView.activateFailover(keccak256("SAI"))
      ).to.be.revertedWith("Not reporter");
    });

    it("reverts if trying to activate failover for a price that has already failed over", async () => {
      // Check that failoverActive variable is properly set
      await uniswapAnchoredView.activateFailover(keccak256("ETH"));
      await expect(
        uniswapAnchoredView.activateFailover(keccak256("ETH"))
      ).to.be.revertedWith("Already active");
    });

    it("basic scenario, sets failoverActive and emits FailoverUpdated event with correct args", async () => {
      const bytes32EthSymbolHash = ethers.utils.hexZeroPad(
        keccak256("ETH"),
        32
      );
      // Check that failoverActive variable is properly set
      const response1 = await uniswapAnchoredView.prices(bytes32EthSymbolHash);
      expect(response1.failoverActive).to.equal(false);
      await uniswapAnchoredView.activateFailover(keccak256("ETH"));
      const response2 = await uniswapAnchoredView.prices(bytes32EthSymbolHash);
      expect(response2.failoverActive).to.equal(true);

      const emittedEvents = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.FailoverActivated(null)
      );
      // Check that event is emitted
      expect(emittedEvents.length).to.equal(1);
      expect(emittedEvents[0].args.symbolHash).to.equal(keccak256("ETH"));
    });

    it("basic scenario, return failover price after failover is activated", async () => {
      reporter = cToken[keccak256("ETH")].reporter;
      await reporter.validate(BigNumber.from(3960e8));

      // Check that prices = posted prices
      const ethPrice1 = await uniswapAnchoredView.getUnderlyingPrice(
        cToken[keccak256("ETH")].addr
      );
      // priceInternal:      returns 3960e6
      // getUnderlyingPrice: 1e30 * 3960e6 / 1e18 = 3960e18
      const expectedEth1 = exp(3960, 18);
      expect(ethPrice1).to.equal(expectedEth1);

      // Failover ETH
      await uniswapAnchoredView.activateFailover(keccak256("ETH"));

      // Check that ETH (which was failed over) = uniswap TWAP prices
      // 1. Get UniV3 TWAP from pool
      const tokenConfig = await uniswapAnchoredView.getTokenConfigBySymbolHash(
        keccak256("ETH")
      );
      const usdcEthPool = await ethers.getContractAt(
        UniswapV3Pool.abi,
        tokenConfig.uniswapMarket
      );
      const tickCumulatives: BigNumber[] = (
        await usdcEthPool.observe([60, 0])
      )[0];
      const timeWeightedAvgTick = tickCumulatives[1]
        .sub(tickCumulatives[0])
        .div(60)
        .toNumber(); // int24
      const expectedEth2 = exp(1, 12).mul(
        Math.round(1e18 * 1.0001 ** -timeWeightedAvgTick)
      );
      // 2. Get the underlying price from the UAV (which should be failed over)
      const ethPrice2 = await uniswapAnchoredView.getUnderlyingPrice(
        cToken[keccak256("ETH")].addr
      );
      // failover price:      returns 3950e6
      // getUnderlyingPrice:  1e30 * 3950e6 / 1e18 = 3950e18
      expect(ethPrice2).to.equal(BigNumber.from(expectedEth2.toString()));
    });

    it("updates price from anchor instead of reporter when failover is active", async () => {
      reporter = cToken[keccak256("ETH")].reporter;
      await reporter.validate(BigNumber.from(3960e8));

      // Check that prices = posted prices
      const ethPrice1 = await uniswapAnchoredView.getUnderlyingPrice(
        cToken[keccak256("ETH")].addr
      );
      // priceInternal:      returns 3960e6
      // getUnderlyingPrice: 1e30 * 3960e6 / 1e18 = 3960e18
      const expectedEth1 = exp(3960, 18);
      expect(ethPrice1).to.equal(expectedEth1);

      // Failover ETH
      await uniswapAnchoredView.activateFailover(keccak256("ETH"));

      // Check that ETH (which was failed over) = uniswap TWAP prices
      // 1. Get UniV3 TWAP from pool
      const tokenConfig = await uniswapAnchoredView.getTokenConfigBySymbolHash(
        keccak256("ETH")
      );
      const usdcEthPool = await ethers.getContractAt(
        UniswapV3Pool.abi,
        tokenConfig.uniswapMarket
      );
      const tickCumulatives: BigNumber[] = (
        await usdcEthPool.observe([60, 0])
      )[0];
      const timeWeightedAvgTick = tickCumulatives[1]
        .sub(tickCumulatives[0])
        .div(60)
        .toNumber(); // int24
      const expectedEth2 = Math.round(1e18 * 1.0001 ** -timeWeightedAvgTick);

      // 2. Try to report a price, which should be ignored
      const reporterPrice = 3940e8;
      const convertedReporterPrice = 3940e6;
      const tx = await reporter.validate(reporterPrice);

      // 3. Check that PriceUpdated was emitted with anchor (Uniswap TWAP) price
      // instead of reporter price
      const emittedEvents = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.PriceUpdated(null, null),
        tx.blockNumber
      );
      expect(emittedEvents.length).to.equal(1);
      expect(emittedEvents[0].args.symbolHash).to.equal(keccak256("ETH"));
      expect(emittedEvents[0].args.price).to.not.equal(convertedReporterPrice);
      expect(emittedEvents[0].args.price).to.equal(expectedEth2);
    });
  });

  describe("deactivateFailover", () => {
    let signers: SignerWithAddress[];

    beforeEach(async () => {
      ({ uniswapAnchoredView, signers, cToken } = await setup({
        isMockedView: false,
      }));
    });

    it("reverts if called by a non-owner", async () => {
      await expect(
        uniswapAnchoredView
          .connect(signers[1])
          .deactivateFailover(keccak256("ETH"))
      ).to.be.revertedWith("Only callable by owner");
    });

    it("reverts if trying to deactivate a price that has not been failed over", async () => {
      await expect(
        uniswapAnchoredView.deactivateFailover(keccak256("ETH"))
      ).to.be.revertedWith("Not active");
    });

    it("basic scenario, sets failoverActive and emits FailoverUpdate event with correct args", async () => {
      // Check that failoverActive variable is properly set
      const response1 = await uniswapAnchoredView.prices(keccak256("ETH"));
      expect(response1.failoverActive).to.equal(false);
      // Activate & check
      await uniswapAnchoredView.activateFailover(keccak256("ETH"));
      const response2 = await uniswapAnchoredView.prices(keccak256("ETH"));
      expect(response2.failoverActive).to.equal(true);
      // De-activate & check
      const deactivateTx = await uniswapAnchoredView.deactivateFailover(
        keccak256("ETH")
      );
      const response3 = await uniswapAnchoredView.prices(keccak256("ETH"));
      expect(response3.failoverActive).to.equal(false);

      // Check that event is emitted
      const emittedEvents = await uniswapAnchoredView.queryFilter(
        uniswapAnchoredView.filters.FailoverDeactivated(null),
        deactivateTx.blockNumber,
        deactivateTx.blockNumber
      );
      expect(emittedEvents.length).to.equal(1);
      expect(emittedEvents[0].args.symbolHash).to.equal(keccak256("ETH"));
    });

    it("basic scenario, return reporter price after failover is deactivated", async () => {
      reporter = cToken[keccak256("ETH")].reporter;
      await reporter.validate(3960e8);

      // Check that prices = posted prices
      const ethPrice1 = await uniswapAnchoredView.getUnderlyingPrice(
        cToken[keccak256("ETH")].addr
      );
      // priceInternal:      returns 3960e6
      // getUnderlyingPrice: 1e30 * 3960e6 / 1e18 = 3960e18
      const expectedEth1 = exp(3960, 18);
      expect(ethPrice1).to.equal(expectedEth1);

      // Failover ETH
      await uniswapAnchoredView.activateFailover(keccak256("ETH"));

      // Check that ETH (which was failed over) = uniswap TWAP prices
      // 1. Get UniV3 TWAP from pool
      const tokenConfig = await uniswapAnchoredView.getTokenConfigBySymbolHash(
        keccak256("ETH")
      );
      const usdcEthPool = await ethers.getContractAt(
        UniswapV3Pool.abi,
        tokenConfig.uniswapMarket
      );
      const tickCumulatives: BigNumber[] = (
        await usdcEthPool.observe([60, 0])
      )[0];
      const timeWeightedAvgTick = tickCumulatives[1]
        .sub(tickCumulatives[0])
        .div(60)
        .toNumber(); // int24
      const expectedEth2 = exp(1, 12).mul(
        Math.round(1e18 * 1.0001 ** -timeWeightedAvgTick)
      );
      // 2. Get the underlying price from the UAV (which should be failed over)
      const ethPrice2 = await uniswapAnchoredView.getUnderlyingPrice(
        cToken[keccak256("ETH")].addr
      );
      // failover price:      returns 3950e6
      // getUnderlyingPrice:  1e30 * 3950e6 / 1e18 = 3950e18
      expect(ethPrice2).to.equal(BigNumber.from(expectedEth2.toString()));

      // deactivate failover for eth
      await uniswapAnchoredView.deactivateFailover(keccak256("ETH"));
      await reporter.validate(3960e8);

      const ethPrice3 = await uniswapAnchoredView.getUnderlyingPrice(
        cToken[keccak256("ETH")].addr
      );
      expect(ethPrice3).to.equal(expectedEth1);
    });
  });

  describe("pokeFailedOverPrice", () => {
    let signers: SignerWithAddress[];

    beforeEach(async () => {
      ({ uniswapAnchoredView, signers, cToken } = await setup({
        isMockedView: false,
      }));
    });

    it("reverts if failover not active", async () => {
      await expect(
        uniswapAnchoredView
          .connect(signers[1])
          .pokeFailedOverPrice(keccak256("ETH"))
      ).to.be.revertedWith("Not active");
    });
  });
});
