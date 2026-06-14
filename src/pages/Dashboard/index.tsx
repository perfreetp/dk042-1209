import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import TrendLineChart from '@/components/charts/TrendLineChart';
import FunnelChart from '@/components/charts/FunnelChart';
import { useExperimentStore } from '@/store/useExperimentStore';
import { MOCK_DAILY_DATA } from '@/data/experiments';
import { calculateSignificance } from '@/utils/statistics';
import { formatPercent, formatNumber, formatDate, getStatusLabel } from '@/utils/format';
import {
  ArrowLeft,
  Play,
  Pause,
  AlertTriangle,
  Plus,
  MessageSquare,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  BarChart3,
  FileCheck2,
  Clock,
  ChevronDown,
  ChevronRight,
  X,
  Send,
  Eye,
  AlertCircle,
  Trophy,
  Sparkles,
  Info,
} from 'lucide-react';
import type { ObservationType } from '@/types';

const variantColors = ['#475569', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];

const Dashboard = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { getExperiment, updateExperimentStatus, getObservations, addObservation } = useExperimentStore();
  const experiment = getExperiment(id);
  const observations = getObservations(id);
  const [obsOpen, setObsOpen] = useState(false);
  const [newObsType, setNewObsType] = useState<ObservationType>('note');
  const [newObs, setNewObs] = useState('');

  if (!experiment) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="实验数据看板" showCreateButton={false} />
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-ink-400" />
            </div>
            <p className="font-display text-lg font-semibold text-ink-700 mb-2">实验不存在</p>
            <Link to="/experiments" className="btn-secondary mt-2">
              返回实验列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const controlVariant = experiment.variants.find((v) => v.isControl) || experiment.variants[0];
  const testVariants = experiment.variants.filter((v) => v.id !== controlVariant.id);

  const sigResults = useMemo(() => {
    const results: Array<{
      variantId: string;
      variantName: string;
      color: string;
      sig: ReturnType<typeof calculateSignificance>;
    }> = [];
    testVariants.forEach((v, idx) => {
      const metricName = experiment.metrics.find((m) => m.isPrimary)?.name || '核心指标';
      results.push({
        variantId: v.id,
        variantName: v.name,
        color: variantColors[(idx + 1) % variantColors.length],
        sig: calculateSignificance(
          'primary',
          metricName,
          controlVariant.visitors,
          controlVariant.conversions,
          v.visitors,
          v.conversions,
        ),
      });
    });
    return results;
  }, [experiment]);

  const trendData = useMemo(() => {
    const controlKey = `${experiment.id}|${controlVariant.id}`;
    const controlDaily = MOCK_DAILY_DATA[controlKey] || [];
    const variantDaily: Record<string, typeof controlDaily> = {};
    testVariants.forEach((v, idx) => {
      const key = `${experiment.id}|${v.id}`;
      variantDaily[idx] = MOCK_DAILY_DATA[key] || [];
    });
    return controlDaily.map((cd, i) => {
      const row: Record<string, any> = { date: cd.date.slice(5) };
      row[`control_${controlVariant.id}`] = (cd.conversions / cd.visitors) || 0;
      testVariants.forEach((v, idx) => {
        const vd = variantDaily[idx]?.[i];
        row[`variant_${v.id}`] = vd ? (vd.conversions / vd.visitors) || 0 : 0;
      });
      return row;
    });
  }, [experiment, controlVariant, testVariants]);

  const totalDays = Math.ceil(
    (new Date(experiment.endTime).getTime() - new Date(experiment.startTime).getTime()) / 86400000,
  );
  const elapsedDays = Math.min(
    totalDays,
    Math.max(
      0,
      Math.ceil(
        (Math.min(Date.now(), new Date(experiment.endTime).getTime()) -
          new Date(experiment.startTime).getTime()) /
          86400000,
      ),
    ),
  );
  const progressPct = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

  const handleAddObs = () => {
    if (!newObs.trim()) return;
    addObservation({
      id: `obs_${Date.now()}`,
      experimentId: id,
      author: '张明',
      authorAvatar: undefined,
      timestamp: new Date().toISOString(),
      content: newObs.trim(),
      type: newObsType,
    });
    setNewObs('');
  };

  const statusConfig: Record<string, { label: string; chip: string; dot: string }> = {
    draft: { label: '草稿', chip: 'bg-ink-100 text-ink-600 border-ink-200', dot: 'bg-ink-400' },
    running: {
      label: '进行中',
      chip: 'bg-brand-50 text-brand-700 border-brand-200',
      dot: 'bg-brand-500 animate-pulse',
    },
    paused: {
      label: '已暂停',
      chip: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    completed: {
      label: '已完成',
      chip: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={experiment.name}
        subtitle={experiment.goal}
      />
      <div className="flex-1 px-8 py-6 overflow-y-auto scrollbar-thin space-y-6">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <Link to="/experiments" className="btn-ghost !px-0 !py-0 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 text-ink-500" />
            <span className="text-ink-500 text-xs">返回列表</span>
          </Link>
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`chip border ${statusConfig[experiment.status]?.chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[experiment.status]?.dot}`} />
                  {getStatusLabel(experiment.status)}
                </span>
                <span className="chip bg-ink-100 text-ink-600 border border-ink-200">
                  <Target className="w-3 h-3" />
                  {experiment.pageUrl}
                </span>
                <span className="chip bg-ink-100 text-ink-600 border border-ink-200">
                  <Users className="w-3 h-3" />
                  {formatNumber(experiment.totalVisitors || experiment.variants.reduce((s, v) => s + v.visitors, 0))} 人参与
                </span>
                {sigResults.some((r) => r.sig.isSignificant) && (
                  <span className="chip bg-brand-50 text-brand-700 border border-brand-200">
                    <Sparkles className="w-3 h-3" />
                    已达显著
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                <div>
                  <p className="label-sm mb-1">运行天数</p>
                  <p className="font-display text-2xl font-semibold text-ink-900 flex items-baseline gap-1">
                    {elapsedDays}
                    <span className="text-sm text-ink-400 font-sans font-medium">/ {totalDays} 天</span>
                  </p>
                </div>
                <div>
                  <p className="label-sm mb-1">起止时间</p>
                  <p className="text-sm text-ink-700 leading-tight">
                    {formatDate(experiment.startTime)}
                    <br />
                    ~ {formatDate(experiment.endTime)}
                  </p>
                </div>
                <div>
                  <p className="label-sm mb-1">实验版本</p>
                  <p className="font-display text-2xl font-semibold text-ink-900 flex items-baseline gap-1">
                    {experiment.variants.length}
                    <span className="text-sm text-ink-400 font-sans font-medium">个版本</span>
                  </p>
                </div>
                <div>
                  <p className="label-sm mb-1">创建人</p>
                  <p className="text-sm text-ink-700">{experiment.createdBy}</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-500">时间进度</span>
                  <span className="text-xs font-mono font-semibold text-ink-600">
                    {progressPct.toFixed(0)}%
                  </span>
                </div>
                <div className="progress-track h-1.5">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              {experiment.status === 'running' && (
                <button
                  onClick={() => updateExperimentStatus(id, 'paused')}
                  className="btn-danger"
                >
                  <Pause className="w-4 h-4" />
                  暂停实验
                </button>
              )}
              {experiment.status === 'paused' && (
                <button
                  onClick={() => updateExperimentStatus(id, 'running')}
                  className="btn-primary"
                >
                  <Play className="w-4 h-4" />
                  恢复实验
                </button>
              )}
              {experiment.status !== 'completed' && (
                <button
                  onClick={() => updateExperimentStatus(id, 'completed')}
                  className="btn-secondary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  结束并复盘
                </button>
              )}
              {experiment.status === 'completed' && (
                <Link to={`/experiments/${id}/review`} className="btn-primary">
                  <FileCheck2 className="w-4 h-4" />
                  进入复盘
                </Link>
              )}
              <button onClick={() => setObsOpen(true)} className="btn-secondary">
                <MessageSquare className="w-4 h-4" />
                观察备注 ({observations.length})
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-500" />
              <h3 className="font-display text-xl font-semibold text-ink-900">核心指标对比</h3>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-ink-400" />
              <span className="text-xs text-ink-500">显著性检验，p {'<'} 0.05 视为统计显著</span>
            </div>
          </div>
          <div
            className={`grid gap-4 ${
              experiment.variants.length <= 2
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
            }`}
          >
            {experiment.variants.map((v, idx) => {
              const isControl = v.isControl;
              const color = variantColors[idx % variantColors.length];
              const sigMatch = sigResults.find((r) => r.variantId === v.id);
              const bestVariant = [...experiment.variants].sort(
                (a, b) => b.conversionRate - a.conversionRate,
              )[0];
              const isBest = bestVariant.id === v.id;
              return (
                <div
                  key={v.id}
                  className={`glass-card p-5 relative overflow-hidden transition-all ${
                    isBest && experiment.status !== 'draft'
                      ? 'ring-2 ring-brand-400/40 shadow-card-hover'
                      : ''
                  }`}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                  />
                  {isBest && experiment.status !== 'draft' && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 chip bg-brand-50 text-brand-700 border border-brand-200">
                      <Trophy className="w-3 h-3" />
                      领先
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{ background: color }}
                    >
                      {isControl ? 'C' : String.fromCharCode(65 + idx - 1)}
                    </div>
                    <div className="min-w-0">
                      {isControl && (
                        <div className="chip bg-ink-100 text-ink-600 text-[10px] mb-0.5">
                          对照组
                        </div>
                      )}
                      <p className="font-semibold text-ink-900 text-sm truncate">{v.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-1">
                        访问
                      </p>
                      <p className="font-mono text-lg font-semibold text-ink-800">
                        {formatNumber(v.visitors)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-1">
                        转化
                      </p>
                      <p className="font-mono text-lg font-semibold text-ink-800">
                        {formatNumber(v.conversions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-1">
                        流量
                      </p>
                      <p className="font-mono text-lg font-semibold text-ink-800">
                        {v.trafficPercent}%
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-ink-100">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-xs text-ink-500">转化率</span>
                      {sigMatch && (
                        <div
                          className={`flex items-center gap-1 chip ${
                            sigMatch.sig.isSignificant
                              ? sigMatch.sig.liftPercent >= 0
                                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                                : 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-ink-100 text-ink-600 border border-ink-200'
                          }`}
                        >
                          {sigMatch.sig.liftPercent > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : sigMatch.sig.liftPercent < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          <span className="font-mono text-[11px] font-semibold">
                            {sigMatch.sig.liftPercent >= 0 ? '+' : ''}
                            {formatPercent(sigMatch.sig.liftPercent, 1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span
                        className="font-mono text-4xl font-bold tracking-tight"
                        style={{ color }}
                      >
                        {formatPercent(v.conversionRate, 1)}
                      </span>
                    </div>
                    {sigMatch ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-500">95% 置信区间</span>
                          <span className="font-mono text-ink-700">
                            [{formatPercent(sigMatch.sig.confidenceInterval[0], 2)},{' '}
                            {formatPercent(sigMatch.sig.confidenceInterval[1], 2)}]
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-500">p-value</span>
                          <span
                            className={`font-mono ${
                              sigMatch.sig.pValue < 0.05 ? 'text-brand-600' : 'text-ink-500'
                            }`}
                          >
                            {sigMatch.sig.pValue.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-500">置信度</span>
                          <span
                            className={`chip ${
                              sigMatch.sig.isSignificant
                                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {sigMatch.sig.isSignificant ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {sigMatch.sig.confidence.toFixed(1)}%
                            {sigMatch.sig.isSignificant ? ' · 显著' : ' · 需更多样本'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-ink-400 bg-ink-50 rounded-lg px-3 py-2">
                        对照组，作为其他版本的比较基准
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" />
              <h3 className="font-display text-xl font-semibold text-ink-900">转化率趋势</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ink-500 mr-1">版本:</span>
              <span className="chip bg-ink-50 text-ink-700 border border-ink-200">
                <span className="w-2 h-2 rounded-full" style={{ background: variantColors[0] }} />
                {controlVariant.name}
              </span>
              {testVariants.map((v, idx) => (
                <span key={v.id} className="chip bg-ink-50 text-ink-700 border border-ink-200">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: variantColors[(idx + 1) % variantColors.length] }}
                  />
                  {v.name}
                </span>
              ))}
            </div>
          </div>
          <TrendLineChart
            data={trendData}
            series={[
              {
                key: `control_${controlVariant.id}`,
                name: controlVariant.name,
                color: variantColors[0],
              },
              ...testVariants.map((v, idx) => ({
                key: `variant_${v.id}`,
                name: v.name,
                color: variantColors[(idx + 1) % variantColors.length],
              })),
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-5 h-5 text-brand-500" />
              <h3 className="font-display text-xl font-semibold text-ink-900">转化漏斗</h3>
            </div>
            <FunnelChart
              steps={[
                {
                  name: '页面访问',
                  values: experiment.variants.map((v, idx) => ({
                    variantName: v.name,
                    value: v.visitors,
                    color: variantColors[idx % variantColors.length],
                  })),
                },
                {
                  name: '产生兴趣',
                  values: experiment.variants.map((v, idx) => ({
                    variantName: v.name,
                    value: Math.floor(v.visitors * (0.55 + idx * 0.03)),
                    color: variantColors[idx % variantColors.length],
                  })),
                },
                {
                  name: '点击CTA',
                  values: experiment.variants.map((v, idx) => ({
                    variantName: v.name,
                    value: Math.floor(v.visitors * (0.28 + idx * 0.025)),
                    color: variantColors[idx % variantColors.length],
                  })),
                },
                {
                  name: '完成转化',
                  values: experiment.variants.map((v, idx) => ({
                    variantName: v.name,
                    value: v.conversions,
                    color: variantColors[idx % variantColors.length],
                  })),
                },
              ]}
            />
          </div>

          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                <h3 className="font-display text-xl font-semibold text-ink-900">观察备注</h3>
              </div>
              <span className="chip bg-ink-100 text-ink-600">{observations.length} 条</span>
            </div>
            <div className="space-y-4 max-h-[440px] overflow-y-auto scrollbar-thin pr-2">
              {observations.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">暂无观察备注</p>
                  <button onClick={() => setObsOpen(true)} className="btn-ghost mt-3">
                    <Plus className="w-4 h-4" />
                    添加第一条备注
                  </button>
                </div>
              ) : (
                observations.map((obs, idx) => {
                  const typeConfig: Record<ObservationType, { chip: string; icon: any }> = {
                    note: { chip: 'bg-ink-100 text-ink-600 border-ink-200', icon: MessageSquare },
                    insight: {
                      chip: 'bg-brand-50 text-brand-700 border-brand-200',
                      icon: Sparkles,
                    },
                    anomaly: { chip: 'bg-red-50 text-red-600 border-red-200', icon: AlertTriangle },
                  };
                  const Icon = typeConfig[obs.type].icon;
                  return (
                    <div
                      key={obs.id}
                      className="relative pl-6 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-ink-200 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-400" />
                      </div>
                      {idx < observations.length - 1 && (
                        <div className="absolute left-[7px] top-6 bottom-[-16px] w-px bg-ink-200" />
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`chip border text-[10px] ${typeConfig[obs.type].chip}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {obs.type === 'note' ? '备注' : obs.type === 'insight' ? '洞察' : '异常'}
                        </span>
                        <span className="text-xs text-ink-500">{obs.author}</span>
                        <span className="text-[11px] text-ink-400 ml-auto font-mono">
                          {formatDate(obs.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-ink-700 leading-relaxed">{obs.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {experiment.status !== 'completed' && sigResults.some((r) => r.sig.isSignificant) && (
          <div className="glass-card p-5 border-brand-300/60 bg-brand-50/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl gradient-bg-emerald flex items-center justify-center text-white shadow-glow-emerald">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-ink-900">
                  已达统计显著，可结束实验
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  核心指标已达到 95% 置信度，建议尽快停止实验并进入复盘流程
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/experiments/${id}/review`} className="btn-primary">
                <FileCheck2 className="w-4 h-4" />
                立即复盘
              </Link>
            </div>
          </div>
        )}
      </div>

      {obsOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in">
          <div className="w-full md:w-[480px] md:rounded-2xl rounded-t-2xl bg-white shadow-2xl animate-fade-in-up overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-ink-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                <h3 className="font-display text-lg font-semibold text-ink-900">添加观察备注</h3>
              </div>
              <button
                onClick={() => setObsOpen(false)}
                className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label-sm block mb-2">备注类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: 'note', label: '普通备注', icon: MessageSquare, cls: 'ink' },
                      { key: 'insight', label: '数据洞察', icon: Sparkles, cls: 'brand' },
                      { key: 'anomaly', label: '异常报警', icon: AlertTriangle, cls: 'red' },
                    ] as const
                  ).map((o) => {
                    const Icon = o.icon;
                    const active = newObsType === o.key;
                    const clsMap = {
                      ink: active
                        ? 'bg-ink-800 border-ink-800 text-white'
                        : 'bg-white border-ink-200 text-ink-600 hover:border-ink-300',
                      brand: active
                        ? 'bg-brand-600 border-brand-600 text-white shadow-glow-emerald'
                        : 'bg-white border-ink-200 text-ink-600 hover:border-brand-400',
                      red: active
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-white border-ink-200 text-ink-600 hover:border-red-300',
                    };
                    return (
                      <button
                        key={o.key}
                        onClick={() => setNewObsType(o.key)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${clsMap[o.cls]}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label-sm block mb-2">备注内容</label>
                <textarea
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                  placeholder="记录实验过程中的观察、发现、问题..."
                  rows={5}
                  className="input-base resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-ink-100 bg-ink-50/50">
              <button onClick={() => setObsOpen(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleAddObs} disabled={!newObs.trim()} className="btn-primary">
                <Send className="w-4 h-4" />
                发布备注
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
