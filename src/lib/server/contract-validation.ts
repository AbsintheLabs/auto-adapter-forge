import { ethers } from 'ethers';
import { getEnv, getRpcUrlForChain } from './config';

/**
 * Check if a contract exists on the specified chain by checking if it has code
 * Returns true if contract exists, false if it doesn't (or is an EOA)
 */
export async function validateContractExists(
  contractAddress: string,
  chainId: number
): Promise<{ exists: boolean; isContract: boolean; error?: string }> {
  try {
    const env = getEnv();
    const rpcUrl = getRpcUrlForChain(chainId, env.RPC_API_KEY);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Check if address is valid
    if (!ethers.isAddress(contractAddress)) {
      return { exists: false, isContract: false, error: 'Invalid address format' };
    }
    
    // Get code at address - if it has code, it's a contract
    const code = await provider.getCode(contractAddress);
    const isContract = code !== '0x' && code !== null;
    
    return { exists: true, isContract };
  } catch (error) {
    console.warn(`⚠️ Could not validate contract ${contractAddress} on chain ${chainId}:`, error);
    // Don't block - assume it exists and let the actual contract calls fail if needed
    return { exists: true, isContract: true, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Validate a pool contract and try to get tokens
 * Returns validation result with warnings if contract doesn't exist or is wrong type
 */
export async function validatePoolContract(
  contractAddress: string,
  chainId: number,
  poolType: 'uniswap-v2' | 'uniswap-v3'
): Promise<{
  valid: boolean;
  token0?: string;
  token1?: string;
  warnings: string[];
  errors: string[];
}> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    const env = getEnv();
    const rpcUrl = getRpcUrlForChain(chainId, env.RPC_API_KEY);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // First check if contract exists
    const validation = await validateContractExists(contractAddress, chainId);
    if (!validation.exists || !validation.isContract) {
      errors.push(`Contract does not exist at ${contractAddress} on chain ${chainId}. This address may be an EOA (Externally Owned Account) or the contract may be on a different chain.`);
      return { valid: false, warnings, errors };
    }
    
    // Try to call the contract to get tokens
    const poolABI = [
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
    ];
    
    const poolContract = new ethers.Contract(contractAddress, poolABI, provider);
    
    try {
      const [token0, token1] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
      ]);
      
      if (!token0 || !token1 || token0 === ethers.ZeroAddress || token1 === ethers.ZeroAddress) {
        warnings.push(`Contract exists but returned invalid token addresses. Token0: ${token0 || 'null'}, Token1: ${token1 || 'null'}`);
        return { valid: false, warnings, errors };
      }
      
      if (!ethers.isAddress(token0) || !ethers.isAddress(token1)) {
        warnings.push(`Contract exists but returned invalid address format for tokens.`);
        return { valid: false, warnings, errors };
      }
      
      return { valid: true, token0, token1, warnings, errors };
    } catch (contractError) {
      const errorMsg = contractError instanceof Error ? contractError.message : 'Unknown error';
      if (errorMsg.includes('execution reverted') || errorMsg.includes('call revert exception')) {
        warnings.push(`Contract exists but does not appear to be a valid ${poolType} pool. The contract may be on a different chain or may not implement the expected interface.`);
      } else {
        warnings.push(`Could not call contract methods: ${errorMsg}`);
      }
      return { valid: false, warnings, errors };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to validate contract: ${errorMsg}`);
    return { valid: false, warnings, errors };
  }
}

/**
 * Validate an ERC20 token contract
 */
export async function validateERC20Contract(
  contractAddress: string,
  chainId: number
): Promise<{
  valid: boolean;
  warnings: string[];
  errors: string[];
}> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    // Check if contract exists
    const validation = await validateContractExists(contractAddress, chainId);
    if (!validation.exists || !validation.isContract) {
      warnings.push(`⚠️ Address ${contractAddress} does not appear to be a contract on chain ${chainId}. It may be an EOA or on a different chain. Proceeding anyway...`);
      // Don't block - just warn
      return { valid: true, warnings, errors };
    }
    
    // Try to call a standard ERC20 method to verify it's an ERC20
    const env = getEnv();
    const rpcUrl = getRpcUrlForChain(chainId, env.RPC_API_KEY);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const erc20ABI = [
      "function symbol() external view returns (string)",
      "function decimals() external view returns (uint8)",
    ];
    
    const tokenContract = new ethers.Contract(contractAddress, erc20ABI, provider);
    
    try {
      await Promise.all([
        tokenContract.symbol().catch(() => null),
        tokenContract.decimals().catch(() => null),
      ]);
      // If we got here, it's likely an ERC20
      return { valid: true, warnings, errors };
    } catch (contractError) {
      const errorMsg = contractError instanceof Error ? contractError.message : 'Unknown error';
      warnings.push(`Contract exists but may not be a standard ERC20 token: ${errorMsg}. Proceeding anyway...`);
      // Don't block - just warn
      return { valid: true, warnings, errors };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    warnings.push(`Could not fully validate contract: ${errorMsg}. Proceeding anyway...`);
    // Don't block - just warn
    return { valid: true, warnings, errors };
  }
}
