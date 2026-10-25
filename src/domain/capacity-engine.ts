/**
 * Motor de Capacidad, Aforo y Prevención de Overbooking - Ruta Libre Perú
 * Clean Architecture - Capa de Dominio
 */

import { EstadoAforo } from './types.js';

export class CapacityExceededError extends Error {
  public readonly asientosDisponibles: number;
  public readonly asientosSolicitados: number;

  constructor(asientosDisponibles: number, asientosSolicitados: number) {
    super(
      `Capacidad excedida: Se solicitaron ${asientosSolicitados} asientos pero solo quedan ${asientosDisponibles} disponibles.`
    );
    this.name = 'CapacityExceededError';
    this.asientosDisponibles = asientosDisponibles;
    this.asientosSolicitados = asientosSolicitados;
  }
}

export class CapacityEngine {
  /**
   * Evalúa el estado del aforo actual de una expedición.
   */
  public static evaluarAforo(
    capacidadTotal: number,
    cupoMinimoBreakEven: number,
    asientosOcupados: number
  ): EstadoAforo {
    if (capacidadTotal <= 0) {
      throw new Error('La capacidad total de la unidad debe ser mayor a cero.');
    }
    if (asientosOcupados < 0) {
      throw new Error('Los asientos ocupados no pueden ser negativos.');
    }

    const asientosDisponibles = Math.max(0, capacidadTotal - asientosOcupados);
    const estaLleno = asientosDisponibles === 0;
    const alcanzoBreakEven = asientosOcupados >= cupoMinimoBreakEven;

    let semaforo: 'DISPONIBLE' | 'ULTIMOS_CUPOS' | 'LLENO';
    if (estaLleno) {
      semaforo = 'LLENO';
    } else if (asientosDisponibles <= 3) {
      semaforo = 'ULTIMOS_CUPOS';
    } else {
      semaforo = 'DISPONIBLE';
    }

    return {
      capacidadTotal,
      cupoMinimoBreakEven,
      asientosOcupados,
      asientosDisponibles,
      estaLleno,
      alcanzoBreakEven,
      semaforo,
    };
  }

  /**
   * Valida si una nueva reserva puede ingresar a la expedición sin generar sobreventa.
   * Lanza `CapacityExceededError` si excede el aforo.
   */
  public static validarReservaEntrante(
    capacidadTotal: number,
    asientosOcupadosActuales: number,
    nuevosAsientosSolicitados: number
  ): { asientosRestantesTrasReserva: number } {
    if (nuevosAsientosSolicitados <= 0) {
      throw new Error('Debe solicitar al menos un asiento.');
    }

    const disponibles = Math.max(0, capacidadTotal - asientosOcupadosActuales);
    if (nuevosAsientosSolicitados > disponibles) {
      throw new CapacityExceededError(disponibles, nuevosAsientosSolicitados);
    }

    return {
      asientosRestantesTrasReserva: disponibles - nuevosAsientosSolicitados,
    };
  }
}
