import { NavLink, useLocation } from 'react-router-dom';
import {
  FlaskConical,
  PlusCircle,
  BarChart3,
  UsersRound,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  TestTube,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/experiments', label: '实验列表', icon: FlaskConical },
  { to: '/experiments/create', label: '创建实验', icon: PlusCircle },
  { to: '/audiences', label: '受众管理', icon: UsersRound },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/experiments') {
      return (
        location.pathname === '/' ||
        location.pathname.startsWith('/experiments') ||
        location.pathname.startsWith('/experiments/')
      );
    }
    return location.pathname.startsWith(to);
  };

  return (
    <aside
      className={`relative h-screen flex flex-col bg-gradient-to-b from-brand-deep via-brand-950 to-[#051f1f] text-ink-100 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      <div className="absolute inset-0 opacity-20 grain-overlay pointer-events-none" />
      <div className="relative flex-1 flex flex-col p-4 overflow-y-auto scrollbar-thin">
        <div className={`flex items-center gap-3 mb-10 ${collapsed ? 'justify-center' : 'px-2'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow-emerald flex-shrink-0">
            <TestTube className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap">
                ExperimentLab
              </span>
              <span className="text-[11px] text-ink-400 whitespace-nowrap">A/B 实验平台</span>
            </div>
          )}
        </div>
        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-ink-300 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-400 shadow-glow-emerald" />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-300' : ''}`} />
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              </NavLink>
            );
          })}
        </nav>
        {!collapsed && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="label-sm text-ink-500 px-3 mb-3 !text-ink-500">最近访问</p>
            <div className="space-y-1">
              <NavLink
                to="/experiments/exp_002/dashboard"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-ink-300 hover:bg-white/5 hover:text-white transition-all truncate"
              >
                <BarChart3 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                <span className="truncate">定价页实验看板</span>
              </NavLink>
              <NavLink
                to="/experiments/exp_001/review"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-ink-300 hover:bg-white/5 hover:text-white transition-all truncate"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                <span className="truncate">CTA按钮复盘</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>
      <div className="relative p-3 border-t border-white/5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-ink-400 hover:bg-white/5 hover:text-white transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>收起侧栏</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
