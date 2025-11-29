import { z } from "zod";
import { CHAIN_ID_TO_GATEWAY_URL } from "../chainMapping";

// Schema for a single swap entry
const swapEntrySchema = z.object({
  poolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  swapLegAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  pricingKind: z.enum(["pegged", "coingecko"]),
  usdPegValue: z.number().optional(),
  coingeckoId: z.string().optional(),
}).refine(
  (data) => {
    if (data.pricingKind === "pegged") {
      return data.usdPegValue !== undefined && data.usdPegValue > 0;
    }
    if (data.pricingKind === "coingecko") {
      return data.coingeckoId !== undefined && data.coingeckoId.length > 0;
    }
    return true;
  },
  {
    message: "USD peg value is required for pegged pricing, or CoinGecko ID for coingecko pricing",
    path: ["pricingKind"],
  }
);

// Schema for a single LP entry
const lpEntrySchema = z.object({
  poolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  token0PricingKind: z.enum(["pegged", "coingecko"]),
  token0UsdPegValue: z.number().optional(),
  token0CoingeckoId: z.string().optional(),
  token1PricingKind: z.enum(["pegged", "coingecko"]),
  token1UsdPegValue: z.number().optional(),
  token1CoingeckoId: z.string().optional(),
}).refine(
  (data) => {
    if (data.token0PricingKind === "pegged") {
      if (data.token0UsdPegValue === undefined || data.token0UsdPegValue <= 0) return false;
    }
    if (data.token0PricingKind === "coingecko") {
      if (!data.token0CoingeckoId || data.token0CoingeckoId.length === 0) return false;
    }
    if (data.token1PricingKind === "pegged") {
      if (data.token1UsdPegValue === undefined || data.token1UsdPegValue <= 0) return false;
    }
    if (data.token1PricingKind === "coingecko") {
      if (!data.token1CoingeckoId || data.token1CoingeckoId.length === 0) return false;
    }
    return true;
  },
  {
    message: "Pricing configuration is required for both tokens",
  }
);

export const univ2Schema = z.object({
  // Network configuration
  chainId: z.number().min(1, "Chain ID is required").refine(
    (chainId) => chainId in CHAIN_ID_TO_GATEWAY_URL,
    { message: "Invalid chain ID. Please select a supported chain." }
  ),
  gatewayUrl: z.string().url("Gateway URL must be a valid URL").optional(),
  rpcUrl: z.string().optional(),
  finality: z.number().min(1, "Finality must be at least 1").optional().default(75),
  
  // Range configuration
  fromBlock: z.number().min(0, "From block must be positive"),
  toBlock: z.number().optional(),
  
  // Sink configuration (handled automatically in backend)
  csvPath: z.string().min(1, "CSV path is required").default("uniswap-v2.csv").optional(),
  enableStdout: z.boolean().default(false).optional(),
  enableAbsinthe: z.boolean().default(true).optional(),
  
  // General configuration
  flushIntervalHours: z.number().min(1, "Flush interval must be at least 1 hour").optional().default(2),
  
  // Swap entries (array)
  swaps: z.array(swapEntrySchema).min(1, "At least one swap entry is required"),
  
  // LP entries (array)
  lps: z.array(lpEntrySchema).min(1, "At least one LP entry is required"),
});

export type Univ2Config = z.infer<typeof univ2Schema>;

// Field definitions for the form
export const univ2Fields = [
  // Network fields
  { name: "chainId", label: "Chain", type: "select", options: [1, 137, 42161, 8453, 10, 43111, 1000, 56, 43114, 143] },
  { name: "finality", label: "Finality", type: "number", placeholder: "75" }, // In advanced options
  
  // Range fields
  { name: "fromBlock", label: "From Block", type: "number", placeholder: "1451314" },
  { name: "toBlock", label: "To Block (optional)", type: "number", placeholder: "2524976" }, // In advanced options
  // Sink fields removed - handled automatically in backend
  
  // General fields (moved to advanced options)
  { name: "flushIntervalHours", label: "Flush Interval (hours)", type: "number", placeholder: "2" },
] as const;
