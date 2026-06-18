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
import { StitchPageHeader } from '@/components/stitch/StitchPageHeader';

function triggerActionLabel(row) {
  const tr = row.trigger_config || {};
  const ac = row.action_config || {};
  return {
    trigger: tr.label || tr.type || JSON.stringify(tr).slice(0, 40),
    action: ac.label || ac.type || JSON.stringify(ac).slice(0, 40),
    lastRun: row.updated_at ? new Date(row.updated_at).toLocaleDateString('es-CO') : '—',
  };
}

// Automatizaciones (Supabase automation_rules; ejecución vía Edge run-automations + cron)
export function AutomationsContent() {
  const automations = useStore((s) => s.automations);
  const updateAutomationRule = useStore((s) => s.updateAutomationRule);
  const addAutomationRule = useStore((s) => s.addAutomationRule);
  const deleteAutomationRule = useStore((s) => s.deleteAutomationRule);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: '', action: '' });
  const [info, setInfo] = useState('');

  const toggleStatus = (id, status) => {
    const next = status === 'active' ? 'paused' : 'active';
    updateAutomationRule(id, { status: next });
  };

  const submitNew = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await addAutomationRule({
      name: form.name.trim(),
      trigger_config: { label: form.trigger.trim() || 'Personalizado' },
      action_config: { label: form.action.trim() || 'Notificación' },
      status: 'active',
    });
    setForm({ name: '', trigger: '', action: '' });
    setModalOpen(false);
    setInfo('Regla creada. Programá la función Edge run-automations con CRON_SECRET para generar notificaciones.');
  };

  return (
    <div className="max-w-[1440px] mx-auto">
      <StitchPageHeader
        title="Automatizaciones"
        subtitle={`${automations.filter((a) => a.status === 'active').length} activas · Ejecución programada cada 15 min (pg_cron) · Notificaciones in-app.`}
        actions={
          <Button type="button" variant="outline" onClick={() => setModalOpen(true)} className="w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4" />
            Nueva Automatización
          </Button>
        }
      />

      {info && (
        <div className="mb-4 rounded-lg border border-stitch-primary-bright/30 bg-stitch-primary-bright/10 px-3 py-2 text-sm text-stitch-text">
          {info}{' '}
          <button type="button" className="underline" onClick={() => setInfo('')}>
            Cerrar
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Nueva regla</h3>
            <form onSubmit={submitNew} className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Notificar nuevo lead" />
              </div>
              <div>
                <Label>Disparador (texto)</Label>
                <Input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} placeholder="Ej. Nuevo lead" />
              </div>
              <div>
                <Label>Acción (texto)</Label>
                <Input value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} placeholder="Ej. Enviar email" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {automations.length === 0 ? (
          <p className="text-sm text-slate-500 col-span-full">No hay reglas. Creá la primera con el botón superior.</p>
        ) : (
          automations.map((auto) => {
            const { trigger, action, lastRun } = triggerActionLabel(auto);
            return (
              <Card key={auto.id} hover>
                <CardContent className="p-5">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex-shrink-0 rounded-xl p-2 ${auto.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        <Workflow className={`h-5 w-5 ${auto.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{auto.name}</h3>
                        <div className="break-words text-sm text-slate-500">
                          {trigger} → {action}
                        </div>
                      </div>
                    </div>
                    <Badge className="w-fit flex-shrink-0" variant={auto.status === 'active' ? 'green' : 'gray'}>{auto.status === 'active' ? 'Activa' : 'Pausada'}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-400">Último cambio: {lastRun}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(auto.id, auto.status)}
                        title={auto.status === 'active' ? 'Pausar' : 'Activar'}
                      >
                        {auto.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                        title="Eliminar regla"
                        onClick={() => {
                          if (confirmDelete(`la automatización «${auto.name}»`)) deleteAutomationRule(auto.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
