import { useState } from "react";
import { Plus, ArrowRightCircle } from "lucide-react";
import { useStore } from "../store/useStore";
import { Avatar, Badge, fmt, SOURCE_LABELS, STATUS_LABELS } from "../components/Shared";
import { LeadModal } from "../components/Modals";

export default function LeadsPage() {
    const leads = useStore(state => state.leads);
    const convertLead = useStore(state => state.convertLead);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const interestBadge = { hot: { v: "red", t: "🔥 Caliente" }, warm: { v: "amber", t: "🌤 Tibio" }, cold: { v: "blue", t: "❄️ Frío" } };
    const statusBadge = { new: "blue", contacted: "amber", qualified: "green", converted: "purple", lost: "gray" };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>Leads</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>{leads.length} leads registrados</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} style={{ background: "#1B3A5C", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={15} /> Nuevo lead
                </button>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                                {["Lead", "Empresa", "Fuente", "Interés", "Estado", "Score", "Presupuesto", "Acciones"].map(h => (
                                    <th key={h} style={{ textAlign: h === "Score" || h === "Presupuesto" ? "right" : h === "Interés" || h === "Estado" || h === "Acciones" ? "center" : "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(l => (
                                <tr key={l.id} style={{ borderBottom: "1px solid #f8fafc" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "10px 14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <Avatar name={`${l.first_name} ${l.last_name}`} size={30} />
                                            <div><div style={{ fontWeight: 600, color: "#1e293b" }}>{l.first_name} {l.last_name}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{l.email}</div></div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}>{l.company}</td>
                                    <td style={{ padding: "10px 14px" }}><Badge variant="gray">{SOURCE_LABELS[l.source] || l.source}</Badge></td>
                                    <td style={{ padding: "10px 14px", textAlign: "center" }}><Badge variant={interestBadge[l.interest]?.v || "gray"}>{interestBadge[l.interest]?.t || l.interest}</Badge></td>
                                    <td style={{ padding: "10px 14px", textAlign: "center" }}><Badge variant={statusBadge[l.status]}>{STATUS_LABELS[l.status] || l.status}</Badge></td>
                                    <td style={{ padding: "10px 14px", textAlign: "right" }}><span style={{ fontWeight: 700, color: l.score >= 70 ? "#059669" : l.score >= 40 ? "#d97706" : "#94a3b8" }}>{l.score}</span></td>
                                    <td style={{ padding: "10px 14px", textAlign: "right", color: "#475569" }}>{l.budget ? fmt(l.budget) : "—"}</td>
                                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                        {l.status !== "converted" ? (
                                            <button onClick={() => convertLead(l.id)}
                                                style={{ background: "#ecfdf5", color: "#047857", border: "none", padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                <ArrowRightCircle size={13} /> Convertir
                                            </button>
                                        ) : <Badge variant="purple">Convertido ✓</Badge>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {leads.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No hay leads para mostrar</div>}
                </div>
            </div>
            {isModalOpen && <LeadModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}
