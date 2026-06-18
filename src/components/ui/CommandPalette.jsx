import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowRight, FileText, Users, Target, ShoppingCart, Package, BarChart3, Bot, Wrench, Settings, UserPlus, DollarSign } from 'lucide-react';

const PAGES = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3, category: 'Main' },
  { id: 'customers', name: 'Clientes', icon: Users, category: 'CRM' },
  { id: 'leads', name: 'Leads', icon: Target, category: 'CRM' },
  { id: 'pipeline', name: 'Pipeline', icon: DollarSign, category: 'CRM' },
  { id: 'products', name: 'Productos', icon: Package, category: 'Catalog' },
  { id: 'quotations', name: 'Cotizaciones', icon: FileText, category: 'Sales' },
  { id: 'orders', name: 'Pedidos', icon: ShoppingCart, category: 'Sales' },
  { id: 'automations', name: 'Automatizaciones', icon: Settings, category: 'Automation' },
  { id: 'meta', name: 'Meta', icon: Settings, category: 'Integrations' },
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[max(1rem,env(safe-area-inset-top))] sm:pt-[15vh] px-3 sm:px-4 safe-bottom">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-xl bg-stitch-surface rounded-xl shadow-2xl overflow-hidden border border-stitch-border max-h-[min(85dvh,640px)] flex flex-col">
        <div className="flex flex-shrink-0 items-center gap-3 px-4 py-3 border-b border-stitch-border">
          <Search className="w-5 h-5 text-stitch-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar página o acción..."
            className="flex-1 min-w-0 bg-transparent outline-none text-stitch-text placeholder:text-stitch-muted text-base sm:text-sm"
          />
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-stitch-surface-elevated shrink-0" aria-label="Cerrar">
            <X className="w-4 h-4 text-stitch-muted" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2 overscroll-contain custom-scrollbar">
          {Object.keys(groupedPages).length === 0 ? (
            <div className="px-4 py-8 text-center text-stitch-muted">
              No se encontraron resultados
            </div>
          ) : (
            Object.entries(groupedPages).map(([category, pages]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-stitch-muted uppercase tracking-wider">
                  {category}
                </div>
                {pages.map((page) => {
                  const isSelected = globalIndex === selectedIndex;
                  globalIndex++;
                  
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => {
                        onNavigate(page.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-left transition-colors ${
                        isSelected 
                          ? 'bg-stitch-primary-bright/10 text-stitch-primary-bright' 
                          : 'text-stitch-text hover:bg-stitch-surface-elevated'
                      }`}
                    >
                      <page.icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1 font-medium truncate">{page.name}</span>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:flex flex-shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-stitch-border text-xs text-stitch-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stitch-surface-elevated rounded text-stitch-text">↑↓</kbd>
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stitch-surface-elevated rounded text-stitch-text">↵</kbd>
            Seleccionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stitch-surface-elevated rounded text-stitch-text">esc</kbd>
            Cerrar
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
