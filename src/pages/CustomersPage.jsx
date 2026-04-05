import { useState } from "react";
import { Plus, Search, MapPin, Building2, Edit2, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { Avatar, Badge, ScoreBar, fmt } from "../components/Shared";
import { CustomerModal } from "../components/Modals";

export default function CustomersPage() {
    const [search, setSearch] = useState("");
    const customers = useStore(state => state.customers);
    const deleteCustomer = useStore(state => state.deleteCustomer);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const filtered = customers.filter(c => !search || [c.name, c.company, c.email].some(f => f?.toLowerCase().includes(search.toLowerCase())));

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>Clientes</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>{filtered.length} clientes registrados</p>
                </div>
                <button onClick={handleCreate} style={{ background: "#1B3A5C", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={15} /> Nuevo cliente
                </button>
            </div>
            <div style={{ position: "relative", width: 280 }}>
                <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar clientes..."
                    style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", background: "#fff" }} />
            </div>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                                {["Cliente", "Empresa", "Ciudad", "Tipo", "Score", "Valor total", "Acciones"].map(h => (
                                    <th key={h} style={{ textAlign: h === "Score" || h === "Valor total" || h === "Acciones" ? "right" : "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} style={{ borderBottom: "1px solid #f8fafc" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "10px 14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <Avatar name={c.name} size={32} />
                                            <div><div style={{ fontWeight: 600, color: "#1e293b" }}>{c.name}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{c.email}</div></div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}><div style={{ display: "flex", alignItems: "center", gap: 4 }}><Building2 size={13} color="#94a3b8" />{c.company}</div></td>
                                    <td style={{ padding: "10px 14px", color: "#475569" }}><div style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} color="#94a3b8" />{c.city}</div></td>
                                    <td style={{ padding: "10px 14px" }}><Badge variant="gray">{c.customer_type === "sme" ? "PYME" : "Corporativo"}</Badge></td>
                                    <td style={{ padding: "10px 14px", textAlign: "right" }}><ScoreBar score={c.score} /></td>
                                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600 }}>{fmt(c.lifetime_value)}</td>
                                    <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>
                                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                            <button onClick={() => handleEdit(c)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#3b82f6" }}><Edit2 size={15} /></button>
                                            <button onClick={() => deleteCustomer(c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No hay clientes para mostrar</div>}
                </div>
            </div>

            {isModalOpen && <CustomerModal onClose={() => setIsModalOpen(false)} customer={editingCustomer} />}
        </div>
    );
}
