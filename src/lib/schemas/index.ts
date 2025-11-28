export * from "./erc20";
export * from "./univ2";

export const ADAPTER_TYPES = {
  erc20: "ERC20 Holdings",
  "uniswap-v2": "Uniswap V2",
} as const;

export type AdapterType = keyof typeof ADAPTER_TYPES;
