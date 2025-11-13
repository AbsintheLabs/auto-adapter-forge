import { z } from "zod";

export const printrSchema = z.object({
  contractAddress: z.string().min(1, "Contract address is required"),
  tokenAddress: z.string().min(1, "Token address is required"),
  chainId: z.number().min(1, "Chain ID is required"),
  fromBlock: z.number().min(0, "From block must be positive"),
  pricing: z.array(z.string()).min(1, "At least one pricing ID is required"),
});

export type PrintrConfig = z.infer<typeof printrSchema>;

export const printrFields = [
  { name: "contractAddress", label: "Contract Address", type: "text", placeholder: "0x..." },
  { name: "tokenAddress", label: "Token Address", type: "text", placeholder: "0x..." },
  { name: "chainId", label: "Chain ID", type: "number", placeholder: "1" },
  { name: "fromBlock", label: "From Block", type: "number", placeholder: "0" },
  { name: "pricing", label: "Pricing IDs (comma separated)", type: "text", placeholder: "price1,price2" },
] as const;
