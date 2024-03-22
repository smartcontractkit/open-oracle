// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceOracle is Ownable2Step {

    /// @dev Configuration used to return the USD price for the associated cToken asset and base unit needed for formatting
    struct TokenConfig {
        // Decimals of the underlying asset (e.g. 18 for ETH)
        uint8 underlyingAssetDecimals;
        // Address of the feed used to retrieve the asset's price
        address priceFeed;
    }

    /// @dev Type used to load the contract with configs during deployment
    /// There should be 1 LoadConfig object for each supported asset, passed in the constructor.
    struct LoadConfig {
        // Decimals of the underlying asset (e.g. 18 for ETH)
        uint8 underlyingAssetDecimals;
        // Address of the Compound Token
        address cToken;
        // Address of the feed used to retrieve the asset's price
        address priceFeed;
    }

    /// @dev Mapping of cToken address to TokenConfig used to maintain the supported assets
    mapping (address => TokenConfig) tokenConfigs;

    /// @notice The event emitted when a new asset is added to the mapping
    /// @param cToken cToken address that the config was added for
    /// @param underlyingAssetDecimals Decimals of the underlying asset
    /// @param priceFeed Address of the feed used to retrieve the asset's price
    event PriceOracleAssetAdded(address indexed cToken, uint8 underlyingAssetDecimals, address priceFeed);

    /// @notice The event emitted when the price feed for an existing config is updated
    /// @param cToken cToken address that the config was updated for
    /// @param oldPriceFeed The existing price feed address configured in the token config
    /// @param newPriceFeed The new price feed address the token config is being updated to
    event PriceOracleAssetPriceFeedUpdated(address indexed cToken, address oldPriceFeed, address newPriceFeed);

    /// @notice The event emitted when an asset is removed to the mapping
    /// @param cToken cToken address that the config was removed for
    /// @param underlyingAssetDecimals Decimals of the underlying asset in the removed config.
    /// @param priceFeed Address price feed set in the removed config
    event PriceOracleAssetRemoved(address indexed cToken, uint8 underlyingAssetDecimals, address priceFeed);

    /// @notice The max decimals value allowed for price feed
    uint8 internal constant MAX_DECIMALS = 72;

    /// @notice The number of digits the price is scaled to before adjusted by the base units
    uint8 internal constant PRICE_SCALE = 36;

    /// @notice cToken address for config not provided
    error MissingCTokenAddress();

    /// @notice UnderlyingAssetDecimals is missing or set to value 0
    error InvalidUnderlyingAssetDecimals();

    /// @notice Sum of price feed's decimals and underlyingAssetDecimals is greater than MAX_DECIMALS
    error FormattingDecimalsTooHigh(uint16 decimals);

    /// @notice Price feed missing or duplicated
    /// @param priceFeed Price feed address provided
    error InvalidPriceFeed(address priceFeed);

    /// @notice Config already exists
    /// @param cToken cToken address provided
    error DuplicateConfig(address cToken);

    /// @notice Config does not exist in the mapping
    /// @param cToken cToken address provided
    error ConfigNotFound(address cToken);

    /// @notice Same price feed as the existing one was provided when updating the price feed config
    /// @param cToken cToken address that the price feed update is for
    /// @param existingPriceFeed Price feed address set in the existing config
    /// @param newPriceFeed Price feed address provided to update to
    error UnchangedPriceFeed(address cToken, address existingPriceFeed, address newPriceFeed);

    /**
     * @notice Construct a Price Oracle contract for a set of token configurations
     * @param configs The token configurations that define which price feed and base unit to use for each asset
     */
    constructor(LoadConfig[] memory configs) {
        // Populate token config mapping 
        for (uint i = 0; i < configs.length; i++) {
            LoadConfig memory config = configs[i];
            addConfig(config);
        }
    }

    /**
     * @notice Get the underlying price of a cToken, in the format expected by the Comptroller.
     * @dev Comptroller needs prices in the format: ${raw price} * 1e(36 - feedDecimals - underlyingAssetDecimals)
     *      'underlyingAssetDecimals' is the decimals of the underlying asset for the corresponding cToken.
     *      'feedDecimals' is a value supplied by the price feed that represent the number of decimals the price feed reports with.
     *      For example, the underlyingAssetDecimals of ETH is 18 and its price feed provides 8 decimal places
     *      We must scale the price such as: ${raw price} * 1e(36 - 8 - 18).
     * @param cToken The cToken address for price retrieval
     * @return Price denominated in USD for the given cToken address, in the format expected by the Comptroller.
     */
    function getUnderlyingPrice(address cToken)
        external
        view
        returns (uint256)
    {
        TokenConfig memory config = tokenConfigs[cToken];
        if (config.priceFeed == address(0)) revert ConfigNotFound(cToken);
        // Initialize the aggregator to read the price from
        AggregatorV3Interface priceFeed = AggregatorV3Interface(config.priceFeed);
        // Retrieve decimals from feed for formatting
        uint8 feedDecimals = priceFeed.decimals();
        // Retrieve price from feed
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        // Invalid price returned by feed. Comptroller expects 0 price on error.
        if (answer <= 0) return 0;
        uint256 price = uint256(answer);

        // Number of decimals determines whether the price needs to be multiplied or divided for scaling
        // Handle the 2 scenarios separately to ensure a non-fractional scale value
        if (feedDecimals + config.underlyingAssetDecimals <= PRICE_SCALE) {
            // Decimals is always >=0 so the scale max value is 1e36 here and not at risk of overflowing
            uint256 scale = 10 ** (PRICE_SCALE - feedDecimals - config.underlyingAssetDecimals);
            return price * scale;
        } else {
            // Sum of feed and underlying asset decimals is capped at 72 by earlier validation so scale max value is 1e36 here
            // and not at risk of overflowing
            uint256 scale = 10 ** (feedDecimals + config.underlyingAssetDecimals - PRICE_SCALE);
            return price / scale;
        }
    }

    /**
     * @notice Retrieves the token config for a particular cToken address
     * @param cToken The cToken address that the token config should be returned for
     */
    function getConfig(address cToken) external view returns (TokenConfig memory) {
        TokenConfig memory config = tokenConfigs[cToken];
        // Check if config exists for cToken
        if (config.priceFeed == address(0)) revert ConfigNotFound(cToken);
        return config;
    }

    /**
     * @notice Adds a new token config to enable the contract to provide prices for a new asset
     * @param config Token config struct that contains the info for a new asset configuration
     */
    function addConfig(LoadConfig memory config) public onlyOwner {
        _validateTokenConfig(config);
        TokenConfig memory tokenConfig = TokenConfig(config.underlyingAssetDecimals, config.priceFeed);
        tokenConfigs[config.cToken] = tokenConfig;
        emit PriceOracleAssetAdded(config.cToken, config.underlyingAssetDecimals, config.priceFeed);
    }

    /**
     * @notice Updates the price feed in the token config for a particular cToken
     * @param cToken The cToken address that the config needs to be updated for
     * @param priceFeed The address of the new price feed the config needs to be updated to
     */
    function updateConfigPriceFeed(address cToken, address priceFeed) external onlyOwner {
        TokenConfig storage config = tokenConfigs[cToken];
        // Check if config exists for cToken
        if (config.priceFeed == address(0)) revert ConfigNotFound(cToken);
        // Validate price feed
        if (priceFeed == address(0)) revert InvalidPriceFeed(priceFeed);
        // Check if existing price feed is the same as the new one sent
        if (config.priceFeed == priceFeed) revert UnchangedPriceFeed(cToken, config.priceFeed, priceFeed);
        // Validate the decimals for the price feed since it could differ from the previous one
        _validateDecimals(priceFeed, config.underlyingAssetDecimals);

        address existingPriceFeed = config.priceFeed;
        config.priceFeed = priceFeed;
        emit PriceOracleAssetPriceFeedUpdated(cToken, existingPriceFeed, priceFeed);
    }

    /**
     * @notice Removes a token config to no longer support the asset
     * @param cToken The cToken address that the token config should be removed for
     */
    function removeConfig(address cToken) external onlyOwner {
        TokenConfig memory config = tokenConfigs[cToken];
        // Check if config exists for cToken
        if (config.priceFeed == address(0)) revert ConfigNotFound(cToken);

        delete tokenConfigs[cToken];
        emit PriceOracleAssetRemoved(cToken, config.underlyingAssetDecimals, config.priceFeed);
    }

    /**
     * @notice Validates a token config and confirms one for the cToken does not already exist in mapping
     * @dev All fields are required
     * @param config TokenConfig struct that needs to be validated
     */
    function _validateTokenConfig(LoadConfig memory config) internal view {
        if (config.cToken == address(0)) revert MissingCTokenAddress();
        if (config.priceFeed == address(0)) revert InvalidPriceFeed(config.priceFeed);
        // Check if duplicate configs were submitted for the same cToken
        if (tokenConfigs[config.cToken].priceFeed != address(0)) revert DuplicateConfig(config.cToken);
        _validateDecimals(config.priceFeed, config.underlyingAssetDecimals);
    }

    /**
     * @notice Validates the combination of price feed decimals and the underlying asset decimals in the config
     * @param priceFeed The price feed the decimals need to be validated for
     * @param underlyingAssetDecimals The underlying asset decimals set in the config
     */
     function _validateDecimals(address priceFeed, uint8 underlyingAssetDecimals) internal view {
        // Check underlyingAssetDecimals exists and non-zero
        if (underlyingAssetDecimals == 0) revert InvalidUnderlyingAssetDecimals();
        AggregatorV3Interface aggregator = AggregatorV3Interface(priceFeed);
        // Retrieve decimals from feed for formatting
        uint8 feedDecimals = aggregator.decimals();
        // Cap the sum of feed decimals and underlying asset decimals to avoid overflows when formatting prices.
        if (feedDecimals + underlyingAssetDecimals > MAX_DECIMALS) revert FormattingDecimalsTooHigh(feedDecimals + underlyingAssetDecimals);
     }
}
