import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, Sun, Moon, Command, Menu } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useStore } from '@/store/useStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';

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

  const iconBtn =
    'p-2 rounded-lg text-stitch-muted hover:bg-stitch-surface-elevated hover:text-stitch-text transition-colors shrink-0';

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-white/90 dark:bg-stitch-bg/90 backdrop-blur-xl border-b border-slate-100 dark:border-stitch-border/20 safe-top">
      <div className="flex flex-col gap-2 px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:min-h-16 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              className={cn(iconBtn, 'lg:hidden')}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-stitch-text truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-stitch-muted line-clamp-1 sm:line-clamp-2 md:line-clamp-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1 md:gap-2 overflow-x-auto max-w-full pb-0.5 sm:pb-0 custom-scrollbar">
          <button
            type="button"
            className={cn(iconBtn, 'md:hidden')}
            aria-label="Buscar"
            onClick={() => onCommandPalette?.()}
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="relative hidden md:block shrink-0" ref={searchRootRef} data-global-search-root>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stitch-muted" />
            <Input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => setSearchMenuOpen(true)}
              placeholder="Buscar… (⌘K)"
              className="pl-10 w-48 lg:w-64 xl:w-72"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 text-xs text-stitch-muted pointer-events-none">
              <Command className="w-3 h-3" />K
            </div>

            {searchMenuOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[80] rounded-lg border border-stitch-border bg-stitch-surface shadow-xl max-h-72 overflow-y-auto min-w-[16rem]">
                {searchResults.map((r, idx) => (
                  <button
                    key={`${r.entity_type}-${r.entity_id}-${idx}`}
                    type="button"
                    onClick={() => pickResult(r)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stitch-surface-elevated border-b border-stitch-border/30 last:border-0"
                  >
                    <div className="font-medium text-stitch-text truncate">{r.label}</div>
                    <div className="text-xs text-stitch-muted truncate">
                      {r.entity_type} · {r.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative shrink-0" data-notifications-root>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(!open);
              }}
              className={cn(iconBtn, 'relative')}
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-stitch-primary-bright rounded-full" />
              )}
            </button>

            {open && (
              <div
                className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-1.5rem))] max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-stitch-border bg-stitch-surface shadow-xl z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-stitch-border">
                  <span className="font-semibold text-stitch-text">Notificaciones</span>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-stitch-primary-bright hover:underline"
                  >
                    Marcar todas leídas
                  </button>
                </div>
                <ul className="divide-y divide-stitch-border/30">
                  {items.length === 0 ? (
                    <li className="px-4 py-6 text-sm text-stitch-muted text-center">Sin notificaciones</li>
                  ) : (
                    items.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 hover:bg-stitch-surface-elevated flex gap-3',
                            n.read && 'opacity-70'
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex-shrink-0 w-2 h-2 rounded-full',
                              n.read ? 'bg-stitch-muted' : 'bg-stitch-primary-bright'
                            )}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-stitch-text">{n.title}</div>
                            <div className="text-xs text-stitch-muted mt-0.5 line-clamp-2">{n.body}</div>
                          </div>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <button type="button" onClick={toggleTheme} className={iconBtn} aria-label="Cambiar tema">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="hidden sm:block h-6 w-px bg-stitch-border/40 shrink-0" />

          <div className="flex items-center gap-2 shrink-0 pl-0.5">
            <Avatar name={`${user?.first_name} ${user?.last_name}`} size="sm" />
            <div className="hidden lg:block min-w-0">
              <div className="text-sm font-medium text-stitch-text truncate max-w-[8rem] xl:max-w-[12rem]">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-stitch-muted capitalize truncate">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Header };
