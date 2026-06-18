import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Loader2, Sparkles, Bot, TrendingUp, Target, Mail,
  Lightbulb, AlertTriangle, MessageSquare, Send, Zap,
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
      desc: 'Priorizá oportunidades por etapa del pipeline.',
      icon: TrendingUp,
      color: 'text-stitch-primary-bright',
      onClick: () =>
        appendExchange(`Tengo ${pipelineCount} oportunidades en el pipeline. ¿Cómo priorizo el cierre este mes?`),
    },
    {
      name: 'Scoring automático',
      desc: 'Priorizá leads según señales del CRM.',
      icon: Target,
      color: 'text-stitch-success',
      onClick: () =>
        appendExchange(`Tengo ${leads?.length || 0} leads. ¿Qué criterios uso para priorizar los más calientes?`),
    },
    {
      name: 'Asistente de email',
      desc: 'Borradores y tono con Gemini.',
      icon: Mail,
      color: 'text-stitch-warning',
      onClick: () =>
        appendExchange('Redactá un email breve de seguimiento comercial B2B, tono profesional y cercano.'),
    },
    {
      name: 'Análisis de conversaciones',
      desc: 'Resume tickets y mensajes del CRM.',
      icon: MessageSquare,
      color: 'text-stitch-primary',
      onClick: runConversationAnalysis,
    },
    {
      name: 'Recomendaciones de productos',
      desc: 'Sugerencias según contexto comercial.',
      icon: Lightbulb,
      color: 'text-violet-400',
      onClick: () =>
        appendExchange('¿Cómo recomiendo productos del catálogo según etapa del embudo y tipo de cliente?'),
    },
    {
      name: 'Alertas de churn',
      desc: 'Señales de riesgo con datos del CRM.',
      icon: AlertTriangle,
      color: 'text-stitch-danger',
      onClick: () =>
        appendExchange('¿Qué señales de churn debería monitorear en clientes y pedidos de este CRM?'),
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stitch-text tracking-tight">IA Comercial</h2>
        <p className="text-sm text-stitch-muted mt-1">
          Asistente con Google Gemini. Activá el assistant y usá el chat o las tarjetas rápidas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[480px]">
        <div className="lg:col-span-5 stitch-glass rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-stitch-primary-bright/5 rounded-xl blur-3xl -z-10 group-hover:bg-stitch-primary-bright/10 transition-colors duration-700" />
          <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-stitch-primary/30 stitch-pulse-ring" />
            <div className="absolute inset-0 rounded-full border border-stitch-primary/20 stitch-pulse-ring" style={{ animationDelay: '0.5s' }} />
            <div className="w-20 h-20 bg-stitch-surface-elevated rounded-full border border-stitch-border flex items-center justify-center shadow-glow z-10">
              <Bot className="w-10 h-10 text-stitch-primary-bright" />
            </div>
          </div>
          <h3 className="text-4xl font-bold stitch-ai-gradient mb-2">CRM AI</h3>
          <p className="text-sm text-stitch-muted max-w-xs mb-8">
            {assistantOn
              ? 'Motor de inteligencia comercial activo. Analizá pipelines, redactá comunicaciones y predice cierres.'
              : 'Activá el asistente para habilitar el chat y las acciones rápidas.'}
          </p>
          <Button
            type="button"
            onClick={toggleAssistant}
            className={assistantOn
              ? 'bg-stitch-surface-elevated border border-stitch-border text-stitch-text hover:bg-stitch-surface'
              : 'bg-stitch-primary-bright text-[#031427] hover:bg-stitch-primary'}
          >
            <Zap className="h-4 w-4" />
            {assistantOn ? 'Desactivar assistant' : 'Activar Assistant'}
          </Button>
        </div>

        <div className={`lg:col-span-7 stitch-panel flex flex-col overflow-hidden ${!assistantOn ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="px-6 py-4 border-b border-stitch-border flex justify-between items-center bg-stitch-surface/50">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-stitch-primary-bright animate-pulse" />
              <span className="text-xs font-mono text-stitch-text uppercase tracking-widest">Sesión activa</span>
            </div>
            <Sparkles className="w-4 h-4 text-stitch-primary-bright" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[280px] max-h-[360px] custom-scrollbar">
            {aiMessages.length === 0 ? (
              <div className="flex gap-4 max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-stitch-surface border border-stitch-primary/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-stitch-primary-bright" />
                </div>
                <div className="stitch-glass p-4 rounded-xl rounded-tl-none">
                  <p className="text-sm text-stitch-text">
                    Hola. Soy tu asistente comercial. Preguntame sobre el pipeline, leads o pedí un borrador de email.
                  </p>
                </div>
              </div>
            ) : (
              aiMessages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex gap-4 max-w-[85%] ml-auto justify-end">
                    <div className="bg-stitch-surface-elevated border border-stitch-border/30 p-4 rounded-xl rounded-tr-none">
                      <p className="text-sm text-stitch-text">{m.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-4 max-w-[90%]">
                    <div className="w-8 h-8 rounded-full bg-stitch-surface border border-stitch-primary/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-stitch-primary-bright" />
                    </div>
                    <div className="stitch-glass p-4 rounded-xl rounded-tl-none">
                      <p className="text-sm text-stitch-text whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                )
              )
            )}
            {aiLoading && (
              <div className="flex items-center gap-2 text-stitch-muted text-sm pl-12">
                <Loader2 className="h-4 w-4 animate-spin" /> Pensando…
              </div>
            )}
            {aiErr && (
              <p className="text-sm text-stitch-danger pl-12">{aiErr}</p>
            )}
          </div>

          <form onSubmit={sendAi} className="p-4 bg-stitch-surface-elevated border-t border-stitch-border">
            <div className="relative flex items-center gap-2">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Escribí una pregunta o comando…"
                className="flex-1 bg-[#05070a] border-stitch-border/40 text-stitch-text pr-12"
                disabled={!assistantOn || aiLoading}
              />
              <Button
                type="submit"
                disabled={!assistantOn || aiLoading || !aiInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-stitch-primary-bright/10 text-stitch-primary-bright hover:bg-stitch-primary-bright hover:text-[#031427]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiFeatures.map((feature) => (
          <button
            key={feature.name}
            type="button"
            disabled={!assistantOn || aiLoading}
            onClick={() => feature.onClick?.()}
            className={`stitch-panel p-5 text-left transition-all hover:border-stitch-primary-bright/30 hover:shadow-glow group ${
              !assistantOn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-stitch-surface-elevated border border-stitch-border/30 flex items-center justify-center group-hover:border-stitch-primary-bright/50 transition-colors shrink-0">
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-stitch-text flex items-center gap-2">
                  {feature.name}
                  {assistantOn && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stitch-success/10 text-stitch-success border border-stitch-success/20">
                      ON
                    </span>
                  )}
                </h3>
                <p className="text-sm text-stitch-muted mt-1">{feature.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
