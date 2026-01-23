import { CHAIN_ID_TO_GATEWAY_URL } from './chainMapping';

export interface ClassificationResult {
  adapter: string;
}

export interface GenerateConfigResult {
  config: Record<string, unknown>;
  base64: string;
  warnings?: string[];
  errors?: string[];
  token?: {
    tokenAddress: string;
    coingeckoId?: string | null;
    tokenName?: string;
    tokenSymbol?: string;
    pricingType?: string;
    usdPegValue?: number;
  };
  tokens?: {
    token0: string;
    token1: string;
    token0CoingeckoId?: string | null;
    token1CoingeckoId?: string | null;
    token0PricingType?: string;
    token1PricingType?: string;
    token0UsdPegValue?: number;
    token1UsdPegValue?: number;
  };
}

// Manual pricing input for tokens without CoinGecko IDs
export interface ManualPricing {
  kind: 'pegged';
  usdPegValue: number;
}

// Response when manual input is required
export interface ManualInputRequired {
  success: false;
  requiresManualInput: true;
  missingTokens: Array<{
    address: string;
    field: string;
    reason: string;
  }>;
  message: string;
  warnings?: string[];
  errors?: string[];
  tokens?: {
    token0?: string;
    token1?: string;
    token0Found?: boolean;
    token1Found?: boolean;
  };
  tokenAddress?: string;
  suggestion?: string;
}

// API base URL - empty for Next.js (same origin)
const getApiBaseUrl = () => '';

/**
 * Base64 encode JSON config
 * Equivalent to: cat config.json | base64 -w 0
 * Uses pretty-printed JSON (2-space indent) with trailing newline to match base64 -w 0 output exactly
 */
function encodeConfigToBase64(config: Record<string, unknown>): string {
  const jsonString = JSON.stringify(config, null, 2) + "\n";
  // Convert to base64 using btoa (browser) or Buffer (Node.js)
  if (typeof btoa !== 'undefined') {
    // Browser environment
    return btoa(jsonString);
  } else {
    // Node.js environment (shouldn't happen in frontend, but just in case)
    return Buffer.from(jsonString, 'utf8').toString('base64');
  }
}

/**
 * Generate Absinthe adapter config from validated form data (client-side)
 */
