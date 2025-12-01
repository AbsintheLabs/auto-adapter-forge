import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Wallet, TrendingUp, Layers } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const TEMPLATES: Template[] = [
  {
    id: "erc20",
    name: "ERC20 Holdings",
    description: "Track ERC20 token holdings and positions",
    icon: <Wallet className="h-6 w-6" />,
  },
  {
    id: "uniswap-v2",
    name: "Uniswap V2",
    description: "Track Uniswap V2 swaps and liquidity pool positions",
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    id: "uniswap-v3",
    name: "Uniswap V3 Swaps",
    description: "Track Uniswap V3 swaps",
    icon: <Layers className="h-6 w-6" />,
  },
];

interface TemplateSelectionProps {
  onSelect: (templateId: string) => void;
}

export const TemplateSelection = ({ onSelect }: TemplateSelectionProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Select a Template</h2>
        <p className="text-muted-foreground">
          Choose an adapter template to configure
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1 max-w-2xl mx-auto">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelect(template.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

