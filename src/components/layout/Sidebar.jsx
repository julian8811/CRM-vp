import { useState } from 'react';
import { 
  LayoutDashboard, Users, UserPlus, GitBranch, Package, 
  FileText, ShoppingCart, Zap, BarChart3, Brain, Headphones, 
  Settings, Shield, ChevronLeft, ChevronRight, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'customers', icon: Users, label: 'Clientes' },
  { key: 'leads', icon: UserPlus, label: 'Leads' },
  { key: 'pipeline', icon: GitBranch, label: 'Embudo' },
  { key: 'products', icon: Package, label: 'Productos' },
  { key: 'quotations', icon: FileText, label: 'Cotizaciones' },
  { key: 'orders', icon: ShoppingCart, label: 'Pedidos' },
  { div: true },
  { key: 'automations', icon: Zap, label: 'Automatizaciones' },
  { key: 'reports', icon: BarChart3, label: 'Reportes' },
  { key: 'ai', icon: Brain, label: 'IA Comercial' },
  { key: 'postsale', icon: Headphones, label: 'Postventa' },
  { div: true },
  { key: 'settings', icon: Settings, label: 'Configuración' },
  { key: 'users', icon: Shield, label: 'Usuarios' },
];

function Sidebar({ currentPage, onNavigate, user, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      'h-screen bg-slate-900 text-slate-400 flex flex-col transition-all duration-300',
      isCollapsed ? 'w-[72px]' : 'w-[260px]'
    )}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold text-white">CRM-VP</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item, idx) => {
          if (item.div) {
            return <div key={idx} className="h-px bg-slate-800 my-3" />;
          }
          
          const Icon = item.icon;
          const isActive = currentPage === item.key;
          
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                isActive 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'hover:bg-slate-800 hover:text-slate-200',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          <Avatar name={`${user?.first_name} ${user?.last_name}`} size="sm" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-800 transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

export { Sidebar };
