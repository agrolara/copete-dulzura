-- ==============================================================================
-- SCRIPT DE MIGRACIÓN Y ESQUEMA DE BASE DE DATOS PARA COPETE & DULZURA
-- Supabase Self-Hosted / PostgreSQL
-- Tablas completamente independientes (prefijo cd_) para aislamiento total
-- ==============================================================================

-- 1. TABLA DE PERFILES DE USUARIO (ADMIN Y CLIENTES)
CREATE TABLE IF NOT EXISTS public.cd_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para nuevo usuario registrado en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_cd_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.cd_profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_cd ON auth.users;
CREATE TRIGGER on_auth_user_created_cd
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_cd_user();

-- 2. TABLA DE PRODUCTOS (COPETES Y REPOSTERÍA)
CREATE TABLE IF NOT EXISTS public.cd_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Tortas & Cheesecakes',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    cost_price NUMERIC(10, 2) DEFAULT 0 CHECK (cost_price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock_alert INT DEFAULT 5 CHECK (min_stock_alert >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE PROMOCIONES (PACKS DULZURA & COPETES)
CREATE TABLE IF NOT EXISTS public.cd_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    promo_price NUMERIC(10, 2) NOT NULL CHECK (promo_price >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA INTERMEDIA PRODUCTOS EN PROMOCIONES
CREATE TABLE IF NOT EXISTS public.cd_promotion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES public.cd_promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.cd_products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE(promotion_id, product_id)
);

-- 5. TABLA DE VENTAS
CREATE TABLE IF NOT EXISTS public.cd_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    payment_method TEXT DEFAULT 'transferencia' CHECK (payment_method IN ('transferencia', 'efectivo')),
    subtotal_amount NUMERIC(10, 2) DEFAULT 0 CHECK (subtotal_amount >= 0),
    discount_type TEXT DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed')),
    discount_value NUMERIC(10, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA DE DETALLE DE VENTAS
CREATE TABLE IF NOT EXISTS public.cd_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.cd_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.cd_products(id) ON DELETE SET NULL,
    promotion_id UUID REFERENCES public.cd_promotions(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    cost_price NUMERIC(10, 2) DEFAULT 0,
    item_name TEXT NOT NULL
);

-- 7. TABLA DE FACTURAS DE ABASTECIMIENTO (COMPRAS A PROVEEDORES)
CREATE TABLE IF NOT EXISTS public.cd_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    supplier_rut TEXT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'transferencia' CHECK (payment_method IN ('transferencia', 'efectivo')),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLA DE DETALLE DE FACTURAS
CREATE TABLE IF NOT EXISTS public.cd_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.cd_invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.cd_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    cost_price NUMERIC(10, 2) NOT NULL CHECK (cost_price >= 0),
    total_cost NUMERIC(10, 2) NOT NULL CHECK (total_cost >= 0),
    selling_price NUMERIC(10, 2),
    is_new_product BOOLEAN DEFAULT FALSE
);

