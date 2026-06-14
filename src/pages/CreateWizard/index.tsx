import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import StepIndicator from '@/components/business/StepIndicator';
import { useExperimentStore } from '@/store/useExperimentStore';
import { useAudienceStore } from '@/store/useAudienceStore';
import type { Variant, Metric, AudienceCondition, MetricType, Experiment } from '@/types';
import {
  Info,
  Layers,
  PieChart,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  Target,
  X,
  GripVertical,
  Copy,
  Sparkles,
  FileText,
  Zap,
} from 'lucide-react';

const steps = [
  { id: 0, title: '基本信息', description: '填写实验名称、目标和时间' },
  { id: 1, title: '版本配置', description: '设置原始版本和各变体' },
  { id: 2, title: '流量分配', description: '配置各版本流量比例' },
  { id: 3, title: '受众与指标', description: '选择人群范围和关键指标' },
  { id: 4, title: '确认创建', description: '检查配置并启动实验' },
];

const stepIcons = [Info, Layers, PieChart, Users, CheckCircle2];

const metricOptions: { type: MetricType; name: string; desc: string }[] = [
  { type: 'conversion_rate', name: '转化率', desc: '完成目标动作的用户比例' },
  { type: 'ctr', name: '点击率', desc: '点击目标元素的用户比例' },
  { type: 'dwell_time', name: '停留时长', desc: '用户在页面的平均停留秒数' },
  { type: 'gmv', name: 'GMV', desc: '总成交金额（元）' },
  { type: 'revenue_per_user', name: '每用户收入', desc: '平均每用户贡献收入（元）' },
];

const fieldOptions = [
  { value: 'country', label: '地区' },
  { value: 'device', label: '设备类型' },
  { value: 'user_type', label: '用户类型' },
  { value: 'custom', label: '自定义标签' },
];

const operatorOptions = [
  { value: 'eq', label: '等于' },
  { value: 'neq', label: '不等于' },
  { value: 'in', label: '包含任一' },
  { value: 'not_in', label: '不包含' },
  { value: 'contains', label: '含关键词' },
];

