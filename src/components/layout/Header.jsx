import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, Sun, Moon, Command, Menu } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useStore } from '@/store/useStore';
import { isSupabaseConfigured } from '@/lib/supabase';

function entityTypeToPage(entityType) {
  const m = {
    customer: 'customers',
    lead: 'leads',
    order: 'orders',
    quotation: 'quotations',
  };
  return m[entityType] || 'dashboard';
}

function Header({ user, title, subtitle, onNavigate, onCommandPalette, onOpenMobileNav }) {
  const { theme, toggleTheme } = useTheme();
  const { items, unreadCount, open, setOpen, markRead, markAllRead } = useNotifications();
  const searchCrm = useStore((s) => s.searchCrm);

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);
  const debounceRef = useRef(null);
  const searchRootRef = useRef(null);

  const runSearch = useCallback(
    async (q) => {
      if (!isSupabaseConfigured() || !q.trim()) {
        setSearchResults([]);
        return;
      }
      const rows = await searchCrm(q.trim());
      setSearchResults(Array.isArray(rows) ? rows : []);
    },
    [searchCrm]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onCommandPalette?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommandPalette]);

  useEffect(() => {
    if (!searchMenuOpen) return;
    const down = (e) => {
      if (searchRootRef.current && !searchRootRef.current.contains(e.target)) {
        setSearchMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [searchMenuOpen]);

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v), 280);
    setSearchMenuOpen(true);
  };

  const pickResult = (r) => {
    onNavigate?.(entityTypeToPage(r.entity_type));
    setSearchMenuOpen(false);
    setSearchValue('');
    setSearchResults([]);
  };

  return (
    <header className="relative z-30 min-h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 sm:px-6 py-2 sm:py-0 sm:h-16">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden flex-shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1 sm:truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-4">
        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Buscar"
          onClick={() => onCommandPalette?.()}
        >
          <Search className="h-5 w-5" />
        </button>
        <div className="relative hidden md:block" ref={searchRootRef} data-global-search-root>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => setSearchMenuOpen(true)}
            placeholder="Buscar clientes, leads, pedidos… (⌘K)"
            className="pl-10 w-72 bg-slate-50 dark:bg-slate-900 border-0"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-400 pointer-events-none">
            <Command className="w-3 h-3" />K
          </div>

          {searchMenuOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-[80] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl max-h-72 overflow-y-auto">
              {searchResults.map((r, idx) => (
                <button
                  key={`${r.entity_type}-${r.entity_id}-${idx}`}
                  type="button"
                  onClick={() => pickResult(r)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <div className="font-medium text-slate-900 dark:text-white">{r.label}</div>
                  <div className="text-xs text-slate-500">
                    {r.entity_type} · {r.subtitle}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" data-notifications-root>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 relative"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[8px] h-2 px-0.5 bg-red-500 rounded-full text-[10px] leading-none text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-1.5rem))] max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white">Notificaciones</span>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Marcar todas leídas
                </button>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-slate-500 text-center">Sin notificaciones</li>
                ) : (
                  items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex gap-3 ${n.read ? 'opacity-70' : ''}`}
                      >
                        <span
                          className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${n.read ? 'bg-slate-300' : 'bg-blue-500'}`}
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{n.body}</div>
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-3">
          <Avatar name={`${user?.first_name} ${user?.last_name}`} size="sm" />
          <div className="hidden md:block">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Header };
