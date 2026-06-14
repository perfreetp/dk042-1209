import { useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useExperimentStore } from '@/store/useExperimentStore';
import { calculateSignificance } from '@/utils/statistics';
import {
  formatPercent,
  formatNumber,
  formatDate,
  formatDateTime,
  getStatusLabel,
} from '@/utils/format';
import type { Review, ObservationType, Variant } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Zap,
  Shield,
  FileCheck2,
  ChevronRight,
  Users,
  Target,
  Clock,
  TrendingUp,
  Minus,
  Copy,
  ExternalLink,
  Save,
  Rocket,
  Sparkles,
  MessageSquare,
  Info,
  XCircle,
  GripVertical,
  Star,
  Download,
  X,
  FileText,
  Image,
  Share2,
  Check,
  Calendar,
  ChevronDown,
} from 'lucide-react';

const variantColors = ['#475569', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];

const obsTypeMeta: Record<ObservationType, { label: string; chip: string; dot: string; icon: typeof MessageSquare }> = {
  note: {
    label: '普通备注',
    chip: 'bg-ink-50 text-ink-700 border-ink-200',
    dot: 'bg-ink-400',
    icon: MessageSquare,
  },
  insight: {
    label: '数据洞察',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: Lightbulb,
  },
  anomaly: {
    label: '异常报警',
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    icon: AlertTriangle,
  },
};

