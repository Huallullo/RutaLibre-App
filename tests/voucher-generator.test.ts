import { describe, it, expect } from 'vitest';
import { VoucherGenerator, DatosVoucherReserva } from '../src/domain/voucher-generator.js';
import { ResultadoCotizacion } from '../src/domain/types.js';

describe('QA Suite - Generador de Vouchers para WhatsApp (VoucherGenerator)', () => {
  it('debe estructurar correctamente el mensaje con emojis y saldos transparentes', () => {
    const cotizacionMock: ResultadoCotizacion = {
      totalPasajeros: 2,
      asientosOcupados: 2,
      subtotalTours: 178.0,
      subtotalAdicionales: 45.0,
      descuentoAplicado: 0.0,
      desgloseDescuento: [],
      montoTotal: 223.0,
      adelantoMinimoSugerido: 111.5,
      desglosePasajeros: [
        {
          nombreCompleto: 'Carlos Mendoza',
          edad: 28,
          categoriaEdad: 'ADULTO',
          precioTour: 89.0,
          subtotalAdicionales: 45.0,
          totalPasajero: 134.0,
        },
        {
          nombreCompleto: 'Ana Soto',
          edad: 26,
          categoriaEdad: 'ADULTO',
          precioTour: 89.0,
          subtotalAdicionales: 0.0,
          totalPasajero: 89.0,
        },
      ],
    };

    const datos: DatosVoucherReserva = {
      codigoReserva: 'RL-2026-0042',
      codigoExpedicion: 'EXP-20261102-LUN-01',
      nombreTour: 'Full Day Lunahuaná Aventura',
      fechaSalida: 'Sábado 02 de Noviembre 2026',
      horaConcentracion: '04:15 AM',
      titularNombre: 'Carlos Mendoza',
      titularTelefono: '987654321',
      cotizacion: cotizacionMock,
      montoAdelantoPagado: 100.0,
      saldoPendiente: 123.0, // 223 - 100
      puntoEmbarquePrincipal: 'Plaza Norte - Los Olivos (04:30 AM)',
    };

    const mensaje = VoucherGenerator.generarMensajeWhatsApp(datos);

    expect(mensaje).toContain('*¡RESERVA CONFIRMADA - RUTA LIBRE PERÚ!*');
    expect(mensaje).toContain('RL-2026-0042');
    expect(mensaje).toContain('Carlos Mendoza');
    expect(mensaje).toContain('Ana Soto');
    expect(mensaje).toContain('*Costo Total:* S/ 223.00');
    expect(mensaje).toContain('*Adelanto Recibido:* S/ 100.00');
    expect(mensaje).toContain('*SALDO A PAGAR AL SUBIR AL BUS:* *S/ 123.00*');
    expect(mensaje).toContain('Plaza Norte - Los Olivos (04:30 AM)');
  });
});
