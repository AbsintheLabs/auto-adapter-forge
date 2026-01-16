import { ETHERSCAN_V2_BASE_URL, getEnv, isScanSupported } from './config';

/**
 * Fetch contract creation block using Etherscan V2 API with retry logic
 */
export async function getContractCreationBlock(
  contractAddress: string,
  chainId: number,
  retryDelays: number[] = [1000, 2000] // Faster retries - don't pause the system
): Promise<{ blockNumber: number; creator: string; txHash: string } | null> {
  if (!isScanSupported(chainId)) {
    return null;
  }

  const env = getEnv();
  const apiKey = env.ETHERSCAN_API_KEY || '';

  if (!apiKey) {
    console.warn(`No ETHERSCAN_API_KEY configured for chain ${chainId}`);
    return null;
  }

  const attemptFetch = async (): Promise<{ blockNumber: number; creator: string; txHash: string } | null> => {
    try {
      const url = `${ETHERSCAN_V2_BASE_URL}?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429 || response.status === 403) {
          throw new Error('API_LIMIT_HIT');
        }
        console.error(`Scan API error for chain ${chainId}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json() as {
        status?: string;
        message?: string;
        result?: Array<{
          contractAddress: string;
          contractCreator: string;
          txHash: string;
          blockNumber: string;
          timestamp?: string;
          contractFactory?: string;
          creationBytecode?: string;
        }>;
      };

      if (data.message && (data.message.toLowerCase().includes('rate limit') || data.message.toLowerCase().includes('max rate limit'))) {
        throw new Error('API_LIMIT_HIT');
      }

      if (data.status === '1' && data.result && data.result.length > 0) {
        const result = data.result[0];
        
        if (result.blockNumber) {
          const blockNumber = parseInt(result.blockNumber, 10);
          return {
            blockNumber,
            creator: result.contractCreator,
            txHash: result.txHash,
          };
        }
      }

      return null;
    } catch (error) {
      if (error instanceof Error && error.message === 'API_LIMIT_HIT') {
        throw error;
      }
      console.error(`Error fetching contract creation block for chain ${chainId}:`, error);
      return null;
    }
  };

  // Try initial attempt
  try {
    const result = await attemptFetch();
    if (result) return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'API_LIMIT_HIT') {
      console.log(`⚠️ API limit hit for chain ${chainId}, will retry...`);
    } else {
      return null;
    }
  }

  // Retry with delays
  for (let i = 0; i < retryDelays.length; i++) {
    const delay = retryDelays[i];
    console.log(`⏳ Retrying fromBlock fetch after ${delay / 1000}s (attempt ${i + 2}/${retryDelays.length + 1})...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      const result = await attemptFetch();
      if (result) {
        console.log(`✅ Successfully fetched fromBlock on retry ${i + 2}`);
        return result;
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'API_LIMIT_HIT') {
        console.log(`⚠️ API limit still hit, will retry again...`);
        if (i === retryDelays.length - 1) {
          console.error(`❌ All retry attempts failed for fromBlock fetch`);
        }
      } else {
        return null;
      }
    }
  }

  return null;
}
