import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

interface NaturalLanguageInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

const EXAMPLE_PROMPTS = [
  "Create a Uniswap V2 config for ETH/USDC pool on mainnet",
  "I need Morpho lending tracking for market 0x123...",
  "Track ERC20 holdings for token 0xabc... and holder 0xdef...",
  "Set up Uniswap V3 for USDC/ETH pool with 0.3% fee tier",
  "Configure Printr protocol tracking for contract 0x456...",
];

export const NaturalLanguageInput = ({ onSubmit, isLoading = false }: NaturalLanguageInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          What config do you want to create?
        </CardTitle>
        <CardDescription>
          Describe your needs in natural language. Our AI will detect the right adapter and guide you through the
          configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Example: I need a Uniswap V3 configuration for the USDC/ETH pool on Ethereum mainnet, starting from block 15000000..."
            className="min-h-[150px] resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 rounded bg-muted">Cmd+Enter</kbd> or{" "}
            <kbd className="px-1 rounded bg-muted">Ctrl+Enter</kbd> to submit
          </p>
        </div>

        <Button onClick={handleSubmit} disabled={isLoading || !input.trim()} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing your request...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze & Continue
            </>
          )}
        </Button>

        {/* Examples Section */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Example prompts to get started:</p>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((example, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2 px-3"
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
              >
                <span className="text-xs">{example}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

