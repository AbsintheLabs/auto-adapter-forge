import { getEnv, CHAIN_ID_TO_COINGECKO_PLATFORM } from './config';

/**
 * Get CoinGecko ID for a token address
 */
export async function getCoinGeckoId(
  tokenAddress: string,
  chainId: number
): Promise<{ id?: string; name?: string; symbol?: string } | null> {
  const env = getEnv();
  const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[chainId];
  
  if (!platform) {
    return null;
  }

  try {
    const response = await fetch(
      `https://pro-api.coingecko.com/api/v3/coins/${platform}/contract/${tokenAddress.toLowerCase()}`,
      {
        headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json() as { id?: string; name?: string; symbol?: string };
  } catch {
    return null;
  }
}

/**
 * Get base CoinGecko ID (remove chain-specific prefixes)
 */
export async function getBaseCoinId(coinId: string): Promise<string> {
  const env = getEnv();
  
  try {
    const coinResponse = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${coinId}`, {
      headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
    });
    
    if (coinResponse.ok) {
      const coinData = await coinResponse.json() as { 
        id?: string; 
        parent?: { id?: string };
      };
      
      if (coinData.parent?.id) {
        return coinData.parent.id;
      }
      
      const chainPrefixes = ['hemi-', 'stargate-bridged-', 'wrapped-', 'bridged-'];
      for (const prefix of chainPrefixes) {
        if (coinId.startsWith(prefix)) {
          const baseId = coinId.replace(prefix, '');
          const baseCheck = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${baseId}`, {
            headers: { 'x-cg-pro-api-key': env.COINGECKO_API_KEY },
          });
          if (baseCheck.ok) {
            return baseId;
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Could not fetch base coin for ${coinId}, using original ID`);
  }
  
  return coinId;
}
