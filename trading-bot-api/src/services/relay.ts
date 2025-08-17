import axios from 'axios';

// Relay API Types based on the documentation
export interface RelayQuoteRequest {
  user: string;
  recipient: string;
  originChainId: number;
  destinationChainId: number;
  originCurrency: string;
  destinationCurrency: string;
  amount: string;
  tradeType?: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  txs?: Array<{
    to: string;
    value: string;
    data: string;
  }>;
  txsGasLimit?: number;
  authorizationList?: Array<{
    chainId: number;
    address: string;
    nonce: number;
    yParity: number;
    r: string;
    s: string;
  }>;
  additionalData?: {
    userPublicKey?: string;
  };
  referrer?: string;
  referrerAddress?: string;
  refundTo?: string;
  refundOnOrigin?: boolean;
  topupGas?: boolean;
  topupGasAmount?: string;
  useReceiver?: boolean;
  enableTrueExactOutput?: boolean;
  protocolVersion?: string;
  explicitDeposit?: boolean;
  useExternalLiquidity?: boolean;
  useFallbacks?: boolean;
  usePermit?: boolean;
  useDepositAddress?: boolean;
  slippageTolerance?: string;
  latePaymentSlippageTolerance?: string;
  appFees?: Array<{
    recipient: string;
    fee: string;
  }>;
  gasLimitForDepositSpecifiedTxs?: number;
  forceSolverExecution?: boolean;
  subsidizeFees?: boolean;
  maxSubsidizationAmount?: string;
  includedSwapSources?: string[];
  excludedSwapSources?: string[];
  originGasOverhead?: number;
  depositFeePayer?: string;
}

export interface RelayCurrency {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  metadata: {
    logoURI: string;
    verified: boolean;
    isNative: boolean;
  };
}

export interface RelayAmount {
  currency: RelayCurrency;
  amount: string;
  amountFormatted: string;
  amountUsd: string;
  minimumAmount: string;
}

export interface RelayQuoteStep {
  id: string;
  action: string;
  description: string;
  kind: string;
  requestId: string;
  items: Array<{
    status: string;
    data: {
      from: string;
      to: string;
      data: string;
      value: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      chainId: number;
    };
    check: {
      endpoint: string;
      method: string;
    };
  }>;
}

export interface RelayQuoteResponse {
  steps: RelayQuoteStep[];
  fees: {
    gas: RelayAmount;
    relayer: RelayAmount;
    relayerGas: RelayAmount;
    relayerService: RelayAmount;
    app: RelayAmount;
    subsidized: RelayAmount;
  };
  details: {
    operation: string;
    sender: string;
    recipient: string;
    currencyIn: RelayAmount;
    currencyOut: RelayAmount;
    currencyGasTopup: RelayAmount;
    totalImpact: {
      usd: string;
      percent: string;
    };
    swapImpact: {
      usd: string;
      percent: string;
    };
    expandedPriceImpact: {
      swap: { usd: string };
      execution: { usd: string };
      relay: { usd: string };
      app: { usd: string };
    };
    rate: string;
    slippageTolerance: {
      origin: {
        usd: string;
        value: string;
        percent: string;
      };
      destination: {
        usd: string;
        value: string;
        percent: string;
      };
    };
    timeEstimate: number;
    userBalance: string;
    fallbackType: string;
  };
  protocol: {
    v2: {
      orderId: string;
      paymentDetails: {
        chainId: string;
        depository: string;
        currency: string;
        amount: string;
      };
    };
  };
}

export interface RelayExecutionRequest {
  user: string;
  txs: Array<{
    to: string;
    value: string;
    data: string;
    gasLimit?: string;
  }>;
  source: string;
}

export interface RelayExecutionResponse {
  requestId: string;
  status: string;
  steps: RelayQuoteStep[];
}

export interface RelayExecutionStatus {
  requestId: string;
  status: 'pending' | 'success' | 'failure';
  txHash?: string;
  error?: string;
  details?: any;
}

// Chain ID mappings for all supported networks
export const CHAIN_IDS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  CRONOS: 25,
  BSC: 56,
  GNOSIS: 100,
  UNICHAIN: 130,
  POLYGON: 137,
  SONIC: 146,
  MANTA_PACIFIC: 169,
  MINT: 185,
  BOBA: 288,
  ZKSYNC: 324,
  SHAPE: 360,
  APPCHAIN: 466,
  WORLD_CHAIN: 480,
  REDSTONE: 690,
  FLOW_EVM: 747,
  HYPEREVM: 999,
  METIS: 1088,
  POLYGON_ZKEVM: 1101,
  LISK: 1135,
  SEI: 1329,
  HYPERLIQUID: 1337,
  PERENNIAL: 1424,
  STORY: 1514,
  GRAVITY: 1625,
  SONEIUM: 1868,
  SWELLCHAIN: 1923,
  SANKO: 1996,
  RONIN: 2020,
  ABSTRACT: 2741,
  MORPH: 2818,
  HYCHAIN: 2911,
  MANTLE: 5000,
  SUPERSEED: 5330,
  CYBER: 7560,
  POWERLOOM_V2: 7869,
  ARENA_Z: 7897,
  B3: 8333,
  BASE: 8453,
  ONCHAIN_POINTS: 17071,
  APECHAIN: 33139,
  FUNKI: 33979,
  MODE: 34443,
  ARBITRUM: 42161,
  ARBITRUM_NOVA: 42170,
  CELO: 42220,
  HEMI: 43111,
  AVALANCHE: 43114,
  GUNZ: 43419,
  ZIRCUIT: 48900,
  SUPERPOSITION: 55244,
  INK: 57073,
  LINEA: 59144,
  BOB: 60808,
  ANIMECHAIN: 69000,
  APEX: 70700,
  BOSS: 70701,
  BERACHAIN: 80094,
  BLAST: 81457,
  PLUME: 98866,
  TAIKO: 167000,
  SCROLL: 534352,
  ZERO_NETWORK: 543210,
  XAI: 660279,
  KATANA: 747474,
  FORMA: 984122,
  ZORA: 7777777,
  BITCOIN: 8253038,
  ECLIPSE: 9286185,
  SOON: 9286186,
  CORN: 21000000,
  SUI: 103665049,
  DEGEN: 666666666,
  SOLANA: 792703809,
  ANCIENT8: 888888888,
  RARI: 1380012617,
} as const;

