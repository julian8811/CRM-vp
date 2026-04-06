import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, FileText, Users, Target, ShoppingCart, Package, BarChart3, Bot, Wrench, Settings, UserPlus, DollarSign } from 'lucide-react';

const PAGES = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3, category: 'Main' },
  { id: 'customers', name: 'Clientes', icon: Users, category: 'CRM' },
  { id: 'leads', name: 'Dirige (prospectos)', icon: Target, category: 'CRM' },
  { id: 'pipeline', name: 'Pipeline', icon: DollarSign, category: 'CRM' },
  { id: 'products', name: 'Productos', icon: Package, category: 'Catalog' },
  { id: 'quotations', name: 'Cotizaciones', icon: FileText, category: 'Sales' },
  { id: 'orders', name: 'Pedidos', icon: ShoppingCart, category: 'Sales' },
  { id: 'automations', name: 'Automatizaciones', icon: Settings, category: 'Automation' },
  { id: 'reports', name: 'Reportes', icon: BarChart3, category: 'Analytics' },
  { id: 'ai', name: 'IA Comercial', icon: Bot, category: 'Analytics' },
  { id: 'postsale', name: 'Postventa', icon: Wrench, category: 'Support' },
  { id: 'settings', name: 'Configuración', icon: Settings, category: 'System' },
  { id: 'users', name: 'Usuarios', icon: UserPlus, category: 'System' },
];

export function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredPages = useMemo(() => {
    if (!query) return PAGES;
    const lowerQuery = query.toLowerCase();
    return PAGES.filter(page => 
      page.name.toLowerCase().includes(lowerQuery) ||
      page.category.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const groupedPages = useMemo(() => {
    const groups = {};
    filteredPages.forEach(page => {
      if (!groups[page.category]) {
        groups[page.category] = [];
      }
      groups[page.category].push(page);
    });
    return groups;
  }, [filteredPages]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredPages.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredPages[selectedIndex]) {
      onNavigate(filteredPages[selectedIndex].id);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] sm:pt-[15vh] px-3 sm:px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
        {/* Search Input */}
        <div className="flex flex-shrink-0 items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar página o acción..."
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto py-2 overscroll-contain">
          {Object.keys(groupedPages).length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              No se encontraron resultados
            </div>
          ) : (
            Object.entries(groupedPages).map(([category, pages]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {category}
                </div>
                {pages.map((page) => {
                  const isSelected = globalIndex === selectedIndex;
                  const currentIndex = globalIndex;
                  globalIndex++;
                  
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        onNavigate(page.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <page.icon className="w-5 h-5" />
                      <span className="flex-1 font-medium">{page.name}</span>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">↑↓</kbd>
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">↵</kbd>
            Seleccionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">esc</kbd>
            Cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
