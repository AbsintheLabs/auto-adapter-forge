"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ExternalLink, Loader2, Copy, Check, Rocket, BookOpen, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deployToRailway } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface DeploymentDialogProps {
  base64Config: string;
  chainId: number;
  onDeploy?: (rpcUrl: string, absintheApiKey: string, coingeckoApiKey: string, templateId?: string) => Promise<void>;
  isDeploying?: boolean;
}

export const DeploymentDialog = ({ base64Config, chainId, onDeploy, isDeploying = false }: DeploymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAutoDeploying, setIsAutoDeploying] = useState(false);
  const { toast } = useToast();
  
  // Get Notion documentation URL from environment variable
  const notionDocUrl = process.env.NEXT_PUBLIC_RAILWAY_DEPLOYMENT_DOC_URL || 
    "https://absinthelabs.notion.site/Deploy-Prebuilt-Adapters-on-Railway-2eadfbd9a9588019813ed3f586ced212?pvs=74";

  const handleOpenRailway = () => {
    window.open("https://railway.com/deploy/zonal-gentleness", "_blank");
  };

  const copyConfig = async () => {
    await navigator.clipboard.writeText(base64Config);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "INDEXER_CONFIG copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoDeploy = async () => {
    setIsAutoDeploying(true);
    try {
      const result = await deployToRailway(
        base64Config,
        chainId,
        undefined // Use default template ID from backend
      );

      if (result.success) {
        toast({
          title: "Deployment Successful!",
          description: result.projectUrl 
            ? `Project deployed! Click to view: ${result.projectUrl}`
            : result.message || `Project ID: ${result.projectId}`,
        });
        // Open Railway project in new tab if URL is available
        if (result.projectUrl) {
          window.open(result.projectUrl, '_blank');
        }
      } else {
        throw new Error(result.message || "Deployment failed");
      }
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAutoDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Automated Deployment - Only show if onDeploy callback is provided */}
      {onDeploy && (
        <Button 
          className="w-full" 
          size="lg" 
          variant="default"
          onClick={handleAutoDeploy}
          disabled={isAutoDeploying || isDeploying}
        >
          {isAutoDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Deploy to Railway (Automated)
            </>
          )}
        </Button>
      )}

      {/* Manual Deployment Instructions - ALWAYS available */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg" variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Deploy to Railway (Manual)
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deploy to Railway - Manual Setup</DialogTitle>
            <DialogDescription>
              Follow these steps to deploy your adapter configuration to Railway. 
              For detailed documentation, see the{" "}
              <a 
                href={notionDocUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                official deployment guide
                <ExternalLink className="h-3 w-3" />
              </a>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Important Notice */}
            <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">Important: Get Your API Keys</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                You need to get your <strong>ABSINTHE_API_KEY</strong> from the{" "}
                <a 
                  href="https://app.absinthe.network/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:no-underline"
                >
                  Absinthe App Dashboard
                </a>
                . Do NOT use any keys from environment files or other sources.
              </AlertDescription>
            </Alert>

            {/* Documentation Link */}
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold">📚 Full Railway Deployment Documentation</h4>
                  <p className="text-sm text-muted-foreground">
                    Read the complete guide covering:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                    <li>Why Railway?</li>
                    <li>What happens once you deploy?</li>
                    <li>How to manually deploy on Railway</li>
                    <li>What happens after deploy? (verification + where to look)</li>
                  </ul>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open(notionDocUrl, "_blank")}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Open Full Documentation
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 1: Copy Config */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  1
                </div>
                <h3 className="font-semibold">Copy Your Generated Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Copy the Base64-encoded configuration below. You'll need to paste this into Railway in Step 4.
              </p>
              <div className="ml-8 p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-2">Your generated configuration (Base64):</p>
                <div className="relative">
                  <Textarea
                    value={base64Config}
                    readOnly
                    className="font-mono text-xs min-h-[80px] pr-10"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={copyConfig}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyConfig}
                  className="w-full mt-2"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-3 w-3" />
                      Copy INDEXER_CONFIG
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Step 2: Open Railway Deployment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  2
                </div>
                <h3 className="font-semibold">Open Railway Deployment Page</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Click the button below to open the Railway deployment page
              </p>
              <Button
                onClick={handleOpenRailway}
                variant="outline"
                className="ml-8"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Railway Deployment Page
              </Button>
            </div>

            {/* Step 3: Start Deployment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  3
                </div>
                <h3 className="font-semibold">Start Deployment</h3>
              </div>
              <div className="ml-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click <strong>"Deploy Now"</strong>, then select:
                </p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-mono">
                    <strong>"Configure Now for absinthelabs/absinthe-adapters:latest"</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Fill Environment Variables */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  4
                </div>
                <h3 className="font-semibold">Fill in Environment Variables</h3>
              </div>
              <div className="ml-8 space-y-4">
                <div className="p-4 bg-muted rounded-md space-y-4">
                  {/* ABSINTHE_API_KEY */}
                  <div className="space-y-2">
                    <div className="font-mono text-sm font-semibold">ABSINTHE_API_KEY *</div>
                    <p className="text-xs text-muted-foreground">
                      Obtain this after creating your config from the Absinthe app. See detailed instructions below.
                    </p>
                    <div className="p-3 bg-background rounded border border-primary/20">
                      <p className="text-xs font-semibold mb-2">How to get your API key:</p>
                      <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                        <li>Go to <a href="https://app.absinthe.network" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">app.absinthe.network</a> and log in</li>
                        <li>Navigate to your respective organization</li>
                        <li>Go to <strong>Campaigns</strong> and select your campaign</li>
                        <li>Go to <strong>API Key Access</strong> section</li>
                        <li>Generate your API key and copy it</li>
                      </ol>
                    </div>
                  </div>

                  {/* RPC_URL */}
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-semibold">RPC_URL *</div>
                    <p className="text-xs text-muted-foreground">
                      Your RPC endpoint URL (Alchemy, Infura, QuickNode, etc.)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>For Absinthe team members:</strong> Ping @Andrew Magid or @Kushagra Sharma to get this quickly.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Example: <code className="bg-background px-1 rounded">https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY</code>
                    </p>
                  </div>

                  {/* COINGECKO_API_KEY */}
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-semibold">COINGECKO_API_KEY *</div>
                    <p className="text-xs text-muted-foreground">
                      Your CoinGecko Pro API key for price feeds
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>For Absinthe team members:</strong> Ping @Andrew Magid or @Kushagra Sharma to get this quickly.
                    </p>
                  </div>

                  {/* INDEXER_CONFIG */}
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-semibold">INDEXER_CONFIG *</div>
                    <p className="text-xs text-muted-foreground">
                      Paste the Base64-encoded config you generated from the Config Generator (copied above in Step 1)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5: Save Config */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  5
                </div>
                <h3 className="font-semibold">Save Your Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Click <strong>"Save Config"</strong> in Railway after filling in all environment variables.
              </p>
            </div>

            {/* Step 6: Deploy */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  6
                </div>
                <h3 className="font-semibold">Deploy Your Indexer</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Finally, click <strong>"Deploy"</strong> to start your indexer.
              </p>
            </div>

            {/* Step 7: Verify Deployment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  7
                </div>
                <h3 className="font-semibold">Verify Successful Deployment</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Make sure you see a successful deployment run in Railway. Check:
              </p>
              <ul className="text-sm text-muted-foreground ml-8 list-disc list-inside space-y-1">
                <li>Deployment status shows as "Success" or "Running"</li>
                <li>Logs show the indexer is starting up correctly</li>
                <li>No error messages in the deployment logs</li>
                <li>Monitor the Absinthe dashboard for incoming events</li>
              </ul>
            </div>

            {/* Help Section */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Need help?</strong> Read the{" "}
                <a 
                  href={notionDocUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  full Railway deployment documentation
                </a>
                {" "}for detailed troubleshooting and verification steps.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

     
    </div>
  );
};