// Comprehensive token addresses for all supported chains
export const TOKEN_ADDRESSES = {
  [CHAIN_IDS.ETHEREUM]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    APE: '0x4d224452801aced8b2f0aebe155379bb5d594381',
    ANIME: '0x4dc26fc5854e7648a064a4abd590bbe71724c277',
    PLUME: '0x4c1746a800d224393fe2470c70a35717ed4ea5f1',
    GOD: '0xb5130f4767ab0acc579f25a76e8f9e977cb3f948',
    CBBTC: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
    TOPIA: '0xccccb68e1a848cbdb5b60a974e07aae143ed40c3',
    POWER: '0x429f0d8233e517f9acf6f0c8293bf35804063a83',
    OMI: '0xed35af169af46a02ee13b9d79eb57d6d68c1749e',
    SIPHER: '0x9f52c8ecbee10e00d9faaac5ee9ba0ff6550f511',
    G: '0x9c7beba8f6ef6643abd725e45a4e8387ef260649',
  },
  [CHAIN_IDS.OPTIMISM]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    USDT: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x68f180fcce6836688e9084f035309e29bf0a2095',
    OP: '0x4200000000000000000000000000000000000042',
    SIPHER: '0xb94944669f7967e16588e55ac41be0d5ef399dcd',
    DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  },
  [CHAIN_IDS.CRONOS]: {
    CRO: '0x0000000000000000000000000000000000000000',
    USDC: '0xc21223249ca28397b4b6541dffaecc539bff0c59',
    WCRO: '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
  },
  [CHAIN_IDS.BSC]: {
    BNB: '0x0000000000000000000000000000000000000000',
    USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    USDT: '0x55d398326f99059ff775485246999027b3197955',
    WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    WBTC: '0x0555e30da8f98308edb960aa94c0db47230d2b9c',
    G: '0x9c7beba8f6ef6643abd725e45a4e8387ef260649',
    DAI: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
  },
  [CHAIN_IDS.GNOSIS]: {
    XDAI: '0x0000000000000000000000000000000000000000',
    USDC: '0x2a22f9c3b484c3629090feed35f17ff8f88f76f0',
  },
  [CHAIN_IDS.UNICHAIN]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x078d782b760474a361dda0af3839290b0ef57ad6',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  [CHAIN_IDS.POLYGON]: {
    POL: '0x0000000000000000000000000000000000000000',
    MATIC: '0x0000000000000000000000000000000000000000',
    USDC: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    WPOL: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    WBTC: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    DAI: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    'USDC.E': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  },
  [CHAIN_IDS.SONIC]: {
    S: '0x0000000000000000000000000000000000000000',
    USDC: '0x29219dd400f2bf60e5a23d13be72b486d4038894',
    WS: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
  },
  [CHAIN_IDS.BASE]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    USDT: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x0555e30da8f98308edb960aa94c0db47230d2b9c',
    DEGEN: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    GOD: '0xb5130f4767ab0acc579f25a76e8f9e977cb3f948',
    POP: '0xc9ef0e04038f64d6f759bd73b4b1cb6c78c59daa',
    CBBTC: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
    LRDS: '0xb676f87a6e701f0de8de5ab91b56b66109766db1',
    OMI: '0x3792dbdd07e87413247df995e692806aa13d3299',
    DAI: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
    SIPHER: '0xd0d1e44fc9adaeb732f73ffc2429cd1db9cd4529',
  },
  [CHAIN_IDS.ARBITRUM]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    WETH: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    WBTC: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
    XAI: '0x4cb9a7ae498cedcbb5eae9f25736ae7d428c9d66',
    ANIME: '0x37a645648df29205c6261289983fb04ecd70b4b3',
    CBBTC: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
    DMT: '0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8',
    APE: '0x7f9fbf9bdd3f4105c478b996b648fe6e828a1e98',
    ARB: '0x912ce59144191c1204e64559fe8253a0e49e6548',
    LINK: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4',
    WEETH: '0x35751007a407ca6feffe80b3cb397736d2cf4dbe',
    PENDLE: '0x0c880f6761f1af8d9aa9c466984b80dab9a8c9e8',
    'USDC.E': '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    WSTETH: '0x5979d7b546e38e414f7e9822514be443a4800529',
    T: '0x30a538effd91acefb1b12ce9bc0074ed18c9dfc9',
    GHO: '0x7dff72693f6a4149b17e7c6314655f6a9f7c8b33',
    USDE: '0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34',
    RWA: '0x3096e7bfd0878cc65be71f8899bc4cfb57187ba3',
    CRV: '0x11cdb42b0eb46d95f990bedd4695a6e3fa034978',
    AAVE: '0xba5ddd1f9d7f570dc94a51479a000e3bce967196',
    EZETH: '0x2416092f143378750bb29b79ed961ab195cceea5',
    TBTC: '0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40',
  },
  [CHAIN_IDS.KATANA]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x203a662b0bd271a6ed5a60edfbd04bfce608fd36',
    USDT: '0x2dca96907fde857dd3d816880a0df407eeb2d2f2',
    WBTC: '0x0913da6da4b42f538b445599b46bb4622342cf52',
    WETH: '0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62',
    RON: '0x32e17b01d0c73b2c9f0745b0b45b7a8b7f6b5e8f',
    AXS: '0x97a9107c1793bc407d6f527b77e7fff4d812bece',
    SLP: '0xa8754b9fa15fc18bb59458815510e40a12cd2014',
    WRON: '0xe514d9deb7966c8be0ca922de8a064264ea6bcd4',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
    UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    CRV: '0xd533a949740bb3306d119cc777fa900ba034cd52',
    SUSHI: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    YFI: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
    BAL: '0xba100000625a3754423978a60c9317c58a424e3d',
    COMP: '0xc00e94cb662c3520282e6f5717214004a7f26888',
    MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    SNX: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    LDO: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
    WSTETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
    STETH: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    MATIC: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    BNB: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
    AVAX: '0x85f138bfee4ef8e540890cfb48f620571d67eda3',
    FTM: '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
    ATOM: '0x8d983cb9388eac77af0474fa441c4815500cb7bb',
    DOT: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402',
    SOL: '0xd31a59c85ae9d8edefec411d448f90841571b89c',
  },
  [CHAIN_IDS.ZIRCUIT]: {
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
    UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    CRV: '0xd533a949740bb3306d119cc777fa900ba034cd52',
    COMP: '0xc00e94cb662c3520282e6f5717214004a7f26888',
    MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    SUSHI: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    SNX: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    YFI: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
    BAL: '0xba100000625a3754423978a60c9317c58a424e3d',
    LDO: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
    STETH: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    WSTETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
  },
  [CHAIN_IDS.FLOW_EVM]: {
    FLOW: '0x0000000000000000000000000000000000000000',
    USDC: '0xf1815bd50389c46847f0bda824ec8da914045d14',
    WFLOW: '0xd3bf53dac106a0290b0483ecbc89d40fcc961f3e',
    USDT: '0x2dca96907fde857dd3d816880a0df407eeb2d2f2',
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
    UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    CRV: '0xd533a949740bb3306d119cc777fa900ba034cd52',
    SUSHI: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    YFI: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
    BAL: '0xba100000625a3754423978a60c9317c58a424e3d',
    COMP: '0xc00e94cb662c3520282e6f5717214004a7f26888',
    MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    SNX: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    LDO: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
  },
  [CHAIN_IDS.AVALANCHE]: {
    AVAX: '0x0000000000000000000000000000000000000000',
    USDC: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    WAVAX: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    GUN: '0x26debd39d5ed069770406fca10a0e4f8d2c743eb',
  },
  [CHAIN_IDS.BERACHAIN]: {
    BERA: '0x0000000000000000000000000000000000000000',
    USDC: '0x549943e04f40284185054145c6e4e9568c1d3241',
    WBERA: '0x6969696969696969696969696969696969696969',
    WETH: '0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590',
  },
  [CHAIN_IDS.BLAST]: {
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0x4300000000000000000000000000000000000004',
  },
  [CHAIN_IDS.PLUME]: {
    PLUME: '0x0000000000000000000000000000000000000000',
    WPLUME: '0xea237441c92cae6fc17caaf9a7acb3f953be4bd1',
    PUSD: '0xdddd73f5df1f0dc31373357beac77545dc5a6f3f',
    USDC: '0x78add880a697070c1e765ac44d65323a0dcce913',
    WETH: '0xca59ca09e5602fae8b629dee83ffa819741f14be',
  },
  [CHAIN_IDS.MANTLE]: {
    MNT: '0x0000000000000000000000000000000000000000',
    USDC: '0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9',
  },
  [CHAIN_IDS.APECHAIN]: {
    APE: '0x0000000000000000000000000000000000000000',
    WAPE: '0x48b62137edfa95a428d35c09e44256a739f6b557',
    APEUSD: '0xa2235d059f80e176d931ef76b6c51953eb3fbef4',
    APEETH: '0xcf800f4948d16f23333508191b1b1591daf70438',
  },
  [CHAIN_IDS.FUNKI]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x747459b4b46453bcf52d27e7e243e40305238ef5',
    USDT: '0xcdf4cf03add9b9c086e01868d2eb8526b96df58f',
    SIPHER: '0x7d8b6cec10165119c4ac7843a1e02184789585d8',
  },
  [CHAIN_IDS.ARBITRUM_NOVA]: {
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0x722e8bdd2ce80a4422e880164f2079488e115365',
    USDC: '0x750ba8b76187092b0d1e87e28daaf484d1b5273b',
    GOD: '0xb5130f4767ab0acc579f25a76e8f9e977cb3f948',
  },
  [CHAIN_IDS.CELO]: {
    CELO: '0x0000000000000000000000000000000000000000',
    USDC: '0xceba9300f2b948710d2653dd7b07f33a8b32118c',
  },
  [CHAIN_IDS.TAIKO]: {
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0xa51894664a773981c6c112c43ce576f315d5b1b6',
  },
  [CHAIN_IDS.SCROLL]: {
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0x5300000000000000000000000000000000000004',
  },
  [CHAIN_IDS.ZERO_NETWORK]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x6a6394f47dd0baf794808f2749c09bd4ee874e70',
    WETH: '0xac98b49576b1c892ba6bfae08fe1bb0d80cf599c',
  },
  [CHAIN_IDS.XAI]: {
    XAI: '0x0000000000000000000000000000000000000000',
  },
  [CHAIN_IDS.ZORA]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDZC: '0xcccccccc7021b32ebb4e8c08314bd62f7c653ec4',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  [CHAIN_IDS.CORN]: {
    BTCN: '0x0000000000000000000000000000000000000000',
    USDC: '0xdf0b24095e15044538866576754f3c964e902ee6',
    WBTCN: '0xda5ddd7270381a7c2717ad10d1c0ecb19e3cdfb2',
  },
  [CHAIN_IDS.DEGEN]: {
    DEGEN: '0x0000000000000000000000000000000000000000',
  },
  [CHAIN_IDS.ANCIENT8]: {
    ETH: '0x0000000000000000000000000000000000000000',
  },
  [CHAIN_IDS.RARI]: {
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0xf037540e51d71b2d2b1120e8432ba49f29edfbd0',
    RARI: '0xcf78572a8fe97b2b9a4b9709f6a7d9a863c1b8e0',
  },
} as const;

