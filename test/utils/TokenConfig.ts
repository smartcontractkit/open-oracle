import { BigNumber } from 'ethers';

// struct TokenConfig from UAVConfig.sol; not exported by Typechain
export interface TokenConfig {
  underlying: string;
  symbolHash: string;
  baseUnit: BigNumber;
  priceSource: number;
  fixedPrice: BigNumber;
  uniswapMarket: string;
  feed: string;
  feedMultiplier: BigNumber;
  isUniswapReversed: boolean;
  failoverActive: boolean;
}
