import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="space-y-1">
      {steps.map((step, idx) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        return (
          <div key={step.id} className="flex gap-4 relative">
            {idx < steps.length - 1 && (
              <div
                className={`absolute left-[18px] top-[40px] bottom-[-12px] w-px ${
                  isCompleted ? 'bg-brand-400' : 'bg-ink-200'
                }`}
              />
            )}
            <div className="flex flex-col items-center flex-shrink-0 z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-emerald'
                    : isCurrent
                      ? 'bg-white border-2 border-brand-500 text-brand-600 shadow-lg shadow-brand-500/20 ring-4 ring-brand-500/10'
                      : 'bg-white border-2 border-ink-200 text-ink-400'
                }`}
              >
                {isCompleted ? <Check className="w-4.5 h-4.5" /> : step.id + 1}
              </div>
            </div>
            <div className="flex-1 pb-8 pt-0.5">
              <div
                className={`text-sm font-medium ${
                  isCurrent || isCompleted ? 'text-ink-900' : 'text-ink-400'
                }`}
              >
                {step.title}
              </div>
              <div
                className={`text-xs mt-0.5 ${
                  isCurrent ? 'text-ink-500' : 'text-ink-400'
                }`}
              >
                {step.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
