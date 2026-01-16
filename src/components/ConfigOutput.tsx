"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DeploymentDialog } from "./DeploymentDialog";
import { Copy, AlertTriangle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ConfigOutputProps {
  config: any;
  base64Config: string;
  warnings?: string[];
  errors?: string[];
  onDeploy?: (rpcUrl: string, absintheApiKey: string, coingeckoApiKey: string, templateId?: string) => Promise<void>;
  isDeploying?: boolean;
}

function extractChainId(config: any): number | null {
  return config?.network?.chainId || null;
}

export const ConfigOutput = ({ config, base64Config, warnings, errors, onDeploy, isDeploying = false }: ConfigOutputProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<"json" | "base64" | null>(null);
  const chainId = extractChainId(config);

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
      {/* Display Errors */}
      {errors && errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Display Warnings */}
      {warnings && warnings.length > 0 && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">Warnings</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
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

      {/* Deployment options - Manual deployment is ALWAYS available */}
      {chainId && (
        <DeploymentDialog 
          base64Config={base64Config} 
          chainId={chainId} 
          onDeploy={onDeploy} 
          isDeploying={isDeploying} 
        />
      )}
    </div>
  );
};
