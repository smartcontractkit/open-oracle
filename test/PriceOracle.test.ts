import { ethers } from "hardhat";
import { expect, use } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { exp, resetFork } from "./utils";
import { PriceOracle, PriceOracle__factory } from "../types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployMockContract } from "ethereum-waffle";
import parameters, {
  TokenConfig,
} from "../configuration/parameters-price-oracle";

// Chai matchers for mocked contracts
use(smock.matchers);

export const BigNumber = ethers.BigNumber;
export type BigNumber = ReturnType<typeof BigNumber.from>;

const zeroAddress = "0x0000000000000000000000000000000000000000";

interface SetupOptions {
  isMockedView: boolean;
}

export const mockAggregatorAbi = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

const testConfigMap: Record<
  string,
  { mockPrice: number; feedDecimals: number }
> = {
  "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5": {
    mockPrice: 181217576125,
    feedDecimals: 8,
  },
  "0x39AA39c021dfbaE8faC545936693aC917d5E7563": {
    mockPrice: 101000000,
    feedDecimals: 8,
  },
  "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9": {
    mockPrice: 99800000,
    feedDecimals: 8,
  },
  "0xccf4429db6322d5c611ee964527d42e5d685dd6a": {
    mockPrice: -1,
    feedDecimals: 8,
  },
  "0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E": {
    mockPrice: 1250000000000000,
    feedDecimals: 26,
  },
};

async function setup({ isMockedView }: SetupOptions) {
  let configs: TokenConfig[] = [];
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const newOwner = signers[1];
  const other = signers[2];

  for (let config of parameters) {
    if (testConfigMap[config.cToken]) {
      // Mock ETH aggregator and set in config
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      const testConfig = testConfigMap[config.cToken];
      await mockedEthAggregator.mock.latestRoundData.returns(
        0,
        testConfig.mockPrice,
        0,
        0,
        0
      );
      await mockedEthAggregator.mock.decimals.returns(testConfig.feedDecimals);
      config.priceFeed = mockedEthAggregator.address;
      configs.push(config);
    } else if (!BigNumber.from(config.fixedPrice).eq("0")) {
      configs.push(config);
    }
  }

  let priceOracle: PriceOracle | MockContract<PriceOracle>;
  if (isMockedView) {
    const mockedPriceOracle = await smock.mock<PriceOracle__factory>(
      "PriceOracle"
    );
    priceOracle = await mockedPriceOracle.deploy(configs);
  } else {
    priceOracle = await new PriceOracle__factory(deployer).deploy(configs);
  }

  return {
    priceOracle,
    signers,
    deployer,
    newOwner,
    other,
  };
}

