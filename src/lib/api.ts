import { CHAIN_ID_TO_GATEWAY_URL } from './chainMapping';

export interface ClassificationResult {
  adapter: string;
}

export interface GenerateConfigResult {
  config: Record<string, unknown>;
  base64: string;
}

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
  const sinks: Array<Record<string, unknown>> = [
    {
      sinkType: 'csv',
      path: fields.csvPath,
    },
  ];

  if (fields.enableStdout) {
    sinks.push({
      sinkType: 'stdout',
    });
  }

  if (fields.enableAbsinthe) {
    sinks.push({
      sinkType: 'absinthe',
      url: '${env:ABSINTHE_API_URL}',
      apiKey: '${env:ABSINTHE_API_KEY}',
    });
  }

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
 * Encode JSON to Base64 (client-side utility)
 */
export function encodeToBase64(obj: any): string {
  return btoa(JSON.stringify(obj));
}

