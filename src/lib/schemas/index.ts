export * from "./erc20";
export * from "./univ2";
export * from "./univ3";

export const ADAPTER_TYPES = {
  erc20: "ERC20 Holdings",
  "uniswap-v2": "Uniswap V2",
  "uniswap-v3": "Uniswap V3 Swaps",
} as const;

export type AdapterType = keyof typeof ADAPTER_TYPES;
