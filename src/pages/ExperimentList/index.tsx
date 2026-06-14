import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import StatsOverview from '@/components/business/StatsOverview';
import ExperimentCard from '@/components/business/ExperimentCard';
import { useExperimentStore } from '@/store/useExperimentStore';
import { Filter, ArrowUpDown, Grid3x3, List, Search } from 'lucide-react';
import type { ExperimentStatus } from '@/types';

const statusTabs: { key: ExperimentStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '进行中' },
  { key: 'paused', label: '已暂停' },
  { key: 'completed', label: '已完成' },
  { key: 'draft', label: '草稿' },
];

const sortOptions = [
  { key: 'recent', label: '最近更新' },
  { key: 'visitors', label: '访问量最多' },
  { key: 'progress', label: '进度最快' },
];

const ExperimentList = () => {
  const { experiments } = useExperimentStore();
  const [activeTab, setActiveTab] = useState<ExperimentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

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
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'visitors') {
        const va = a.totalVisitors || a.variants.reduce((s, v) => s + v.visitors, 0);
        const vb = b.totalVisitors || b.variants.reduce((s, v) => s + v.visitors, 0);
        return vb - va;
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
    return sorted;
  }, [experiments, activeTab, sortBy, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="实验中心"
        subtitle="管理所有 A/B 实验，用数据驱动每一次产品迭代"
      />
      <div className="flex-1 px-8 py-6 overflow-y-auto scrollbar-thin">
        <StatsOverview />
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
          <div className="flex items-center gap-3">
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
            <div className="relative group">
              <button className="h-10 px-4 rounded-xl border border-ink-200 bg-white flex items-center gap-2 text-sm text-ink-600 hover:bg-ink-50 transition-all">
                <Filter className="w-4 h-4" />
                <span>筛选</span>
              </button>
            </div>
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

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-ink-500">
            共 <span className="font-semibold text-ink-800">{filtered.length}</span> 个实验
          </p>
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
              <ExperimentCard experiment={exp} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-ink-50 border border-ink-100 flex items-center justify-center mb-4">
              <Filter className="w-9 h-9 text-ink-300" />
            </div>
            <p className="font-display text-lg font-semibold text-ink-700 mb-1">暂无匹配实验</p>
            <p className="text-sm text-ink-500">尝试切换筛选条件或清空搜索词</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperimentList;
