import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { ethers } from 'ethers';

// Load .env file
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


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
  // Note: Some chains may not be supported by CoinGecko API
};

// Etherscan V2 API base URL - works for all supported chains with chainid parameter
export const ETHERSCAN_V2_BASE_URL = 'https://api.etherscan.io/v2/api';

// Chains that are NOT available in Etherscan V2 free tier - require manual fromBlock input
// Based on: https://docs.etherscan.io/v2.0.0/etherscan-v2-api/chain-support
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

/**
 * Get RPC URL for a given chain ID using the API key from environment
 */
function getRpcUrlForChain(chainId: number, apiKey: string): string {
  const baseUrl = RPC_BASE_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${baseUrl}/${apiKey}`;
}

/**
 * Check if a chain supports contract creation lookup via Etherscan V2 API
 * All chains except those in MANUAL_FROM_BLOCK_CHAINS are supported
 */
function isScanSupported(chainId: number): boolean {
  return !MANUAL_FROM_BLOCK_CHAINS.includes(chainId);
}
/**
 * ENV VALIDATION
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(3002),
  RAILWAY_API_TOKEN: z.string().min(1, "RAILWAY_API_TOKEN is required"),
  RAILWAY_WORKSPACE_ID: z.string().min(1, "RAILWAY_WORKSPACE_ID is required"),
  RAILWAY_TEMPLATE_ID: z.string().default("e671e590-fec4-4beb-8044-37f013a351e9"),
  RPC_API_KEY: z.string().min(1, "RPC_API_KEY is required (Alchemy or Infura API key)"),
  ABSINTHE_API_KEY: z.string().min(1, "ABSINTHE_API_KEY is required"),
  ABSINTHE_API_URL: z.string().url("ABSINTHE_API_URL must be a valid URL").default("https://v2.adapters.absinthe.network"),
  COINGECKO_API_KEY: z.string().min(1, "COINGECKO_API_KEY is required"),
  // Etherscan V2 API key (optional - only required for chains with auto fromBlock support)
  ETHERSCAN_API_KEY: z.string().optional(),
});

let env: z.infer<typeof envSchema>;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  if (error instanceof z.ZodError) {
    console.error('Missing or invalid environment variables:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

/**
 * Get Etherscan API key for a given chain ID
 * All supported chains use the same ETHERSCAN_API_KEY
 */
function getScanApiKeyForChain(chainId: number): string {
  return env.ETHERSCAN_API_KEY || '';
}

/**
 * Fetch contract creation block using Etherscan V2 API with retry logic
 */
async function getContractCreationBlock(
  contractAddress: string,
  chainId: number,
  retryDelays: number[] = [5000, 10000, 15000] // 5s, 10s, 15s
): Promise<{ blockNumber: number; creator: string; txHash: string } | null> {
  if (!isScanSupported(chainId)) {
    return null;
  }

  const apiKey = getScanApiKeyForChain(chainId);

  if (!apiKey) {
    console.warn(`No ETHERSCAN_API_KEY configured for chain ${chainId}`);
    return null;
  }

  const attemptFetch = async (): Promise<{ blockNumber: number; creator: string; txHash: string } | null> => {
    try {
      const url = `${ETHERSCAN_V2_BASE_URL}?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Check if it's a rate limit error (429) or API limit error
        if (response.status === 429 || response.status === 403) {
          throw new Error('API_LIMIT_HIT');
        }
        console.error(`Scan API error for chain ${chainId}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json() as {
        status?: string;
        message?: string;
        result?: Array<{
          contractAddress: string;
          contractCreator: string;
          txHash: string;
          blockNumber: string;
          timestamp?: string;
          contractFactory?: string;
          creationBytecode?: string;
        }>;
      };

      // Check for API limit messages in response
      if (data.message && (data.message.toLowerCase().includes('rate limit') || data.message.toLowerCase().includes('max rate limit'))) {
        throw new Error('API_LIMIT_HIT');
      }

      if (data.status === '1' && data.result && data.result.length > 0) {
        const result = data.result[0];
        
        if (result.blockNumber) {
          const blockNumber = parseInt(result.blockNumber, 10);
          return {
            blockNumber,
            creator: result.contractCreator,
            txHash: result.txHash,
          };
        }
      }

      return null;
    } catch (error) {
      if (error instanceof Error && error.message === 'API_LIMIT_HIT') {
        throw error; // Re-throw to trigger retry
      }
      console.error(`Error fetching contract creation block for chain ${chainId}:`, error);
      return null;
    }
  };

  // Try initial attempt
  try {
    const result = await attemptFetch();
    if (result) return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'API_LIMIT_HIT') {
      console.log(`⚠️ API limit hit for chain ${chainId}, will retry...`);
    } else {
      return null; // Non-retryable error
    }
  }

  // Retry with delays
  for (let i = 0; i < retryDelays.length; i++) {
    const delay = retryDelays[i];
    console.log(`⏳ Retrying fromBlock fetch after ${delay / 1000}s (attempt ${i + 2}/${retryDelays.length + 1})...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      const result = await attemptFetch();
      if (result) {
        console.log(`✅ Successfully fetched fromBlock on retry ${i + 2}`);
        return result;
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'API_LIMIT_HIT') {
        console.log(`⚠️ API limit still hit, will retry again...`);
        if (i === retryDelays.length - 1) {
          // Last retry failed, but we'll return null and let the endpoint handle it
          console.error(`❌ All retry attempts failed for fromBlock fetch`);
        }
      } else {
        return null; // Non-retryable error
      }
    }
  }

  return null;
}

