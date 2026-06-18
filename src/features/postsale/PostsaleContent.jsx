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


function ticketDisplay(t) {
  const status = t.status || 'open';
  const uiStatus =
    status === 'in_progress' ? 'pending' : status === 'closed' || status === 'resolved' ? 'resolved' : status === 'open' ? 'open' : 'pending';
  return {
    ...t,
    priority: t.priority || 'medium',
    uiStatus,
    label: t.subject,
    customer: t.customer_label || t.customer_name || '—',
    date: t.created_at ? new Date(t.created_at).toLocaleDateString('es-CO') : t.date,
  };
}

// Postsale (support_tickets en Supabase)
export function PostsaleContent() {
  const tickets = useStore((s) => s.tickets);
  const addTicket = useStore((s) => s.addTicket);
  const deleteTicket = useStore((s) => s.deleteTicket);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', subject: '', priority: 'medium' });

  const rows = (tickets || []).map(ticketDisplay);
  const openCount = rows.filter((t) => t.uiStatus === 'open').length;
  const pendingCount = rows.filter((t) => t.uiStatus === 'pending').length;
  const resolvedCount = rows.filter((t) => t.uiStatus === 'resolved').length;

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    await addTicket({
      subject: form.subject.trim(),
      body: null,
      customer_label: form.customer || 'Cliente',
      priority: form.priority,
    });
    setForm({ customer: '', subject: '', priority: 'medium' });
    setModalOpen(false);
  };

  return (
    <div className="max-w-[1440px] mx-auto">
      <StitchPageHeader
        title="Postventa"
        subtitle="Tickets en la tabla support_tickets (Supabase)."
        actions={
          <Button type="button" onClick={() => setModalOpen(true)} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo Ticket
          </Button>
        }
      />

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="stitch-panel p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4 text-stitch-text">Nuevo ticket</h3>
            <form onSubmit={submitTicket} className="space-y-3">
              <div>
                <Label>Cliente / empresa</Label>
                <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Nombre" />
              </div>
              <div>
                <Label>Asunto</Label>
                <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Describe el problema" />
              </div>
              <div>
                <Label>Prioridad</Label>
                <select
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{openCount}</div>
            <div className="text-sm text-slate-500">Tickets abiertos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{pendingCount}</div>
            <div className="text-sm text-slate-500">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{resolvedCount}</div>
            <div className="text-sm text-slate-500">Resueltos</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Wrench className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{ticket.label}</div>
                      <div className="text-sm text-slate-500">{ticket.customer} • {String(ticket.id).slice(0, 8)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge variant={ticket.priority === 'high' ? 'red' : ticket.priority === 'medium' ? 'amber' : 'gray'}>
                      {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                    <Badge variant={ticket.uiStatus === 'open' ? 'blue' : ticket.uiStatus === 'pending' ? 'amber' : 'green'}>
                      {ticket.uiStatus === 'open' ? 'Abierto' : ticket.uiStatus === 'pending' ? 'Pendiente' : 'Resuelto'}
                    </Badge>
                    <span className="text-sm text-slate-400">{ticket.date}</span>
                    <button
                      type="button"
                      title="Eliminar ticket"
                      onClick={() => {
                        if (confirmDelete('este ticket de postventa')) deleteTicket(ticket.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
