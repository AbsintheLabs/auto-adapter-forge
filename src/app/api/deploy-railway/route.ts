import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEnv, getRpcUrlForChain, isRailwayDeploymentEnabled } from '@/lib/server/config';

const deployRailwaySchema = z.object({
  configBase64: z.string().min(1, "Config base64 is required"),
  templateId: z.string().optional(),
  chainId: z.number().min(1, "Chain ID is required"),
});

export async function POST(request: NextRequest) {
  console.log('📥 POST /api/deploy-railway received');
  
  try {
    // Check if Railway deployment is enabled
    if (!isRailwayDeploymentEnabled()) {
      return NextResponse.json({
        success: false,
        message: 'Railway deployment is disabled. Set ENABLE_RAILWAY_DEPLOYMENT=true in your environment variables to enable this feature.',
        error: 'Feature disabled',
      }, { status: 403 });
    }
    
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
    console.log('Request body:', JSON.stringify(rawBody, null, 2));
    
    const body = deployRailwaySchema.parse(rawBody);
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
            "RPC_URL": { value: rpcUrl },
            "LOG_LEVEL": { value: "debug" },
            "REDIS_URL": { value: "${{Redis.REDIS_PUBLIC_URL}}" },
            "INDEXER_CONFIG": { value: body.configBase64 },
            "ABSINTHE_API_KEY": { value: env.ABSINTHE_API_KEY },
            "ABSINTHE_API_URL": { value: env.ABSINTHE_API_URL },
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

    return NextResponse.json({
      success: true,
      projectId: projectId,
      workflowId: workflowId,
      projectUrl: projectUrl,
      message: `Successfully deployed to Railway. Project ID: ${projectId}`
    });
  } catch (error) {
    console.error('Railway deployment error:', error);
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
