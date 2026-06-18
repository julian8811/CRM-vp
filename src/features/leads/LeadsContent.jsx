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


// Leads Page
export function LeadsContent() {
  const { openModal } = useCrmModal();
  const leads = useStore(state => state.leads);
  const convertLead = useStore(state => state.convertLead);
  const deleteLead = useStore(state => state.deleteLead);
  
  const columns = [
    { key: 'name', header: 'Lead', sortable: true, render: (val, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={`${row.first_name} ${row.last_name}`} size="sm" />
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      </div>
    )},
    { key: 'company', header: 'Empresa' },
    { key: 'source', header: 'Fuente', render: (val) => <Badge variant="gray">{val}</Badge> },
    { key: 'interest', header: 'Interés', render: (val) => {
      const styles = { hot: 'red', warm: 'amber', cold: 'blue' };
      const labels = { hot: '🔥 Caliente', warm: '🌤 Tibio', cold: '❄️ Frío' };
      return <Badge variant={styles[val] || 'gray'}>{labels[val] || val}</Badge>;
    }},
    { key: 'status', header: 'Estado', render: (val) => {
      const variants = { new: 'blue', contacted: 'amber', qualified: 'green', converted: 'purple', lost: 'gray' };
      return <Badge variant={variants[val] || 'gray'}>{val}</Badge>;
    }},
    { key: 'score', header: 'Score', sortable: true, render: (val) => (
      <span className={`font-bold ${val >= 70 ? 'text-emerald-600' : val >= 40 ? 'text-amber-600' : 'text-slate-400'}`}>{val}</span>
    )},
    { key: 'budget', header: 'Presupuesto', render: (val) => val ? <span className="text-slate-600 dark:text-slate-400">${Math.round(val).toLocaleString()}</span> : '—' },
    { key: 'actions', header: '', render: (val, row) => (
      <div className="flex justify-center items-center gap-2 flex-wrap">
        {row.status !== 'converted' ? (
          <Button size="sm" variant="outline" type="button" onClick={() => convertLead(row.id)}>
            <ArrowRightCircle className="w-3 h-3" />
            Convertir
          </Button>
        ) : <Badge variant="purple">✓ Convertido</Badge>}
        <button
          type="button"
          title="Eliminar prospecto"
          onClick={() => { if (confirmDelete('este prospecto')) deleteLead(row.id); }}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <PageContainer>
      <StitchPageHeader
        title="Dirige"
        subtitle={`Gestión de prospectos · ${leads.length} registros`}
        actions={
          <Button type="button" onClick={() => openModal('lead')} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo prospecto
          </Button>
        }
      />
      <DataTable columns={columns} data={leads} searchPlaceholder="Buscar prospectos..." pageName="leads" />
    </PageContainer>
  );
}
