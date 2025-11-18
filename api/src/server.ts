import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { z } from 'zod';
import util from 'node:util';
import { exec } from 'node:child_process';

dotenv.config();

const execAsync = util.promisify(exec);

/**
 * ENV VALIDATION
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(3001),

  OPENAI_API_KEY: z.string().optional(),
  LOVABLE_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().default('gpt-4.1-mini'), // adjust as needed

  // Railway
  RAILWAY_API_TOKEN: z.string().optional(),       // used for CLI or GraphQL
  RAILWAY_TEMPLATE_ID: z.string().optional(),     // default template
  USE_RAILWAY_CLI: z
    .enum(['true', 'false'])
    .default('true'),                             // toggle CLI vs GraphQL
});

const env = envSchema.parse(process.env);

const apiKey = env.OPENAI_API_KEY ?? env.LOVABLE_API_KEY;
if (!apiKey) {
  throw new Error(
    'Missing OPENAI_API_KEY or LOVABLE_API_KEY in environment variables'
  );
}

/**
 * OPENAI CLIENT
 */
const openai = new OpenAI({
  apiKey,
  baseURL: env.AI_BASE_URL || undefined,
});

/**
 * ZOD SCHEMAS
 */

// /api/classify request body
const classifyBodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

// LLM classification response - simplified to just adapter type
const classificationSchema = z.object({
  adapter: z.enum(['univ2', 'univ3', 'morpho', 'printr', 'erc20']),
});

// /api/generate-config request body
const generateConfigBodySchema = z.object({
  adapter: z.enum(['univ2', 'univ3', 'morpho', 'printr', 'erc20']),
  fields: z.record(z.any()), // you can tighten this per adapter later
});

// /api/deploy-railway request body
const deployBodySchema = z.object({
  configBase64: z.string().min(1),
  rpcUrl: z.string().min(1),
  redisUrl: z.string().min(1),
  templateId: z.string().optional(), // overrides default
});

/**
 * TYPES
 */
type AdapterType = 'univ2' | 'univ3' | 'morpho' | 'printr' | 'erc20';

interface ClassificationResponse {
  adapter: AdapterType;
}

interface GenerateConfigResponse {
  config: Record<string, unknown>;
  base64: string;
}

interface RailwayDeploymentParams {
  configBase64: string;
  rpcUrl: string;
  redisUrl: string;
  templateId: string;
}

interface RailwayDeploymentResponse {
  success: boolean;
  deployment: unknown;
  message: string;
}

/**
 * EXPRESS APP SETUP
 */
const app = express();
const PORT = env.PORT;

app.use(cors());
app.use(express.json());

/**
 * HEALTH CHECK
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * HELPER: Base64 encode JSON config
 */
function encodeConfigToBase64(config: unknown): string {
  return Buffer.from(JSON.stringify(config)).toString('base64');
}

/**
 * /api/classify
 * - Detects adapter type + trackables from natural language
 */
app.post('/api/classify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = classifyBodySchema.parse(req.body);

    const systemPrompt = `You are an Absinthe adapter classifier. Based on the user's description, determine which adapter type they need.

Available adapters:
- univ2: Uniswap V2 (liquidity pools, swaps)
- univ3: Uniswap V3 (concentrated liquidity, swaps, fee tiers)
- morpho: Morpho lending protocol (markets, collateral, loans)
- printr: Printr protocol
- erc20: ERC20 token holdings tracking

Return ONLY a JSON object with this exact shape:
{
  "adapter": "univ2|univ3|morpho|printr|erc20"
}`;

    const completion = await openai.chat.completions.create({
      model: env.AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }, // force JSON
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI classifier');
    }

    const parsed = classificationSchema.parse(JSON.parse(content));
    res.json(parsed);
  } catch (error) {
    console.error('Classification error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request or model response',
        issues: error.issues,
      });
    }
    next(error);
  }
});

/**
 * /api/generate-config
 * - Takes validated fields for a given adapter
 * - Calls LLM to produce Absinthe adapter-core config JSON
 * - Returns config + Base64 encoding
 */