-- 9. TABLA DE GASTOS OPERACIONALES
CREATE TABLE IF NOT EXISTS public.cd_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL DEFAULT 'transferencia' CHECK (payment_method IN ('transferencia', 'efectivo')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLA DE KARDEX Y MOVIMIENTOS DE INVENTARIO
CREATE TABLE IF NOT EXISTS public.cd_inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.cd_products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in_purchase', 'out_sale', 'adjustment_manual', 'waste_expired', 'waste_damaged', 'physical_count')),
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. FUNCIÓN RPC PARA CHECKOUT ATÓMICO Y DESCUENTO DE STOCK
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_cd_sale(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_delivery_address TEXT,
    p_payment_method TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_total_amount NUMERIC(10, 2) := 0;
    v_item JSONB;
    v_promo_item RECORD;
    v_current_stock INT;
    v_product_name TEXT;
    v_cost_price NUMERIC(10, 2);
    v_required_qty INT;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'El carrito de compras no puede estar vacío.';
    END IF;

    -- Calcular total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_amount := v_total_amount + ((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC);
    END LOOP;

    -- Insertar venta
    INSERT INTO public.cd_sales (
        customer_name,
        customer_phone,
        delivery_address,
        payment_method,
        total_amount,
        status
    )
    VALUES (
        p_customer_name,
        p_customer_phone,
        p_delivery_address,
        COALESCE(p_payment_method, 'transferencia'),
        v_total_amount,
        'completed'
    )
    RETURNING id INTO v_sale_id;

    -- Procesar ítems
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF (v_item->>'type') = 'product' THEN
            SELECT stock, name, cost_price INTO v_current_stock, v_product_name, v_cost_price
            FROM public.cd_products
            WHERE id = (v_item->>'id')::UUID
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'El producto solicitado no existe.';
            END IF;

            IF v_current_stock < (v_item->>'quantity')::INT THEN
                RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %',
                    v_product_name, v_current_stock, (v_item->>'quantity')::INT;
            END IF;

            UPDATE public.cd_products
            SET stock = stock - (v_item->>'quantity')::INT
            WHERE id = (v_item->>'id')::UUID;

            INSERT INTO public.cd_sale_items (sale_id, product_id, quantity, unit_price, cost_price, item_name)
            VALUES (
                v_sale_id,
                (v_item->>'id')::UUID,
                (v_item->>'quantity')::INT,
                (v_item->>'unit_price')::NUMERIC,
                COALESCE(v_cost_price, 0),
                v_product_name
            );

        ELSIF (v_item->>'type') = 'promotion' THEN
            FOR v_promo_item IN
                SELECT pi.product_id, pi.quantity AS qty_per_pack, p.name AS product_name, p.stock, p.cost_price
                FROM public.cd_promotion_items pi
                JOIN public.cd_products p ON p.id = pi.product_id
                WHERE pi.promotion_id = (v_item->>'id')::UUID
                FOR UPDATE OF p
            LOOP
                v_required_qty := (v_item->>'quantity')::INT * v_promo_item.qty_per_pack;

                IF v_promo_item.stock < v_required_qty THEN
                    RAISE EXCEPTION 'Stock insuficiente de "%" para armar la promoción. Requerido: %, Disponible: %',
                        v_promo_item.product_name, v_required_qty, v_promo_item.stock;
                END IF;

                UPDATE public.cd_products
                SET stock = stock - v_required_qty
                WHERE id = v_promo_item.product_id;
            END LOOP;

            INSERT INTO public.cd_sale_items (sale_id, promotion_id, quantity, unit_price, item_name)
            VALUES (
                v_sale_id,
                (v_item->>'id')::UUID,
                (v_item->>'quantity')::INT,
                (v_item->>'unit_price')::NUMERIC,
                v_item->>'name'
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'total_amount', v_total_amount,
        'message', 'Venta registrada con éxito y stock actualizado en Copete & Dulzura'
    );
END;
$$;

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.cd_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_promotion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cd_products_select_public" ON public.cd_products FOR SELECT USING (true);
CREATE POLICY "cd_promos_select_public" ON public.cd_promotions FOR SELECT USING (true);
CREATE POLICY "cd_promo_items_select_public" ON public.cd_promotion_items FOR SELECT USING (true);

CREATE POLICY "cd_sales_insert_public" ON public.cd_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "cd_sale_items_insert_public" ON public.cd_sale_items FOR INSERT WITH CHECK (true);

CREATE POLICY "cd_admin_all_products" ON public.cd_products FOR ALL USING (true);
CREATE POLICY "cd_admin_all_promotions" ON public.cd_promotions FOR ALL USING (true);
CREATE POLICY "cd_admin_all_promo_items" ON public.cd_promotion_items FOR ALL USING (true);
CREATE POLICY "cd_admin_all_sales" ON public.cd_sales FOR ALL USING (true);
CREATE POLICY "cd_admin_all_sale_items" ON public.cd_sale_items FOR ALL USING (true);
CREATE POLICY "cd_admin_all_invoices" ON public.cd_invoices FOR ALL USING (true);
CREATE POLICY "cd_admin_all_invoice_items" ON public.cd_invoice_items FOR ALL USING (true);
CREATE POLICY "cd_admin_all_expenses" ON public.cd_expenses FOR ALL USING (true);
CREATE POLICY "cd_admin_all_movements" ON public.cd_inventory_movements FOR ALL USING (true);

-- ==============================================================================
-- 13. STORAGE BUCKET INDEPENDIENTE: copete-dulzura-media
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('copete-dulzura-media', 'copete-dulzura-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "cd_storage_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'copete-dulzura-media');

CREATE POLICY "cd_storage_insert_admin"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'copete-dulzura-media');

CREATE POLICY "cd_storage_delete_admin"
ON storage.objects FOR DELETE
USING (bucket_id = 'copete-dulzura-media');

-- ==============================================================================
-- 14. SEED DATA INICIAL PARA COPETE & DULZURA
-- ==============================================================================
INSERT INTO public.cd_products (id, name, description, category, price, cost_price, stock, min_stock_alert, image_url) VALUES
-- Repostería Fina & Tortas
('10000000-0000-0000-0000-000000000001', 'Cheesecake Artesanal Frutos Rojos', 'Cremoso cheesecake horneado estilo New York sobre masa crocante de galleta artesanal, bañado con reducción de frambuesas y moras silvestres.', 'Tortas & Cheesecakes', 18990, 8500, 12, 4, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'),
('10000000-0000-0000-0000-000000000002', 'Torta Cuatro Leches Tradicional', 'Bizcochuelo húmedo tradicional chileno embebido en leche condensada, evaporada, crema fresca y manjar artesanal de campo, coronado con merengue suizo dorado.', 'Tortas & Cheesecakes', 21990, 9500, 10, 3, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'),
('10000000-0000-0000-0000-000000000003', 'Caja Brownies Gourmet Fudgy (6 unidades)', 'Brownies artesanales elaborados con chocolate belga 70% cacao, nueces tostadas y toques de caramelo al flor de sal.', 'Pastelería & Brownies', 9990, 4200, 20, 5, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'),
('10000000-0000-0000-0000-000000000004', 'Caja Macarons Franceses Surtidos (8 unidades)', 'Elegante caja de macarons con relleno de ganache de pistacho, frambuesa ácida, chocolate amargo y maracuyá.', 'Pastelería & Brownies', 11990, 5000, 15, 4, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80'),
('10000000-0000-0000-0000-000000000005', 'Tiramisú Clásico en Copa de Cristal', 'Capas suaves de bizcocho soletilla aromatizado con café expreso y licor Amaretto, entrelazadas con auténtico queso mascarpone.', 'Postres en Vaso', 5490, 2200, 18, 5, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80'),

-- Licores Dulces, Espumantes & Copetes
('20000000-0000-0000-0000-000000000001', 'Licor Baileys Irish Cream 750ml', 'La crema de whisky irlandesa más afamada del mundo, perfecta para acompañar postres, café o tomar bien fría con hielo.', 'Licores Dulces', 15990, 9800, 14, 4, 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80'),
('20000000-0000-0000-0000-000000000002', 'Espumante Chandon Brut Rosé 750ml', 'Espumante premium argentino de burbuja fina y delicados aromas a frutos rojos frescos y notas florales.', 'Espumantes & Vinos', 16990, 10200, 16, 5, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'),
('20000000-0000-0000-0000-000000000003', 'Gin Beefeater Pink Strawberry 700ml', 'London Dry Gin infusionado con frutillas frescas de verano, notas cítricas y botánicos selectos.', 'Piscos & Destilados', 17490, 10800, 11, 3, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'),
('20000000-0000-0000-0000-000000000004', 'Pisco Alto del Carmen 35° Especial 1L', 'Pisco chileno de guarda en roble americano, cuerpo noble y suave equilibrio para la clásica piscola.', 'Piscos & Destilados', 9490, 5600, 24, 6, 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80'),
('20000000-0000-0000-0000-000000000005', 'Vino Late Harvest Concha y Toro 750ml', 'Vino dulce cosechado tardíamente con notas a miel, damasco y flores blancas. Maridaje perfecto para postres.', 'Espumantes & Vinos', 5990, 3100, 18, 4, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'),
('20000000-0000-0000-0000-000000000006', 'Pack Cerveza Corona Extra 6x330ml', 'Cerveza clara tipo Pilsner de sabor refrescante y liviano con limón.', 'Cervezas', 7290, 4300, 22, 6, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80'),
('20000000-0000-0000-0000-000000000007', 'Coca-Cola Sabor Original 1.5L', 'Bebida gaseosa helada de 1.5L.', 'Bebidas & Hielo', 2390, 1300, 30, 8, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'),
('20000000-0000-0000-0000-000000000008', 'Hielo Purificado Bolsa 2kg', 'Bolsa de hielo purificado en cubos macizos.', 'Bebidas & Hielo', 1990, 800, 25, 5, 'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Promociones Semilla "Match Dulzura"
INSERT INTO public.cd_promotions (id, name, description, promo_price, image_url) VALUES
('30000000-0000-0000-0000-000000000001', 'Pack Dulce Tentación (Baileys 750ml + Cheesecake Frutos Rojos + Hielo)', 'El maridaje de ensueño: 1 Botella de Baileys Irish Cream 750ml, 1 Cheesecake Artesanal de Frutos Rojos y 1 Bolsa de Hielo 2kg.', 32990, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'),
('30000000-0000-0000-0000-000000000002', 'Pack Brindis & Celebración (Chandon Rosé + Torta Cuatro Leches)', 'Celebra tu fecha especial: 1 Espumante Chandon Brut Rosé 750ml junto a 1 Torta Cuatro Leches Tradicional chilena.', 35990, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'),
('30000000-0000-0000-0000-000000000003', 'Pack Previa Chic (Gin Pink + Caja de Brownies Gourmet)', 'La previa perfecta entre amigas: 1 Gin Beefeater Pink Strawberry 700ml más 1 Caja de 6 Brownies Fudgy de Chocolate Belga.', 24990, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'),
('30000000-0000-0000-0000-000000000004', 'Pack Carrete Piscolero & Antojo Dulce', '1 Pisco Alto del Carmen 1L, 1 Coca-Cola 1.5L, 1 Bolsa de Hielo 2kg y 1 Tiramisú Clásico en Copa.', 16990, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Relaciones de los Packs
INSERT INTO public.cd_promotion_items (promotion_id, product_id, quantity) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1),
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 1),

('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 1),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1),

('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 1),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 1),

('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 1),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000007', 1),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008', 1),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 1)
ON CONFLICT (promotion_id, product_id) DO NOTHING;
