# Absinthe Adapter API

Backend API for automated Railway deployment of Absinthe adapters.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Railway credentials:
```bash
cp .env.example .env
```

3. Update `.env` with your Railway API token and workspace ID:
```
RAILWAY_API_TOKEN=your_railway_api_token_here
RAILWAY_WORKSPACE_ID=your_workspace_id_here
RAILWAY_TEMPLATE_ID=e671e590-fec4-4beb-8044-37f013a351e9
PORT=3001
```

## Running

### Development Mode
```bash
npm run dev
```

### Production (Node.js)
```bash
npm run build
npm start
```

### Docker

#### Build Locally
```bash
docker build -t absinthe-adapter-api .
```

#### Build and Push to GitHub Container Registry (AMD64)

**Option 1: Using the build script (recommended)**
```bash
cd api
./build-and-push.sh latest
docker push ghcr.io/absinthelabs/absinthe-auto-forge-be:latest
```

**Option 2: Manual commands**

1. Log in to GHCR:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

2. Build and tag the image for AMD64:
```bash
docker build --platform=linux/amd64 -t ghcr.io/absinthelabs/absinthe-auto-forge-be:latest ./api
```

3. Push the image:
```bash
docker push ghcr.io/absinthelabs/absinthe-auto-forge-be:latest
```

**Note:** The build script and GitHub Actions automatically build for AMD64 platform, which is required for Railway and most cloud platforms.

#### Run the Container
```bash
docker run -d \
  -p 3002:3002 \
  -e RAILWAY_API_TOKEN=your_token \
  -e RAILWAY_WORKSPACE_ID=your_workspace_id \
  -e RPC_API_KEY=your_infura_api_key \
  -e ABSINTHE_API_KEY=your_absinthe_key \
  -e COINGECKO_API_KEY=your_coingecko_key \
  -e ETHERSCAN_API_KEY=your_etherscan_api_key \
  --name absinthe-api \
  ghcr.io/absinthelabs/absinthe-auto-forge-be:latest
```

**Note:** The image is automatically built and pushed to GHCR via GitHub Actions on every push to `main`.

### Docker Compose

Create a `.env` file with your environment variables, then:
```bash
docker-compose up -d
```

## API Endpoints

### POST /api/deploy-railway

Deploys an adapter configuration to Railway.

**Request Body:**
```json
{
  "configBase64": "base64_encoded_config_string",
  "chainId": 1,
  "templateId": "optional_template_id"
}
```

**Note:** RPC URL, Absinthe API Key, CoinGecko API Key, and Etherscan API Key are read from environment variables on the server.

**Response:**
```json
{
  "success": true,
  "projectId": "project_id",
  "workflowId": "workflow_id",
  "message": "Successfully deployed to Railway. Project ID: ..."
}
```

## Environment Variables

- `RAILWAY_API_TOKEN` - Your Railway API token (required)
- `RAILWAY_WORKSPACE_ID` - Your Railway workspace ID (required)
- `RAILWAY_TEMPLATE_ID` - Railway template ID (optional, defaults to "e671e590-fec4-4beb-8044-37f013a351e9")
- `RPC_API_KEY` - Your Infura API key (required). The RPC URL is automatically constructed based on the chain ID.
- `ABSINTHE_API_KEY` - Your Absinthe API key (required)
- `ABSINTHE_API_URL` - Absinthe API URL (optional, defaults to "https://v2.adapters.absinthe.network")
- `COINGECKO_API_KEY` - Your CoinGecko API key (required)
- `ETHERSCAN_API_KEY` - Your Etherscan V2 API key (optional, required for automatic fromBlock lookup on supported chains)
- `PORT` - Server port (default: 3002)

