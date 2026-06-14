import type { Experiment, Variant, Metric, Observation, Review, DailyDataPoint, Audience } from '@/types';

const now = new Date();
const ISO = (offsetDays: number) => {
  const d = new Date(now.getTime() + offsetDays * 86400000);
  return d.toISOString();
};

export const MOCK_VARIANTS: Record<string, Variant[]> = {
  exp_001: [
    {
      id: 'var_001_a',
      experimentId: 'exp_001',
      name: '原始版本 (Control)',
      description: '现有首页布局，按钮为蓝色静态设计',
      screenshotUrl: undefined,
      trafficPercent: 50,
      isControl: true,
      visitors: 48520,
      conversions: 4123,
      conversionRate: 0.08497,
    },
    {
      id: 'var_001_b',
      experimentId: 'exp_001',
      name: '变体 A - 渐变按钮',
      description: 'CTA按钮改为翡翠绿渐变，增加微动画效果',
      screenshotUrl: undefined,
      trafficPercent: 50,
      isControl: false,
      visitors: 48390,
      conversions: 4685,
      conversionRate: 0.09681,
    },
  ],
  exp_002: [
    {
      id: 'var_002_a',
      experimentId: 'exp_002',
      name: '原始版本 (Control)',
      description: '三档定价：基础/专业/企业，标准卡片布局',
      trafficPercent: 40,
      isControl: true,
      visitors: 32180,
      conversions: 1892,
      conversionRate: 0.05879,
    },
    {
      id: 'var_002_b',
      experimentId: 'exp_002',
      name: '变体 A - 对比突出版',
      description: '专业版高亮边框 + "最受欢迎" 标签',
      trafficPercent: 30,
      isControl: false,
      visitors: 24134,
      conversions: 1567,
      conversionRate: 0.06493,
    },
    {
      id: 'var_002_c',
      experimentId: 'exp_002',
      name: '变体 B - 年付推荐',
      description: '默认选中年付选项，显示节省金额',
      trafficPercent: 30,
      isControl: false,
      visitors: 24056,
      conversions: 1783,
      conversionRate: 0.07412,
    },
  ],
  exp_003: [
    {
      id: 'var_003_a',
      experimentId: 'exp_003',
      name: '原始版本 (Control)',
      description: '6步注册流程，单列表单布局',
      trafficPercent: 50,
      isControl: true,
      visitors: 18920,
      conversions: 4213,
      conversionRate: 0.22267,
    },
    {
      id: 'var_003_b',
      experimentId: 'exp_003',
      name: '变体 A - 分步引导',
      description: '进度条 + 步骤标题 + 侧边引导语',
      trafficPercent: 50,
      isControl: false,
      visitors: 18980,
      conversions: 5401,
      conversionRate: 0.28456,
    },
  ],
  exp_004: [
    {
      id: 'var_004_a',
      experimentId: 'exp_004',
      name: '原始版本 (Control)',
      description: '标题"开始使用"，副标题"免费注册"',
      trafficPercent: 50,
      isControl: true,
      visitors: 62400,
      conversions: 7801,
      conversionRate: 0.12502,
    },
    {
      id: 'var_004_b',
      experimentId: 'exp_004',
      name: '变体 A - 利益驱动',
      description: '标题"节省 50% 时间"，副标题"30秒免费开通"',
      trafficPercent: 50,
      isControl: false,
      visitors: 62350,
      conversions: 8943,
      conversionRate: 0.14343,
    },
  ],
  exp_005: [
    {
      id: 'var_005_a',
      experimentId: 'exp_005',
      name: '原始版本 (Control)',
      description: '3列功能卡片，标准排版',
      trafficPercent: 50,
      isControl: true,
      visitors: 21890,
      conversions: 2678,
      conversionRate: 0.12234,
    },
    {
      id: 'var_005_b',
      experimentId: 'exp_005',
      name: '变体 A - 功能图标加大',
      description: '图标放大 1.5x，增加悬停动效',
      trafficPercent: 50,
      isControl: false,
      visitors: 21910,
      conversions: 2812,
      conversionRate: 0.12834,
    },
  ],
  exp_006: [
    {
      id: 'var_006_a',
      experimentId: 'exp_006',
      name: '原始版本 (Control)',
      description: '标准产品推荐算法',
      trafficPercent: 50,
      isControl: true,
      visitors: 89200,
      conversions: 9123,
      conversionRate: 0.10228,
    },
    {
      id: 'var_006_b',
      experimentId: 'exp_006',
      name: '变体 A - 个性化推荐',
      description: '基于用户行为的协同过滤推荐',
      trafficPercent: 50,
      isControl: false,
      visitors: 89230,
      conversions: 10156,
      conversionRate: 0.11382,
    },
  ],
};

