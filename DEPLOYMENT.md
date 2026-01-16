# 🚀 Deploy Prebuilt Adapters on Railway

This guide walks you through deploying Absinthe adapters to Railway using this configuration generator.

> 📚 **Official Documentation**: For the most up-to-date deployment process, see the [Railway Deployment Process Manual](https://absinthelabs.notion.site/Railway-Deployment-Process-Manual-2a0dfbd9a95880ca8c62f7a6d0fd490f)

---

## Table of Contents

1. [Why Railway?](#why-railway)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Deployment Guide](#step-by-step-deployment-guide)
4. [What Happens Once You Deploy?](#what-happens-once-you-deploy)
5. [What Happens After Deploy?](#what-happens-after-deploy)
6. [Troubleshooting](#troubleshooting)

---

## Why Railway?

Railway is the recommended deployment platform for Absinthe adapters because:

- **One-Click Deployment**: Use pre-configured templates for instant setup
- **Automatic Scaling**: Railway handles infrastructure automatically
- **Easy Environment Variables**: Simple UI for managing secrets
- **Built-in Logging**: Monitor your adapter in real-time
- **Cost-Effective**: Pay only for what you use
- **No DevOps Required**: Focus on your adapter config, not infrastructure

---

## Prerequisites

Before deploying, you'll need:

### 1. Absinthe API Key (Required)

⚠️ **IMPORTANT**: Get your API key from the **[Absinthe App Dashboard](https://app.absinthe.network)** - do NOT use keys from `.env` files or other sources.

**Step-by-step guide to get your API key:**

1. **Go to Absinthe App**: Visit [app.absinthe.network](https://app.absinthe.network) and log in
2. **Navigate to Organization**: Go to your respective organization
3. **Go to Campaigns**: Click on **Campaigns** in the navigation
4. **Select Your Campaign**: Choose the campaign you want to use
5. **Access API Keys**: Go to the **API Key Access** section
6. **Generate API Key**: Click to generate a new API key or copy an existing one
7. **Copy and Use**: Copy the API key and use it in your Railway deployment

### 2. RPC URL (Required)

You need an RPC endpoint for the blockchain you're indexing:

- **Ethereum**: [Alchemy](https://alchemy.com), [Infura](https://infura.io), [QuickNode](https://quicknode.com)
- **Base**: [Alchemy](https://alchemy.com), [QuickNode](https://quicknode.com)
- **Arbitrum**: [Alchemy](https://alchemy.com), [Infura](https://infura.io)
- **Polygon**: [Alchemy](https://alchemy.com), [Infura](https://infura.io)

Example RPC URL format:
```
https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### 3. CoinGecko API Key (Required)

For price feed functionality:

1. Go to [coingecko.com/api/pricing](https://www.coingecko.com/api/pricing)
2. Sign up for a Pro account
3. Get your API key

### 4. Railway Account

1. Sign up at [railway.app](https://railway.app)
2. Connect your GitHub account (optional but recommended)

---

## Step-by-Step Deployment Guide

### Step 1: Prepare Your Config

Make sure your config file is correctly set up. Refer to the [Config Setup Documentation](https://www.notion.so/Config-Setup-Lite-Document-2a0dfbd9a95880e69277e273059d015c) for detailed guidance.

1. **Generate Your Configuration**:
   - Visit this Config Generator application
   - Select your adapter type (ERC20, Uniswap V2, or Uniswap V3)
   - Fill in the required fields (contract address, chain ID, etc.)
   - Click "Generate Config"
   - Copy the Base64-encoded `INDEXER_CONFIG` (you'll need this in Step 4)

### Step 2: Open Railway Deployment Page

Go to the [Railway Deployment Page](https://railway.com/deploy/zonal-gentleness).

### Step 3: Start Deployment

1. Click **"Deploy Now"**
2. Select **"Configure Now for absinthelabs/absinthe-adapters:latest"**

### Step 4: Fill in Environment Variables

Add these **required** environment variables in Railway:

#### a. `ABSINTHE_API_KEY` *

**How to get your API key:**

1. Go to [app.absinthe.network](https://app.absinthe.network) and log in
2. Navigate to your respective organization
3. Go to **Campaigns** and select your campaign
4. Go to **API Key Access** section
5. Generate your API key and copy it

⚠️ **Important**: Obtain this after creating your config from the Absinthe app. Do NOT use keys from `.env` files or other sources.

#### b. `RPC_URL` *

Your RPC endpoint URL for the blockchain you're indexing.

- **For Absinthe team members**: Ping @Andrew Magid or @Kushagra Sharma to get this quickly
- **For others**: Get from [Alchemy](https://alchemy.com), [Infura](https://infura.io), or [QuickNode](https://quicknode.com)

Example format:
```
https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

#### c. `COINGECKO_API_KEY` *

Your CoinGecko Pro API key for price feeds.

- **For Absinthe team members**: Ping @Andrew Magid or @Kushagra Sharma to get this quickly
- **For others**: Sign up at [coingecko.com/api/pricing](https://www.coingecko.com/api/pricing)

#### d. `INDEXER_CONFIG` *

Paste the Base64-encoded config you generated from the Config Generator in Step 1.

### Step 5: Save Your Configuration

Click **"Save Config"** in Railway after filling in all environment variables.

### Step 6: Deploy Your Indexer

Click **"Deploy"** to start your indexer.

### Step 7: Verify Successful Deployment

Make sure you see a successful deployment run in Railway. Check:

- ✅ Deployment status shows as "Success" or "Running"
- ✅ Logs show the indexer is starting up correctly
- ✅ No error messages in the deployment logs
- ✅ Monitor the Absinthe dashboard for incoming events

---

## What Happens Once You Deploy?

When you click deploy on Railway:

1. **Container Builds**: Railway builds a Docker container with the Absinthe indexer
2. **Environment Injection**: Your environment variables are injected securely
3. **Indexer Starts**: The adapter begins:
   - Connecting to your RPC endpoint
   - Fetching historical blockchain data from `fromBlock`
   - Processing events (transfers, swaps, LP actions)
   - Sending data to Absinthe

### Initial Sync

- The adapter will start syncing from your configured `fromBlock`
- Initial sync can take time depending on the block range
- You'll see progress in the Railway logs

### Ongoing Operation

Once synced, the adapter:
- Monitors new blocks in real-time
- Processes new events as they occur
- Sends data to Absinthe continuously

---

## What Happens After Deploy?

### Verification Steps

1. **Check Railway Logs**
   - Go to your project in Railway
   - Click on the deployment
   - View logs to confirm the adapter is running
   - Look for messages like "Indexer started", "Processing block X"

2. **Verify in Absinthe Dashboard**
   - Go to [app.absinthe.network](https://app.absinthe.network)
   - Check your adapter is listed
   - Verify events are being received

3. **Monitor Performance**
   - Check sync progress in logs
   - Monitor memory/CPU usage in Railway
   - Verify data quality in Absinthe

### Where to Look for Issues

| Symptom | Where to Check | Common Causes |
|---------|----------------|---------------|
| Adapter not starting | Railway deployment logs | Missing env vars, invalid config |
| No data in Absinthe | Absinthe dashboard | Wrong API key, adapter not synced |
| Slow sync | Railway logs | RPC rate limits, large block range |
| Errors in logs | Railway logs | Invalid contract address, RPC issues |

---

## Troubleshooting

### Common Issues

#### "Invalid API Key" Error
- Verify you're using the API key from [Absinthe App Dashboard](https://app.absinthe.network/dashboard)
- Don't use keys from `.env` files or example configs

#### "RPC Connection Failed"
- Check your RPC URL is correct and includes your API key
- Verify your RPC provider account is active
- Try a different RPC provider

#### "Contract Not Found"
- Verify the contract address is correct
- Ensure you selected the correct chain
- Check if the contract exists on the selected chain

#### "fromBlock Not Found"
- Some chains don't support automatic block lookup
- Manually provide the `fromBlock` value
- Find the contract creation block on a block explorer

#### Adapter Crashes After Deploy
- Check Railway logs for specific error messages
- Verify all environment variables are set correctly
- Ensure your RPC has sufficient rate limits

### Getting Help

1. **Read the Docs**: [Railway Deployment Process Manual](https://absinthelabs.notion.site/Railway-Deployment-Process-Manual-2a0dfbd9a95880ca8c62f7a6d0fd490f)
2. **Check Logs**: Railway provides detailed deployment logs
3. **Contact Support**: Reach out to Absinthe Labs for assistance

---

## Quick Reference

### Environment Variables Checklist

```bash
# Required
INDEXER_CONFIG=<base64_encoded_config>  # From this generator
RPC_URL=<your_rpc_endpoint>             # From Alchemy/Infura
ABSINTHE_API_KEY=<your_api_key>         # From app.absinthe.network/dashboard
COINGECKO_API_KEY=<your_cg_key>         # From coingecko.com
```

### Useful Links

- 📚 [Railway Deployment Documentation](https://absinthelabs.notion.site/Railway-Deployment-Process-Manual-2a0dfbd9a95880ca8c62f7a6d0fd490f)
- 🔑 [Absinthe App Dashboard](https://app.absinthe.network/dashboard)
- 🚂 [Railway Template](https://railway.com/new/template/zonal-gentleness)
- 📊 [CoinGecko API](https://coingecko.com/api/pricing)

---

Built with ❤️ for the Absinthe ecosystem
