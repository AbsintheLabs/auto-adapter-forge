import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DeploymentDialog } from "./DeploymentDialog";
import { Copy } from "lucide-react";

interface ConfigOutputProps {
  config: any;
  base64Config: string;
  onDeploy?: (rpcUrl: string, redisUrl: string, templateId?: string) => Promise<void>;
  isDeploying?: boolean;
}

export const ConfigOutput = ({ config, base64Config, onDeploy, isDeploying = false }: ConfigOutputProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<"json" | "base64" | null>(null);

  const copyToClipboard = async (text: string, type: "json" | "base64") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: "Copied!",
      description: `${type === "json" ? "JSON" : "Base64"} config copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generated Config (JSON)</CardTitle>
          <CardDescription>Your Absinthe adapter configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={JSON.stringify(config, null, 2)}
            readOnly
            className="font-mono text-sm min-h-[200px]"
          />
          <Button
            variant="outline"
            onClick={() => copyToClipboard(JSON.stringify(config, null, 2), "json")}
            className="w-full"
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied === "json" ? "Copied!" : "Copy JSON"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base64 Encoded Config</CardTitle>
          <CardDescription>Ready for deployment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={base64Config}
            readOnly
            className="font-mono text-sm min-h-[100px]"
          />
          <Button
            variant="outline"
            onClick={() => copyToClipboard(base64Config, "base64")}
            className="w-full"
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied === "base64" ? "Copied!" : "Copy Base64"}
          </Button>
        </CardContent>
      </Card>

      {onDeploy && (
        <DeploymentDialog onDeploy={onDeploy} isDeploying={isDeploying} />
      )}
    </div>
  );
};
