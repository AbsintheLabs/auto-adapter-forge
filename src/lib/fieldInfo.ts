// Field descriptions for info tooltips
export const FIELD_INFO: Record<string, string> = {
  // Network fields
  chainId: "The blockchain network ID (e.g., 1 for Ethereum, 43111 for Hemi). This determines which network the adapter will query.",
  finality: "Number of blocks to wait before considering a block final. Higher values increase safety but delay data availability.",
  gatewayUrl: "The Subsquid gateway URL for the selected chain. Automatically set based on chain ID.",
  rpcUrl: "Your RPC endpoint URL for the blockchain. Can use ${env:RPC_URL} placeholder.",
  
  // Range fields
  fromBlock: "The starting block number to begin indexing from. Must be a valid block number on the selected chain.",
  toBlock: "Optional ending block number. If not specified, indexing continues to the latest block.",
  
  // Sink fields
  csvPath: "File path where CSV output will be written. Relative to the adapter's working directory.",
  enableStdout: "Enable stdout sink to print data to console/logs. Useful for debugging.",
  enableAbsinthe: "Enable Absinthe sink to send data to Absinthe API. Required for all adapters (ERC20 and Uniswap V2). Requires ABSINTHE_API_URL and ABSINTHE_API_KEY environment variables.",
  
  // General fields
  flushIntervalHours: "How often (in hours) to flush data to sinks. Lower values mean more frequent writes but higher overhead.",
  
  // ERC20 fields
  tokenContractAddress: "The Ethereum address of the ERC20 token contract to track holdings for.",
  pricingKind: "Pricing method: 'pegged' for fixed USD value, 'coingecko' for CoinGecko market price.",
  usdPegValue: "Fixed USD value per token (for pegged pricing). Used when token price doesn't change.",
  coingeckoId: "CoinGecko token ID (e.g., 'ethereum', 'bitcoin'). Used to fetch market prices from CoinGecko.",
  
  // Uniswap V2 fields
  poolAddress: "The Uniswap V2 pool contract address. This is the liquidity pool you want to track.",
  swapLegAddress: "The token address for the swap leg. This is the token being swapped in/out of the pool.",
  token0PricingKind: "Pricing method for token0 in the LP pool.",
  token0UsdPegValue: "Fixed USD value for token0 (if using pegged pricing).",
  token0CoingeckoId: "CoinGecko ID for token0 (if using coingecko pricing).",
  token1PricingKind: "Pricing method for token1 in the LP pool.",
  token1UsdPegValue: "Fixed USD value for token1 (if using pegged pricing).",
  token1CoingeckoId: "CoinGecko ID for token1 (if using coingecko pricing).",
};

