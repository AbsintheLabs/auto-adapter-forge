import { z } from "zod";

export const erc20Schema = z.object({
  tokenAddress: z.string().min(1, "Token address is required"),
  holderAddress: z.string().min(1, "Holder address is required"),
  chainId: z.number().min(1, "Chain ID is required"),
  fromBlock: z.number().min(0, "From block must be positive"),
  pricing: z.array(z.string()).min(1, "At least one pricing ID is required"),
});

export type Erc20Config = z.infer<typeof erc20Schema>;

export const erc20Fields = [
  { name: "tokenAddress", label: "Token Address", type: "text", placeholder: "0x..." },
  { name: "holderAddress", label: "Holder Address", type: "text", placeholder: "0x..." },
  { name: "chainId", label: "Chain ID", type: "number", placeholder: "1" },
  { name: "fromBlock", label: "From Block", type: "number", placeholder: "0" },
  { name: "pricing", label: "Pricing IDs (comma separated)", type: "text", placeholder: "price1,price2" },
] as const;
