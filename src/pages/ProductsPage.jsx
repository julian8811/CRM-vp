import { useState } from "react";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { useStore } from "../store/useStore";
import { Badge, fmt } from "../components/Shared";
import { ProductModal } from "../components/Modals";

export default function ProductsPage() {
    const products = useStore(state => state.products);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>Productos</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>{products.length} productos en catálogo</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} style={{ background: "#1B3A5C", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={15} /> Nuevo producto
                </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                {products.map(p => (
                    <div key={p.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", transition: "all .2s" }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.07)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                        <div style={{ height: 100, background: "linear-gradient(135deg, #f8fafc, #eef2ff)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            <Package size={36} color="#cbd5e1" />
                            {p.stock <= 5 && <div style={{ position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}><AlertTriangle size={10} /> Stock bajo</div>}
                            <div style={{ position: "absolute", top: 8, left: 8 }}><Badge variant="green">Activo</Badge></div>
                        </div>
                        <div style={{ padding: 14 }}>
                            <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginBottom: 4 }}>{p.sku}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 8, lineHeight: 1.3, minHeight: 34 }}>{p.name}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                                {p.discount_price ? (
                                    <>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#1B3A5C" }}>{fmt(p.discount_price)}</span>
                                        <span style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>{fmt(p.price)}</span>
                                    </>
                                ) : <span style={{ fontSize: 16, fontWeight: 800, color: "#1B3A5C" }}>{fmt(p.price)}</span>}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                                <span>Stock: <strong style={{ color: p.stock <= 5 ? "#ef4444" : "#334155" }}>{p.stock}</strong></span>
                                <span>Margen: {p.margin}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <ProductModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
}
