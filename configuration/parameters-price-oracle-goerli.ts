import { TokenConfig } from "./parameters-price-oracle";

export const parameters: TokenConfig[] = [
  {
    // "NAME": "ETH",
    cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
    underlyingAssetDecimals: "18",
    priceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
  },
];

export const usdcConfig = {
  // "NAME": "USDC",
  cToken: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
  underlyingAssetDecimals: "6",
  priceFeed: "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7",
};

export default parameters;
