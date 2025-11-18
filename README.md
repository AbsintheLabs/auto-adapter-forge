# Absinthe Adapter Config Generator

AI-powered configuration generator for Absinthe adapters. This full-stack web application accepts natural language input, classifies the required adapter type using AI, renders dynamic forms based on schemas, and generates complete Absinthe adapter configurations.

## 🎯 Features

- **Natural Language Input**: Describe your needs in plain English
- **AI-Powered Classification**: Automatically detects which adapter you need (Uniswap V2/V3, Morpho, Printr, ERC20)
- **Dynamic Form Generation**: Schema-based forms with Zod validation
- **Config Generation**: AI-generated Absinthe adapter configurations
- **Base64 Encoding**: Automatic encoding for deployment
- **Railway Deployment**: One-click deployment to Railway with environment configuration

## 🏗️ Architecture

### Frontend (Vite + React)
- **Three-Stage Flow**:
  1. Natural language input
  2. Dynamic form configuration
  3. Config output and deployment

### Backend (Express.js)
- Standalone API server
- Can be deployed anywhere (Railway, Render, Vercel, Heroku, etc.)
- Uses OpenAI or any compatible AI provider

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

### Prerequisites
- Node.js 18+
- OpenAI API key (or compatible AI provider)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd auto-adapter-forge

# Install frontend dependencies
npm install

# Install backend dependencies
cd api
npm install
cd ..
```

### 2. Configure Environment

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:3001
```

**Backend `api/.env`:**
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
AI_MODEL=gpt-3.5-turbo
PORT=3001

# Optional: Railway deployment
# RAILWAY_API_TOKEN=your-token
# RAILWAY_TEMPLATE_ID=your-template-id
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit: **http://localhost:5173** 🎉

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

## 🎨 Usage Flow

### Step 1: Natural Language Input
Type your requirement:
```
"I need a Uniswap V3 config for the USDC/ETH pool on Ethereum mainnet"
```

### Step 2: Fill Dynamic Form
The AI detects the adapter type and shows you a form with the required fields:
- Pool Address
- Token addresses
- Chain ID
- Block ranges
- Pricing IDs

### Step 3: Generate & Deploy
- Review the generated JSON configuration
- Copy JSON or Base64 encoded config
- Deploy to Railway with one click

## 📦 Deployment

### Backend Deployment

#### Railway
```bash
cd api
railway login
railway init
railway up
```

Set environment variables in Railway dashboard:
- `OPENAI_API_KEY`
- `AI_MODEL` (optional)
- `RAILWAY_API_TOKEN` (optional)

#### Render
1. Create new Web Service
2. Root directory: `api`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables

#### Vercel
```bash
cd api
vercel
```

### Frontend Deployment

#### Vercel
```bash
vercel
```

Set environment variable:
- `VITE_API_BASE_URL` (your backend URL)

#### Netlify
```bash
npm run build
# Upload dist/ folder
```

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
