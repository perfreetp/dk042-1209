import { TrendingDown } from 'lucide-react';
import { formatNumber, formatPercent } from '@/utils/format';

interface FunnelStepData {
  name: string;
  values: Array<{
    variantName: string;
    value: number;
    color: string;
  }>;
}

interface FunnelChartProps {
  steps: FunnelStepData[];
}

const FunnelChart = ({ steps }: FunnelChartProps) => {
  const maxValue = Math.max(...steps.flatMap((s) => s.values.map((v) => v.value)));

  return (
    <div className="space-y-5">
      {steps.map((step, stepIdx) => {
        const stepMax = Math.max(...step.values.map((v) => v.value));
        const prevStep = stepIdx > 0 ? steps[stepIdx - 1] : null;
        return (
          <div key={step.name} className="animate-fade-in-up" style={{ animationDelay: `${stepIdx * 50}ms` }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-[11px] font-semibold text-brand-700">
                  {stepIdx + 1}
                </div>
                <span className="font-medium text-ink-800 text-sm">{step.name}</span>
              </div>
              {prevStep && (
                <div className="flex items-center gap-1 text-xs text-ink-500">
                  <TrendingDown className="w-3 h-3 text-amber-500" />
                  <span>
                    平均流失{' '}
                    <span className="font-mono text-amber-600 font-semibold">
                      {formatPercent(
                        1 -
                          step.values.reduce((s, v) => s + v.value, 0) /
                            step.values.length /
                            (prevStep.values.reduce((s, v) => s + v.value, 0) / prevStep.values.length),
                        1,
                      )}
                    </span>
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {step.values.map((v) => {
                const pct = (v.value / maxValue) * 100;
                const relativePct = (v.value / stepMax) * 100;
                return (
                  <div key={v.variantName} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: v.color }}
                    />
                    <span className="text-xs text-ink-600 w-28 truncate flex-shrink-0">
                      {v.variantName}
                    </span>
                    <div className="flex-1 h-9 rounded-lg bg-ink-100/80 overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                        style={{
                          width: `${Math.max(8, relativePct)}%`,
                          background: `linear-gradient(90deg, ${v.color}dd, ${v.color})`,
                          animation: 'fadeInUp 0.6s ease-out',
                        }}
                      >
                        <span className="text-[11px] font-semibold text-white font-mono drop-shadow-sm">
                          {formatNumber(v.value)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-ink-500 w-16 text-right flex-shrink-0">
                      {formatPercent(v.value / maxValue, 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FunnelChart;