export default function ReviewPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const {
    getExperiment,
    getObservations,
    getReview,
    upsertReview,
    markWinner,
    markReadyToLaunch,
    updateExperimentStatus,
    updateLaunchStatus,
  } = useExperimentStore();

  const experiment = getExperiment(id);
  const observations = getObservations(id);
  const review = getReview(id);
  const [saved, setSaved] = useState(false);

  const [draft, setDraft] = useState<Partial<Review>>({
    conclusion: review?.conclusion ?? '',
    winnerReason: review?.winnerReason ?? '',
    lessonsLearned: review?.lessonsLearned ?? '',
    risks: review?.risks ?? '',
    isWinnerReadyToLaunch: review?.isWinnerReadyToLaunch ?? false,
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const launchStatus = review?.launchStatus || 'pending';

  const launchStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: '待上线', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    developing: { label: '开发中', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Zap },
    testing: { label: '测试中', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Shield },
    launched: { label: '已上线', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    cancelled: { label: '已取消', color: 'bg-ink-100 text-ink-600 border-ink-200', icon: XCircle },
  };

  const launchSteps = [
    { key: 'pending', label: '待上线' },
    { key: 'developing', label: '开发中' },
    { key: 'testing', label: '测试中' },
    { key: 'launched', label: '已上线' },
  ];

  const generateReportMarkdown = () => {
    if (!experiment || !bestVariant) return '';
    const sig = sigResults.find((r) => r.variantId === bestVariant.id)?.sig;
    return `# A/B 实验复盘报告 - ${experiment.name}

## 基本信息
- **实验目标**: ${experiment.goal}
- **实验页面**: ${experiment.pageUrl}
- **运行时间**: ${formatDate(experiment.startTime)} ~ ${formatDate(experiment.endTime)} (${totalDays} 天)
- **参与人数**: ${formatNumber(totalVisitors)} 人
- **负责人**: ${experiment.createdBy}

## 核心结论
${draft.conclusion || '（待填写）'}

## 胜出版本
🏆 **${bestVariant.name}**

- 转化率: ${formatPercent(bestVariant.conversionRate)}
- 相对提升: ${sig ? `+${sig.liftPercent.toFixed(2)}%` : '显著提升'}
- 置信度: ${sig ? `${sig.confidence.toFixed(1)}%` : '95%+'}
- 访客数: ${formatNumber(bestVariant.visitors)}
- 转化数: ${formatNumber(bestVariant.conversions)}

## 胜出原因
${draft.winnerReason || '（待填写）'}

## 经验教训
${draft.lessonsLearned || '（待填写）'}

## 风险与注意事项
${draft.risks || '（待填写）'}

## 上线状态
${launchStatusConfig[launchStatus]?.label || '待上线'}

---
报告生成时间: ${formatDateTime(new Date().toISOString())}
`;
  };

  const copyReport = async () => {
    const md = generateReportMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败', e);
    }
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/share/experiments/${id}/review`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      console.error('复制失败', e);
    }
  };

  const downloadReport = (type: 'md' | 'txt') => {
    const md = generateReportMarkdown();
    const blob = new Blob([md], { type: type === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment?.name || '实验报告'}-复盘.${type === 'md' ? 'md' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${experiment?.name || '实验报告'}-复盘长图.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('导出图片失败:', e);
      alert('图片导出失败，请重试');
    }
  };

  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${experiment?.name || '实验报告'}-复盘报告.pdf`);
    } catch (e) {
      console.error('导出 PDF 失败:', e);
      alert('PDF 导出失败，请重试');
    }
  };

  const advanceLaunchStatus = () => {
    const idx = launchSteps.findIndex((s) => s.key === launchStatus);
    if (idx >= 0 && idx < launchSteps.length - 1) {
      const next = launchSteps[idx + 1].key as any;
      updateLaunchStatus(id, next);
    }
  };

  if (!experiment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-ink-400" />
          </div>
          <p className="text-lg font-semibold text-ink-700 mb-2">实验不存在</p>
          <Link to="/experiments" className="btn-secondary">
            返回实验列表
          </Link>
        </div>
      </div>
    );
  }

  const controlVariant = experiment.variants.find((v) => v.isControl) || experiment.variants[0];
  const testVariants = experiment.variants.filter((v) => v.id !== controlVariant.id);

  const sigResults = useMemo(() => {
    return testVariants.map((v, idx) => ({
      variantId: v.id,
      variantName: v.name,
      variant: v,
      color: variantColors[(idx + 1) % variantColors.length],
      sig: calculateSignificance(
        'primary',
        experiment.metrics.find((m) => m.isPrimary)?.name || '核心指标',
        controlVariant.visitors,
        controlVariant.conversions,
        v.visitors,
        v.conversions,
      ),
    }));
  }, [experiment, controlVariant, testVariants]);

  const bestVariant = useMemo(() => {
    if (experiment.winnerVariantId) {
      return experiment.variants.find((v) => v.id === experiment.winnerVariantId);
    }
    let best: (Variant & { lift: number; conf: number }) | null = null;
    sigResults.forEach((r) => {
      if (r.sig.isSignificant) {
        const candidate = { ...r.variant, lift: r.sig.liftPercent, conf: r.sig.confidence };
        if (!best || candidate.lift > best.lift) best = candidate;
      }
    });
    return best;
  }, [sigResults, experiment]);

  const setWinner = (variantId: string) => {
    markWinner(experiment.id, variantId);
  };

  const updateDraft = (patch: Partial<Review>) => {
    setDraft({ ...draft, ...patch });
    setSaved(false);
  };

  const saveReview = () => {
    upsertReview(experiment.id, {
      conclusion: draft.conclusion,
      winnerReason: draft.winnerReason,
      lessonsLearned: draft.lessonsLearned,
      risks: draft.risks,
      isPublished: true,
      publishedAt: new Date().toISOString(),
    });
    if (experiment.status !== 'completed') {
      updateExperimentStatus(experiment.id, 'completed');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleReady = () => {
    const next = !draft.isWinnerReadyToLaunch;
    updateDraft({ isWinnerReadyToLaunch: next });
    markReadyToLaunch(experiment.id, next);
  };

  const totalDays = Math.ceil(
    (new Date(experiment.endTime).getTime() - new Date(experiment.startTime).getTime()) / 86400000,
  );
  const totalVisitors = experiment.variants.reduce((s, v) => s + v.visitors, 0);
  const totalConversions = experiment.variants.reduce((s, v) => s + v.conversions, 0);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/experiments/${experiment.id}/dashboard`} className="btn-ghost !px-0 !py-0 hover:bg-transparent">
          <ArrowLeft className="w-4 h-4 text-ink-500" />
          <span className="text-ink-500 text-xs">返回数据看板</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="btn-secondary"
          >
            {linkCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {linkCopied ? '已复制链接' : '分享链接'}
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="btn-secondary"
          >
            <FileText className="w-4 h-4" />
            生成报告
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl glass-card p-8 bg-gradient-to-br from-brand-50/80 via-white to-emerald-50/60">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-brand-400/15 blur-3xl" />
        <div className="absolute inset-0 grain opacity-40 pointer-events-none" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="chip bg-blue-50 text-blue-700 border border-blue-200">
                <FileCheck2 className="w-3 h-3" />
                复盘分析
              </span>
              <span className="chip bg-ink-100 text-ink-600 border border-ink-200">
                <Target className="w-3 h-3" />
                {experiment.pageUrl}
              </span>
              <span className="chip bg-ink-100 text-ink-600 border border-ink-200">
                <Clock className="w-3 h-3" />
                运行 {totalDays} 天
              </span>
              <span className="chip bg-ink-100 text-ink-600 border border-ink-200">
                <Users className="w-3 h-3" />
                {formatNumber(totalVisitors)} 参与
              </span>
            </div>
            <h1 className="text-3xl font-serif font-semibold text-ink-900 tracking-tight mb-2">
              {experiment.name}
            </h1>
            <p className="text-ink-600 max-w-2xl">{experiment.goal}</p>

            {bestVariant && (
              <div className="mt-6 p-5 rounded-2xl bg-white/70 border border-emerald-200 backdrop-blur-sm flex flex-wrap items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
                    🏆 胜出版本 · Winner
                  </div>
                  <h3 className="text-lg font-semibold text-ink-900">{bestVariant.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                    {experiment.winnerVariantId === bestVariant.id || bestVariant ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {sigResults.find((r) => r.variantId === bestVariant.id)?.sig.liftPercent != null
                            ? `+${sigResults.find((r) => r.variantId === bestVariant.id)!.sig.liftPercent.toFixed(1)}%`
                            : '显著提升'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-ink-600">
                          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                          置信度 {(sigResults.find((r) => r.variantId === bestVariant.id)?.sig.confidence ?? 95).toFixed(1)}%
                        </span>
                        <span className="inline-flex items-center gap-1 text-ink-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {formatNumber(bestVariant.visitors)} 访客 · {formatNumber(bestVariant.conversions)} 转化
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {draft.isWinnerReadyToLaunch ? (
                    <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-brand-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                      <Rocket className="w-4 h-4" />
                      已标记待上线
                    </div>
                  ) : (
                    <button
                      onClick={toggleReady}
                      disabled={!experiment.winnerVariantId}
                      className="btn-secondary disabled:opacity-50 flex items-center gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      标记为待上线
                    </button>
                  )}
                </div>
              </div>
            )}

            {!bestVariant && (
              <div className="mt-6 p-5 rounded-2xl bg-amber-50/80 border border-amber-200 backdrop-blur-sm flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-amber-900">暂无统计显著的胜出方案</div>
                  <p className="text-sm text-amber-800 mt-1">
                    目前各版本间的差异未达到 95% 置信度水平，您可以继续运行实验以积累更多样本，
                    或在下方手动选择胜出版本进入复盘。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-ink-900 font-serif">核心指标对比</h2>
                <p className="text-sm text-ink-500 mt-0.5">各版本的关键表现与显著性检验结果</p>
              </div>
              <div className="text-xs text-ink-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                采用 Z-test for proportions · α=0.05
              </div>
            </div>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-ink-400">
                    <th className="text-left font-medium pb-3 px-2">版本</th>
                    <th className="text-right font-medium pb-3 px-2">访客</th>
                    <th className="text-right font-medium pb-3 px-2">转化</th>
                    <th className="text-right font-medium pb-3 px-2">转化率</th>
                    <th className="text-right font-medium pb-3 px-2">相对提升</th>
                    <th className="text-right font-medium pb-3 px-2">95% 置信区间</th>
                    <th className="text-right font-medium pb-3 px-2">p-value</th>
                    <th className="text-center font-medium pb-3 px-2">显著</th>
                    <th className="text-center font-medium pb-3 px-2">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  <tr className="group">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: variantColors[0] }} />
                        <div>
                          <div className="text-sm font-medium text-ink-900">{controlVariant.name}</div>
                          <div className="text-[11px] text-ink-400">对照组 · Control</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3.5 px-2 font-mono text-sm text-ink-700">
                      {formatNumber(controlVariant.visitors)}
                    </td>
                    <td className="text-right py-3.5 px-2 font-mono text-sm text-ink-700">
                      {formatNumber(controlVariant.conversions)}
                    </td>
                    <td className="text-right py-3.5 px-2 font-mono text-sm font-medium text-ink-900">
                      {formatPercent(controlVariant.conversionRate)}
                    </td>
                    <td className="text-right py-3.5 px-2">
                      <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                        <Minus className="w-3 h-3" /> 基准
                      </span>
                    </td>
                    <td className="text-right py-3.5 px-2 text-xs text-ink-400">—</td>
                    <td className="text-right py-3.5 px-2 text-xs text-ink-400">—</td>
                    <td className="text-center py-3.5 px-2 text-xs text-ink-400">—</td>
                    <td className="text-center py-3.5 px-2 text-xs text-ink-400">基准</td>
                  </tr>

                  {sigResults.map((r) => {
                    const isWinner = experiment.winnerVariantId === r.variantId;
                    return (
                      <tr
                        key={r.variantId}
                        className={`group ${r.sig.isSignificant ? 'bg-emerald-50/40' : ''}`}
                      >
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                            <div>
                              <div className="text-sm font-medium text-ink-900 flex items-center gap-1.5">
                                {r.variantName}
                                {isWinner && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500">
                                    <Star className="w-2.5 h-2.5" /> W
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-ink-400">变体 · Variant</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3.5 px-2 font-mono text-sm text-ink-700">
                          {formatNumber(r.variant.visitors)}
                        </td>
                        <td className="text-right py-3.5 px-2 font-mono text-sm text-ink-700">
                          {formatNumber(r.variant.conversions)}
                        </td>
                        <td className="text-right py-3.5 px-2 font-mono text-sm font-medium text-ink-900">
                          {formatPercent(r.variant.conversionRate)}
                        </td>
                        <td className={`text-right py-3.5 px-2 font-mono text-sm font-semibold ${
                          r.sig.liftPercent > 0 ? 'text-emerald-700' : r.sig.liftPercent < 0 ? 'text-rose-700' : 'text-ink-500'
                        }`}>
                          {r.sig.liftPercent > 0 ? '+' : ''}{r.sig.liftPercent.toFixed(2)}%
                        </td>
                        <td className="text-right py-3.5 px-2 font-mono text-xs text-ink-600">
                          [{r.sig.confidenceInterval[0].toFixed(3)}%, {r.sig.confidenceInterval[1].toFixed(3)}%]
                        </td>
                        <td className="text-right py-3.5 px-2 font-mono text-xs text-ink-600">
                          {r.sig.pValue.toFixed(4)}
                        </td>
                        <td className="text-center py-3.5 px-2">
                          {r.sig.isSignificant ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3" /> 是
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-100 text-ink-500 text-[11px] font-medium">
                              <XCircle className="w-3 h-3" /> 否
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3.5 px-2">
                          <button
                            onClick={() => setWinner(r.variantId)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              isWinner
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                                : 'bg-white border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/50'
                            }`}
                          >
                            {isWinner ? '✓ 已胜出' : '设为胜出'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-ink-900 font-serif">复盘结论编辑器</h2>
                <p className="text-sm text-ink-500 mt-0.5">沉淀经验，形成可复用的增长方法论</p>
              </div>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="chip bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> 已保存
                  </span>
                )}
                <button
                  onClick={saveReview}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存并发布
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-600 text-white flex items-center justify-center">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-ink-900">核心结论</span>
                    <span className="text-xs text-ink-400 ml-2">总结实验最终结论和推荐方案</span>
                  </div>
                </label>
                <textarea
                  value={draft.conclusion}
                  onChange={(e) => updateDraft({ conclusion: e.target.value })}
                  rows={4}
                  placeholder="例如：变体 A 在核心指标上显著优于原始版本（+13.9%，置信度 99.2%），推荐全量上线..."
                  className="input-base resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-ink-900">胜出原因</span>
                      <span className="text-xs text-ink-400 ml-2">为什么这个版本效果更好</span>
                    </div>
                  </label>
                  <textarea
                    value={draft.winnerReason}
                    onChange={(e) => updateDraft({ winnerReason: e.target.value })}
                    rows={4}
                    placeholder="从用户心理、视觉设计、交互体验等维度分析..."
                    className="input-base resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center">
                      <Lightbulb className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-ink-900">经验教训</span>
                      <span className="text-xs text-ink-400 ml-2">可复用的方法论与洞察</span>
                    </div>
                  </label>
                  <textarea
                    value={draft.lessonsLearned}
                    onChange={(e) => updateDraft({ lessonsLearned: e.target.value })}
                    rows={4}
                    placeholder="1. ...；2. ...；3. ..."
                    className="input-base resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-ink-900">风险与注意事项</span>
                    <span className="text-xs text-ink-400 ml-2">上线前需排查的问题和依赖</span>
                  </div>
                </label>
                <textarea
                  value={draft.risks}
                  onChange={(e) => updateDraft({ risks: e.target.value })}
                  rows={3}
                  placeholder="潜在的技术风险、兼容性问题、依赖项、与其他团队的对齐..."
                  className="input-base resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-900 font-serif">📋 上线清单</h2>
              {draft.isWinnerReadyToLaunch && bestVariant && (
                <span className={`chip border ${launchStatusConfig[launchStatus]?.color}`}>
                  {(() => {
                    const Icon = launchStatusConfig[launchStatus]?.icon || Clock;
                    return <Icon className="w-3 h-3" />;
                  })()}
                  {launchStatusConfig[launchStatus]?.label}
                </span>
              )}
            </div>
            {draft.isWinnerReadyToLaunch && bestVariant ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-brand-50 border border-emerald-200/60">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-brand-600 text-white flex items-center justify-center">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink-900">胜出版本待上线</div>
                      <div className="text-xs text-ink-500">
                        生成于 {review?.publishedAt ? formatDateTime(review.publishedAt) : formatDateTime(new Date().toISOString())}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-ink-700 bg-white/70 rounded-xl p-3 border border-emerald-100">
                    <div className="font-medium text-ink-900 mb-1">{bestVariant.name}</div>
                    <div className="text-xs text-ink-500">{(bestVariant as Variant).description || experiment.description}</div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-ink-500 mb-2">上线进度跟踪</p>
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      {launchSteps.map((step, i) => {
                        const currentIdx = launchSteps.findIndex((s) => s.key === launchStatus);
                        const isActive = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isActive
                                  ? isCurrent
                                    ? 'bg-gradient-to-br from-brand-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110'
                                    : 'bg-emerald-500 text-white'
                                  : 'bg-ink-100 text-ink-400'
                              }`}
                            >
                              {isActive && i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 font-medium ${
                                isActive ? 'text-ink-700' : 'text-ink-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-ink-100 -z-0">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all"
                        style={{
                          width: `${
                            (launchSteps.findIndex((s) => s.key === launchStatus) /
                              (launchSteps.length - 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: Copy, label: '前端代码 Merge', desc: `将 ${bestVariant.name} 代码合入主干`, done: true },
                    { icon: Zap, label: '性能评估', desc: '确认页面加载和交互性能达标', done: true },
                    { icon: Shield, label: '安全 & AB 兼容', desc: '移除实验分组逻辑、清理 AB SDK', done: launchStatus !== 'pending' },
                    { icon: Users, label: '跨团队同步', desc: '设计、运营、客服团队通知', done: launchStatus === 'testing' || launchStatus === 'launched' },
                    { icon: BookOpen, label: '文档更新', desc: '产品文档、埋点文档、帮助中心', done: launchStatus === 'testing' || launchStatus === 'launched' },
                    { icon: FileCheck2, label: '数据埋点验证', desc: '上线后 48h 数据核对', done: launchStatus === 'launched' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-ink-200/60">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        t.done ? 'bg-emerald-100 text-emerald-600' : 'bg-ink-100 text-ink-400'
                      }`}>
                        {t.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <t.icon className="w-3.5 h-3.5 text-ink-500" />
                          <span className={`text-sm font-medium ${t.done ? 'text-ink-500 line-through' : 'text-ink-800'}`}>
                            {t.label}
                          </span>
                        </div>
                        <div className={`text-xs mt-0.5 ${t.done ? 'text-ink-400' : 'text-ink-500'}`}>
                          {t.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {launchStatus !== 'launched' && launchStatus !== 'cancelled' && (
                  <button
                    onClick={advanceLaunchStatus}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-ink-900 to-ink-800 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-ink-900/20"
                  >
                    <ChevronRight className="w-4 h-4" />
                    推进到下一阶段 → {launchSteps[launchSteps.findIndex((s) => s.key === launchStatus) + 1]?.label}
                  </button>
                )}

                {launchStatus === 'launched' && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-800">🎉 已全量上线</p>
                    <p className="text-xs text-emerald-600 mt-1">实验成果已落地，持续观察效果中</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={copyReport}
                    className="btn-secondary-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? '已复制' : '复制报告'}
                  </button>
                  <button
                    onClick={() => downloadReport('md')}
                    className="btn-secondary-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载 Markdown
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-ink-100 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-ink-400" />
                </div>
                <p className="text-sm font-medium text-ink-700 mb-1">尚未生成上线清单</p>
                <p className="text-xs text-ink-500 mb-4">先设置胜出版本，再点击「标记为待上线」</p>
                <button
                  onClick={() => {
                    if (!experiment.winnerVariantId && sigResults[0]) {
                      setWinner(sigResults[0].variantId);
                    }
                    if (experiment.winnerVariantId || sigResults[0]) {
                      toggleReady();
                    }
                  }}
                  className="btn-secondary-sm"
                  disabled={sigResults.length === 0}
                >
                  一键生成清单
                </button>
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-ink-900 font-serif mb-4">观察备注时间线</h2>
            <p className="text-xs text-ink-500 mb-5">实验过程中的重要记录和异常事件</p>

            {observations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-ink-300" />
                <p className="text-sm text-ink-400">暂无观察记录</p>
              </div>
            ) : (
              <div className="relative pl-2">
                <div className="absolute left-[15px] top-1 bottom-1 w-px bg-gradient-to-b from-brand-300 via-ink-200 to-ink-100" />
                <div className="space-y-5">
                  {observations.map((obs) => {
                    const meta = obsTypeMeta[obs.type];
                    const Icon = meta.icon;
                    return (
                      <div key={obs.id} className="relative flex gap-4">
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md ${
                          obs.type === 'insight' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' :
                          obs.type === 'anomaly' ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white' :
                          'bg-gradient-to-br from-ink-300 to-ink-500 text-white'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.chip}`}>
                              {meta.label}
                            </span>
                            <span className="text-xs font-medium text-ink-800">{obs.author}</span>
                            <span className="text-[11px] text-ink-400">{formatDateTime(obs.timestamp)}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-ink-200/60 text-sm text-ink-700 leading-relaxed shadow-sm">
                            {obs.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 border-violet-200/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900 mb-1.5">复盘已完成？</h3>
                <p className="text-sm text-ink-600 leading-relaxed mb-4">
                  实验结论将同步至增长知识库，用于指导未来的实验设计与产品决策。
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate('/experiments')}
                    className="btn-secondary-sm"
                  >
                    返回实验列表
                  </button>
                  <button
                    onClick={() => navigate('/experiments/create')}
                    className="text-sm font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1 px-2 py-1"
                  >
                    创建新实验 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass-card w-[720px] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200/70 bg-white/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900">实验复盘报告</h3>
                  <p className="text-xs text-ink-500">一键生成可分享的复盘报告</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div ref={reportRef} className="space-y-6 text-ink-800">
                <div className="text-center pb-6 border-b border-ink-100">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium mb-3">
                    <Trophy className="w-3.5 h-3.5" />
                    A/B 实验复盘报告
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-ink-900 mb-2">
                    {experiment?.name}
                  </h2>
                  <p className="text-sm text-ink-600">{experiment?.goal}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-ink-50 text-center">
                    <div className="text-xs text-ink-500 mb-1">运行时长</div>
                    <div className="font-mono text-lg font-bold text-ink-800">{totalDays} 天</div>
                  </div>
                  <div className="p-3 rounded-xl bg-ink-50 text-center">
                    <div className="text-xs text-ink-500 mb-1">参与人数</div>
                    <div className="font-mono text-lg font-bold text-ink-800">
                      {formatNumber(totalVisitors)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-center">
                    <div className="text-xs text-emerald-600 mb-1">胜出版本</div>
                    <div className="font-semibold text-emerald-800 text-sm truncate">
                      {bestVariant ? (bestVariant as Variant).name : '未定'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-brand-50 border border-emerald-200/60">
                  <h4 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    核心结论
                  </h4>
                  <p className="text-sm text-ink-700 leading-relaxed">
                    {draft.conclusion || '（点击保存并发布，填写复盘结论）'}
                  </p>
                </div>

                {bestVariant && (
                  <div>
                    <h4 className="font-semibold text-ink-900 mb-3">胜出版本详情</h4>
                    <div className="p-4 rounded-xl bg-white border border-ink-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-ink-800">
                          {(bestVariant as Variant).name}
                        </span>
                        <span className="chip bg-emerald-50 text-emerald-700 border border-emerald-200">
                          🏆 胜出
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-[10px] text-ink-400 uppercase">转化率</div>
                          <div className="font-mono text-xl font-bold text-emerald-600">
                            {formatPercent((bestVariant as Variant).conversionRate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-ink-400 uppercase">相对提升</div>
                          <div className="font-mono text-xl font-bold text-emerald-600">
                            +
                            {(sigResults.find((r) => r.variantId === bestVariant.id)?.sig.liftPercent ?? 0).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-ink-400 uppercase">置信度</div>
                          <div className="font-mono text-xl font-bold text-ink-700">
                            {(sigResults.find((r) => r.variantId === bestVariant.id)?.sig.confidence ?? 95).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-ink-900 mb-3">复盘摘要</h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-ink-50/50">
                      <div className="text-xs font-medium text-ink-600 mb-1">胜出原因</div>
                      <div className="text-sm text-ink-700">
                        {draft.winnerReason || '（待填写）'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50/50">
                      <div className="text-xs font-medium text-ink-600 mb-1">经验教训</div>
                      <div className="text-sm text-ink-700">
                        {draft.lessonsLearned || '（待填写）'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-ink-50/50">
                      <div className="text-xs font-medium text-ink-600 mb-1">风险与注意</div>
                      <div className="text-sm text-ink-700">
                        {draft.risks || '（待填写）'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-ink-100 text-center">
                  <p className="text-xs text-ink-400">
                    报告生成时间：{formatDateTime(new Date().toISOString())} · 负责人：
                    {experiment?.createdBy}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-ink-200/70 bg-ink-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-ink-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                支持多种格式导出，便于分享与归档
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyReport}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '复制 Markdown'}
                </button>
                <button
                  onClick={() => downloadReport('md')}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载 .md
                </button>
                <button
                  onClick={() => downloadReport('txt')}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  下载 .txt
                </button>
                <button
                  onClick={exportAsImage}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  <Image className="w-3.5 h-3.5" />
                  导出长图
                </button>
                <button
                  onClick={exportAsPDF}
                  className="btn-primary !py-2 !px-4 text-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  导出 PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
