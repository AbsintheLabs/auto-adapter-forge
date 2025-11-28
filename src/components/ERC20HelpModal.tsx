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

interface ERC20HelpModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ERC20HelpModal = ({ open, onOpenChange }: ERC20HelpModalProps) => {
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
          <DialogTitle className="text-2xl">ERC20 Holdings Adapter Guide</DialogTitle>
          <DialogDescription>
            Learn how to configure your ERC20 adapter to track token holdings and positions
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Overview */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">What is the ERC20 Holdings Adapter?</h3>
              <p className="text-sm text-muted-foreground">
                The ERC20 Holdings adapter tracks token balances and positions for a specific ERC20 token 
                contract. It monitors all addresses holding the token and generates data about their 
                holdings over time.
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
                    Select the blockchain network where your ERC20 token is deployed. 
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
                    that exists on the selected chain. You can find this by checking when your token was 
                    deployed or when you want to start tracking.
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
                    File path where the CSV output will be written. The default is "positions.csv". 
                    This file will contain all tracked token holdings data.
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
                  <p className="font-medium">Enable Absinthe Sink (Required)</p>
                  <p className="text-muted-foreground">
                    <strong>This sink is always enabled for ERC20 adapters.</strong> Data will be sent to the 
                    Absinthe API for processing and analysis. This is required because ERC20 token holdings data 
                    needs to be processed by Absinthe's infrastructure to calculate accurate balances, positions, 
                    and other metrics. Requires ABSINTHE_API_URL and ABSINTHE_API_KEY environment variables to be 
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
                    but higher overhead. Default is 1 hour for ERC20 adapters. Adjust based on 
                    your needs for data freshness vs. performance.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Token Configuration */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Token Configuration</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">Token Contract Address (Required)</p>
                  <p className="text-muted-foreground">
                    The Ethereum address of the ERC20 token contract you want to track. This must be 
                    a valid contract address (0x followed by 40 hexadecimal characters). You can find 
                    this on token explorers, DEX aggregators, or the token's official website.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Pricing Kind (Required)</p>
                  <p className="text-muted-foreground">
                    Choose how to price this token:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li><strong>Pegged:</strong> Fixed USD value per token. Use this for stablecoins 
                    or tokens with fixed prices (e.g., 1 USDC = $1.00)</li>
                    <li><strong>CoinGecko:</strong> Fetch market price from CoinGecko API. Use this 
                    for volatile tokens that have market prices</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">USD Peg Value (Required if Pegged)</p>
                  <p className="text-muted-foreground">
                    The fixed USD value per token. For example, if tracking USDC, enter 1.0. For a 
                    token pegged at $0.50, enter 0.5.
                  </p>
                </div>
                <div>
                  <p className="font-medium">CoinGecko ID (Required if CoinGecko)</p>
                  <p className="text-muted-foreground">
                    The CoinGecko token ID (e.g., "ethereum", "bitcoin", "usd-coin"). You can find 
                    this on the CoinGecko website by searching for your token. This is used to fetch 
                    real-time market prices. Make sure the ID matches exactly (case-sensitive).
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
                    <li>Chain selection</li>
                    <li>From Block number</li>
                    <li>Token contract address (must be valid Ethereum address)</li>
                    <li>Pricing configuration (either pegged value or CoinGecko ID)</li>
                    <li>Absinthe Sink must be enabled (always required for ERC20)</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                  <p className="font-medium mb-2">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Use CoinGecko pricing for tokens with market prices</li>
                    <li>Use pegged pricing for stablecoins or fixed-price tokens</li>
                    <li>The adapter tracks all addresses holding the token, not just specific addresses</li>
                    <li>Absinthe sink is required because ERC20 data needs specialized processing by Absinthe's infrastructure</li>
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