export const MOCK_METRICS: Record<string, Metric[]> = {
  exp_001: [
    { id: 'm_001_1', experimentId: 'exp_001', name: 'CTA点击率', type: 'ctr', isPrimary: true },
    { id: 'm_001_2', experimentId: 'exp_001', name: '注册转化率', type: 'conversion_rate', isPrimary: false },
    { id: 'm_001_3', experimentId: 'exp_001', name: '页面停留时长', type: 'dwell_time', isPrimary: false },
  ],
  exp_002: [
    { id: 'm_002_1', experimentId: 'exp_002', name: '付费转化率', type: 'conversion_rate', isPrimary: true },
    { id: 'm_002_2', experimentId: 'exp_002', name: 'GMV', type: 'gmv', isPrimary: true },
    { id: 'm_002_3', experimentId: 'exp_002', name: '每用户收入', type: 'revenue_per_user', isPrimary: false },
  ],
  exp_003: [
    { id: 'm_003_1', experimentId: 'exp_003', name: '完成注册率', type: 'conversion_rate', isPrimary: true },
    { id: 'm_003_2', experimentId: 'exp_003', name: '平均注册时长', type: 'dwell_time', isPrimary: false },
  ],
  exp_004: [
    { id: 'm_004_1', experimentId: 'exp_004', name: '首屏点击率', type: 'ctr', isPrimary: true },
    { id: 'm_004_2', experimentId: 'exp_004', name: '注册转化率', type: 'conversion_rate', isPrimary: true },
  ],
  exp_005: [
    { id: 'm_005_1', experimentId: 'exp_005', name: '功能区点击率', type: 'ctr', isPrimary: true },
  ],
  exp_006: [
    { id: 'm_006_1', experimentId: 'exp_006', name: '购买转化率', type: 'conversion_rate', isPrimary: true },
    { id: 'm_006_2', experimentId: 'exp_006', name: 'GMV', type: 'gmv', isPrimary: true },
  ],
};

export const MOCK_EXPERIMENTS: Experiment[] = [
  {
    id: 'exp_001',
    name: '首页CTA按钮样式改版',
    goal: '提升首页CTA按钮的点击率，从而带动注册转化',
    description: '将原有蓝色静态按钮改为带渐变和微动效的设计，测试用户视觉吸引力和点击意愿的变化',
    pageUrl: '/home',
    status: 'completed',
    startTime: ISO(-30),
    endTime: ISO(-1),
    createdBy: '张明',
    createdAt: ISO(-35),
    variants: MOCK_VARIANTS.exp_001,
    metrics: MOCK_METRICS.exp_001,
    audienceConditions: [
      { id: 'ac1', field: 'device', operator: 'in', value: ['mobile', 'desktop'], logic: 'AND' },
      { id: 'ac2', field: 'user_type', operator: 'eq', value: 'new', logic: 'AND' },
    ],
    winnerVariantId: 'var_001_b',
    totalVisitors: 96910,
  },
  {
    id: 'exp_002',
    name: '定价页三版对比实验',
    goal: '找到最佳定价页设计方案，最大化付费转化率和GMV',
    description: '测试三种定价页布局：标准版、突出专业版、年付默认。同时跟踪ARPU变化',
    pageUrl: '/pricing',
    status: 'running',
    startTime: ISO(-15),
    endTime: ISO(10),
    createdBy: '李婷',
    createdAt: ISO(-20),
    variants: MOCK_VARIANTS.exp_002,
    metrics: MOCK_METRICS.exp_002,
    audienceConditions: [
      { id: 'ac3', field: 'country', operator: 'in', value: ['中国', '美国', '日本'], logic: 'AND' },
    ],
    totalVisitors: 80370,
  },
  {
    id: 'exp_003',
    name: '注册流程分步优化',
    goal: '降低注册流程的流失率，提升最终完成注册的用户数',
    description: '引入进度条引导、分步文案、侧边辅助说明，降低用户心理负担',
    pageUrl: '/signup',
    status: 'completed',
    startTime: ISO(-45),
    endTime: ISO(-20),
    createdBy: '王强',
    createdAt: ISO(-50),
    variants: MOCK_VARIANTS.exp_003,
    metrics: MOCK_METRICS.exp_003,
    audienceConditions: [
      { id: 'ac4', field: 'user_type', operator: 'eq', value: 'new', logic: 'AND' },
    ],
    winnerVariantId: 'var_003_b',
    totalVisitors: 37900,
  },
  {
    id: 'exp_004',
    name: '落地页英雄区文案A/B测试',
    goal: '通过优化Hero区标题和副标题，提升首屏点击率',
    description: '对比"功能导向"和"利益导向"两种文案风格的转化效果差异',
    pageUrl: '/landing/v2',
    status: 'running',
    startTime: ISO(-8),
    endTime: ISO(7),
    createdBy: '张明',
    createdAt: ISO(-10),
    variants: MOCK_VARIANTS.exp_004,
    metrics: MOCK_METRICS.exp_004,
    audienceConditions: [
      { id: 'ac5', field: 'country', operator: 'eq', value: '中国', logic: 'AND' },
      { id: 'ac6', field: 'device', operator: 'eq', value: 'mobile', logic: 'AND' },
    ],
    totalVisitors: 124750,
  },
  {
    id: 'exp_005',
    name: '功能介绍区图标放大测试',
    goal: '验证视觉元素大小对用户注意力分配的影响',
    description: '放大功能卡片图标，配合悬停微动效，测试点击率变化',
    pageUrl: '/features',
    status: 'paused',
    startTime: ISO(-12),
    endTime: ISO(3),
    createdBy: '李婷',
    createdAt: ISO(-14),
    variants: MOCK_VARIANTS.exp_005,
    metrics: MOCK_METRICS.exp_005,
    audienceConditions: [],
    totalVisitors: 43800,
  },
  {
    id: 'exp_006',
    name: '商品推荐算法优化',
    goal: '提升电商场景下的购买转化率和GMV',
    description: '对比原规则推荐算法与新的协同过滤个性化推荐算法',
    pageUrl: '/shop/recommend',
    status: 'draft',
    startTime: ISO(3),
    endTime: ISO(18),
    createdBy: '王强',
    createdAt: ISO(-2),
    variants: MOCK_VARIANTS.exp_006,
    metrics: MOCK_METRICS.exp_006,
    audienceConditions: [
      { id: 'ac7', field: 'user_type', operator: 'neq', value: 'guest', logic: 'AND' },
    ],
    totalVisitors: 178430,
  },
];

