-- ============================================
-- CRM-VP Database Schema for Supabase
-- Ejecutar este SQL en SQL Editor de Supabase
-- ============================================

-- ============================================
-- 1. EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. TABLA: PROFILES (extiende auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'manager', 'sales')),
    team TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABLA: CUSTOMERS
-- ============================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    city TEXT DEFAULT 'Medellín',
    customer_type TEXT DEFAULT 'corporate' CHECK (customer_type IN ('sme', 'corporate')),
    score INT DEFAULT 50 CHECK (score >= 0 AND score <= 100),
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    purchase_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLA: LEADS
-- ============================================
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    source TEXT DEFAULT 'web' CHECK (source IN ('web', 'referral', 'social_media', 'trade_show', 'email_campaign', 'chatbot')),
    interest TEXT DEFAULT 'warm' CHECK (interest IN ('hot', 'warm', 'cold')),
    score INT DEFAULT 50 CHECK (score >= 0 AND score <= 100),
    budget DECIMAL(15,2),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABLA: OPPORTUNITIES (Pipeline)
-- ============================================
CREATE TABLE public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'contact', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    value DECIMAL(15,2) DEFAULT 0,
    probability INT DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    days_in_stage INT DEFAULT 0,
    assignee_id UUID REFERENCES public.profiles(id),
    expected_close DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABLA: PRODUCTS
-- ============================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Software' CHECK (category IN ('Software', 'Hardware', 'Servicios', 'Capacitación')),
    price DECIMAL(15,2) NOT NULL,
    discount_price DECIMAL(15,2),
    stock INT DEFAULT 0,
    margin INT DEFAULT 0 CHECK (margin >= 0 AND margin <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABLA: QUOTATIONS
-- ============================================
CREATE TABLE public.quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'reviewed', 'rejected')),
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    validity DATE,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TABLA: ORDERS
-- ============================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'preparing', 'shipped', 'delivered', 'returned')),
    total DECIMAL(15,2) DEFAULT 0,
    carrier TEXT,
    delivery_date DATE,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. TABLA: ACTIVITY_LOG (Auditoría)
-- ============================================
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'stage_changed', 'converted')),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. ÍNDICES PARA RENDIMIENTO
-- ============================================
CREATE INDEX idx_leads_user ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_customers_user ON customers(user_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_user ON opportunities(user_id);
CREATE INDEX idx_quotations_user ON quotations(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);

-- ============================================
-- 11. RLS POLICIES (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Todos pueden leer su propio perfil
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- CUSTOMERS POLICIES
-- ============================================
-- Admins ven todos los customers
CREATE POLICY "Admins can view all customers" ON public.customers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- Vendedores ven solo sus customers
CREATE POLICY "Sales can view own customers" ON public.customers
    FOR SELECT USING (user_id = auth.uid());

-- Cualquier usuario logueado puede crear customers (se asigna automáticamente)
CREATE POLICY "Authenticated can create customers" ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Owners pueden actualizar sus customers
CREATE POLICY "Owners can update customers" ON public.customers
    FOR UPDATE USING (user_id = auth.uid());

-- Owners pueden borrar sus customers
CREATE POLICY "Owners can delete customers" ON public.customers
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- LEADS POLICIES
-- ============================================
CREATE POLICY "Admins can view all leads" ON public.leads
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Users can view own leads" ON public.leads
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated can create leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update leads" ON public.leads
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Owners can delete leads" ON public.leads
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- OPPORTUNITIES POLICIES
-- ============================================
CREATE POLICY "Admins can view all opportunities" ON public.opportunities
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Users can view own opportunities" ON public.opportunities
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated can create opportunities" ON public.opportunities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update opportunities" ON public.opportunities
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Owners can delete opportunities" ON public.opportunities
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- PRODUCTS POLICIES
-- ============================================
-- Productos son públicos para lectura (catalog)
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (status = 'active');

-- Admins: gestión completa (SELECT/INSERT/UPDATE/DELETE)
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Usuarios logueados (JWT) pueden crear filas en el catálogo; anon sin sesión no (auth.uid() IS NULL).
-- TO public + WITH CHECK (auth.uid() IS NOT NULL) encaja con el cliente Supabase (anon key + sesión).
CREATE POLICY "Authenticated users can insert products" ON public.products
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- QUOTATIONS POLICIES
-- ============================================
CREATE POLICY "Admins can view all quotations" ON public.quotations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Users can view own quotations" ON public.quotations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated can create quotations" ON public.quotations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update quotations" ON public.quotations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Owners can delete quotations" ON public.quotations
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- ORDERS POLICIES
-- ============================================
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update orders" ON public.orders
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- ACTIVITY_LOG POLICIES
-- ============================================
CREATE POLICY "Admins can view all activity" ON public.activity_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "Users can view own activity" ON public.activity_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated can create activity" ON public.activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 12. TRIGGER: Auto-crear perfil al registrarse
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 13. FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 14. INSERTAR USUARIO ADMIN DE EJEMPLO (para testing)
-- ============================================
-- NOTA: Este usuario es de ejemplo. Después de registrarte en la app,
-- tu usuario automáticamente tendrá un perfil creado por el trigger.
-- Para testing, puedes insertar datos directamente:

-- INSERT INTO public.profiles (id, first_name, last_name, role, team)
-- VALUES ('tu-user-id-aqui', 'Admin', 'Sistema', 'admin', 'Ventas Corp');

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
