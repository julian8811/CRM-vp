import { DollarSign, Percent, ShoppingCart, UserPlus, Target, TrendingUp, BarChart3, Zap, Clock, AlertTriangle, Package, Brain, Activity, Lightbulb, MessageSquare, AlertCircle, Star } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export const fmt = (v) => v == null ? "$0" : "$" + Math.round(v).toLocaleString("es-CO");
export const fmtM = (v) => "$" + (v / 1e6).toFixed(0) + "M";
export const cn = (...c) => c.filter(Boolean).join(" ");
export const initials = (n) => n ? n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";

export const STAGE_META = {
    lead: { label: "Lead", color: "#94a3b8", bg: "bg-slate-100" },
    contact: { label: "Contacto", color: "#60a5fa", bg: "bg-blue-100" },
    qualification: { label: "Calificación", color: "#818cf8", bg: "bg-indigo-100" },
    proposal: { label: "Propuesta", color: "#a78bfa", bg: "bg-violet-100" },
    negotiation: { label: "Negociación", color: "#f59e0b", bg: "bg-amber-100" },
    closed_won: { label: "Ganada", color: "#10b981", bg: "bg-emerald-100" },
};

export const SOURCE_LABELS = { web: "Web", referral: "Referido", social_media: "Redes", trade_show: "Feria", email_campaign: "Email", chatbot: "Chatbot" };
export const STATUS_LABELS = { new: "Nuevo", contacted: "Contactado", qualified: "Calificado", converted: "Convertido", lost: "Perdido" };

export const Avatar = ({ name, size = 32 }) => {
    const colors = ["#1B3A5C", "#2E75B6", "#10b981", "#f59e0b", "#a78bfa", "#ec4899", "#14b8a6"];
    const idx = name ? name.charCodeAt(0) % colors.length : 0;
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: colors[idx], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
            {initials(name)}
        </div>
    );
};

export const Badge = ({ children, variant = "gray" }) => {
    const styles = {
        gray: { background: "#f1f5f9", color: "#475569" },
        blue: { background: "#eff6ff", color: "#1d4ed8" },
        green: { background: "#ecfdf5", color: "#047857" },
        red: { background: "#fef2f2", color: "#b91c1c" },
        amber: { background: "#fffbeb", color: "#b45309" },
        purple: { background: "#faf5ff", color: "#7c3aed" },
        indigo: { background: "#eef2ff", color: "#4338ca" },
    };
    return <span style={{ ...styles[variant], padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>;
};

export const StatCard = ({ icon: Icon, label, value, change, color }) => {
    const IconComponent = Icon;
    const gradients = {
        blue: "linear-gradient(135deg, #1B3A5C, #2E75B6)",
        green: "linear-gradient(135deg, #059669, #14b8a6)",
        amber: "linear-gradient(135deg, #d97706, #f59e0b)",
        purple: "linear-gradient(135deg, #7c3aed, #a78bfa)",
        info: "linear-gradient(135deg, #2563eb, #60a5fa)",
    };
    return (
        <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #f1f5f9", transition: "box-shadow .2s", cursor: "default" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.06)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ background: gradients[color], padding: 10, borderRadius: 14, boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}>
                    <IconComponent size={18} color="#fff" />
                </div>
                {change != null && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: change >= 0 ? "#ecfdf5" : "#fef2f2", color: change >= 0 ? "#047857" : "#dc2626" }}>
                        {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
                    </span>
                )}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{label}</div>
        </div>
    );
};

export const ScoreBar = ({ score }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 36, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${score}%`, background: score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{score}</span>
    </div>
);

export function GenericPage({ icon: Icon, title, subtitle, children }) {
    const IconComponent = Icon;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>{title}</h1>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>{subtitle}</p></div>
            {children || (
                <div style={{ background: "#fff", borderRadius: 18, padding: 48, textAlign: "center", border: "1px solid #f1f5f9" }}>
                    <IconComponent size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", maxWidth: 340, margin: "0 auto" }}>{subtitle}</div>
                </div>
            )}
        </div>
    );
}