app.post('/api/generate-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adapter, fields } = generateConfigBodySchema.parse(req.body);

    const systemPrompt = `You are an Absinthe Adapter Config Generator.

You will receive:
- An adapter type (univ2, univ3, morpho, printr, erc20)
- A set of validated fields from a Zod schema (addresses, chain, pricing, block range, etc.)

Your task:
- Produce a final JSON config that strictly matches the Absinthe adapter-core format.
- The config MUST include:
  - configVersion
  - chainArch
  - network (chainId, rpc/gateway URLs, finality)
  - range (fromBlock, optional toBlock)
  - adapterConfig (adapterId, config object)
  - sinkConfig if provided in the fields
  - any other required metadata for Absinthe adapter-core

Constraints:
- Output ONLY valid JSON, no comments or explanations.
- Do NOT wrap the JSON in markdown or a code block.
- The JSON must be directly usable as an Absinthe adapter config.`;

    const userContent = `Adapter: ${adapter}
Validated fields:
${JSON.stringify(fields, null, 2)}

Generate the final Absinthe adapter-core config JSON now.`;

    const completion = await openai.chat.completions.create({
      model: env.AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }, // force JSON
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from config generator');
    }

    // At this point, we *know* it's JSON, but it's still good to assert it's an object.
    const config = z
      .object({
        // very loose schema – you can tighten this later once adapter-core schema is fixed
        configVersion: z.number().optional(),
      })
      .passthrough()
      .parse(JSON.parse(content));

    const base64Config = encodeConfigToBase64(config);

    const response: GenerateConfigResponse = { config, base64: base64Config };
    res.json(response);
  } catch (error) {
    console.error('Config generation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request or invalid config structure from AI',
        issues: error.issues,
      });
    }
    next(error);
  }
});

/**
 * HELPERS: Railway deployment
 */

// Option A: Railway CLI (recommended)
async function deployWithRailwayCLI(params: RailwayDeploymentParams): Promise<unknown> {
  if (!env.RAILWAY_API_TOKEN) {
    throw new Error('RAILWAY_API_TOKEN is required for CLI deployment');
  }

  const { configBase64, rpcUrl, redisUrl, templateId } = params;

  const cmd = [
    'railway',
    'deploy',
    '-t',
    templateId,
    '-v',
    `"CONFIG_BASE64=${configBase64}"`,
    '-v',
    `"RPC_URL=${rpcUrl}"`,
    '-v',
    `"REDIS_URL=${redisUrl}"`,
    '--json',
  ].join(' ');

  console.log('Running Railway CLI:', cmd);

  const { stdout, stderr } = await execAsync(cmd, {
    env: {
      ...process.env,
      RAILWAY_TOKEN: env.RAILWAY_API_TOKEN,
    },
  });

  if (stderr) {
    console.warn('Railway CLI stderr:', stderr);
  }

  // Railway CLI --json output should be JSON, but we still guard against bad data
  try {
    const result = JSON.parse(stdout);
    return result;
  } catch (e) {
    console.error('Failed to parse Railway CLI output as JSON:', e);
    throw new Error('Railway CLI returned non-JSON output');
  }
}

// Option B: GraphQL fallback (if you still want it)
async function deployWithRailwayGraphQL(params: RailwayDeploymentParams): Promise<unknown> {
  if (!env.RAILWAY_API_TOKEN) {
    throw new Error('RAILWAY_API_TOKEN is required for GraphQL deployment');
  }

  const { configBase64, rpcUrl, redisUrl, templateId } = params;

  const mutation = `
    mutation CreateDeployment($input: DeploymentCreateInput!) {
      deploymentCreate(input: $input) {
        id
        url
        status
      }
    }
  `;

  const variables = {
    input: {
      templateId,
      environmentVariables: {
        CONFIG_BASE64: configBase64,
        RPC_URL: rpcUrl,
        REDIS_URL: redisUrl,
      },
    },
  };

  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RAILWAY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Railway GraphQL error response:', text);
    throw new Error('Failed to create Railway deployment (GraphQL)');
  }

  const data = await response.json() as { errors?: Array<{ message: string }>; data?: { deploymentCreate: unknown } };
  if (data.errors?.length) {
    console.error('Railway GraphQL errors:', data.errors);
    throw new Error(data.errors[0]?.message || 'Failed to create deployment');
  }

  return data.data?.deploymentCreate;
}

/**
 * /api/deploy-railway
 * - Takes Base64 config + infra URLs
 * - Spins up a new Railway deployment via CLI (or GraphQL fallback)
 */
app.post('/api/deploy-railway', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { configBase64, rpcUrl, redisUrl, templateId } =
      deployBodySchema.parse(req.body);

    const finalTemplateId =
      templateId || env.RAILWAY_TEMPLATE_ID || (() => {
        throw new Error('No Railway templateId provided (body or env)');
      })();

    const params: RailwayDeploymentParams = {
      configBase64,
      rpcUrl,
      redisUrl,
      templateId: finalTemplateId,
    };

    let deploymentResult: unknown;

    if (env.USE_RAILWAY_CLI === 'true') {
      deploymentResult = await deployWithRailwayCLI(params);
    } else {
      deploymentResult = await deployWithRailwayGraphQL(params);
    }

    const response: RailwayDeploymentResponse = {
      success: true,
      deployment: deploymentResult,
      message: 'Deployment initiated successfully',
    };
    res.json(response);
  } catch (error) {
    console.error('Railway deployment error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request payload',
        issues: error.issues,
      });
    }
    next(error);
  }
});

/**
 * GLOBAL ERROR HANDLER
 */
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err?.message ?? 'Unknown error',
    });
  }
);

/**
 * START SERVER
 */
app.listen(PORT, () => {
  console.log(`🚀 Absinthe Adapter API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

