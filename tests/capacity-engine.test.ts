import { describe, it, expect } from 'vitest';
import { CapacityEngine, CapacityExceededError } from '../src/domain/capacity-engine.js';

describe('QA Suite - Motor de Capacidad y Prevención de Overbooking (CapacityEngine)', () => {
  const CAPACIDAD_SPRINTER = 19;
  const BREAK_EVEN_SPRINTER = 12;

  it('debe evaluar correctamente el semáforo en verde cuando hay amplia disponibilidad', () => {
    // 5 asientos ocupados de 19
    const aforo = CapacityEngine.evaluarAforo(CAPACIDAD_SPRINTER, BREAK_EVEN_SPRINTER, 5);

    expect(aforo.asientosDisponibles).toBe(14);
    expect(aforo.semaforo).toBe('DISPONIBLE');
    expect(aforo.estaLleno).toBe(false);
    expect(aforo.alcanzoBreakEven).toBe(false); // 5 < 12
  });

  it('debe marcar semáforo amarillo (ULTIMOS_CUPOS) cuando quedan entre 1 y 3 asientos', () => {
    // 17 asientos ocupados de 19 -> Quedan 2
    const aforo = CapacityEngine.evaluarAforo(CAPACIDAD_SPRINTER, BREAK_EVEN_SPRINTER, 17);

    expect(aforo.asientosDisponibles).toBe(2);
    expect(aforo.semaforo).toBe('ULTIMOS_CUPOS');
    expect(aforo.estaLleno).toBe(false);
    expect(aforo.alcanzoBreakEven).toBe(true); // 17 >= 12
  });

  it('debe marcar semáforo rojo (LLENO) y bloquear cuando no quedan asientos', () => {
    // 19 asientos ocupados de 19 -> Quedan 0
    const aforo = CapacityEngine.evaluarAforo(CAPACIDAD_SPRINTER, BREAK_EVEN_SPRINTER, 19);

    expect(aforo.asientosDisponibles).toBe(0);
    expect(aforo.semaforo).toBe('LLENO');
    expect(aforo.estaLleno).toBe(true);
    expect(aforo.alcanzoBreakEven).toBe(true);
  });

  it('debe permitir la reserva si los asientos solicitados caben en la unidad', () => {
    // Hay 15 ocupados de 19 (quedan 4). Se solicitan 3.
    const validacion = CapacityEngine.validarReservaEntrante(CAPACIDAD_SPRINTER, 15, 3);

    expect(validacion.asientosRestantesTrasReserva).toBe(1);
  });

  it('debe rechazar con CapacityExceededError si se intenta sobrevender (Overbooking)', () => {
    // Hay 17 ocupados de 19 (quedan 2). Un cliente en WhatsApp pide 3 asientos.
    expect(() => {
      CapacityEngine.validarReservaEntrante(CAPACIDAD_SPRINTER, 17, 3);
    }).toThrow(CapacityExceededError);

    try {
      CapacityEngine.validarReservaEntrante(CAPACIDAD_SPRINTER, 17, 3);
    } catch (err) {
      const error = err as CapacityExceededError;
      expect(error.asientosDisponibles).toBe(2);
      expect(error.asientosSolicitados).toBe(3);
      expect(error.message).toContain('Se solicitaron 3 asientos pero solo quedan 2 disponibles');
    }
  });

  it('debe lanzar error si la capacidad total configurada es inválida (<= 0)', () => {
    expect(() => CapacityEngine.evaluarAforo(0, 10, 0)).toThrow('mayor a cero');
  });
});
