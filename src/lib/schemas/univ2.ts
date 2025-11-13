import { z } from "zod";

export const univ2Schema = z.object({
  poolAddress: z.string().min(1, "Pool address is required"),
  token0: z.string().min(1, "Token 0 address is required"),
  token1: z.string().min(1, "Token 1 address is required"),
  chainId: z.number().min(1, "Chain ID is required"),
  fromBlock: z.number().min(0, "From block must be positive"),
  pricing: z.array(z.string()).min(1, "At least one pricing ID is required"),
});

export type Univ2Config = z.infer<typeof univ2Schema>;

export const univ2Fields = [
  { name: "poolAddress", label: "Pool Address", type: "text", placeholder: "0x..." },
  { name: "token0", label: "Token 0 Address", type: "text", placeholder: "0x..." },
  { name: "token1", label: "Token 1 Address", type: "text", placeholder: "0x..." },
  { name: "chainId", label: "Chain ID", type: "number", placeholder: "1" },
  { name: "fromBlock", label: "From Block", type: "number", placeholder: "0" },
  { name: "pricing", label: "Pricing IDs (comma separated)", type: "text", placeholder: "price1,price2" },
] as const;
