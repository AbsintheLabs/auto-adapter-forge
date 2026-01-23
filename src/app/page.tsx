"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdapterForm } from "@/components/AdapterForm";
import { ConfigOutput } from "@/components/ConfigOutput";
import { TemplateSelection } from "@/components/TemplateSelection";
import { TrackableSelection } from "@/components/TrackableSelection";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { ManualPricingDialog } from "@/components/ManualPricingDialog";
import { useToast } from "@/hooks/use-toast";
import { 
  generateUniv2Config, 
  generateUniv3Config, 
  generateErc20Config, 
  deployToRailway, 
  type GenerateConfigResult,
  type ManualInputRequired,
  type ManualPricing,
} from "@/lib/api";
import { useRailwayEnabled } from "@/hooks/use-railway-enabled";
import { 
  ADAPTER_TYPES, 
  erc20Schema,
  erc20Fields,
  univ2Schema,
  univ2Fields,
  univ3Schema,
  univ3Fields,
} from "@/lib/schemas";
import { Sparkles } from "lucide-react";

// Map adapter types to their schemas and fields
const ADAPTER_CONFIG = {
  erc20: { schema: erc20Schema, fields: erc20Fields },
  "uniswap-v2": { schema: univ2Schema, fields: univ2Fields },
  "uniswap-v3": { schema: univ3Schema, fields: univ3Fields },
};

type Stage = "template" | "form" | "trackables" | "output";

