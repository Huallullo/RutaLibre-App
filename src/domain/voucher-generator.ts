/**
 * Generador de Vouchers y Mensajes de Confirmación para WhatsApp
 * Ruta Libre Perú - Capa de Dominio
 */

import { ResultadoCotizacion } from './types.js';

export interface DatosVoucherReserva {
  codigoReserva: string;
  codigoExpedicion: string;
  nombreTour: string;
  fechaSalida: string; // Ej: 'Sábado 02 de Noviembre'
  horaConcentracion: string; // Ej: '04:15 AM'
  titularNombre: string;
  titularTelefono: string;
  cotizacion: ResultadoCotizacion;
  montoAdelantoPagado: number;
  saldoPendiente: number;
  puntoEmbarquePrincipal: string;
}

export class VoucherGenerator {
  /**
   * Genera el texto formal y optimizado para enviar al cliente por WhatsApp en 1 clic.
   */
  public static generarMensajeWhatsApp(datos: DatosVoucherReserva): string {
    const {
      codigoReserva,
      nombreTour,
      fechaSalida,
      titularNombre,
      cotizacion,
      montoAdelantoPagado,
      saldoPendiente,
      puntoEmbarquePrincipal,
    } = datos;

    const lineas: string[] = [];

    lineas.push(`✨ *¡RESERVA CONFIRMADA - RUTA LIBRE PERÚ!* ✨`);
    lineas.push(`¡Hola *${titularNombre}*! Tu viaje ha sido registrado con éxito.`);
    lineas.push(``);
    lineas.push(`📌 *DATOS DEL VIAJE:*`);
    lineas.push(`• *Tour:* ${nombreTour}`);
    lineas.push(`• *Fecha de Salida:* ${fechaSalida}`);
    lineas.push(`• *Punto de Embarque:* ${puntoEmbarquePrincipal}`);
    lineas.push(`• *Código de Reserva:* \`${codigoReserva}\``);
    lineas.push(``);
    lineas.push(`👥 *PASAJEROS REGISTRADOS (${cotizacion.totalPasajeros}):*`);

    for (const p of cotizacion.desglosePasajeros) {
      const infoAdicionales = p.subtotalAdicionales > 0 ? ` (+S/ ${p.subtotalAdicionales.toFixed(2)} extras)` : '';
      lineas.push(`• ${p.nombreCompleto} (${p.edad} años)${infoAdicionales}`);
    }

    lineas.push(``);
    lineas.push(`💰 *RESUMEN DE CUENTAS:*`);
    lineas.push(`• *Costo Total:* S/ ${cotizacion.montoTotal.toFixed(2)}`);
    lineas.push(`• *Adelanto Recibido:* S/ ${montoAdelantoPagado.toFixed(2)} ✅`);
    lineas.push(`• *SALDO A PAGAR AL SUBIR AL BUS:* *S/ ${saldoPendiente.toFixed(2)}* 💵`);

    if (cotizacion.descuentoAplicado > 0) {
      lineas.push(`• _Descuentos aplicados: S/ ${cotizacion.descuentoAplicado.toFixed(2)}_`);
    }

    lineas.push(``);
    lineas.push(`⚠️ *INDICACIONES IMPORTANTES:*`);
    lineas.push(`1. Presentarse 15 minutos antes de la hora indicada en su paradero.`);
    lineas.push(`2. Portar DNI o documento de identidad físico obligatorio (norma SUTRAN).`);
    lineas.push(`3. Cancelar el saldo pendiente en efectivo o Yape con el Tour Conductor al abordar.`);
    lineas.push(``);
    lineas.push(`¡Gracias por viajar con nosotros! Nos vemos en la ruta. 🚌🏔️`);

    return lineas.join('\n');
  }
}
