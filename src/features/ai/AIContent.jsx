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


// AI Page (preferencias en user_preferences; modelo vía Edge Function crm-ai)
export function AIContent() {
  const userPreferences = useStore((s) => s.userPreferences);
  const savePreferences = useStore((s) => s.savePreferences);
  const assistantOn = Boolean(userPreferences?.ai_assistant_enabled);

  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState('');

  const toggleAssistant = async () => {
    const flags = userPreferences?.notification_flags || {};
    await savePreferences({
      ai_assistant_enabled: !assistantOn,
      notification_flags: flags,
    });
  };

  const sendAi = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || !assistantOn) return;
    if (!isSupabaseConfigured()) {
      setAiErr('Configurá Supabase para usar el asistente.');
      return;
    }
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiErr('');
    setAiMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setAiLoading(true);
    const { data, error } = await invokeCrmAi(userMsg);
    setAiLoading(false);
    if (error) {
      setAiErr(error.message || 'Error al invocar la función');
      return;
    }
    const reply = data?.reply || data?.error || 'Sin respuesta';
    setAiMessages((m) => [...m, { role: 'assistant', text: typeof reply === 'string' ? reply : JSON.stringify(reply) }]);
  };

  const aiFeatures = [
    { name: 'Predicción de cierre', desc: 'Resúmenes con el asistente cuando está activo.', icon: TrendingUp, active: assistantOn },
    { name: 'Scoring automático', desc: 'Usá preguntas al asistente sobre tus leads.', icon: Target, active: assistantOn },
    { name: 'Asistente de email', desc: 'Borradores y tono con IA (Edge + OpenAI).', icon: Mail, active: assistantOn },
    { name: 'Análisis de conversaciones', desc: 'Pendiente de integrar transcripciones.', icon: Bot, active: assistantOn },
    { name: 'Recomendaciones de productos', desc: 'Consultá al asistente con contexto de negocio.', icon: Lightbulb, active: assistantOn },
    { name: 'Alertas de churn', desc: 'Combiná notificaciones del CRM + IA.', icon: AlertTriangle, active: assistantOn },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">IA Comercial</h2>
          <p className="text-sm text-slate-500">Preferencia guardada en Supabase. Configurá GEMINI_API_KEY en Edge Functions → Secrets (gratis en Google AI Studio).</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">CRM AI Assistant</h3>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            {assistantOn
              ? 'Asistente activado. Chat abajo usa la función Edge con tu sesión.'
              : 'Activá el asistente para habilitar el chat y las tarjetas inferiores.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={toggleAssistant}
            className={`relative z-10 cursor-pointer ${assistantOn ? '!bg-white/20 !text-white border border-white/40 hover:!bg-white/30' : '!bg-white !text-blue-600 hover:!bg-blue-50'}`}
          >
            <Bot className="w-4 h-4" />
            {assistantOn ? 'Desactivar assistant' : 'Activar Assistant'}
          </Button>
        </CardContent>
      </Card>

      {assistantOn && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Chat</h3>
            {aiErr && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{aiErr}</p>}
            <div className="max-h-64 overflow-y-auto space-y-2 mb-3 text-sm">
              {aiMessages.length === 0 ? (
                <p className="text-slate-500">Escribí una pregunta para el asistente comercial.</p>
              ) : (
                aiMessages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-right text-slate-800 dark:text-slate-100' : 'text-left text-slate-600 dark:text-slate-300'}>
                    <span className="inline-block rounded-lg px-3 py-2 bg-slate-100 dark:bg-slate-800">{m.text}</span>
                  </div>
                ))
              )}
              {aiLoading && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Pensando…
                </div>
              )}
            </div>
            <form onSubmit={sendAi} className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ej. Cómo priorizo leads esta semana?" className="min-w-0 flex-1" />
              <Button type="submit" disabled={aiLoading} className="w-full shrink-0 sm:w-auto">
                Enviar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiFeatures.map((feature, idx) => (
          <Card key={idx} hover className={!assistantOn ? 'opacity-60' : ''}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${feature.active ? 'bg-emerald-500/15' : 'bg-slate-500/10'}`}>
                  <feature.icon className={`w-6 h-6 ${feature.active ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    {feature.name}
                    {feature.active && (
                      <Badge variant="green" className="text-[10px]">
                        On
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
