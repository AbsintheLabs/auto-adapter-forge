# Absinthe Adapter Config Generator

Configuration generator for Absinthe adapters with one-click Railway deployment. Generate and deploy adapter configurations for ERC20 tokens, Uniswap V2, and Uniswap V3 pools.

> 📚 **Deploy prebuilt adapters on Railway**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete deployment guide, or read the official [Railway Deployment Process Manual](https://absinthelabs.notion.site/Railway-Deployment-Process-Manual-2a0dfbd9a95880ca8c62f7a6d0fd490f)

## 🎯 Features

- **Template Selection**: Choose from ERC20, Uniswap V2, or Uniswap V3 adapters
- **Auto-Detection**: Automatic CoinGecko ID lookup, fromBlock detection, and pool token discovery
- **Smart Validation**: Contract validation, wrong-chain detection, and helpful error messages
- **Manual Pricing Fallback**: Enter USD peg values when CoinGecko IDs aren't available
- **Dynamic Form Generation**: Schema-based forms with Zod validation
- **Base64 Encoding**: Automatic encoding for deployment
- **Railway Deployment**: One-click deployment OR manual deployment with step-by-step guide

## 🏗️ Architecture

### Full-Stack Next.js Application
- **Frontend**: React with Next.js App Router
- **Backend**: Next.js API Routes (serverless)
- **Three-Stage Flow**:
  1. Template selection
  2. Dynamic form configuration
  3. Config output and deployment

### API Routes
- All API endpoints are Next.js API routes in `/src/app/api/`
- Server-side utilities in `/src/lib/server/`
- Can be deployed to Vercel, Railway, or any Next.js-compatible platform

### Schemas (`/src/lib/schemas/`)
Each adapter has:
- Zod validation schema
- TypeScript types
- Field definitions for UI rendering

Available adapters:
- `univ2` - Uniswap V2
- `univ3` - Uniswap V3
- `morpho` - Morpho lending protocol
- `printr` - Printr protocol
- `erc20` - ERC20 token holdings

## 🚀 Quick Start

### For Users: Deploy an Adapter

**No coding required!** Just:

1. Open the application
2. Select your adapter type (ERC20, Uniswap V2, or V3)
3. Fill in the contract details
4. Click deploy!

> 📖 **Full deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

### For Developers: Run Locally

#### Prerequisites
- Node.js 18+
- Required API keys (see Environment Variables below)

#### 1. Clone and Install

```bash
git clone <your-repo-url>
cd auto-adapter-forge
pnpm install  # or npm install
```

#### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Feature Flags
ENABLE_RAILWAY_DEPLOYMENT=false  # Set to 'true' to enable automated Railway deployment

# Railway API Configuration (only required if ENABLE_RAILWAY_DEPLOYMENT=true)
RAILWAY_API_TOKEN=your_railway_api_token
RAILWAY_WORKSPACE_ID=your_railway_workspace_id
RAILWAY_TEMPLATE_ID=e671e590-fec4-4beb-8044-37f013a351e9

# RPC Configuration (Infura or Alchemy API Key)
RPC_API_KEY=your_infura_or_alchemy_api_key

# Absinthe Configuration (for this generator app, NOT for deployed adapters)
ABSINTHE_API_KEY=your_absinthe_api_key
ABSINTHE_API_URL=https://v2.adapters.absinthe.network

# CoinGecko API Key
COINGECKO_API_KEY=your_coingecko_api_key

# Etherscan API Key (optional - for auto fromBlock lookup)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**⚠️ Important Notes**: 

- **For deployed adapters**: Users must get their own `ABSINTHE_API_KEY` from the [Absinthe App Dashboard](https://app.absinthe.network/dashboard) - NOT from this `.env` file
- Railway deployment is **disabled by default**. Set `ENABLE_RAILWAY_DEPLOYMENT=true` to enable automated deployment
- `ETHERSCAN_API_KEY` is optional (only needed for auto fromBlock lookup on supported chains)
- Manual Railway deployment is ALWAYS available, even without these env vars

#### 3. Run the Application

```bash
pnpm dev  # or npm run dev
```

Visit: **http://localhost:3000** 🎉

The application runs both frontend and API routes from the same Next.js server.

## 📖 API Documentation

### Backend Endpoints

#### `POST /api/classify`
Classify user input to determine adapter type.

**Request:**
```json
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

#### `POST /api/generate-config`
Generate complete Absinthe adapter configuration.

**Request:**
```json
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

#### `POST /api/deploy-railway`
Deploy configuration to Railway.

**Request:**
```json
{
  "configBase64": "eyJ...",
  "rpcUrl": "https://eth-mainnet.g.alchemy.com/v2/...",
  "redisUrl": "redis://...",
  "templateId": "optional"
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

## 🎨 User Flow

### Step 1: Select Adapter Type
Choose from:
- **ERC20 Holdings**: Track token balances
- **Uniswap V2**: Track swaps and LP positions on V2 pools
- **Uniswap V3**: Track swaps and positions on V3 pools

### Step 2: Fill the Form
Enter the required fields:
- Contract/Pool address
- Chain ID (auto-detects gateway URL)
- From Block (auto-detected for most chains)
- Optional: pricing overrides

### Step 3: Generate & Deploy
Two options:
1. **Generate Only**: Review the JSON/Base64 config, copy for manual use
2. **Deploy to Railway**: 
   - **Automated**: One-click deployment (if enabled)
   - **Manual**: Step-by-step instructions with the official [Railway Deployment Guide](https://absinthelabs.notion.site/Railway-Deployment-Process-Manual-2a0dfbd9a95880ca8c62f7a6d0fd490f)

### Step 4: Configure & Verify
After deployment:
- Add your environment variables in Railway
- Monitor deployment logs
- Verify data in Absinthe dashboard

> 📖 See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions

## 📦 Deployment

### Deploy Adapters to Railway

For deploying **Absinthe adapters** (the configs this tool generates):

> 📚 **Read the full guide**: [DEPLOYMENT.md](./DEPLOYMENT.md) or the official [Railway Deployment Process Manual](https://absinthelabs.notion.site/Railway-Deployment-Process-Manual-2a0dfbd9a95880ca8c62f7a6d0fd490f)

**Quick steps:**
1. Generate your config using this app
2. Click "Deploy to Railway (Manual)" for step-by-step instructions
3. Follow the 7-step deployment process:
   - Prepare your config
   - Open Railway deployment page
   - Start deployment
   - Fill in environment variables (including API key from Absinthe app)
   - Save configuration
   - Deploy your indexer
   - Verify successful deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Deploy This Application

To deploy **this config generator app** itself:

#### Vercel (Recommended)
```bash
pnpm install -g vercel
vercel
```

Set all environment variables in Vercel dashboard (same as `.env.local`).

#### Railway
```bash
railway login
railway init
railway up
```

Set all environment variables in Railway dashboard.

#### Other Platforms
Any platform that supports Next.js:
- Netlify
- Render
- AWS Amplify
- Cloudflare Pages

**Build Command**: `pnpm build`  
**Start Command**: `pnpm start`  
**Node Version**: 18+

Make sure to set all environment variables in your platform's dashboard.

## 🔧 Development

### Project Structure
```
auto-adapter-forge/
├── api/                          # Express.js backend
│   ├── server.js                 # Main server file
│   ├── package.json              # Backend dependencies
│   ├── .env.example              # Environment template
│   └── README.md                 # Backend documentation
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── AdapterForm.tsx       # Dynamic form renderer
│   │   ├── ConfigOutput.tsx      # Config display
│   │   ├── DeploymentDialog.tsx  # Railway deployment UI
│   │   ├── NaturalLanguageInput.tsx  # Stage 1 input
│   │   └── ProgressIndicator.tsx # Progress visualization
│   ├── lib/
│   │   ├── schemas/              # Adapter schemas
│   │   │   ├── univ2.ts
│   │   │   ├── univ3.ts
│   │   │   ├── morpho.ts
│   │   │   ├── printr.ts
│   │   │   └── erc20.ts
│   │   ├── api.ts                # API client functions
│   │   └── utils.ts
│   ├── pages/
│   │   └── Index.tsx             # Main application
│   └── hooks/
│       └── use-toast.ts          # Toast notifications
├── README.md                     # This file
└── package.json                  # Frontend dependencies
```

### Adding New Adapters

1. **Create schema** in `src/lib/schemas/my-adapter.ts`:

```typescript
import { z } from "zod";

export const myAdapterSchema = z.object({
  // Define fields
});

export type MyAdapterConfig = z.infer<typeof myAdapterSchema>;

export const myAdapterFields = [
  { name: "field1", label: "Field 1", type: "text", placeholder: "..." },
  // ...
] as const;
```

2. **Export** from `src/lib/schemas/index.ts`

3. **Add to mapping** in `src/pages/Index.tsx`

4. **Update classifier** in `api/server.js` to recognize the new adapter

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zod
- React Hook Form

### Backend
- Express.js
- OpenAI SDK
- CORS
- dotenv

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Express.js](https://expressjs.com/)
- [OpenAI](https://openai.com/)
- [Railway](https://railway.app/)

---

Built with ❤️ for the Absinthe ecosystem
