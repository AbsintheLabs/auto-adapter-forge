import { z } from "zod";
import { CHAIN_ID_TO_GATEWAY_URL } from "../chainMapping";

export const erc20Schema = z.object({
  // Network configuration
  chainId: z.number().min(1, "Chain ID is required").refine(
    (chainId) => chainId in CHAIN_ID_TO_GATEWAY_URL,
    { message: "Invalid chain ID. Please select a supported chain." }
  ),
  gatewayUrl: z.string().url("Gateway URL must be a valid URL").optional(), // Will be auto-set from chainId
  finality: z.number().min(1, "Finality must be at least 1").optional().default(75),
  
  // Range configuration
  fromBlock: z.number().min(0, "From block must be positive"),
  toBlock: z.number().optional(),
  
  // Sink configuration (handled automatically in backend)
  csvPath: z.string().min(1, "CSV path is required").default("positions.csv").optional(),
  enableStdout: z.boolean().default(true).optional(),
  enableAbsinthe: z.boolean().default(true).optional(),
  
  // General configuration
  flushIntervalHours: z.number().min(1, "Flush interval must be at least 1 hour").optional().default(1),
  
  // Adapter-specific configuration
  tokenContractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  pricingKind: z.enum(["pegged", "coingecko"], {
    errorMap: () => ({ message: "Pricing kind must be 'pegged' or 'coingecko'" }),
  }),
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

export type Erc20Config = z.infer<typeof erc20Schema>;

export const erc20Fields = [
  // Network fields
  { name: "chainId", label: "Chain", type: "select", options: [1, 137, 42161, 8453, 10, 43111, 1000, 56, 43114, 143] },
  { name: "finality", label: "Finality", type: "number", placeholder: "75" }, // In advanced options
  
  // Range fields
  { name: "fromBlock", label: "From Block", type: "number", placeholder: "2000000" },
  { name: "toBlock", label: "To Block (optional)", type: "number", placeholder: "2005000" }, // In advanced options
  // Sink fields removed - handled automatically in backend
  
  // General fields (moved to advanced options)
  { name: "flushIntervalHours", label: "Flush Interval (hours)", type: "number", placeholder: "1" },
  
  // Adapter fields
  { name: "tokenContractAddress", label: "Token Contract Address", type: "text", placeholder: "0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28" },
  { name: "pricingKind", label: "Pricing Kind", type: "select", options: ["pegged", "coingecko"] },
  { name: "usdPegValue", label: "USD Peg Value (for pegged pricing)", type: "number", placeholder: "121613.2" },
  { name: "coingeckoId", label: "CoinGecko ID (for coingecko pricing)", type: "text", placeholder: "ethereum" },
] as const;
