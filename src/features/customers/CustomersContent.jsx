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
import { PageContainer } from '@/components/stitch/PageContainer';


// Customers Page
export function CustomersContent() {
  const { openModal } = useCrmModal();
  const customers = useStore(state => state.customers);
  const deleteCustomer = useStore(state => state.deleteCustomer);
  
  const columns = [
    { key: 'name', header: 'Cliente', sortable: true, render: (val, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={val} size="sm" />
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{val}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      </div>
    )},
    { key: 'company', header: 'Empresa', render: (val) => (
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Building2 className="w-4 h-4 text-slate-400" />
        {val}
      </div>
    )},
    { key: 'city', header: 'Ciudad', render: (val) => (
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <MapPin className="w-4 h-4 text-slate-400" />
        {val}
      </div>
    )},
    { key: 'customer_type', header: 'Tipo', render: (val) => (
      <Badge variant={val === 'corporate' ? 'blue' : 'gray'}>
        {val === 'corporate' ? 'Corporativo' : 'PYME'}
      </Badge>
    )},
    { key: 'score', header: 'Score', sortable: true, render: (val) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${val}%`, background: val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444' }} />
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{val}</span>
      </div>
    )},
    { key: 'lifetime_value', header: 'Valor total', sortable: true, render: (val) => (
      <span className="font-semibold text-slate-900 dark:text-white">${Math.round(val).toLocaleString()}</span>
    )},
    { key: 'actions', header: '', render: (val, row) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={() => openModal('customer', { customer: row })} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => { if (confirmDelete('este cliente')) deleteCustomer(row.id); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar cliente">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <PageContainer>
      <StitchPageHeader
        title="Clientes"
        subtitle={`${customers.length} clientes registrados`}
        actions={
          <Button type="button" onClick={() => openModal('customer')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        }
      />
      <DataTable columns={columns} data={customers} searchPlaceholder="Buscar clientes..." pageName="customers" />
    </PageContainer>
  );
}