export function generateConfig(
  fields: any,
  adapterType: 'erc20' | 'uniswap-v2' = 'erc20'
): GenerateConfigResult {
  // Automatically set gatewayUrl from chainId if not provided
  const gatewayUrl = fields.gatewayUrl || CHAIN_ID_TO_GATEWAY_URL[fields.chainId];
  if (!gatewayUrl) {
    throw new Error(`No gateway URL found for chain ID ${fields.chainId}`);
  }

  // Default rpcUrl to env placeholder if not provided
  const rpcUrl = fields.rpcUrl || '${env:RPC_URL}';

  // Build sink configuration
  // Always include CSV, Stdout, and Absinthe sinks (all required for all adapters)
  const sinks: Array<Record<string, unknown>> = [
    {
      sinkType: 'csv',
      path: fields.csvPath || (adapterType === 'uniswap-v2' ? 'uniswap-v2.csv' : 'positions.csv'),
    },
    {
      sinkType: 'stdout',
    },
    {
      sinkType: 'absinthe',
      url: '${env:ABSINTHE_API_URL}',
      apiKey: '${env:ABSINTHE_API_KEY}',
    },
  ];

  // Build adapter-specific config
  let adapterConfig: Record<string, unknown>;

  if (adapterType === 'erc20') {
    // Build pricing configuration for ERC20
    const pricing: Record<string, unknown> = {
      kind: fields.pricingKind,
    };

    if (fields.pricingKind === 'pegged' && fields.usdPegValue !== undefined) {
      pricing.usdPegValue = fields.usdPegValue;
    } else if (fields.pricingKind === 'coingecko' && fields.coingeckoId) {
      pricing.id = fields.coingeckoId;
    }

    adapterConfig = {
      adapterId: 'erc20-holdings',
      config: {
        token: [
          {
            params: {
              contractAddress: fields.tokenContractAddress,
            },
            pricing,
          },
        ],
      },
    };
  } else if (adapterType === 'uniswap-v2') {
    // Build swap entries
    const swapEntries = (fields.swaps || []).map((swap: any) => {
      const swapEntry: Record<string, unknown> = {
        params: {
          poolAddress: swap.poolAddress,
        },
        assetSelectors: {
          swapLegAddress: swap.swapLegAddress,
        },
        pricing: {
          kind: swap.pricingKind,
        },
      };

      if (swap.pricingKind === 'pegged' && swap.usdPegValue !== undefined) {
        (swapEntry.pricing as Record<string, unknown>).usdPegValue = swap.usdPegValue;
      } else if (swap.pricingKind === 'coingecko' && swap.coingeckoId) {
        (swapEntry.pricing as Record<string, unknown>).id = swap.coingeckoId;
      }

      return swapEntry;
    });

    // Build LP entries
    const lpEntries = (fields.lps || []).map((lp: any) => {
      const token0Pricing: Record<string, unknown> = {
        kind: lp.token0PricingKind,
      };
      if (lp.token0PricingKind === 'pegged' && lp.token0UsdPegValue !== undefined) {
        token0Pricing.usdPegValue = lp.token0UsdPegValue;
      } else if (lp.token0PricingKind === 'coingecko' && lp.token0CoingeckoId) {
        token0Pricing.id = lp.token0CoingeckoId;
      }

      const token1Pricing: Record<string, unknown> = {
        kind: lp.token1PricingKind,
      };
      if (lp.token1PricingKind === 'pegged' && lp.token1UsdPegValue !== undefined) {
        token1Pricing.usdPegValue = lp.token1UsdPegValue;
      } else if (lp.token1PricingKind === 'coingecko' && lp.token1CoingeckoId) {
        token1Pricing.id = lp.token1CoingeckoId;
      }

      return {
        params: {
          poolAddress: lp.poolAddress,
        },
        pricing: {
          kind: 'univ2nav',
          token0: token0Pricing,
          token1: token1Pricing,
        },
      };
    });

    adapterConfig = {
      adapterId: 'uniswap-v2',
      config: {
        swap: swapEntries,
        lp: lpEntries,
      },
    };
  } else {
    throw new Error(`Unsupported adapter type: ${adapterType}`);
  }

  // Build the complete config
  const config: Record<string, unknown> = {
    chainArch: 'evm',
    flushInterval: fields.flushInterval,
    redisUrl: '${env:REDIS_URL}',
    sinkConfig: {
      sinks,
    },
    network: {
      chainId: fields.chainId,
      gatewayUrl: gatewayUrl,
      rpcUrl: rpcUrl,
      finality: fields.finality,
    },
    range: {
      fromBlock: fields.fromBlock,
      ...(fields.toBlock !== undefined && { toBlock: fields.toBlock }),
    },
    adapterConfig,
  };

  const base64Config = encodeConfigToBase64(config);

  return { config, base64: base64Config };
}

/**
 * Deploy to Railway using the API
 */
export async function deployToRailway(
  configBase64: string,
  chainId: number,
  templateId?: string
): Promise<{ success: boolean; message: string; projectId?: string; workflowId?: string; projectUrl?: string; error?: string }> {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/deploy-railway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        configBase64, 
        chainId,
        templateId 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to deploy to Railway');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Railway deployment error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to deploy to Railway");
  }
}

/**
 * Get token0 and token1 addresses from a Uniswap V2 pool
 */
export async function getPoolTokens(
  poolAddress: string,
  chainId: number
): Promise<{ success: boolean; token0?: string; token1?: string; error?: string }> {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-pool-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        poolAddress,
        chainId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to fetch pool tokens');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get pool tokens error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch pool tokens");
  }
}

/**
 * Auto-generate complete Uniswap V2 config from pool address
 * Backend will fetch tokens, CoinGecko IDs, and create swap/LP entries
 * If CoinGecko IDs are not found, returns ManualInputRequired response
 */
