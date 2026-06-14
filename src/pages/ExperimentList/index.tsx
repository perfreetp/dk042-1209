import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import StatsOverview from '@/components/business/StatsOverview';
import ExperimentCard from '@/components/business/ExperimentCard';
import { useExperimentStore } from '@/store/useExperimentStore';
import { useAudienceStore } from '@/store/useAudienceStore';
import type { ExperimentStatus, MetricType } from '@/types';
import {
  Filter,
  ArrowUpDown,
  Grid3x3,
  List,
  Search,
  X,
  CheckSquare,
  Square,
  Download,
  Archive,
  Pause,
  Play,
  ChevronDown,
  CalendarDays,
  Users,
  Target,
  TrendingUp,
  Layers,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  FileText,
  User,
} from 'lucide-react';

const statusTabs: { key: ExperimentStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '进行中' },
  { key: 'paused', label: '已暂停' },
  { key: 'completed', label: '已完成' },
  { key: 'draft', label: '草稿' },
  { key: 'archived', label: '已归档' },
];

const sortOptions = [
  { key: 'recent', label: '最近更新' },
  { key: 'visitors', label: '访问量最多' },
  { key: 'progress', label: '进度最快' },
  { key: 'name', label: '名称 A-Z' },
];

const metricTypeOptions: { value: MetricType | 'all'; label: string }[] = [
  { value: 'all', label: '全部指标' },
  { value: 'conversion_rate', label: '转化率' },
  { value: 'ctr', label: '点击率' },
  { value: 'dwell_time', label: '停留时长' },
  { value: 'gmv', label: 'GMV' },
  { value: 'revenue_per_user', label: '每用户收入' },
];

const ownerOptions = ['全部负责人', '张明', '李婷', '王强', '数据分析师-李雷'];

