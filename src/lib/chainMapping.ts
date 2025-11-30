// Chain ID to Gateway URL mapping
export const CHAIN_ID_TO_GATEWAY_URL: Record<number, string> = {
  1: 'https://v2.archive.subsquid.io/network/ethereum-mainnet',
  137: 'https://v2.archive.subsquid.io/network/polygon-mainnet',
  42161: 'https://v2.archive.subsquid.io/network/arbitrum-one',
  8453: 'https://v2.archive.subsquid.io/network/base-mainnet',
  10: 'https://v2.archive.subsquid.io/network/optimism-mainnet',
  43111: 'https://v2.archive.subsquid.io/network/hemi-mainnet',
  1000: 'https://v2.archive.subsquid.io/network/solana-mainnet',
  56: 'https://v2.archive.subsquid.io/network/binance-mainnet',
  43114: 'https://v2.archive.subsquid.io/network/avalanche-mainnet',
  143: 'https://v2.archive.subsquid.io/network/monad-mainnet',
};

// Chain ID to Chain Name mapping for display
export const CHAIN_ID_TO_NAME: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  8453: 'Base',
  10: 'Optimism',
  43111: 'Hemi',
  56: 'BSC',
  43114: 'Avalanche',
  143: 'Monad',
};

// Chains that are NOT available in Etherscan V2 free tier - require manual fromBlock input
export const MANUAL_FROM_BLOCK_CHAINS = [
  43114, // Avalanche C-Chain - Not Available
  43113, // Avalanche Fuji Testnet - Not Available
  8453,  // Base Mainnet - Not Available
  84532, // Base Sepolia Testnet - Not Available
  56,    // BNB Smart Chain Mainnet - Not Available
  97,    // BNB Smart Chain Testnet - Not Available
  10,    // OP Mainnet - Not Available
  11155420, // OP Sepolia Testnet - Not Available
  43111, // Hemi - Not in Etherscan V2 support list
];

// Chains that support automatic fromBlock lookup via Etherscan V2 API
// All chains except those in MANUAL_FROM_BLOCK_CHAINS are supported
export const SCAN_SUPPORTED_CHAINS = [1, 137, 42161, 143]; // Examples: Ethereum, Polygon, Arbitrum, Monad (most chains are supported)

export const CHAIN_OPTIONS = Object.entries(CHAIN_ID_TO_NAME).map(([chainId, name]) => ({
  value: Number(chainId),
  label: `${name} (${chainId})`,
}));

export function getGatewayUrlForChainId(chainId: number): string | undefined {
  return CHAIN_ID_TO_GATEWAY_URL[chainId];
}

