# ⚡ Quick Start - Get Running in 5 Minutes

## 1️⃣ Prerequisites (30 seconds)

```bash
node --version  # Should be >= 18
npm --version   # Should be >= 8
```

If not installed: [Download Node.js](https://nodejs.org)

You'll also need an **OpenAI API Key**:
- Get one at [platform.openai.com](https://platform.openai.com)
- Or use a compatible AI provider

## 2️⃣ Install Dependencies (1 minute)

```bash
# Install frontend
npm install

# Install backend
cd api
npm install
cd ..
```

## 3️⃣ Configure Environment (1 minute)

### Backend Configuration

Create `api/.env`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
AI_MODEL=gpt-3.5-turbo
PORT=3001
```

### Frontend Configuration

Create `.env` in project root:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## 4️⃣ Verify Setup (30 seconds)

```bash
node verify-setup.cjs
```

You should see all green checkmarks ✅

## 5️⃣ Run the App! (1 minute)

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

---

## 🧪 Test It Out (1 minute)

### Try This Example:

1. **Type in the input box:**
   ```
   I need a Uniswap V3 configuration for the USDC/ETH pool on Ethereum mainnet
   ```

2. **Click "Analyze & Continue"**
   - AI detects: Uniswap V3 ✨

3. **Fill the form:**
   - Pool Address: `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`
   - Token 0: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` (USDC)
   - Token 1: `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2` (WETH)
   - Fee Tier: `3000`
   - Chain ID: `1`
   - From Block: `15000000`
   - Pricing IDs: `usdc,weth`

4. **Click "Generate Config"**
   - AI generates complete Absinthe adapter config! 🎊

5. **Copy the config** or deploy to Railway!

---

## ⚠️ Troubleshooting

### Backend won't start
```bash
# Check if something is using port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in api/.env:
PORT=3002
```

### "Failed to classify adapter"
- Check your `OPENAI_API_KEY` in `api/.env`
- Make sure backend is running
- Check backend terminal for errors

### Frontend can't connect
- Verify backend is running on port 3001
- Check `VITE_API_BASE_URL` in `.env`
- Try: `curl http://localhost:3001/health`

### Port already in use (frontend)
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

---

## 📝 Alternative AI Providers

### Lovable AI Gateway
```env
# In api/.env
LOVABLE_API_KEY=your-key
AI_BASE_URL=https://ai.gateway.lovable.dev/v1
AI_MODEL=google/gemini-2.5-flash
```

### Local Model (Ollama)
```env
# In api/.env
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama2
OPENAI_API_KEY=dummy  # Required but unused
```

---

## 🚀 Deploy to Production

### Backend (Railway - Easiest)

```bash
cd api
railway login
railway init
railway up
```

Set in Railway dashboard:
- `OPENAI_API_KEY`

Copy your Railway URL: `https://your-app.up.railway.app`

### Frontend (Vercel - Easiest)

```bash
vercel
```

Set environment variable:
- `VITE_API_BASE_URL=https://your-backend-url`

---

## 🎯 What's Next?

1. **Full setup guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. **Documentation**: [README.md](README.md)
3. **Backend API docs**: [api/README.md](api/README.md)

---

## 💡 Tips

- Use `gpt-4` or `gpt-4-turbo-preview` for better config generation
- Railway deployment button requires `RAILWAY_API_TOKEN` in backend
- Frontend `.env` changes require restart (`Ctrl+C` then `npm run dev`)
- Backend `.env` changes auto-reload with `npm run dev`

---

## 🎊 You're Ready!

Your Absinthe Adapter Config Generator is now running!

**Backend**: http://localhost:3001
**Frontend**: http://localhost:5173

Start generating adapter configs with AI! 🚀

---

**Need Help?** Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

**Enjoy!** ✨
