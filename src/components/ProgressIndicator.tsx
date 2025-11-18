import { ArrowRight } from "lucide-react";

type Stage = "input" | "form" | "output";

interface ProgressIndicatorProps {
  currentStage: Stage;
}

const STAGES = [
  { id: "input" as const, label: "Describe", number: 1 },
  { id: "form" as const, label: "Configure", number: 2 },
  { id: "output" as const, label: "Deploy", number: 3 },
];

export const ProgressIndicator = ({ currentStage }: ProgressIndicatorProps) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="flex justify-center items-center gap-2">
      {STAGES.map((stage, index) => {
        const isActive = stage.id === currentStage;
        const isCompleted = index < currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <div key={stage.id} className="flex items-center gap-2">
            <div
              className={`flex items-center transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : isCompleted
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground scale-110"
                    : isCompleted
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stage.number
                )}
              </div>
              <span className="ml-2 hidden sm:inline text-sm">{stage.label}</span>
            </div>
            {index < STAGES.length - 1 && (
              <ArrowRight
                className={`w-4 h-4 transition-colors ${
                  isCompleted ? "text-primary" : "text-muted-foreground"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

