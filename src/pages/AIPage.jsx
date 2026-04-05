import { Target, TrendingUp, Lightbulb, MessageSquare, Activity, AlertCircle, Brain } from "lucide-react";
import { useState } from "react";

export default function AIPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: "ai", text: "¡Hola! Soy tu asistente comercial de IA. Puedo analizar datos, resumir oportunidades o predecir ventas. ¿En qué te puedo ayudar hoy?" }]);
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMessages([...messages, { role: "user", text: input }]);
        setInput("");

        // Simulate thinking
        setTimeout(() => {
            let reply = "He analizado tus datos. Actualmente parece haber un cuello de botella en la etapa de 'Propuesta'. Te sugiero enviar correos de seguimiento automático a las oportunidades estancadas por más de 7 días.";
            if (messages.length > 2) reply = "¡Entendido! Generaré un informe detallado con las recomendaciones de cross-selling para tus clientes del sector Industrial y te lo enviaré a tu correo.";

            setMessages(prev => [...prev, { role: "ai", text: reply }]);
        }, 1200);
    };

    const features = [
        { icon: Target, title: "Scoring predictivo", desc: "Calificación automática de leads con XGBoost", color: "linear-gradient(135deg,#2563eb,#60a5fa)" },
        { icon: TrendingUp, title: "Pronóstico de ventas", desc: "Proyección a 30, 60 y 90 días con Prophet", color: "linear-gradient(135deg,#059669,#14b8a6)" },
        { icon: Lightbulb, title: "Recomendación de productos", desc: "Cross-selling y up-selling inteligente", color: "linear-gradient(135deg,#d97706,#f59e0b)" },
        { icon: MessageSquare, title: "Asistente comercial IA", desc: "Consultas en lenguaje natural con Claude", color: "linear-gradient(135deg,#7c3aed,#a78bfa)" },
        { icon: Activity, title: "Análisis de sentimiento", desc: "NLP en notas e interacciones del cliente", color: "linear-gradient(135deg,#ec4899,#f472b6)" },
        { icon: AlertCircle, title: "Alertas de churn", desc: "Detección de clientes en riesgo de pérdida", color: "linear-gradient(135deg,#dc2626,#f87171)" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>IA Comercial</h1>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>Inteligencia artificial aplicada a ventas</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
                {features.map((f, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 18, padding: 22, border: "1px solid #f1f5f9", transition: "all .25s", cursor: "default" }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                        <div style={{ background: f.color, width: 44, height: 44, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: "0 4px 14px rgba(0,0,0,.15)" }}>
                            <f.icon size={20} color="#fff" />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{f.title}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                ))}
            </div>

            {!isOpen ? (
                <div style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 18, padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Brain size={28} color="#fff" /></div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 2 }}>Asistente comercial IA</div>
                        <div style={{ fontSize: 12, color: "#c4b5fd" }}>Consulta tu pipeline, clientes y métricas en lenguaje natural</div>
                    </div>
                    <button onClick={() => setIsOpen(true)} style={{ background: "#fff", color: "#6d28d9", border: "none", padding: "10px 22px", borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Abrir chat</button>
                </div>
            ) : (
                <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", height: 400, overflow: "hidden" }}>
                    <div style={{ background: "#f8fafc", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}><Brain size={16} color="#fff" /></div>
                            <span style={{ fontWeight: 700, color: "#1e293b" }}>Asistente IA</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontWeight: 600 }}>Cerrar</button>
                    </div>
                    <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.role === "ai" ? "flex-start" : "flex-end", maxWidth: "80%" }}>
                                <div style={{ background: m.role === "ai" ? "#f1f5f9" : "#1B3A5C", color: m.role === "ai" ? "#1e293b" : "#fff", padding: "12px 16px", borderRadius: 16, borderBottomLeftRadius: m.role === "ai" ? 0 : 16, borderBottomRightRadius: m.role === "user" ? 0 : 16, fontSize: 13, lineHeight: 1.5 }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Pregúntale algo a tu CRM..." style={{ flex: 1, padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 24, outline: "none", fontSize: 13 }} />
                        <button type="submit" disabled={!input.trim()} style={{ background: "#7c3aed", color: "#fff", border: "none", width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "not-allowed", opacity: input.trim() ? 1 : 0.5 }}>
                            <MessageSquare size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
