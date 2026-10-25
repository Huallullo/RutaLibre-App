-- ==============================================================================
-- SISTEMA DE GESTIÓN TURÍSTICA Y OPERACIONES - RUTA LIBRE PERÚ
-- Esquema de Base de Datos para PostgreSQL 15+ / Supabase
-- Arquitectura: Clean Architecture / Relacional / Realtime Ready
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TIPOS ENUMERADOS (ENUMS)
-- ==============================================================================

CREATE TYPE tipo_tour_enum AS ENUM (
    'FULL_DAY',
    'MULTIDIA_CON_HOTEL',
    'PRIVADO_CORPORATIVO'
);

CREATE TYPE estado_expedicion_enum AS ENUM (
    'PROGRAMADA',
    'CONFIRMADA',
    'EN_RUTA',
    'FINALIZADA',
    'LIQUIDADA',
    'CANCELADA'
);

CREATE TYPE estado_reserva_enum AS ENUM (
    'PENDIENTE_PAGO',
    'ADELANTO_CONFIRMADO',
    'PAGADO_TOTAL',
    'CANCELADA_CON_PENALIDAD',
    'CANCELADA_SALDO_A_FAVOR',
    'REEMBOLSADA'
);

CREATE TYPE medio_pago_enum AS ENUM (
    'YAPE',
    'PLIN',
    'TRANSFERENCIA_BCP',
    'TRANSFERENCIA_BBVA',
    'TRANSFERENCIA_INTERBANK',
    'EFECTIVO_EN_BUS',
    'SALDO_A_FAVOR_WALLET'
);

CREATE TYPE rol_usuario_enum AS ENUM (
    'ADMINISTRADORA',
    'VENTAS_COUNTER',
    'GUIA_TC'
);

CREATE TYPE tipo_habitacion_enum AS ENUM (
    'NO_APLICA_FULLDAY',
    'MATRIMONIAL',
    'DOBLE_TWIN',
    'TRIPLE',
    'SIMPLE_INDIVIDUAL'
);

CREATE TYPE estado_aprobacion_enum AS ENUM (
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO'
);

-- ==============================================================================
-- 2. TABLAS MAESTRAS DEL CATÁLOGO
-- ==============================================================================

CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    tipo tipo_tour_enum NOT NULL DEFAULT 'FULL_DAY',
    descripcion TEXT,
    duracion_dias INT NOT NULL DEFAULT 1,
    duracion_noches INT NOT NULL DEFAULT 0,
    precio_base_regular DECIMAL(10, 2) NOT NULL,
    precio_preventa DECIMAL(10, 2),
    precio_grupo_4_mas DECIMAL(10, 2),
    precio_nino DECIMAL(10, 2),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE paraderos_embarque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    referencia VARCHAR(255),
    hora_defecto TIME,
    orden_recojo INT DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE adicionales_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    costo_proveedor DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    aplica_a_tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE unidades_transporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(20) UNIQUE NOT NULL,
    tipo_vehiculo VARCHAR(50) NOT NULL,
    capacidad_pasajeros INT NOT NULL,
    empresa_transportista VARCHAR(120),
    soat_vencimiento DATE,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE usuarios_perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(120) NOT NULL,
    telefono_whatsapp VARCHAR(20) NOT NULL,
    rol rol_usuario_enum NOT NULL DEFAULT 'VENTAS_COUNTER',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. EXPEDICIONES Y VIAJES ÚNICOS (TripRun)
-- ==============================================================================

CREATE TABLE expediciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_expedicion VARCHAR(30) UNIQUE NOT NULL,
    tour_id UUID NOT NULL REFERENCES tours(id),
    fecha_salida DATE NOT NULL,
    hora_concentracion_inicial TIME NOT NULL,
    unidad_transporte_id UUID REFERENCES unidades_transporte(id),
    capacidad_total INT NOT NULL,
    cupo_minimo_break_even INT NOT NULL DEFAULT 12,
    guia_tc_id UUID REFERENCES usuarios_perfiles(id),
    chofer_nombre VARCHAR(120),
    chofer_telefono VARCHAR(20),
    whatsapp_group_link VARCHAR(255),
    costo_flete_transporte DECIMAL(10, 2) DEFAULT 0.00,
    costo_honorarios_guia DECIMAL(10, 2) DEFAULT 0.00,
    estado estado_expedicion_enum NOT NULL DEFAULT 'PROGRAMADA',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. RESERVAS, PASAJEROS Y ADICIONALES