/**
 * ZOD SCHEMAS
 */
const deployRailwaySchema = z.object({
  configBase64: z.string().min(1, "Config base64 is required"),
  templateId: z.string().optional(),
  chainId: z.number().min(1, "Chain ID is required"),
});

const getPoolTokensSchema = z.object({
  poolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  chainId: z.number().min(1, "Chain ID is required"),
});

const getCoinGeckoIdSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  chainId: z.number().min(1, "Chain ID is required"),
});

const generateUniv2ConfigSchema = z.object({
  poolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  chainId: z.number().min(1, "Chain ID is required"),
  fromBlock: z.number().min(0, "From block must be positive").optional(),
  toBlock: z.number().optional(),
  finality: z.number().min(1).optional().default(75),
  flushIntervalHours: z.number().min(1).optional().default(2),
});

const generateErc20ConfigSchema = z.object({
  tokenContractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  chainId: z.number().min(1, "Chain ID is required"),
  fromBlock: z.number().min(0, "From block must be positive").optional(),
  toBlock: z.number().optional(),
  finality: z.number().min(1).optional().default(75),
  flushIntervalHours: z.number().min(1).optional().default(1),
});

/**
 * TYPES
 */
interface RailwayDeployRequest {
  configBase64: string;
  templateId?: string;
  chainId: number;
}

interface RailwayDeployResponse {
  success: boolean;
  projectId?: string;
  workflowId?: string;
  projectUrl?: string;
  message: string;
  error?: string;
}

/**
 * HEALTH CHECK
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Absinthe Adapter API', timestamp: new Date().toISOString() });
});

/**
 * /api/get-pool-tokens
 * Fetches token0 and token1 addresses from a Uniswap V2 pool
 */
app.post('/api/get-pool-tokens', async (req: Request, res: Response, next: NextFunction) => {
  console.log('📥 POST /api/get-pool-tokens received');
  try {
    const body = getPoolTokensSchema.parse(req.body);
    
    // Get RPC URL for the specified chain ID
    const rpcUrl = getRpcUrlForChain(body.chainId, env.RPC_API_KEY);
    console.log(`🔗 Using RPC URL for chain ${body.chainId}: ${rpcUrl.replace(env.RPC_API_KEY, '***')}`);

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Uniswap V2 Pair ABI (only the functions we need)
    const pairABI = [
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
    ];

    // Create contract instance
    const pairContract = new ethers.Contract(body.poolAddress, pairABI, provider);

    // Fetch token addresses
    let token0: string;
    let token1: string;
    
    try {
      [token0, token1] = await Promise.all([
        pairContract.token0(),
        pairContract.token1(),
      ]);
    } catch (contractError) {
      console.error('Contract call error:', contractError);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch tokens from pool contract. The address may not be a valid Uniswap V2 pool, or the RPC connection failed.',
        error: contractError instanceof Error ? contractError.message : 'Unknown contract error',
      });
    }

    // Validate that we got valid addresses
    if (!token0 || !token1 || token0 === ethers.ZeroAddress || token1 === ethers.ZeroAddress) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token addresses returned from pool. Token0 or Token1 may be zero address.',
        error: 'Invalid token addresses',
        token0: token0 || null,
        token1: token1 || null,
      });
    }

    // Validate address format
    if (!ethers.isAddress(token0) || !ethers.isAddress(token1)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format returned from pool contract.',
        error: 'Invalid address format',
        token0: token0 || null,
        token1: token1 || null,
      });
    }

    res.json({
      success: true,
      token0: token0,
      token1: token1,
    });
  } catch (error) {
    console.error('Get pool tokens error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        error: error.errors,
      });
    }
    next(error);
  }
});

