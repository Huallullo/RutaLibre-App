/**
 * Generador de Vouchers y Enlaces de Envío Directo a WhatsApp
 * Ruta Libre Perú - Capa de Dominio
 */

import { ResultadoCotizacion } from './types.js';

export interface DatosVoucherReserva {
  codigoReserva: string;
  codigoExpedicion: string;
  nombreTour: string;
  fechaSalida: string;
  horaConcentracion: string;
  titularNombre: string;
  titularTelefono: string;
  cotizacion: ResultadoCotizacion;
  montoAdelantoPagado: number;
  saldoPendiente: number;
  puntoEmbarquePrincipal: string;
  asientosAsignados?: number[];
  enlaceUbicacionMaps?: string;
}

export class VoucherGenerator {
  /**
   * Genera el texto formal y optimizado para enviar al cliente por WhatsApp.
   */
  public static generarMensajeWhatsApp(datos: DatosVoucherReserva): string {
    const {
      codigoReserva,
      nombreTour,
      fechaSalida,
      horaConcentracion,
      titularNombre,
      cotizacion,
      montoAdelantoPagado,
      saldoPendiente,
      puntoEmbarquePrincipal,
      asientosAsignados,
      enlaceUbicacionMaps,
    } = datos;

    const lineas: string[] = [];

    lineas.push(`✨ *¡RESERVA CONFIRMADA - RUTA LIBRE PERÚ!* ✨`);
    lineas.push(`¡Hola *${titularNombre}*! Tu viaje ha sido registrado con éxito.`);
    lineas.push(``);
    lineas.push(`📌 *DATOS DEL VIAJE:*`);
    lineas.push(`• *Tour:* ${nombreTour}`);
    lineas.push(`• *Fecha de Salida:* ${fechaSalida}`);
    lineas.push(`• *Hora de Embarque:* ${horaConcentracion}`);
    lineas.push(`• *Punto de Embarque:* ${puntoEmbarquePrincipal}`);
    if (enlaceUbicacionMaps) {
      lineas.push(`• *Croquis / GPS Paradero:* ${enlaceUbicacionMaps}`);
    }
    if (asientosAsignados && asientosAsignados.length > 0) {
      const asientosFormateados = asientosAsignados.map((a) => `#${a < 10 ? '0' + a : a}`).join(', ');
      lineas.push(`• *Butacas Asignadas:* ${asientosFormateados}`);
    }
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

  /**
   * Sanitiza el número de teléfono (asumiendo Perú +51 por defecto si son 9 dígitos)
   * y genera la URL oficial para abrir WhatsApp Web / WhatsApp App con el mensaje listo.
   */
  public static generarEnlaceWhatsApp(telefono: string, mensaje: string): string {
    const soloDigitos = telefono.replace(/\D/g, '');

    let numeroInternacional = soloDigitos;
    // Si tiene 9 dígitos (formato estándar peruano 9XXXXXXXX), anteponer código país 51
    if (soloDigitos.length === 9 && soloDigitos.startsWith('9')) {
      numeroInternacional = `51${soloDigitos}`;
    }

    const textoCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${numeroInternacional}?text=${textoCodificado}`;
  }
}
