import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudienceStore } from '@/store/useAudienceStore';
import type { Audience, AudienceCondition, ConditionField, ConditionOperator, ConditionLogic } from '@/types';
import { formatNumber, formatDate, getFieldLabel, getOperatorLabel } from '@/utils/format';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  ChevronRight,
  Search,
  Globe,
  Monitor,
  UserCheck,
  Tag,
  Filter,
  ArrowRight,
  Sparkles,
  GripVertical,
} from 'lucide-react';

const fieldMeta: Record<ConditionField, { icon: typeof Globe; color: string }> = {
  country: { icon: Globe, color: 'text-sky-600 bg-sky-50' },
  device: { icon: Monitor, color: 'text-violet-600 bg-violet-50' },
  user_type: { icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
  custom: { icon: Tag, color: 'text-amber-600 bg-amber-50' },
};

const fieldOptions: { value: ConditionField; label: string }[] = [
  { value: 'country', label: '地区' },
  { value: 'device', label: '设备类型' },
  { value: 'user_type', label: '用户类型' },
  { value: 'custom', label: '自定义标签' },
];

const operatorOptions: { value: ConditionOperator; label: string }[] = [
  { value: 'eq', label: '等于' },
  { value: 'neq', label: '不等于' },
  { value: 'in', label: '包含任一' },
  { value: 'not_in', label: '不包含' },
  { value: 'contains', label: '含关键词' },
];

const presets = [
  { label: '中国', value: 'CN' },
  { label: '美国', value: 'US' },
  { label: '日本', value: 'JP' },
  { label: '移动端', value: 'mobile' },
  { label: '桌面端', value: 'desktop' },
  { label: '新用户', value: 'new' },
  { label: '老用户', value: 'existing' },
  { label: '高价值', value: 'high_value' },
];

const conditionEditorKey = 'condition_editor';

export default function AudiencePage() {
  const navigate = useNavigate();
  const { audiences, addAudience, deleteAudience, updateAudience } = useAudienceStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    name: string;
    description: string;
    conditions: AudienceCondition[];
  }>({
    name: '',
    description: '',
    conditions: [],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audiences;
    return audiences.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [audiences, search]);

  const totalUsers = useMemo(
    () => audiences.reduce((sum, a) => sum + a.estimatedUsers, 0),
    [audiences],
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft({
      name: '',
      description: '',
      conditions: [],
    });
    setShowModal(true);
  };

  const openEdit = (aud: Audience) => {
    setEditingId(aud.id);
    setDraft({
      name: aud.name,
      description: aud.description,
      conditions: JSON.parse(JSON.stringify(aud.conditions)),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const addCondition = () => {
    const c: AudienceCondition = {
      id: `c_${Date.now()}`,
      field: 'country',
      operator: 'eq',
      value: '',
      logic: draft.conditions.length === 0 ? 'AND' : 'AND',
    };
    setDraft({ ...draft, conditions: [...draft.conditions, c] });
  };

  const updateCondition = (idx: number, patch: Partial<AudienceCondition>) => {
    const arr = [...draft.conditions];
    arr[idx] = { ...arr[idx], ...patch };
    setDraft({ ...draft, conditions: arr });
  };

  const removeCondition = (idx: number) => {
    setDraft({
      ...draft,
      conditions: draft.conditions.filter((_, i) => i !== idx),
    });
  };

  const estimatedFromDraft = useMemo(() => {
    const base = 500000;
    const factor = Math.max(0.05, 1 - draft.conditions.length * 0.22);
    return Math.floor(base * factor);
  }, [draft.conditions.length]);

  const saveDraft = () => {
    if (!draft.name.trim()) return;
    const estimated = estimatedFromDraft;
    if (editingId) {
      updateAudience(editingId, {
        name: draft.name,
        description: draft.description,
        conditions: draft.conditions,
        estimatedUsers: estimated,
      });
    } else {
      addAudience({
        name: draft.name,
        description: draft.description,
        conditions: draft.conditions,
        estimatedUsers: estimated,
      });
    }
    closeModal();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {audiences.length} 个人群 · 覆盖 {formatNumber(totalUsers)} 用户
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-ink-900 tracking-tight font-serif">
            受众管理
          </h1>
          <p className="mt-2 text-ink-500 max-w-xl">
            构建精细化人群分群，用于 A/B 实验定向投放和增长策略。支持多维度条件组合与实时覆盖人数预估。
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建受众
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="text-xs text-ink-500 mb-1">总人群数</div>
          <div className="text-2xl font-semibold text-ink-900 font-mono">{audiences.length}</div>
          <div className="mt-3 h-8 flex items-end gap-1">
            {[30, 45, 38, 60, 52, 70, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-brand-300/50 to-brand-500"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-xs text-ink-500 mb-1">累计覆盖用户</div>
          <div className="text-2xl font-semibold text-ink-900 font-mono">{formatNumber(totalUsers)}</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
            <ArrowRight className="w-3 h-3" />
            <span className="px-2 py-0.5 rounded bg-emerald-50">+12.3% 月环比</span>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-xs text-ink-500 mb-1">活跃实验使用</div>
          <div className="text-2xl font-semibold text-ink-900 font-mono">8</div>
          <div className="mt-3 flex -space-x-2">
            {['bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400'].map((c, i) => (
              <div key={i} className={`w-6 h-6 rounded-full border-2 border-white ${c}`} />
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-white bg-ink-200 text-[10px] text-ink-600 flex items-center justify-center font-medium">
              +4
            </div>
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-brand-50 to-emerald-50 border-emerald-200/50">
          <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            预估覆盖率
          </div>
          <div className="text-2xl font-semibold text-ink-900 font-mono">68.7%</div>
          <div className="mt-3 w-full h-2 rounded-full bg-white/60 overflow-hidden">
            <div className="h-full w-[68.7%] rounded-full bg-gradient-to-r from-brand-500 to-emerald-500" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索人群名称或描述..."
            className="input-base pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-ink-200 text-sm text-ink-600">
          <Filter className="w-4 h-4 text-ink-500" />
          全部维度
          <ChevronRight className="w-3 h-3 text-ink-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((aud) => (
          <div
            key={aud.id}
            className="glass-card p-6 hover:shadow-xl hover:shadow-ink-900/5 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-ink-900">{aud.name}</h3>
                <p className="mt-1 text-sm text-ink-500">{aud.description}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(aud)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-brand-700"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteAudience(aud.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-semibold text-ink-900 font-mono">
                {formatNumber(aud.estimatedUsers)}
              </span>
              <span className="text-sm text-ink-500">预估用户数</span>
            </div>

            {aud.conditions.length === 0 ? (
              <div className="px-4 py-6 rounded-xl bg-ink-50 border border-dashed border-ink-200 text-center text-sm text-ink-500">
                未设置条件 · 全量用户
              </div>
            ) : (
              <div className="space-y-2">
                {aud.conditions.map((c, i) => {
                  const meta = fieldMeta[c.field];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-ink-200/60"
                    >
                      {i > 0 && (
                        <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100">
                          {c.logic}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-sm">
                        <span className="font-medium text-ink-800">{getFieldLabel(c.field)}</span>
                        <span className="text-ink-400 mx-1.5">{getOperatorLabel(c.operator)}</span>
                        <span className="text-ink-600">
                          {Array.isArray(c.value) ? c.value.join(' / ') : c.value || '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-ink-200/60 flex items-center justify-between">
              <span className="text-xs text-ink-400">创建于 {formatDate(aud.createdAt)}</span>
              <button
                onClick={() => navigate('/experiments/create')}
                className="text-sm font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1"
              >
                用于实验
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="lg:col-span-2 glass-card p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-ink-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-ink-400" />
            </div>
            <h3 className="text-lg font-semibold text-ink-800 mb-1">未找到匹配的人群</h3>
            <p className="text-sm text-ink-500 mb-5">尝试调整搜索关键词，或创建一个新的人群分群</p>
            <button onClick={openCreate} className="btn-secondary">
              新建受众
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-ink-900/20 flex flex-col">
            <div className="px-7 py-5 border-b border-ink-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ink-900 font-serif">
                  {editingId ? '编辑受众' : '新建受众'}
                </h2>
                <p className="text-sm text-ink-500 mt-0.5">组合多维度条件，实时估算覆盖人数</p>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-500 hover:bg-ink-100"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="px-7 py-5 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base">人群名称 *</label>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="例如：移动端高价值新用户"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base">简单描述</label>
                  <input
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="一句话说明这个人群的特征"
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label-base mb-0">受众条件</label>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      预估覆盖 <b className="font-mono">{formatNumber(estimatedFromDraft)}</b> 人
                    </div>
                    <button onClick={addCondition} className="text-sm font-medium text-brand-700 flex items-center gap-1 hover:text-brand-800">
                      <Plus className="w-3.5 h-3.5" />
                      添加条件
                    </button>
                  </div>
                </div>

                {draft.conditions.length === 0 ? (
                  <div className="px-6 py-10 rounded-2xl border-2 border-dashed border-ink-200 text-center bg-ink-50/50">
                    <Filter className="w-6 h-6 mx-auto mb-3 text-ink-400" />
                    <p className="text-sm text-ink-500 mb-3">暂未设置条件，默认匹配全部用户</p>
                    <button onClick={addCondition} className="btn-secondary-sm">
                      添加第一个条件
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {draft.conditions.map((c, i) => {
                      const isMulti = c.operator === 'in' || c.operator === 'not_in';
                      return (
                        <div
                          key={c.id}
                          className="flex items-stretch gap-2.5 p-3 rounded-2xl bg-white border border-ink-200/60 shadow-sm"
                        >
                          {i > 0 && (
                            <div className="flex flex-col items-center justify-center pr-1">
                              <GripVertical className="w-3 h-3 text-ink-300" />
                              <select
                                value={c.logic}
                                onChange={(e) =>
                                  updateCondition(i, { logic: e.target.value as ConditionLogic })
                                }
                                className="mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-1 rounded bg-ink-100 text-ink-600 border-0 outline-none cursor-pointer"
                              >
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                              </select>
                            </div>
                          )}
                          <select
                            value={c.field}
                            onChange={(e) =>
                              updateCondition(i, { field: e.target.value as ConditionField })
                            }
                            className="px-3 py-2 rounded-xl bg-ink-50 border border-ink-200 text-sm font-medium text-ink-800 outline-none cursor-pointer"
                          >
                            {fieldOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={c.operator}
                            onChange={(e) =>
                              updateCondition(i, { operator: e.target.value as ConditionOperator })
                            }
                            className="px-3 py-2 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-700 outline-none cursor-pointer"
                          >
                            {operatorOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <div className="flex-1 relative">
                            <input
                              value={Array.isArray(c.value) ? c.value.join(',') : (c.value as string)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const val = isMulti
                                  ? raw.split(',').map((s) => s.trim()).filter(Boolean)
                                  : raw;
                                updateCondition(i, { value: val });
                              }}
                              placeholder={isMulti ? '多个值用逗号分隔，如：CN,US,JP' : '输入值'}
                              className="input-base !py-2"
                            />
                          </div>
                          <button
                            onClick={() => removeCondition(i)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}

                    <div className="pt-3">
                      <div className="text-xs text-ink-500 mb-2">快速添加常用值：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {presets.map((p) => (
                          <button
                            key={p.label}
                            onClick={() => {
                              const exists = draft.conditions.some(
                                (c) =>
                                  (Array.isArray(c.value) && c.value.includes(p.value)) ||
                                  c.value === p.value,
                              );
                              if (exists) return;
                              const map: Record<string, ConditionField> = {
                                CN: 'country',
                                US: 'country',
                                JP: 'country',
                                mobile: 'device',
                                desktop: 'device',
                                new: 'user_type',
                                existing: 'user_type',
                                high_value: 'custom',
                              };
                              setDraft({
                                ...draft,
                                conditions: [
                                  ...draft.conditions,
                                  {
                                    id: `c_${Date.now()}_${Math.random()}`,
                                    field: map[p.value] || 'custom',
                                    operator: 'eq',
                                    value: p.value,
                                    logic: 'AND',
                                  },
                                ],
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs bg-white border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/50 transition-colors"
                          >
                            + {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-7 py-4 border-t border-ink-200 flex items-center justify-between bg-ink-50/40">
              <div className="text-xs text-ink-500">
                * 所有数据本地存储，刷新不丢失
              </div>
              <div className="flex items-center gap-3">
                <button onClick={closeModal} className="btn-ghost">
                  取消
                </button>
                <button
                  onClick={saveDraft}
                  disabled={!draft.name.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? '保存修改' : '创建受众'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