/**
 * /api/get-coingecko-id
 * Fetches CoinGecko ID for a token address
 */
app.post('/api/get-coingecko-id', async (req: Request, res: Response, next: NextFunction) => {
  console.log('📥 POST /api/get-coingecko-id received');
  try {
    const body = getCoinGeckoIdSchema.parse(req.body);
    
    const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[body.chainId];
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: `Chain ID ${body.chainId} is not supported by CoinGecko API`,
        error: 'Unsupported chain',
      });
    }

    // CoinGecko API endpoint: /coins/{platform}/contract/{address}
    const url = `https://pro-api.coingecko.com/api/v3/coins/${platform}/contract/${body.tokenAddress.toLowerCase()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-cg-pro-api-key': env.COINGECKO_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          message: `Token not found on CoinGecko for address ${body.tokenAddress}`,
          error: 'Token not found',
        });
      }
      const errorText = await response.text();
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as { id?: string; name?: string; symbol?: string };
    const coingeckoId = data.id;

    if (!coingeckoId) {
      return res.status(400).json({
        success: false,
        message: 'CoinGecko ID not found in API response',
        error: 'Invalid response',
      });
    }

    res.json({
      success: true,
      coingeckoId: coingeckoId,
      tokenName: data.name,
      tokenSymbol: data.symbol,
    });
  } catch (error) {
    console.error('Get CoinGecko ID error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        error: error.errors,
      });
    }
    next(error);
  }
});

/**
 * /api/generate-univ2-config
 * Auto-generates complete Uniswap V2 config: fetches tokens, CoinGecko IDs, and creates swap/LP entries
 */
app.post('/api/generate-univ2-config', async (req: Request, res: Response, next: NextFunction) => {
  console.log('📥 POST /api/generate-univ2-config received');
  try {
    const body = generateUniv2ConfigSchema.parse(req.body);
    
    // Step 0: Get fromBlock - auto-fetch for supported chains, require manual input for others
    let fromBlock = body.fromBlock;
    
    if (!fromBlock) {
      if (MANUAL_FROM_BLOCK_CHAINS.includes(body.chainId)) {
        return res.status(400).json({
          success: false,
          message: `Chain ${body.chainId} does not support automatic fromBlock lookup. Please provide fromBlock manually.`,
          error: 'fromBlock required for this chain',
        });
      }
      
      // Try to fetch contract creation block for supported chains (with retries)
      console.log(`🔍 Fetching contract creation block for pool ${body.poolAddress} on chain ${body.chainId}`);
      const creationInfo = await getContractCreationBlock(body.poolAddress, body.chainId);
      
      if (creationInfo) {
        fromBlock = creationInfo.blockNumber;
        console.log(`✅ Found creation block: ${fromBlock}`);
      } else {
        return res.status(400).json({
          success: false,
          message: `Could not automatically determine fromBlock for pool ${body.poolAddress} after retries. Please provide fromBlock manually.`,
          error: 'fromBlock lookup failed',
        });
      }
    }
    
    // Step 1: Get token0 and token1 from pool
    const rpcUrl = getRpcUrlForChain(body.chainId, env.RPC_API_KEY);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const pairABI = [
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
    ];
    const pairContract = new ethers.Contract(body.poolAddress, pairABI, provider);
    
    let token0: string;
    let token1: string;
    try {
      [token0, token1] = await Promise.all([
        pairContract.token0(),
        pairContract.token1(),
      ]);
    } catch (contractError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch tokens from pool contract',
        error: contractError instanceof Error ? contractError.message : 'Unknown contract error',
      });
    }

    if (!token0 || !token1 || !ethers.isAddress(token0) || !ethers.isAddress(token1)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token addresses returned from pool',
        error: 'Invalid token addresses',
      });
    }

    // Step 2: Get CoinGecko IDs for both tokens
    const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[body.chainId];
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: `Chain ID ${body.chainId} is not supported by CoinGecko API`,
        error: 'Unsupported chain',
      });
    }

    const [token0Data, token1Data] = await Promise.all([
      fetch(`https://pro-api.coingecko.com/api/v3/coins/${platform}/contract/${token0.toLowerCase()}`, {
        headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
      }).then(r => r.ok ? r.json() as { id?: string; platforms?: Record<string, string> } : null).catch(() => null),
      fetch(`https://pro-api.coingecko.com/api/v3/coins/${platform}/contract/${token1.toLowerCase()}`, {
        headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
      }).then(r => r.ok ? r.json() as { id?: string; platforms?: Record<string, string> } : null).catch(() => null),
    ]);

    const token0CoingeckoId = token0Data?.id;
    const token1CoingeckoId = token1Data?.id;

    if (!token0CoingeckoId || !token1CoingeckoId) {
      return res.status(400).json({
        success: false,
        message: `Could not find CoinGecko IDs for tokens. Token0: ${token0CoingeckoId ? 'found' : 'not found'}, Token1: ${token1CoingeckoId ? 'found' : 'not found'}`,
        error: 'CoinGecko IDs not found',
        token0: token0,
        token1: token1,
      });
    }

    // Extract base CoinGecko IDs (remove chain-specific prefixes like "hemi-", "stargate-bridged-", etc.)
    // CoinGecko IDs can be chain-specific (e.g., "hemi-bitcoin") or base (e.g., "bitcoin")
    // We'll try to get the base coin by fetching the coin details
    const getBaseCoinId = async (coinId: string): Promise<string> => {
      try {
        // Fetch coin details to get base coin information
        const coinResponse = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${coinId}`, {
          headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
        });
        
        if (coinResponse.ok) {
          const coinData = await coinResponse.json() as { 
            id?: string; 
            parent?: { id?: string };
            // Some bridged tokens have a parent coin reference
          };
          
          // If there's a parent coin, use that (it's usually the base coin)
          if (coinData.parent?.id) {
            return coinData.parent.id;
          }
          
          // Check if the ID contains chain-specific prefixes and try to extract base
          // Common patterns: "hemi-bitcoin" -> "bitcoin", "stargate-bridged-usdc" -> "usd-coin"
          const chainPrefixes = ['hemi-', 'stargate-bridged-', 'wrapped-', 'bridged-'];
          for (const prefix of chainPrefixes) {
            if (coinId.startsWith(prefix)) {
              const baseId = coinId.replace(prefix, '');
              // Verify the base ID exists by checking if it's a valid coin
              const baseCheck = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${baseId}`, {
                headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
              });
              if (baseCheck.ok) {
                return baseId;
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Could not fetch base coin for ${coinId}, using original ID`);
      }
      // Fallback: return original ID
      return coinId;
    };

    // Get base CoinGecko IDs for both tokens
    const [baseToken0Id, baseToken1Id] = await Promise.all([
      getBaseCoinId(token0CoingeckoId),
      getBaseCoinId(token1CoingeckoId),
    ]);

    // Step 3: Build the config structure
    const gatewayUrl = CHAIN_ID_TO_GATEWAY_URL[body.chainId];
    const flushInterval = `${body.flushIntervalHours || 2}h`;

    const config = {
      chainArch: 'evm',
      flushInterval: flushInterval,
      redisUrl: '${env:REDIS_URL}',
      sinkConfig: {
        sinks: [
          { sinkType: 'csv', path: 'uniswap-v2.csv' },
          { sinkType: 'stdout' },
          {
            sinkType: 'absinthe',
            url: '${env:ABSINTHE_API_URL}',
            apiKey: '${env:ABSINTHE_API_KEY}',
          },
        ],
      },
      network: {
        chainId: body.chainId,
        gatewayUrl: gatewayUrl,
        rpcUrl: '${env:RPC_URL}',
        finality: body.finality || 75,
      },
      range: {
        fromBlock: fromBlock,
        ...(body.toBlock !== undefined && { toBlock: body.toBlock }),
      },
      adapterConfig: {
        adapterId: 'uniswap-v2',
        config: {
          swap: [
            // Swap entry for token0
            {
              params: {
                poolAddress: body.poolAddress,
              },
              assetSelectors: {
                swapLegAddress: token0,
              },
              pricing: {
                kind: 'coingecko',
                id: baseToken0Id,
              },
            },
            // Swap entry for token1
            {
              params: {
                poolAddress: body.poolAddress,
              },
              assetSelectors: {
                swapLegAddress: token1,
              },
              pricing: {
                kind: 'coingecko',
                id: baseToken1Id,
              },
            },
          ],
          lp: [
            {
              params: {
                poolAddress: body.poolAddress,
              },
              pricing: {
                kind: 'univ2nav',
                token0: {
                  kind: 'coingecko',
                  id: baseToken0Id,
                },
                token1: {
                  kind: 'coingecko',
                  id: baseToken1Id,
                },
              },
            },
          ],
        },
      },
    };

    // Step 4: Encode to base64
    const jsonString = JSON.stringify(config, null, 2) + "\n";
    const base64Config = Buffer.from(jsonString, 'utf8').toString('base64');

    res.json({
      success: true,
      config: config,
      base64: base64Config,
      tokens: {
        token0: token0,
        token1: token1,
        token0CoingeckoId: baseToken0Id,
        token1CoingeckoId: baseToken1Id,
      },
    });
  } catch (error) {
    console.error('Generate UniV2 config error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        error: error.errors,
      });
    }
    next(error);
  }
});

/**
 * /api/generate-erc20-config
 * Auto-generates complete ERC20 config: fetches CoinGecko ID and creates token entry
 */
app.post('/api/generate-erc20-config', async (req: Request, res: Response, next: NextFunction) => {
  console.log('📥 POST /api/generate-erc20-config received');
  try {
    const body = generateErc20ConfigSchema.parse(req.body);
    
    // Step 0: Get fromBlock - auto-fetch for supported chains, require manual input for others
    let fromBlock = body.fromBlock;
    
    if (!fromBlock) {
      if (MANUAL_FROM_BLOCK_CHAINS.includes(body.chainId)) {
        return res.status(400).json({
          success: false,
          message: `Chain ${body.chainId} does not support automatic fromBlock lookup. Please provide fromBlock manually.`,
          error: 'fromBlock required for this chain',
        });
      }
      
      // Try to fetch contract creation block for supported chains (with retries)
      console.log(`🔍 Fetching contract creation block for token ${body.tokenContractAddress} on chain ${body.chainId}`);
      const creationInfo = await getContractCreationBlock(body.tokenContractAddress, body.chainId);
      
      if (creationInfo) {
        fromBlock = creationInfo.blockNumber;
        console.log(`✅ Found creation block: ${fromBlock}`);
      } else {
        return res.status(400).json({
          success: false,
          message: `Could not automatically determine fromBlock for token ${body.tokenContractAddress} after retries. Please provide fromBlock manually.`,
          error: 'fromBlock lookup failed',
        });
      }
    }

    // Step 1: Get CoinGecko ID for the token
    const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[body.chainId];
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: `Chain ID ${body.chainId} is not supported by CoinGecko API`,
        error: 'Unsupported chain',
      });
    }

    const tokenData = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${platform}/contract/${body.tokenContractAddress.toLowerCase()}`, {
      headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
    }).then(r => r.ok ? r.json() as { id?: string; name?: string; symbol?: string } : null).catch(() => null);

    const tokenCoingeckoId = tokenData?.id;

    if (!tokenCoingeckoId) {
      return res.status(400).json({
        success: false,
        message: `Could not find CoinGecko ID for token ${body.tokenContractAddress}`,
        error: 'CoinGecko ID not found',
        tokenAddress: body.tokenContractAddress,
      });
    }

    // Get base CoinGecko ID (same logic as Uniswap V2)
    const getBaseCoinId = async (coinId: string): Promise<string> => {
      try {
        const coinResponse = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${coinId}`, {
          headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
        });
        
        if (coinResponse.ok) {
          const coinData = await coinResponse.json() as { 
            id?: string; 
            parent?: { id?: string };
          };
          
          if (coinData.parent?.id) {
            return coinData.parent.id;
          }
          
          const chainPrefixes = ['hemi-', 'stargate-bridged-', 'wrapped-', 'bridged-'];
          for (const prefix of chainPrefixes) {
            if (coinId.startsWith(prefix)) {
              const baseId = coinId.replace(prefix, '');
              const baseCheck = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${baseId}`, {
                headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
              });
              if (baseCheck.ok) {
                return baseId;
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Could not fetch base coin for ${coinId}, using original ID`);
      }
      return coinId;
    };

    const baseTokenId = await getBaseCoinId(tokenCoingeckoId);

    // Step 2: Build the config structure
    const gatewayUrl = CHAIN_ID_TO_GATEWAY_URL[body.chainId];
    const flushInterval = `${body.flushIntervalHours || 1}h`;

    const config = {
      chainArch: 'evm',
      flushInterval: flushInterval,
      redisUrl: '${env:REDIS_URL}',
      sinkConfig: {
        sinks: [
          { sinkType: 'csv', path: 'positions.csv' },
          { sinkType: 'stdout' },
          {
            sinkType: 'absinthe',
            url: '${env:ABSINTHE_API_URL}',
            apiKey: '${env:ABSINTHE_API_KEY}',
          },
        ],
      },
      network: {
        chainId: body.chainId,
        gatewayUrl: gatewayUrl,
        rpcUrl: '${env:RPC_URL}',
        finality: body.finality || 75,
      },
      range: {
        fromBlock: fromBlock,
        ...(body.toBlock !== undefined && { toBlock: body.toBlock }),
      },
      adapterConfig: {
        adapterId: 'erc20-holdings',
        config: {
          token: [
            {
              params: {
                contractAddress: body.tokenContractAddress,
              },
              pricing: {
                kind: 'coingecko',
                id: baseTokenId,
              },
            },
          ],
        },
      },
    };

    // Step 3: Encode to base64
    const jsonString = JSON.stringify(config, null, 2) + "\n";
    const base64Config = Buffer.from(jsonString, 'utf8').toString('base64');

    res.json({
      success: true,
      config: config,
      base64: base64Config,
      token: {
        tokenAddress: body.tokenContractAddress,
        coingeckoId: baseTokenId,
        tokenName: tokenData?.name,
        tokenSymbol: tokenData?.symbol,
      },
    });
  } catch (error) {
    console.error('Generate ERC20 config error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        error: error.errors,
      });
    }
    next(error);
  }
});

/**
 * /api/deploy-railway
 * Deploys adapter configuration to Railway using GraphQL API
 */
app.post('/api/deploy-railway', async (req: Request, res: Response, next: NextFunction) => {
  console.log('📥 POST /api/deploy-railway received');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  try {
    const body = deployRailwaySchema.parse(req.body);
    const templateId = body.templateId || env.RAILWAY_TEMPLATE_ID;

    // Get RPC URL for the specified chain ID using API key from environment
    const rpcUrl = getRpcUrlForChain(body.chainId, env.RPC_API_KEY);
    console.log(`🔗 Using RPC URL for chain ${body.chainId}: ${rpcUrl.replace(env.RPC_API_KEY, '***')}`);

    // Build the Railway template deployment config
    const serializedConfig = {
      services: {
        "0aeb52bd-f8db-43c2-b569-b76baab73d36": {
          icon: "https://cdn.sanity.io/images/sy1jschh/production/0ce0bfdcfbdbf69662b1116671f97c2dd788b655-157x157.svg",
          name: "Redis",
          deploy: {
            startCommand: "/bin/sh -c \"rm -rf $RAILWAY_VOLUME_MOUNT_PATH/lost+found/ && exec docker-entrypoint.sh redis-server --requirepass $REDIS_PASSWORD --save 60 1 --dir $RAILWAY_VOLUME_MOUNT_PATH\""
          },
          source: {
            image: "redis:8.2.1"
          },
          variables: {
            "REDISHOST": { value: "${{RAILWAY_PRIVATE_DOMAIN}}" },
            "REDISPORT": { value: "6379" },
            "REDISUSER": { value: "default" },
            "REDIS_URL": {
              value: "redis://${{ REDISUSER }}:${{ REDIS_PASSWORD }}@${{ REDISHOST }}:${{ REDISPORT }}"
            },
            "REDISPASSWORD": { value: "${{REDIS_PASSWORD}}" },
            "REDIS_PASSWORD": {
              value: "${{ secret(32, \"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\") }}"
            },
            "REDIS_PUBLIC_URL": {
              value: "redis://default:${{ REDIS_PASSWORD }}@${{ RAILWAY_TCP_PROXY_DOMAIN }}:${{ RAILWAY_TCP_PROXY_PORT }}"
            }
          },
          networking: {
            tcpProxies: { "6379": {} }
          },
          volumeMounts: {
            "0aeb52bd-f8db-43c2-b569-b76baab73d36": {
              mountPath: "/data"
            }
          }
        },
        "69ebd0cc-0e70-4f62-92ab-65e74123eaf7": {
          name: "absinthelabs/absinthe-adapters:latest",
          source: {
            image: "ghcr.io/absinthelabs/absinthe-adapters:latest"
          },
          variables: {
            "RPC_URL": {
              value: rpcUrl
            },
            "LOG_LEVEL": { value: "debug" },
            "REDIS_URL": { value: "${{Redis.REDIS_PUBLIC_URL}}" },
            "INDEXER_CONFIG": {
              value: body.configBase64
            },
            "ABSINTHE_API_KEY": { value: env.ABSINTHE_API_KEY },
            "ABSINTHE_API_URL": {
              value: env.ABSINTHE_API_URL
            },
            "COINGECKO_API_KEY": { value: env.COINGECKO_API_KEY }
          }
        }
      },
      buckets: {}
    };

    // Make GraphQL request to Railway
    const graphqlQuery = {
      query: `mutation templateDeployV2($input: TemplateDeployV2Input!) {
        templateDeployV2(input: $input) {
          projectId
          workflowId
        }
      }`,
      variables: {
        input: {
          serializedConfig,
          workspaceId: env.RAILWAY_WORKSPACE_ID,
          templateId: templateId
        }
      }
    };

    const response = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RAILWAY_API_TOKEN}`
      },
      body: JSON.stringify(graphqlQuery)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if ((data as any).errors) {
      throw new Error(`Railway GraphQL errors: ${JSON.stringify((data as any).errors)}`);
    }

    const projectId = (data as any).data?.templateDeployV2?.projectId;
    const workflowId = (data as any).data?.templateDeployV2?.workflowId;
    const projectUrl = projectId ? `https://railway.app/project/${projectId}` : undefined;

    const result: RailwayDeployResponse = {
      success: true,
      projectId: projectId,
      workflowId: workflowId,
      projectUrl: projectUrl,
      message: `Successfully deployed to Railway. Project ID: ${projectId}`
    };

    res.json(result);
  } catch (error) {
    console.error('Railway deployment error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        error: error.errors,
      });
    }
    next(error);
  }
});

/**
 * 404 HANDLER
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: _req.path,
    method: _req.method,
  });
});

/**
 * GLOBAL ERROR HANDLER
 */
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err?.message ?? 'Unknown error',
    });
  }
);

/**
 * START SERVER
 */
app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`🚀 Absinthe Adapter API running on port ${env.PORT}`);
  console.log(`📍 Health check: http://localhost:${env.PORT}/health`);
  console.log(`📍 Deploy endpoint: http://localhost:${env.PORT}/api/deploy-railway`);
  console.log(`✅ Server started successfully`);
});

