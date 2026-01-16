"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertTriangle, DollarSign, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import type { ManualInputRequired, ManualPricing } from "@/lib/api";

interface ManualPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manualInputData: ManualInputRequired | null;
  adapterType: 'erc20' | 'uniswap-v2' | 'uniswap-v3';
  onSubmit: (pricing: {
    manualPricing?: ManualPricing;
    token0ManualPricing?: ManualPricing;
    token1ManualPricing?: ManualPricing;
  }) => void;
  onCancel: () => void;
}

export const ManualPricingDialog: React.FC<ManualPricingDialogProps> = ({
  open,
  onOpenChange,
  manualInputData,
  adapterType,
  onSubmit,
  onCancel,
}) => {
  const [token0Price, setToken0Price] = useState<string>("");
  const [token1Price, setToken1Price] = useState<string>("");
  const [singleTokenPrice, setSingleTokenPrice] = useState<string>("");

  if (!manualInputData) return null;

  const isUniswap = adapterType === 'uniswap-v2' || adapterType === 'uniswap-v3';
  const missingTokens = manualInputData.missingTokens || [];

  // For Uniswap, check which tokens need manual pricing
  const needsToken0 = isUniswap && missingTokens.some(t => t.field === 'token0ManualPricing');
  const needsToken1 = isUniswap && missingTokens.some(t => t.field === 'token1ManualPricing');

  const handleSubmit = () => {
    if (isUniswap) {
      const pricing: {
        token0ManualPricing?: ManualPricing;
        token1ManualPricing?: ManualPricing;
      } = {};

      if (needsToken0 && token0Price) {
        pricing.token0ManualPricing = {
          kind: 'pegged',
          usdPegValue: parseFloat(token0Price),
        };
      }

      if (needsToken1 && token1Price) {
        pricing.token1ManualPricing = {
          kind: 'pegged',
          usdPegValue: parseFloat(token1Price),
        };
      }

      onSubmit(pricing);
    } else {
      // ERC20
      if (singleTokenPrice) {
        onSubmit({
          manualPricing: {
            kind: 'pegged',
            usdPegValue: parseFloat(singleTokenPrice),
          },
        });
      }
    }
  };

  const isValid = () => {
    if (isUniswap) {
      const token0Valid = !needsToken0 || (token0Price && !isNaN(parseFloat(token0Price)) && parseFloat(token0Price) >= 0);
      const token1Valid = !needsToken1 || (token1Price && !isNaN(parseFloat(token1Price)) && parseFloat(token1Price) >= 0);
      return token0Valid && token1Valid;
    } else {
      return singleTokenPrice && !isNaN(parseFloat(singleTokenPrice)) && parseFloat(singleTokenPrice) >= 0;
    }
  };

  const getTokenAddress = (field: string) => {
    const token = missingTokens.find(t => t.field === field);
    return token?.address || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-500" />
            Manual Pricing Required
          </DialogTitle>
          <DialogDescription>
            CoinGecko pricing data is not available for one or more tokens. Please provide a fixed USD price value.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Important</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            The USD peg value you enter will be used as a fixed price for this token. 
            For stablecoins like USDC/USDT, use <strong>1</strong>. 
            For other tokens, enter the approximate USD value.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {isUniswap ? (
            <>
              {needsToken0 && (
                <div className="space-y-2">
                  <Label htmlFor="token0Price" className="flex items-center gap-2">
                    Token0 USD Price
                    <span className="text-xs text-muted-foreground font-mono">
                      ({getTokenAddress('token0ManualPricing').slice(0, 10)}...)
                    </span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="token0Price"
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder="1.00"
                      value={token0Price}
                      onChange={(e) => setToken0Price(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Address: <code className="bg-muted px-1 rounded">{getTokenAddress('token0ManualPricing')}</code>
                  </p>
                </div>
              )}

              {needsToken1 && (
                <div className="space-y-2">
                  <Label htmlFor="token1Price" className="flex items-center gap-2">
                    Token1 USD Price
                    <span className="text-xs text-muted-foreground font-mono">
                      ({getTokenAddress('token1ManualPricing').slice(0, 10)}...)
                    </span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="token1Price"
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder="1.00"
                      value={token1Price}
                      onChange={(e) => setToken1Price(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Address: <code className="bg-muted px-1 rounded">{getTokenAddress('token1ManualPricing')}</code>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="singleTokenPrice" className="flex items-center gap-2">
                Token USD Price
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="singleTokenPrice"
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="1.00"
                  value={singleTokenPrice}
                  onChange={(e) => setSingleTokenPrice(e.target.value)}
                  className="pl-9"
                />
              </div>
              {manualInputData.tokenAddress && (
                <p className="text-xs text-muted-foreground">
                  Address: <code className="bg-muted px-1 rounded">{manualInputData.tokenAddress}</code>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Common values: USDC/USDT = 1, WETH ≈ current ETH price, WBTC ≈ current BTC price.
            This value will be used as a constant price in your adapter configuration.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid()}>
            Continue with Manual Pricing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