export interface RelaySwapRequest {
  senderAddress: string;
  senderPrivateKey: string;
  recipientAddress: string;
  originSymbol: string;
  originBlockchain: string;
  destinationSymbol: string;
  destinationBlockchain: string;
  amount: string;
  isTest?: boolean;
}

export interface RelayAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
  txHash?: string;
}

export class RelayService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'https://api.relay.link', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  private getChainId(blockchain: string): number {
    const chainMap: Record<string, number> = {
      'ethereum': CHAIN_IDS.ETHEREUM,
      'polygon': CHAIN_IDS.POLYGON,
      'base': CHAIN_IDS.BASE,
      'arbitrum': CHAIN_IDS.ARBITRUM,
      'optimism': CHAIN_IDS.OPTIMISM,
      'bsc': CHAIN_IDS.BSC,
      'avalanche': CHAIN_IDS.AVALANCHE,
      'katana': CHAIN_IDS.KATANA,
      'zircuit': CHAIN_IDS.ZIRCUIT,
      'flow': CHAIN_IDS.FLOW_EVM,
      'flow-evm': CHAIN_IDS.FLOW_EVM,
      'flow_evm': CHAIN_IDS.FLOW_EVM,
      'cronos': CHAIN_IDS.CRONOS,
      'gnosis': CHAIN_IDS.GNOSIS,
      'unichain': CHAIN_IDS.UNICHAIN,
      'sonic': CHAIN_IDS.SONIC,
      'manta': CHAIN_IDS.MANTA_PACIFIC,
      'manta-pacific': CHAIN_IDS.MANTA_PACIFIC,
      'berachain': CHAIN_IDS.BERACHAIN,
      'blast': CHAIN_IDS.BLAST,
      'plume': CHAIN_IDS.PLUME,
      'mantle': CHAIN_IDS.MANTLE,
      'apechain': CHAIN_IDS.APECHAIN,
      'funki': CHAIN_IDS.FUNKI,
      'arbitrum-nova': CHAIN_IDS.ARBITRUM_NOVA,
      'celo': CHAIN_IDS.CELO,
      'taiko': CHAIN_IDS.TAIKO,
      'scroll': CHAIN_IDS.SCROLL,
      'zora': CHAIN_IDS.ZORA,
    };

