import { useExperimentStore } from '@/store/useExperimentStore';
import { TrendingUp, FlaskConical, Trophy, Rocket } from 'lucide-react';

const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 30" className="w-full h-10" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const StatsOverview = () => {
  const { experiments, reviews } = useExperimentStore();
  const total = experiments.length;
  const running = experiments.filter((e) => e.status === 'running').length;
  const winners = experiments.filter((e) => e.winnerVariantId).length;
  const readyToLaunch = Object.values(reviews).filter((r) => r.isWinnerReadyToLaunch).length;

  const cards = [
    {
      label: '实验总数',
      value: total,
      gradient: 'gradient-bg-sapphire',
      icon: FlaskConical,
      spark: [12, 15, 18, 17, 20, 22, 24, total],
      suffix: '个',
    },
    {
      label: '进行中',
      value: running,
      gradient: 'gradient-bg-emerald',
      icon: TrendingUp,
      spark: [0, 2, 3, 5, 4, 5, 6, running],
      suffix: '个',
      glow: true,
    },
    {
      label: '已决出胜出',
      value: winners,
      gradient: 'gradient-bg-violet',
      icon: Trophy,
      spark: [1, 2, 3, 4, 6, 7, 8, winners],
      suffix: '个',
    },
    {
      label: '待上线',
      value: readyToLaunch,
      gradient: 'gradient-bg-amber',
      icon: Rocket,
      spark: [0, 0, 1, 1, 2, 2, 2, readyToLaunch],
      suffix: '个',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-card hover:shadow-card-hover transition-all duration-300 ${card.gradient} ${
              card.glow ? 'ring-4 ring-brand-500/10' : ''
            } animate-fade-in-up`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl pointer-events-none" />
            <div className="absolute inset-0 opacity-10 grain-overlay pointer-events-none" />
            <div className="relative flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-white/75 font-medium uppercase tracking-wider mb-1">
                  {card.label}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight">
                    {card.value}
                  </span>
                  <span className="text-sm text-white/80">{card.suffix}</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icon className="w-5.5 h-5.5" />
              </div>
            </div>
            <div className="relative">
              <MiniSparkline data={card.spark} color="rgba(255,255,255,0.85)" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;
