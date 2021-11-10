// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "../Chainlink/AggregatorInterface.sol";

interface CErc20 {
    function underlying() external view returns (address);
}

contract UniswapConfig {
    /// @dev Describe how to interpret the fixedPrice in the TokenConfig.
    enum PriceSource {
        FIXED_ETH,  /// implies the fixedPrice is a constant multiple of the ETH price (which varies)
        FIXED_USD,  /// implies the fixedPrice is a constant multiple of the USD price (which is 1)
        PRICE_FEED  /// implies the price is set by the priceFeed
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
        AggregatorInterface priceFeed;
        uint256 priceFeedMultiplier;
        bool isUniswapReversed;
    }

    /// @notice The max number of tokens this contract is hardcoded to support
    /// @dev Do not change this variable without updating all the fields throughout the contract.
    uint public constant maxTokens = 35;

    /// @notice The number of tokens this contract actually supports
    uint public immutable numTokens;

    address internal immutable underlying00;
    address internal immutable underlying01;
    address internal immutable underlying02;
    address internal immutable underlying03;
    address internal immutable underlying04;
    address internal immutable underlying05;
    address internal immutable underlying06;
    address internal immutable underlying07;
    address internal immutable underlying08;
    address internal immutable underlying09;
    address internal immutable underlying10;
    address internal immutable underlying11;
    address internal immutable underlying12;
    address internal immutable underlying13;
    address internal immutable underlying14;
    address internal immutable underlying15;
    address internal immutable underlying16;
    address internal immutable underlying17;
    address internal immutable underlying18;
    address internal immutable underlying19;
    address internal immutable underlying20;
    address internal immutable underlying21;
    address internal immutable underlying22;
    address internal immutable underlying23;
    address internal immutable underlying24;
    address internal immutable underlying25;
    address internal immutable underlying26;
    address internal immutable underlying27;
    address internal immutable underlying28;
    address internal immutable underlying29;
    address internal immutable underlying30;
    address internal immutable underlying31;
    address internal immutable underlying32;
    address internal immutable underlying33;
    address internal immutable underlying34;

    bytes32 internal immutable symbolHash00;
    bytes32 internal immutable symbolHash01;
    bytes32 internal immutable symbolHash02;
    bytes32 internal immutable symbolHash03;
    bytes32 internal immutable symbolHash04;
    bytes32 internal immutable symbolHash05;
    bytes32 internal immutable symbolHash06;
    bytes32 internal immutable symbolHash07;
    bytes32 internal immutable symbolHash08;
    bytes32 internal immutable symbolHash09;
    bytes32 internal immutable symbolHash10;
    bytes32 internal immutable symbolHash11;
    bytes32 internal immutable symbolHash12;
    bytes32 internal immutable symbolHash13;
    bytes32 internal immutable symbolHash14;
    bytes32 internal immutable symbolHash15;
    bytes32 internal immutable symbolHash16;
    bytes32 internal immutable symbolHash17;
    bytes32 internal immutable symbolHash18;
    bytes32 internal immutable symbolHash19;
    bytes32 internal immutable symbolHash20;
    bytes32 internal immutable symbolHash21;
    bytes32 internal immutable symbolHash22;
    bytes32 internal immutable symbolHash23;
    bytes32 internal immutable symbolHash24;
    bytes32 internal immutable symbolHash25;
    bytes32 internal immutable symbolHash26;
    bytes32 internal immutable symbolHash27;
    bytes32 internal immutable symbolHash28;
    bytes32 internal immutable symbolHash29;
    bytes32 internal immutable symbolHash30;
    bytes32 internal immutable symbolHash31;
    bytes32 internal immutable symbolHash32;
    bytes32 internal immutable symbolHash33;
    bytes32 internal immutable symbolHash34;

    uint256 internal immutable baseUnit00;
    uint256 internal immutable baseUnit01;
    uint256 internal immutable baseUnit02;
    uint256 internal immutable baseUnit03;
    uint256 internal immutable baseUnit04;
    uint256 internal immutable baseUnit05;
    uint256 internal immutable baseUnit06;
    uint256 internal immutable baseUnit07;
    uint256 internal immutable baseUnit08;
    uint256 internal immutable baseUnit09;
    uint256 internal immutable baseUnit10;
    uint256 internal immutable baseUnit11;
    uint256 internal immutable baseUnit12;
    uint256 internal immutable baseUnit13;
    uint256 internal immutable baseUnit14;
    uint256 internal immutable baseUnit15;
    uint256 internal immutable baseUnit16;
    uint256 internal immutable baseUnit17;
    uint256 internal immutable baseUnit18;
    uint256 internal immutable baseUnit19;
    uint256 internal immutable baseUnit20;
    uint256 internal immutable baseUnit21;
    uint256 internal immutable baseUnit22;
    uint256 internal immutable baseUnit23;
    uint256 internal immutable baseUnit24;
    uint256 internal immutable baseUnit25;
    uint256 internal immutable baseUnit26;
    uint256 internal immutable baseUnit27;
    uint256 internal immutable baseUnit28;
    uint256 internal immutable baseUnit29;
    uint256 internal immutable baseUnit30;
    uint256 internal immutable baseUnit31;
    uint256 internal immutable baseUnit32;
    uint256 internal immutable baseUnit33;
    uint256 internal immutable baseUnit34;

    PriceSource internal immutable priceSource00;
    PriceSource internal immutable priceSource01;
    PriceSource internal immutable priceSource02;
    PriceSource internal immutable priceSource03;
    PriceSource internal immutable priceSource04;
    PriceSource internal immutable priceSource05;
    PriceSource internal immutable priceSource06;
    PriceSource internal immutable priceSource07;
    PriceSource internal immutable priceSource08;
    PriceSource internal immutable priceSource09;
    PriceSource internal immutable priceSource10;
    PriceSource internal immutable priceSource11;
    PriceSource internal immutable priceSource12;
    PriceSource internal immutable priceSource13;
    PriceSource internal immutable priceSource14;
    PriceSource internal immutable priceSource15;
    PriceSource internal immutable priceSource16;
    PriceSource internal immutable priceSource17;
    PriceSource internal immutable priceSource18;
    PriceSource internal immutable priceSource19;
    PriceSource internal immutable priceSource20;
    PriceSource internal immutable priceSource21;
    PriceSource internal immutable priceSource22;
    PriceSource internal immutable priceSource23;
    PriceSource internal immutable priceSource24;
    PriceSource internal immutable priceSource25;
    PriceSource internal immutable priceSource26;
    PriceSource internal immutable priceSource27;
    PriceSource internal immutable priceSource28;
    PriceSource internal immutable priceSource29;
    PriceSource internal immutable priceSource30;
    PriceSource internal immutable priceSource31;
    PriceSource internal immutable priceSource32;
    PriceSource internal immutable priceSource33;
    PriceSource internal immutable priceSource34;

    uint256 internal immutable fixedPrice00;
    uint256 internal immutable fixedPrice01;
    uint256 internal immutable fixedPrice02;
    uint256 internal immutable fixedPrice03;
    uint256 internal immutable fixedPrice04;
    uint256 internal immutable fixedPrice05;
    uint256 internal immutable fixedPrice06;
    uint256 internal immutable fixedPrice07;
    uint256 internal immutable fixedPrice08;
    uint256 internal immutable fixedPrice09;
    uint256 internal immutable fixedPrice10;
    uint256 internal immutable fixedPrice11;
    uint256 internal immutable fixedPrice12;
    uint256 internal immutable fixedPrice13;
    uint256 internal immutable fixedPrice14;
    uint256 internal immutable fixedPrice15;
    uint256 internal immutable fixedPrice16;
    uint256 internal immutable fixedPrice17;
    uint256 internal immutable fixedPrice18;
    uint256 internal immutable fixedPrice19;
    uint256 internal immutable fixedPrice20;
    uint256 internal immutable fixedPrice21;
    uint256 internal immutable fixedPrice22;
    uint256 internal immutable fixedPrice23;
    uint256 internal immutable fixedPrice24;
    uint256 internal immutable fixedPrice25;
    uint256 internal immutable fixedPrice26;
    uint256 internal immutable fixedPrice27;
    uint256 internal immutable fixedPrice28;
    uint256 internal immutable fixedPrice29;
    uint256 internal immutable fixedPrice30;
    uint256 internal immutable fixedPrice31;
    uint256 internal immutable fixedPrice32;
    uint256 internal immutable fixedPrice33;
    uint256 internal immutable fixedPrice34;

    address internal immutable uniswapMarket00;
    address internal immutable uniswapMarket01;
    address internal immutable uniswapMarket02;
    address internal immutable uniswapMarket03;
    address internal immutable uniswapMarket04;
    address internal immutable uniswapMarket05;
    address internal immutable uniswapMarket06;
    address internal immutable uniswapMarket07;
    address internal immutable uniswapMarket08;
    address internal immutable uniswapMarket09;
    address internal immutable uniswapMarket10;
    address internal immutable uniswapMarket11;
    address internal immutable uniswapMarket12;
    address internal immutable uniswapMarket13;
    address internal immutable uniswapMarket14;
    address internal immutable uniswapMarket15;
    address internal immutable uniswapMarket16;
    address internal immutable uniswapMarket17;
    address internal immutable uniswapMarket18;
    address internal immutable uniswapMarket19;
    address internal immutable uniswapMarket20;
    address internal immutable uniswapMarket21;
    address internal immutable uniswapMarket22;
    address internal immutable uniswapMarket23;
    address internal immutable uniswapMarket24;
    address internal immutable uniswapMarket25;
    address internal immutable uniswapMarket26;
    address internal immutable uniswapMarket27;
    address internal immutable uniswapMarket28;
    address internal immutable uniswapMarket29;
    address internal immutable uniswapMarket30;
    address internal immutable uniswapMarket31;
    address internal immutable uniswapMarket32;
    address internal immutable uniswapMarket33;
    address internal immutable uniswapMarket34;

    AggregatorInterface internal immutable priceFeed00;
    AggregatorInterface internal immutable priceFeed01;
    AggregatorInterface internal immutable priceFeed02;
    AggregatorInterface internal immutable priceFeed03;
    AggregatorInterface internal immutable priceFeed04;
    AggregatorInterface internal immutable priceFeed05;
    AggregatorInterface internal immutable priceFeed06;
    AggregatorInterface internal immutable priceFeed07;
    AggregatorInterface internal immutable priceFeed08;
    AggregatorInterface internal immutable priceFeed09;
    AggregatorInterface internal immutable priceFeed10;
    AggregatorInterface internal immutable priceFeed11;
    AggregatorInterface internal immutable priceFeed12;
    AggregatorInterface internal immutable priceFeed13;
    AggregatorInterface internal immutable priceFeed14;
    AggregatorInterface internal immutable priceFeed15;
    AggregatorInterface internal immutable priceFeed16;
    AggregatorInterface internal immutable priceFeed17;
    AggregatorInterface internal immutable priceFeed18;
    AggregatorInterface internal immutable priceFeed19;
    AggregatorInterface internal immutable priceFeed20;
    AggregatorInterface internal immutable priceFeed21;
    AggregatorInterface internal immutable priceFeed22;
    AggregatorInterface internal immutable priceFeed23;
    AggregatorInterface internal immutable priceFeed24;
    AggregatorInterface internal immutable priceFeed25;
    AggregatorInterface internal immutable priceFeed26;
    AggregatorInterface internal immutable priceFeed27;
    AggregatorInterface internal immutable priceFeed28;
    AggregatorInterface internal immutable priceFeed29;
    AggregatorInterface internal immutable priceFeed30;
    AggregatorInterface internal immutable priceFeed31;
    AggregatorInterface internal immutable priceFeed32;
    AggregatorInterface internal immutable priceFeed33;
    AggregatorInterface internal immutable priceFeed34;

    uint256 internal immutable priceFeedMultiplier00;
    uint256 internal immutable priceFeedMultiplier01;
    uint256 internal immutable priceFeedMultiplier02;
    uint256 internal immutable priceFeedMultiplier03;
    uint256 internal immutable priceFeedMultiplier04;
    uint256 internal immutable priceFeedMultiplier05;
    uint256 internal immutable priceFeedMultiplier06;
    uint256 internal immutable priceFeedMultiplier07;
    uint256 internal immutable priceFeedMultiplier08;
    uint256 internal immutable priceFeedMultiplier09;
    uint256 internal immutable priceFeedMultiplier10;
    uint256 internal immutable priceFeedMultiplier11;
    uint256 internal immutable priceFeedMultiplier12;
    uint256 internal immutable priceFeedMultiplier13;
    uint256 internal immutable priceFeedMultiplier14;
    uint256 internal immutable priceFeedMultiplier15;
    uint256 internal immutable priceFeedMultiplier16;
    uint256 internal immutable priceFeedMultiplier17;
    uint256 internal immutable priceFeedMultiplier18;
    uint256 internal immutable priceFeedMultiplier19;
    uint256 internal immutable priceFeedMultiplier20;
    uint256 internal immutable priceFeedMultiplier21;
    uint256 internal immutable priceFeedMultiplier22;
    uint256 internal immutable priceFeedMultiplier23;
    uint256 internal immutable priceFeedMultiplier24;
    uint256 internal immutable priceFeedMultiplier25;
    uint256 internal immutable priceFeedMultiplier26;
    uint256 internal immutable priceFeedMultiplier27;
    uint256 internal immutable priceFeedMultiplier28;
    uint256 internal immutable priceFeedMultiplier29;
    uint256 internal immutable priceFeedMultiplier30;
    uint256 internal immutable priceFeedMultiplier31;
    uint256 internal immutable priceFeedMultiplier32;
    uint256 internal immutable priceFeedMultiplier33;
    uint256 internal immutable priceFeedMultiplier34;

    // Contract bytecode size optimisation:
    // Each bit i stores a bool, corresponding to the ith config.
    uint64 internal immutable isUniswapReversed;

    /**
     * @notice Construct an immutable store of configs into the contract data
     * @param configs The configs for the supported assets
     */
    constructor(TokenConfig[] memory configs) {
        require(configs.length <= maxTokens, "too many configs");
        numTokens = configs.length;

        underlying00 = get(configs, 0).underlying;
        underlying01 = get(configs, 1).underlying;
        underlying02 = get(configs, 2).underlying;
        underlying03 = get(configs, 3).underlying;
        underlying04 = get(configs, 4).underlying;
        underlying05 = get(configs, 5).underlying;
        underlying06 = get(configs, 6).underlying;
        underlying07 = get(configs, 7).underlying;
        underlying08 = get(configs, 8).underlying;
        underlying09 = get(configs, 9).underlying;
        underlying10 = get(configs, 10).underlying;
        underlying11 = get(configs, 11).underlying;
        underlying12 = get(configs, 12).underlying;
        underlying13 = get(configs, 13).underlying;
        underlying14 = get(configs, 14).underlying;
        underlying15 = get(configs, 15).underlying;
        underlying16 = get(configs, 16).underlying;
        underlying17 = get(configs, 17).underlying;
        underlying18 = get(configs, 18).underlying;
        underlying19 = get(configs, 19).underlying;
        underlying20 = get(configs, 20).underlying;
        underlying21 = get(configs, 21).underlying;
        underlying22 = get(configs, 22).underlying;
        underlying23 = get(configs, 23).underlying;
        underlying24 = get(configs, 24).underlying;
        underlying25 = get(configs, 25).underlying;
        underlying26 = get(configs, 26).underlying;
        underlying27 = get(configs, 27).underlying;
        underlying28 = get(configs, 28).underlying;
        underlying29 = get(configs, 29).underlying;
        underlying30 = get(configs, 30).underlying;
        underlying31 = get(configs, 31).underlying;
        underlying32 = get(configs, 32).underlying;
        underlying33 = get(configs, 33).underlying;
        underlying34 = get(configs, 34).underlying;

        symbolHash00 = get(configs, 0).symbolHash;
        symbolHash01 = get(configs, 1).symbolHash;
        symbolHash02 = get(configs, 2).symbolHash;
        symbolHash03 = get(configs, 3).symbolHash;
        symbolHash04 = get(configs, 4).symbolHash;
        symbolHash05 = get(configs, 5).symbolHash;
        symbolHash06 = get(configs, 6).symbolHash;
        symbolHash07 = get(configs, 7).symbolHash;
        symbolHash08 = get(configs, 8).symbolHash;
        symbolHash09 = get(configs, 9).symbolHash;
        symbolHash10 = get(configs, 10).symbolHash;
        symbolHash11 = get(configs, 11).symbolHash;
        symbolHash12 = get(configs, 12).symbolHash;
        symbolHash13 = get(configs, 13).symbolHash;
        symbolHash14 = get(configs, 14).symbolHash;
        symbolHash15 = get(configs, 15).symbolHash;
        symbolHash16 = get(configs, 16).symbolHash;
        symbolHash17 = get(configs, 17).symbolHash;
        symbolHash18 = get(configs, 18).symbolHash;
        symbolHash19 = get(configs, 19).symbolHash;
        symbolHash20 = get(configs, 20).symbolHash;
        symbolHash21 = get(configs, 21).symbolHash;
        symbolHash22 = get(configs, 22).symbolHash;
        symbolHash23 = get(configs, 23).symbolHash;
        symbolHash24 = get(configs, 24).symbolHash;
        symbolHash25 = get(configs, 25).symbolHash;
        symbolHash26 = get(configs, 26).symbolHash;
        symbolHash27 = get(configs, 27).symbolHash;
        symbolHash28 = get(configs, 28).symbolHash;
        symbolHash29 = get(configs, 29).symbolHash;
        symbolHash30 = get(configs, 30).symbolHash;
        symbolHash31 = get(configs, 31).symbolHash;
        symbolHash32 = get(configs, 32).symbolHash;
        symbolHash33 = get(configs, 33).symbolHash;
        symbolHash34 = get(configs, 34).symbolHash;

        baseUnit00 = get(configs, 0).baseUnit;
        baseUnit01 = get(configs, 1).baseUnit;
        baseUnit02 = get(configs, 2).baseUnit;
        baseUnit03 = get(configs, 3).baseUnit;
        baseUnit04 = get(configs, 4).baseUnit;
        baseUnit05 = get(configs, 5).baseUnit;
        baseUnit06 = get(configs, 6).baseUnit;
        baseUnit07 = get(configs, 7).baseUnit;
        baseUnit08 = get(configs, 8).baseUnit;
        baseUnit09 = get(configs, 9).baseUnit;
        baseUnit10 = get(configs, 10).baseUnit;
        baseUnit11 = get(configs, 11).baseUnit;
        baseUnit12 = get(configs, 12).baseUnit;
        baseUnit13 = get(configs, 13).baseUnit;
        baseUnit14 = get(configs, 14).baseUnit;
        baseUnit15 = get(configs, 15).baseUnit;
        baseUnit16 = get(configs, 16).baseUnit;
        baseUnit17 = get(configs, 17).baseUnit;
        baseUnit18 = get(configs, 18).baseUnit;
        baseUnit19 = get(configs, 19).baseUnit;
        baseUnit20 = get(configs, 20).baseUnit;
        baseUnit21 = get(configs, 21).baseUnit;
        baseUnit22 = get(configs, 22).baseUnit;
        baseUnit23 = get(configs, 23).baseUnit;
        baseUnit24 = get(configs, 24).baseUnit;
        baseUnit25 = get(configs, 25).baseUnit;
        baseUnit26 = get(configs, 26).baseUnit;
        baseUnit27 = get(configs, 27).baseUnit;
        baseUnit28 = get(configs, 28).baseUnit;
        baseUnit29 = get(configs, 29).baseUnit;
        baseUnit30 = get(configs, 30).baseUnit;
        baseUnit31 = get(configs, 31).baseUnit;
        baseUnit32 = get(configs, 32).baseUnit;
        baseUnit33 = get(configs, 33).baseUnit;
        baseUnit34 = get(configs, 34).baseUnit;

        priceSource00 = get(configs, 0).priceSource;
        priceSource01 = get(configs, 1).priceSource;
        priceSource02 = get(configs, 2).priceSource;
        priceSource03 = get(configs, 3).priceSource;
        priceSource04 = get(configs, 4).priceSource;
        priceSource05 = get(configs, 5).priceSource;
        priceSource06 = get(configs, 6).priceSource;
        priceSource07 = get(configs, 7).priceSource;
        priceSource08 = get(configs, 8).priceSource;
        priceSource09 = get(configs, 9).priceSource;
        priceSource10 = get(configs, 10).priceSource;
        priceSource11 = get(configs, 11).priceSource;
        priceSource12 = get(configs, 12).priceSource;
        priceSource13 = get(configs, 13).priceSource;
        priceSource14 = get(configs, 14).priceSource;
        priceSource15 = get(configs, 15).priceSource;
        priceSource16 = get(configs, 16).priceSource;
        priceSource17 = get(configs, 17).priceSource;
        priceSource18 = get(configs, 18).priceSource;
        priceSource19 = get(configs, 19).priceSource;
        priceSource20 = get(configs, 20).priceSource;
        priceSource21 = get(configs, 21).priceSource;
        priceSource22 = get(configs, 22).priceSource;
        priceSource23 = get(configs, 23).priceSource;
        priceSource24 = get(configs, 24).priceSource;
        priceSource25 = get(configs, 25).priceSource;
        priceSource26 = get(configs, 26).priceSource;
        priceSource27 = get(configs, 27).priceSource;
        priceSource28 = get(configs, 28).priceSource;
        priceSource29 = get(configs, 29).priceSource;
        priceSource30 = get(configs, 30).priceSource;
        priceSource31 = get(configs, 31).priceSource;
        priceSource32 = get(configs, 32).priceSource;
        priceSource33 = get(configs, 33).priceSource;
        priceSource34 = get(configs, 34).priceSource;

        fixedPrice00 = get(configs, 0).fixedPrice;
        fixedPrice01 = get(configs, 1).fixedPrice;
        fixedPrice02 = get(configs, 2).fixedPrice;
        fixedPrice03 = get(configs, 3).fixedPrice;
        fixedPrice04 = get(configs, 4).fixedPrice;
        fixedPrice05 = get(configs, 5).fixedPrice;
        fixedPrice06 = get(configs, 6).fixedPrice;
        fixedPrice07 = get(configs, 7).fixedPrice;
        fixedPrice08 = get(configs, 8).fixedPrice;
        fixedPrice09 = get(configs, 9).fixedPrice;
        fixedPrice10 = get(configs, 10).fixedPrice;
        fixedPrice11 = get(configs, 11).fixedPrice;
        fixedPrice12 = get(configs, 12).fixedPrice;
        fixedPrice13 = get(configs, 13).fixedPrice;
        fixedPrice14 = get(configs, 14).fixedPrice;
        fixedPrice15 = get(configs, 15).fixedPrice;
        fixedPrice16 = get(configs, 16).fixedPrice;
        fixedPrice17 = get(configs, 17).fixedPrice;
        fixedPrice18 = get(configs, 18).fixedPrice;
        fixedPrice19 = get(configs, 19).fixedPrice;
        fixedPrice20 = get(configs, 20).fixedPrice;
        fixedPrice21 = get(configs, 21).fixedPrice;
        fixedPrice22 = get(configs, 22).fixedPrice;
        fixedPrice23 = get(configs, 23).fixedPrice;
        fixedPrice24 = get(configs, 24).fixedPrice;
        fixedPrice25 = get(configs, 25).fixedPrice;
        fixedPrice26 = get(configs, 26).fixedPrice;
        fixedPrice27 = get(configs, 27).fixedPrice;
        fixedPrice28 = get(configs, 28).fixedPrice;
        fixedPrice29 = get(configs, 29).fixedPrice;
        fixedPrice30 = get(configs, 30).fixedPrice;
        fixedPrice31 = get(configs, 31).fixedPrice;
        fixedPrice32 = get(configs, 32).fixedPrice;
        fixedPrice33 = get(configs, 33).fixedPrice;
        fixedPrice34 = get(configs, 34).fixedPrice;

        uniswapMarket00 = get(configs, 0).uniswapMarket;
        uniswapMarket01 = get(configs, 1).uniswapMarket;
        uniswapMarket02 = get(configs, 2).uniswapMarket;
        uniswapMarket03 = get(configs, 3).uniswapMarket;
        uniswapMarket04 = get(configs, 4).uniswapMarket;
        uniswapMarket05 = get(configs, 5).uniswapMarket;
        uniswapMarket06 = get(configs, 6).uniswapMarket;
        uniswapMarket07 = get(configs, 7).uniswapMarket;
        uniswapMarket08 = get(configs, 8).uniswapMarket;
        uniswapMarket09 = get(configs, 9).uniswapMarket;
        uniswapMarket10 = get(configs, 10).uniswapMarket;
        uniswapMarket11 = get(configs, 11).uniswapMarket;
        uniswapMarket12 = get(configs, 12).uniswapMarket;
        uniswapMarket13 = get(configs, 13).uniswapMarket;
        uniswapMarket14 = get(configs, 14).uniswapMarket;
        uniswapMarket15 = get(configs, 15).uniswapMarket;
        uniswapMarket16 = get(configs, 16).uniswapMarket;
        uniswapMarket17 = get(configs, 17).uniswapMarket;
        uniswapMarket18 = get(configs, 18).uniswapMarket;
        uniswapMarket19 = get(configs, 19).uniswapMarket;
        uniswapMarket20 = get(configs, 20).uniswapMarket;
        uniswapMarket21 = get(configs, 21).uniswapMarket;
        uniswapMarket22 = get(configs, 22).uniswapMarket;
        uniswapMarket23 = get(configs, 23).uniswapMarket;
        uniswapMarket24 = get(configs, 24).uniswapMarket;
        uniswapMarket25 = get(configs, 25).uniswapMarket;
        uniswapMarket26 = get(configs, 26).uniswapMarket;
        uniswapMarket27 = get(configs, 27).uniswapMarket;
        uniswapMarket28 = get(configs, 28).uniswapMarket;
        uniswapMarket29 = get(configs, 29).uniswapMarket;
        uniswapMarket30 = get(configs, 30).uniswapMarket;
        uniswapMarket31 = get(configs, 31).uniswapMarket;
        uniswapMarket32 = get(configs, 32).uniswapMarket;
        uniswapMarket33 = get(configs, 33).uniswapMarket;
        uniswapMarket34 = get(configs, 34).uniswapMarket;

        priceFeed00 = get(configs, 0).priceFeed;
        priceFeed01 = get(configs, 1).priceFeed;
        priceFeed02 = get(configs, 2).priceFeed;
        priceFeed03 = get(configs, 3).priceFeed;
        priceFeed04 = get(configs, 4).priceFeed;
        priceFeed05 = get(configs, 5).priceFeed;
        priceFeed06 = get(configs, 6).priceFeed;
        priceFeed07 = get(configs, 7).priceFeed;
        priceFeed08 = get(configs, 8).priceFeed;
        priceFeed09 = get(configs, 9).priceFeed;
        priceFeed10 = get(configs, 10).priceFeed;
        priceFeed11 = get(configs, 11).priceFeed;
        priceFeed12 = get(configs, 12).priceFeed;
        priceFeed13 = get(configs, 13).priceFeed;
        priceFeed14 = get(configs, 14).priceFeed;
        priceFeed15 = get(configs, 15).priceFeed;
        priceFeed16 = get(configs, 16).priceFeed;
        priceFeed17 = get(configs, 17).priceFeed;
        priceFeed18 = get(configs, 18).priceFeed;
        priceFeed19 = get(configs, 19).priceFeed;
        priceFeed20 = get(configs, 20).priceFeed;
        priceFeed21 = get(configs, 21).priceFeed;
        priceFeed22 = get(configs, 22).priceFeed;
        priceFeed23 = get(configs, 23).priceFeed;
        priceFeed24 = get(configs, 24).priceFeed;
        priceFeed25 = get(configs, 25).priceFeed;
        priceFeed26 = get(configs, 26).priceFeed;
        priceFeed27 = get(configs, 27).priceFeed;
        priceFeed28 = get(configs, 28).priceFeed;
        priceFeed29 = get(configs, 29).priceFeed;
        priceFeed30 = get(configs, 30).priceFeed;
        priceFeed31 = get(configs, 31).priceFeed;
        priceFeed32 = get(configs, 32).priceFeed;
        priceFeed33 = get(configs, 33).priceFeed;
        priceFeed34 = get(configs, 34).priceFeed;

        priceFeedMultiplier00 = get(configs, 0).priceFeedMultiplier;
        priceFeedMultiplier01 = get(configs, 1).priceFeedMultiplier;
        priceFeedMultiplier02 = get(configs, 2).priceFeedMultiplier;
        priceFeedMultiplier03 = get(configs, 3).priceFeedMultiplier;
        priceFeedMultiplier04 = get(configs, 4).priceFeedMultiplier;
        priceFeedMultiplier05 = get(configs, 5).priceFeedMultiplier;
        priceFeedMultiplier06 = get(configs, 6).priceFeedMultiplier;
        priceFeedMultiplier07 = get(configs, 7).priceFeedMultiplier;
        priceFeedMultiplier08 = get(configs, 8).priceFeedMultiplier;
        priceFeedMultiplier09 = get(configs, 9).priceFeedMultiplier;
        priceFeedMultiplier10 = get(configs, 10).priceFeedMultiplier;
        priceFeedMultiplier11 = get(configs, 11).priceFeedMultiplier;
        priceFeedMultiplier12 = get(configs, 12).priceFeedMultiplier;
        priceFeedMultiplier13 = get(configs, 13).priceFeedMultiplier;
        priceFeedMultiplier14 = get(configs, 14).priceFeedMultiplier;
        priceFeedMultiplier15 = get(configs, 15).priceFeedMultiplier;
        priceFeedMultiplier16 = get(configs, 16).priceFeedMultiplier;
        priceFeedMultiplier17 = get(configs, 17).priceFeedMultiplier;
        priceFeedMultiplier18 = get(configs, 18).priceFeedMultiplier;
        priceFeedMultiplier19 = get(configs, 19).priceFeedMultiplier;
        priceFeedMultiplier20 = get(configs, 20).priceFeedMultiplier;
        priceFeedMultiplier21 = get(configs, 21).priceFeedMultiplier;
        priceFeedMultiplier22 = get(configs, 22).priceFeedMultiplier;
        priceFeedMultiplier23 = get(configs, 23).priceFeedMultiplier;
        priceFeedMultiplier24 = get(configs, 24).priceFeedMultiplier;
        priceFeedMultiplier25 = get(configs, 25).priceFeedMultiplier;
        priceFeedMultiplier26 = get(configs, 26).priceFeedMultiplier;
        priceFeedMultiplier27 = get(configs, 27).priceFeedMultiplier;
        priceFeedMultiplier28 = get(configs, 28).priceFeedMultiplier;
        priceFeedMultiplier29 = get(configs, 29).priceFeedMultiplier;
        priceFeedMultiplier30 = get(configs, 30).priceFeedMultiplier;
        priceFeedMultiplier31 = get(configs, 31).priceFeedMultiplier;
        priceFeedMultiplier32 = get(configs, 32).priceFeedMultiplier;
        priceFeedMultiplier33 = get(configs, 33).priceFeedMultiplier;
        priceFeedMultiplier34 = get(configs, 34).priceFeedMultiplier;

        TokenConfig memory config;
        uint64 isUniswapReversed_ = 0;
        for (uint i = 0; i < configs.length; i++) {
            config = configs[i];
            isUniswapReversed_ |=
                uint64(config.isUniswapReversed ? 1 : 0) << uint64(i);
        }
        isUniswapReversed = isUniswapReversed_;
    }

    function get(TokenConfig[] memory configs, uint i) internal pure returns (TokenConfig memory) {
        if (i < configs.length)
            return configs[i];
        return TokenConfig({
            underlying: address(0),
            symbolHash: bytes32(0),
            baseUnit: uint256(0),
            priceSource: PriceSource(0),
            fixedPrice: uint256(0),
            uniswapMarket: address(0),
            priceFeed: AggregatorInterface(address(0)),
            priceFeedMultiplier: uint256(0),
            isUniswapReversed: false
        });
    }

    function getPriceFeedIndex(AggregatorInterface priceFeed) internal view returns(uint) {
        if (priceFeed == priceFeed00) return 0;
        if (priceFeed == priceFeed01) return 1;
        if (priceFeed == priceFeed02) return 2;
        if (priceFeed == priceFeed03) return 3;
        if (priceFeed == priceFeed04) return 4;
        if (priceFeed == priceFeed05) return 5;
        if (priceFeed == priceFeed06) return 6;
        if (priceFeed == priceFeed07) return 7;
        if (priceFeed == priceFeed08) return 8;
        if (priceFeed == priceFeed09) return 9;
        if (priceFeed == priceFeed10) return 10;
        if (priceFeed == priceFeed11) return 11;
        if (priceFeed == priceFeed12) return 12;
        if (priceFeed == priceFeed13) return 13;
        if (priceFeed == priceFeed14) return 14;
        if (priceFeed == priceFeed15) return 15;
        if (priceFeed == priceFeed16) return 16;
        if (priceFeed == priceFeed17) return 17;
        if (priceFeed == priceFeed18) return 18;
        if (priceFeed == priceFeed19) return 19;
        if (priceFeed == priceFeed20) return 20;
        if (priceFeed == priceFeed21) return 21;
        if (priceFeed == priceFeed22) return 22;
        if (priceFeed == priceFeed23) return 23;
        if (priceFeed == priceFeed24) return 24;
        if (priceFeed == priceFeed25) return 25;
        if (priceFeed == priceFeed26) return 26;
        if (priceFeed == priceFeed27) return 27;
        if (priceFeed == priceFeed28) return 28;
        if (priceFeed == priceFeed29) return 29;
        if (priceFeed == priceFeed30) return 30;
        if (priceFeed == priceFeed31) return 31;
        if (priceFeed == priceFeed32) return 32;
        if (priceFeed == priceFeed33) return 33;
        if (priceFeed == priceFeed34) return 34;

        return type(uint).max;
    }

    function getUnderlyingIndex(address underlying) internal view returns (uint) {
        if (underlying == underlying00) return 0;
        if (underlying == underlying01) return 1;
        if (underlying == underlying02) return 2;
        if (underlying == underlying03) return 3;
        if (underlying == underlying04) return 4;
        if (underlying == underlying05) return 5;
        if (underlying == underlying06) return 6;
        if (underlying == underlying07) return 7;
        if (underlying == underlying08) return 8;
        if (underlying == underlying09) return 9;
        if (underlying == underlying10) return 10;
        if (underlying == underlying11) return 11;
        if (underlying == underlying12) return 12;
        if (underlying == underlying13) return 13;
        if (underlying == underlying14) return 14;
        if (underlying == underlying15) return 15;
        if (underlying == underlying16) return 16;
        if (underlying == underlying17) return 17;
        if (underlying == underlying18) return 18;
        if (underlying == underlying19) return 19;
        if (underlying == underlying20) return 20;
        if (underlying == underlying21) return 21;
        if (underlying == underlying22) return 22;
        if (underlying == underlying23) return 23;
        if (underlying == underlying24) return 24;
        if (underlying == underlying25) return 25;
        if (underlying == underlying26) return 26;
        if (underlying == underlying27) return 27;
        if (underlying == underlying28) return 28;
        if (underlying == underlying29) return 29;
        if (underlying == underlying30) return 30;
        if (underlying == underlying31) return 31;
        if (underlying == underlying32) return 32;
        if (underlying == underlying33) return 33;
        if (underlying == underlying34) return 34;

        return type(uint).max;
    }

    function getSymbolHashIndex(bytes32 symbolHash) internal view returns (uint) {
        if (symbolHash == symbolHash00) return 0;
        if (symbolHash == symbolHash01) return 1;
        if (symbolHash == symbolHash02) return 2;
        if (symbolHash == symbolHash03) return 3;
        if (symbolHash == symbolHash04) return 4;
        if (symbolHash == symbolHash05) return 5;
        if (symbolHash == symbolHash06) return 6;
        if (symbolHash == symbolHash07) return 7;
        if (symbolHash == symbolHash08) return 8;
        if (symbolHash == symbolHash09) return 9;
        if (symbolHash == symbolHash10) return 10;
        if (symbolHash == symbolHash11) return 11;
        if (symbolHash == symbolHash12) return 12;
        if (symbolHash == symbolHash13) return 13;
        if (symbolHash == symbolHash14) return 14;
        if (symbolHash == symbolHash15) return 15;
        if (symbolHash == symbolHash16) return 16;
        if (symbolHash == symbolHash17) return 17;
        if (symbolHash == symbolHash18) return 18;
        if (symbolHash == symbolHash19) return 19;
        if (symbolHash == symbolHash20) return 20;
        if (symbolHash == symbolHash21) return 21;
        if (symbolHash == symbolHash22) return 22;
        if (symbolHash == symbolHash23) return 23;
        if (symbolHash == symbolHash24) return 24;
        if (symbolHash == symbolHash25) return 25;
        if (symbolHash == symbolHash26) return 26;
        if (symbolHash == symbolHash27) return 27;
        if (symbolHash == symbolHash28) return 28;
        if (symbolHash == symbolHash29) return 29;
        if (symbolHash == symbolHash30) return 30;
        if (symbolHash == symbolHash31) return 31;
        if (symbolHash == symbolHash32) return 32;
        if (symbolHash == symbolHash33) return 33;
        if (symbolHash == symbolHash34) return 34;

        return type(uint).max;
    }

    /**
     * @notice Get the i-th config, according to the order they were passed in originally
     * @param i The index of the config to get
     * @return The config object
     */
    function getTokenConfig(uint i) public view returns (TokenConfig memory) {
        require(i < numTokens, "token config not found");

        address underlying;
        bytes32 symbolHash;
        uint256 baseUnit;
        PriceSource priceSource;
        uint256 fixedPrice;
        address uniswapMarket;
        AggregatorInterface priceFeed;
        uint256 priceFeedMultiplier;
        if (i == 0) {
            underlying = underlying00;
            symbolHash = symbolHash00;
            baseUnit = baseUnit00;
            priceSource = priceSource00;
            fixedPrice = fixedPrice00;
            uniswapMarket = uniswapMarket00;
            priceFeed = priceFeed00;
            priceFeedMultiplier = priceFeedMultiplier00;
        }
        if (i == 1) {
            underlying = underlying01;
            symbolHash = symbolHash01;
            baseUnit = baseUnit01;
            priceSource = priceSource01;
            fixedPrice = fixedPrice01;
            uniswapMarket = uniswapMarket01;
            priceFeed = priceFeed01;
            priceFeedMultiplier = priceFeedMultiplier01;
        }
        if (i == 2) {
            underlying = underlying02;
            symbolHash = symbolHash02;
            baseUnit = baseUnit02;
            priceSource = priceSource02;
            fixedPrice = fixedPrice02;
            uniswapMarket = uniswapMarket02;
            priceFeed = priceFeed02;
            priceFeedMultiplier = priceFeedMultiplier02;
        }
        if (i == 3) {
            underlying = underlying03;
            symbolHash = symbolHash03;
            baseUnit = baseUnit03;
            priceSource = priceSource03;
            fixedPrice = fixedPrice03;
            uniswapMarket = uniswapMarket03;
            priceFeed = priceFeed03;
            priceFeedMultiplier = priceFeedMultiplier03;
        }
        if (i == 4) {
            underlying = underlying04;
            symbolHash = symbolHash04;
            baseUnit = baseUnit04;
            priceSource = priceSource04;
            fixedPrice = fixedPrice04;
            uniswapMarket = uniswapMarket04;
            priceFeed = priceFeed04;
            priceFeedMultiplier = priceFeedMultiplier04;
        }
        if (i == 5) {
            underlying = underlying05;
            symbolHash = symbolHash05;
            baseUnit = baseUnit05;
            priceSource = priceSource05;
            fixedPrice = fixedPrice05;
            uniswapMarket = uniswapMarket05;
            priceFeed = priceFeed05;
            priceFeedMultiplier = priceFeedMultiplier05;
        }
        if (i == 6) {
            underlying = underlying06;
            symbolHash = symbolHash06;
            baseUnit = baseUnit06;
            priceSource = priceSource06;
            fixedPrice = fixedPrice06;
            uniswapMarket = uniswapMarket06;
            priceFeed = priceFeed06;
            priceFeedMultiplier = priceFeedMultiplier06;
        }
        if (i == 7) {
            underlying = underlying07;
            symbolHash = symbolHash07;
            baseUnit = baseUnit07;
            priceSource = priceSource07;
            fixedPrice = fixedPrice07;
            uniswapMarket = uniswapMarket07;
            priceFeed = priceFeed07;
            priceFeedMultiplier = priceFeedMultiplier07;
        }
        if (i == 8) {
            underlying = underlying08;
            symbolHash = symbolHash08;
            baseUnit = baseUnit08;
            priceSource = priceSource08;
            fixedPrice = fixedPrice08;
            uniswapMarket = uniswapMarket08;
            priceFeed = priceFeed08;
            priceFeedMultiplier = priceFeedMultiplier08;
        }
        if (i == 9) {
            underlying = underlying09;
            symbolHash = symbolHash09;
            baseUnit = baseUnit09;
            priceSource = priceSource09;
            fixedPrice = fixedPrice09;
            uniswapMarket = uniswapMarket09;
            priceFeed = priceFeed09;
            priceFeedMultiplier = priceFeedMultiplier09;
        }
        if (i == 10) {
            underlying = underlying10;
            symbolHash = symbolHash10;
            baseUnit = baseUnit10;
            priceSource = priceSource10;
            fixedPrice = fixedPrice10;
            uniswapMarket = uniswapMarket10;
            priceFeed = priceFeed10;
            priceFeedMultiplier = priceFeedMultiplier10;
        }
        if (i == 11) {
            underlying = underlying11;
            symbolHash = symbolHash11;
            baseUnit = baseUnit11;
            priceSource = priceSource11;
            fixedPrice = fixedPrice11;
            uniswapMarket = uniswapMarket11;
            priceFeed = priceFeed11;
            priceFeedMultiplier = priceFeedMultiplier11;
        }
        if (i == 12) {
            underlying = underlying12;
            symbolHash = symbolHash12;
            baseUnit = baseUnit12;
            priceSource = priceSource12;
            fixedPrice = fixedPrice12;
            uniswapMarket = uniswapMarket12;
            priceFeed = priceFeed12;
            priceFeedMultiplier = priceFeedMultiplier12;
        }
        if (i == 13) {
            underlying = underlying13;
            symbolHash = symbolHash13;
            baseUnit = baseUnit13;
            priceSource = priceSource13;
            fixedPrice = fixedPrice13;
            uniswapMarket = uniswapMarket13;
            priceFeed = priceFeed13;
            priceFeedMultiplier = priceFeedMultiplier13;
        }
        if (i == 14) {
            underlying = underlying14;
            symbolHash = symbolHash14;
            baseUnit = baseUnit14;
            priceSource = priceSource14;
            fixedPrice = fixedPrice14;
            uniswapMarket = uniswapMarket14;
            priceFeed = priceFeed14;
            priceFeedMultiplier = priceFeedMultiplier14;
        }
        if (i == 15) {
            underlying = underlying15;
            symbolHash = symbolHash15;
            baseUnit = baseUnit15;
            priceSource = priceSource15;
            fixedPrice = fixedPrice15;
            uniswapMarket = uniswapMarket15;
            priceFeed = priceFeed15;
            priceFeedMultiplier = priceFeedMultiplier15;
        }
        if (i == 16) {
            underlying = underlying16;
            symbolHash = symbolHash16;
            baseUnit = baseUnit16;
            priceSource = priceSource16;
            fixedPrice = fixedPrice16;
            uniswapMarket = uniswapMarket16;
            priceFeed = priceFeed16;
            priceFeedMultiplier = priceFeedMultiplier16;
        }
        if (i == 17) {
            underlying = underlying17;
            symbolHash = symbolHash17;
            baseUnit = baseUnit17;
            priceSource = priceSource17;
            fixedPrice = fixedPrice17;
            uniswapMarket = uniswapMarket17;
            priceFeed = priceFeed17;
            priceFeedMultiplier = priceFeedMultiplier17;
        }
        if (i == 18) {
            underlying = underlying18;
            symbolHash = symbolHash18;
            baseUnit = baseUnit18;
            priceSource = priceSource18;
            fixedPrice = fixedPrice18;
            uniswapMarket = uniswapMarket18;
            priceFeed = priceFeed18;
            priceFeedMultiplier = priceFeedMultiplier18;
        }
        if (i == 19) {
            underlying = underlying19;
            symbolHash = symbolHash19;
            baseUnit = baseUnit19;
            priceSource = priceSource19;
            fixedPrice = fixedPrice19;
            uniswapMarket = uniswapMarket19;
            priceFeed = priceFeed19;
            priceFeedMultiplier = priceFeedMultiplier19;
        }
        if (i == 20) {
            underlying = underlying20;
            symbolHash = symbolHash20;
            baseUnit = baseUnit20;
            priceSource = priceSource20;
            fixedPrice = fixedPrice20;
            uniswapMarket = uniswapMarket20;
            priceFeed = priceFeed20;
            priceFeedMultiplier = priceFeedMultiplier20;
        }
        if (i == 21) {
            underlying = underlying21;
            symbolHash = symbolHash21;
            baseUnit = baseUnit21;
            priceSource = priceSource21;
            fixedPrice = fixedPrice21;
            uniswapMarket = uniswapMarket21;
            priceFeed = priceFeed21;
            priceFeedMultiplier = priceFeedMultiplier21;
        }
        if (i == 22) {
            underlying = underlying22;
            symbolHash = symbolHash22;
            baseUnit = baseUnit22;
            priceSource = priceSource22;
            fixedPrice = fixedPrice22;
            uniswapMarket = uniswapMarket22;
            priceFeed = priceFeed22;
            priceFeedMultiplier = priceFeedMultiplier22;
        }
        if (i == 23) {
            underlying = underlying23;
            symbolHash = symbolHash23;
            baseUnit = baseUnit23;
            priceSource = priceSource23;
            fixedPrice = fixedPrice23;
            uniswapMarket = uniswapMarket23;
            priceFeed = priceFeed23;
            priceFeedMultiplier = priceFeedMultiplier23;
        }
        if (i == 24) {
            underlying = underlying24;
            symbolHash = symbolHash24;
            baseUnit = baseUnit24;
            priceSource = priceSource24;
            fixedPrice = fixedPrice24;
            uniswapMarket = uniswapMarket24;
            priceFeed = priceFeed24;
            priceFeedMultiplier = priceFeedMultiplier24;
        }
        if (i == 25) {
            underlying = underlying25;
            symbolHash = symbolHash25;
            baseUnit = baseUnit25;
            priceSource = priceSource25;
            fixedPrice = fixedPrice25;
            uniswapMarket = uniswapMarket25;
            priceFeed = priceFeed25;
            priceFeedMultiplier = priceFeedMultiplier25;
        }
        if (i == 26) {
            underlying = underlying26;
            symbolHash = symbolHash26;
            baseUnit = baseUnit26;
            priceSource = priceSource26;
            fixedPrice = fixedPrice26;
            uniswapMarket = uniswapMarket26;
            priceFeed = priceFeed26;
            priceFeedMultiplier = priceFeedMultiplier26;
        }
        if (i == 27) {
            underlying = underlying27;
            symbolHash = symbolHash27;
            baseUnit = baseUnit27;
            priceSource = priceSource27;
            fixedPrice = fixedPrice27;
            uniswapMarket = uniswapMarket27;
            priceFeed = priceFeed27;
            priceFeedMultiplier = priceFeedMultiplier27;
        }
        if (i == 28) {
            underlying = underlying28;
            symbolHash = symbolHash28;
            baseUnit = baseUnit28;
            priceSource = priceSource28;
            fixedPrice = fixedPrice28;
            uniswapMarket = uniswapMarket28;
            priceFeed = priceFeed28;
            priceFeedMultiplier = priceFeedMultiplier28;
        }
        if (i == 29) {
            underlying = underlying29;
            symbolHash = symbolHash29;
            baseUnit = baseUnit29;
            priceSource = priceSource29;
            fixedPrice = fixedPrice29;
            uniswapMarket = uniswapMarket29;
            priceFeed = priceFeed29;
            priceFeedMultiplier = priceFeedMultiplier29;
        }
        if (i == 30) {
            underlying = underlying30;
            symbolHash = symbolHash30;
            baseUnit = baseUnit30;
            priceSource = priceSource30;
            fixedPrice = fixedPrice30;
            uniswapMarket = uniswapMarket30;
            priceFeed = priceFeed30;
            priceFeedMultiplier = priceFeedMultiplier30;
        }
        if (i == 31) {
            underlying = underlying31;
            symbolHash = symbolHash31;
            baseUnit = baseUnit31;
            priceSource = priceSource31;
            fixedPrice = fixedPrice31;
            uniswapMarket = uniswapMarket31;
            priceFeed = priceFeed31;
            priceFeedMultiplier = priceFeedMultiplier31;
        }
        if (i == 32) {
            underlying = underlying32;
            symbolHash = symbolHash32;
            baseUnit = baseUnit32;
            priceSource = priceSource32;
            fixedPrice = fixedPrice32;
            uniswapMarket = uniswapMarket32;
            priceFeed = priceFeed32;
            priceFeedMultiplier = priceFeedMultiplier32;
        }
        if (i == 33) {
            underlying = underlying33;
            symbolHash = symbolHash33;
            baseUnit = baseUnit33;
            priceSource = priceSource33;
            fixedPrice = fixedPrice33;
            uniswapMarket = uniswapMarket33;
            priceFeed = priceFeed33;
            priceFeedMultiplier = priceFeedMultiplier33;
        }
        if (i == 34) {
            underlying = underlying34;
            symbolHash = symbolHash34;
            baseUnit = baseUnit34;
            priceSource = priceSource34;
            fixedPrice = fixedPrice34;
            uniswapMarket = uniswapMarket34;
            priceFeed = priceFeed34;
            priceFeedMultiplier = priceFeedMultiplier34;
        }

        return TokenConfig({
            underlying: underlying,
            symbolHash: symbolHash,
            baseUnit: baseUnit,
            priceSource: priceSource,
            fixedPrice: fixedPrice,
            uniswapMarket: uniswapMarket,
            priceFeed: priceFeed,
            priceFeedMultiplier: priceFeedMultiplier,
            isUniswapReversed:
                ((isUniswapReversed >> i) & uint256(1)) == 1 ? true : false
        });
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
     * @notice Get the config for the priceFeed
     * @param priceFeed The address of the priceFeed of the config to get
     * @return The config object
     */
    function getTokenConfigByPriceFeed(AggregatorInterface priceFeed) public view returns (TokenConfig memory) {
        uint index = getPriceFeedIndex(priceFeed);
        if (index != type(uint).max) {
            return getTokenConfig(index);
        }

        revert("token config not found");
    }

    /**
     * @notice Get the config for the symbolHash
     * @param symbolHash The keccack256 of the symbol of the config to get
     * @return The config object
     */
    function getTokenConfigBySymbolHash(bytes32 symbolHash) public view returns (TokenConfig memory) {
        uint index = getSymbolHashIndex(symbolHash);
        if (index != type(uint).max) {
            return getTokenConfig(index);
        }

        revert("token config not found");
    }

    /**
     * @notice Get the config for an underlying asset
     * @param underlying The address of the underlying asset of the config to get
     * @return The config object
     */
    function getTokenConfigByUnderlying(address underlying) public view returns (TokenConfig memory) {
        uint index = getUnderlyingIndex(underlying);
        if (index != type(uint).max) {
            return getTokenConfig(index);
        }

        revert("token config not found");
    }
}
