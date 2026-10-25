# HOJA DE RUTA Y GUÍA DE DESARROLLO TÉCNICO
## Sistema Operativo — Ruta Libre Perú

**Documento:** Guía de Implementación, Estructura de Proyecto y Roadmap de Sprints  
**Versión:** 1.0.0  

---

## 1. ROADMAP DE DESARROLLO (4 SPRINTS DE 1 SEMANA)

Para entregar valor inmediato a la empresa de tu amiga sin abrumar la operación, el desarrollo se organiza en **4 Sprints ágiles**:

```
[SPRINT 1: Core & Cupos] ──► [SPRINT 2: Reservas & Caja] ──► [SPRINT 3: Portal TC en Ruta] ──► [SPRINT 4: BI & Reportes]
(Semana 1)                   (Semana 2)                      (Semana 3)                         (Semana 4)
- Configuración Supabase     - Formulario de Reserva         - Vista móvil del Guía/TC          - Manifiesto SUTRAN PDF
- Catálogo de Tours          - Registro de Yape / Adelantos  - Check-in táctil paraderos        - Liquidación P&L Viaje
- Calendario de Salidas      - Copiado de Voucher WhatsApp   - Cobro de saldos en puerta        - Métricas comerciales
- Semáforo de aforo en vivo  - Control de Billetera Wallet   - Broadcast y alertas en vivo      - Auditoría de descuentos
```

---

## 2. STACK TECNOLÓGICO Y HERRAMIENTAS RECOMENDADAS

| Capa | Tecnología | Justificación | Costo Mensual |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router)** | Renderizado en servidor, alta velocidad y soporte nativo para Server Actions. | $0.00 (Vercel Free Tier) |
| **Librería de Componentes** | **Tailwind CSS + Shadcn UI** | Componentes modernos, accesibles y 100% responsivos para smartphones. | $0.00 |
| **Iconografía** | **Lucide React** | Iconos limpios y ligeros. | $0.00 |
| **Base de Datos & Auth** | **Supabase (PostgreSQL 15+)** | Base de datos gestionada, autenticación lista, subida de vouchers y WebSockets en tiempo real. | $0.00 (Supabase Free Tier) |
| **Generación de PDFs** | **@react-pdf/renderer** o **Puppeteer / jsPDF** | Generación de Manifiestos SUTRAN y Vouchers digitales con logo oficial. | $0.00 |
| **Hosting & CI/CD** | **Vercel** | Despliegue continuo con cada commit a GitHub; dominio HTTPS automático. | $0.00 |

---

## 3. ESTRUCTURA DE CARPETAS DEL PROYECTO (Clean Architecture)

```
proyecto-turismo-rutalibre/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx               # Inicio de sesión con Supabase Auth
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                   # Layout con Navbar y Campana de Notificaciones
│   │   │   ├── page.tsx                     # Dashboard principal (KPIs de ventas y cupos)
│   │   │   ├── salidas/
│   │   │   │   ├── page.tsx                 # Calendario de Salidas y Semáforo de Aforo
│   │   │   │   └── [id]/page.tsx            # Detalle del Expediente de Viaje (TripRun)
│   │   │   ├── reservas/
│   │   │   │   ├── nueva/page.tsx           # Formulario de Reserva Rápida (WhatsApp)
│   │   │   │   └── page.tsx                 # Historial y Búsqueda de Reservas
│   │   │   ├── caja/
│   │   │   │   └── page.tsx                 # Cuadre de Yape, Plin y Saldos en Efectivo
│   │   │   ├── reportes/
│   │   │   │   └── page.tsx                 # P&L por Salida, Manifiestos y Analítica
│   │   ├── (tc)/
│   │   │   ├── ruta/[expedicionId]/page.tsx # PORTAL MÓVIL EXCLUSIVO DEL GUÍA/TC
│   ├── components/
│   │   ├── ui/                              # Botones, Modales, Inputs (Shadcn UI)
│   │   ├── salidas/
│   │   │   ├── SemaforoCuposBadge.tsx       # Indicador visual Verde / Amarillo / Rojo
│   │   │   └── ManifiestoExportButton.tsx   # Botón de descarga de PDF SUTRAN
│   │   ├── tc/
│   │   │   ├── CheckinList.tsx              # Lista táctil de pasajeros por paradero
│   │   │   ├── CobroSaldoModal.tsx          # Confirmación de cobro de saldo en puerta
│   │   │   └── BroadcastWhatsAppModal.tsx   # Plantillas de mensajería masiva
│   │   ├── notifications/
│   │   │   └── RealtimeNotificationBell.tsx # Campana WebSockets en tiempo real
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                    # Cliente para el navegador
│   │   │   └── server.ts                    # Cliente para Server Actions
│   │   ├── utils/
│   │   │   ├── formatCurrency.ts            # Formato de Soles (S/ 0.00)
│   │   │   └── generateVoucherText.ts       # Generador de mensaje listo para WhatsApp
│   ├── types/
│   │   └── database.types.ts                # Tipos de TypeScript generados de Supabase
├── public/
│   ├── logo-rutalibre.png
├── .env.local.example
├── package.json
└── README.md
```
