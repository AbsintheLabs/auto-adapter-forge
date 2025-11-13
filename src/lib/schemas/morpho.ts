import { z } from "zod";

export const morphoSchema = z.object({
  marketId: z.string().min(1, "Market ID is required"),
  collateralToken: z.string().min(1, "Collateral token is required"),
  loanToken: z.string().min(1, "Loan token is required"),
  chainId: z.number().min(1, "Chain ID is required"),
  fromBlock: z.number().min(0, "From block must be positive"),
  pricing: z.array(z.string()).min(1, "At least one pricing ID is required"),
});

export type MorphoConfig = z.infer<typeof morphoSchema>;

export const morphoFields = [
  { name: "marketId", label: "Market ID", type: "text", placeholder: "0x..." },
  { name: "collateralToken", label: "Collateral Token", type: "text", placeholder: "0x..." },
  { name: "loanToken", label: "Loan Token", type: "text", placeholder: "0x..." },
  { name: "chainId", label: "Chain ID", type: "number", placeholder: "1" },
  { name: "fromBlock", label: "From Block", type: "number", placeholder: "0" },
  { name: "pricing", label: "Pricing IDs (comma separated)", type: "text", placeholder: "price1,price2" },
] as const;
