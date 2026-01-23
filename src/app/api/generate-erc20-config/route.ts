import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ethers } from 'ethers';
import { 
  getEnv, 
  getRpcUrlForChain, 
  CHAIN_ID_TO_GATEWAY_URL,
  CHAIN_ID_TO_COINGECKO_PLATFORM,
  MANUAL_FROM_BLOCK_CHAINS,
} from '@/lib/server/config';
import { getContractCreationBlock } from '@/lib/server/etherscan';
import { getCoinGeckoId, getBaseCoinId } from '@/lib/server/coingecko';
import { validateERC20Contract } from '@/lib/server/contract-validation';

const generateErc20ConfigSchema = z.object({
  tokenContractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  chainId: z.number().min(1, "Chain ID is required"),
  fromBlock: z.number().min(0, "From block must be positive").optional(),
  toBlock: z.number().optional(),
  finality: z.number().min(1).optional().default(75),
  flushIntervalHours: z.number().min(1).optional().default(1),
  manualPricing: z.object({
    kind: z.literal('pegged'),
    usdPegValue: z.number().min(0, "USD peg value must be non-negative"),
  }).optional(),
  trackables: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  console.log('📥 POST /api/generate-erc20-config received');
  
  try {
    // Check environment variables first
    let env;
    try {
      env = getEnv();
    } catch (envError) {
      return NextResponse.json({
        success: false,
        message: envError instanceof Error ? envError.message : 'Environment configuration error',
        error: 'Missing environment variables',
      }, { status: 500 });
    }
    
    const rawBody = await request.json();
    const body = generateErc20ConfigSchema.parse(rawBody);
    
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Step 0: Validate contract exists on the selected chain
    console.log(`🔍 Validating contract ${body.tokenContractAddress} on chain ${body.chainId}`);
    const contractValidation = await validateERC20Contract(body.tokenContractAddress, body.chainId);
    warnings.push(...contractValidation.warnings);
    errors.push(...contractValidation.errors);
    
    // Step 1: Get fromBlock (non-blocking - warn if not found but continue)
    let fromBlock = body.fromBlock;
    
    if (!fromBlock) {
      if (MANUAL_FROM_BLOCK_CHAINS.includes(body.chainId)) {
        warnings.push(`⚠️ Chain ${body.chainId} requires manual fromBlock input. Please provide fromBlock to ensure accurate data indexing.`);
      } else {
        console.log(`🔍 Fetching contract creation block for token ${body.tokenContractAddress} on chain ${body.chainId}`);
        const creationInfo = await getContractCreationBlock(body.tokenContractAddress, body.chainId);
        
        if (creationInfo) {
          fromBlock = creationInfo.blockNumber;
          console.log(`✅ Found creation block: ${fromBlock}`);
        } else {
          warnings.push(`⚠️ Could not automatically determine fromBlock for token ${body.tokenContractAddress}. Please provide fromBlock manually to ensure accurate indexing. The config will be generated but may need adjustment.`);
        }
      }
    }
    
    // If no fromBlock, we'll still generate config but warn the user
    if (!fromBlock) {
      warnings.push(`⚠️ CRITICAL: No fromBlock specified. You MUST edit the generated config and add a valid fromBlock value before deploying, or the adapter will fail to start or index incorrectly.`);
    }

    // Step 2: Get CoinGecko ID for the token (non-blocking)
    const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[body.chainId];
    let tokenData: { id?: string; name?: string; symbol?: string } | null = null;
    let tokenCoingeckoId: string | undefined;
    
    if (!platform) {
      warnings.push(`⚠️ Chain ID ${body.chainId} is not supported by CoinGecko API. You'll need to use manual pricing.`);
    } else {
      tokenData = await getCoinGeckoId(body.tokenContractAddress, body.chainId);
      tokenCoingeckoId = tokenData?.id;
      
      if (!tokenCoingeckoId && !body.manualPricing) {
        // Don't block - ask for manual pricing but continue
        return NextResponse.json({
          success: false,
          requiresManualInput: true,
          missingTokens: [{
            address: body.tokenContractAddress,
            field: 'manualPricing',
            reason: 'CoinGecko ID not found for this token',
          }],
          message: `Could not find CoinGecko ID for token ${body.tokenContractAddress}. Please provide a manual USD peg value.`,
          tokenAddress: body.tokenContractAddress,
          warnings,
        });
      }
    }

    // Determine pricing
    let pricing: { kind: string; id?: string; usdPegValue?: number };
    let baseTokenId: string | null = null;
    
    if (body.manualPricing) {
      pricing = {
        kind: 'pegged',
        usdPegValue: body.manualPricing.usdPegValue,
      };
      console.log(`📌 Using manual pegged pricing for token: $${body.manualPricing.usdPegValue}`);
    } else if (tokenCoingeckoId) {
      baseTokenId = await getBaseCoinId(tokenCoingeckoId);
      pricing = {
        kind: 'coingecko',
        id: baseTokenId,
      };
      console.log(`📌 Using CoinGecko pricing for token: ${baseTokenId}`);
    } else {
      return NextResponse.json({
        success: false,
        message: 'No pricing information available',
        error: 'Pricing required',
      }, { status: 400 });
    }

    // Step 2: Build the config structure
    const gatewayUrl = CHAIN_ID_TO_GATEWAY_URL[body.chainId];
    const flushInterval = `${body.flushIntervalHours || 1}h`;

    // Determine which trackables to include (default to all if not specified)
    const selectedTrackables = body.trackables || ['token'];
    const includeToken = selectedTrackables.includes('token');

    const adapterConfig: any = {
      adapterId: 'erc20-holdings',
      config: {},
    };

    // Only include token trackable if selected
    if (includeToken) {
      adapterConfig.config.token = [
        {
          params: {
            contractAddress: body.tokenContractAddress,
          },
          pricing: pricing,
        },
      ];
    }

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
        ...(fromBlock !== undefined && { fromBlock }),
        ...(body.toBlock !== undefined && { toBlock: body.toBlock }),
      },
      adapterConfig,
    };

    // Step 3: Encode to base64
    const jsonString = JSON.stringify(config, null, 2) + "\n";
    const base64Config = Buffer.from(jsonString, 'utf8').toString('base64');

    return NextResponse.json({
      success: true,
      config: config,
      base64: base64Config,
      token: {
        tokenAddress: body.tokenContractAddress,
        coingeckoId: baseTokenId,
        tokenName: tokenData?.name,
        tokenSymbol: tokenData?.symbol,
        pricingType: body.manualPricing ? 'pegged' : 'coingecko',
        ...(body.manualPricing && { usdPegValue: body.manualPricing.usdPegValue }),
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Generate ERC20 config error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request payload',
        error: error.errors,
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
