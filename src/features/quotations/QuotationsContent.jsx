import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, Plus, TrendingUp, DollarSign, Users, Target, ShoppingCart, GripVertical, MapPin, Building2, Mail, Phone, Edit2, Trash2, ArrowRightCircle, Package, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Send, BarChart3, PieChart, Activity, Zap, Settings, UserPlus, Wrench, Headphones, Download, Filter, Eye, FileDown, Calendar, RefreshCw, Copy, Check, X, ChevronRight, Sparkles, Bot, Lightbulb, TrendingDown, UsersRound, Receipt, CreditCard, FileCheck, Workflow, Play, Pause, Clock3, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/useStore';
import {
  formatCurrency,
  getRangeFromPreset,
  isInRange,
  pipelineTotals,
  sumOrdersTotal,
  buildFunnelRows,
  buildLast6MonthsOrderTrend,
  countEntities,
} from '@/lib/crmMetrics';
import { exportWorkbook } from '@/lib/exportExcel';
import { invokeCrmAi } from '@/lib/crmAi';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/auth';
import { confirmDelete } from '@/lib/confirmDelete';
import { StitchPageHeader } from '@/components/stitch/StitchPageHeader';


// Quotations Page
export function QuotationsContent() {
  const { openModal } = useCrmModal();
  const quotations = useStore(state => state.quotations);
  const deleteQuotation = useStore(state => state.deleteQuotation);
  
  const columns = [
    { key: 'quote_number', header: 'Número', sortable: true, render: (val) => <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{val}</span> },
    { key: 'customer_name', header: 'Cliente', render: (val) => (
      <div className="flex items-center gap-2">
        <Avatar name={val} size="sm" />
        <span className="font-medium text-slate-900 dark:text-white">{val}</span>
      </div>
    )},
    { key: 'total', header: 'Total', sortable: true, render: (val) => <span className="font-semibold text-slate-900 dark:text-white">${Math.round(val).toLocaleString()}</span> },
    { key: 'status', header: 'Estado', render: (val) => {
      const variants = { draft: 'gray', sent: 'blue', approved: 'green', reviewed: 'amber', rejected: 'red' };
      const labels = { draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada', reviewed: 'Revisada', rejected: 'Rechazada' };
      return <Badge variant={variants[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'valid_until', header: 'Válida hasta', render: (val) => val ? new Date(val).toLocaleDateString('es-CO') : '—' },
    { key: 'created_at', header: 'Fecha', render: (val) => new Date(val).toLocaleDateString('es-CO') },
    { key: 'actions', header: '', render: (val, row) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-green-500 transition-colors">
          <Send className="w-4 h-4" />
        </button>
        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <FileDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Eliminar cotización"
          onClick={() => {
            const num = row.quote_number || row.number || '';
            if (confirmDelete(num ? `la cotización ${num}` : 'esta cotización')) deleteQuotation(row.id);
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="max-w-[1440px] mx-auto">
      <StitchPageHeader
        title="Cotizaciones"
        subtitle={`${quotations.length} cotizaciones`}
        actions={
          <Button type="button" onClick={() => openModal('quotation')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nueva Cotización
          </Button>
        }
      />
      <DataTable columns={columns} data={quotations} searchPlaceholder="Buscar cotizaciones..." pageName="quotations" />
    </div>
  );
}
