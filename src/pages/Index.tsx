import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdapterForm } from "@/components/AdapterForm";
import { ConfigOutput } from "@/components/ConfigOutput";
import { NaturalLanguageInput } from "@/components/NaturalLanguageInput";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { useToast } from "@/hooks/use-toast";
import { classifyAdapter, generateConfig, deployToRailway, type ClassificationResult, type GenerateConfigResult } from "@/lib/api";
import { 
  ADAPTER_TYPES, 
  type AdapterType,
  univ2Schema,
  univ2Fields,
  univ3Schema,
  univ3Fields,
  morphoSchema,
  morphoFields,
  printrSchema,
  printrFields,
  erc20Schema,
  erc20Fields,
} from "@/lib/schemas";
import { Sparkles } from "lucide-react";

// Map adapter types to their schemas and fields
const ADAPTER_CONFIG = {
  univ2: { schema: univ2Schema, fields: univ2Fields },
  univ3: { schema: univ3Schema, fields: univ3Fields },
  morpho: { schema: morphoSchema, fields: morphoFields },
  printr: { schema: printrSchema, fields: printrFields },
  erc20: { schema: erc20Schema, fields: erc20Fields },
};

type Stage = "input" | "form" | "output";

const Index = () => {
  const [stage, setStage] = useState<Stage>("input");
  const [userInput, setUserInput] = useState("");
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [generatedConfig, setGeneratedConfig] = useState<GenerateConfigResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  // Stage 1: Handle natural language input
  const handleClassify = async (prompt: string) => {
    setUserInput(prompt);
    setIsClassifying(true);
    try {
      const result = await classifyAdapter(prompt);
      setClassification(result);
      setStage("form");
      toast({
        title: "Classification Successful",
        description: `Detected: ${ADAPTER_TYPES[result.adapter as AdapterType]}`,
      });
    } catch (error) {
      toast({
        title: "Classification Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsClassifying(false);
    }
  };

  // Stage 2: Handle form submission
  const handleFormSubmit = async (formData: any) => {
    if (!classification) return;

    setIsGenerating(true);
    try {
      const result = await generateConfig(classification.adapter, formData);
      setGeneratedConfig(result);
      setStage("output");
      toast({
        title: "Config Generated",
        description: "Your Absinthe adapter configuration is ready!",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Stage 3: Handle Railway deployment
  const handleDeploy = async (rpcUrl: string, redisUrl: string, templateId?: string) => {
    if (!generatedConfig) return;

    setIsDeploying(true);
    try {
      const result = await deployToRailway(
        generatedConfig.base64,
        rpcUrl,
        redisUrl,
        templateId
      );
      
      if (result.success) {
        toast({
          title: "Deployment Successful",
          description: result.deploymentUrl 
            ? `Deployed to: ${result.deploymentUrl}` 
            : result.message,
        });
      } else {
        toast({
          title: "Deployment Info",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Reset to start over
  const handleReset = () => {
    setStage("input");
    setUserInput("");
    setClassification(null);
    setGeneratedConfig(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400">
            Absinthe Adapter Config Generator
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-powered configuration generator for Absinthe adapters
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator currentStage={stage} />
        </div>

        {/* Stage 1: Natural Language Input */}
        {stage === "input" && (
          <NaturalLanguageInput onSubmit={handleClassify} isLoading={isClassifying} />
        )}

        {/* Stage 2: Form Configuration */}
        {stage === "form" && classification && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {ADAPTER_TYPES[classification.adapter as AdapterType]}
                </h2>
              </div>
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>
            
            <AdapterForm
              adapterType={ADAPTER_TYPES[classification.adapter as AdapterType]}
              schema={ADAPTER_CONFIG[classification.adapter as AdapterType].schema}
              fields={ADAPTER_CONFIG[classification.adapter as AdapterType].fields}
              onSubmit={handleFormSubmit}
              isLoading={isGenerating}
            />
          </div>
        )}

        {/* Stage 3: Config Output */}
        {stage === "output" && generatedConfig && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Configuration Ready</h2>
              <Button variant="outline" onClick={handleReset}>
                Create Another
              </Button>
            </div>
            
            <ConfigOutput
              config={generatedConfig.config}
              base64Config={generatedConfig.base64}
              onDeploy={handleDeploy}
              isDeploying={isDeploying}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
