// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.7;

import "../Ownable.sol";

interface CErc20 {
    function underlying() external view returns (address);
}

contract UAVConfig is Ownable {
    /// @dev Describe how to interpret the fixedPrice in the TokenConfig.
    enum PriceSource {
        FIXED_ETH, /// implies the fixedPrice is a constant multiple of the ETH price (which varies)
        FIXED_USD, /// implies the fixedPrice is a constant multiple of the USD price (which is 1)
        FEED   /// implies the price is primarily set by the feed
    }

    /// @dev Describe how the USD price should be determined for an asset.
    ///  There should be 1 TokenConfig object for each supported asset, passed in the constructor.
    struct TokenConfig {
        address underlying;
        bytes32 symbolHash;
        uint256 baseUnit;
        PriceSource priceSource;
        uint256 fixedPrice;
        address uniswapMarket;
        address feed;
        uint256 feedMultiplier;
        bool isUniswapReversed;
        bool failoverActive;
    }

    /// @notice Mapping of underlying token address => symbol hash
    mapping(address => bytes32) internal underlyingToSymbolHash;

    /// @notice Mapping of symbol hash => TokenConfig
    /// @dev symbol hash used as id as it is the hot path
    mapping(bytes32 => TokenConfig) internal tokenConfigs;

    /// @notice The event emitted when failover is activated
    event FailoverActivated(bytes32 indexed symbolHash);

    /// @notice The event emitted when failover is deactivated
    event FailoverDeactivated(bytes32 indexed symbolHash);

    /**
     * @notice Add a new token configuration
     * @param config The token config to add
     */
    function addTokenConfig(TokenConfig memory config) public onlyOwner {
        require(tokenConfigs[config.symbolHash].symbolHash == 0, "Symbol hash in use");
        require(config.symbolHash != 0, "Symbol hash must be set");
        // TODO: Other validations?
        require(config.baseUnit != 0, "baseUnit must not be zero");
        if (config.priceSource == PriceSource.FEED) {
            require(config.uniswapMarket != address(0), "uniswapMarket must be defined");
        } else {
            require(config.feed == address(0), "feed should not be defined");
            require(config.uniswapMarket == address(0), "uniswapMarket should not be defined");
        }
        tokenConfigs[config.symbolHash] = config;
        underlyingToSymbolHash[config.underlying] = config.symbolHash;
    }

    /**
     * @notice Get the config for symbol
     * @param symbol The symbol of the config to get
     * @return The config object
     */
    function getTokenConfigBySymbol(string memory symbol) public view returns (TokenConfig memory) {
        return getTokenConfigBySymbolHash(keccak256(abi.encodePacked(symbol)));
    }

    /**
     * @notice Get the config for the reporter
     * @param reporter The address of the reporter of the config to get
     * @return The config object
     */
    // function getTokenConfigByReporter(address reporter) public view returns (TokenConfig memory) {
    //     return getTokenConfig(getReporterIndex(reporter));
    // }

    /**
     * @notice Get the config for the symbolHash
     * @param symbolHash The keccack256 of the symbol of the config to get
     * @return The config object
     */
    function getTokenConfigBySymbolHash(bytes32 symbolHash) public view returns (TokenConfig memory) {
        return tokenConfigs[symbolHash];
    }

    /**
     * @notice Get the config for an underlying asset
     * @param underlying The address of the underlying asset of the config to get
     * @return The config object
     */
    function getTokenConfigByUnderlying(address underlying) public view returns (TokenConfig memory) {
        return tokenConfigs[underlyingToSymbolHash[underlying]];
    }

    /**
     * @notice Activate failover, and fall back to using failover directly.
     * @dev Only the owner can call this function
     */
    function activateFailover(bytes32 symbolHash) external onlyOwner() {
        TokenConfig memory config = getTokenConfigBySymbolHash(symbolHash);
        require(!config.failoverActive, "Already activated");
        config.failoverActive = true;
        emit FailoverActivated(symbolHash);
    }

    /**
     * @notice Deactivate a previously activated failover
     * @dev Only the owner can call this function
     */
    function deactivateFailover(bytes32 symbolHash) external onlyOwner() {
        TokenConfig memory config = getTokenConfigBySymbolHash(symbolHash);
        require(config.failoverActive, "Already deactivated");
        config.failoverActive = false;
        emit FailoverDeactivated(symbolHash);
    }
}