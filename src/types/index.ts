export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';

export interface Variant {
  id: string;
  experimentId: string;
  name: string;
  description: string;
  screenshotUrl?: string;
  trafficPercent: number;
  isControl: boolean;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

export type MetricType = 'conversion_rate' | 'ctr' | 'dwell_time' | 'gmv' | 'revenue_per_user';

export interface Metric {
  id: string;
  experimentId: string;
  name: string;
  type: MetricType;
  isPrimary: boolean;
}

export type ConditionField = 'country' | 'device' | 'user_type' | 'custom';
export type ConditionOperator = 'eq' | 'neq' | 'in' | 'not_in' | 'contains';
export type ConditionLogic = 'AND' | 'OR';

export interface AudienceCondition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: string | string[];
  logic: ConditionLogic;
}

export interface Audience {
  id: string;
  name: string;
  description: string;
  estimatedUsers: number;
  conditions: AudienceCondition[];
  createdAt: string;
}

export interface SignificanceResult {
  metricId: string;
  metricName: string;
  controlValue: number;
  variantValue: number;
  liftPercent: number;
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
  confidence: number;
}

export interface Experiment {
  id: string;
  name: string;
  goal: string;
  description: string;
  pageUrl: string;
  status: ExperimentStatus;
  startTime: string;
  endTime: string;
  createdBy: string;
  createdAt: string;
  variants: Variant[];
  metrics: Metric[];
  audienceConditions: AudienceCondition[];
  audienceId?: string;
  winnerVariantId?: string;
  totalVisitors: number;
}

export type ObservationType = 'note' | 'anomaly' | 'insight';

export interface Observation {
  id: string;
  experimentId: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  content: string;
  type: ObservationType;
}

export type LaunchStatus = 'pending' | 'developing' | 'testing' | 'launched' | 'cancelled';

export interface Review {
  id: string;
  experimentId: string;
  conclusion: string;
  winnerReason: string;
  lessonsLearned: string;
  risks: string;
  isPublished: boolean;
  author: string;
  publishedAt?: string;
  isWinnerReadyToLaunch: boolean;
  launchStatus?: LaunchStatus;
  launchUpdatedAt?: string;
}

export interface DailyDataPoint {
  date: string;
  variantId: string;
  visitors: number;
  conversions: number;
  [key: string]: number | string;
}

export interface FunnelStep {
  id: string;
  name: string;
  variantName: string;
  value: number;
}

export interface ReviewSnapshot {
  id: string;
  experimentId: string;
  version: number;
  createdAt: string;
  experiment: {
    name: string;
    goal: string;
    description: string;
    pageUrl: string;
    status: ExperimentStatus;
    startTime: string;
    endTime: string;
    createdBy: string;
    variants: Variant[];
    metrics: Metric[];
    winnerVariantId?: string;
    totalVisitors: number;
  };
  review: {
    conclusion: string;
    winnerReason: string;
    lessonsLearned: string;
    risks: string;
    isPublished: boolean;
    author: string;
    publishedAt?: string;
    isWinnerReadyToLaunch: boolean;
    launchStatus?: LaunchStatus;
    launchUpdatedAt?: string;
  };
  significance: Array<{
    variantId: string;
    variantName: string;
    liftPercent: number;
    confidence: number;
    isSignificant: boolean;
  }>;
}
