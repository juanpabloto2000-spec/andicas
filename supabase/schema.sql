-- ==============================================================================
-- ANDICAS BIOPARQUE TEMÁTICO & ECO-RESORT
-- Supabase Database Schema: Reservas, Cabañas, Pagos Wompi y Disponibilidad
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: CABAÑAS (Catálogo oficial con tarifas base)
CREATE TABLE IF NOT EXISTS cabins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(100) NOT NULL,
    price_per_night BIGINT NOT NULL,
    max_guests INT NOT NULL DEFAULT 2,
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: RESERVAS
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL, -- ej: AND-CAB-84920
    cabin_id VARCHAR(50) REFERENCES cabins(id) ON DELETE RESTRICT,
    cabin_name VARCHAR(150) NOT NULL,
    client_name VARCHAR(150) NOT NULL,
    client_email VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights_count INT NOT NULL DEFAULT 1,
    guests_count INT NOT NULL DEFAULT 2,
    total_amount_cop BIGINT NOT NULL,
    deposit_amount_cop BIGINT NOT NULL, -- Exactamente el 50%
    remaining_balance_cop BIGINT NOT NULL, -- 50% restante a pagar en recepción
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT', -- PENDING_PAYMENT | CONFIRMED | CANCELLED | COMPLETED
    wompi_transaction_id VARCHAR(100),
    wompi_payment_method VARCHAR(50), -- NEQUI, PSE, CARD, BANCOLOMBIA_TRANSFER
    payment_verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: FECHAS BLOQUEADAS / OCUPADAS
CREATE TABLE IF NOT EXISTS blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabin_id VARCHAR(50) REFERENCES cabins(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason VARCHAR(50) NOT NULL DEFAULT 'RESERVATION', -- RESERVATION, MAINTENANCE, MANUAL_BLOCK
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cabin_id, blocked_date)
);

-- 5. TABLA: AUDITORÍA DE WEBHOOKS WOMPI
CREATE TABLE IF NOT EXISTS wompi_payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50),
    wompi_transaction_id VARCHAR(100),
    amount_in_cents BIGINT,
    status VARCHAR(50),
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: HISTORIAL DE MOVIMIENTOS Y AUDITORÍA DE AGENDAS
CREATE TABLE IF NOT EXISTS booking_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) NOT NULL,
    client_name VARCHAR(150),
    cabin_name VARCHAR(150),
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL, -- 'Administrador', 'Recepcionista (Staff)', 'Pasarela Wompi'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. POBLACIÓN INICIAL DE CABAÑAS
INSERT INTO cabins (id, name, type, price_per_night, max_guests, image_url, description)
VALUES 
('casa-del-arbol', 'Nido Ancestral en el Dosel', 'Cabaña Suspendida en Árbol', 920000, 3, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', 'Cabaña artesanal suspendida en árbol con jacuzzi privado y catamarán.'),
('palma-magica', 'Santuario de las Palmas', 'Cabaña Deluxe en Madera', 880000, 3, 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80', 'Estructura en madera noble con jacuzzi privado climatizado y balcón panorámico.'),
('cueva-del-sol', 'Cueva Ancestral del Sol', 'Suite Esculpida en Roca', 750000, 2, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 'Suite bioclimática esculpida en roca con tina de hidromasaje y luz tenue.'),
('mirador-del-valle', 'Mirador Andino', 'Cabaña Panorámica', 680000, 4, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'Balcón voladizo hacia el cañón con jacuzzi compartido y cine bajo las estrellas.'),
('glamping-estelar', 'Domo Geodésico Estelar', 'Glamping de Lujo', 620000, 2, 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80', 'Domo transparente con vista directa a la vía láctea y fogata nocturna.'),
('cabana-familiar', 'Refugio Familiar Quimbaya', 'Cabaña Campestre Familiar', 980000, 6, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', 'Amplia cabaña con 2 habitaciones, sala, comedor y terraza privada.'),
('nido-del-colibri', 'Nido del Colibrí', 'Habitación Romántica', 540000, 2, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', 'Habitación acogedora con acabados en guadua y acceso al jacuzzi compartido.'),
('torre-del-bosque', 'Torre del Bosque Sagrado', 'Cabaña de Tres Niveles', 950000, 4, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', 'Torre de 3 pisos con mirador 360°, chimenea ecológica y terraza privada.'),
('suite-cascada', 'Suite de la Cascada', 'Habitación Premium junto al Agua', 790000, 2, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', 'Suite con sonido relajante de caída de agua y jacuzzi privado.'),
('eco-lodge-ancestral', 'Eco-Lodge Ancestral', 'Cabaña Bioclimática', 720000, 4, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80', 'Construcción en tapia pisada y madera reciclada con jardín privado.')
ON CONFLICT (id) DO NOTHING;

-- 7. FUNCIÓN PARA VERIFICAR DISPONIBILIDAD DE FECHAS
CREATE OR REPLACE FUNCTION check_cabin_availability(
    p_cabin_id VARCHAR,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
    v_conflicts INT;
BEGIN
    SELECT COUNT(*)
    INTO v_conflicts
    FROM blocked_dates
    WHERE cabin_id = p_cabin_id
      AND blocked_date >= p_check_in
      AND blocked_date < p_check_out;

    RETURN v_conflicts = 0;
END;
$$ LANGUAGE plpgsql;

-- 8. ÍNDICES PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates ON blocked_dates(cabin_id, blocked_date);
