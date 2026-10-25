import { describe, it, expect } from 'vitest';
import { PassengerValidator, ValidationError } from '../src/domain/passenger-validator.js';
import { PasajeroInput } from '../src/domain/types.js';

describe('QA Suite - Validador de Pasajeros y Documentos (PassengerValidator)', () => {
  it('debe validar exitosamente un DNI peruano de 8 dígitos numéricos', () => {
    expect(PassengerValidator.validarNumeroDocumento('DNI', '72345678')).toBe(true);
    expect(PassengerValidator.validarNumeroDocumento('DNI', '1234567')).toBe(false); // 7 dígitos
    expect(PassengerValidator.validarNumeroDocumento('DNI', '123456789')).toBe(false); // 9 dígitos
    expect(PassengerValidator.validarNumeroDocumento('DNI', '7234567A')).toBe(false); // Contiene letra
  });

  it('debe validar Carnet de Extranjería y Pasaporte', () => {
    expect(PassengerValidator.validarNumeroDocumento('CE', '001234567')).toBe(true);
    expect(PassengerValidator.validarNumeroDocumento('PASAPORTE', 'P123456')).toBe(true);
  });

  it('debe validar números de teléfono peruanos e internacionales', () => {
    expect(PassengerValidator.validarTelefono('987654321')).toBe(true);
    expect(PassengerValidator.validarTelefono('+51987654321')).toBe(true);
    expect(PassengerValidator.validarTelefono('123456')).toBe(false); // Muy corto
    expect(PassengerValidator.validarTelefono('887654321')).toBe(false); // No empieza en 9
  });

  it('debe aprobar un pasajero con datos normativos completos', () => {
    const pasajeroValido: PasajeroInput = {
      nombres: 'Gerson',
      apellidos: 'Vargas',
      tipoDocumento: 'DNI',
      numeroDocumento: '71234567',
      edad: 26,
      paraderoEmbarqueId: 'paradero-plaza-norte',
      contactoEmergenciaNombre: 'Rosa Vargas',
      contactoEmergenciaTelefono: '912345678',
    };

    expect(() => PassengerValidator.validarPasajero(pasajeroValido)).not.toThrow();
  });

  it('debe lanzar ValidationError con el campo específico si el DNI es inválido', () => {
    const pasajeroInvalido: PasajeroInput = {
      nombres: 'Gerson',
      apellidos: 'Vargas',
      tipoDocumento: 'DNI',
      numeroDocumento: 'DNI_FALSO', // Inválido
      edad: 26,
      paraderoEmbarqueId: 'paradero-plaza-norte',
    };

    try {
      PassengerValidator.validarPasajero(pasajeroInvalido);
      expect.fail('Debería haber lanzado ValidationError');
    } catch (err) {
      const error = err as ValidationError;
      expect(error.campo).toBe('numeroDocumento');
      expect(error.message).toContain('no tiene un formato válido');
    }
  });

  it('debe rechazar edades fuera del rango biológico o no enteras', () => {
    const base: PasajeroInput = {
      nombres: 'Ana',
      apellidos: 'Perez',
      tipoDocumento: 'DNI',
      numeroDocumento: '88990011',
      edad: -1, // Inválido
      paraderoEmbarqueId: 'san-borja',
    };

    expect(() => PassengerValidator.validarPasajero(base)).toThrow(/edad/);
  });
});
