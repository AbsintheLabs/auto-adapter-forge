export * from "./erc20";

export const ADAPTER_TYPES = {
  erc20: "ERC20 Holdings",
} as const;

export type AdapterType = keyof typeof ADAPTER_TYPES;