-- ==============================================================================

CREATE TABLE reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_reserva VARCHAR(25) UNIQUE NOT NULL,
    expedicion_id UUID NOT NULL REFERENCES expediciones(id) ON DELETE RESTRICT,
    titular_nombre VARCHAR(120) NOT NULL,
    titular_telefono VARCHAR(20) NOT NULL,
    titular_email VARCHAR(120),
    subtotal_tours DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal_adicionales DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monto_descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    motivo_descuento VARCHAR(255),
    monto_total DECIMAL(10, 2) NOT NULL,
    monto_adelanto_pagado DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    saldo_pendiente_en_bus DECIMAL(10, 2) GENERATED ALWAYS AS (monto_total - monto_adelanto_pagado) STORED,
    estado estado_reserva_enum NOT NULL DEFAULT 'PENDIENTE_PAGO',
    creado_por_usuario_id UUID REFERENCES usuarios_perfiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE pasajeros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    expedicion_id UUID NOT NULL REFERENCES expediciones(id),
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL DEFAULT 'DNI',
    numero_documento VARCHAR(25) NOT NULL,
    edad INT,
    nacionalidad VARCHAR(50) DEFAULT 'Peruana',
    paradero_embarque_id UUID REFERENCES paraderos_embarque(id),
    tipo_habitacion tipo_habitacion_enum DEFAULT 'NO_APLICA_FULLDAY',
    numero_habitacion_asignada VARCHAR(10),
    condiciones_medicas_alergias VARCHAR(255),
    contacto_emergencia_nombre VARCHAR(100),
    contacto_emergencia_telefono VARCHAR(20),
    abordo_unidad BOOLEAN NOT NULL DEFAULT FALSE,
    hora_embarque_real TIMESTAMP WITH TIME ZONE,
    es_no_show BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE reserva_adicionales_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    adicional_id UUID NOT NULL REFERENCES adicionales_catalogo(id),
    pasajero_id UUID REFERENCES pasajeros(id) ON DELETE SET NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario_venta DECIMAL(10, 2) NOT NULL,
    costo_unitario_proveedor DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- ==============================================================================
-- 5. PAGOS, TRANSACCIONES Y BILLETERA DE CLIENTES
-- ==============================================================================

CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    monto DECIMAL(10, 2) NOT NULL,
    medio_pago medio_pago_enum NOT NULL,
    numero_operacion_referencia VARCHAR(80),
    comprobante_imagen_url TEXT,
    es_saldo_cobrado_en_bus BOOLEAN DEFAULT FALSE,
    recolectado_por_tc_id UUID REFERENCES usuarios_perfiles(id),
    aprobado_por_admin_id UUID REFERENCES usuarios_perfiles(id),
    estado estado_aprobacion_enum NOT NULL DEFAULT 'APROBADO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE cliente_creditos_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_telefono VARCHAR(20) NOT NULL,
    cliente_nombre VARCHAR(120) NOT NULL,
    monto_credito DECIMAL(10, 2) NOT NULL,
    saldo_disponible DECIMAL(10, 2) NOT NULL,
    origen_reserva_id UUID REFERENCES reservas(id),
    motivo VARCHAR(255) NOT NULL,
    fecha_expiracion DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE gastos_ruta_expedicion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expedicion_id UUID NOT NULL REFERENCES expediciones(id),
    tc_responsable_id UUID NOT NULL REFERENCES usuarios_perfiles(id),
    concepto VARCHAR(150) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    comprobante_foto_url TEXT,
    estado estado_aprobacion_enum DEFAULT 'PENDIENTE',
    aprobado_por_admin_id UUID REFERENCES usuarios_perfiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE solicitudes_aprobacion_ruta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expedicion_id UUID NOT NULL REFERENCES expediciones(id),
    solicitado_por_tc_id UUID NOT NULL REFERENCES usuarios_perfiles(id),
    tipo_solicitud VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    datos_payload JSONB,
    estado estado_aprobacion_enum NOT NULL DEFAULT 'PENDIENTE',
    resolucion_admin_id UUID REFERENCES usuarios_perfiles(id),
    resolucion_motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios_perfiles(id),
    tabla_afectada VARCHAR(60) NOT NULL,
    registro_id UUID,
    accion VARCHAR(20) NOT NULL,
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. VISTAS ANALÍTICAS Y REALTIME
-- ==============================================================================

