# Absinthe Adapter API

Express.js backend for the Absinthe Adapter Config Generator.

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

Create a `.env` file in the `api/` directory:

```env
# Required: AI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Use custom AI provider
# LOVABLE_API_KEY=your-key
# AI_BASE_URL=https://ai.gateway.lovable.dev/v1

# AI Model
AI_MODEL=gpt-3.5-turbo

# Server Port
PORT=3001

# Optional: Railway deployment
# RAILWAY_API_TOKEN=your-token
# RAILWAY_TEMPLATE_ID=your-template-id
```

### 3. Run the Server

**Development (with hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**Type Checking (without building):**
```bash
npm run type-check
```

The API will be available at `http://localhost:3001`

**Note:** This project uses TypeScript. The source code is in `src/server.ts` and compiles to `dist/server.js`.

## API Endpoints

### Health Check
```bash
GET /health
```

Returns server status.

### Classify Adapter
```bash
POST /api/classify
Content-Type: application/json

{
  "prompt": "I need a Uniswap V3 config for pool 0x..."
}
```

**Response:**
```json
{
  "adapter": "univ3",
  "trackables": ["swap"],
  "confidence": 0.95
}
```

### Generate Config
```bash
POST /api/generate-config
Content-Type: application/json

{
  "adapter": "univ3",
  "fields": {
    "poolAddress": "0x...",
    "token0": "0x...",
    "token1": "0x...",
    "fee": 3000,
    "chainId": 1,
    "fromBlock": 15000000,
    "pricing": ["usdc", "weth"]
  }
}
```

**Response:**
```json
{
  "config": { ... },
  "base64": "eyJ..."
}
```

### Deploy to Railway
```bash
POST /api/deploy-railway
Content-Type: application/json

{
  "configBase64": "eyJ...",
  "rpcUrl": "https://eth-mainnet.g.alchemy.com/v2/...",
  "redisUrl": "redis://...",
  "templateId": "optional-template-id"
}
```

**Response:**
```json
{
  "success": true,
  "deploymentId": "...",
  "deploymentUrl": "https://...",
  "status": "DEPLOYING",
  "message": "Deployment initiated successfully"
}
```

## Deployment

### Railway

1. **Via Railway CLI:**
```bash
cd api
railway login
railway init
railway up
```

2. **Via GitHub:**
- Push your code to GitHub
- Connect Railway to your repo
- Set the root directory to `/api`
- Add environment variables in Railway dashboard

3. **Environment Variables (set in Railway):**
```
OPENAI_API_KEY=your-key
AI_MODEL=gpt-3.5-turbo
RAILWAY_API_TOKEN=your-railway-token (optional)
```

### Render

1. Create new Web Service
2. Connect your repository
3. Set root directory to `api`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add environment variables

### Vercel

1. Create `vercel.json` in the `api/` directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Deploy:
```bash
cd api
vercel
```

### Heroku

```bash
cd api
heroku create your-app-name
heroku buildpacks:add heroku/nodejs
git init
git add .
git commit -m "Initial commit"
git push heroku main
heroku config:set OPENAI_API_KEY=your-key
```

**Note:** Make sure to run `npm run build` before deploying, or add a build script in `package.json` that Heroku will run automatically.

## Using Alternative AI Providers

### Anthropic (Claude)

Install the SDK:
```bash
npm install @anthropic-ai/sdk
```

Update `server.js` to use Anthropic instead of OpenAI.

### Local Models (Ollama)

Set:
```env
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama2
```

### Lovable AI Gateway

Set:
```env
LOVABLE_API_KEY=your-key
AI_BASE_URL=https://ai.gateway.lovable.dev/v1
AI_MODEL=google/gemini-2.5-flash
```

## Development

### Testing Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Classify
curl -X POST http://localhost:3001/api/classify \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Uniswap V3 pool config"}'

# Generate config
curl -X POST http://localhost:3001/api/generate-config \
  -H "Content-Type: application/json" \
  -d '{"adapter": "univ3", "fields": {...}}'
```

### Debugging

The server logs all requests and errors to the console. Check the logs for debugging information.

## License

MIT

