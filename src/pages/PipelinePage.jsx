import { useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { useStore } from "../store/useStore";
import { STAGE_META, fmt, Avatar } from "../components/Shared";

export default function PipelinePage() {
    const pipeline = useStore(state => state.pipeline);
    const movePipelineOpportunity = useStore(state => state.movePipelineOpportunity);
    const stages = ["lead", "contact", "qualification", "proposal", "negotiation", "closed_won"];

    const [dragItem, setDragItem] = useState(null);
    const [dragOver, setDragOver] = useState(null);

    const handleDragStart = (opp, fromStage) => setDragItem({ opp, fromStage });
    const handleDrop = (toStage) => {
        if (!dragItem || dragItem.fromStage === toStage) { setDragItem(null); setDragOver(null); return; }
        movePipelineOpportunity(dragItem.opp.id, dragItem.fromStage, toStage);
        setDragItem(null); setDragOver(null);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>Embudo de ventas</h1>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>Arrastra las oportunidades entre etapas</p>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                {stages.map(stg => {
                    const opps = pipeline[stg] || [];
                    const total = opps.reduce((s, o) => s + o.value, 0);
                    const isOver = dragOver === stg;
                    return (
                        <div key={stg} style={{ minWidth: 230, maxWidth: 230, background: isOver ? "#eff6ff" : "#f8fafc", borderRadius: 18, border: isOver ? "2px solid #60a5fa" : "2px solid transparent", transition: "all .2s", flexShrink: 0 }}
                            onDragOver={e => { e.preventDefault(); setDragOver(stg); }} onDragLeave={() => setDragOver(null)} onDrop={() => handleDrop(stg)}>
                            <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_META[stg]?.color }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{STAGE_META[stg]?.label}</span>
                                    <span style={{ background: "#fff", color: "#64748b", fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>{opps.length}</span>
                                </div>
                                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{fmt(total)}</span>
                            </div>
                            <div style={{ padding: "0 8px 12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 200 }}>
                                {opps.map(o => (
                                    <div key={o.id} draggable onDragStart={() => handleDragStart(o, stg)}
                                        style={{ background: "#fff", borderRadius: 14, padding: 14, border: "1px solid #f1f5f9", cursor: "grab", transition: "all .2s", boxShadow: "0 1px 4px rgba(0,0,0,.03)" }}
                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.03)"; e.currentTarget.style.transform = "none"; }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 4, lineHeight: 1.3 }}>{o.name}</div>
                                        {o.customer && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{o.customer}</div>}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: "#1B3A5C" }}>{fmt(o.value)}</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: o.probability >= 70 ? "#059669" : o.probability >= 40 ? "#d97706" : "#ef4444" }}>{o.probability}%</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid #f8fafc" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94a3b8" }}>
                                                <Clock size={11} /> {o.days}d
                                                {o.days > 7 && <AlertTriangle size={11} color="#f59e0b" />}
                                            </div>
                                            <Avatar name={o.assignee} size={22} />
                                        </div>
                                    </div>
                                ))}
                                {opps.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "#cbd5e1" }}>Sin oportunidades</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
