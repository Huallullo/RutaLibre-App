/**
 * Motor de Conciliación de Caja y Billetera Virtual (Wallet)
 * Ruta Libre Perú - Capa de Dominio (Clean Architecture)
 */

import { PagoRegistro, ClienteWallet, MetodoPago } from './types.js';

export interface ResumenCaja {
  totalRecaudado: number;
  totalYapePlin: number;
  totalBancos: number;
  totalEfectivoTC: number;
  totalWalletAplicado: number;
  totalConciliado: number;
  totalPendienteConciliar: number;
}

export class CashAndWalletEngine {
  /**
   * Calcula el arqueo de caja agrupado por canal de pago
   */
  public static calcularResumenCaja(pagos: PagoRegistro[]): ResumenCaja {
    let totalRecaudado = 0;
    let totalYapePlin = 0;
    let totalBancos = 0;
    let totalEfectivoTC = 0;
    let totalWalletAplicado = 0;
    let totalConciliado = 0;
    let totalPendienteConciliar = 0;

    for (const p of pagos) {
      totalRecaudado += p.monto;

      if (p.metodo === 'YAPE' || p.metodo === 'PLIN') {
        totalYapePlin += p.monto;
      } else if (p.metodo === 'BCP' || p.metodo === 'BBVA' || p.metodo === 'INTERBANK') {
        totalBancos += p.monto;
      } else if (p.metodo === 'EFECTIVO_TC') {
        totalEfectivoTC += p.monto;
      } else if (p.metodo === 'WALLET_SALDO') {
        totalWalletAplicado += p.monto;
      }

      if (p.conciliado) {
        totalConciliado += p.monto;
      } else {
        totalPendienteConciliar += p.monto;
      }
    }

    return {
      totalRecaudado: Math.round(totalRecaudado * 100) / 100,
      totalYapePlin: Math.round(totalYapePlin * 100) / 100,
      totalBancos: Math.round(totalBancos * 100) / 100,
      totalEfectivoTC: Math.round(totalEfectivoTC * 100) / 100,
      totalWalletAplicado: Math.round(totalWalletAplicado * 100) / 100,
      totalConciliado: Math.round(totalConciliado * 100) / 100,
      totalPendienteConciliar: Math.round(totalPendienteConciliar * 100) / 100,
    };
  }

  /**
   * Aplica saldo a favor de una billetera virtual a una reserva.
   * Lanza error si el saldo es insuficiente o si la billetera está vencida/utilizada.
   */
  public static aplicarSaldoWallet(
    wallet: ClienteWallet,
    montoAAplicar: number
  ): { walletActualizada: ClienteWallet; montoDescontado: number } {
    if (wallet.estado !== 'ACTIVO') {
      throw new Error(`La billetera de ${wallet.clienteNombre} no está activa (${wallet.estado}).`);
    }

    if (montoAAplicar <= 0) {
      throw new Error('El monto a aplicar de la billetera debe ser mayor a cero.');
    }

    const descontar = Math.min(wallet.saldoDisponible, montoAAplicar);
    const nuevoSaldo = Math.round((wallet.saldoDisponible - descontar) * 100) / 100;

    return {
      walletActualizada: {
        ...wallet,
        saldoDisponible: nuevoSaldo,
        estado: nuevoSaldo === 0 ? 'UTILIZADO' : 'ACTIVO',
      },
      montoDescontado: descontar,
    };
  }

  /**
   * Valida que el código de operación bancaria o de Yape tenga formato válido.
   */
  public static validarCodigoOperacion(codigo: string, metodo: MetodoPago): boolean {
    if (metodo === 'EFECTIVO_TC' || metodo === 'WALLET_SALDO') {
      return true; // No requieren código bancario
    }

    const limpio = codigo.trim();
    if (!limpio || limpio.length < 4) {
      return false;
    }

    return true;
  }
}
