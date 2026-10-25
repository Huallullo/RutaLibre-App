# MATRIZ DE ROLES, PERMISOS Y FLUJOS OPERATIVOS (WORKFLOWS)
## Sistema Operativo — Ruta Libre Perú

**Documento:** Manual de Procesos, Permisos y Protocolos de Operación  
**Versión:** 1.0.0  

---

## 1. MATRIZ DE ROLES Y PERMISOS (RBAC)

| Módulo / Funcionalidad | Administradora (Dueña) | Ventas / Counter | Tour Conductor (Guía/TC) |
| :--- | :---: | :---: | :---: |
| **Configurar Tours y Precios Base** | ✅ Crear / Editar / Borrar | ❌ Solo Lectura | ❌ Sin Acceso |
| **Consultar Semáforo de Cupos en Vivo** | ✅ Sí | ✅ Sí | ✅ Sí (Solo su viaje) |
| **Crear Reserva y Pasajeros** | ✅ Sí | ✅ Sí | ❌ Requiere Aprobación |
| **Aplicar Descuentos Promocionales** | ✅ Sin Límite | ⚠️ Solo cupones fijados | ❌ Sin Acceso |
| **Aplicar Descuento Manual / Negociado** | ✅ Sí | ⚠️ Requiere Motivo | ❌ Sin Acceso |
| **Subir Comprobante Yape / Adelanto** | ✅ Sí | ✅ Sí | ❌ Sin Acceso |
| **Ver Costos de Fletes y Proveedores** | ✅ Total | ❌ Oculto | ❌ Oculto |
| **Ver Utilidad Neta (P&L por Viaje)** | ✅ Total | ❌ Oculto | ❌ Oculto |
| **Marcar Check-in de Pasajeros en Ruta** | ✅ Sí | ❌ No | ✅ Sí (Móvil) |
| **Marcar Saldo Cobrado en Puerta de Bus** | ✅ Sí | ❌ No | ✅ Sí (Móvil) |
| **Enviar Mensajería Masiva al Grupo** | ✅ Sí | ❌ No | ✅ Sí (Móvil) |
| **Solicitar Pasajero Sorpresa en Paradero**| ❌ (Aprueba) | ❌ No | ⚠️ Solicita en Ruta |
| **Registrar Gasto Imprevisto de Ruta** | ❌ (Aprueba) | ❌ No | ⚠️ Solicita con Foto |
| **Descargar Manifiesto MTC / SUTRAN** | ✅ PDF / Excel | ✅ PDF / Excel | ✅ PDF / Enlace |
| **Cerrar y Liquidar Salida (Caja Final)** | ✅ Aprueba y Liquida | ❌ Sin Acceso | ⚠️ Entrega Rendición |

---

## 2. FLUJOS OPERATIVOS PASO A PASO (WORKFLOWS)

### FLUJO 1: Venta y Reserva por WhatsApp (El día a día del Counter)
1. Cliente consulta en WhatsApp disponibilidad para un tour.
2. Vendedora abre Panel Web y verifica el semáforo de cupos en vivo.
3. Si hay cupos, solicita nombres, DNIs y paradero.
4. Realiza la cotización en el sistema con adicionales y descuentos automáticos.
5. Cliente envía adelanto por Yape/Plin, la vendedora carga el comprobante y el aforo se descuenta en tiempo real.
6. Genera y envía el voucher formateado para WhatsApp en 1 clic.

### FLUJO 2: Madrugada de Despacho y Operación en Ruta (El rol del TC)
1. 04:00 AM: El TC abre la app en su smartphone y visualiza su lista de pasajeros agrupada por paradero.
2. Realiza el check-in marcando a los pasajeros que abordan y cobra saldos pendientes en efectivo o Yape in situ.
3. Al abordar el último pasajero, cierra el embarque notificando a la Administración.

### FLUJO 3: Protocolo de Excepción y Aprobaciones en Ruta
1. Si se presenta un pasajero extra en paradero, el TC solicita registro express desde su app.
2. La Administradora recibe alerta sonora en tiempo real y aprueba fijando la tarifa.
3. El TC recibe la aprobación, cobra el saldo y el pasajero queda ingresado en el manifiesto oficial.

### FLUJO 4: Mensajería Masiva por el TC durante el Viaje
1. El TC utiliza plantillas preconfiguradas para enviar avisos de horarios de desayuno, puntos de encuentro en atractivos o retorno a Lima a todos los pasajeros de una sola vez.

### FLUJO 5: Cierre de Salida y Liquidación Financiera
1. Al regresar a Lima, el TC rinde cuentas del efectivo recaudado menos gastos de ruta aprobados.
2. La Administradora aprueba la rendición y el sistema liquida la expedición calculando la utilidad neta real (P&L).

### FLUJO 6: Cancelaciones y Billetera (Wallet)
1. Con anticipación $\ge 72$ horas, el adelanto (menos gastos administrativos) se traslada a la billetera digital del cliente como saldo a favor y los cupos de transporte se liberan automáticamente.
