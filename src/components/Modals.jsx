import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";

const modalFieldStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    color: "#0f172a",
    backgroundColor: "#ffffff",
};

const modalDisabledFieldStyle = {
    ...modalFieldStyle,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
};

const Overlay = ({ children }) => (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div
            style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 500,
                boxShadow: "0 20px 40px rgba(0,0,0,.15)",
                color: "#0f172a",
            }}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const Input = ({ label, ...props }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>{label}</label>
        <input style={modalFieldStyle} {...props} />
    </div>
);

const Select = ({ label, options, ...props }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>{label}</label>
        <select style={modalFieldStyle} {...props}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

const ModalActions = ({ onCancel }) => (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
        <button type="button" onClick={onCancel} style={{ padding: "10px 18px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
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
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", color: "#0f172a" }}>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</h2>
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
        interest: "warm", score: 50, budget: 0, status: "new"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addLead(form);
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", color: "#0f172a" }}>Nuevo Lead</h2>
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

export function ProductModal({ onClose }) {
    const addProduct = useStore(state => state.addProduct);
    const [form, setForm] = useState({
        sku: "", name: "", category: "Software", price: "", stock: "", margin: "", status: "active"
    });
    const [submitError, setSubmitError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError("");
        const price = parseFloat(String(form.price).replace(",", "."));
        const stock = parseInt(String(form.stock), 10);
        const margin = parseInt(String(form.margin), 10);
        if (!Number.isFinite(price) || price < 0) {
            setSubmitError("Ingresá un precio válido.");
            return;
        }
        if (!Number.isFinite(stock) || stock < 0) {
            setSubmitError("Ingresá un stock válido (número entero ≥ 0).");
            return;
        }
        let marginClamped = Number.isFinite(margin) ? margin : 0;
        marginClamped = Math.min(100, Math.max(0, marginClamped));
        const payload = {
            sku: form.sku.trim(),
            name: form.name.trim(),
            category: form.category || "Software",
            price,
            stock,
            margin: marginClamped,
            status: form.status || "active",
        };
        const res = await addProduct(payload);
        if (res?.ok) onClose();
        else setSubmitError(res?.error || "No se pudo crear el producto.");
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", color: "#0f172a" }}>Nuevo Producto</h2>
            {submitError && (
                <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 13 }}>
                    {submitError}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="SKU" required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                    <Input label="Nombre del Producto" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Select label="Categoría" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                        options={[{ value: "Software", label: "Software" }, { value: "Hardware", label: "Hardware" }, { value: "Servicios", label: "Servicios" }, { value: "Capacitación", label: "Capacitación" }]} />
                    <Input label="Precio ($)" inputMode="decimal" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Stock Inicial" inputMode="numeric" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                    <Input label="Margen (%)" inputMode="numeric" value={form.margin} onChange={e => setForm({ ...form, margin: e.target.value })} placeholder="0" />
                </div>
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}

export function QuotationModal({ onClose }) {
    const addQuotation = useStore(state => state.addQuotation);
    const customers = useStore(state => state.customers);
    const [form, setForm] = useState({
        number: `COT-${Date.now().toString().slice(-6)}`,
        customer_id: "",
        status: "draft",
        subtotal: 0,
        tax: 0,
        total: 0,
        validity: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.customer_id) return;
        addQuotation(form);
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", color: "#0f172a" }}>Nueva Cotización</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <div style={{ marginBottom: 16, gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Cliente</label>
                        <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} style={modalFieldStyle}>
                            <option value="">Seleccioná un cliente</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
                            ))}
                        </select>
                        {customers.length === 0 && <p style={{ fontSize: 12, color: "#b45309", marginTop: 8 }}>Primero creá un cliente en la pestaña Clientes.</p>}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Subtotal ($)</label>
                        <input inputMode="numeric" required value={form.subtotal === 0 ? "" : String(form.subtotal)} onChange={e => { const raw = e.target.value; const v = raw === "" ? 0 : parseInt(raw, 10) || 0; setForm({ ...form, subtotal: v, tax: v * 0.19, total: v * 1.19 }); }} style={modalFieldStyle} />
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Impuestos Auto ($)</label>
                        <input disabled value={form.tax} style={modalDisabledFieldStyle} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Total ($)</label>
                        <input disabled value={form.total} style={{ ...modalDisabledFieldStyle, fontWeight: 700 }} />
                    </div>
                </div>
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}

export function OrderModal({ onClose }) {
    const addOrder = useStore(state => state.addOrder);
    const customers = useStore(state => state.customers);
    const [form, setForm] = useState({
        number: `PED-${Date.now().toString().slice(-6)}`,
        customer_id: "",
        status: "confirmed",
        total: 0,
        carrier: "Servientrega",
        delivery_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.customer_id) return;
        addOrder(form);
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", color: "#0f172a" }}>Nuevo Pedido</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <div style={{ marginBottom: 16, gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Cliente</label>
                        <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} style={modalFieldStyle}>
                            <option value="">Seleccioná un cliente</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Total ($)</label>
                        <input inputMode="numeric" required value={form.total === 0 ? "" : String(form.total)} onChange={e => { const raw = e.target.value; const v = raw === "" ? 0 : parseInt(raw, 10) || 0; setForm({ ...form, total: v }); }} style={modalFieldStyle} />
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Transportadora</label>
                        <select value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} style={modalFieldStyle}><option value="Servientrega">Servientrega</option><option value="FedEx">FedEx</option></select>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Fecha Entrega</label>
                        <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} style={modalFieldStyle} />
                    </div>
                </div>
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}

export function OpportunityModal({ onClose }) {
    const addPipelineOpportunity = useStore(state => state.addPipelineOpportunity);
    const customers = useStore(state => state.customers);
    const [form, setForm] = useState({
        name: "",
        value: "1000000",
        probability: "50",
        customer_id: "",
        stage: "lead",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        addPipelineOpportunity(form.stage, {
            name: form.name.trim(),
            value: Number(form.value) || 0,
            probability: Number(form.probability) || 50,
            customer_id: form.customer_id || null,
        });
        onClose();
    };

    return (
        <Overlay>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", color: "#0f172a" }}>Nueva Oportunidad</h2>
            <form onSubmit={handleSubmit}>
                <Input label="Nombre de la oportunidad" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    <Input label="Valor ($)" inputMode="numeric" min="0" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                    <Input label="Probabilidad (%)" inputMode="numeric" min="0" max="100" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} />
                </div>
                <Select label="Etapa inicial" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
                    options={[
                        { value: "lead", label: "Lead" },
                        { value: "contact", label: "Contacto" },
                        { value: "qualification", label: "Calificación" },
                        { value: "proposal", label: "Propuesta" },
                        { value: "negotiation", label: "Negociación" },
                    ]}
                />
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Cliente (opcional)</label>
                    <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} style={modalFieldStyle}>
                        <option value="">—</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <ModalActions onCancel={onClose} />
            </form>
        </Overlay>
    );
}
