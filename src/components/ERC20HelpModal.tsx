"use client";

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
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Advanced Options Guide</DialogTitle>
          <DialogDescription>
            Learn about the advanced configuration options for your ERC20 adapter
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Finality */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Finality</h3>
              <p className="text-sm text-muted-foreground">
                Number of blocks to wait before considering a block final. This is a safety mechanism 
                to prevent issues with block reorganizations.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Higher values (e.g., 75) increase safety by ensuring block reorganizations don't affect your data</li>
                  <li>Lower values mean faster data availability but less protection against chain reorganizations</li>
                  <li>For most EVM chains, 75 is a safe default</li>
                  <li>For chains with faster finality (like some L2s), you might use lower values (e.g., 10-20)</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Default:</strong> 75 blocks
              </p>
            </div>

            <Separator />

            {/* To Block */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">To Block (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                The ending block number for indexing. This allows you to limit the adapter to index 
                only a specific historical range.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-2">When to use:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Leave empty</strong> to index from the "From Block" up to the latest block (continuous indexing)</li>
                  <li><strong>Specify a value</strong> if you only want to index a specific historical period</li>
                  <li>Useful for backfilling historical data or testing on a specific block range</li>
                  <li>Once the "To Block" is reached, the adapter will stop indexing</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> If you want continuous indexing, leave this field empty.
              </p>
            </div>

            <Separator />

            {/* Flush Interval */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Flush Interval (hours)</h3>
              <p className="text-sm text-muted-foreground">
                How often the adapter flushes data to all configured sinks (CSV, stdout, Absinthe).
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-2">Performance considerations:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Lower values</strong> (e.g., 1 hour): More frequent writes, fresher data, but higher overhead</li>
                  <li><strong>Higher values</strong> (e.g., 4-6 hours): Less frequent writes, better performance, but data is less fresh</li>
                  <li><strong>Default:</strong> 1 hour for ERC20 adapters - Good balance for token holdings tracking</li>
                  <li>Adjust based on your needs for data freshness vs. system performance</li>
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p className="text-sm font-medium mb-2">💡 Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>For production monitoring, 1 hour is recommended for ERC20 adapters</li>
                  <li>For historical analysis or batch processing, 2-4 hours may be sufficient</li>
                  <li>Very low values (&lt; 30 minutes) may cause performance issues with large datasets</li>
                </ul>
              </div>
            </div>

            <Separator />

            {/* Quick Reference */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Quick Reference</h3>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-2">Recommended Settings:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Finality:</strong> 75 (default) - Safe for most chains</li>
                  <li><strong>To Block:</strong> Leave empty for continuous indexing</li>
                  <li><strong>Flush Interval:</strong> 1 hour (default) - Good for token holdings tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
