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
import { PAGE_TITLES, STAGE_COLORS } from '@/config/crm';


// Orders Page
export function OrdersContent() {
  const { openModal } = useCrmModal();
  const orders = useStore(state => state.orders);
  const deleteOrder = useStore(state => state.deleteOrder);
  
  const columns = [
    { key: 'order_number', header: 'Pedido', sortable: true, render: (val) => <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{val}</span> },
    { key: 'customer_name', header: 'Cliente', render: (val) => (
      <div className="flex items-center gap-2">
        <Avatar name={val} size="sm" />
        <span className="font-medium text-slate-900 dark:text-white">{val}</span>
      </div>
    )},
    { key: 'total', header: 'Total', sortable: true, render: (val) => <span className="font-semibold text-slate-900 dark:text-white">${Math.round(val).toLocaleString()}</span> },
    { key: 'status', header: 'Estado', render: (val) => {
      const variants = { confirmed: 'amber', preparing: 'blue', shipped: 'purple', delivered: 'green', returned: 'red' };
      const labels = { confirmed: 'Confirmado', preparing: 'Preparando', shipped: 'Enviado', delivered: 'Entregado', returned: 'Devuelto' };
      return <Badge variant={variants[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'carrier', header: 'Transporte', render: (val) => val || '—' },
    { key: 'created_at', header: 'Fecha', render: (val) => new Date(val).toLocaleDateString('es-CO') },
    { key: 'actions', header: '', render: (val, row) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button type="button" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-green-500 transition-colors">
          <FileCheck className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Eliminar pedido"
          onClick={() => {
            const num = row.order_number || row.number || '';
            if (confirmDelete(num ? `el pedido ${num}` : 'este pedido')) deleteOrder(row.id);
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pedidos</h2>
          <p className="text-sm text-slate-500">{orders.length} pedidos</p>
        </div>
        <Button type="button" onClick={() => openModal('order')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
      </div>
      <DataTable columns={columns} data={orders} searchPlaceholder="Buscar pedidos..." pageName="orders" />
    </div>
  );
}
