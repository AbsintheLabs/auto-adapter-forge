import { z } from 'zod';

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

// Chain ID to CoinGecko platform ID mapping
export const CHAIN_ID_TO_COINGECKO_PLATFORM: Record<number, string> = {
  1: 'ethereum',
  137: 'polygon-pos',
  42161: 'arbitrum-one',
  8453: 'base',
  10: 'optimistic-ethereum',
  56: 'binance-smart-chain',
  43114: 'avalanche',
  143: 'monad',
  43111: 'hemi',
};

// Uniswap V3 Factory and Position Manager addresses by chain
export const UNIV3_FACTORY_ADDRESSES: Record<number, string> = {
  1: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  137: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  42161: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  10: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  8453: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
  56: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
  43114: '0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD',
  143: '0x204faca1764b154221e35c0d20abb3c525710498',
  43111: '0xCdBCd51a5E8728E0AF4895ce5771b7d17fF71959',
};

export const UNIV3_POSITION_MANAGER_ADDRESSES: Record<number, string> = {
  1: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  137: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  42161: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  10: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  8453: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
  56: '0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613',
  43114: '0x655C406EBFa14EE2006250925e54ec43AD184f8B',
  143: '0x7197e214c0b767cfb76fb734ab638e2c192f4e53',
  43111: '0xe43ca1dee3f0fc1e2df73a0745674545f11a59f5',
};

// Etherscan V2 API base URL
export const ETHERSCAN_V2_BASE_URL = 'https://api.etherscan.io/v2/api';

// Chains that require manual fromBlock input
export const MANUAL_FROM_BLOCK_CHAINS = [
  43114, 43113, 8453, 84532, 56, 97, 10, 11155420, 43111,
];

// Base RPC URLs for each chain (Infura format)
export const RPC_BASE_URLS: Record<number, string> = {
  1: 'https://mainnet.infura.io/v3',
  137: 'https://polygon-mainnet.infura.io/v3',
  42161: 'https://arbitrum-mainnet.infura.io/v3',
  8453: 'https://base-mainnet.infura.io/v3',
  10: 'https://optimism-mainnet.infura.io/v3',
  43111: 'https://hemi-mainnet.infura.io/v3',
  1000: 'https://solana-mainnet.infura.io/v3',
  56: 'https://bsc-mainnet.infura.io/v3',
  43114: 'https://avalanche-mainnet.infura.io/v3',
  143: 'https://monad-mainnet.infura.io/v3',
};

// Environment schema
const envSchema = z.object({
  // Railway deployment feature flag
  ENABLE_RAILWAY_DEPLOYMENT: z.string().optional().transform(val => val === 'true' || val === '1'),
  // Railway vars are only required if Railway deployment is enabled
  RAILWAY_API_TOKEN: z.string().optional(),
  RAILWAY_WORKSPACE_ID: z.string().optional(),
  RAILWAY_TEMPLATE_ID: z.string().default("e671e590-fec4-4beb-8044-37f013a351e9"),
  // Core required vars
  RPC_API_KEY: z.string().min(1, "RPC_API_KEY is required"),
  ABSINTHE_API_KEY: z.string().min(1, "ABSINTHE_API_KEY is required"),
  ABSINTHE_API_URL: z.string().url().default("https://v2.adapters.absinthe.network"),
  COINGECKO_API_KEY: z.string().min(1, "COINGECKO_API_KEY is required"),
  ETHERSCAN_API_KEY: z.string().optional(),
}).refine(
  (data) => {
    // If Railway deployment is enabled, Railway vars are required
    if (data.ENABLE_RAILWAY_DEPLOYMENT) {
      return !!data.RAILWAY_API_TOKEN && !!data.RAILWAY_WORKSPACE_ID;
    }
    return true;
  },
  {
    message: "RAILWAY_API_TOKEN and RAILWAY_WORKSPACE_ID are required when ENABLE_RAILWAY_DEPLOYMENT is enabled",
    path: ["RAILWAY_API_TOKEN"],
  }
);

export type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cachedEnv) return cachedEnv;
  
  // Debug: Log what we're getting from process.env (without sensitive values)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Environment variables check:');
    console.log('  ENABLE_RAILWAY_DEPLOYMENT:', process.env.ENABLE_RAILWAY_DEPLOYMENT || 'false (disabled)');
    console.log('  RAILWAY_API_TOKEN:', process.env.RAILWAY_API_TOKEN ? '✓ Set' : '✗ Missing');
    console.log('  RAILWAY_WORKSPACE_ID:', process.env.RAILWAY_WORKSPACE_ID ? '✓ Set' : '✗ Missing');
    console.log('  RPC_API_KEY:', process.env.RPC_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('  ABSINTHE_API_KEY:', process.env.ABSINTHE_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('  COINGECKO_API_KEY:', process.env.COINGECKO_API_KEY ? '✓ Set' : '✗ Missing');
  }
  
  const result = envSchema.safeParse({
    ENABLE_RAILWAY_DEPLOYMENT: process.env.ENABLE_RAILWAY_DEPLOYMENT,
    RAILWAY_API_TOKEN: process.env.RAILWAY_API_TOKEN,
    RAILWAY_WORKSPACE_ID: process.env.RAILWAY_WORKSPACE_ID,
    RAILWAY_TEMPLATE_ID: process.env.RAILWAY_TEMPLATE_ID,
    RPC_API_KEY: process.env.RPC_API_KEY,
    ABSINTHE_API_KEY: process.env.ABSINTHE_API_KEY,
    ABSINTHE_API_URL: process.env.ABSINTHE_API_URL,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  });
  
  if (!result.success) {
    const missingVars = result.error.errors
      .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
      .map(err => err.path.join('.'))
      .join(', ');
    
    const errorMessage = `Missing required environment variables: ${missingVars}. ` +
      `Please ensure your .env.local or .env file contains these variables. ` +
      `If using .env, make sure to restart the Next.js dev server after adding variables.`;
    
    console.error('❌ Environment validation failed:', errorMessage);
    throw new Error(errorMessage);
  }
  
  cachedEnv = result.data;
  return cachedEnv;
}

export function getRpcUrlForChain(chainId: number, apiKey: string): string {
  const baseUrl = RPC_BASE_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${baseUrl}/${apiKey}`;
}

export function isScanSupported(chainId: number): boolean {
  return !MANUAL_FROM_BLOCK_CHAINS.includes(chainId);
}

/**
 * Check if Railway deployment feature is enabled
 */
export function isRailwayDeploymentEnabled(): boolean {
  try {
    const env = getEnv();
    return env.ENABLE_RAILWAY_DEPLOYMENT === true;
  } catch {
    return false;
  }
}
