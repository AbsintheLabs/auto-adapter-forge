import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ethers } from 'ethers';
import { 
  getEnv, 
  getRpcUrlForChain, 
  CHAIN_ID_TO_GATEWAY_URL,
  CHAIN_ID_TO_COINGECKO_PLATFORM,
  MANUAL_FROM_BLOCK_CHAINS,
  UNIV3_FACTORY_ADDRESSES,
  UNIV3_POSITION_MANAGER_ADDRESSES,
} from '@/lib/server/config';
import { getContractCreationBlock } from '@/lib/server/etherscan';
import { getCoinGeckoId, getBaseCoinId } from '@/lib/server/coingecko';
import { validatePoolContract } from '@/lib/server/contract-validation';

const tokenPricingSchema = z.object({
  kind: z.literal('pegged'),
  usdPegValue: z.number().min(0, "USD peg value must be non-negative"),
});

const generateUniv3ConfigSchema = z.object({
  poolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  chainId: z.number().min(1, "Chain ID is required"),
  fromBlock: z.number().min(0, "From block must be positive").optional(),
  toBlock: z.number().optional(),
  finality: z.number().min(1).optional().default(75),
  flushIntervalHours: z.number().min(1).optional().default(48),
  token0ManualPricing: tokenPricingSchema.optional(),
  token1ManualPricing: tokenPricingSchema.optional(),
});