export const MOCK_OBSERVATIONS: Observation[] = [
  {
    id: 'obs_001',
    experimentId: 'exp_001',
    author: '张明',
    timestamp: ISO(-28),
    content: '实验上线首日表现正常，变体A点击率略高于对照组+2.1%，但样本量不足，继续观察。',
    type: 'note',
  },
  {
    id: 'obs_002',
    experimentId: 'exp_001',
    author: '数据分析师-李雷',
    timestamp: ISO(-20),
    content: '第10天数据显示：移动端变体A效果显著(+14.3%)，桌面端效果一般(+5.1%)。建议分维度分析。',
    type: 'insight',
  },
  {
    id: 'obs_003',
    experimentId: 'exp_001',
    author: '李婷',
    timestamp: ISO(-10),
    content: '发现iOS Safari上按钮动画有卡顿，已通知前端修复。',
    type: 'anomaly',
  },
  {
    id: 'obs_004',
    experimentId: 'exp_002',
    author: '王强',
    timestamp: ISO(-12),
    content: '变体B（年付推荐）首日ARPU高出18%，但转化率波动较大，需确认是否是时间效应。',
    type: 'note',
  },
  {
    id: 'obs_005',
    experimentId: 'exp_002',
    author: '数据分析师-李雷',
    timestamp: ISO(-6),
    content: '变体B的显著性p-value=0.032<0.05，已达到统计显著，可以提前考虑结束实验。',
    type: 'insight',
  },
  {
    id: 'obs_006',
    experimentId: 'exp_004',
    author: '张明',
    timestamp: ISO(-6),
    content: '落地页变体A在今日头条渠道流量表现异常好，+28% CTR，建议加大投放测试。',
    type: 'insight',
  },
  {
    id: 'obs_007',
    experimentId: 'exp_005',
    author: '王强',
    timestamp: ISO(-6),
    content: '发现变体A在大屏桌面端偶发布局偏移问题，影响用户体验。为避免负面影响，决定暂停实验排查。',
    type: 'anomaly',
  },
  {
    id: 'obs_008',
    experimentId: 'exp_003',
    author: '李婷',
    timestamp: ISO(-38),
    content: '注册流程优化上线，进度条引导效果初显，第2步流失率从18%降至12%。',
    type: 'note',
  },
];

