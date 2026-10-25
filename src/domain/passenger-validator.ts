/**
 * Validador de Identidad y Pasajeros - Ruta Libre Perú
 * Normativa: SUTRAN / MTC / RENIEC (Formato DNI, CE y Pasaporte)
 * Clean Architecture - Capa de Dominio
 */

import { PasajeroInput, TipoDocumento } from './types.js';

export class ValidationError extends Error {
  public readonly campo: string;

  constructor(campo: string, message: string) {
    super(`Error de Validación [${campo}]: ${message}`);
    this.name = 'ValidationError';
    this.campo = campo;
  }
}

export class PassengerValidator {
  /**
   * Valida un número de documento según su tipo normativo en Perú.
   */
  public static validarNumeroDocumento(tipo: TipoDocumento, numero: string): boolean {
    const limpio = numero.trim();

    switch (tipo) {
      case 'DNI':
        // DNI peruano: exactamente 8 dígitos numéricos
        return /^\d{8}$/.test(limpio);
      case 'CE':
        // Carné de Extranjería: 9 a 12 caracteres alfanuméricos
        return /^[a-zA-Z0-9]{9,12}$/.test(limpio);
      case 'PASAPORTE':
        // Pasaporte internacional: 6 a 12 caracteres alfanuméricos
        return /^[a-zA-Z0-9]{6,12}$/.test(limpio);
      default:
        return false;
    }
  }

  /**
   * Valida un número telefónico (Perú: 9 dígitos iniciando en 9, o formato internacional con +).
   */
  public static validarTelefono(telefono: string): boolean {
    const limpio = telefono.replace(/\s+/g, '');
    // Celular peruano: 9XXXXXXXX o internacional +519XXXXXXXX / +XX...
    return /^(\+?\d{1,4})?9\d{8}$/.test(limpio) || /^\+\d{8,15}$/.test(limpio);
  }

  /**
   * Valida integralmente los datos de un pasajero para el Manifiesto Oficial.
   */
  public static validarPasajero(pasajero: PasajeroInput): void {
    if (!pasajero.nombres || pasajero.nombres.trim().length < 2) {
      throw new ValidationError('nombres', 'Los nombres deben tener al menos 2 caracteres.');
    }

    if (!pasajero.apellidos || pasajero.apellidos.trim().length < 2) {
      throw new ValidationError('apellidos', 'Los apellidos deben tener al menos 2 caracteres.');
    }

    if (!this.validarNumeroDocumento(pasajero.tipoDocumento, pasajero.numeroDocumento)) {
      throw new ValidationError(
        'numeroDocumento',
        `El número de ${pasajero.tipoDocumento} '${pasajero.numeroDocumento}' no tiene un formato válido.`
      );
    }

    if (pasajero.edad < 0 || pasajero.edad > 120 || !Number.isInteger(pasajero.edad)) {
      throw new ValidationError('edad', 'La edad debe ser un número entero entre 0 y 120 años.');
    }

    if (!pasajero.paraderoEmbarqueId || pasajero.paraderoEmbarqueId.trim() === '') {
      throw new ValidationError('paraderoEmbarqueId', 'Debe seleccionar un punto de embarque.');
    }

    if (pasajero.contactoEmergenciaTelefono && pasajero.contactoEmergenciaTelefono.trim() !== '') {
      if (!this.validarTelefono(pasajero.contactoEmergenciaTelefono)) {
        throw new ValidationError(
          'contactoEmergenciaTelefono',
          `El teléfono de emergencia '${pasajero.contactoEmergenciaTelefono}' no es válido.`
        );
      }
    }
  }
}