const ExperimentList = () => {
  const { experiments, updateExperimentStatus } = useExperimentStore();
  const { audiences } = useAudienceStore();
  const [activeTab, setActiveTab] = useState<ExperimentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    owner: '全部',
    metricType: 'all' as MetricType | 'all',
    audienceId: 'all' as string,
    dateRange: 'all' as 'all' | '7d' | '30d' | '90d',
    hasWinner: 'all' as 'all' | 'yes' | 'no',
  });

  const allOwners = useMemo(() => {
    const set = new Set(experiments.map((e) => e.createdBy));
    return ['全部', ...Array.from(set)];
  }, [experiments]);

  const filtered = useMemo(() => {
    let list = experiments;
    if (activeTab !== 'all') {
      list = list.filter((e) => e.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.goal.toLowerCase().includes(q) ||
          e.pageUrl.toLowerCase().includes(q),
      );
    }
    if (filters.owner && filters.owner !== '全部') {
      list = list.filter((e) => e.createdBy === filters.owner);
    }
    if (filters.metricType && filters.metricType !== 'all') {
      list = list.filter((e) => e.metrics.some((m) => m.type === filters.metricType));
    }
    if (filters.audienceId && filters.audienceId !== 'all') {
      list = list.filter((e) => e.audienceId === filters.audienceId);
    }
    if (filters.dateRange && filters.dateRange !== 'all') {
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const threshold = Date.now() - daysMap[filters.dateRange] * 86400000;
      list = list.filter((e) => new Date(e.startTime).getTime() >= threshold);
    }
    if (filters.hasWinner && filters.hasWinner !== 'all') {
      list = list.filter((e) =>
        filters.hasWinner === 'yes' ? !!e.winnerVariantId : !e.winnerVariantId,
      );
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'visitors') {
        const va = a.totalVisitors || a.variants.reduce((s, v) => s + v.visitors, 0);
        const vb = b.totalVisitors || b.variants.reduce((s, v) => s + v.visitors, 0);
        return vb - va;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      if (sortBy === 'progress') {
        const pa = (() => {
          const total = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 86400000;
          const passed = Math.max(0, Math.min(total, (Date.now() - new Date(b.startTime).getTime()) / 86400000));
          return total > 0 ? passed / total : 0;
        })();
        const pb = (() => {
          const total = (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 86400000;
          const passed = Math.max(0, Math.min(total, (Date.now() - new Date(a.startTime).getTime()) / 86400000));
          return total > 0 ? passed / total : 0;
        })();
        return pb - pa;
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
    return sorted;
  }, [experiments, activeTab, sortBy, searchQuery, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.owner && filters.owner !== '全部') count++;
    if (filters.metricType && filters.metricType !== 'all') count++;
    if (filters.audienceId && filters.audienceId !== 'all') count++;
    if (filters.dateRange && filters.dateRange !== 'all') count++;
    if (filters.hasWinner && filters.hasWinner !== 'all') count++;
    return count;
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      owner: '全部',
      metricType: 'all',
      audienceId: 'all',
      dateRange: 'all',
      hasWinner: 'all',
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((e) => e.id));
    }
  };

  const handleSelectChange = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  const batchPause = () => {
    selectedIds.forEach((id) => updateExperimentStatus(id, 'paused'));
    setSelectedIds([]);
  };

  const batchResume = () => {
    selectedIds.forEach((id) => updateExperimentStatus(id, 'running'));
  };

  const batchArchive = () => {
    selectedIds.forEach((id) => updateExperimentStatus(id, 'archived'));
    setSelectedIds([]);
  };

  const batchExport = () => {
    const data = filtered
      .filter((e) => selectedIds.includes(e.id))
      .map((e) => ({
        name: e.name,
        goal: e.goal,
        status: e.status,
        variants: e.variants.length,
        visitors: e.variants.reduce((s, v) => s + v.visitors, 0),
        winner: e.winnerVariantId
          ? e.variants.find((v) => v.id === e.winnerVariantId)?.name || ''
          : '',
        startTime: e.startTime,
        endTime: e.endTime,
        owner: e.createdBy,
      }));
    const header = [
      '实验名称',
      '实验目标',
      '状态',
      '版本数',
      '访问人数',
      '胜出版本',
      '开始时间',
      '结束时间',
      '负责人',
    ].join(',');
    const rows = data.map((row) =>
      [
        `"${row.name}"`,
        `"${row.goal}"`,
        row.status,
        row.variants,
        row.visitors,
        `"${row.winner}"`,
        row.startTime,
        row.endTime,
        `"${row.owner}"`,
      ].join(','),
    );
    const csv = header + '\n' + rows.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `实验批量导出_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canPause = selectedIds.some((id) => {
    const exp = experiments.find((e) => e.id === id);
    return exp && exp.status === 'running';
  });
  const canResume = selectedIds.some((id) => {
    const exp = experiments.find((e) => e.id === id);
    return exp && exp.status === 'paused';
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="实验中心"
        subtitle="管理所有 A/B 实验，用数据驱动每一次产品迭代"
      />
      <div className="flex-1 px-8 py-6 overflow-y-auto scrollbar-thin">
        <StatsOverview />

        {selectMode && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-200/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-ink-700"
              >
                {selectedIds.length === filtered.length && filtered.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-brand-600" />
                ) : (
                  <Square className="w-5 h-5 text-ink-400" />
                )}
                <span>
                  已选 <span className="font-bold text-brand-700">{selectedIds.length}</span> / {filtered.length} 个实验
                </span>
              </button>
              <div className="h-5 w-px bg-brand-200" />
              <span className="text-xs text-ink-500">
                批量操作：
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canPause && (
                <button onClick={batchPause} className="btn-secondary-sm">
                  <Pause className="w-3.5 h-3.5" />
                  批量暂停
                </button>
              )}
              {canResume && (
                <button onClick={batchResume} className="btn-secondary-sm">
                  <Play className="w-3.5 h-3.5" />
                  批量恢复
                </button>
              )}
              <button onClick={batchArchive} className="btn-secondary-sm">
                <Archive className="w-3.5 h-3.5" />
                批量归档
              </button>
              <button onClick={batchExport} className="btn-secondary-sm">
                <Download className="w-3.5 h-3.5" />
                导出 CSV
              </button>
              <button
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds([]);
                }}
                className="text-sm text-ink-500 hover:text-ink-700 ml-2"
              >
                <X className="w-4 h-4 inline mr-1" />
                取消选择
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white border border-ink-200/70 shadow-card w-fit">
            {statusTabs.map((tab) => {
              const count =
                tab.key === 'all'
                  ? experiments.length
                  : experiments.filter((e) => e.status === tab.key).length;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft'
                      : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center text-[11px] rounded-full px-1.5 py-0.5 ${
                      active ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="flex items-center h-10 rounded-xl border border-ink-200 bg-white overflow-hidden">
                <div className="w-10 h-10 flex items-center justify-center text-ink-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text"
                  placeholder="搜索实验..."
                  className="h-full bg-transparent outline-none text-sm pr-4 w-56"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-4 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>高级筛选</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectMode(!selectMode)}
              className={`h-10 px-4 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                selectMode
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>批量选择</span>
            </button>
            <div className="flex items-center gap-1 p-1 rounded-xl border border-ink-200 bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 h-10 px-4 rounded-xl border border-ink-200 bg-white">
              <ArrowUpDown className="w-4 h-4 text-ink-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm text-ink-600 outline-none pr-4 appearance-none cursor-pointer"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-5 rounded-2xl bg-white border border-ink-200/70 shadow-card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-2">
                <User className="w-3.5 h-3.5 text-ink-400" />
                负责人
              </label>
              <select
                value={filters.owner}
                onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
                className="input-base !py-2 text-sm"
              >
                {allOwners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-2">
                <Target className="w-3.5 h-3.5 text-ink-400" />
                指标类型
              </label>
              <select
                value={filters.metricType}
                onChange={(e) =>
                  setFilters({ ...filters, metricType: e.target.value as MetricType | 'all' })
                }
                className="input-base !py-2 text-sm"
              >
                {metricTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-2">
                <Users className="w-3.5 h-3.5 text-ink-400" />
                关联受众
              </label>
              <select
                value={filters.audienceId}
                onChange={(e) => setFilters({ ...filters, audienceId: e.target.value })}
                className="input-base !py-2 text-sm"
              >
                <option value="all">全部受众</option>
                {audiences.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-2">
                <CalendarDays className="w-3.5 h-3.5 text-ink-400" />
                时间范围
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value as any })
                }
                className="input-base !py-2 text-sm"
              >
                <option value="all">全部时间</option>
                <option value="7d">最近 7 天</option>
                <option value="30d">最近 30 天</option>
                <option value="90d">最近 90 天</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-ink-400" />
                胜出状态
              </label>
              <div className="flex items-center justify-between">
                <select
                  value={filters.hasWinner}
                  onChange={(e) =>
                    setFilters({ ...filters, hasWinner: e.target.value as any })
                  }
                  className="input-base !py-2 text-sm"
                >
                  <option value="all">全部</option>
                  <option value="yes">已有胜出版本</option>
                  <option value="no">暂无胜出</option>
                </select>
              </div>
            </div>
            <div className="col-span-2 md:col-span-3 lg:col-span-5 flex items-center justify-between pt-2 border-t border-ink-100">
              <span className="text-xs text-ink-400">
                筛选结果：共 <b className="text-ink-700">{filtered.length}</b> 个实验
              </span>
              <button
                onClick={resetFilters}
                className="text-xs text-ink-500 hover:text-ink-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                重置筛选条件
              </button>
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-ink-500">
            共 <span className="font-semibold text-ink-800">{filtered.length}</span> 个实验
          </p>
          {selectMode && (
            <button
              onClick={toggleSelectAll}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              {selectedIds.length === filtered.length && filtered.length > 0
                ? '取消全选'
                : '全选当前页'}
            </button>
          )}
        </div>

        <div
          className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
              : 'space-y-4'
          }`}
        >
          {filtered.map((exp, idx) => (
            <div key={exp.id} style={{ animationDelay: `${idx * 40}ms` }}>
              <ExperimentCard
                experiment={exp}
                selectable={selectMode}
                selected={selectedIds.includes(exp.id)}
                onSelectChange={handleSelectChange}
              />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-ink-50 border border-ink-100 flex items-center justify-center mb-4">
              <Filter className="w-9 h-9 text-ink-300" />
            </div>
            <p className="font-display text-lg font-semibold text-ink-700 mb-1">暂无匹配实验</p>
            <p className="text-sm text-ink-500">
              尝试切换筛选条件或清空搜索词
            </p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="btn-secondary mt-4">
                重置筛选条件
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperimentList;
