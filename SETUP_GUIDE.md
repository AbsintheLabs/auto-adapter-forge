# Complete Setup Guide

Follow these steps to get your Absinthe Adapter Config Generator up and running with the Express.js backend.

## 1️⃣ Prerequisites Check

Make sure you have:
- [ ] Node.js 18 or higher installed
- [ ] npm or yarn package manager
- [ ] An OpenAI API key (or compatible AI provider key)

Check your Node version:
```bash
node --version  # Should be >= 18
npm --version   # Should be >= 8
```

## 2️⃣ Project Setup

### Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd auto-adapter-forge

# Install frontend dependencies
npm install

# Install backend dependencies
cd api
npm install
cd ..
```

## 3️⃣ Backend Configuration

### Create API Environment File

Navigate to the `api/` directory and create a `.env` file:

```bash
cd api
cp .env.example .env
```

Edit `api/.env`:

```env
# Required: OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# AI Model to use
AI_MODEL=gpt-3.5-turbo

# Server Port
PORT=3001

# Optional: Railway deployment
# RAILWAY_API_TOKEN=your-railway-api-token
# RAILWAY_TEMPLATE_ID=your-template-id
```

### Get an OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy it to your `.env` file

**Alternative AI Providers:**

If you prefer to use a different AI provider:

**Lovable AI Gateway:**
```env
LOVABLE_API_KEY=your-lovable-key
AI_BASE_URL=https://ai.gateway.lovable.dev/v1
AI_MODEL=google/gemini-2.5-flash
```

**Local Model (Ollama):**
```env
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama2
OPENAI_API_KEY=dummy-key  # Required but not used
```

## 4️⃣ Frontend Configuration

### Create Frontend Environment File

In the project root, create a `.env` file:

```bash
# From project root
cp .env.example .env
```

Edit `.env`:

```env
# For local development
VITE_API_BASE_URL=http://localhost:3001

# Optional: Default values for deployment dialog
# VITE_DEFAULT_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
# VITE_DEFAULT_REDIS_URL=redis://localhost:6379
```

**Note:** For production, update `VITE_API_BASE_URL` to your deployed backend URL.

## 5️⃣ Verify Setup

Run the verification script:

```bash
node verify-setup.cjs
```

You should see all green checkmarks ✅

## 6️⃣ Run the Application

You need to run both the backend and frontend:

### Terminal 1: Start Backend

```bash
cd api
npm run dev
```

You should see:
```
🚀 Absinthe Adapter API running on port 3001
📍 Health check: http://localhost:3001/health
```

### Terminal 2: Start Frontend

```bash
# From project root
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Visit the Application

Open your browser to: **http://localhost:5173** 🎉

## 7️⃣ Test the Application

### Quick Test

1. **Type in the input box:**
   ```
   I need a Uniswap V3 configuration for the USDC/ETH pool
   ```

2. **Click "Analyze & Continue"**
   - The AI should detect: Uniswap V3

3. **Fill the form:**
   - Pool Address: `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`
   - Token 0 (USDC): `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
   - Token 1 (WETH): `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`
   - Fee Tier: `3000`
   - Chain ID: `1`
   - From Block: `15000000`
   - Pricing IDs: `usdc,weth`

4. **Click "Generate Config"**
   - AI generates complete configuration

5. **Copy or Deploy**
   - Copy the JSON or Base64 config
   - Or deploy to Railway (if configured)

## 8️⃣ Production Deployment

### Deploy Backend

#### Option A: Railway

```bash
cd api

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

**Set Environment Variables in Railway Dashboard:**
- `OPENAI_API_KEY`
- `AI_MODEL=gpt-3.5-turbo`
- `RAILWAY_API_TOKEN` (optional, for deployment feature)

**Get your backend URL:** `https://your-app.up.railway.app`

#### Option B: Render

1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repository
4. Settings:
   - **Root Directory:** `api`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `OPENAI_API_KEY`
   - `AI_MODEL=gpt-3.5-turbo`

#### Option C: Vercel

```bash
cd api

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard.

### Deploy Frontend

#### Option A: Vercel

```bash
# From project root
vercel
```

**Set Environment Variables:**
- `VITE_API_BASE_URL=https://your-backend-url.com`

#### Option B: Netlify

```bash
# Build the app
npm run build

# Deploy dist/ folder to Netlify
```

**Set Environment Variables:**
- `VITE_API_BASE_URL=https://your-backend-url.com`

#### Option C: Any Static Host

```bash
npm run build
# Upload the dist/ folder
```

## 9️⃣ Troubleshooting

### Backend Issues

**"Failed to classify adapter"**
- Check that `OPENAI_API_KEY` is set correctly in `api/.env`
- Verify the backend is running: `curl http://localhost:3001/health`
- Check backend logs for errors

**"OpenAI API error"**
- Verify your API key is valid
- Check you have credits in your OpenAI account
- Try using a different model (e.g., `gpt-3.5-turbo`)

### Frontend Issues

**"Failed to connect to API"**
- Make sure backend is running on port 3001
- Check `VITE_API_BASE_URL` in `.env`
- Look for CORS errors in browser console

**"Cannot find module"**
- Make sure you ran `npm install` in both root and `api/` directories
- Try deleting `node_modules` and reinstalling

### Port Conflicts

If port 3001 or 5173 is already in use:

**Backend:**
```env
# In api/.env
PORT=3002
```

Then update frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:3002
```

**Frontend:**
```bash
npm run dev -- --port 3000
```

### API Rate Limits

If you hit OpenAI rate limits:
- Wait a few minutes
- Upgrade your OpenAI plan
- Use a different AI provider

## 🎯 Optional Features

### Railway Deployment Feature

To enable the "Deploy to Railway" button:

1. Get a Railway API token from [railway.app](https://railway.app)
2. Add to `api/.env`:
   ```env
   RAILWAY_API_TOKEN=your-token-here
   RAILWAY_TEMPLATE_ID=your-template-id (optional)
   ```
3. Restart the backend

### Custom AI Provider

To use a custom AI provider, modify `api/server.js`:

```javascript
const openai = new OpenAI({
  apiKey: process.env.YOUR_API_KEY,
  baseURL: 'https://your-ai-provider.com/v1',
});
```

## 📚 Next Steps

- Read the main [README.md](README.md) for architecture details
- Check [QUICKSTART.md](QUICKSTART.md) for a faster setup
- See [api/README.md](api/README.md) for backend API documentation
- Explore the schemas in `src/lib/schemas/` to understand adapter types

## 🎉 You're Ready!

Your Absinthe Adapter Config Generator is now fully functional. Start creating adapter configurations with AI!

---

**Need Help?** Open an issue or check the documentation files.

**Enjoy!** 🚀
