import { Search, Bell, ChevronDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showCreateButton?: boolean;
}

const Header = ({ title, subtitle, showCreateButton = true }: HeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-ink-200/70">
      <div className="px-8 py-4 flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink-900 tracking-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-ink-500 mt-0.5 text-balance">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`relative transition-all duration-300 ${
              searchOpen ? 'w-72' : 'w-11'
            }`}
          >
            <div
              className={`flex items-center h-11 rounded-full border border-ink-200 bg-white overflow-hidden transition-all duration-300 ${
                searchOpen ? 'shadow-sm border-brand-300 ring-4 ring-brand-500/10' : ''
              }`}
            >
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-11 h-11 flex items-center justify-center text-ink-500 hover:text-ink-800 flex-shrink-0"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
              <input
                type="text"
                placeholder="搜索实验名称、页面..."
                className={`flex-1 h-full bg-transparent outline-none text-sm pr-4 transition-all duration-300 ${
                  searchOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                }`}
              />
            </div>
          </div>
          <button className="relative w-11 h-11 rounded-full border border-ink-200 bg-white flex items-center justify-center text-ink-600 hover:bg-ink-50 hover:border-ink-300 transition-all">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          {showCreateButton && (
            <Link to="/experiments/create" className="btn-primary">
              <Plus className="w-4 h-4" />
              创建实验
            </Link>
          )}
          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-ink-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-soft">
              ZM
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-medium text-ink-800 leading-tight">张明</span>
              <span className="text-[11px] text-ink-500 leading-tight">增长团队</span>
            </div>
            <ChevronDown className="w-4 h-4 text-ink-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
