import { Link } from 'react-router-dom';
import type { Experiment, LaunchStatus } from '@/types';
import { getStatusLabel, formatDate, daysBetween, daysRemaining } from '@/utils/format';
import { Users, Calendar, BarChart3, FileCheck2, Pause, Play, AlertTriangle, Rocket, Zap, Shield, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ExperimentCardProps {
  experiment: Experiment;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (id: string, checked: boolean) => void;
  launchStatus?: LaunchStatus;
}

const statusStyles: Record<string, string> = {
  draft: 'bg-ink-100 text-ink-600 border-ink-200',
  running: 'bg-brand-50 text-brand-700 border-brand-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  archived: 'bg-ink-100 text-ink-500 border-ink-200',
};

const statusDotStyles: Record<string, string> = {
  draft: 'bg-ink-400',
  running: 'bg-brand-500 animate-pulse',
  paused: 'bg-amber-500',
  completed: 'bg-blue-500',
  archived: 'bg-ink-400',
};

const launchStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待上线', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  developing: { label: '开发中', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Zap },
  testing: { label: '测试中', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Shield },
  launched: { label: '已上线', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-ink-50 text-ink-600 border-ink-200', icon: XCircle },
};

const ExperimentCard = ({ experiment, selectable = false, selected = false, onSelectChange, launchStatus }: ExperimentCardProps) => {
  const total = experiment.totalVisitors || experiment.variants.reduce((s, v) => s + v.visitors, 0);
  const bestVariant = [...experiment.variants].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  const progress = (() => {
    const totalDays = daysBetween(experiment.startTime, experiment.endTime);
    const passed = totalDays - daysRemaining(experiment.endTime);
    if (totalDays === 0) return 0;
    return Math.max(0, Math.min(100, (passed / totalDays) * 100));
  })();
  const winnerName = experiment.winnerVariantId
    ? experiment.variants.find((v) => v.id === experiment.winnerVariantId)?.name
    : undefined;

  const handleCheckbox = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectChange?.(experiment.id, !selected);
  };

  const CardWrapper = selectable ? 'div' : Link;
  const wrapperProps = selectable
    ? {}
    : {
        to:
          experiment.status === 'completed'
            ? `/experiments/${experiment.id}/review`
            : `/experiments/${experiment.id}/dashboard`,
      };

  return (
    <CardWrapper
      // @ts-expect-error dynamic component props
      {...wrapperProps}
      className={`group relative flex flex-col rounded-2xl bg-white border p-5 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in-up ${
        selected
          ? 'border-brand-400 ring-2 ring-brand-500/20 bg-brand-50/30'
          : 'border-ink-200/70 hover:border-brand-300/60'
      }`}
    >
      {selectable && (
        <button
          onClick={handleCheckbox}
          className={`absolute top-4 right-4 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            selected
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'bg-white border-ink-300 hover:border-brand-400'
          }`}
        >
          {selected && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`chip border ${statusStyles[experiment.status]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotStyles[experiment.status]}`} />
              {getStatusLabel(experiment.status)}
            </span>
            {winnerName && (
              <span className="chip bg-brand-50 text-brand-700 border border-brand-200">
                🏆 {winnerName.split(' - ')[0]}
              </span>
            )}
            {launchStatus && launchStatusConfig[launchStatus] && (
              <span className={`chip border ${launchStatusConfig[launchStatus].color}`}>
                {(() => {
                  const Icon = launchStatusConfig[launchStatus].icon;
                  return <Icon className="w-3 h-3" />;
                })()}
                {launchStatusConfig[launchStatus].label}
              </span>
            )}
            {experiment.status === 'paused' && (
              <span className="chip bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle className="w-3 h-3" />
                异常暂停
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-semibold text-ink-900 tracking-tight text-balance line-clamp-1 group-hover:text-brand-700 transition-colors">
            {experiment.name}
          </h3>
          <p className="mt-1 text-sm text-ink-500 line-clamp-2 text-balance leading-relaxed">
            {experiment.goal}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-ink-500 mb-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-ink-400" />
          <span className="font-mono text-ink-600">{total.toLocaleString()}</span>
          <span>人参与</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-ink-400" />
          <span>{formatDate(experiment.startTime)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {experiment.variants.slice(0, 2).map((v) => (
          <div
            key={v.id}
            className={`rounded-xl p-3 border transition-all ${
              experiment.winnerVariantId === v.id
                ? 'bg-brand-50/60 border-brand-300/60'
                : 'bg-ink-50/50 border-ink-100'
            }`}
          >
            <div className="text-[11px] text-ink-500 mb-1 truncate">
              {v.isControl ? '◯ 对照 ' : '◇ 变体 '}{v.name.split(' - ')[0].split(' ').slice(-1)[0] || 'A'}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-lg font-semibold text-ink-800">
                {(v.conversionRate * 100).toFixed(1)}%
              </span>
              {bestVariant?.id === v.id && experiment.status !== 'draft' && (
                <span className="text-[10px] font-medium text-brand-600">领先</span>
              )}
            </div>
            <div className="text-[11px] text-ink-400 mt-0.5">
              占比 {v.trafficPercent}%
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-3 border-t border-ink-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-ink-500">实验进度</span>
          <span className="text-[11px] font-medium text-ink-600 font-mono">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {experiment.status === 'running' ? (
              <span className="flex items-center gap-1 text-xs text-ink-600">
                <Play className="w-3 h-3 text-brand-500 fill-brand-500" />
                进行中
              </span>
            ) : experiment.status === 'paused' ? (
              <span className="flex items-center gap-1 text-xs text-amber-700">
                <Pause className="w-3 h-3" />
                已暂停
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-blue-700">
                <FileCheck2 className="w-3 h-3" />
                可复盘
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-brand-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            {experiment.status === 'completed' ? '查看复盘' : '查看数据'}
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </CardWrapper>
  );
};

export default ExperimentCard;