export default function Home() {
  const [stage, setStage] = useState<Stage>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedConfig, setGeneratedConfig] = useState<GenerateConfigResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isGenerateAndDeploy, setIsGenerateAndDeploy] = useState(false);
  const { toast } = useToast();
  
  // Manual pricing dialog state
  const [showManualPricingDialog, setShowManualPricingDialog] = useState(false);
  const [manualInputData, setManualInputData] = useState<ManualInputRequired | null>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [isDeployAfterManual, setIsDeployAfterManual] = useState(false);
  
  // Trackable selection state
  const [submittedFormData, setSubmittedFormData] = useState<any>(null);
  const [selectedTrackables, setSelectedTrackables] = useState<string[]>([]);
  
  // Check if Railway deployment is enabled
  const { enabled: railwayEnabled, loading: railwayLoading } = useRailwayEnabled();

  // Stage 1: Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStage("form");
  };

  // Helper function to check if result requires manual input
  const isManualInputRequired = (result: GenerateConfigResult | ManualInputRequired): result is ManualInputRequired => {
    return 'requiresManualInput' in result && result.requiresManualInput === true;
  };

  // Stage 2: Handle form submission (move to trackable selection)
  const handleFormSubmit = async (formData: any, manualPricing?: {
    manualPricing?: ManualPricing;
    token0ManualPricing?: ManualPricing;
    token1ManualPricing?: ManualPricing;
  }) => {
    if (!selectedTemplate) return;

    // Store form data and move to trackable selection
    setSubmittedFormData({ ...formData, manualPricing });
    setStage("trackables");
  };

  // Stage 3: Handle trackable selection and generate config
  const handleTrackableConfirm = async (trackables: string[]) => {
    if (!selectedTemplate || !submittedFormData) return;

    setSelectedTrackables(trackables);
    setIsGenerating(true);
    
    // Show message about potential API limit delays
    toast({
      title: "Generating Config",
      description: "This may take longer if API limits are hit for fromBlock check...",
    });
    
    try {
      const adapterType = selectedTemplate as 'erc20' | 'uniswap-v2' | 'uniswap-v3';
      const formData = submittedFormData;
      const manualPricing = formData.manualPricing;
      let result: GenerateConfigResult | ManualInputRequired;
      
      if (adapterType === 'uniswap-v2') {
        // For Uniswap V2, use backend to auto-generate config
        result = await generateUniv2Config(
          formData.poolAddress,
          formData.chainId,
          formData.fromBlock,
          formData.toBlock,
          formData.finality,
          formData.flushIntervalHours,
          manualPricing?.token0ManualPricing,
          manualPricing?.token1ManualPricing,
          trackables
        );
      } else if (adapterType === 'uniswap-v3') {
        // For Uniswap V3, use backend to auto-generate config
        result = await generateUniv3Config(
          formData.poolAddress,
          formData.chainId,
          formData.fromBlock,
          formData.toBlock,
          formData.finality,
          formData.flushIntervalHours,
          manualPricing?.token0ManualPricing,
          manualPricing?.token1ManualPricing,
          trackables
        );
      } else {
        // For ERC20, use backend API to generate config (auto-fetches CoinGecko ID)
        result = await generateErc20Config(
          formData.tokenContractAddress,
          formData.chainId,
          formData.fromBlock,
          formData.toBlock,
          formData.finality,
          formData.flushIntervalHours,
          manualPricing?.manualPricing,
          trackables
        );
      }
      
      // Check if manual input is required
      if (isManualInputRequired(result)) {
        setManualInputData(result);
        setPendingFormData(formData);
        setIsDeployAfterManual(false);
        setShowManualPricingDialog(true);
        setIsGenerating(false);
        return;
      }
      
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

  // Handle back from trackable selection
  const handleTrackableBack = () => {
    setStage("form");
  };

  // Handle generate and deploy - move to trackable selection first
  const handleGenerateAndDeploy = async (formData: any, manualPricing?: {
    manualPricing?: ManualPricing;
    token0ManualPricing?: ManualPricing;
    token1ManualPricing?: ManualPricing;
  }) => {
    // For now, just move to trackable selection like regular submission
    // The deploy will happen from the output stage
    handleFormSubmit(formData, manualPricing);
  };
  
  // Handle manual pricing submission
  const handleManualPricingSubmit = (pricing: {
    manualPricing?: ManualPricing;
    token0ManualPricing?: ManualPricing;
    token1ManualPricing?: ManualPricing;
  }) => {
    setShowManualPricingDialog(false);
    
    if (pendingFormData) {
      // Move to trackable selection after manual pricing
      handleFormSubmit(pendingFormData, pricing);
    }
  };
  
  // Handle manual pricing cancel
  const handleManualPricingCancel = () => {
    setShowManualPricingDialog(false);
    setManualInputData(null);
    setPendingFormData(null);
    setIsDeployAfterManual(false);
    toast({
      title: "Cancelled",
      description: "Config generation was cancelled.",
    });
  };

  // Stage 3: Handle Railway deployment
  const handleDeploy = async (rpcUrl: string, absintheApiKey: string, coingeckoApiKey: string, templateId?: string) => {
    if (!generatedConfig) return;

    setIsDeploying(true);
    try {
      // Extract chainId from the generated config
      const chainId = (generatedConfig.config as any)?.network?.chainId;
      if (!chainId) {
        throw new Error("Chain ID not found in configuration");
      }

      const result = await deployToRailway(
        generatedConfig.base64,
        chainId,
        templateId
      );
      
      if (result.success) {
        toast({
          title: "Deployment Successful",
          description: result.projectUrl 
            ? `Project deployed! Click to view: ${result.projectUrl}`
            : result.message || `Project ID: ${result.projectId}`,
        });
        // Open Railway project in new tab if URL is available
        if (result.projectUrl) {
          window.open(result.projectUrl, '_blank');
        }
      } else {
        toast({
          title: "Deployment Failed",
          description: result.message || "Unknown error occurred",
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
    setStage("template");
    setSelectedTemplate(null);
    setGeneratedConfig(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Manual Pricing Dialog */}
      <ManualPricingDialog
        open={showManualPricingDialog}
        onOpenChange={setShowManualPricingDialog}
        manualInputData={manualInputData}
        adapterType={selectedTemplate as 'erc20' | 'uniswap-v2' | 'uniswap-v3'}
        onSubmit={handleManualPricingSubmit}
        onCancel={handleManualPricingCancel}
      />
      
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
              onGenerateAndDeploy={railwayEnabled ? handleGenerateAndDeploy : undefined}
              isLoading={isGenerating}
              isDeploying={isGenerateAndDeploy}
            />
          </div>
        )}

        {/* Stage 3: Trackable Selection */}
        {stage === "trackables" && selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Configure Trackables</h2>
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>
            
            <TrackableSelection
              adapterType={selectedTemplate as 'erc20' | 'uniswap-v2' | 'uniswap-v3'}
              onConfirm={handleTrackableConfirm}
              onBack={handleTrackableBack}
              isLoading={isGenerating}
            />
          </div>
        )}

        {/* Stage 4: Config Output */}
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
              warnings={generatedConfig.warnings}
              errors={generatedConfig.errors}
              onDeploy={railwayEnabled ? handleDeploy : undefined}
              isDeploying={isDeploying}
            />
            {/* Note: Manual Railway deployment is always available via DeploymentDialog,
                even when automated deployment (railwayEnabled) is false */}
          </div>
        )}
      </div>
    </div>
  );
}
