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
import { ExternalLink, Loader2, Copy, Check, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deployToRailway } from "@/lib/api";

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

  const handleOpenRailway = () => {
    window.open("https://railway.com/new/template/zonal-gentleness", "_blank");
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
      {/* Automated Deployment - Direct deployment without modal */}
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

      {/* Manual Deployment Instructions */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg" variant="default">
            <ExternalLink className="mr-2 h-4 w-4" />
            Deploy to Railway (Manual)
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deploy to Railway - Manual Setup</DialogTitle>
            <DialogDescription>
              Follow these steps to deploy your adapter configuration to Railway
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Step 1: Open Railway Template */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  1
                </div>
                <h3 className="font-semibold">Open Railway Template</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Click the button below to open the Railway template in a new tab
              </p>
              <Button
                onClick={handleOpenRailway}
                variant="outline"
                className="ml-8"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Railway Template
              </Button>
            </div>

            {/* Step 2: Enter INDEXER_CONFIG */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  2
                </div>
                <h3 className="font-semibold">Enter INDEXER_CONFIG</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Copy the config below and paste it into the <code className="px-1 py-0.5 bg-muted rounded text-xs">INDEXER_CONFIG</code> environment variable field in Railway
              </p>
              <div className="ml-8 space-y-2">
                <div className="relative">
                  <Textarea
                    value={base64Config}
                    readOnly
                    className="font-mono text-sm min-h-[100px] pr-10"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={copyConfig}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyConfig}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy INDEXER_CONFIG
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Step 3: Add Other Environment Variables */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  3
                </div>
                <h3 className="font-semibold">Add Other Environment Variables</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                In the Railway deployment page, manually add these environment variables:
              </p>
              <div className="ml-8 space-y-2">
                <div className="p-3 bg-muted rounded-md">
                  <div className="font-mono text-sm space-y-1">
                    <div><span className="font-semibold">RPC_URL</span> * - Your RPC endpoint URL</div>
                    <div><span className="font-semibold">ABSINTHE_API_KEY</span> * - Your Absinthe API key</div>
                    <div><span className="font-semibold">COINGECKO_API_KEY</span> * - Your CoinGecko API key</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Deploy */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  4
                </div>
                <h3 className="font-semibold">Deploy</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Once all environment variables are set, click "Deploy" in Railway to start your adapter
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

