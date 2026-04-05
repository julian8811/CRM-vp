import { Target, TrendingUp, BarChart3, Zap, Users, DollarSign, ShoppingCart, Percent, UserPlus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { useStore } from "../store/useStore";
import { StatCard, fmt, fmtM, STAGE_META, Avatar } from "../components/Shared";
import { SALES_TREND } from "../data/mockData";
import { CustomerModal, LeadModal, QuotationModal, OrderModal } from "../components/Modals";

export default function DashboardPage({ user }) {
    const [activeModal, setActiveModal] = useState(null);
    const pipeline = useStore(state => state.pipeline) || {};
    const pipelineSummary = Object.entries(pipeline).map(([stage, opps]) => ({
        stage, count: opps?.length || 0, value: (opps || []).reduce((s, o) => s + (o.value || 0), 0),
    }));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>Hola, {user.first_name} 👋</h1>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Resumen de tu gestión comercial — Marzo 2026</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                <StatCard icon={DollarSign} label="Ventas del mes" value={fmt(165000000)} change={50} color="blue" />
                <StatCard icon={Percent} label="Tasa conversión" value="12.5%" color="green" />
                <StatCard icon={ShoppingCart} label="Ticket promedio" value={fmt(20625000)} color="info" />
                <StatCard icon={UserPlus} label="Leads nuevos" value="7" color="amber" />
                <StatCard icon={Target} label="Pipeline ponderado" value={fmt(98750000)} color="purple" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Tendencia de ventas</h3>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>Últimos 6 meses</p>
                        </div>
                        <TrendingUp size={18} color="#2E75B6" />
                    </div>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={SALES_TREND}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => fmtM(v)} />
                                <Tooltip formatter={v => [fmt(v), "Ventas"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                                <Line type="monotone" dataKey="amount" stroke="#2E75B6" strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: "#2E75B6", strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Embudo de ventas</h3>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{Object.values(pipeline).reduce((acc, stage) => acc + stage.length, 0)} oportunidades activas</p>
                        </div>
                        <BarChart3 size={18} color="#2E75B6" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {pipelineSummary.filter(s => s.stage !== "closed_lost").map(s => {
                            const maxC = Math.max(...pipelineSummary.map(p => p.count), 1);
                            return (
                                <div key={s.stage}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                                        <span style={{ fontWeight: 600, color: "#334155" }}>{STAGE_META[s.stage]?.label || s.stage}</span>
                                        <span style={{ color: "#94a3b8" }}>{s.count} · {fmt(s.value)}</span>
                                    </div>
                                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                                        <div style={{ height: "100%", borderRadius: 3, width: `${(s.count / maxC) * 100}%`, background: STAGE_META[s.stage]?.color || "#94a3b8", transition: "width .5s" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Top vendedores del mes</h3>
                        <Zap size={18} color="#f59e0b" />
                    </div>
                    {[{ name: "María López", deals: 3, total: 143000000 }, { name: "Andrés Martínez", deals: 2, total: 72000000 }, { name: "Laura Ramírez", deals: 1, total: 27500000 }].map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid #f8fafc" : "none" }}>
                            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#64748b" }}>{i + 1}</span>
                            <Avatar name={s.name} size={28} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.deals} cierres</div>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>{fmt(s.total)}</span>
                        </div>
                    ))}
                </div>

                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #f1f5f9" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Acciones rápidas</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[
                            { id: "customer", icon: Users, label: "Nuevo cliente", grad: "linear-gradient(135deg,#2563eb,#3b82f6)" },
                            { id: "lead", icon: Target, label: "Nuevo lead", grad: "linear-gradient(135deg,#059669,#10b981)" },
                            { id: "quote", icon: DollarSign, label: "Nueva cotización", grad: "linear-gradient(135deg,#7c3aed,#a78bfa)" },
                            { id: "order", icon: ShoppingCart, label: "Nuevo pedido", grad: "linear-gradient(135deg,#d97706,#f59e0b)" },
                        ].map(a => (
                            <div key={a.label} onClick={() => setActiveModal(a.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, border: "1px solid #f1f5f9", cursor: "pointer", transition: "all .2s" }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                                <div style={{ background: a.grad, padding: 10, borderRadius: 12, boxShadow: "0 4px 10px rgba(0,0,0,.12)" }}>
                                    <a.icon size={16} color="#fff" />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{a.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {activeModal === "customer" && <CustomerModal onClose={() => setActiveModal(null)} />}
            {activeModal === "lead" && <LeadModal onClose={() => setActiveModal(null)} />}
            {activeModal === "quote" && <QuotationModal onClose={() => setActiveModal(null)} />}
            {activeModal === "order" && <OrderModal onClose={() => setActiveModal(null)} />}
        </div>
    );
}
