import { useState } from 'react';
import { 
  LayoutDashboard, Users, UserPlus, GitBranch, Package, 
  FileText, ShoppingCart, Zap, BarChart3, Brain, Headphones, 
  Settings, Shield, ChevronLeft, ChevronRight, LogOut, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { CrmLogo } from '@/components/brand/CrmLogo';

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'customers', icon: Users, label: 'Clientes' },
  { key: 'leads', icon: UserPlus, label: 'Dirige' },
  { key: 'pipeline', icon: GitBranch, label: 'Embudo' },
  { key: 'products', icon: Package, label: 'Productos' },
  { key: 'quotations', icon: FileText, label: 'Cotizaciones' },
  { key: 'orders', icon: ShoppingCart, label: 'Pedidos' },
  { div: true },
  { key: 'automations', icon: Zap, label: 'Automatizaciones' },
  { key: 'meta', icon: Zap, label: 'Meta' },
  { key: 'reports', icon: BarChart3, label: 'Reportes' },
  { key: 'ai', icon: Brain, label: 'IA Comercial' },
  { key: 'postsale', icon: Headphones, label: 'Postventa' },
  { div: true },
  { key: 'settings', icon: Settings, label: 'Configuración' },
  { key: 'users', icon: Shield, label: 'Usuarios' },
];

function Sidebar({ currentPage, onNavigate, user, onLogout, mobileOpen, onCloseMobile }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNav = (key) => {
    onNavigate(key);
    onCloseMobile?.();
  };

  return (
    <aside
      className={cn(
        'h-dvh flex-shrink-0 flex flex-col transition-[transform,width] duration-300 ease-out safe-top',
        'bg-stitch-bg border-r border-stitch-border/20 text-stitch-muted',
        'fixed inset-y-0 left-0 z-40 w-[min(280px,88vw)] lg:relative lg:z-auto lg:w-[260px]',
        isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'
      )}
    >
      <div className={cn('p-3 sm:p-4 border-b border-stitch-border/10 flex items-center justify-between gap-2', isCollapsed && 'lg:justify-center')}>
        <div className="min-w-0 flex-1">
          {isCollapsed ? (
            <img src="/assets/stitch/logo.svg" alt="CRM-VP" className="w-9 h-9 hidden lg:block" />
          ) : (
            <>
              <CrmLogo size="sm" className="lg:hidden min-w-0" />
              <CrmLogo size="md" className="hidden lg:flex min-w-0" />
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 rounded-lg hover:bg-stitch-surface-elevated text-stitch-muted shrink-0"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item, idx) => {
          if (item.div) {
            return <div key={idx} className="h-px bg-stitch-border/20 my-3 mx-2" />;
          }
          
          const Icon = item.icon;
          const isActive = currentPage === item.key;
          
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium',
                isActive 
                  ? 'stitch-nav-active text-stitch-primary' 
                  : 'hover:bg-stitch-surface-elevated hover:text-stitch-text',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-stitch-primary-bright')} />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && !isCollapsed && (
                <span className="ml-auto w-1 h-5 rounded-full bg-stitch-primary-bright" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-stitch-border/10">
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          <Avatar name={`${user?.first_name} ${user?.last_name}`} size="sm" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stitch-text truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-stitch-muted capitalize">{user?.role}</div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-stitch-surface-elevated text-stitch-muted hover:text-stitch-danger transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'hidden lg:flex w-full mt-3 items-center justify-center gap-2 py-2 rounded-lg text-sm text-stitch-muted hover:bg-stitch-surface-elevated transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Colapsar</span></>}
        </button>
      </div>
    </aside>
  );
}

export { Sidebar };
