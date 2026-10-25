# ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE Y ARQUITECTURA (SRS)
## Sistema Centralizado de Gestión Turística y Operaciones — "Ruta Libre Perú"

**Versión:** 1.0.0  
**Fecha:** Octubre 2026  
**Empresa Destino:** Ruta Libre Perú ([rutalibreperu.com](https://www.rutalibreperu.com/))  
**Documento:** Especificación Funcional, Técnica y Arquitectura de Software  

---

## 1. INTRODUCCIÓN Y CONTEXTO DEL NEGOCIO

### 1.1 Contexto
Ruta Libre Perú es una agencia y operadora de turismo interno y receptivo con base en Lima, Perú, enfocada en la comercialización de:
1. **Full Days:** Salidas de 1 día a destinos regionales (Lunahuaná, Paracas, Ica, Churín, Nevado Raura, Marcapomacocha, etc.).
2. **Paquetes Multidía:** Excursiones de 2 días / 1 noche o más con servicios de hotelería (Huancaya, Selva Central, Chanchamayo, festividades de Fiestas Patrias y Semana Santa).
3. **Servicios Privados y Corporativos:** Excursiones a medida para empresas, colegios y grupos cerrados.

### 1.2 Declaración del Problema
Actualmente, el sitio web comercial funciona exclusivamente como catálogo vitrina. El 100% de las ventas y consultas converge en canales de mensajería (WhatsApp), donde la administración manual mediante hojas de cálculo (Excel) genera los siguientes puntos de dolor:
* **Riesgo crítico de sobreventa (overbooking):** Falta de control concurrente de asientos por unidad de transporte (Sprinter de 15/19 pasajeros o Buses de 45/50 asientos).
* **Descontrol en la recaudación de adelantos y saldos:** Los clientes adelantan un porcentaje vía billeteras digitales (Yape, Plin o transferencias) y pagan el saldo restante en efectivo o Yape al abordar el bus. La falta de conciliación automatizada genera pérdidas económicas.
* **Falta de estandarización en adicionales (upselling):** Confusión operativa en el recuento de cuatrimotos, botes en Islas Ballestas, canotaje y almuerzos.
* **Incertidumbre en ruta para el Tour Conductor (TC) y choferes:** El armado manual del manifiesto de pasajeros exigido por MTC/SUTRAN es propenso a errores humanos de transcripción.

### 1.3 Visión y Objetivos del Sistema
Construir un **Back-Office / ERP Operativo Cloud-Native y Mobile-First**, accesible desde cualquier navegador (PC y smartphones), que centralice:
1. Catálogo, tarifas, aforos e inventario de salidas en tiempo real.
2. Motor de reservas rápido con control estricto de adelantos y saldos.
3. Generación automática de manifiestos oficiales de pasajeros, rooming lists y órdenes de servicios a proveedores.
4. Portal móvil operativo para el Guía/TC en ruta con control de asistencia, cobranzas en puerta y mensajería masiva para coordinación.
5. Motor de notificaciones en tiempo real (WebSockets) para prevenir sobreventas y gestionar autorizaciones de ruta.
6. Módulo analítico y de reportes de rentabilidad neta por viaje (P&L por expedición).

---

## 2. ACTORES Y MATRIZ DE ROLES (RBAC)

| Rol | Descripción | Dispositivo Primario | Nivel de Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador (Dueña / Gerencia)** | Control total del sistema, configuración comercial, márgenes, costos de transporte y liquidación final de utilidades. | Laptop y Smartphone | Total (Lectura, Escritura, Eliminación, Aprobación) |
| **Ventas / Counter** | Atención de clientes, verificación de cupos en vivo, emisión de reservas, registro de comprobantes de adelanto. | Desktop / Laptop | Operativo Comercial (Sin acceso a costos de proveedores ni utilidades) |
| **Tour Conductor (TC / Guía Líder)** | Gestión de la expedición en carretera: control de asistencia (check-in), cobro de saldos en puerta, avisos masivos y registro de incidencias. | Smartphone | Operativo de Campo (Solo lectura/escritura de su expedición asignada) |

---

## 3. ARQUITECTURA DEL SISTEMA Y STACK TECNOLÓGICO

El sistema adopta una arquitectura desacoplada de 4 capas:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CAPA DE PRESENTACIÓN (Frontend SPA / PWA)                │
│    - Next.js (App Router) + React + Tailwind CSS            │
│    - Componentes de UI: Shadcn UI + Lucide Icons            │
│    - Responsive Mobile-First para uso del TC y Ventas       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────┐
│ 2. CAPA DE CONTROLADORES Y LÓGICA DE NEGOCIO (Serverless)   │
│    - Next.js Server Actions / Route Handlers                │
│    - Motor de validación de aforo concurrente               │
│    - Motor de promociones y cálculo de saldos               │
│    - Generador de documentos PDF (Manifiestos y Vouchers)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ PostgreSQL Client / Realtime
┌──────────────────────────────▼──────────────────────────────┐
│ 3. CAPA DE DATOS Y SERVICIOS EN LA NUBE (Supabase Platform) │
│    - Base de Datos Relacional: PostgreSQL 15+               │
│    - Autenticación: Supabase Auth (JWT con Claims de Rol)   │
│    - Storage: Buckets S3 compatibles para Vouchers y Fotos  │
│    - Realtime Service: WebSockets para sincronización viva  │
│    - Row Level Security (RLS) para aislamiento de datos     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. REQUERIMIENTOS FUNCIONALES (RF)

### 4.1 Módulo 1: Gestión de Salidas y Expediciones (`TripRun`)
* **RF-1.1:** El sistema debe permitir la creación de salidas programadas asignando: Tour base, Fecha de viaje, Unidad de transporte (con capacidad fija), Chofer y TC responsable.
* **RF-1.2:** Cada salida debe poseer un identificador alfanumérico único legible (ej. `EXP-20261102-LUN-01`).
* **RF-1.3:** El sistema debe calcular en tiempo real:
  $$\text{Cupos Disponibles} = \text{Capacidad Total} - \sum \text{Pasajeros Confirmados}$$
* **RF-1.4:** El sistema debe contemplar el "Punto de Equilibrio" (Break-even): número mínimo de pasajeros requeridos para confirmar la salida sin pérdidas de flete.
* **RF-1.5:** Ciclo de vida de la salida: `PROGRAMADA` $\rightarrow$ `CONFIRMADA` $\rightarrow$ `EN_RUTA` $\rightarrow$ `FINALIZADA` $\rightarrow$ `LIQUIDADA` $\rightarrow$ `CANCELADA`.

### 4.2 Módulo 2: Motor de Reservas y Pasajeros
* **RF-2.1:** Registro de reserva con cliente titular: Nombre completo, Teléfono WhatsApp, Correo electrónico.
* **RF-2.2:** Registro individual de cada pasajero acompañante: Nombre, Apellido, Tipo de Documento (DNI/CE/Pasaporte), Número de Documento, Edad, Condición médica/alergias y Contacto de emergencia.
* **RF-2.3:** Asignación del **Punto de Embarque** individual para cada pasajero (ej. Plaza Norte 04:30 AM, Javier Prado 05:15 AM, Mall del Sur 05:45 AM).
* **RF-2.4:** Selección de adicionales por pasajero: Cuatrimotos, Deslizadores Ballestas, Canotaje, Almuerzos campestres, con suma automática al total.
* **RF-2.5:** Selección de tipo de habitación para paquetes multidía: Matrimonial, Doble (2 camas), Triple, Simple (con recargo de suplemento).

### 4.3 Módulo 3: Motor de Tarifas, Descuentos y Pagos
* **RF-3.1:** Soporte de descuentos por volumen: reducción de tarifa base a partir de un umbral de pasajeros (ej. $\ge 4$ personas).
* **RF-3.2:** Soporte de tarifas reducidas por edad (Infantes en brazos sin asiento, niños de 5 a 10 años).
* **RF-3.3:** Cupones promocionales con límite de vigencia y número máximo de canjes.
* **RF-3.4:** Descuento manual con campo obligatorio de "Motivo de Descuento" registrado en bitácora de auditoría.
* **RF-3.5:** Registro de pagos en múltiples modalidades: Yape, Plin, Transferencia Bancaria, Efectivo. Carga de comprobante digital en el bucket de almacenamiento.
* **RF-3.6:** Cálculo automático del saldo pendiente al abordar el transporte:
  $$\text{Saldo Pendiente} = \text{Costo Total de Reserva} - \sum \text{Pagos Aprobados}$$

### 4.4 Módulo 4: Portal Móvil del Tour Conductor (TC)
* **RF-4.1:** Vista restringida por credencial móvil: el TC solo visualiza la expedición activa que tiene asignada.
* **RF-4.2 Check-in en Ruta:** Lista de pasajeros segmentada por Punto de Recojo con checkbox táctil de marcación rápida (`Abordó` / `No-Show`).
* **RF-4.3 Cobranza en Puerta:** Botón de confirmación para cobro de saldos pendientes en efectivo o verificación de Yape in situ.
* **RF-4.4 Hub de Notificaciones y Difusión Masiva:**
  * Generación de enlace de invitación al Grupo Oficial de WhatsApp del viaje.
  * Selector de plantillas de difusión masiva (Recordatorio nocturno de horario de desayuno, punto de encuentro en atractivos, aviso de retorno).
* **RF-4.5 Flujo de Aprobaciones de Excepción:**
  * El TC no puede registrar pasajeros adicionales de último minuto ni condonar saldos sin solicitar autorización mediante el sistema a la Administradora.

### 4.5 Módulo 5: Generación de Documentos y Manifiestos
* **RF-5.1:** Generación en 1 clic del **Manifiesto Oficial de Pasajeros** en formato PDF conforme a normativas de SUTRAN / MTC y pólizas SOAT.
* **RF-5.2:** Generación del **Rooming List** para establecimientos hoteleros en paquetes 2D/1N.
* **RF-5.3:** Generación de **Órdenes de Servicio para Operadores Locales** (desglose de botes, cuatrimotos y restaurantes).
* **RF-5.4:** Emisión del **Voucher Digital de Reserva** en PDF o texto formateado para compartir al cliente por WhatsApp.

### 4.6 Módulo 6: Notificaciones en Tiempo Real
* **RF-6.1:** Canales WebSockets conectados a la base de datos para actualizar aforos concurrentes instantáneamente.
* **RF-6.2:** Alerta sonora y visual inmediata a la Administradora ante solicitudes de autorización emitidas por el TC desde ruta.
* **RF-6.3:** Alerta de "Cupo Agotado" a los usuarios del rol Ventas para inhabilitar ofertas de asientos en salidas cerradas.

### 4.7 Módulo 7: Reportes Financieros y Business Intelligence
* **RF-7.1 Liquidación por Salida (P&L):**
  $$\text{Utilidad Neta} = \text{Ingresos Totales} - (\text{Flete Transporte} + \text{Honorarios Guía} + \text{Costo Proveedores} + \text{Tasas SERNANP})$$
* **RF-7.2:** Reporte de recaudación por canal de pago (Yape vs. Plin vs. BCP vs. Efectivo).
* **RF-7.3:** Ranking de rentabilidad y ocupación por destino turístico.
* **RF-7.4:** Historial de descuentos y auditoría de anulaciones/devoluciones.

---

## 5. REQUERIMIENTOS NO FUNCIONALES (RNF)

* **RNF-1 Rendimiento:** El tiempo de respuesta en la consulta de disponibilidad de cupos debe ser inferior a 300 ms bajo condiciones normales de red móvil 4G.
* **RNF-2 Disponibilidad:** Alta disponibilidad respaldada por la infraestructura distribuida de Vercel (Edge Network) y Supabase (AWS us-east-1).
* **RNF-3 Seguridad y Privacidad:** 
  * Encriptación en tránsito (TLS 1.3) y en reposo (AES-256).
  * Políticas de Row Level Security (RLS) en PostgreSQL que impidan que un TC o Vendedor consulte registros fuera de sus permisos.
  * Cumplimiento con la Ley de Protección de Datos Personales (Ley N° 29733 - Perú) en el tratamiento de DNIs y teléfonos.
* **RNF-4 Usabilidad:** Interfaz optimizada para pantallas táctiles de 360px a 430px de ancho con áreas de toque mínimas de 48x48 píxeles para uso con una mano en ruta.

---

## 6. CASOS DE USO CRÍTICOS Y FLUJOS DE EXCEPCIÓN

### CU-01: Registro de Reserva con Adelanto Parcial y Validación de Aforo
1. La Vendedora consulta la salida del sábado para Lunahuaná. El sistema indica 6 cupos libres.
2. Ingresa los datos del titular y registra 4 pasajeros con sus respectivos números de DNI y paradero (Plaza Norte).
3. Selecciona 2 adicionales de cuatrimoto (+S/ 90). El sistema calcula Total: S/ 406.
4. Ingresa el pago de adelanto recibido por Yape: S/ 200 y adjunta la captura.
5. El sistema ejecuta una transacción atómica:
   * Inserta la reserva en estado `CONFIRMADA_PARCIAL`.
   * Inserta los 4 pasajeros.
   * Decrementa el aforo disponible a 2 cupos.
   * Dispara un evento Realtime que actualiza la pantalla de todas las demás terminales conectadas.
6. El sistema genera el resumen para WhatsApp indicando que el saldo a cancelar al abordar es de S/ 206.

### CU-02: Manejo de Cancelación y "Saldo a Favor" (Wallet)
1. Un cliente avisa con 72 horas de anticipación que no podrá viajar.
2. La Administradora abre la reserva y presiona `[Cancelar Reserva]`.
3. El sistema aplica la política de retención:
   * Si la cancelación cumple la política de tiempo, el monto adelantado (menos gastos administrativos configurados) se traslada a la tabla `cliente_creditos` como saldo a favor del titular.
   * Los cupos de transporte quedan liberados automáticamente y el contador de la salida aumenta en tiempo real.
4. En una reserva futura, la vendedora puede aplicar este crédito existente como método de pago.

---

**Fin del Documento de Especificación.**
