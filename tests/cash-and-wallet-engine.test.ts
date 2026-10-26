import { describe, it, expect } from 'vitest';
import { CashAndWalletEngine } from '../src/domain/cash-and-wallet-engine.js';
import { PagoRegistro, ClienteWallet } from '../src/domain/types.js';

describe('QA Suite - Conciliación de Caja y Billetera Virtual (CashAndWalletEngine)', () => {
  const pagosMock: PagoRegistro[] = [
    {
      id: 'p-1',
      codigoOperacion: '948120',
      expedicionCodigo: 'EXP-LUN-01',
      titularNombre: 'Carlos Mendoza',
      monto: 100.0,
      metodo: 'YAPE',
      fechaHora: '2026-11-01 14:30',
      conciliado: true,
      registradoPor: 'Counter 1',
    },
    {
      id: 'p-2',
      codigoOperacion: 'PLIN-3321',
      expedicionCodigo: 'EXP-LUN-01',
      titularNombre: 'Ana Soto',
      monto: 50.0,
      metodo: 'PLIN',
      fechaHora: '2026-11-01 15:10',
      conciliado: true,
      registradoPor: 'Counter 1',
    },
    {
      id: 'p-3',
      codigoOperacion: 'BCP-0012984',
      expedicionCodigo: 'EXP-PAR-01',
      titularNombre: 'Gerson Huamán',
      monto: 200.0,
      metodo: 'BCP',
      fechaHora: '2026-11-01 16:00',
      conciliado: false,
      registradoPor: 'Counter 2',
    },
    {
      id: 'p-4',
      expedicionCodigo: 'EXP-LUN-01',
      titularNombre: 'Valeria Quispe',
      monto: 89.0,
      metodo: 'EFECTIVO_TC',
      fechaHora: '2026-11-02 04:30',
      conciliado: true,
      registradoPor: 'Guía Carlos Mendoza',
    },
  ];

  it('debe calcular el resumen y arqueo de caja con precisión de centavos', () => {
    const resumen = CashAndWalletEngine.calcularResumenCaja(pagosMock);

    expect(resumen.totalRecaudado).toBe(439.0);
    expect(resumen.totalYapePlin).toBe(150.0);
    expect(resumen.totalBancos).toBe(200.0);
    expect(resumen.totalEfectivoTC).toBe(89.0);
    expect(resumen.totalConciliado).toBe(239.0);
    expect(resumen.totalPendienteConciliar).toBe(200.0);
  });

  it('debe aplicar saldo de billetera virtual correctamente', () => {
    const walletMock: ClienteWallet = {
      id: 'w-1',
      clienteNombre: 'Diana Mendoza',
      clienteDni: '71458963',
      clienteTelefono: '987654321',
      saldoDisponible: 100.0,
      motivoCredito: 'Reprogramación por lluvia en Canta',
      fechaEmision: '2026-10-15',
      fechaExpiracion: '2027-01-15',
      estado: 'ACTIVO',
    };

    const resultado = CashAndWalletEngine.aplicarSaldoWallet(walletMock, 70.0);
    expect(resultado.montoDescontado).toBe(70.0);
    expect(resultado.walletActualizada.saldoDisponible).toBe(30.0);
    expect(resultado.walletActualizada.estado).toBe('ACTIVO');

    // Descontar todo el saldo restante
    const resultadoTotal = CashAndWalletEngine.aplicarSaldoWallet(resultado.walletActualizada, 50.0);
    expect(resultadoTotal.montoDescontado).toBe(30.0);
    expect(resultadoTotal.walletActualizada.saldoDisponible).toBe(0.0);
    expect(resultadoTotal.walletActualizada.estado).toBe('UTILIZADO');
  });

  it('debe rechazar aplicar saldo si la billetera está vencida o inactiva', () => {
    const walletInactiva: ClienteWallet = {
      id: 'w-2',
      clienteNombre: 'Pedro Gomez',
      clienteDni: '44556677',
      clienteTelefono: '912345678',
      saldoDisponible: 50.0,
      motivoCredito: 'Cancelación previa',
      fechaEmision: '2026-01-01',
      fechaExpiracion: '2026-04-01',
      estado: 'VENCIDO',
    };

    expect(() => CashAndWalletEngine.aplicarSaldoWallet(walletInactiva, 50.0)).toThrow(
      /no está activa/
    );
  });
});
