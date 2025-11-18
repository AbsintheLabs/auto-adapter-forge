# Migration from Supabase to Express.js

This document explains the migration from Supabase Edge Functions to a standalone Express.js backend.

## What Changed

### ❌ Removed
- Supabase Edge Functions (`supabase/functions/`)
- Supabase client (`src/integrations/supabase/`)
- Supabase dependencies
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

### ✅ Added
- Express.js backend (`api/`)
- Direct HTTP API calls
- OpenAI SDK integration
- Simplified deployment

## Why the Change?

1. **More Control**: Full control over the backend
2. **Easier Deployment**: Deploy backend anywhere (Railway, Render, Vercel, etc.)
3. **No Vendor Lock-in**: Not tied to Supabase
4. **Simpler Setup**: No need for Supabase CLI or project setup
5. **Local Development**: Easier to run and debug locally

## Migration Steps

### 1. Install Backend Dependencies

```bash
cd api
npm install
```

### 2. Update Environment Variables

**Before (Supabase):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

**After (Express.js):**

Frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
```

Backend `api/.env`:
```env
OPENAI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-3.5-turbo
PORT=3001
```

### 3. API Changes

**Before (Supabase Functions):**
```typescript
const { data, error } = await supabase.functions.invoke("classify-adapter", {
  body: { prompt },
});
```

**After (Direct HTTP):**
```typescript
const response = await fetch(`${API_BASE_URL}/api/classify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
});
const data = await response.json();
```

### 4. Running the Application

**Before:**
```bash
# Only frontend
npm run dev
```

**After:**
```bash
# Terminal 1: Backend
cd api && npm run dev

# Terminal 2: Frontend
npm run dev
```

### 5. Deployment Changes

**Before (Supabase):**
```bash
supabase functions deploy classify-adapter
supabase functions deploy generate-config
supabase functions deploy deploy-railway
```

**After (Railway):**
```bash
# Backend
cd api
railway up

# Frontend
vercel
```

## API Endpoint Mapping

| Supabase Function | Express.js Endpoint |
|-------------------|-------------------|
| `classify-adapter` | `POST /api/classify` |
| `generate-config` | `POST /api/generate-config` |
| `deploy-railway` | `POST /api/deploy-railway` |

## Benefits of the New Architecture

### Development Experience
- ✅ Easier local debugging
- ✅ No CLI required for deployment
- ✅ Standard Express.js patterns
- ✅ Hot reload with `--watch` flag

### Deployment Flexibility
- ✅ Deploy to Railway, Render, Vercel, Heroku, or any Node.js host
- ✅ No Supabase account required
- ✅ Simpler environment variables
- ✅ Standard deployment workflows

### Cost & Control
- ✅ Pay only for what you use
- ✅ Choose your AI provider (OpenAI, Anthropic, local models)
- ✅ Full control over API logic
- ✅ Easy to add middleware, logging, etc.

## Compatibility

The frontend API interface remains the same. The functions have the same signatures:

```typescript
// Still works the same way
const classification = await classifyAdapter(prompt);
const config = await generateConfig(adapter, fields);
const deployment = await deployToRailway(configBase64, rpcUrl, redisUrl);
```

## Using Alternative AI Providers

### Anthropic (Claude)

```bash
cd api
npm install @anthropic-ai/sdk
```

Update `server.js` to use Anthropic SDK.

### Local Models (Ollama)

```env
# In api/.env
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama2
OPENAI_API_KEY=dummy  # Required but unused
```

### Lovable AI Gateway

```env
# In api/.env
LOVABLE_API_KEY=your-key
AI_BASE_URL=https://ai.gateway.lovable.dev/v1
AI_MODEL=google/gemini-2.5-flash
```

## Rollback (If Needed)

If you need to rollback to Supabase:

1. Restore the `supabase/` directory from git history
2. Restore `src/integrations/supabase/` from git history
3. Restore old `src/lib/api.ts` from git history
4. Update `.env` with Supabase credentials
5. Deploy Supabase functions

```bash
git checkout HEAD~1 -- supabase/
git checkout HEAD~1 -- src/integrations/supabase/
git checkout HEAD~1 -- src/lib/api.ts
```

## Questions?

Check the documentation:
- [README.md](README.md) - Full documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [api/README.md](api/README.md) - Backend API docs

---

**Migration Complete!** You're now running with Express.js backend. 🚀

