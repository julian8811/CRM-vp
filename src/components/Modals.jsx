import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";

const Overlay = ({ children }) => (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 500, boxShadow: "0 20px 40px rgba(0,0,0,.15)" }} onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

const Input = ({ label, ...props }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{label}</label>
        <input style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box" }} {...props} />
    </div>
);

const Select = ({ label, options, ...props }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{label}</label>
        <select style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff" }} {...props}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

const ModalActions = ({ onCancel }) => (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
        <button type="button" onClick={onCancel} style={{ padding: "10px 18px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        <button type="submit" style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: "#1B3A5C", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Guardar</button>
    </div>
);

export function CustomerModal({ onClose, customer }) {
    const addCustomer = useStore(state => state.addCustomer);
    const updateCustomer = useStore(state => state.updateCustomer);
    const isEditing = !!customer;

    const [form, setForm] = useState({
        name: customer?.name || "",
        company: customer?.company || "",
        email: customer?.email || "",
        phone: customer?.phone || "",
        city: customer?.city || "Medellín",
        customer_type: customer?.customer_type || "corporate",
        score: customer?.score || 50,
        lifetime_value: customer?.lifetime_value || 0,
        purchase_count: customer?.purchase_count || 0
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) updateCustomer(customer.id, form);
        else addCustomer(form);
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Nombre de Contacto" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <Input label="Empresa" required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Correo" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <Input label="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Ciudad" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                    <Select label="Tipo" value={form.customer_type} onChange={e => setForm({ ...form, customer_type: e.target.value })}
                        options={[{ value: "corporate", label: "Corporativo" }, { value: "sme", label: "PYME" }]} />
                </div>
                {!isEditing && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <Input label="Score Inicial (0-100)" type="number" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: parseInt(e.target.value) || 0 })} />
                        <Input label="Valor Histórico ($)" type="number" min="0" value={form.lifetime_value} onChange={e => setForm({ ...form, lifetime_value: parseInt(e.target.value) || 0 })} />
                    </div>
                )}
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}

export function LeadModal({ onClose }) {
    const addLead = useStore(state => state.addLead);
    const [form, setForm] = useState({
        first_name: "", last_name: "", email: "", company: "", source: "web",
        interest: "warm", score: 50, budget: 0, status: "new", assigned: "Sin asignar"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addLead(form);
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>Nuevo Lead</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Nombre" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                    <Input label="Apellido" required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Correo" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <Input label="Empresa" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                    <Select label="Fuente" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                        options={[{ value: "web", label: "Web" }, { value: "referral", label: "Referido" }, { value: "social_media", label: "Redes" }]} />
                    <Select label="Interés" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })}
                        options={[{ value: "hot", label: "Caliente" }, { value: "warm", label: "Tibio" }, { value: "cold", label: "Frío" }]} />
                    <Input label="Presu. ($)" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: parseInt(e.target.value) || 0 })} />
                </div>
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}

export function ProductModal({ onClose, product }) {
    const addProduct = useStore(state => state.addProduct);
    const [form, setForm] = useState({
        sku: "", name: "", category: "Software", price: 0, stock: 0, margin: 0, status: "active"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addProduct(form);
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>Nuevo Producto</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="SKU" required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                    <Input label="Nombre del Producto" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Select label="Categoría" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                        options={[{ value: "Software", label: "Software" }, { value: "Hardware", label: "Hardware" }, { value: "Servicios", label: "Servicios" }, { value: "Capacitación", label: "Capacitación" }]} />
                    <Input label="Precio ($)" type="number" required value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Stock Inicial" type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
                    <Input label="Margen (%)" type="number" value={form.margin} onChange={e => setForm({ ...form, margin: parseInt(e.target.value) || 0 })} />
                </div>
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}

export function QuotationModal({ onClose }) {
    const addQuotation = useStore(state => state.addQuotation);
    const [form, setForm] = useState({
        number: `COT-000${Math.floor(Math.random() * 1000)}`, customer: "", status: "draft", subtotal: 0, tax: 0, total: 0, validity: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addQuotation(form);
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>Nueva Cotización</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Cliente</label>
                        <input required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Subtotal ($)</label>
                        <input type="number" required value={form.subtotal} onChange={e => { const v = parseInt(e.target.value) || 0; setForm({ ...form, subtotal: v, tax: v * 0.19, total: v * 1.19 }); }} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Impuestos Auto ($)</label>
                        <input disabled value={form.tax} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>Total ($)</label>
                        <input disabled value={form.total} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc", fontWeight: 700 }} />
                    </div>
                </div>
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}

export function OrderModal({ onClose }) {
    const addOrder = useStore(state => state.addOrder);
    const [form, setForm] = useState({
        number: `PED-000${Math.floor(Math.random() * 1000)}`, customer: "", status: "preparing", total: 0, carrier: "Servientrega", delivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addOrder(form);
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>Nuevo Pedido</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Cliente</label>
                        <input required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Total ($)</label>
                        <input type="number" required value={form.total} onChange={e => setForm({ ...form, total: parseInt(e.target.value) || 0 })} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Transportadora</label>
                        <select value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box" }}><option value="Servientrega">Servientrega</option><option value="FedEx">FedEx</option></select>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Fecha Entrega</label>
                        <input type="date" value={form.delivery} onChange={e => setForm({ ...form, delivery: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                </div>
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}
