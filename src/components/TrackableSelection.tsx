"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Info } from "lucide-react";

interface TrackableOption {
  id: string;
  label: string;
  description: string;
}

interface TrackableSelectionProps {
  adapterType: 'erc20' | 'uniswap-v2' | 'uniswap-v3';
  onConfirm: (selectedTrackables: string[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

// Define trackable options for each adapter type
const TRACKABLE_OPTIONS: Record<string, TrackableOption[]> = {
  'erc20': [
    {
      id: 'token',
      label: 'Token Holdings',
      description: 'Track ERC20 token balances and holdings',
    },
  ],
  'uniswap-v2': [
    {
      id: 'swap',
      label: 'Swap Trackable',
      description: 'Track Uniswap V2 swaps/trades for both tokens',
    },
    {
      id: 'lp',
      label: 'LP Trackable',
      description: 'Track Uniswap V2 liquidity provider positions',
    },
  ],
  'uniswap-v3': [
    {
      id: 'swap',
      label: 'Swap Trackable',
      description: 'Track Uniswap V3 swaps/trades for both tokens',
    },
  ],
};

export const TrackableSelection = ({ 
  adapterType, 
  onConfirm, 
  onBack, 
  isLoading = false 
}: TrackableSelectionProps) => {
  const options = TRACKABLE_OPTIONS[adapterType] || [];
  
  // Initialize with all trackables selected by default
  const [selectedTrackables, setSelectedTrackables] = useState<Set<string>>(
    new Set(options.map(opt => opt.id))
  );

  const handleToggle = (trackableId: string) => {
    const newSelected = new Set(selectedTrackables);
    if (newSelected.has(trackableId)) {
      newSelected.delete(trackableId);
    } else {
      newSelected.add(trackableId);
    }
    setSelectedTrackables(newSelected);
  };

  const handleConfirm = () => {
    if (selectedTrackables.size === 0) {
      return; // Prevent confirmation with no selection
    }
    onConfirm(Array.from(selectedTrackables));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Trackables</CardTitle>
        <CardDescription>
          Choose which trackables to include in your adapter configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Select at least one trackable type. You can include multiple trackables in your adapter.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                id={option.id}
                checked={selectedTrackables.has(option.id)}
                onCheckedChange={() => handleToggle(option.id)}
                disabled={isLoading}
              />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={option.id}
                  className="text-base font-semibold cursor-pointer"
                >
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {selectedTrackables.size === 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              Please select at least one trackable to continue.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            Back to Form
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedTrackables.size === 0 || isLoading}
            className="flex-1"
          >
            {isLoading ? "Generating..." : "Generate Config"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
