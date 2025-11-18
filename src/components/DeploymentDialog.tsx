import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ExternalLink, Loader2 } from "lucide-react";

interface DeploymentDialogProps {
  onDeploy: (rpcUrl: string, redisUrl: string, templateId?: string) => Promise<void>;
  isDeploying: boolean;
}

export const DeploymentDialog = ({ onDeploy, isDeploying }: DeploymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [rpcUrl, setRpcUrl] = useState(
    import.meta.env.VITE_DEFAULT_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
  );
  const [redisUrl, setRedisUrl] = useState(
    import.meta.env.VITE_DEFAULT_REDIS_URL || "redis://localhost:6379"
  );
  const [templateId, setTemplateId] = useState(
    import.meta.env.RAILWAY_TEMPLATE_ID || ""
  );

  const handleDeploy = async () => {
    await onDeploy(rpcUrl, redisUrl, templateId || undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg" disabled={isDeploying}>
          <ExternalLink className="mr-2 h-4 w-4" />
          {isDeploying ? "Deploying..." : "Deploy to Railway"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deploy to Railway</DialogTitle>
          <DialogDescription>
            Configure your deployment settings. These values will be set as environment variables.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rpc-url">RPC URL *</Label>
            <Input
              id="rpc-url"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
              disabled={isDeploying}
            />
            <p className="text-xs text-muted-foreground">
              Your Ethereum RPC endpoint (e.g., Alchemy, Infura)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="redis-url">Redis URL *</Label>
            <Input
              id="redis-url"
              value={redisUrl}
              onChange={(e) => setRedisUrl(e.target.value)}
              placeholder="redis://localhost:6379"
              disabled={isDeploying}
            />
            <p className="text-xs text-muted-foreground">
              Your Redis connection string
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-id">Railway Template ID (Optional)</Label>
            <Input
              id="template-id"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="your-template-id"
              disabled={isDeploying}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default template
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeploying}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleDeploy}
            disabled={isDeploying || !rpcUrl || !redisUrl}
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              "Deploy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

