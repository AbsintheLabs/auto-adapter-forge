import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

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
  1000: 'Solana',
  56: 'BSC',
  43114: 'Avalanche',
  143: 'Monad',
};

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
});

let env;
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
 * ZOD SCHEMAS
 */
const deployRailwaySchema = z.object({
  configBase64: z.string().min(1, "Config base64 is required"),
  templateId: z.string().optional(),
  chainId: z.number().min(1, "Chain ID is required"),
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
app.listen(PORT, () => {
  console.log(`🚀 Absinthe Adapter API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Deploy endpoint: http://localhost:${PORT}/api/deploy-railway`);
  console.log(`✅ Server started successfully`);
});