describe("PriceOracle", () => {
  let priceOracle: PriceOracle | MockContract<PriceOracle>;
  let deployer: SignerWithAddress;
  let newOwner: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async () => {
    await resetFork();
  });

  describe("Ownable", () => {
    beforeEach(async () => {
      ({ priceOracle, deployer, newOwner, other } = await setup({
        isMockedView: false,
      }));
    });

    describe("transferOwnership", () => {
      describe("when called by non owner", async () => {
        it("reverts", async () => {
          await expect(
            priceOracle.connect(other).transferOwnership(newOwner.address)
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
      });

      describe("when called by owner", () => {
        describe("when transferring to self", () => {
          it("is allowed", async () => {
            expect(
              await priceOracle
                .connect(deployer)
                .transferOwnership(deployer.address)
            )
              .to.emit(priceOracle, "OwnershipTransferStarted")
              .withArgs(deployer.address, deployer.address);
          });
        });

        describe("when transferring to another address", () => {
          it("emit an event", async () => {
            expect(
              await priceOracle
                .connect(deployer)
                .transferOwnership(newOwner.address)
            )
              .to.emit(priceOracle, "OwnershipTransferStarted")
              .withArgs(deployer.address, newOwner.address);
          });
        });
      });
    });

    describe("acceptOwnership", () => {
      beforeEach(async () => {
        await priceOracle.connect(deployer).transferOwnership(newOwner.address);
      });

      describe("when called by an address that is not the new owner", () => {
        it("reverts", async () => {
          await expect(
            priceOracle.connect(other).acceptOwnership()
          ).to.be.revertedWith("Ownable2Step: caller is not the new owner");
        });
      });

      describe("when accepted by an address that is the new proposed owner", () => {
        it("correctly changes the contract ownership", async () => {
          await priceOracle.connect(newOwner).acceptOwnership();
          expect(await priceOracle.owner()).to.equal(newOwner.address);
        });

        it("emits an event", async () => {
          expect(await priceOracle.connect(newOwner).acceptOwnership())
            .to.emit(priceOracle, "OwnershipTransferred")
            .withArgs(deployer.address, newOwner.address);
        });
      });
    });
  });

  describe("getUnderlyingPrice", () => {
    beforeEach(async () => {
      ({ priceOracle, deployer } = await setup({
        isMockedView: false,
      }));
    });

    it("should return reported ETH price scaled up", async () => {
      const ethCToken = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";
      const formattedPrice = BigNumber.from("181217576125").mul(exp(1, 10));
      expect(formattedPrice).to.equal(
        await priceOracle.getUnderlyingPrice(ethCToken)
      );
    });
    it("should return reported USDC price scaled up", async () => {
      const usdcCToken = "0x39AA39c021dfbaE8faC545936693aC917d5E7563";
      const formattedPrice = BigNumber.from("101000000").mul(exp(1, 22));
      expect(formattedPrice).to.equal(
        await priceOracle.getUnderlyingPrice(usdcCToken)
      );
    });
    it("should return reported BAT price scaled down", async () => {
      const batCToken = "0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E";
      const formattedPrice = BigNumber.from("1250000000000000").div(exp(1, 8));
      expect(formattedPrice).to.equal(
        await priceOracle.getUnderlyingPrice(batCToken)
      );
    });
    it("should return fixed price SAI as configured", async () => {
      const saiCToken = "0xF5DCe57282A584D2746FaF1593d3121Fcac444dC";
      const formattedPrice = BigNumber.from("15544520000000000000");
      expect(formattedPrice).to.equal(
        await priceOracle.getUnderlyingPrice(saiCToken)
      );
    });
    it("should return 0 price for invalid price from feed", async () => {
      const wbtcCToken = "0xccf4429db6322d5c611ee964527d42e5d685dd6a";
      expect(BigNumber.from("0")).to.equal(
        await priceOracle.getUnderlyingPrice(wbtcCToken)
      );
    });
    it("should revert for missing config", async () => {
      const invalidCToken = "0x041171993284df560249B57358F931D9eB7b925D";
      await expect(
        priceOracle.getUnderlyingPrice(invalidCToken)
      ).to.be.revertedWith("ConfigNotFound");
    });
  });
  describe("addConfig", () => {
    beforeEach(async () => {
      ({ priceOracle, deployer } = await setup({
        isMockedView: false,
      }));
    });

    it("should return success with price feed", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(8);
      const newConfig: TokenConfig = {
        cToken: "0x944DD1c7ce133B75880CeE913d513f8C07312393",
        underlyingAssetDecimals: "18",
        priceFeed: mockedEthAggregator.address,
        fixedPrice: "0",
      };
      expect(await priceOracle.addConfig(newConfig))
        .to.emit(priceOracle, "PriceOracleAssetAdded")
        .withArgs(
          newConfig.cToken,
          Number(newConfig.underlyingAssetDecimals),
          newConfig.priceFeed,
          newConfig.fixedPrice
        );
    });
    it("should return success with fixed price", async () => {
      const newConfig: TokenConfig = {
        cToken: "0x944DD1c7ce133B75880CeE913d513f8C07312393",
        underlyingAssetDecimals: "18",
        priceFeed: zeroAddress,
        fixedPrice: "1000000000000000000",
      };
      expect(await priceOracle.addConfig(newConfig))
        .to.emit(priceOracle, "PriceOracleAssetAdded")
        .withArgs(
          newConfig.cToken,
          Number(newConfig.underlyingAssetDecimals),
          newConfig.priceFeed,
          newConfig.fixedPrice
        );
    });
    it("should revert for duplicate price feed config", async () => {
      const dupeConfig: TokenConfig = {
        cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
        underlyingAssetDecimals: "18",
        priceFeed: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
        fixedPrice: "0",
      };

      await expect(priceOracle.addConfig(dupeConfig)).to.be.revertedWith(
        "DuplicateConfig"
      );
    });
    it("should revert for duplicate fixed price config", async () => {
      const dupeConfig: TokenConfig = {
        cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
        underlyingAssetDecimals: "18",
        priceFeed: zeroAddress,
        fixedPrice: "10000",
      };

      await expect(priceOracle.addConfig(dupeConfig)).to.be.revertedWith(
        "DuplicateConfig"
      );
    });
    it("should revert for missing price configs", async () => {
      const dupeConfig: TokenConfig = {
        cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
        underlyingAssetDecimals: "18",
        priceFeed: zeroAddress,
        fixedPrice: "0",
      };

      await expect(priceOracle.addConfig(dupeConfig)).to.be.revertedWith(
        "InvalidPriceConfigs"
      );
    });
    it("should revert for both price feed and fixed price configs set", async () => {
      const dupeConfig: TokenConfig = {
        cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
        underlyingAssetDecimals: "18",
        priceFeed: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
        fixedPrice: "1000000000000000000",
      };

      await expect(priceOracle.addConfig(dupeConfig)).to.be.revertedWith(
        "InvalidPriceConfigs"
      );
    });
    it("should succeed for 0 underlyingAssetDecimals in config", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(8);
      const zeroDecimalConfig: TokenConfig = {
        cToken: "0x041171993284df560249B57358F931D9eB7b925D",
        underlyingAssetDecimals: "0",
        priceFeed: mockedEthAggregator.address,
        fixedPrice: "0",
      };

      expect(await priceOracle.addConfig(zeroDecimalConfig))
        .to.emit(priceOracle, "PriceOracleAssetAdded")
        .withArgs(
          zeroDecimalConfig.cToken,
          0,
          zeroDecimalConfig.priceFeed,
          zeroDecimalConfig.fixedPrice
        );
    });
    it("should revert for underlyingAssetDecimals too high for min precision", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(8);
      const invalidConfigWithPriceFeed: TokenConfig = {
        cToken: "0x80a2AE356fc9ef4305676f7a3E2Ed04e12C33946",
        underlyingAssetDecimals: "31",
        priceFeed: mockedEthAggregator.address,
        fixedPrice: "0",
      };
      await expect(
        priceOracle.addConfig(invalidConfigWithPriceFeed)
      ).to.be.revertedWith("InvalidUnderlyingAssetDecimals");
    });
    it("should revert for formatting decimals too high", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(45);
      const invalidConfig: TokenConfig = {
        cToken: "0x041171993284df560249B57358F931D9eB7b925D",
        underlyingAssetDecimals: "30",
        priceFeed: mockedEthAggregator.address,
        fixedPrice: "0",
      };

      await expect(priceOracle.addConfig(invalidConfig)).to.be.revertedWith(
        "FormattingDecimalsTooHigh"
      );
    });
    it("should revert for feed decimals too high", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(75);
      const invalidConfig: TokenConfig = {
        cToken: "0x041171993284df560249B57358F931D9eB7b925D",
        underlyingAssetDecimals: "18",
        priceFeed: mockedEthAggregator.address,
        fixedPrice: "0",
      };

      await expect(priceOracle.addConfig(invalidConfig)).to.be.revertedWith(
        "FormattingDecimalsTooHigh"
      );
    });
  });
  describe("updateConfigPriceFeed", () => {
    beforeEach(async () => {
      ({ priceOracle, deployer } = await setup({
        isMockedView: false,
      }));
    });

    it("should return success updating existing price feed", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(8);
      const existingConfig = parameters[0];
      const newPriceFeed = mockedEthAggregator.address;
      expect(
        await priceOracle.updateConfigPriceFeed(
          existingConfig.cToken,
          newPriceFeed
        )
      )
        .to.emit(priceOracle, "PriceOracleAssetPriceFeedUpdated")
        .withArgs(
          existingConfig.cToken,
          existingConfig.priceFeed,
          newPriceFeed,
          0
        );
    });
    it("should return success updating fixed price config to use price feed", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(8);
      const existingConfig = {
        cToken: "0xF5DCe57282A584D2746FaF1593d3121Fcac444dC",
        priceFeed: "0x0000000000000000000000000000000000000000",
        fixedPrice: "15544520000000000000",
      };
      const newPriceFeed = mockedEthAggregator.address;
      expect(
        await priceOracle.updateConfigPriceFeed(
          existingConfig.cToken,
          newPriceFeed
        )
      )
        .to.emit(priceOracle, "PriceOracleAssetPriceFeedUpdated")
        .withArgs(
          existingConfig.cToken,
          existingConfig.priceFeed,
          newPriceFeed,
          existingConfig.fixedPrice
        );
      let returnedConfig = await priceOracle.getConfig(existingConfig.cToken);
      expect(returnedConfig.priceFeed).to.equal(newPriceFeed);
      // Updating cToken config to use price feed should clear out fixed price
      expect(returnedConfig.fixedPrice).to.equal(0);
    });
    it("should revert for resetting same price feed", async () => {
      const existingConfig = parameters[0];

      await expect(
        priceOracle.updateConfigPriceFeed(
          existingConfig.cToken,
          existingConfig.priceFeed
        )
      ).to.be.revertedWith("UnchangedPriceFeed");
    });
    it("should revert for missing config", async () => {
      const missingCToken = "0x041171993284df560249B57358F931D9eB7b925D";
      const priceFeed = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";

      await expect(
        priceOracle.updateConfigPriceFeed(missingCToken, priceFeed)
      ).to.be.revertedWith("ConfigNotFound");
    });
    it("should revert for missing price feed", async () => {
      const existingConfig = parameters[0];

      await expect(
        priceOracle.updateConfigPriceFeed(existingConfig.cToken, zeroAddress)
      ).to.be.revertedWith("InvalidPriceFeed");
    });
    it("should revert for feed decimals too high", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(75);
      const existingConfig = parameters[0];
      const newPriceFeed = mockedEthAggregator.address;

      await expect(
        priceOracle.updateConfigPriceFeed(existingConfig.cToken, newPriceFeed)
      ).to.be.revertedWith("FormattingDecimalsTooHigh");
    });
  });
  describe("updateConfigFixedPrice", () => {
    beforeEach(async () => {
      ({ priceOracle, deployer } = await setup({
        isMockedView: false,
      }));
    });

    const existingConfig = {
      cToken: "0xF5DCe57282A584D2746FaF1593d3121Fcac444dC",
      priceFeed: zeroAddress,
      fixedPrice: "15544520000000000000",
    };

    it("should return success updating existing fixed price", async () => {
      const fixedPrice = "2000000000000000000";
      expect(
        await priceOracle.updateConfigFixedPrice(
          existingConfig.cToken,
          fixedPrice
        )
      )
        .to.emit(priceOracle, "PriceOracleAssetFixedPriceUpdated")
        .withArgs(
          existingConfig.cToken,
          existingConfig.fixedPrice,
          fixedPrice,
          existingConfig.priceFeed
        );
    });
    it("should return success updating price feed config to use fixed price", async () => {
      const existingConfig = parameters[0];
      const fixedPrice = "2000000000000000000";
      expect(
        await priceOracle.updateConfigFixedPrice(
          existingConfig.cToken,
          fixedPrice
        )
      )
        .to.emit(priceOracle, "PriceOracleAssetFixedPriceUpdated")
        .withArgs(
          existingConfig.cToken,
          existingConfig.fixedPrice,
          fixedPrice,
          existingConfig.priceFeed
        );
      let returnedConfig = await priceOracle.getConfig(existingConfig.cToken);
      expect(returnedConfig.fixedPrice).to.equal(BigNumber.from(fixedPrice));
      // Updating cToken config to use fixed price should clear out price feed
      expect(returnedConfig.priceFeed).to.equal(zeroAddress);
    });
    it("should revert for resetting same fixed price", async () => {
      await expect(
        priceOracle.updateConfigFixedPrice(
          existingConfig.cToken,
          existingConfig.fixedPrice
        )
      ).to.be.revertedWith("UnchangedFixedPrice");
    });
    it("should revert for missing fixed price", async () => {
      await expect(
        priceOracle.updateConfigFixedPrice(existingConfig.cToken, 0)
      ).to.be.revertedWith("InvalidFixedPrice");
    });
    it("should revert for missing config", async () => {
      const missingCToken = "0x041171993284df560249B57358F931D9eB7b925D";
      const fixedPrice = "2000000000000000000";

      await expect(
        priceOracle.updateConfigFixedPrice(missingCToken, fixedPrice)
      ).to.be.revertedWith("ConfigNotFound");
    });
  });
  describe("removeConfig", () => {
    beforeEach(async () => {
      ({ priceOracle, deployer } = await setup({
        isMockedView: false,
      }));
    });

    it("should return success", async () => {
      const existingConfig = parameters[0];
      expect(await priceOracle.removeConfig(existingConfig.cToken))
        .to.emit(priceOracle, "PriceOracleAssetRemoved")
        .withArgs(
          existingConfig.cToken,
          Number(existingConfig.underlyingAssetDecimals),
          existingConfig.priceFeed,
          existingConfig.fixedPrice
        );
    });
    it("should revert for missing config", async () => {
      const missingCToken = "0x041171993284df560249B57358F931D9eB7b925D";

      expect(priceOracle.removeConfig(missingCToken)).to.be.revertedWith(
        "ConfigNotFound"
      );
    });
  });
});