export async function POST(request: NextRequest) {
  console.log('📥 POST /api/generate-univ3-config received');
  
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
    const body = generateUniv3ConfigSchema.parse(rawBody);
    
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Validate chain is supported for Uniswap V3
    if (!UNIV3_FACTORY_ADDRESSES[body.chainId] || !UNIV3_POSITION_MANAGER_ADDRESSES[body.chainId]) {
      return NextResponse.json({
        success: false,
        message: `Chain ID ${body.chainId} is not supported for Uniswap V3`,
        error: 'Unsupported chain',
        suggestion: `Please select a chain that supports Uniswap V3, or verify the factory and position manager addresses for chain ${body.chainId}.`,
      }, { status: 400 });
    }
    
    // Step 0: Validate pool contract exists on the selected chain
    console.log(`🔍 Validating pool contract ${body.poolAddress} on chain ${body.chainId}`);
    const poolValidation = await validatePoolContract(body.poolAddress, body.chainId, 'uniswap-v3');
    warnings.push(...poolValidation.warnings);
    errors.push(...poolValidation.errors);
    
    // If validation failed completely, return early with helpful message
    if (!poolValidation.valid || !poolValidation.token0 || !poolValidation.token1) {
      const errorMessage = poolValidation.errors.length > 0 
        ? poolValidation.errors.join(' ')
        : `Pool contract validation failed. The address may not be a valid Uniswap V3 pool on chain ${body.chainId}, or it may be on a different chain.`;
      
      return NextResponse.json({
        success: false,
        message: errorMessage,
        error: 'Invalid pool contract',
        warnings: poolValidation.warnings,
        errors: poolValidation.errors,
        suggestion: `Please verify that ${body.poolAddress} is a valid Uniswap V3 pool address on chain ${body.chainId}. If the pool is on a different chain, select the correct chain.`,
      }, { status: 400 });
    }
    
    const token0 = poolValidation.token0;
    const token1 = poolValidation.token1;
    
    // Step 1: Get fromBlock (non-blocking)
    let fromBlock = body.fromBlock;
    
    if (!fromBlock) {
      if (MANUAL_FROM_BLOCK_CHAINS.includes(body.chainId)) {
        warnings.push(`⚠️ Chain ${body.chainId} requires manual fromBlock input. Please provide fromBlock to ensure accurate data indexing.`);
      } else {
        console.log(`🔍 Fetching contract creation block for pool ${body.poolAddress} on chain ${body.chainId}`);
        const creationInfo = await getContractCreationBlock(body.poolAddress, body.chainId);
        
        if (creationInfo) {
          fromBlock = creationInfo.blockNumber;
          console.log(`✅ Found creation block: ${fromBlock}`);
        } else {
          warnings.push(`⚠️ Could not automatically determine fromBlock for pool ${body.poolAddress}. Please provide fromBlock manually.`);
        }
      }
    }
    
    if (!fromBlock) {
      warnings.push(`⚠️ CRITICAL: No fromBlock specified. You MUST edit the generated config and add a valid fromBlock value before deploying.`);
    }

    // Step 2: Get CoinGecko IDs for both tokens (non-blocking)
    const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[body.chainId];
    let token0Data: { id?: string; name?: string; symbol?: string } | null = null;
    let token1Data: { id?: string; name?: string; symbol?: string } | null = null;
    let token0CoingeckoId: string | undefined;
    let token1CoingeckoId: string | undefined;
    
    if (!platform) {
      warnings.push(`⚠️ Chain ID ${body.chainId} is not supported by CoinGecko API. You'll need to use manual pricing for both tokens.`);
    } else {
      [token0Data, token1Data] = await Promise.all([
        getCoinGeckoId(token0, body.chainId),
        getCoinGeckoId(token1, body.chainId),
      ]);
      token0CoingeckoId = token0Data?.id;
      token1CoingeckoId = token1Data?.id;
    }


    // Check if manual pricing is needed for missing tokens
    const missingTokens: Array<{ address: string; field: string; reason: string }> = [];
    
    if (!token0CoingeckoId && !body.token0ManualPricing) {
      missingTokens.push({
        address: token0,
        field: 'token0ManualPricing',
        reason: 'CoinGecko ID not found for token0',
      });
    }
    
    if (!token1CoingeckoId && !body.token1ManualPricing) {
      missingTokens.push({
        address: token1,
        field: 'token1ManualPricing',
        reason: 'CoinGecko ID not found for token1',
      });
    }
    
    if (missingTokens.length > 0) {
      return NextResponse.json({
        success: false,
        requiresManualInput: true,
        missingTokens: missingTokens,
        message: `Could not find CoinGecko IDs for ${missingTokens.length} token(s). Please provide manual USD peg values.`,
        tokens: {
          token0: token0,
          token1: token1,
          token0Found: !!token0CoingeckoId,
          token1Found: !!token1CoingeckoId,
        },
      });
    }

    // Determine pricing for each token
    let token0Pricing: { kind: string; id?: string; usdPegValue?: number };
    let token1Pricing: { kind: string; id?: string; usdPegValue?: number };
    let baseToken0Id: string | null = null;
    let baseToken1Id: string | null = null;

    if (body.token0ManualPricing) {
      token0Pricing = {
        kind: 'pegged',
        usdPegValue: body.token0ManualPricing.usdPegValue,
      };
      console.log(`📌 Using manual pegged pricing for token0: $${body.token0ManualPricing.usdPegValue}`);
    } else if (token0CoingeckoId) {
      baseToken0Id = await getBaseCoinId(token0CoingeckoId);
      token0Pricing = {
        kind: 'coingecko',
        id: baseToken0Id,
      };
      console.log(`📌 Using CoinGecko pricing for token0: ${baseToken0Id}`);
    } else {
      return NextResponse.json({
        success: false,
        message: 'No pricing information available for token0',
        error: 'Pricing required',
      }, { status: 400 });
    }

    if (body.token1ManualPricing) {
      token1Pricing = {
        kind: 'pegged',
        usdPegValue: body.token1ManualPricing.usdPegValue,
      };
      console.log(`📌 Using manual pegged pricing for token1: $${body.token1ManualPricing.usdPegValue}`);
    } else if (token1CoingeckoId) {
      baseToken1Id = await getBaseCoinId(token1CoingeckoId);
      token1Pricing = {
        kind: 'coingecko',
        id: baseToken1Id,
      };
      console.log(`📌 Using CoinGecko pricing for token1: ${baseToken1Id}`);
    } else {
      return NextResponse.json({
        success: false,
        message: 'No pricing information available for token1',
        error: 'Pricing required',
      }, { status: 400 });
    }

    // Step 4: Get factory and position manager addresses for this chain
    const factoryAddress = UNIV3_FACTORY_ADDRESSES[body.chainId];
    const positionManagerAddress = UNIV3_POSITION_MANAGER_ADDRESSES[body.chainId];

    // Step 5: Build the config structure
    const gatewayUrl = CHAIN_ID_TO_GATEWAY_URL[body.chainId];
    const flushInterval = `${body.flushIntervalHours || 48}h`;

    const config = {
      chainArch: 'evm',
      flushInterval: flushInterval,
      redisUrl: '${env:REDIS_URL}',
      sinkConfig: {
        sinks: [
          { sinkType: 'csv', path: 'univ3-new.csv' },
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
      adapterConfig: {
        adapterId: 'uniswap-v3',
        config: {
          swap: [
            {
              params: {
                factoryAddress: factoryAddress,
                nonFungiblePositionManagerAddress: positionManagerAddress,
                poolAddress: body.poolAddress,
              },
              assetSelectors: { swapLegAddress: token0 },
              pricing: token0Pricing,
            },
            {
              params: {
                factoryAddress: factoryAddress,
                nonFungiblePositionManagerAddress: positionManagerAddress,
                poolAddress: body.poolAddress,
              },
              assetSelectors: { swapLegAddress: token1 },
              pricing: token1Pricing,
            },
          ],
        },
      },
    };

    // Step 6: Encode to base64
    const jsonString = JSON.stringify(config, null, 2) + "\n";
    const base64Config = Buffer.from(jsonString, 'utf8').toString('base64');

    return NextResponse.json({
      success: true,
      config: config,
      base64: base64Config,
      tokens: {
        token0: token0,
        token1: token1,
        token0CoingeckoId: baseToken0Id,
        token1CoingeckoId: baseToken1Id,
        token0PricingType: body.token0ManualPricing ? 'pegged' : 'coingecko',
        token1PricingType: body.token1ManualPricing ? 'pegged' : 'coingecko',
        ...(body.token0ManualPricing && { token0UsdPegValue: body.token0ManualPricing.usdPegValue }),
        ...(body.token1ManualPricing && { token1UsdPegValue: body.token1ManualPricing.usdPegValue }),
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Generate UniV3 config error:', error);
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
