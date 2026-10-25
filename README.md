# RUTA LIBRE PERÚ — SISTEMA OPERATIVO Y ERP TURÍSTICO
## Repositorio Oficial y Documentación del Proyecto

**Estado:** Fase 1 (Diseño de Dominio, Arquitectura y QA Core Completado al 100%)  
**Tecnologías:** TypeScript Strict, Vitest, PostgreSQL (Supabase), Next.js 14+  
**Repositorio GitHub:** `https://github.com/Huallullo/RutaLibre-App`  
**Rama Principal:** `main`

---

## 📁 ESTRUCTURA DE LA DOCUMENTACIÓN Y CÓDIGO FUENTE

1. **Documentación de Ingeniería:**
   * [`docs/01_DOCUMENTO_DE_REQUERIMIENTOS_Y_ARQUITECTURA_SRS.md`](docs/01_DOCUMENTO_DE_REQUERIMIENTOS_Y_ARQUITECTURA_SRS.md): Requerimientos funcionales, no funcionales y casos de uso.
   * [`docs/02_MODELO_DE_BASE_DE_DATOS_POSTGRES_SUPABASE.sql`](docs/02_MODELO_DE_BASE_DE_DATOS_POSTGRES_SUPABASE.sql): DDL completo con tablas, vistas de aforo y vistas P&L de rentabilidad.
   * [`docs/03_MATRIZ_DE_ROLES_PERMISOS_Y_WORKFLOWS.md`](docs/03_MATRIZ_DE_ROLES_PERMISOS_Y_WORKFLOWS.md): Matriz RBAC, flujos de check-in y aprobaciones de emergencia en ruta.
   * [`docs/04_HOJA_DE_RUTA_Y_GUIA_DE_DESARROLLO.md`](docs/04_HOJA_DE_RUTA_Y_GUIA_DE_DESARROLLO.md): Guía de despliegue a Vercel y estructura de carpetas.

2. **Capa de Dominio y Lógica de Negocio (Probada al 100% con QA Automatizado):**
   * `src/domain/types.ts`: Tipos estrictos de dominio.
   * `src/domain/pricing-engine.ts`: Motor de tarifas (grupos 4+ pax, niños, infantes, cupones y descuentos manuales).
   * `src/domain/capacity-engine.ts`: Control de aforo concurrente y bloqueo de sobreventa (overbooking).
   * `src/domain/passenger-validator.ts`: Validación de DNIs (8 dígitos), CE, Pasaportes y teléfonos SUTRAN.
   * `src/domain/voucher-generator.ts`: Generador automático de vouchers con desglose de saldos para WhatsApp.

3. **Batería de Pruebas Unitarias y de Integración (QA Senior):**
   * `tests/pricing-engine.test.ts` (7 pruebas)
   * `tests/capacity-engine.test.ts` (6 pruebas)
   * `tests/passenger-validator.test.ts` (6 pruebas)
   * `tests/voucher-generator.test.ts` (1 prueba)
   * **Resultado:** 20 pruebas ejecutadas y aprobadas en verde.

---

## 🚀 COMANDOS DISPONIBLES

```bash
# Ejecutar todas las pruebas de QA en milisegundos
npm test

# Ejecutar verificación estricta de tipos TypeScript
npm run typecheck
```
