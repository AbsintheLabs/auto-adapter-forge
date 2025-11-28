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
  fields: any
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

  // Build pricing configuration
  const pricing: Record<string, unknown> = {
    kind: fields.pricingKind,
  };

  if (fields.pricingKind === 'pegged' && fields.usdPegValue !== undefined) {
    pricing.usdPegValue = fields.usdPegValue;
  } else if (fields.pricingKind === 'coingecko' && fields.coingeckoId) {
    pricing.id = fields.coingeckoId;
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
    adapterConfig: {
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
    },
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