const CreateWizard = () => {
  const navigate = useNavigate();
  const { wizardDraft, setWizardDraft, resetWizardDraft, addExperiment, experiments } = useExperimentStore();
  const { audiences } = useAudienceStore();
  const [currentStep, setCurrentStep] = useState(wizardDraft.currentStep || 0);
  const [previewImage, setPreviewImage] = useState<Record<string, string>>({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleFileUpload = (variantId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage((p) => ({ ...p, [variantId]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const updateVariant = (idx: number, patch: Partial<Variant>) => {
    const newVariants = [...wizardDraft.variants];
    newVariants[idx] = { ...newVariants[idx], ...patch };
    setWizardDraft({ variants: newVariants });
  };

  const addVariant = () => {
    const count = wizardDraft.variants.length;
    const newVar: Variant = {
      id: `variant_${count}_${Date.now()}`,
      experimentId: '',
      name: `变体 ${String.fromCharCode(64 + count)}`,
      description: '',
      trafficPercent: Math.floor(100 / (count + 1)),
      isControl: false,
      visitors: 0,
      conversions: 0,
      conversionRate: 0,
    };
    const basePercent = Math.floor(100 / (count + 1));
    const newVariants = wizardDraft.variants.map((v) => ({ ...v, trafficPercent: basePercent }));
    newVariants.push(newVar);
    const remainder = 100 - basePercent * (count + 1);
    if (remainder > 0) newVariants[0].trafficPercent += remainder;
    setWizardDraft({ variants: newVariants });
  };

  const removeVariant = (idx: number) => {
    if (wizardDraft.variants.length <= 2) return;
    const removed = wizardDraft.variants[idx];
    const newVariants = wizardDraft.variants.filter((_, i) => i !== idx);
    const perExtra = Math.floor(removed.trafficPercent / newVariants.length);
    newVariants.forEach((v, i) => {
      v.trafficPercent += perExtra + (i === 0 ? removed.trafficPercent - perExtra * newVariants.length : 0);
    });
    setWizardDraft({ variants: newVariants });
  };

  const addMetric = () => {
    const m: Metric = {
      id: `m_${Date.now()}`,
      experimentId: '',
      name: '',
      type: 'conversion_rate',
      isPrimary: wizardDraft.metrics.length === 0,
    };
    setWizardDraft({ metrics: [...wizardDraft.metrics, m] });
  };

  const updateMetric = (idx: number, patch: Partial<Metric>) => {
    const arr = [...wizardDraft.metrics];
    arr[idx] = { ...arr[idx], ...patch };
    setWizardDraft({ metrics: arr });
  };

  const removeMetric = (idx: number) => {
    setWizardDraft({ metrics: wizardDraft.metrics.filter((_, i) => i !== idx) });
  };

  const addCondition = () => {
    const c: AudienceCondition = {
      id: `c_${Date.now()}`,
      field: 'country',
      operator: 'eq',
      value: '',
      logic: wizardDraft.audienceConditions.length === 0 ? 'AND' : 'AND',
    };
    setWizardDraft({ audienceConditions: [...wizardDraft.audienceConditions, c] });
  };

  const updateCondition = (idx: number, patch: Partial<AudienceCondition>) => {
    const arr = [...wizardDraft.audienceConditions];
    arr[idx] = { ...arr[idx], ...patch };
    setWizardDraft({ audienceConditions: arr });
  };

  const removeCondition = (idx: number) => {
    setWizardDraft({
      audienceConditions: wizardDraft.audienceConditions.filter((_, i) => i !== idx),
    });
  };

  const applyAudienceTemplate = (audienceId: string) => {
    const aud = audiences.find((a) => a.id === audienceId);
    if (!aud) return;
    setWizardDraft({
      audienceConditions: JSON.parse(JSON.stringify(aud.conditions)),
      audienceId: aud.id,
    });
  };

  const duplicateFromExperiment = (exp: Experiment) => {
    const newVariants = exp.variants.map((v, i) => ({
      ...v,
      id: `variant_${i}_${Date.now()}`,
      experimentId: '',
      visitors: 0,
      conversions: 0,
      conversionRate: 0,
    }));
    const newMetrics = exp.metrics.map((m, i) => ({
      ...m,
      id: `m_${Date.now()}_${i}`,
      experimentId: '',
    }));
    setWizardDraft({
      name: `${exp.name} (副本)`,
      goal: exp.goal,
      description: exp.description,
      pageUrl: exp.pageUrl,
      variants: newVariants,
      metrics: newMetrics,
      audienceConditions: JSON.parse(JSON.stringify(exp.audienceConditions)),
      audienceId: exp.audienceId,
      currentStep: 0,
    });
    setShowTemplateModal(false);
  };

  const applyQuickTemplate = (type: 'pricing' | 'landing' | 'signup' | 'cta') => {
    const templates: Record<string, Partial<typeof wizardDraft>> = {
      pricing: {
        name: '定价页优化实验',
        goal: '测试不同定价方案对付费转化率和GMV的影响',
        description: '对比不同定价展示方式、套餐组合、价格锚点等设计方案',
        pageUrl: '/pricing',
        variants: [
          {
            id: `v0_${Date.now()}`,
            experimentId: '',
            name: '原始版本 (Control)',
            description: '现有定价页三档套餐布局',
            trafficPercent: 34,
            isControl: true,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
          {
            id: `v1_${Date.now()}`,
            experimentId: '',
            name: '变体 A - 突出推荐版',
            description: '中间套餐高亮边框 + "最受欢迎"标签 + 年付默认',
            trafficPercent: 33,
            isControl: false,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
          {
            id: `v2_${Date.now()}`,
            experimentId: '',
            name: '变体 B - 降价测试',
            description: '整体价格下调 15%，测试价格弹性',
            trafficPercent: 33,
            isControl: false,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
        ],
        metrics: [
          {
            id: `m1_${Date.now()}`,
            experimentId: '',
            name: '付费转化率',
            type: 'conversion_rate',
            isPrimary: true,
          },
          {
            id: `m2_${Date.now()}`,
            experimentId: '',
            name: 'GMV',
            type: 'gmv',
            isPrimary: true,
          },
          {
            id: `m3_${Date.now()}`,
            experimentId: '',
            name: '每用户收入',
            type: 'revenue_per_user',
            isPrimary: false,
          },
        ],
      },
      landing: {
        name: '落地页 Hero 区测试',
        goal: '通过优化落地页首屏，提升首屏点击率和最终转化',
        description: '测试不同标题、副标题、主视觉、CTA按钮文案的组合效果',
        pageUrl: '/landing',
        variants: [
          {
            id: `v0_${Date.now()}`,
            experimentId: '',
            name: '原始版本 (Control)',
            description: '功能导向文案 + 产品截图',
            trafficPercent: 50,
            isControl: true,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
          {
            id: `v1_${Date.now()}`,
            experimentId: '',
            name: '变体 A - 利益驱动',
            description: '痛点+解决方案文案 + 结果数据图',
            trafficPercent: 50,
            isControl: false,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
        ],
        metrics: [
          {
            id: `m1_${Date.now()}`,
            experimentId: '',
            name: '首屏点击率',
            type: 'ctr',
            isPrimary: true,
          },
          {
            id: `m2_${Date.now()}`,
            experimentId: '',
            name: '注册转化率',
            type: 'conversion_rate',
            isPrimary: false,
          },
        ],
      },
      signup: {
        name: '注册流程优化实验',
        goal: '降低注册流程流失率，提升最终完成注册的用户数',
        description: '测试注册步骤数量、表单布局、进度指示、社交登录等优化方向',
        pageUrl: '/signup',
        variants: [
          {
            id: `v0_${Date.now()}`,
            experimentId: '',
            name: '原始版本 (Control)',
            description: '5 步注册流程，单列表单',
            trafficPercent: 50,
            isControl: true,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
          {
            id: `v1_${Date.now()}`,
            experimentId: '',
            name: '变体 A - 分步引导',
            description: '进度条 + 分步标题 + 侧边辅助文案',
            trafficPercent: 50,
            isControl: false,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
        ],
        metrics: [
          {
            id: `m1_${Date.now()}`,
            experimentId: '',
            name: '完成注册率',
            type: 'conversion_rate',
            isPrimary: true,
          },
          {
            id: `m2_${Date.now()}`,
            experimentId: '',
            name: '平均注册时长',
            type: 'dwell_time',
            isPrimary: false,
          },
        ],
      },
      cta: {
        name: 'CTA 按钮优化实验',
        goal: '提升关键 CTA 按钮的点击率',
        description: '测试按钮颜色、文案、大小、位置、动效等视觉变量',
        pageUrl: '/home',
        variants: [
          {
            id: `v0_${Date.now()}`,
            experimentId: '',
            name: '原始版本 (Control)',
            description: '蓝色标准按钮，"立即开始"',
            trafficPercent: 50,
            isControl: true,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
          {
            id: `v1_${Date.now()}`,
            experimentId: '',
            name: '变体 A - 渐变按钮',
            description: '翡翠绿渐变 + 微动效 + "免费体验"',
            trafficPercent: 50,
            isControl: false,
            visitors: 0,
            conversions: 0,
            conversionRate: 0,
          },
        ],
        metrics: [
          {
            id: `m1_${Date.now()}`,
            experimentId: '',
            name: 'CTA点击率',
            type: 'ctr',
            isPrimary: true,
          },
        ],
      },
    };
    const tpl = templates[type];
    if (tpl) {
      setWizardDraft({
        ...wizardDraft,
        ...tpl,
        currentStep: 0,
      } as any);
    }
    setShowTemplateModal(false);
  };

  const handleSubmit = () => {
    const id = `exp_${Date.now()}`;
    const newExp = {
      id,
      name: wizardDraft.name || '未命名实验',
      goal: wizardDraft.goal || '未填写目标',
      description: wizardDraft.description,
      pageUrl: wizardDraft.pageUrl || '/',
      status: 'draft' as const,
      startTime: wizardDraft.startTime || new Date().toISOString(),
      endTime: wizardDraft.endTime || new Date(Date.now() + 14 * 86400000).toISOString(),
      createdBy: '当前用户',
      createdAt: new Date().toISOString(),
      variants: wizardDraft.variants.map((v) => ({ ...v, experimentId: id })),
      metrics: wizardDraft.metrics.map((m) => ({ ...m, experimentId: id })),
      audienceConditions: wizardDraft.audienceConditions,
      totalVisitors: 0,
    };
    addExperiment(newExp);
    resetWizardDraft();
    navigate('/experiments');
  };

  const total = wizardDraft.variants.reduce((s, v) => s + v.trafficPercent, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="创建新实验"
        subtitle="5 步创建完整的 A/B 实验配置"
        showCreateButton={false}
      />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0 border-r border-ink-200/70 bg-white/50 p-8 overflow-y-auto scrollbar-thin">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 px-10 py-8 overflow-y-auto scrollbar-thin">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                  {(() => {
                    const Icon = stepIcons[currentStep];
                    return <Icon className="w-5 h-5 text-brand-600" />;
                  })()}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-ink-900">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-sm text-ink-500">{steps[currentStep].description}</p>
                </div>
              </div>

              {currentStep === 0 && (
                <div className="space-y-5 animate-fade-in-up">
                  <div className="glass-card p-5 bg-gradient-to-br from-emerald-50/60 to-brand-50/60 border-emerald-200/50">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ink-900 mb-1">⚡ 快速开始</h3>
                        <p className="text-sm text-ink-600 mb-3">
                          不想从零开始？从已有实验复制配置，或直接使用行业模板，几秒钟就能搭好实验。
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setShowTemplateModal(true)}
                            className="btn-secondary-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            选择模板
                          </button>
                          <button
                            onClick={() => setShowTemplateModal(true)}
                            className="btn-secondary-sm"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            从已有实验复制
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 space-y-5">
                    <div>
                      <label className="label-sm block mb-2">实验名称 *</label>
                      <input
                        className="input-base"
                        placeholder="如：首页CTA按钮样式改版"
                        value={wizardDraft.name}
                        onChange={(e) => setWizardDraft({ name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label-sm block mb-2">实验目标 *</label>
                      <textarea
                        className="input-base min-h-[80px] resize-none"
                        placeholder="希望通过本次实验提升什么指标？"
                        value={wizardDraft.goal}
                        onChange={(e) => setWizardDraft({ goal: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label-sm block mb-2">详细描述</label>
                      <textarea
                        className="input-base min-h-[80px] resize-none"
                        placeholder="补充实验背景、假设、预期效果等"
                        value={wizardDraft.description}
                        onChange={(e) => setWizardDraft({ description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label-sm block mb-2">所属页面 URL</label>
                      <input
                        className="input-base"
                        placeholder="如：/home 或 /pricing"
                        value={wizardDraft.pageUrl}
                        onChange={(e) => setWizardDraft({ pageUrl: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label-sm block mb-2">开始时间</label>
                        <input
                          type="datetime-local"
                          className="input-base"
                          value={wizardDraft.startTime ? wizardDraft.startTime.slice(0, 16) : ''}
                          onChange={(e) => setWizardDraft({ startTime: new Date(e.target.value).toISOString() })}
                        />
                      </div>
                      <div>
                        <label className="label-sm block mb-2">结束时间</label>
                        <input
                          type="datetime-local"
                          className="input-base"
                          value={wizardDraft.endTime ? wizardDraft.endTime.slice(0, 16) : ''}
                          onChange={(e) => setWizardDraft({ endTime: new Date(e.target.value).toISOString() })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-5 animate-fade-in-up">
                  {wizardDraft.variants.map((v, idx) => (
                    <div
                      key={v.id}
                      className={`glass-card p-5 relative transition-all ${
                        v.isControl ? 'ring-2 ring-brand-400/40 ring-offset-2' : ''
                      }`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{
                          background: idx === 0
                            ? 'linear-gradient(to bottom, #64748b, #475569)'
                            : `linear-gradient(to bottom, hsl(${152 + idx * 30}, 70%, 50%), hsl(${152 + idx * 30}, 70%, 40%))`,
                        }}
                      />
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center text-ink-500">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div>
                            {v.isControl && (
                              <span className="chip bg-ink-100 text-ink-600 mb-1">
                                原始版本（对照组）
                              </span>
                            )}
                            {!v.isControl && (
                              <span className="chip bg-brand-50 text-brand-600 mb-1">
                                变体 {String.fromCharCode(65 + idx - 1)}
                              </span>
                            )}
                            <input
                              className="w-full bg-transparent font-semibold text-ink-800 focus:outline-none"
                              value={v.name}
                              onChange={(e) => updateVariant(idx, { name: e.target.value })}
                            />
                          </div>
                        </div>
                        {!v.isControl && wizardDraft.variants.length > 2 && (
                          <button
                            onClick={() => removeVariant(idx)}
                            className="p-2 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-3 space-y-3">
                          <div>
                            <label className="label-sm block mb-1.5">版本说明</label>
                            <textarea
                              className="input-base min-h-[72px] resize-none text-sm"
                              placeholder="描述这个版本与对照组的具体差异..."
                              value={v.description}
                              onChange={(e) => updateVariant(idx, { description: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="label-sm block mb-1.5">页面截图</label>
                          {previewImage[v.id] ? (
                            <div className="relative group rounded-xl overflow-hidden border border-ink-200 aspect-[4/3]">
                              <img
                                src={previewImage[v.id]}
                                alt="screenshot"
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => {
                                  const np = { ...previewImage };
                                  delete np[v.id];
                                  setPreviewImage(np);
                                }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 aspect-[4/3] cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-all text-ink-400 hover:text-brand-500">
                              <Upload className="w-7 h-7 mb-1.5" />
                              <span className="text-xs font-medium">上传截图</span>
                              <span className="text-[10px] mt-0.5">PNG / JPG · 建议 4:3</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  e.target.files?.[0] && handleFileUpload(v.id, e.target.files[0])
                                }
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addVariant}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-ink-200 text-ink-500 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50/30 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加新变体
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5 animate-fade-in-up">
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-display text-lg font-semibold text-ink-900">流量分配</p>
                        <p className="text-xs text-ink-500 mt-0.5">各版本总流量需等于 100%</p>
                      </div>
                      <div
                        className={`chip ${
                          total === 100
                            ? 'bg-brand-50 text-brand-700 border border-brand-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {total === 100 ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        总计 {total}%
                      </div>
                    </div>
                    <div className="h-4 rounded-full flex overflow-hidden shadow-inner bg-ink-100 mb-6">
                      {wizardDraft.variants.map((v, idx) => (
                        <div
                          key={v.id}
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${v.trafficPercent}%`,
                            background:
                              idx === 0
                                ? 'linear-gradient(to right, #64748b, #475569)'
                                : `linear-gradient(to right, hsl(${152 + idx * 30}, 70%, 55%), hsl(${152 + idx * 30}, 70%, 45%))`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="space-y-4">
                      {wizardDraft.variants.map((v, idx) => (
                        <div key={v.id} className="flex items-center gap-4">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              background:
                                idx === 0
                                  ? '#475569'
                                  : `hsl(${152 + idx * 30}, 70%, 50%)`,
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-ink-800 truncate">{v.name}</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  className="w-20 text-right px-3 py-1 rounded-lg bg-ink-50 border border-ink-200 text-sm font-mono text-ink-700 focus:outline-none focus:border-brand-400"
                                  value={v.trafficPercent}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                    updateVariant(idx, { trafficPercent: val });
                                  }}
                                />
                                <span className="text-sm font-mono text-ink-500 w-4">%</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={v.trafficPercent}
                              onChange={(e) =>
                                updateVariant(idx, { trafficPercent: Number(e.target.value) })
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const n = wizardDraft.variants.length;
                        const base = Math.floor(100 / n);
                        const rem = 100 - base * n;
                        setWizardDraft({
                          variants: wizardDraft.variants.map((v, i) => ({
                            ...v,
                            trafficPercent: base + (i === 0 ? rem : 0),
                          })),
                        });
                      }}
                      className="btn-ghost mt-5 w-full"
                    >
                      平均分配流量
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
                          <Users className="w-5 h-5 text-brand-500" />
                          受众条件
                        </p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          设置实验只对特定人群生效，不设置则面向全部用户
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {audiences.length > 0 && (
                          <select
                            className="px-3 py-2 rounded-lg bg-white border border-ink-200 text-sm text-ink-700 outline-none focus:border-brand-400"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) applyAudienceTemplate(e.target.value);
                            }}
                          >
                            <option value="">应用受众模板</option>
                            {audiences.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <button onClick={addCondition} className="btn-secondary !py-2 !px-4 text-xs">
                          <Plus className="w-3.5 h-3.5" />
                          添加条件
                        </button>
                      </div>
                    </div>
                    {wizardDraft.audienceConditions.length === 0 ? (
                      <div className="py-10 text-center rounded-xl border-2 border-dashed border-ink-200 text-ink-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">暂未添加人群条件，实验将对全部用户开放</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {wizardDraft.audienceConditions.map((c, idx) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-ink-50/60 border border-ink-100"
                          >
                            {idx > 0 && (
                              <span className="chip bg-brand-50 text-brand-700 border border-brand-200 flex-shrink-0">
                                {c.logic}
                              </span>
                            )}
                            <select
                              className="px-3 py-2 rounded-lg bg-white border border-ink-200 text-sm text-ink-700 outline-none focus:border-brand-400"
                              value={c.field}
                              onChange={(e) =>
                                updateCondition(idx, { field: e.target.value as any })
                              }
                            >
                              {fieldOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            <select
                              className="px-3 py-2 rounded-lg bg-white border border-ink-200 text-sm text-ink-700 outline-none focus:border-brand-400"
                              value={c.operator}
                              onChange={(e) =>
                                updateCondition(idx, { operator: e.target.value as any })
                              }
                            >
                              {operatorOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            <input
                              className="flex-1 px-3 py-2 rounded-lg bg-white border border-ink-200 text-sm outline-none focus:border-brand-400"
                              placeholder="输入值，多个用逗号分隔"
                              value={typeof c.value === 'string' ? c.value : c.value.join(',')}
                              onChange={(e) => updateCondition(idx, { value: e.target.value })}
                            />
                            <button
                              onClick={() => removeCondition(idx)}
                              className="p-2 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
                          <Target className="w-5 h-5 text-brand-500" />
                          关键指标
                        </p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          至少选择 1 个核心指标作为实验的主要判断依据
                        </p>
                      </div>
                      <button onClick={addMetric} className="btn-secondary !py-2 !px-4 text-xs">
                        <Plus className="w-3.5 h-3.5" />
                        添加指标
                      </button>
                    </div>
                    {wizardDraft.metrics.length === 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {metricOptions.map((opt) => (
                          <button
                            key={opt.type}
                            onClick={() => {
                              setWizardDraft({
                                metrics: [
                                  {
                                    id: `m_${Date.now()}`,
                                    experimentId: '',
                                    name: opt.name,
                                    type: opt.type,
                                    isPrimary: wizardDraft.metrics.length === 0,
                                  },
                                ],
                              });
                            }}
                            className="text-left p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-400 hover:bg-brand-50/30 transition-all group"
                          >
                            <p className="font-medium text-ink-800 group-hover:text-brand-700">
                              {opt.name}
                            </p>
                            <p className="text-[11px] text-ink-500 mt-1">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {wizardDraft.metrics.map((m, idx) => {
                          const meta = metricOptions.find((o) => o.type === m.type);
                          return (
                            <div
                              key={m.id}
                              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                m.isPrimary
                                  ? 'bg-brand-50/40 border-brand-300/50 ring-2 ring-brand-400/20'
                                  : 'bg-white border-ink-200'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  const arr = wizardDraft.metrics.map((x, i) => ({
                                    ...x,
                                    isPrimary: i === idx,
                                  }));
                                  setWizardDraft({ metrics: arr });
                                }}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  m.isPrimary
                                    ? 'bg-brand-500 border-brand-500'
                                    : 'border-ink-300 hover:border-brand-400'
                                }`}
                              >
                                {m.isPrimary && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                {m.isPrimary && (
                                  <span className="chip bg-brand-100 text-brand-700 mb-1 text-[10px]">
                                    核心指标
                                  </span>
                                )}
                                <input
                                  className="w-full bg-transparent font-medium text-ink-800 focus:outline-none"
                                  placeholder="指标名称"
                                  value={m.name}
                                  onChange={(e) => updateMetric(idx, { name: e.target.value })}
                                />
                                <p className="text-[11px] text-ink-500">{meta?.desc}</p>
                              </div>
                              <select
                                className="px-3 py-2 rounded-lg bg-ink-50 border border-ink-200 text-sm outline-none focus:border-brand-400"
                                value={m.type}
                                onChange={(e) =>
                                  updateMetric(idx, { type: e.target.value as MetricType })
                                }
                              >
                                {metricOptions.map((o) => (
                                  <option key={o.type} value={o.type}>
                                    {o.name}
                                  </option>
                                ))}
                              </select>
                              {wizardDraft.metrics.length > 1 && (
                                <button
                                  onClick={() => removeMetric(idx)}
                                  className="p-2 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-5 animate-fade-in-up">
                  <div className="glass-card p-6">
                    <h3 className="font-display text-xl font-semibold text-ink-900 mb-6">
                      📋 实验配置总览
                    </h3>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-ink-50/60">
                        <div>
                          <p className="label-sm mb-1">实验名称</p>
                          <p className="font-medium text-ink-800">{wizardDraft.name || '未填写'}</p>
                        </div>
                        <div>
                          <p className="label-sm mb-1">所属页面</p>
                          <p className="font-mono text-sm text-ink-800">
                            {wizardDraft.pageUrl || '未填写'}
                          </p>
                        </div>
                        <div>
                          <p className="label-sm mb-1">时间范围</p>
                          <p className="text-sm text-ink-700">
                            {wizardDraft.startTime && wizardDraft.endTime
                              ? `${wizardDraft.startTime.slice(0, 10)} ~ ${wizardDraft.endTime.slice(0, 10)}`
                              : '未设置'}
                          </p>
                        </div>
                        <div>
                          <p className="label-sm mb-1">核心指标数</p>
                          <p className="text-sm text-ink-800 font-medium">
                            {wizardDraft.metrics.filter((m) => m.isPrimary).length} 个 / 共{' '}
                            {wizardDraft.metrics.length} 个
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="label-sm mb-3">版本配置</p>
                        <div className="space-y-2">
                          {wizardDraft.variants.map((v, idx) => (
                            <div
                              key={v.id}
                              className="flex items-center gap-4 p-3 rounded-xl bg-white border border-ink-200"
                            >
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0"
                                style={{
                                  background:
                                    idx === 0
                                      ? 'linear-gradient(135deg, #64748b, #475569)'
                                      : `linear-gradient(135deg, hsl(${152 + idx * 30}, 70%, 55%), hsl(${152 + idx * 30}, 70%, 45%))`,
                                }}
                              >
                                {v.isControl ? 'C' : String.fromCharCode(65 + idx - 1)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-ink-800 text-sm">{v.name}</p>
                                <p className="text-xs text-ink-500 truncate">
                                  {v.description || '未添加说明'}
                                </p>
                              </div>
                              <div className="font-mono text-brand-600 font-semibold">
                                {v.trafficPercent}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="label-sm mb-3">目标与指标</p>
                        <p className="text-sm text-ink-700 p-4 rounded-xl bg-ink-50/60 leading-relaxed">
                          {wizardDraft.goal || '未填写实验目标'}
                        </p>
                        {wizardDraft.metrics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {wizardDraft.metrics.map((m) => (
                              <span
                                key={m.id}
                                className={`chip ${
                                  m.isPrimary
                                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                                    : 'bg-ink-100 text-ink-600'
                                }`}
                              >
                                {m.isPrimary && '★ '}
                                {m.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {wizardDraft.audienceConditions.length > 0 && (
                        <div>
                          <p className="label-sm mb-3">受众限定</p>
                          <div className="flex flex-wrap gap-2">
                            {wizardDraft.audienceConditions.map((c, idx) => (
                              <span
                                key={c.id}
                                className="chip bg-sapphire-50 text-sapphire-700 bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {idx > 0 && `${c.logic} `}
                                {fieldOptions.find((f) => f.value === c.field)?.label}:{' '}
                                {typeof c.value === 'string' ? c.value : c.value.join(',')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 border-t border-ink-200/70 bg-white/80 backdrop-blur px-10 py-4 flex items-center justify-between">
            <button
              onClick={() => {
                resetWizardDraft();
                navigate('/experiments');
              }}
              className="btn-ghost"
            >
              取消并返回
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={goPrev}
                disabled={currentStep === 0}
                className="btn-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
              {currentStep < 4 ? (
                <button onClick={goNext} className="btn-primary">
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} className="btn-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  创建实验
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass-card w-[680px] max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200/70">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-900">快速开始</h3>
                <p className="text-sm text-ink-500 mt-0.5">选择模板或从已有实验复制，快速创建新实验</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  行业模板
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      type: 'landing' as const,
                      title: '落地页测试',
                      desc: 'Hero 区、首屏点击率优化',
                      icon: '🎯',
                    },
                    {
                      type: 'pricing' as const,
                      title: '定价页测试',
                      desc: '价格策略、套餐组合优化',
                      icon: '💰',
                    },
                    {
                      type: 'signup' as const,
                      title: '注册流程',
                      desc: '注册转化、流程步骤优化',
                      icon: '📝',
                    },
                    {
                      type: 'cta' as const,
                      title: 'CTA 按钮',
                      desc: '按钮文案、颜色、位置测试',
                      icon: '🔘',
                    },
                  ].map((t) => (
                    <button
                      key={t.type}
                      onClick={() => applyQuickTemplate(t.type)}
                      className="text-left p-4 rounded-xl border border-ink-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
                    >
                      <div className="text-2xl mb-2">{t.icon}</div>
                      <div className="font-medium text-ink-900 group-hover:text-brand-700">
                        {t.title}
                      </div>
                      <div className="text-xs text-ink-500 mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                  <Copy className="w-4 h-4 text-sapphire-500" />
                  从已有实验复制
                </h4>
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
                  {experiments.map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => duplicateFromExperiment(exp)}
                      className="w-full text-left p-3 rounded-xl border border-ink-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-ink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink-900 group-hover:text-brand-700 truncate">
                          {exp.name}
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2">
                          <span>{exp.variants.length} 个版本</span>
                          <span>·</span>
                          <span>{exp.metrics.length} 个指标</span>
                          <span>·</span>
                          <span>{exp.owner}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-brand-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {audiences.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    受众模板
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {audiences.map((aud) => (
                      <button
                        key={aud.id}
                        onClick={() => {
                          applyAudienceTemplate(aud.id);
                          setShowTemplateModal(false);
                        }}
                        className="px-3 py-2 rounded-lg border border-ink-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-sm text-ink-700"
                      >
                        {aud.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-ink-200/70 bg-ink-50/50 flex justify-end">
              <button onClick={() => setShowTemplateModal(false)} className="btn-secondary">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateWizard;
