import { useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useExperimentStore } from '@/store/useExperimentStore';
import {
  formatPercent,
  formatNumber,
  formatDate,
  formatDateTime,
} from '@/utils/format';
import type { ReviewSnapshot, Variant, LaunchStatus } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Trophy,
  CheckCircle2,
  FileText,
  Clock,
  TrendingUp,
  Copy,
  ExternalLink,
  Download,
  Image,
  Share2,
  Check,
  ArrowLeft,
  Zap,
  Shield,
  Rocket,
} from 'lucide-react';

const launchStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待上线', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  developing: { label: '开发中', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Zap },
  testing: { label: '测试中', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Shield },
  launched: { label: '已上线', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-ink-100 text-ink-600 border-ink-200', icon: Clock },
};

const launchSteps = [
  { key: 'pending', label: '待上线' },
  { key: 'developing', label: '开发中' },
  { key: 'testing', label: '测试中' },
  { key: 'launched', label: '已上线' },
];

function decodeSnapshotFromHash(): ReviewSnapshot | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#data=')) return null;
    const encoded = hash.slice(6);
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function ReviewSharePage() {
  const { id = '' } = useParams();
  const { getExperiment, getReview, getLatestSnapshot } = useExperimentStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const snapshot = useMemo(() => {
    const fromUrl = decodeSnapshotFromHash();
    if (fromUrl) return fromUrl;
    return getLatestSnapshot(id) || null;
  }, [id]);

  const experiment = useMemo(() => {
    if (snapshot) return snapshot.experiment;
    return getExperiment(id) || null;
  }, [snapshot, id]);

  const review = useMemo(() => {
    if (snapshot) return snapshot.review;
    const r = getReview(id);
    return r || null;
  }, [snapshot, id]);

  const bestVariant = useMemo(() => {
    if (!experiment) return null;
    if (experiment.winnerVariantId) {
      return experiment.variants.find((v) => v.id === experiment.winnerVariantId);
    }
    if (snapshot?.significance) {
      const sig = snapshot.significance.filter((s) => s.isSignificant);
      if (sig.length > 0) {
        const best = sig.sort((a, b) => b.liftPercent - a.liftPercent)[0];
        return experiment.variants.find((v) => v.id === best.variantId);
      }
    }
    return [...experiment.variants].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  }, [experiment, snapshot]);

  const totalVisitors = experiment?.totalVisitors || 0;
  const totalDays = useMemo(() => {
    if (!experiment) return 0;
    const start = new Date(experiment.startTime).getTime();
    const end = new Date(experiment.endTime || Date.now()).getTime();
    return Math.max(1, Math.floor((end - start) / 86400000));
  }, [experiment]);

  const launchStatus: LaunchStatus = review?.launchStatus || 'pending';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败', e);
    }
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
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
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
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

  if (!experiment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ink-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-ink-400" />
          </div>
          <p className="text-ink-600 mb-2">报告不存在或链接已失效</p>
          <Link to="/experiments" className="text-sm text-brand-600 hover:text-brand-700">
            返回实验列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-white to-brand-50/30">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-ink-100/70">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/experiments"
              className="p-2 rounded-lg text-ink-500 hover:text-ink-700 hover:bg-ink-100/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="text-sm font-medium text-ink-800 flex items-center gap-2">
                实验复盘报告
                {snapshot && (
                  <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full border border-ink-100">
                    v{snapshot.version} 快照 · {formatDateTime(snapshot.createdAt)}
                  </span>
                )}
              </div>
              <div className="text-xs text-ink-500">{experiment.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLink} className="btn-secondary-sm">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? '已复制链接' : '复制链接'}
            </button>
            <button onClick={exportAsImage} className="btn-secondary-sm">
              <Image className="w-3.5 h-3.5" />长图
            </button>
            <button onClick={exportAsPDF} className="btn-primary !py-2 !px-4 text-xs">
              <Download className="w-3.5 h-3.5" />导出 PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div ref={reportRef} className="bg-white rounded-3xl shadow-xl border border-ink-100/70 overflow-hidden">
          <div className="p-10 text-center bg-gradient-to-br from-brand-50 via-emerald-50/50 to-white border-b border-ink-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-brand-700 text-xs font-medium border border-brand-100 mb-4 shadow-sm">
              <Trophy className="w-3.5 h-3.5" />
              A/B 实验复盘报告
              {snapshot && ` · 版本 ${snapshot.version}`}
            </div>
            <h1 className="text-3xl font-serif font-semibold text-ink-900 mb-3">
              {experiment.name}
            </h1>
            <p className="text-ink-600 max-w-2xl mx-auto">{experiment.goal}</p>
          </div>

          <div className="p-10 space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-ink-50 text-center">
                <div className="text-xs text-ink-500 mb-1">运行时长</div>
                <div className="font-mono text-2xl font-bold text-ink-800">{totalDays} 天</div>
              </div>
              <div className="p-4 rounded-2xl bg-ink-50 text-center">
                <div className="text-xs text-ink-500 mb-1">参与人数</div>
                <div className="font-mono text-2xl font-bold text-ink-800">{formatNumber(totalVisitors)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-center">
                <div className="text-xs text-emerald-600 mb-1">胜出版本</div>
                <div className="font-semibold text-emerald-800 text-sm truncate">
                  {bestVariant ? (bestVariant as Variant).name : '未定'}
                </div>
              </div>
            </div>

            {review?.conclusion && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-brand-50 border border-emerald-200/60">
                <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  核心结论
                </h3>
                <p className="text-sm text-ink-700 leading-relaxed">{review.conclusion}</p>
              </div>
            )}

            {bestVariant && (
              <div>
                <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-500" />
                  胜出版本详情
                </h3>
                <div className="p-5 rounded-2xl bg-white border border-ink-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-ink-800 text-lg">{(bestVariant as Variant).name}</span>
                    <span className="chip bg-emerald-50 text-emerald-700 border border-emerald-200">🏆 胜出</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[10px] text-ink-400 uppercase tracking-wide mb-1">转化率</div>
                      <div className="font-mono text-2xl font-bold text-emerald-600">
                        {formatPercent((bestVariant as Variant).conversionRate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-ink-400 uppercase tracking-wide mb-1">相对提升</div>
                      <div className="font-mono text-2xl font-bold text-emerald-600">
                        +{(
                          snapshot?.significance?.find((s) => s.variantId === bestVariant.id)?.liftPercent ?? 0
                        ).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-ink-400 uppercase tracking-wide mb-1">置信度</div>
                      <div className="font-mono text-2xl font-bold text-ink-700">
                        {(
                          snapshot?.significance?.find((s) => s.variantId === bestVariant.id)?.confidence ?? 95
                        ).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {review?.winnerReason && (
                <div className="p-4 rounded-xl bg-ink-50/50">
                  <div className="text-xs font-medium text-ink-600 mb-1">胜出原因</div>
                  <div className="text-sm text-ink-700">{review.winnerReason}</div>
                </div>
              )}
              {review?.lessonsLearned && (
                <div className="p-4 rounded-xl bg-ink-50/50">
                  <div className="text-xs font-medium text-ink-600 mb-1">经验教训</div>
                  <div className="text-sm text-ink-700">{review.lessonsLearned}</div>
                </div>
              )}
              {review?.risks && (
                <div className="p-4 rounded-xl bg-ink-50/50">
                  <div className="text-xs font-medium text-ink-600 mb-1">风险与注意</div>
                  <div className="text-sm text-ink-700">{review.risks}</div>
                </div>
              )}
            </div>

            {review?.isWinnerReadyToLaunch && bestVariant && (
              <div>
                <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-brand-500" />
                  上线进度
                </h3>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-brand-50/50 border border-emerald-200/50">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-medium text-ink-800">{(bestVariant as Variant).name}</span>
                    <span className={`chip border ${launchStatusConfig[launchStatus]?.color}`}>
                      {(() => {
                        const Icon = launchStatusConfig[launchStatus]?.icon || Clock;
                        return <Icon className="w-3 h-3" />;
                      })()}
                      {launchStatusConfig[launchStatus]?.label}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      {launchSteps.map((step, i) => {
                        const currentIdx = launchSteps.findIndex((s) => s.key === launchStatus);
                        const isActive = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                isActive
                                  ? isCurrent
                                    ? 'bg-gradient-to-br from-brand-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110'
                                    : 'bg-emerald-500 text-white'
                                  : 'bg-ink-100 text-ink-400'
                              }`}
                            >
                              {isActive && i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${isActive ? 'text-ink-700' : 'text-ink-400'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-[18px] left-6 right-6 h-0.5 bg-ink-100 -z-0">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all"
                        style={{
                          width: `${(launchSteps.findIndex((s) => s.key === launchStatus) / (launchSteps.length - 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-ink-100 text-center">
              <p className="text-xs text-ink-400">
                报告时间：{snapshot ? formatDateTime(snapshot.createdAt) : formatDateTime(new Date().toISOString())} ·
                负责人：{experiment.createdBy}
                {snapshot && ` · 快照版本 ${snapshot.version}`}
              </p>
              <Link
                to={`/experiments/${experiment.id || id}/review`}
                className="inline-flex items-center gap-1 mt-3 text-xs text-brand-600 hover:text-brand-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                查看完整复盘页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