export const MOCK_REVIEWS: Record<string, Review> = {
  exp_001: {
    id: 'rev_001',
    experimentId: 'exp_001',
    conclusion: '变体 A（渐变按钮）在CTR指标上显著优于原始版本，提升幅度达到 +13.9%，置信度 99.2%。移动端效果尤为明显(+17.2%)。推荐全量上线。',
    winnerReason: '渐变配色+微动画提升了按钮的视觉吸引力，与周边元素形成更强对比，用户视觉注意力更快被捕获。移动端用户因屏幕空间有限，视觉强化效果被放大。',
    lessonsLearned: '1. 视觉层级的小改动可以带来显著的转化提升；2. 移动端和桌面端应分开评估效果；3. 动画效果需兼顾性能，避免低端设备卡顿。',
    risks: '1. 上线前需修复iOS Safari动画卡顿问题；2. 新配色可能与即将发布的品牌更新视觉系统不一致，需提前对齐设计团队。',
    isPublished: true,
    author: '张明',
    publishedAt: ISO(0),
    isWinnerReadyToLaunch: true,
  },
  exp_003: {
    id: 'rev_003',
    experimentId: 'exp_003',
    conclusion: '分步引导方案大幅提升了注册完成率，从 22.3% 提升至 28.5%，相对提升 +27.8%，p-value < 0.001，统计高度显著。强力推荐上线。',
    winnerReason: '进度条和分步标题有效降低了用户的心理负担，让用户"看到终点"；侧边文案在关键节点提供帮助信息，减少用户因困惑导致的流失。',
    lessonsLearned: '1. 长流程必须有明确的进度感知；2. 帮助信息应"即需即现"而非前置；3. 表单设计要关注认知负荷，而非仅视觉美观。',
    risks: '1. 分步增加了步骤数，对极不耐烦用户可能有负面影响（该群体占比约3%）；2. 需埋点跟踪每步的停留和回访数据。',
    isPublished: true,
    author: '王强',
    publishedAt: ISO(-18),
    isWinnerReadyToLaunch: true,
  },
};

const genDaily = (startOffset: number, days: number, baseRate: number, boost: number): DailyDataPoint[] => {
  const result: DailyDataPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() + (startOffset + i) * 86400000);
    const noise = (Math.sin(i * 0.6) + Math.random() * 0.4 - 0.2) * 0.012;
    const trend = i * 0.0005;
    const rate = Math.max(0.01, baseRate + boost + noise + trend);
    const visitors = 2000 + Math.floor(Math.random() * 1500);
    const conversions = Math.floor(visitors * rate);
    result.push({
      date: date.toISOString().split('T')[0],
      variantId: '',
      visitors,
      conversions,
      rate,
    });
  }
  return result;
};

export const MOCK_DAILY_DATA: Record<string, DailyDataPoint[]> = {
  'exp_001|var_001_a': genDaily(-30, 30, 0.082, 0),
  'exp_001|var_001_b': genDaily(-30, 30, 0.082, 0.014),
  'exp_002|var_002_a': genDaily(-15, 15, 0.055, 0),
  'exp_002|var_002_b': genDaily(-15, 15, 0.055, 0.008),
  'exp_002|var_002_c': genDaily(-15, 15, 0.055, 0.019),
  'exp_003|var_003_a': genDaily(-45, 25, 0.22, 0),
  'exp_003|var_003_b': genDaily(-45, 25, 0.22, 0.06),
  'exp_004|var_004_a': genDaily(-8, 8, 0.12, 0),
  'exp_004|var_004_b': genDaily(-8, 8, 0.12, 0.022),
};

export const MOCK_AUDIENCES: Audience[] = [
  {
    id: 'aud_001',
    name: '新注册移动用户',
    description: '7天内新注册 + 移动设备访问',
    estimatedUsers: 128500,
    conditions: [
      { id: 'aud_c1', field: 'user_type', operator: 'eq', value: 'new', logic: 'AND' },
      { id: 'aud_c2', field: 'device', operator: 'eq', value: 'mobile', logic: 'AND' },
    ],
    createdAt: ISO(-120),
  },
  {
    id: 'aud_002',
    name: '国内高价值用户',
    description: '中国区 + 历史付费 ≥ ¥99',
    estimatedUsers: 42300,
    conditions: [
      { id: 'aud_c3', field: 'country', operator: 'eq', value: '中国', logic: 'AND' },
      { id: 'aud_c4', field: 'custom', operator: 'contains', value: 'high_value', logic: 'AND' },
    ],
    createdAt: ISO(-90),
  },
  {
    id: 'aud_003',
    name: '沉默召回用户',
    description: '30天未访问但历史活跃',
    estimatedUsers: 89700,
    conditions: [
      { id: 'aud_c5', field: 'user_type', operator: 'eq', value: 'dormant', logic: 'AND' },
      { id: 'aud_c6', field: 'custom', operator: 'contains', value: 'history_active', logic: 'AND' },
    ],
    createdAt: ISO(-60),
  },
  {
    id: 'aud_004',
    name: '北美企业客户',
    description: '美国/加拿大 + 企业邮箱后缀',
    estimatedUsers: 18900,
    conditions: [
      { id: 'aud_c7', field: 'country', operator: 'in', value: ['美国', '加拿大'], logic: 'AND' },
      { id: 'aud_c8', field: 'custom', operator: 'contains', value: 'enterprise_email', logic: 'AND' },
    ],
    createdAt: ISO(-45),
  },
];
