// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.7;

import "./UAVConfig.sol";
import "./UniswapLib.sol";
import "../Chainlink/AggregatorV2V3Interface.sol";
import "../Chainlink/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";

struct Observation {
    uint256 price;
    uint256 timestamp;
}

contract UniswapAnchoredView is UAVConfig, KeeperCompatibleInterface {
    /// @notice The number of wei in 1 ETH
    uint public constant ethBaseUnit = 1e18;

    /// @notice A common scaling factor to maintain precision
    uint public constant expScale = 1e18;

    /// @notice The highest ratio of the new price to the anchor price that will still trigger the price to be updated
    uint public immutable upperBoundAnchorRatio;

    /// @notice The lowest ratio of the new price to the anchor price that will still trigger the price to be updated
    uint public immutable lowerBoundAnchorRatio;

    /// @notice The minimum amount of time in seconds required for the old uniswap price accumulator to be replaced
    uint32 public immutable anchorPeriod;

    /// @notice The current observation for each symbolHash
    mapping(bytes32 => Observation) public observations;

    /// @notice The event emitted when the uniswap window changes
    event UniswapWindowUpdated(bytes32 indexed symbolHash, uint oldTimestamp, uint newTimestamp, uint oldPrice, uint newPrice);

    bytes32 constant ethHash = keccak256(abi.encodePacked("ETH"));

    /**
     * @notice Construct a uniswap anchored view for a set of token configurations
     * @dev Note that to avoid immature TWAPs, the system must run for at least a single anchorPeriod before using.
     *  TODO: Add note here about Uniswap V3 observation cardinality requirements/considerations
     * @param anchorToleranceMantissa_ The percentage tolerance that the feed may deviate from the uniswap anchor
     * @param anchorPeriod_ The minimum amount of time required for the old uniswap price accumulator to be replaced
     */
    constructor(uint anchorToleranceMantissa_,
                uint32 anchorPeriod_) UAVConfig() {
        anchorPeriod = anchorPeriod_;

        // Allow the tolerance to be whatever the deployer chooses, but prevent under/overflow (and prices from being 0)
        upperBoundAnchorRatio = anchorToleranceMantissa_ > type(uint).max - 100e16 ? type(uint).max : 100e16 + anchorToleranceMantissa_;
        lowerBoundAnchorRatio = anchorToleranceMantissa_ < 100e16 ? 100e16 - anchorToleranceMantissa_ : 1;
    }

    /**
     * @notice Get the official price for a symbol
     * @param symbol The symbol to fetch the price of
     * @return Price denominated in USD, with 6 decimals
     */
    function price(string memory symbol) external view returns (uint) {
        TokenConfig memory config = getTokenConfigBySymbol(symbol);
        return priceInternal(config);
    }

    function priceInternal(TokenConfig memory config) internal view returns (uint) {
        if (config.priceSource == PriceSource.FEED) {
            // Fetch latest price from the feed
            AggregatorV2V3Interface feed = AggregatorV2V3Interface(config.feed);
            uint256 feedPrice = convertFeedPrice(config, feed.latestAnswer());
            Observation memory observation = observations[config.symbolHash];
            require(observation.timestamp != 0, "no observations recorded yet");
            uint256 anchorPrice = observation.price;

            // TODO: Indicate if using failed over / anchor price over feed price?
            if (!config.failoverActive && isWithinAnchor(feedPrice, anchorPrice)) {
                return feedPrice;
            } else {
                return anchorPrice;
            }
        } else if (config.priceSource == PriceSource.FIXED_USD) {
            return config.fixedPrice;
        } else { // config.priceSource == PriceSource.FIXED_ETH
            TokenConfig memory ethConfig = getTokenConfigBySymbolHash(ethHash);
            AggregatorV2V3Interface feed = AggregatorV2V3Interface(ethConfig.feed);
            // TODO: This only checks feed and not anchor
            uint usdPerEth = convertFeedPrice(config, feed.latestAnswer());
            require(usdPerEth > 0, "ETH price not set, cannot convert to dollars");
            return FullMath.mulDiv(usdPerEth, config.fixedPrice, ethBaseUnit);
        }
    }

    /**
     * @notice Get the underlying price of a cToken
     * @dev Implements the PriceOracle interface for Compound v2.
     * @param cToken The cToken address for price retrieval
     * @return Price denominated in USD, with 18 decimals, for the given cToken address
     */
    function getUnderlyingPrice(address cToken) external view returns (uint) {
        TokenConfig memory config = getTokenConfigByUnderlying(CErc20(cToken).underlying());
        // Comptroller needs prices in the format: ${raw price} * 1e36 / baseUnit
        // The baseUnit of an asset is the amount of the smallest denomination of that asset per whole.
        // For example, the baseUnit of ETH is 1e18.
        // Since the prices in this view have 6 decimals, we must scale them by 1e(36 - 6)/baseUnit
        return FullMath.mulDiv(1e30, priceInternal(config), config.baseUnit);
    }

    function checkTwatpConfig(bytes calldata upkeepArgs)
        internal
        view
        returns (TokenConfig memory, Observation memory, uint256, uint256)
    {
        (address cToken) = abi.decode(upkeepArgs, (address));
        TokenConfig memory config = getTokenConfigByUnderlying(CErc20(cToken).underlying());
        uint256 anchorPrice = calculateAnchorPriceFromEthPrice(config);
        bytes32 symbolHash = config.symbolHash;
        Observation memory currentObservation = observations[symbolHash];
        // Update new and old observations if elapsed time is greater than or equal to anchor period
        uint256 timeElapsed = block.timestamp - currentObservation.timestamp;
        return (config, currentObservation, anchorPrice, timeElapsed);
    }

    function checkUpkeep(bytes calldata upkeepArgs)
        external
        view
        virtual
        override
        returns (bool, bytes memory)
    {
        (, , , uint256 timeElapsed) = checkTwatpConfig(upkeepArgs);
        return (timeElapsed >= anchorPeriod, bytes(""));
    }

    /**
     * @notice This is intended to be called by a Keeper (but can be called by anyone) to update
     *  the internally-stored UniV3 TWATP for a cToken underlying.
     * @param upkeepArgs ABI-encoded (address cToken)
     */
    function performUpkeep(bytes calldata upkeepArgs) external override {
        (
            TokenConfig memory config,
            Observation memory currentObservation,
            uint256 anchorPrice,
            uint256 timeElapsed
        ) = checkTwatpConfig(upkeepArgs);

        bytes32 symbolHash = config.symbolHash;
        // Update observation if elapsed time is greater than or equal to anchor period
        if (timeElapsed >= anchorPeriod) {
            observations[symbolHash].timestamp = block.timestamp;
            observations[symbolHash].price = anchorPrice;
            emit UniswapWindowUpdated(
                symbolHash,
                currentObservation.timestamp,
                block.timestamp,
                currentObservation.price,
                anchorPrice
            );
        }
    }

    /**
     * @notice Calculate the anchor price by fetching price data from the TWAP
     * @param config TokenConfig
     * @return anchorPrice uint
     */
    function calculateAnchorPriceFromEthPrice(TokenConfig memory config) internal view returns (uint anchorPrice) {
        require(config.priceSource == PriceSource.FEED, "only feed prices are anchored");
        uint ethPrice = fetchEthPrice();
        if (config.symbolHash == ethHash) {
            anchorPrice = ethPrice;
        } else {
            anchorPrice = fetchAnchorPrice(config, ethPrice);
        }
    }

    /**
     * @notice Convert the reported price to the 6 decimal format that this view requires
     * @param config TokenConfig
     * @param feedPrice price from the feed
     * @return convertedPrice uint256
     */
    function convertFeedPrice(TokenConfig memory config, int256 feedPrice) internal pure returns (uint256) {
        require(feedPrice >= 0, "Feed price cannot be negative");
        uint256 unsignedPrice = uint256(feedPrice);
        uint256 convertedPrice = FullMath.mulDiv(unsignedPrice, config.feedMultiplier, config.baseUnit);
        return convertedPrice;
    }


    function isWithinAnchor(uint feedPrice, uint anchorPrice) internal view returns (bool) {
        if (feedPrice > 0) {
            uint anchorRatio = FullMath.mulDiv(anchorPrice, 100e16, feedPrice);
            return anchorRatio <= upperBoundAnchorRatio && anchorRatio >= lowerBoundAnchorRatio;
        }
        return false;
    }

    /**
     * @dev Fetches the latest TWATP from the UniV3 pool oracle, over the last anchor period.
     *      Note that the TWATP (time-weighted average tick-price) is not equivalent to the TWAP,
     *      as ticks are logarithmic. The TWATP returned by this function will usually
     *      be lower than the TWAP.
     */
    function getUniswapTwap(TokenConfig memory config) internal view returns (uint256) {
        uint32 anchorPeriod_ = anchorPeriod;
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = anchorPeriod_;
        secondsAgos[1] = 0;
        (int56[] memory tickCumulatives, ) = IUniswapV3Pool(config.uniswapMarket).observe(secondsAgos);

        int56 anchorPeriod__ = int56(uint56(anchorPeriod_));
        require(anchorPeriod__ > 0, "Anchor period must be >0");
        int56 timeWeightedAverageTickS56 = (tickCumulatives[1] - tickCumulatives[0]) / anchorPeriod__;
        require(
            timeWeightedAverageTickS56 >= TickMath.MIN_TICK &&
                timeWeightedAverageTickS56 <= TickMath.MAX_TICK,
            "Calculated TWAP outside possible tick range"
        );
        int24 timeWeightedAverageTick = int24(timeWeightedAverageTickS56);
        if (config.isUniswapReversed) {
            // If the reverse price is desired, inverse the tick
            // price = 1.0001^{tick}
            // (price)^{-1} = (1.0001^{tick})^{-1}
            // \frac{1}{price} = 1.0001^{-tick}
            timeWeightedAverageTick = -timeWeightedAverageTick;
        }
        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(timeWeightedAverageTick);
        // Squaring the result also squares the Q96 scalar (2**96),
        // so after this mulDiv, the resulting TWAP is still in Q96 fixed precision.
        uint256 twapX96 = FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, FixedPoint96.Q96);

        // Scale up to a common precision (expScale), then down-scale from Q96.
        return FullMath.mulDiv(expScale, twapX96, FixedPoint96.Q96);
    }

    /**
     * @dev Fetches the current eth/usd price from uniswap, with 6 decimals of precision.
     *  Conversion factor is 1e18 for eth/usdc market, since we decode uniswap price statically with 18 decimals.
     */
    function fetchEthPrice() internal view returns (uint) {
        return fetchAnchorPrice(getTokenConfigBySymbolHash(ethHash), ethBaseUnit);
    }

    /**
     * @dev Fetches the current token/usd price from uniswap, with 6 decimals of precision.
     * @param conversionFactor 1e18 if seeking the ETH price, and a 6 decimal ETH-USDC price in the case of other assets
     */
    function fetchAnchorPrice(TokenConfig memory config, uint conversionFactor) internal virtual view returns (uint) {
        // `getUniswapTwap(config)`
        //      -> TWAP between the baseUnits of Uniswap pair (scaled to 1e18)
        // `twap * config.baseUnit`
        //      -> price of 1 token relative to `baseUnit` of the other token (scaled to 1e18)
        uint twap = getUniswapTwap(config);

        // `unscaledPriceMantissa * config.baseUnit / expScale`
        //      -> price of 1 token relative to baseUnit of the other token (scaled to 1)
        uint unscaledPriceMantissa = twap * conversionFactor;

        // Adjust twap according to the units of the non-ETH asset
        // 1. In the case of ETH, we would have to scale by 1e6 / USDC_UNITS, but since baseUnit2 is 1e6 (USDC), it cancels
        // 2. In the case of non-ETH tokens
        //  a. `getUniswapTwap(config)` handles "reversed" token pairs, so `twap` will always be Token/ETH TWAP.
        //  b. conversionFactor = ETH price * 1e6
        //      unscaledPriceMantissa = twap{token/ETH} * expScale * conversionFactor
        //      so ->
        //      anchorPrice = (twap * tokenBaseUnit / ethBaseUnit) * ETH_price * 1e6
        //                  = twap * conversionFactor * tokenBaseUnit / ethBaseUnit
        //                  = unscaledPriceMantissa / expScale * tokenBaseUnit / ethBaseUnit
        uint anchorPrice = unscaledPriceMantissa * config.baseUnit / ethBaseUnit / expScale;

        return anchorPrice;
    }
}
