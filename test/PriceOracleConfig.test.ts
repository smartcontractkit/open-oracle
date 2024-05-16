import { ethers } from "hardhat";
import { expect, use } from "chai";
import { PriceOracle__factory } from "../types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { smock } from "@defi-wonderland/smock";
import { TokenConfig } from "../configuration/parameters-price-oracle";
import { resetFork } from "./utils";
import { deployMockContract } from "ethereum-waffle";
import { mockAggregatorAbi } from "./PriceOracle.test";

use(smock.matchers);

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("PriceOracle", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;

  before(async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
  });

  describe("constructor", () => {
    beforeEach(async () => {
      await resetFork();
    });

    it("succeeds", async () => {
      const configs: TokenConfig[] = [
        // Price feed config
        {
          cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
          underlyingAssetDecimals: "18",
          priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
          fixedPrice: "0",
        },
        {
          cToken: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
          underlyingAssetDecimals: "18",
          priceFeed: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
          fixedPrice: "0",
        },
        // Fixed price config
        {
          cToken: "0xF5DCe57282A584D2746FaF1593d3121Fcac444dC",
          underlyingAssetDecimals: "18",
          priceFeed: zeroAddress,
          fixedPrice: "15544520000000000000",
        },
      ];
      const priceOracle = await new PriceOracle__factory(deployer).deploy(
        configs
      );
      const config1 = configs[0];
      const returnedConfig1 = await priceOracle.getConfig(config1.cToken);
      expect(returnedConfig1.underlyingAssetDecimals).to.equal(
        Number(config1.underlyingAssetDecimals)
      );
      expect(returnedConfig1.priceFeed).to.equal(config1.priceFeed);

      const config2 = configs[1];
      const returnedConfig2 = await priceOracle.getConfig(config2.cToken);
      expect(returnedConfig2.underlyingAssetDecimals).to.equal(
        Number(config2.underlyingAssetDecimals)
      );
      expect(returnedConfig2.priceFeed).to.equal(config2.priceFeed);

      const invalidCToken = "0x39AA39c021dfbaE8faC545936693aC917d5E7563";
      expect(priceOracle.getConfig(invalidCToken)).to.be.revertedWith(
        "ConfigNotFound"
      );
    });
    it("reverts if repeating configs", async () => {
      const repeatConfigs: TokenConfig[] = [
        {
          cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
          underlyingAssetDecimals: "6",
          priceFeed: zeroAddress,
          fixedPrice: "1000000000000000000",
        },
        {
          cToken: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
          underlyingAssetDecimals: "18",
          priceFeed: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
          fixedPrice: "0",
        },
        {
          cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
          underlyingAssetDecimals: "18",
          priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
          fixedPrice: "0",
        },
        {
          cToken: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
          underlyingAssetDecimals: "6",
          priceFeed: zeroAddress,
          fixedPrice: "1000000000000000000",
        },
      ];
      await expect(
        new PriceOracle__factory(deployer).deploy(repeatConfigs)
      ).to.be.revertedWith("DuplicateConfig");
    });
    it("reverts if missing cToken", async () => {
      const invalidConfigs: TokenConfig[] = [
        {
          cToken: zeroAddress,
          underlyingAssetDecimals: "18",
          priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
          fixedPrice: "0",
        },
      ];
      await expect(
        new PriceOracle__factory(deployer).deploy(invalidConfigs)
      ).to.be.revertedWith("MissingCTokenAddress");
    });
    it("reverts if underlyingAssetDecimals is 0", async () => {
      const invalidConfigs: TokenConfig[] = [
        {
          cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
          underlyingAssetDecimals: "0",
          priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
          fixedPrice: "0",
        },
      ];
      await expect(
        new PriceOracle__factory(deployer).deploy(invalidConfigs)
      ).to.be.revertedWith("InvalidUnderlyingAssetDecimals");
    });
    it("reverts if feed decimals are too high", async () => {
      const mockedEthAggregator = await deployMockContract(
        deployer,
        mockAggregatorAbi
      );
      await mockedEthAggregator.mock.decimals.returns(75);
      const invalidConfigs: TokenConfig[] = [
        {
          cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
          underlyingAssetDecimals: "18",
          priceFeed: mockedEthAggregator.address,
          fixedPrice: "0",
        },
      ];
      await expect(
        new PriceOracle__factory(deployer).deploy(invalidConfigs)
      ).to.be.revertedWith("FormattingDecimalsTooHigh");
    });
    it("reverts if missing both priceFeed and fixedPrice", async () => {
      const invalidConfigs: TokenConfig[] = [
        {
          cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
          underlyingAssetDecimals: "18",
          priceFeed: zeroAddress,
          fixedPrice: "0",
        },
      ];
      await expect(
        new PriceOracle__factory(deployer).deploy(invalidConfigs)
      ).to.be.revertedWith("InvalidPriceConfigs");
    });
    it("reverts if both priceFeed and fixedPrice are set", async () => {
      const invalidConfigs: TokenConfig[] = [
        {
          cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
          underlyingAssetDecimals: "18",
          priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
          fixedPrice: "1000000000000000000",
        },
      ];
      await expect(
        new PriceOracle__factory(deployer).deploy(invalidConfigs)
      ).to.be.revertedWith("InvalidPriceConfigs");
    });
  });
});