CREATE OR REPLACE VIEW vista_aforo_expediciones AS
SELECT 
    e.id AS expedicion_id,
    e.codigo_expedicion,
    e.fecha_salida,
    e.capacidad_total,
    e.cupo_minimo_break_even,
    COUNT(p.id) FILTER (WHERE r.estado NOT IN ('CANCELADA_CON_PENALIDAD', 'CANCELADA_SALDO_A_FAVOR', 'REEMBOLSADA')) AS asientos_ocupados,
    (e.capacidad_total - COUNT(p.id) FILTER (WHERE r.estado NOT IN ('CANCELADA_CON_PENALIDAD', 'CANCELADA_SALDO_A_FAVOR', 'REEMBOLSADA'))) AS asientos_disponibles,
    CASE 
        WHEN (e.capacidad_total - COUNT(p.id) FILTER (WHERE r.estado NOT IN ('CANCELADA_CON_PENALIDAD', 'CANCELADA_SALDO_A_FAVOR', 'REEMBOLSADA'))) <= 0 THEN 'LLENO'
        WHEN (e.capacidad_total - COUNT(p.id) FILTER (WHERE r.estado NOT IN ('CANCELADA_CON_PENALIDAD', 'CANCELADA_SALDO_A_FAVOR', 'REEMBOLSADA'))) <= 3 THEN 'ULTIMOS_CUPOS'
        ELSE 'DISPONIBLE'
    END AS semaforo_cupos,
    e.estado AS estado_expedicion
FROM expediciones e
LEFT JOIN reservas r ON r.expedicion_id = e.id
LEFT JOIN pasajeros p ON p.reserva_id = r.id
GROUP BY e.id;

CREATE OR REPLACE VIEW vista_liquidacion_expedicion AS
SELECT 
    e.id AS expedicion_id,
    e.codigo_expedicion,
    e.fecha_salida,
    t.nombre AS tour_nombre,
    COUNT(DISTINCT p.id) AS total_pasajeros,
    COALESCE(SUM(DISTINCT r.monto_total), 0.00) AS ingresos_brutos_totales,
    COALESCE(SUM(pg.monto) FILTER (WHERE pg.estado = 'APROBADO'), 0.00) AS total_recaudado,
    e.costo_flete_transporte,
    e.costo_honorarios_guia,
    COALESCE(SUM(g.monto) FILTER (WHERE g.estado = 'APROBADO'), 0.00) AS total_gastos_ruta,
    (COALESCE(SUM(DISTINCT r.monto_total), 0.00) 
     - e.costo_flete_transporte 
     - e.costo_honorarios_guia 
     - COALESCE(SUM(g.monto) FILTER (WHERE g.estado = 'APROBADO'), 0.00)) AS utilidad_neta_estimada
FROM expediciones e
JOIN tours t ON t.id = e.tour_id
LEFT JOIN reservas r ON r.expedicion_id = e.id AND r.estado NOT IN ('CANCELADA_CON_PENALIDAD', 'CANCELADA_SALDO_A_FAVOR', 'REEMBOLSADA')
LEFT JOIN pasajeros p ON p.reserva_id = r.id
LEFT JOIN pagos pg ON pg.reserva_id = r.id
LEFT JOIN gastos_ruta_expedicion g ON g.expedicion_id = e.id
GROUP BY e.id, t.nombre;

ALTER PUBLICATION supabase_realtime ADD TABLE expediciones;
ALTER PUBLICATION supabase_realtime ADD TABLE reservas;
ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes_aprobacion_ruta;
ALTER PUBLICATION supabase_realtime ADD TABLE pasajeros;
