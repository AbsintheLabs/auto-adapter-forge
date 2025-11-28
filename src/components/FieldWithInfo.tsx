import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { FIELD_INFO } from "@/lib/fieldInfo";

interface FieldWithInfoProps {
  fieldName: string;
  label: string;
  children: React.ReactNode;
}

export const FieldWithInfo = ({ fieldName, label, children }: FieldWithInfoProps) => {
  const info = FIELD_INFO[fieldName];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {info && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <Info className="h-3.5 w-3.5" />
                  <span className="sr-only">Info</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{info}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  );
};

