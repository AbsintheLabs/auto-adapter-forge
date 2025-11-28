import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { HelpCircle } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface UniswapV2HelpModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const UniswapV2HelpModal = ({ open, onOpenChange }: UniswapV2HelpModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          How to Use
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Uniswap V2 Adapter Guide</DialogTitle>
          <DialogDescription>
            Learn how to configure your Uniswap V2 adapter to track swaps and liquidity positions
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Overview */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">What is the Uniswap V2 Adapter?</h3>
              <p className="text-sm text-muted-foreground">
                The Uniswap V2 adapter tracks swap transactions and liquidity provider (LP) positions 
                in Uniswap V2-style decentralized exchanges. It monitors specific pools and generates 
                data about token swaps and LP token holdings.
              </p>
            </div>

            <Separator />

            {/* Network Configuration */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Network Configuration</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">Chain (Required)</p>
                  <p className="text-muted-foreground">
                    Select the blockchain network where your Uniswap V2 pools are deployed. 
                    The gateway URL is automatically set based on your selection.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Finality (Required)</p>
                  <p className="text-muted-foreground">
                    Number of blocks to wait before considering a block final. Higher values (e.g., 75) 
                    increase safety by ensuring block reorganizations don't affect your data, but delay 
                    data availability. For most EVM chains, 75 is a safe default.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Block Range */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Block Range</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">From Block (Required)</p>
                  <p className="text-muted-foreground">
                    The starting block number where indexing should begin. This should be a block number 
                    that exists on the selected chain. You can find this by checking when your pool was 
                    created or when you want to start tracking.
                  </p>
                </div>
                <div>
                  <p className="font-medium">To Block (Optional)</p>
                  <p className="text-muted-foreground">
                    The ending block number. If left empty, the adapter will continue indexing up to the 
                    latest block. Specify a value if you only want to index a specific historical range.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Output Sinks */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Output Sinks</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">CSV Output Path (Required)</p>
                  <p className="text-muted-foreground">
                    File path where the CSV output will be written. The default is "uniswap-v2.csv". 
                    This file will contain all tracked swap and LP position data.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Enable Stdout Sink (Optional)</p>
                  <p className="text-muted-foreground">
                    When enabled, data will also be printed to console/logs. Useful for debugging 
                    and monitoring in real-time.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Enable Absinthe Sink (Required for Uniswap V2)</p>
                  <p className="text-muted-foreground">
                    <strong>This sink is always enabled for Uniswap V2 adapters.</strong> Data will be sent to the 
                    Absinthe API for processing and analysis. This is required because Uniswap V2 data needs to be 
                    processed by Absinthe's infrastructure to calculate accurate swap volumes, LP positions, and 
                    other metrics. Requires ABSINTHE_API_URL and ABSINTHE_API_KEY environment variables to be 
                    set in your deployment.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* General Configuration */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">General Configuration</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">Flush Interval (Required)</p>
                  <p className="text-muted-foreground">
                    How often (in hours) to flush data to sinks. Lower values mean more frequent writes 
                    but higher overhead. Default is 2 hours for Uniswap V2 adapters. Adjust based on 
                    your needs for data freshness vs. performance.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Swap Entries */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Swap Entries</h3>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-3">
                <p className="text-sm font-medium mb-2">Why Multiple Swap Entries?</p>
                <p className="text-sm text-muted-foreground">
                  In a Uniswap V2 pool, there are <strong>two tokens</strong> (e.g., BTC and USDC). 
                  To track swaps for <strong>both directions</strong>, you need separate swap entries:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm text-muted-foreground">
                  <li><strong>Swap Entry 1:</strong> Track swaps where Token A is being swapped (e.g., BTC → USDC)</li>
                  <li><strong>Swap Entry 2:</strong> Track swaps where Token B is being swapped (e.g., USDC → BTC)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Both entries use the <strong>same pool address</strong> but different <strong>swap leg addresses</strong> 
                  (the token being swapped). This gives you complete visibility into all swap activity in the pool.
                </p>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Swap entries track individual token swaps in a pool. You can add multiple swap entries 
                to track different tokens being swapped in the same pool.
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">Pool Address (Required)</p>
                  <p className="text-muted-foreground">
                    The Uniswap V2 pool contract address. This is the address of the liquidity pool you 
                    want to track. You can find this on DEX aggregators or by checking the pool factory.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Swap Leg Address (Required)</p>
                  <p className="text-muted-foreground">
                    The token address for the swap leg. This is the specific token you want to track swaps 
                    for within the pool. For example, if tracking BTC swaps in a BTC/USDC pool, this would 
                    be the BTC token address.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Pricing Kind (Required)</p>
                  <p className="text-muted-foreground">
                    Choose how to price this token:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li><strong>Pegged:</strong> Fixed USD value per token (e.g., stablecoins)</li>
                    <li><strong>CoinGecko:</strong> Fetch market price from CoinGecko API</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">USD Peg Value (Required if Pegged)</p>
                  <p className="text-muted-foreground">
                    The fixed USD value per token. Use this for stablecoins or tokens with fixed prices.
                  </p>
                </div>
                <div>
                  <p className="font-medium">CoinGecko ID (Required if CoinGecko)</p>
                  <p className="text-muted-foreground">
                    The CoinGecko token ID (e.g., "bitcoin", "ethereum", "usd-coin"). You can find this 
                    on the CoinGecko website. This is used to fetch real-time market prices.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* LP Entries */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">LP (Liquidity Provider) Entries</h3>
              <p className="text-sm text-muted-foreground mb-3">
                LP entries track liquidity provider positions in pools. This monitors LP token holdings 
                and calculates their value based on the underlying token prices.
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">Pool Address (Required)</p>
                  <p className="text-muted-foreground">
                    The Uniswap V2 pool contract address. Must match one of your swap entries if tracking 
                    the same pool.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Token 0 & Token 1 Pricing (Required)</p>
                  <p className="text-muted-foreground">
                    Each LP pool has two tokens (token0 and token1). You need to configure pricing for both:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li><strong>Pricing Kind:</strong> Choose "Pegged" or "CoinGecko" for each token</li>
                    <li><strong>USD Peg Value:</strong> If using pegged pricing, enter the fixed USD value</li>
                    <li><strong>CoinGecko ID:</strong> If using CoinGecko, enter the token ID (e.g., "bitcoin", "usd-coin")</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    The adapter uses "univ2nav" pricing which calculates LP token value based on the 
                    ratio and prices of token0 and token1.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Important Notes */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Important Notes</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium mb-2">Required Fields:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Absinthe Sink must be enabled (always required for Uniswap V2)</li>
                    <li>All pool addresses must be valid Ethereum addresses (0x...)</li>
                    <li>All token addresses must be valid Ethereum addresses</li>
                    <li>Pricing configuration must be complete for all entries</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                  <p className="font-medium mb-2">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Add two swap entries</strong> for the same pool to track both tokens (e.g., one for BTC, one for USDC in a BTC/USDC pool)</li>
                    <li>Both swap entries should have the same pool address but different swap leg addresses</li>
                    <li>LP entries automatically calculate NAV (Net Asset Value) based on token prices</li>
                    <li>Make sure your "From Block" is at the time, the pool was created</li>
                    <li>Use CoinGecko pricing for volatile tokens, pegged for stablecoins</li>
                    <li>Absinthe sink is required because Uniswap V2 data needs specialized processing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

