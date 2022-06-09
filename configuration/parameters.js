module.exports = [
  "150000000000000000",
  1800,
  [
    {
      // "NAME": "ETH",
      cToken: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
      underlying: "0x0000000000000000000000000000000000000000",
      symbolHash: "0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4",
      baseUnit: "1000000000000000000",
      priceSource: "2",
      fixedPrice: "0",
      uniswapMarket: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
      reporter: "0x264BDDFD9D93D48d759FBDB0670bE1C6fDd50236",
      reporterMultiplier: "10000000000000000",
      isUniswapReversed: true
    },
    {
      // "NAME": "LINK",
      cToken: "0xFAce851a4921ce59e912d19329929CE6da6EB0c7",
      underlying: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      symbolHash: "0x921a3539bcb764c889432630877414523e7fbca00c211bc787aeae69e2e3a779",
      baseUnit: "1000000000000000000",
      priceSource: "2",
      fixedPrice: "0",
      uniswapMarket: "0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8",
      // TODO: Enter the ValidatorProxy address here
      reporter: "",
      reporterMultiplier: "10000000000000000",
      isUniswapReversed: false
    },
  ]
]