    const chainId = chainMap[blockchain.toLowerCase()];
    if (!chainId) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
    
    return chainId;
  }

  private getTokenAddress(chainId: number, symbol: string): string {
    // This is a simplified mapping - in production, you'd want a more comprehensive token registry
    const chainTokens = TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES];
    if (!chainTokens) {
      throw new Error(`No token mappings available for chain ID: ${chainId}`);
    }

    const address = chainTokens[symbol.toUpperCase() as keyof typeof chainTokens];
    if (!address) {
      throw new Error(`Token ${symbol} not found for chain ID: ${chainId}`);
    }

    return address;
  }

  private getTokenDecimals(chainId: number, symbol: string): number {
    // Standard token decimals mapping
    const tokenDecimals: Record<string, number> = {
      // Native tokens
      'ETH': 18,
      'BNB': 18,
      'MATIC': 18,
      'POL': 18,
      'AVAX': 18,
      'FTM': 18,
      'CRO': 18,
      'XDAI': 18,
      'S': 18,
      'FLOW': 18,
      'BERA': 18,
      'PLUME': 18,
      'MNT': 18,
      'APE': 18,
      'CELO': 18,
      'XAI': 18,
      'DEGEN': 18,
      'BTCN': 8,
      
      // Wrapped tokens
      'WETH': 18,
      'WBNB': 18,
      'WPOL': 18,
      'WAVAX': 18,
      'WCRO': 18,
      'WS': 18,
      'WFLOW': 18,
      'WBERA': 18,
      'WPLUME': 18,
      'WAPE': 18,
      'WBTCN': 8,
      'WRON': 18,
      
      // Stablecoins
      'USDC': 6,
      'USDT': 6,
      'DAI': 18,
      'USDC.E': 6,
      'PUSD': 18,
      'APEUSD': 18,
      'USDZC': 18,
      
      // Other tokens
      'WBTC': 8,
      'CBBTC': 8,
      'TBTC': 18,
      'OP': 18,
      'ARB': 18,
      'LINK': 18,
      'UNI': 18,
      'AAVE': 18,
      'CRV': 18,
      'COMP': 18,
      'MKR': 18,
      'SNX': 18,
      'YFI': 18,
      'BAL': 18,
      'SUSHI': 18,
      'LDO': 18,
      'STETH': 18,
      'WSTETH': 18,
      'WEETH': 18,
      'EZETH': 18,
      'PENDLE': 18,
      'T': 18,
      'GHO': 18,
      'USDE': 18,
      'RWA': 18,
      'RON': 18,
      'AXS': 18,
      'SLP': 18,
      'ANIME': 18,
      'DMT': 18,
      'GOD': 18,
      'TOPIA': 18,
      'POWER': 18,
      'OMI': 18,
      'SIPHER': 18,
      'G': 18,
      'POP': 18,
      'LRDS': 18,
      'GUN': 18,
      'RARI': 18,
      'APEETH': 18,
    };

    const decimals = tokenDecimals[symbol.toUpperCase()];
    if (decimals === undefined) {
      // Default to 18 decimals for ERC20 tokens if not specified
      console.warn(`⚠️  Unknown decimals for token ${symbol}, defaulting to 18`);
      return 18;
    }

    return decimals;
  }

  async getQuote(swapRequest: RelaySwapRequest): Promise<RelayQuoteResponse> {
    try {
      console.log('🔄 Getting quote from Relay API...');
      console.log(`   ${swapRequest.amount} ${swapRequest.originSymbol} (${swapRequest.originBlockchain}) → ${swapRequest.destinationSymbol} (${swapRequest.destinationBlockchain || swapRequest.originBlockchain})`);

      const originChainId = this.getChainId(swapRequest.originBlockchain);
      // If no destination blockchain specified, default to same as origin
      const destinationChainId = swapRequest.destinationBlockchain 
        ? this.getChainId(swapRequest.destinationBlockchain)
        : originChainId;
      const originCurrency = this.getTokenAddress(originChainId, swapRequest.originSymbol);
      const destinationCurrency = this.getTokenAddress(destinationChainId, swapRequest.destinationSymbol);

      // Check if this is a cross-chain operation
      const isCrossChain = originChainId !== destinationChainId;
      
      // Convert amount to smallest unit if it's a decimal
      let formattedAmount = swapRequest.amount;
      if (swapRequest.amount.includes('.')) {
        // Convert decimal to smallest unit based on token decimals
        const decimals = this.getTokenDecimals(originChainId, swapRequest.originSymbol);
        const { ethers } = await import('ethers');
        formattedAmount = ethers.parseUnits(swapRequest.amount, decimals).toString();
        console.log(`💱 Converted ${swapRequest.amount} to ${formattedAmount} (${decimals} decimals)`);
      }

      // Use MINIMAL parameters for cross-chain (proven to work)
      const quoteRequest: any = {
        user: swapRequest.senderAddress,
        recipient: swapRequest.recipientAddress,
        originChainId,
        destinationChainId,
        originCurrency,
        destinationCurrency,
        amount: formattedAmount,
        tradeType: 'EXACT_INPUT' // REQUIRED for cross-chain
      };

      // Only add extra parameters for same-chain swaps
      if (!isCrossChain) {
        quoteRequest.refundOnOrigin = true;
        quoteRequest.topupGas = true;
        quoteRequest.useExternalLiquidity = true;
        quoteRequest.useFallbacks = true;
        quoteRequest.protocolVersion = 'v1';
      }

      const response = await axios.post(`${this.baseUrl}/quote`, quoteRequest, {
        headers: this.getHeaders(),
        timeout: 30000,
      });

      const quote = response.data;
      
      // Validate cross-chain quotes to ensure they're actually cross-chain
      if (isCrossChain) {
        const inputChainId = quote.details?.currencyIn?.currency?.chainId;
        const outputChainId = quote.details?.currencyOut?.currency?.chainId;
        
        if (inputChainId === outputChainId && inputChainId === originChainId) {
          throw new Error(`Cross-chain quote failed: Relay API returned same-chain quote (${inputChainId}) instead of cross-chain (${originChainId} → ${destinationChainId}). Cross-chain route may not be available.`);
        }
        
        console.log(`✅ Cross-chain quote validated: ${inputChainId} → ${outputChainId}`);
      }

      console.log('✅ Quote received successfully');
      return quote;

    } catch (error) {
      console.error('❌ Relay quote error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`Relay Quote Error: ${errorMessage}`);
      }

      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async executeSwap(swapRequest: RelaySwapRequest): Promise<RelayAPIResponse> {
    try {
      console.log('🔄 Executing swap via Relay API...');
      console.log(`   ${swapRequest.amount} ${swapRequest.originSymbol} (${swapRequest.originBlockchain}) → ${swapRequest.destinationSymbol} (${swapRequest.destinationBlockchain || swapRequest.originBlockchain})`);

      // First, get a quote to get transaction details
      const quote = await this.getQuote(swapRequest);
      
      if (!quote.steps || quote.steps.length === 0) {
        throw new Error('No execution steps returned from quote');
      }

      console.log(`📋 Executing ${quote.steps.length} transaction steps via direct on-chain execution...`);

      // Extract transaction data from the quote
      const step = quote.steps[0];
      if (!step.items || step.items.length === 0) {
        throw new Error('No transaction items in step');
      }

      const txData = step.items[0].data;
      console.log(`📤 Transaction details:`);
      console.log(`   To: ${txData.to}`);
      console.log(`   Value: ${txData.value} wei`);
      console.log(`   Chain: ${txData.chainId}`);

      // Execute directly on-chain using ethers (proven working method)
      const { ethers } = await import('ethers');
      
      // Get RPC URL for the origin chain
      const rpcUrl = this.getRpcUrl(txData.chainId);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(swapRequest.senderPrivateKey, provider);

      // Verify wallet address matches
      if (wallet.address.toLowerCase() !== swapRequest.senderAddress.toLowerCase()) {
        throw new Error(`Wallet address mismatch: ${wallet.address} vs ${swapRequest.senderAddress}`);
      }

      // Check balance
      const balance = await provider.getBalance(wallet.address);
      const requiredAmount = BigInt(txData.value || '0');
      console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`💸 Required amount: ${ethers.formatEther(requiredAmount)} ETH`);

      if (balance < requiredAmount) {
        throw new Error(`Insufficient balance. Available: ${ethers.formatEther(balance)} ETH, Required: ${ethers.formatEther(requiredAmount)} ETH`);
      }

      // Prepare and send transaction
      const transaction: any = {
        to: txData.to,
        value: txData.value || '0',
        data: txData.data,
        maxFeePerGas: txData.maxFeePerGas,
        maxPriorityFeePerGas: txData.maxPriorityFeePerGas
      };

      // Estimate gas limit
      try {
        const estimatedGas = await provider.estimateGas(transaction);
        transaction.gasLimit = estimatedGas;
        console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);
      } catch (gasError) {
        console.warn('⚠️  Gas estimation failed, using default');
        transaction.gasLimit = '100000'; // Safe default
      }

      console.log('🚀 Sending transaction...');
      const txResponse = await wallet.sendTransaction(transaction);
      console.log(`✅ Transaction sent: ${txResponse.hash}`);

      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const receipt = await txResponse.wait(1);
      
      if (receipt && receipt.status === 1) {
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

        // Monitor cross-chain completion using the step's requestId
        console.log('🔍 Monitoring cross-chain completion...');
        let attempts = 0;
        const maxAttempts = 20;
        let finalStatus = 'pending';
        let crossChainTxHash = '';

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
          attempts++;

          try {
            const statusResponse = await this.getExecutionStatus(step.requestId);
            finalStatus = statusResponse.status;
            
            if (statusResponse.txHash) {
              crossChainTxHash = statusResponse.txHash;
            }

            console.log(`📊 Cross-chain status ${attempts}: ${finalStatus}`);
            
            if (finalStatus === 'success') {
              console.log('✅ Cross-chain swap completed successfully!');
              break;
            } else if (finalStatus === 'failure') {
              console.error(`❌ Cross-chain completion failed: ${statusResponse.error}`);
              break;
            }
          } catch (statusError) {
            console.warn(`⚠️  Status check ${attempts} failed`);
          }
        }

        return {
          success: finalStatus === 'success' || finalStatus === 'pending',
          data: {
            quote,
            originTxHash: txResponse.hash,
            crossChainTxHash,
            requestId: step.requestId,
            finalStatus,
            receipt
          },
          requestId: step.requestId,
          txHash: txResponse.hash,
          error: finalStatus === 'failure' ? 'Cross-chain completion failed' : undefined,
        };

      } else {
        throw new Error('Transaction failed on origin chain');
      }

    } catch (error) {
      console.error('❌ Relay swap execution error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async executeBlockchainTransaction(
    txData: any, 
    privateKey: string, 
    requestId: string
  ): Promise<{ hash: string; requestId: string; receipt?: any } | null> {
    try {
      // Dynamic import of ethers to avoid issues if not installed
      const { ethers } = await import('ethers');
      
      // Get the appropriate RPC URL based on chain ID
      const rpcUrl = this.getRpcUrl(txData.chainId);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Verify wallet address matches
      if (wallet.address.toLowerCase() !== txData.from.toLowerCase()) {
        throw new Error(`Wallet address mismatch: ${wallet.address} vs ${txData.from}`);
      }

      // Get current gas price and nonce
      const [gasPrice, nonce] = await Promise.all([
        provider.getFeeData(),
        provider.getTransactionCount(wallet.address)
      ]);

      // Prepare transaction
      const transaction: any = {
        to: txData.to,
        value: txData.value || '0',
        data: txData.data || '0x',
        nonce: nonce,
        chainId: txData.chainId,
      };

      // Use EIP-1559 gas pricing if available
      if (txData.maxFeePerGas && txData.maxPriorityFeePerGas) {
        transaction.maxFeePerGas = txData.maxFeePerGas;
        transaction.maxPriorityFeePerGas = txData.maxPriorityFeePerGas;
        transaction.type = 2; // EIP-1559
      } else if (gasPrice.gasPrice) {
        transaction.gasPrice = gasPrice.gasPrice;
      }

      // Estimate gas limit
      try {
        const estimatedGas = await provider.estimateGas(transaction);
        transaction.gasLimit = estimatedGas;
        console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);
      } catch (gasError) {
        console.warn('⚠️  Gas estimation failed, using provided gas limit');
        transaction.gasLimit = txData.gasLimit || '21000';
      }

      // Check balance before sending
      const balance = await provider.getBalance(wallet.address);
      const totalCost = BigInt(transaction.value || '0') + 
                       (BigInt(transaction.gasLimit || '21000') * BigInt(transaction.gasPrice || transaction.maxFeePerGas || '0'));
      
      console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`💸 Transaction cost: ${ethers.formatEther(totalCost)} ETH`);

      if (balance < totalCost) {
        throw new Error('Insufficient balance for transaction');
      }

      // Send transaction
      console.log('📤 Sending transaction...');
      const txResponse = await wallet.sendTransaction(transaction);
      
      console.log(`✅ Transaction sent: ${txResponse.hash}`);
      console.log('⏳ Waiting for confirmation...');
      
      // Wait for confirmation
      const receipt = await txResponse.wait(1);
      
      if (receipt) {
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      }

      return {
        hash: txResponse.hash,
        receipt: receipt,
        requestId: requestId
      };

    } catch (error) {
      console.error('❌ Blockchain transaction error:', error);
      return null;
    }
  }

  private getRpcUrl(chainId: number): string {
    const rpcUrls: Record<number, string> = {
      [CHAIN_IDS.ETHEREUM]: 'https://ethereum.publicnode.com',
      [CHAIN_IDS.POLYGON]: 'https://polygon-bor-rpc.publicnode.com',
      [CHAIN_IDS.BASE]: 'https://base.publicnode.com',
      [CHAIN_IDS.ARBITRUM]: 'https://arbitrum-one.publicnode.com',
      [CHAIN_IDS.OPTIMISM]: 'https://optimism.publicnode.com',
      [CHAIN_IDS.KATANA]: 'https://rpc.katana.network',
      [CHAIN_IDS.ZIRCUIT]: 'https://mainnet.zircuit.com',
      [CHAIN_IDS.FLOW_EVM]: 'https://mainnet.evm.nodes.onflow.org',
      [CHAIN_IDS.BSC]: 'https://bsc-dataseed.binance.org',
      [CHAIN_IDS.AVALANCHE]: 'https://api.avax.network/ext/bc/C/rpc',
      [CHAIN_IDS.CRONOS]: 'https://evm.cronos.org',
      [CHAIN_IDS.GNOSIS]: 'https://rpc.gnosischain.com',
      [CHAIN_IDS.UNICHAIN]: 'https://rpc.unichain.org',
      [CHAIN_IDS.SONIC]: 'https://rpc.soniclabs.com',
      [CHAIN_IDS.MANTA_PACIFIC]: 'https://pacific-rpc.manta.network/http',
      [CHAIN_IDS.BERACHAIN]: 'https://artio.rpc.berachain.com',
      [CHAIN_IDS.BLAST]: 'https://rpc.blast.io',
      [CHAIN_IDS.PLUME]: 'https://rpc.plumenetwork.xyz',
      [CHAIN_IDS.MANTLE]: 'https://rpc.mantle.xyz',
      [CHAIN_IDS.APECHAIN]: 'https://rpc.apechain.com',
      [CHAIN_IDS.FUNKI]: 'https://rpc-mainnet.funkichain.com',
      [CHAIN_IDS.ARBITRUM_NOVA]: 'https://nova.arbitrum.io/rpc',
      [CHAIN_IDS.CELO]: 'https://forno.celo.org',
      [CHAIN_IDS.TAIKO]: 'https://rpc.mainnet.taiko.xyz',
      [CHAIN_IDS.SCROLL]: 'https://rpc.scroll.io',
      [CHAIN_IDS.ZORA]: 'https://rpc.zora.energy',
    };

    const rpcUrl = rpcUrls[chainId];
    if (!rpcUrl) {
      throw new Error(`No RPC URL configured for chain ID: ${chainId}`);
    }

    return rpcUrl;
  }

  private async monitorTransactionStatus(requestId: string, txHash: string): Promise<boolean> {
    console.log(`🔍 Monitoring cross-chain transaction status...`);
    
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.getExecutionStatus(requestId);

        console.log(`📊 Status check ${attempts + 1}: ${status.status}`);

        if (status.status === 'success') {
          console.log('✅ Cross-chain swap completed successfully!');
          return true;
        } else if (status.status === 'failure') {
          console.error(`❌ Cross-chain swap failed: ${status.error}`);
          return false;
        } else if (status.status === 'pending') {
          console.log(`⏳ Cross-chain swap still processing...`);
        }

      } catch (error) {
        console.warn(`⚠️  Status check failed: ${error}`);
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }

    console.warn('⏰ Status monitoring timed out');
    return false;
  }

  async getExecutionStatus(requestId: string): Promise<RelayExecutionStatus> {
    try {
      console.log(`🔍 Checking execution status for request: ${requestId}`);
      
      const response = await axios.get(`${this.baseUrl}/intents/status`, {
        params: { requestId },
        headers: this.getHeaders(),
        timeout: 10000,
      });

      return {
        requestId,
        status: response.data.status || 'pending',
        txHash: response.data.txHash,
        error: response.data.error,
        details: response.data,
      };

    } catch (error) {
      console.error('Error checking execution status:', error);
      return {
        requestId,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSupportedChains(): Promise<Array<{ chainId: number; name: string }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/chains`, {
        headers: this.getHeaders(),
      });
      
      return response.data.chains || Object.entries(CHAIN_IDS).map(([name, chainId]) => ({
        chainId,
        name: name.toLowerCase(),
      }));
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      // Return default supported chains
      return Object.entries(CHAIN_IDS).map(([name, chainId]) => ({
        chainId,
        name: name.toLowerCase(),
      }));
    }
  }

  async getCurrencies(chainIds?: number[]): Promise<RelayCurrency[]> {
    try {
      const requestBody: any = {};
      if (chainIds) {
        requestBody.chainIds = chainIds;
      }

      const response = await axios.post(`${this.baseUrl}/currencies`, requestBody, {
        headers: this.getHeaders(),
      });
      
      return response.data.currencies || [];
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return [];
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: this.getHeaders(),
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Relay health check failed:', error);
      return false;
    }
  }

  // Helper method to validate swap request
  validateSwapRequest(swapRequest: RelaySwapRequest): string[] {
    const errors: string[] = [];

    if (!swapRequest.senderAddress) {
      errors.push('Sender address is required');
    }

    if (!swapRequest.senderPrivateKey) {
      errors.push('Sender private key is required');
    }

    if (!swapRequest.recipientAddress) {
      errors.push('Recipient address is required');
    }

    if (!swapRequest.originSymbol) {
      errors.push('Origin token symbol is required');
    }

    if (!swapRequest.originBlockchain) {
      errors.push('Origin blockchain is required');
    }

    if (!swapRequest.destinationSymbol) {
      errors.push('Destination token symbol is required');
    }

    // Destination blockchain is now optional - defaults to origin blockchain if not specified

    if (!swapRequest.amount || isNaN(parseFloat(swapRequest.amount)) || parseFloat(swapRequest.amount) <= 0) {
      errors.push('Valid amount is required');
    }

    // Validate supported blockchains
    try {
      this.getChainId(swapRequest.originBlockchain);
    } catch {
      errors.push(`Unsupported origin blockchain: ${swapRequest.originBlockchain}`);
    }

    // Validate destination blockchain only if provided
    if (swapRequest.destinationBlockchain) {
      try {
        this.getChainId(swapRequest.destinationBlockchain);
      } catch {
        errors.push(`Unsupported destination blockchain: ${swapRequest.destinationBlockchain}`);
      }
    }

    return errors;
  }

  // Method to estimate swap output
  async getSwapQuote(
    originSymbol: string,
    originBlockchain: string,
    destinationSymbol: string,
    destinationBlockchain: string,
    amount: string
  ): Promise<any> {
    try {
      console.log(`💭 Getting quote for ${amount} ${originSymbol} → ${destinationSymbol}`);
      
      const swapRequest: RelaySwapRequest = {
        senderAddress: '0x0000000000000000000000000000000000000000', // Placeholder for quote
        senderPrivateKey: '', // Not needed for quote
        recipientAddress: '0x0000000000000000000000000000000000000000', // Placeholder for quote
        originSymbol,
        originBlockchain,
        destinationSymbol,
        destinationBlockchain,
        amount,
      };

      const quote = await this.getQuote(swapRequest);
      
      return {
        estimatedOutput: quote.details.currencyOut.amountFormatted,
        exchangeRate: quote.details.rate,
        fees: {
          gas: quote.fees.gas.amountFormatted,
          relayer: quote.fees.relayer.amountFormatted,
          total: quote.fees.gas.amountUsd,
        },
        timeEstimate: quote.details.timeEstimate,
        priceImpact: quote.details.totalImpact.percent,
      };
    } catch (error) {
      console.error('Error getting swap quote:', error);
      return null;
    }
  }
}
