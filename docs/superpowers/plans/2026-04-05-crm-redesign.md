# CRM-VP Rediseño Completo - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar CRM-VP con UI estilo HubSpot, UX optimizada para ventas, componentes premium, y funcionalidades completas.

**Architecture:** 
- Migrar de estilos inline a Tailwind CSS
- Crear biblioteca de componentes reutilizables
- Implementar Dashboard con métricas reales
- Pipeline Kanban con drag & drop
- Sistema de notificaciones y commands

**Tech Stack:**
- Tailwind CSS
- Lucide React (iconos)
- Recharts (gráficos)
- @dnd-kit/core (drag & drop)
- react-hook-form + zod (forms)
- react-hot-toast (notifications)
- xlsx (export)

---

## Plan Structure

### Fase 1: Setup & Componentes Base (Task 1-8)
### Fase 2: Dashboard & Métricas (Task 9-16)
### Fase 3: Pipeline Kanban (Task 17-24)
### Fase 4: Pages Core & CRUD (Task 25-32)
### Fase 5: Polish & Export (Task 33-40)

---

## Fase 1: Setup & Componentes Base

### Task 1: Instalar Tailwind CSS

**Files:**
- Modify: `package.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Instalar dependencias**

```bash
npm install -D tailwindcss@latest postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Configurar tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B3A5C',
          light: '#2E75B6',
          dark: '#0f2035',
        },
        accent: '#3b82f6',
        surface: {
          light: '#f8fafc',
          dark: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        'card-hover': '0 10px 40px rgba(0,0,0,0.12)',
        'dropdown': '0 4px 20px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Configurar src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-surface-light text-slate-900 font-sans antialiased;
  }
  
  .dark body {
    @apply bg-surface-dark text-slate-100;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-semibold transition-all duration-150 ease-out;
  }
  
  .btn-primary {
    @apply bg-primary text-white hover:bg-primary-light active:scale-[0.98];
  }
  
  .btn-secondary {
    @apply bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300;
  }
  
  .input {
    @apply w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all;
  }
  
  .card {
    @apply bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card hover:shadow-card-hover transition-shadow;
  }
  
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold;
  }
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

---

### Task 2: Crear Button Component

**Files:**
- Create: `src/components/ui/Button.jsx`

- [ ] **Step 1: Crear componente Button**

```jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Button = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children,
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-light active:scale-[0.98]',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
```

- [ ] **Step 2: Crear utility cn**

```bash
mkdir -p src/lib
```

```jsx
// src/lib/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Instalar clsx y tailwind-merge**

```bash
npm install clsx tailwind-merge
```

---

### Task 3: Crear Input & Card Components

**Files:**
- Create: `src/components/ui/Input.jsx`
- Create: `src/components/ui/Card.jsx`
- Create: `src/components/ui/Label.jsx`

- [ ] **Step 1: Input.jsx**

```jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm',
        error && 'border-red-500 focus:ring-red-500/50',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 2: Card.jsx**

```jsx
import { cn } from '@/lib/utils';

function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card transition-all',
        hover && 'hover:shadow-card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100 dark:border-slate-700', className)} {...props}>
      {children}
    </div>
  );
}

function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent };
```

- [ ] **Step 3: Label.jsx**

```jsx
import { cn } from '@/lib/utils';

function Label({ className, children, required, ...props }) {
  return (
    <label className={cn('block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5', className)} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export { Label };
```

---

### Task 4: Crear Badge & Avatar Components

**Files:**
- Create: `src/components/ui/Badge.jsx`
- Create: `src/components/ui/Avatar.jsx`

- [ ] **Step 1: Badge.jsx**

```jsx
import { cn } from '@/lib/utils';

const Badge = ({ variant = 'gray', children, className }) => {
  const variants = {
    gray: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
};

export { Badge };
```

- [ ] **Step 2: Avatar.jsx**

```jsx
import { cn } from '@/lib/utils';

function Avatar({ name, size = 'md', className }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
  ];
  
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
      sizes[size],
      colors[colorIndex],
      className
    )}>
      {initials}
    </div>
  );
}

export { Avatar };
```

---

### Task 5: Crear DataTable Component

**Files:**
- Create: `src/components/ui/DataTable.jsx`

- [ ] **Step 1: DataTable.jsx**

```jsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Input } from './Input';

function DataTable({ 
  columns, 
  data, 
  searchPlaceholder = 'Buscar...',
  onRowClick,
  emptyMessage = 'No hay datos',
  loading
}) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const filteredData = data.filter(row =>
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr 
                  key={row.id || idx}
                  className={cn(
                    'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable };
```

---

### Task 6: Crear Modal & Dropdown Components

**Files:**
- Create: `src/components/ui/Modal.jsx`
- Create: `src/components/ui/Dropdown.jsx`

- [ ] **Step 1: Modal.jsx**

```jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className={cn(
        'relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full mx-4 animate-in fade-in zoom-in-95 duration-200',
        sizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export { Modal };
```

- [ ] **Step 2: Dropdown.jsx**

```jsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function Dropdown({ trigger, items, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className={cn(
          'absolute z-50 mt-2 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-dropdown border border-slate-100 dark:border-slate-700 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-150',
          align === 'left' ? 'left-0' : 'right-0'
        )}>
          {items.map((item, idx) => (
            item.divider ? (
              <div key={idx} className="my-2 border-t border-slate-100 dark:border-slate-700" />
            ) : (
              <button
                key={idx}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                  item.danger 
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                )}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export { Dropdown };
```

---

### Task 7: Crear Sidebar Navigation Component

**Files:**
- Create: `src/components/layout/Sidebar.jsx`

- [ ] **Step 1: Sidebar.jsx**

```jsx
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
```

---

### Task 8: Crear Header & Layout Components

**Files:**
- Create: `src/components/layout/Header.jsx`
- Create: `src/components/layout/Layout.jsx`

- [ ] **Step 1: Header.jsx**

```jsx
import { Search, Bell, Sun, Moon, Command } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useState } from 'react';

function Header({ user, title, subtitle }) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between px-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search... (⌘K)"
            className="pl-10 w-64 bg-slate-50 dark:bg-slate-900 border-0"
          />
        </div>

        {/* Actions */}
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

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
```

- [ ] **Step 2: Layout.jsx**

```jsx
import { Sidebar } from './Sidebar';
import { Header } from './Header';

function Layout({ children, currentPage, onNavigate, user, onLogout, title, subtitle }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Layout };
```

---

## Fase 2: Dashboard & Métricas

(Continuaría con las siguientes tareas en el plan completo...)

---

## Ejecución

**Plan completo guardado en:** `docs/superpowers/plans/2026-04-05-crm-redesign.md`

### Dos opciones de ejecución:

**1. Subagent-Driven (recomendado):** Dispacho un subagent por cada task, reviso entre tareas, iteración rápida.

**2. Inline Execution:** Ejecuto las tareas en esta sesión usando executing-plans, con checkpoints de revisión.

**¿Cuál preferís?**