export async function generateUniv2Config(
  poolAddress: string,
  chainId: number,
  fromBlock?: number,
  toBlock?: number,
  finality?: number,
  flushIntervalHours?: number,
  token0ManualPricing?: ManualPricing,
  token1ManualPricing?: ManualPricing,
  trackables?: string[]
): Promise<GenerateConfigResult | ManualInputRequired> {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-univ2-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        poolAddress,
        chainId,
        fromBlock,
        toBlock,
        finality,
        flushIntervalHours,
        token0ManualPricing,
        token1ManualPricing,
        trackables,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to generate Uniswap V2 config');
    }

    const data = await response.json();
    
    // Check if manual input is required
    if (data.requiresManualInput) {
      return data as ManualInputRequired;
    }
    
    if (!data.success) {
      throw new Error(data.message || data.error || 'Failed to generate config');
    }

    return {
      config: data.config,
      base64: data.base64,
      warnings: data.warnings,
      errors: data.errors,
    };
  } catch (error) {
    console.error("Generate UniV2 config error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate Uniswap V2 config");
  }
}

/**
 * Get CoinGecko ID for a token address
 */
export async function getCoinGeckoId(
  tokenAddress: string,
  chainId: number
): Promise<{ success: boolean; coingeckoId?: string; tokenName?: string; tokenSymbol?: string; error?: string }> {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-coingecko-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        tokenAddress,
        chainId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to fetch CoinGecko ID');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get CoinGecko ID error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch CoinGecko ID");
  }
}

/**
 * Auto-generate complete ERC20 config from token address
 * Backend will fetch CoinGecko ID and create token entry
 * If CoinGecko ID is not found, returns ManualInputRequired response
 */
export async function generateErc20Config(
  tokenContractAddress: string,
  chainId: number,
  fromBlock?: number,
  toBlock?: number,
  finality?: number,
  flushIntervalHours?: number,
  manualPricing?: ManualPricing,
  trackables?: string[]
): Promise<GenerateConfigResult | ManualInputRequired> {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-erc20-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenContractAddress,
        chainId,
        fromBlock,
        toBlock,
        finality,
        flushIntervalHours,
        manualPricing,
        trackables,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to generate ERC20 config');
    }

    const data = await response.json();
    
    // Check if manual input is required
    if (data.requiresManualInput) {
      return data as ManualInputRequired;
    }
    
    if (!data.success) {
      throw new Error(data.message || data.error || 'Failed to generate config');
    }

    return {
      config: data.config,
      base64: data.base64,
      warnings: data.warnings,
      errors: data.errors,
    };
  } catch (error) {
    console.error("Generate ERC20 config error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate ERC20 config");
  }
}

/**
 * Auto-generate complete Uniswap V3 config from pool address
 * Backend will fetch tokens, CoinGecko IDs, and create swap entries
 * If CoinGecko IDs are not found, returns ManualInputRequired response
 */
export async function generateUniv3Config(
  poolAddress: string,
  chainId: number,
  fromBlock?: number,
  toBlock?: number,
  finality?: number,
  flushIntervalHours?: number,
  token0ManualPricing?: ManualPricing,
  token1ManualPricing?: ManualPricing,
  trackables?: string[]
): Promise<GenerateConfigResult | ManualInputRequired> {
  const API_BASE_URL = getApiBaseUrl();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-univ3-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        poolAddress,
        chainId,
        fromBlock,
        toBlock,
        finality,
        flushIntervalHours,
        token0ManualPricing,
        token1ManualPricing,
        trackables,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to generate Uniswap V3 config');
    }

    const data = await response.json();
    
    // Check if manual input is required
    if (data.requiresManualInput) {
      return data as ManualInputRequired;
    }
    
    if (!data.success) {
      throw new Error(data.message || data.error || 'Failed to generate config');
    }

    return {
      config: data.config,
      base64: data.base64,
      warnings: data.warnings,
      errors: data.errors,
    };
  } catch (error) {
    console.error("Generate UniV3 config error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate Uniswap V3 config");
  }
}

/**
 * Encode JSON to Base64 (client-side utility)
 */
export function encodeToBase64(obj: any): string {
  return btoa(JSON.stringify(obj));
}

