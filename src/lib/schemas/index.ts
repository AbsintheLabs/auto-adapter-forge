export * from "./univ2";
export * from "./univ3";
export * from "./morpho";
export * from "./printr";
export * from "./erc20";

export const ADAPTER_TYPES = {
  univ2: "Uniswap V2",
  univ3: "Uniswap V3",
  morpho: "Morpho",
  printr: "Printr",
  erc20: "ERC20 Holdings",
} as const;

export type AdapterType = keyof typeof ADAPTER_TYPES;
