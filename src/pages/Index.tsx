import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdapterForm } from "@/components/AdapterForm";
import { ConfigOutput } from "@/components/ConfigOutput";
import { TemplateSelection } from "@/components/TemplateSelection";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { useToast } from "@/hooks/use-toast";
import { generateConfig, type GenerateConfigResult } from "@/lib/api";
import { 
  ADAPTER_TYPES, 
  erc20Schema,
  erc20Fields,
  univ2Schema,
  univ2Fields,
} from "@/lib/schemas";
import { Sparkles } from "lucide-react";

// Map adapter types to their schemas and fields
const ADAPTER_CONFIG = {
  erc20: { schema: erc20Schema, fields: erc20Fields },
  "uniswap-v2": { schema: univ2Schema, fields: univ2Fields },
};

type Stage = "template" | "form" | "output";

const Index = () => {
  const [stage, setStage] = useState<Stage>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedConfig, setGeneratedConfig] = useState<GenerateConfigResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  // Stage 1: Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStage("form");
  };

  // Stage 2: Handle form submission
  const handleFormSubmit = (formData: any) => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      const adapterType = selectedTemplate as 'erc20' | 'uniswap-v2';
      const result = generateConfig(formData, adapterType);
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

  // Stage 3: Handle Railway deployment (manual - no API call needed)
  const handleDeploy = async (rpcUrl: string, absintheApiKey: string, coingeckoApiKey: string, templateId?: string) => {
    // Deployment is now fully manual via Railway UI
    // This function is kept for compatibility but doesn't need to do anything
    toast({
      title: "Ready for Deployment",
      description: "Use the deployment dialog to copy your config and deploy manually on Railway",
    });
  };

  // Reset to start over
  const handleReset = () => {
    setStage("template");
    setSelectedTemplate(null);
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
            Configure your Absinthe adapter templates
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator currentStage={stage} />
        </div>

        {/* Stage 1: Template Selection */}
        {stage === "template" && (
          <TemplateSelection onSelect={handleTemplateSelect} />
        )}

        {/* Stage 2: Form Configuration */}
        {stage === "form" && selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {ADAPTER_TYPES[selectedTemplate as keyof typeof ADAPTER_TYPES]}
                </h2>
              </div>
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>
            
            <AdapterForm
              adapterType={ADAPTER_TYPES[selectedTemplate as keyof typeof ADAPTER_TYPES]}
              schema={ADAPTER_CONFIG[selectedTemplate as keyof typeof ADAPTER_CONFIG].schema}
              fields={ADAPTER_CONFIG[selectedTemplate as keyof typeof ADAPTER_CONFIG].fields}
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
