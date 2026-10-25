/**
 * Motor de Precios y Cotizaciones - Ruta Libre Perú
 * Clean Architecture - Capa de Dominio
 * 
 * Reglas de Negocio:
 * 1. Infantes (< 4 años): Tarifa S/ 0.00 (en brazos, no ocupan asiento).
 * 2. Niños (4 a 10 años): Tarifa reducida de niño (si está configurada) o tarifa base.
 * 3. Grupo 4+ Pax: Si hay 4 o más pasajeros de pago, aplica tarifa especial por volumen.
 * 4. Preventa: Si aplica preventa y es menor a la tarifa regular, se aplica a los adultos.
 * 5. Cupones: Pueden ser monto fijo o porcentaje con tope máximo.
 * 6. Descuento Manual: Requiere justificación explícita de al menos 5 caracteres y autorización.
 * 7. Precisión monetaria estricta: Redondeo bancario a 2 decimales para evitar fugas de céntimos.
 */

import {
  CotizacionReservaInput,
  ResultadoCotizacion,
  DesglosePasajero,
} from './types.js';

export class PricingDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingDomainError';
  }
}

/**
 * Redondea un valor numérico a exactamente 2 decimales evitando errores de punto flotante.
 */
export function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export class PricingEngine {
  public static calcularCotizacion(input: CotizacionReservaInput): ResultadoCotizacion {
    const { tarifas, esPreventa, pasajeros, adicionalesCatalogo, cupon, descuentoManual } = input;

    if (!pasajeros || pasajeros.length === 0) {
      throw new PricingDomainError('La cotización requiere al menos un pasajero.');
    }

    // 1. Clasificar pasajeros por edad
    let countInfantes = 0;
    let countNinos = 0;
    let countAdultos = 0;

    for (const p of pasajeros) {
      if (p.edad < 0 || p.edad > 120) {
        throw new PricingDomainError(`Edad inválida (${p.edad}) para el pasajero ${p.nombres} ${p.apellidos}.`);
      }
      if (p.edad < 4) {
        countInfantes++;
      } else if (p.edad <= 10) {
        countNinos++;
      } else {
        countAdultos++;
      }
    }

    const pasajerosDePago = countNinos + countAdultos;
    const esGrupoPromocional = pasajerosDePago >= 4 && tarifas.precioGrupo4Mas !== undefined && tarifas.precioGrupo4Mas > 0;

    // 2. Determinar precio unitario de adultos
    let precioUnitarioAdulto = tarifas.precioBaseRegular;
    const desglosesDescuento: string[] = [];

    if (esGrupoPromocional && tarifas.precioGrupo4Mas) {
      precioUnitarioAdulto = tarifas.precioGrupo4Mas;
      desglosesDescuento.push(`Tarifa Grupo 4+ Pax aplicada (S/ ${tarifas.precioGrupo4Mas} por adulto en vez de S/ ${tarifas.precioBaseRegular})`);
    } else if (esPreventa && tarifas.precioPreventa && tarifas.precioPreventa > 0) {
      precioUnitarioAdulto = tarifas.precioPreventa;
      desglosesDescuento.push(`Tarifa Preventa aplicada (S/ ${tarifas.precioPreventa} por adulto en vez de S/ ${tarifas.precioBaseRegular})`);
    }

    // 3. Procesar cada pasajero individualmente
    let subtotalTours = 0;
    let subtotalAdicionales = 0;
    const desglosePasajeros: DesglosePasajero[] = [];

    for (const p of pasajeros) {
      let categoria: 'INFANTE_EN_BRAZOS' | 'NINO' | 'ADULTO';
      let precioTourPasajero = 0;

      if (p.edad < 4) {
        categoria = 'INFANTE_EN_BRAZOS';
        precioTourPasajero = 0.00; // En brazos
      } else if (p.edad <= 10) {
        categoria = 'NINO';
        // Si el precio de grupo o preventa es menor que el precio de niño, se beneficia de la mejor tarifa
        const precioNinoBase = tarifas.precioNino ?? tarifas.precioBaseRegular;
        precioTourPasajero = Math.min(precioNinoBase, precioUnitarioAdulto);
      } else {
        categoria = 'ADULTO';
        precioTourPasajero = precioUnitarioAdulto;
      }

      // Calcular adicionales de este pasajero
      let subtotalAdicionalesPasajero = 0;
      if (p.adicionalesIds && p.adicionalesIds.length > 0) {
        for (const adId of p.adicionalesIds) {
          const item = adicionalesCatalogo[adId];
          if (!item) {
            throw new PricingDomainError(`El adicional con ID '${adId}' no existe en el catálogo.`);
          }
          subtotalAdicionalesPasajero += item.precioVenta;
        }
      }

      precioTourPasajero = roundToTwoDecimals(precioTourPasajero);
      subtotalAdicionalesPasajero = roundToTwoDecimals(subtotalAdicionalesPasajero);

      subtotalTours += precioTourPasajero;
      subtotalAdicionales += subtotalAdicionalesPasajero;

      desglosePasajeros.push({
        nombreCompleto: `${p.nombres} ${p.apellidos}`.trim(),
        edad: p.edad,
        categoriaEdad: categoria,
        precioTour: precioTourPasajero,
        subtotalAdicionales: subtotalAdicionalesPasajero,
        totalPasajero: roundToTwoDecimals(precioTourPasajero + subtotalAdicionalesPasajero),
      });
    }

    subtotalTours = roundToTwoDecimals(subtotalTours);
    subtotalAdicionales = roundToTwoDecimals(subtotalAdicionales);

    // 4. Procesar Descuentos Globales (Cupones y Manuales)
    let totalDescuentos = 0;

    // Cupón promocional
    if (cupon && cupon.activo) {
      const ahora = new Date();
      if (cupon.fechaExpiracion && cupon.fechaExpiracion < ahora) {
        throw new PricingDomainError(`El cupón '${cupon.codigo}' ha expirado.`);
      }

      let montoDescCupon = 0;
      if (cupon.tipo === 'MONTO_FIJO') {
        montoDescCupon = cupon.valor;
      } else if (cupon.tipo === 'PORCENTAJE') {
        montoDescCupon = (subtotalTours * cupon.valor) / 100;
      }

      if (cupon.topeMaximoDescuento && montoDescCupon > cupon.topeMaximoDescuento) {
        montoDescCupon = cupon.topeMaximoDescuento;
      }

      montoDescCupon = roundToTwoDecimals(montoDescCupon);
      totalDescuentos += montoDescCupon;
      desglosesDescuento.push(`Cupón '${cupon.codigo}': -S/ ${montoDescCupon.toFixed(2)}`);
    }

    // Descuento manual de la dueña/administradora
    if (descuentoManual && descuentoManual.monto > 0) {
      if (!descuentoManual.autorizadoPorAdmin) {
        throw new PricingDomainError('El descuento manual no ha sido autorizado por la administración.');
      }
      if (!descuentoManual.motivo || descuentoManual.motivo.trim().length < 5) {
        throw new PricingDomainError('El descuento manual requiere un motivo justificativo de al menos 5 caracteres.');
      }

      const montoDescManual = roundToTwoDecimals(descuentoManual.monto);
      totalDescuentos += montoDescManual;
      desglosesDescuento.push(`Descuento Autorizado: -S/ ${montoDescManual.toFixed(2)} (Motivo: ${descuentoManual.motivo.trim()})`);
    }

    totalDescuentos = roundToTwoDecimals(totalDescuentos);

    // El descuento no puede exceder el total de la reserva (evita montos negativos)
    const subtotalBruto = roundToTwoDecimals(subtotalTours + subtotalAdicionales);
    if (totalDescuentos > subtotalBruto) {
      totalDescuentos = subtotalBruto;
    }

    const montoTotal = roundToTwoDecimals(subtotalBruto - totalDescuentos);

    // 5. Cálculo del Adelanto Mínimo Sugerido (Regla: 50% del total o S/ 30 por pasajero de pago)
    const reglaCincuentaPorciento = roundToTwoDecimals(montoTotal * 0.5);
    const reglaTreintaSolesPorPax = roundToTwoDecimals(pasajerosDePago * 30);
    const adelantoMinimoSugerido = Math.min(montoTotal, Math.max(reglaCincuentaPorciento, reglaTreintaSolesPorPax));

    return {
      totalPasajeros: pasajeros.length,
      asientosOcupados: pasajerosDePago,
      subtotalTours,
      subtotalAdicionales,
      descuentoAplicado: totalDescuentos,
      desgloseDescuento: desglosesDescuento,
      montoTotal,
      adelantoMinimoSugerido,
      desglosePasajeros,
    };
  }
}
