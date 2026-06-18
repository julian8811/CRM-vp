import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Loader2,
  Sparkles,
  Bot,
  TrendingUp,
  Target,
  Mail,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { invokeCrmAi } from '@/lib/crmAi';
import api from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';

function formatContextLine(items, mapFn) {
  if (!items?.length) return '';
  return items.map(mapFn).join('\n');
}

export function AIContent() {
  const userPreferences = useStore((s) => s.userPreferences);
  const savePreferences = useStore((s) => s.savePreferences);
  const leads = useStore((s) => s.leads);
  const pipeline = useStore((s) => s.pipeline);
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

  const appendExchange = async (userMsg) => {
    if (!userMsg.trim() || !assistantOn) return;
    if (!isSupabaseConfigured()) {
      setAiErr('Configurá Supabase para usar el asistente.');
      return;
    }
    setAiErr('');
    setAiMessages((m) => [...m, { role: 'user', text: userMsg.trim() }]);
    setAiLoading(true);
    const { data, error } = await invokeCrmAi(userMsg.trim());
    setAiLoading(false);
    if (error) {
      setAiErr(error.message || 'Error al invocar la función');
      return;
    }
    const reply = data?.reply || data?.error || 'Sin respuesta';
    setAiMessages((m) => [
      ...m,
      { role: 'assistant', text: typeof reply === 'string' ? reply : JSON.stringify(reply) },
    ]);
  };

  const sendAi = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const msg = aiInput.trim();
    setAiInput('');
    await appendExchange(msg);
  };

  const runConversationAnalysis = async () => {
    setAiLoading(true);
    setAiErr('');
    const result = await api.aiContext.getConversationSummary();
    setAiLoading(false);
    if (!result.success) {
      setAiErr(result.error || 'No se pudo cargar conversaciones');
      return;
    }

    const { tickets, messages } = result.data;
    const ticketLines = formatContextLine(tickets, (t) =>
      `- [${t.status}] ${t.customer_label || 'Cliente'}: ${t.subject}${t.body ? ` — ${t.body}` : ''}`,
    );
    const messageLines = formatContextLine(messages, (m) =>
      `- [${m.direction || 'in'}] ${m.channel || 'chat'}: ${m.body || ''}`,
    );

    const hasData = ticketLines || messageLines;
    const prompt = hasData
      ? `Analizá estas conversaciones y tickets del CRM. Resumí temas recurrentes, urgencias y próximos pasos recomendados:\n\nTickets postventa:\n${ticketLines || '(ninguno)'}\n\nMensajes:\n${messageLines || '(ninguno)'}`
      : 'Aún no hay tickets de postventa ni mensajes de WhatsApp en el CRM. Explicá en 3 puntos cómo el equipo puede usar Postventa y Meta para acumular conversaciones analizables.';

    await appendExchange(prompt);
  };

  const pipelineCount = Object.values(pipeline || {}).reduce((n, arr) => n + (arr?.length || 0), 0);

  const aiFeatures = [
    {
      name: 'Predicción de cierre',
      desc: 'Resumen de oportunidades por etapa.',
      icon: TrendingUp,
      active: assistantOn,
      onClick: () =>
        appendExchange(
          `Tengo ${pipelineCount} oportunidades en el pipeline. ¿Cómo priorizo el cierre este mes?`,
        ),
    },
    {
      name: 'Scoring automático',
      desc: 'Priorizá leads según señales del CRM.',
      icon: Target,
      active: assistantOn,
      onClick: () =>
        appendExchange(
          `Tengo ${leads?.length || 0} leads. ¿Qué criterios uso para priorizar los más calientes?`,
        ),
    },
    {
      name: 'Asistente de email',
      desc: 'Borradores y tono con Gemini.',
      icon: Mail,
      active: assistantOn,
      onClick: () =>
        appendExchange('Redactá un email breve de seguimiento comercial B2B, tono profesional y cercano.'),
    },
    {
      name: 'Análisis de conversaciones',
      desc: 'Resume tickets y mensajes del CRM.',
      icon: MessageSquare,
      active: assistantOn,
      onClick: runConversationAnalysis,
    },
    {
      name: 'Recomendaciones de productos',
      desc: 'Sugerencias según contexto comercial.',
      icon: Lightbulb,
      active: assistantOn,
      onClick: () =>
        appendExchange('¿Cómo recomiendo productos del catálogo según etapa del embudo y tipo de cliente?'),
    },
    {
      name: 'Alertas de churn',
      desc: 'Señales de riesgo con datos del CRM.',
      icon: AlertTriangle,
      active: assistantOn,
      onClick: () =>
        appendExchange('¿Qué señales de churn debería monitorear en clientes y pedidos de este CRM?'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">IA Comercial</h2>
          <p className="text-sm text-slate-500">
            Asistente con Google Gemini. Activá el assistant y usá el chat o las tarjetas rápidas.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-700">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-white">CRM AI Assistant</h3>
          <p className="mx-auto mb-6 max-w-md text-blue-100">
            {assistantOn
              ? 'Asistente activado. Chat y acciones rápidas disponibles.'
              : 'Activá el asistente para habilitar el chat y las tarjetas inferiores.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={toggleAssistant}
            className={`relative z-10 cursor-pointer ${assistantOn ? '!bg-white/20 !text-white border border-white/40 hover:!bg-white/30' : '!bg-white !text-blue-600 hover:!bg-blue-50'}`}
          >
            <Bot className="h-4 w-4" />
            {assistantOn ? 'Desactivar assistant' : 'Activar Assistant'}
          </Button>
        </CardContent>
      </Card>

      {assistantOn && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Chat</h3>
            {aiErr && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{aiErr}</p>}
            <div className="mb-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {aiMessages.length === 0 ? (
                <p className="text-slate-500">Escribí una pregunta o tocá una tarjeta de abajo.</p>
              ) : (
                aiMessages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === 'user'
                        ? 'text-right text-slate-800 dark:text-slate-100'
                        : 'text-left text-slate-600 dark:text-slate-300'
                    }
                  >
                    <span className="inline-block rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                      {m.text}
                    </span>
                  </div>
                ))
              )}
              {aiLoading && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Pensando…
                </div>
              )}
            </div>
            <form onSubmit={sendAi} className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ej. ¿Cómo priorizo leads esta semana?"
                className="min-w-0 flex-1"
              />
              <Button type="submit" disabled={aiLoading} className="w-full shrink-0 sm:w-auto">
                Enviar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {aiFeatures.map((feature) => (
          <Card
            key={feature.name}
            hover={assistantOn}
            className={!assistantOn ? 'opacity-60' : 'cursor-pointer'}
            onClick={() => assistantOn && !aiLoading && feature.onClick?.()}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-xl p-3 ${feature.active ? 'bg-emerald-500/15' : 'bg-slate-500/10'}`}
                >
                  <feature.icon
                    className={`h-6 w-6 ${feature.active ? 'text-emerald-600' : 'text-slate-400'}`}
                  />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
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
