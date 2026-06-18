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
import { statusVariant } from '@/lib/statusVariant';
import { StitchPageHeader } from '@/components/stitch/StitchPageHeader';
import { PageContainer } from '@/components/stitch/PageContainer';
import { PAGE_TITLES, STAGE_COLORS } from '@/config/crm';


export function MetaContent() {
  const integrations = useStore((s) => s.metaIntegrations);
  const forms = useStore((s) => s.metaLeadForms);
  const rawLeads = useStore((s) => s.metaLeadsRaw);
  const conversations = useStore((s) => s.crmConversations);
  const messagesByConversation = useStore((s) => s.crmMessagesByConversation);
  const addIntegration = useStore((s) => s.addMetaIntegration);
  const updateIntegration = useStore((s) => s.updateMetaIntegration);
  const deleteIntegration = useStore((s) => s.deleteMetaIntegration);
  const addLeadForm = useStore((s) => s.addMetaLeadForm);
  const deleteLeadForm = useStore((s) => s.deleteMetaLeadForm);
  const syncLeads = useStore((s) => s.syncMetaLeads);
  const fetchMessages = useStore((s) => s.fetchCrmMessages);
  const sendWhatsApp = useStore((s) => s.sendWhatsAppMessage);

  const [integrationForm, setIntegrationForm] = useState({
    name: 'Meta Business',
    page_id: '',
    page_name: '',
    ad_account_id: '',
    waba_id: '',
    phone_number_id: '',
    phone_number_label: '',
    token_ref: 'META_PAGE_ACCESS_TOKEN',
  });
  const [leadForm, setLeadForm] = useState({ integration_id: '', page_id: '', form_id: '', form_name: '' });
  const [selectedConversation, setSelectedConversation] = useState('');
  const [messageText, setMessageText] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const webhookUrl = isSupabaseConfigured()
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`
    : 'Configurá VITE_SUPABASE_URL para obtener la URL del webhook';
  const activeConversationId = selectedConversation || conversations[0]?.id || '';
  const selectedMessages = messagesByConversation[activeConversationId] || [];

  useEffect(() => {
    if (activeConversationId) fetchMessages(activeConversationId);
  }, [activeConversationId, fetchMessages]);

  const createIntegration = async (e) => {
    e.preventDefault();
    setBusy(true);
    const created = await addIntegration({
      ...integrationForm,
      status: integrationForm.page_id || integrationForm.phone_number_id ? 'active' : 'draft',
    });
    setBusy(false);
    if (created) {
      setIntegrationForm({
        name: 'Meta Business',
        page_id: '',
        page_name: '',
        ad_account_id: '',
        waba_id: '',
        phone_number_id: '',
        phone_number_label: '',
        token_ref: 'META_PAGE_ACCESS_TOKEN',
      });
      setInfo('Integración guardada. Configurá los secretos en Supabase antes de activar webhooks reales.');
    } else {
      setInfo('No se pudo guardar la integración. Verificá Supabase y la migración de Meta.');
    }
  };

  const createLeadForm = async (e) => {
    e.preventDefault();
    const integration = integrations.find((i) => i.id === leadForm.integration_id);
    const created = await addLeadForm({
      ...leadForm,
      page_id: leadForm.page_id || integration?.page_id || '',
    });
    if (created) {
      setLeadForm({ integration_id: '', page_id: '', form_id: '', form_name: '' });
      setInfo('Formulario de Lead Ads guardado. Ya puede recibir webhooks o sincronizarse manualmente.');
    } else {
      setInfo('No se pudo guardar el formulario. Revisá que tenga integración, page_id y form_id.');
    }
  };

  const copyWebhook = async () => {
    if (navigator.clipboard && isSupabaseConfigured()) {
      await navigator.clipboard.writeText(webhookUrl);
      setInfo('URL de webhook copiada.');
    }
  };

  const runSync = async (integrationId, formId = null) => {
    setBusy(true);
    const result = await syncLeads(integrationId, formId);
    setBusy(false);
    setInfo(result.success ? `Sincronización completa: ${result.data?.imported || 0} leads nuevos.` : result.error);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!activeConversationId || !messageText.trim()) return;
    setBusy(true);
    const result = await sendWhatsApp(activeConversationId, messageText.trim());
    setBusy(false);
    if (result.success) {
      setMessageText('');
      setInfo('Mensaje enviado por WhatsApp.');
    } else {
      setInfo(result.error || 'No se pudo enviar el mensaje.');
    }
  };

  return (
    <PageContainer className="space-y-4 sm:space-y-6">
      <StitchPageHeader title="Meta Ads" subtitle="Lead Ads, WhatsApp y webhooks de integración." />
      <div className="stitch-panel border-stitch-primary-bright/20 bg-stitch-primary-bright/5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-stitch-text text-lg">Webhook Meta</h2>
            <p className="mt-1 text-sm text-stitch-muted">
              Usá esta URL como callback en Meta Developers y el secreto <code className="text-xs font-mono">META_VERIFY_TOKEN</code> como verify token.
            </p>
            <code className="mt-2 block break-all rounded-lg bg-stitch-surface-elevated border border-stitch-border/40 px-3 py-2 text-xs text-stitch-text font-mono">
              {webhookUrl}
            </code>
          </div>
          <Button type="button" variant="outline" onClick={copyWebhook} disabled={!isSupabaseConfigured()} className="w-full lg:w-auto">
            <Copy className="w-4 h-4" />
            Copiar URL
          </Button>
        </div>
      </div>

      {info && (
        <div className="rounded-lg border border-stitch-border stitch-panel px-3 py-2 text-sm text-stitch-text">
          {info}{' '}
          <button type="button" className="text-stitch-primary-bright underline" onClick={() => setInfo('')}>
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Nueva integración Meta</h3>
            <p className="text-sm text-slate-500 mb-4">Guarda los IDs públicos; los tokens deben vivir como secretos de Edge Functions.</p>
            <form onSubmit={createIntegration} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Nombre</Label>
                <Input required value={integrationForm.name} onChange={(e) => setIntegrationForm({ ...integrationForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Page ID</Label>
                <Input value={integrationForm.page_id} onChange={(e) => setIntegrationForm({ ...integrationForm, page_id: e.target.value })} placeholder="123456789" />
              </div>
              <div>
                <Label>Page Name</Label>
                <Input value={integrationForm.page_name} onChange={(e) => setIntegrationForm({ ...integrationForm, page_name: e.target.value })} placeholder="Mi página" />
              </div>
              <div>
                <Label>Ad Account ID</Label>
                <Input value={integrationForm.ad_account_id} onChange={(e) => setIntegrationForm({ ...integrationForm, ad_account_id: e.target.value })} placeholder="act_..." />
              </div>
              <div>
                <Label>WABA ID</Label>
                <Input value={integrationForm.waba_id} onChange={(e) => setIntegrationForm({ ...integrationForm, waba_id: e.target.value })} />
              </div>
              <div>
                <Label>WhatsApp Phone Number ID</Label>
                <Input value={integrationForm.phone_number_id} onChange={(e) => setIntegrationForm({ ...integrationForm, phone_number_id: e.target.value })} />
              </div>
              <div>
                <Label>Etiqueta teléfono</Label>
                <Input value={integrationForm.phone_number_label} onChange={(e) => setIntegrationForm({ ...integrationForm, phone_number_label: e.target.value })} placeholder="+57..." />
              </div>
              <div className="md:col-span-2">
                <Label>Nombre del secreto con token</Label>
                <Input value={integrationForm.token_ref} onChange={(e) => setIntegrationForm({ ...integrationForm, token_ref: e.target.value })} placeholder="META_PAGE_ACCESS_TOKEN" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={busy}>
                  <Settings className="w-4 h-4" />
                  Guardar integración
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Formulario Lead Ads</h3>
            <p className="text-sm text-slate-500 mb-4">Registra cada formulario que deba entrar como lead del CRM.</p>
            <form onSubmit={createLeadForm} className="space-y-3">
              <div>
                <Label>Integración</Label>
                <select
                  required
                  value={leadForm.integration_id}
                  onChange={(e) => setLeadForm({ ...leadForm, integration_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Seleccionar...</option>
                  {integrations.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Form ID</Label>
                <Input required value={leadForm.form_id} onChange={(e) => setLeadForm({ ...leadForm, form_id: e.target.value })} />
              </div>
              <div>
                <Label>Nombre del formulario</Label>
                <Input value={leadForm.form_name} onChange={(e) => setLeadForm({ ...leadForm, form_name: e.target.value })} />
              </div>
              <div>
                <Label>Page ID opcional</Label>
                <Input value={leadForm.page_id} onChange={(e) => setLeadForm({ ...leadForm, page_id: e.target.value })} placeholder="Usa el Page ID de la integración si queda vacío" />
              </div>
              <Button type="submit" disabled={!integrations.length}>
                <Target className="w-4 h-4" />
                Guardar formulario
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardContent>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Integraciones configuradas</h3>
            {integrations.length === 0 ? (
              <p className="text-sm text-slate-500">No hay integraciones Meta todavía.</p>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration) => {
                  const integrationForms = forms.filter((f) => f.integration_id === integration.id);
                  return (
                    <div key={integration.id} className="rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{integration.name}</h4>
                            <Badge variant={statusVariant(integration.status)}>{integration.status}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            Page: {integration.page_name || integration.page_id || '—'} · WhatsApp: {integration.phone_number_label || integration.phone_number_id || '—'}
                          </p>
                          <p className="text-xs text-slate-400">Token secret: {integration.token_ref} · Última sync: {integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString('es-CO') : '—'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => runSync(integration.id)}>
                            <RefreshCw className="w-3 h-3" />
                            Sincronizar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => updateIntegration(integration.id, { status: integration.status === 'active' ? 'paused' : 'active' })}
                          >
                            {integration.status === 'active' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {integration.status === 'active' ? 'Pausar' : 'Activar'}
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="text-red-600" onClick={() => {
                            if (confirmDelete(`la integración «${integration.name}»`)) deleteIntegration(integration.id);
                          }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {integrationForms.length === 0 ? (
                          <span className="text-xs text-slate-400">Sin formularios registrados.</span>
                        ) : (
                          integrationForms.map((form) => (
                            <span key={form.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
                              {form.form_name || form.form_id}
                              <button type="button" onClick={() => runSync(integration.id, form.form_id)} className="text-blue-600 dark:text-blue-400">sync</button>
                              <button type="button" onClick={() => deleteLeadForm(form.id)} className="text-red-500">x</button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Secretos requeridos</h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p><code className="text-xs">META_VERIFY_TOKEN</code> para verificar el webhook.</p>
              <p><code className="text-xs">META_APP_SECRET</code> para validar firmas.</p>
              <p><code className="text-xs">META_PAGE_ACCESS_TOKEN</code> para leer Lead Ads.</p>
              <p><code className="text-xs">META_WHATSAPP_TOKEN</code> para enviar WhatsApp.</p>
              <p><code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> para procesar webhooks.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Últimos leads recibidos</h3>
            <div className="space-y-3">
              {rawLeads.length === 0 ? (
                <p className="text-sm text-slate-500">Aún no hay leads recibidos desde Meta.</p>
              ) : rawLeads.slice(0, 8).map((lead) => (
                <div key={lead.id} className="rounded-lg border border-slate-100 dark:border-slate-700 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{lead.leadgen_id}</span>
                    <Badge variant={lead.crm_lead_id ? 'green' : 'amber'}>{lead.crm_lead_id ? 'CRM' : 'Pendiente'}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Form: {lead.form_id || '—'} · {lead.created_at ? new Date(lead.created_at).toLocaleString('es-CO') : '—'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Inbox WhatsApp</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin conversaciones todavía.</p>
                ) : conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedConversation(c.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${activeConversationId === c.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
                  >
                    <div className="font-medium">{c.contact_name || c.external_contact_id}</div>
                    <div className="text-xs opacity-70">{c.channel}</div>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-2">
                <div className="h-64 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-700 p-3 space-y-2">
                  {selectedMessages.length === 0 ? (
                    <p className="text-sm text-slate-500">Seleccioná una conversación para ver mensajes.</p>
                  ) : selectedMessages.map((m) => (
                    <div key={m.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.direction === 'outbound' ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'}`}>
                      <div>{m.body || `[${m.message_type}]`}</div>
                      <div className="mt-1 text-[10px] opacity-70">{m.status || m.direction}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage} className="mt-3 flex gap-2">
                  <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Responder por WhatsApp..." disabled={!activeConversationId} />
                  <Button type="submit" disabled={!activeConversationId || busy}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
