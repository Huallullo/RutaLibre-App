import { describe, it, expect } from 'vitest';
import { PricingEngine, PricingDomainError } from '../src/domain/pricing-engine.js';
import { CotizacionReservaInput, TourTarifas, AdicionalItem } from '../src/domain/types.js';

describe('QA Suite - Motor de Precios y Cotizaciones (PricingEngine)', () => {
  const tarifasEstandar: TourTarifas = {
    precioBaseRegular: 89.0,
    precioPreventa: 79.0,
    precioGrupo4Mas: 69.0,
    precioNino: 59.0,
  };

  const catalogoAdicionales: Record<string, AdicionalItem> = {
    bote: { id: 'bote', nombre: 'Bote Ballestas', precioVenta: 35.0, costoProveedor: 25.0 },
    cuatrimoto: { id: 'cuatrimoto', nombre: 'Cuatrimotos', precioVenta: 45.0, costoProveedor: 30.0 },
    almuerzo: { id: 'almuerzo', nombre: 'Menú Campestre', precioVenta: 25.0, costoProveedor: 18.0 },
  };

  it('debe calcular tarifa regular individual para 1 adulto sin adicionales', () => {
    const input: CotizacionReservaInput = {
      tarifas: tarifasEstandar,
      pasajeros: [
        {
          nombres: 'Carlos',
          apellidos: 'Mendoza',
          tipoDocumento: 'DNI',
          numeroDocumento: '45678901',
          edad: 28,
          paraderoEmbarqueId: 'plaza-norte',
        },
      ],
      adicionalesCatalogo: catalogoAdicionales,
    };

    const resultado = PricingEngine.calcularCotizacion(input);

    expect(resultado.totalPasajeros).toBe(1);
    expect(resultado.asientosOcupados).toBe(1);
    expect(resultado.subtotalTours).toBe(89.0);
    expect(resultado.subtotalAdicionales).toBe(0.0);
    expect(resultado.descuentoAplicado).toBe(0.0);
    expect(resultado.montoTotal).toBe(89.0);
    // Adelanto mínimo: 50% de 89 = 44.50 (mayor que S/ 30 * 1 pax)
    expect(resultado.adelantoMinimoSugerido).toBe(44.5);
  });

  it('debe aplicar tarifa S/ 0 a infante menor de 4 años en brazos y no contar como asiento ocupado', () => {
    const input: CotizacionReservaInput = {
      tarifas: tarifasEstandar,
      pasajeros: [
        {
          nombres: 'María',
          apellidos: 'Rojas',
          tipoDocumento: 'DNI',
          numeroDocumento: '44556677',
          edad: 30,
          paraderoEmbarqueId: 'san-borja',
        },
        {
          nombres: 'Bebé',
          apellidos: 'Rojas',
          tipoDocumento: 'DNI',
          numeroDocumento: '88776655',
          edad: 2, // Infante en brazos
          paraderoEmbarqueId: 'san-borja',
        },
      ],
      adicionalesCatalogo: catalogoAdicionales,
    };

    const resultado = PricingEngine.calcularCotizacion(input);

    expect(resultado.totalPasajeros).toBe(2);
    expect(resultado.asientosOcupados).toBe(1); // Solo la madre ocupa asiento físico
    expect(resultado.subtotalTours).toBe(89.0); // 89 (madre) + 0 (bebé)
    expect(resultado.montoTotal).toBe(89.0);
    expect(resultado.desglosePasajeros[1]?.categoriaEdad).toBe('INFANTE_EN_BRAZOS');
    expect(resultado.desglosePasajeros[1]?.precioTour).toBe(0.0);
  });

  it('debe aplicar tarifa reducida a niño (edad 6 años)', () => {
    const input: CotizacionReservaInput = {
      tarifas: tarifasEstandar,
      pasajeros: [
        {
          nombres: 'Pedro',
          apellidos: 'Gómez',
          tipoDocumento: 'DNI',
          numeroDocumento: '12345678',
          edad: 6, // Niño
          paraderoEmbarqueId: 'plaza-norte',
        },
      ],
      adicionalesCatalogo: catalogoAdicionales,
    };

    const resultado = PricingEngine.calcularCotizacion(input);

    expect(resultado.asientosOcupados).toBe(1);
    expect(resultado.subtotalTours).toBe(59.0); // Tarifa niño S/ 59
    expect(resultado.desglosePasajeros[0]?.categoriaEdad).toBe('NINO');
  });

  it('debe activar automáticamente tarifa de Grupo (S/ 69) a partir de 4 pasajeros de pago', () => {
    const input: CotizacionReservaInput = {
      tarifas: tarifasEstandar,
      pasajeros: [
        { nombres: 'A1', apellidos: 'P1', tipoDocumento: 'DNI', numeroDocumento: '11111111', edad: 25, paraderoEmbarqueId: 'p1' },
        { nombres: 'A2', apellidos: 'P2', tipoDocumento: 'DNI', numeroDocumento: '22222222', edad: 26, paraderoEmbarqueId: 'p1' },
        { nombres: 'A3', apellidos: 'P3', tipoDocumento: 'DNI', numeroDocumento: '33333333', edad: 27, paraderoEmbarqueId: 'p1' },
        { nombres: 'A4', apellidos: 'P4', tipoDocumento: 'DNI', numeroDocumento: '44444444', edad: 28, paraderoEmbarqueId: 'p1' },
      ],
      adicionalesCatalogo: catalogoAdicionales,
    };

    const resultado = PricingEngine.calcularCotizacion(input);

    expect(resultado.totalPasajeros).toBe(4);
    expect(resultado.asientosOcupados).toBe(4);
    // 4 pasajeros * S/ 69 = S/ 276 (en vez de 4 * S/ 89 = S/ 356)
    expect(resultado.subtotalTours).toBe(276.0);
    expect(resultado.montoTotal).toBe(276.0);
    expect(resultado.desgloseDescuento[0]).toContain('Tarifa Grupo 4+ Pax aplicada');
  });

  it('debe sumar correctamente los adicionales personalizados por pasajero', () => {
    const input: CotizacionReservaInput = {
      tarifas: tarifasEstandar,
      pasajeros: [
        {
          nombres: 'Luis',
          apellidos: 'Torres',
          tipoDocumento: 'DNI',
          numeroDocumento: '55667788',
          edad: 32,
          paraderoEmbarqueId: 'p1',
          adicionalesIds: ['bote', 'cuatrimoto'], // +35 + 45 = +80
        },
        {
          nombres: 'Elena',
          apellidos: 'Vega',
          tipoDocumento: 'DNI',
          numeroDocumento: '99887766',
          edad: 30,
          paraderoEmbarqueId: 'p1',
          adicionalesIds: ['almuerzo'], // +25
        },
      ],
      adicionalesCatalogo: catalogoAdicionales,
    };

    const resultado = PricingEngine.calcularCotizacion(input);

    expect(resultado.subtotalTours).toBe(178.0); // 89 * 2
    expect(resultado.subtotalAdicionales).toBe(105.0); // 80 + 25
    expect(resultado.montoTotal).toBe(283.0); // 178 + 105
  });

  it('debe aplicar cupones promocionales con tope máximo', () => {
    const input: CotizacionReservaInput = {
      tarifas: tarifasEstandar,
      pasajeros: [
        { nombres: 'A1', apellidos: 'P1', tipoDocumento: 'DNI', numeroDocumento: '11111111', edad: 25, paraderoEmbarqueId: 'p1' },
      ],
      adicionalesCatalogo: catalogoAdicionales,
      cupon: {
        codigo: 'TIKTOK20',
        tipo: 'PORCENTAJE',
        valor: 20, // 20% de 89 = 17.80
        topeMaximoDescuento: 15.0, // Tope máximo permitido: S/ 15
        activo: true,
      },
    };

    const resultado = PricingEngine.calcularCotizacion(input);

    expect(resultado.descuentoAplicado).toBe(15.0); // Respeta el tope
    expect(resultado.montoTotal).toBe(74.0); // 89 - 15
  });

  it('debe exigir justificación válida para descuentos manuales de la dueña', () => {
    const inputInvalido: CotizacionReservaInput = {
      tarifas: tarifasEstandar,
      pasajeros: [
        { nombres: 'A1', apellidos: 'P1', tipoDocumento: 'DNI', numeroDocumento: '11111111', edad: 25, paraderoEmbarqueId: 'p1' },
      ],
      adicionalesCatalogo: catalogoAdicionales,
      descuentoManual: {
        monto: 20.0,
        motivo: 'ok', // Demasiado corto (< 5 caracteres)
        autorizadoPorAdmin: true,
      },
    };

    expect(() => PricingEngine.calcularCotizacion(inputInvalido)).toThrow(PricingDomainError);
    expect(() => PricingEngine.calcularCotizacion(inputInvalido)).toThrow(/al menos 5 caracteres/);
  });
});
