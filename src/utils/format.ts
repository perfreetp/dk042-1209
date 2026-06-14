export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const formatCurrency = (value: number, currency: string = '¥'): string => {
  return `${currency}${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '即将开始';
  if (diffDays === 1) return '1 天';
  return `${diffDays} 天`;
};

export const daysBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

export const daysRemaining = (end: string): number => {
  const now = new Date();
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    draft: '草稿',
    running: '进行中',
    paused: '已暂停',
    completed: '已完成',
    archived: '已归档',
  };
  return map[status] || status;
};

export const getMetricLabel = (type: string): string => {
  const map: Record<string, string> = {
    conversion_rate: '转化率',
    ctr: '点击率',
    dwell_time: '停留时长',
    gmv: 'GMV',
    revenue_per_user: '每用户收入',
  };
  return map[type] || type;
};

export const getFieldLabel = (field: string): string => {
  const map: Record<string, string> = {
    country: '地区',
    device: '设备类型',
    user_type: '用户类型',
    custom: '自定义标签',
  };
  return map[field] || field;
};

export const getOperatorLabel = (op: string): string => {
  const map: Record<string, string> = {
    eq: '等于',
    neq: '不等于',
    in: '包含',
    not_in: '不包含',
    contains: '含有关键词',
  };
  return map[op] || op;
};
