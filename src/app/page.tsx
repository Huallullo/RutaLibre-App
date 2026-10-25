'use client';

import React, { useState, useMemo } from 'react';
import { 
  Bus, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Send, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  Tag
} from 'lucide-react';

import { PricingEngine } from '@/domain/pricing-engine';
import { CapacityEngine } from '@/domain/capacity-engine';
import { PassengerValidator } from '@/domain/passenger-validator';
import { VoucherGenerator } from '@/domain/voucher-generator';
import { 
  PasajeroInput, 
  TourTarifas, 
  AdicionalItem, 
  CotizacionReservaInput 
} from '@/domain/types';

// Mock Data de Salidas Iniciales de la Agencia
interface ExpedicionMock {
  id: string;
  codigo: string;
  tourNombre: string;
  fecha: string;
  horaEmbarque: string;
  capacidadTotal: number;
  asientosOcupados: number;
  chofer: string;
  placa: string;
  guiaTC: string;
  precioBase: number;
  precioGrupo4Mas: number;
  precioNino: number;
}

const EXPEDICIONES_INICIALES: ExpedicionMock[] = [
  {
    id: 'exp-1',
    codigo: 'EXP-20261102-LUN-01',
    tourNombre: 'Full Day Lunahuaná & Canotaje Aventura',
    fecha: 'Sábado 02 de Noviembre',
    horaEmbarque: '04:15 AM',
    capacidadTotal: 19,
    asientosOcupados: 14,
    chofer: 'Manuel Quispe',
    placa: 'B1X-782 (Sprinter)',
    guiaTC: 'Carlos Mendoza',
    precioBase: 89.0,
    precioGrupo4Mas: 69.0,
    precioNino: 59.0,
  },
  {
    id: 'exp-2',
    codigo: 'EXP-20261102-PAR-01',
    tourNombre: 'Full Day Paracas, Ica & Huacachina',
    fecha: 'Sábado 02 de Noviembre',
    horaEmbarque: '03:45 AM',
    capacidadTotal: 19,
    asientosOcupados: 18,
    chofer: 'Jorge Ramos',
    placa: 'F5T-910 (Sprinter)',
    guiaTC: 'Lucía Benites',
    precioBase: 99.0,
    precioGrupo4Mas: 85.0,
    precioNino: 69.0,
  },
  {
    id: 'exp-3',
    codigo: 'EXP-20261103-RAU-01',
    tourNombre: 'Full Day Nevado Raura & Cordillera',
    fecha: 'Domingo 03 de Noviembre',
    horaEmbarque: '03:30 AM',
    capacidadTotal: 15,
    asientosOcupados: 8,
    chofer: 'Héctor Silva',
    placa: 'C4M-112 (H1 4x4)',
    guiaTC: 'Renzo Paredes',
    precioBase: 129.0,
    precioGrupo4Mas: 110.0,
    precioNino: 95.0,
  },
];

const CATALOGO_ADICIONALES: Record<string, AdicionalItem> = {
  bote: { id: 'bote', nombre: 'Paseo en Bote a Islas Ballestas', precioVenta: 35.0, costoProveedor: 25.0 },
  cuatrimoto: { id: 'cuatrimoto', nombre: 'Cuatrimotos Lunahuaná (30 min)', precioVenta: 45.0, costoProveedor: 30.0 },
  canotaje: { id: 'canotaje', nombre: 'Canotaje Río Cañete', precioVenta: 40.0, costoProveedor: 28.0 },
  almuerzo: { id: 'almuerzo', nombre: 'Almuerzo Campestre Típico', precioVenta: 25.0, costoProveedor: 18.0 },
};

const PARADEROS = [
  { id: 'plaza-norte', nombre: 'Plaza Norte - Los Olivos (04:15 AM)' },
  { id: 'san-borja', nombre: 'Calle Comercio / Javier Prado - San Borja (04:50 AM)' },
  { id: 'mall-sur', nombre: 'Mall del Sur - Puente Alipio (05:25 AM)' },
];

export default function DashboardPage() {
  const [expediciones, setExpediciones] = useState<ExpedicionMock[]>(EXPEDICIONES_INICIALES);
  const [salidaSeleccionadaId, setSalidaSeleccionadaId] = useState<string>('exp-1');
  const [copiado, setCopiado] = useState(false);
  const [mensajeVoucher, setMensajeVoucher] = useState('');

  // Formulario de Reserva
  const [titularNombre, setTitularNombre] = useState('Juan Carlos Flores');
  const [titularTelefono, setTitularTelefono] = useState('987654321');
  const [paraderoPrincipal, setParaderoPrincipal] = useState('plaza-norte');
  const [montoAdelanto, setMontoAdelanto] = useState<number>(100);
  const [cuponCodigo, setCuponCodigo] = useState('');

  // Pasajeros en el formulario
  const [pasajeros, setPasajeros] = useState<PasajeroInput[]>([
    {
      nombres: 'Juan Carlos',
      apellidos: 'Flores',
      tipoDocumento: 'DNI',
      numeroDocumento: '45892147',
      edad: 28,
      paraderoEmbarqueId: 'plaza-norte',
      adicionalesIds: ['cuatrimoto'],
    },
    {
      nombres: 'Diana',
      apellidos: 'Mendoza',
      tipoDocumento: 'DNI',
      numeroDocumento: '71458963',
      edad: 26,
      paraderoEmbarqueId: 'plaza-norte',
      adicionalesIds: ['cuatrimoto'],
    },
  ]);

  const salidaActiva = expediciones.find((e) => e.id === salidaSeleccionadaId) || expediciones[0]!;

  // Evaluar Aforo con el Motor de Dominio
  const estadoAforo = useMemo(() => {
    return CapacityEngine.evaluarAforo(
      salidaActiva.capacidadTotal,
      12,
      salidaActiva.asientosOcupados
    );
  }, [salidaActiva]);

  // Cotización Dinámica con el Motor de Precios
  const cotizacion = useMemo(() => {
    const tarifas: TourTarifas = {
      precioBaseRegular: salidaActiva.precioBase,
      precioGrupo4Mas: salidaActiva.precioGrupo4Mas,
      precioNino: salidaActiva.precioNino,
    };

    const input: CotizacionReservaInput = {
      tarifas,
      pasajeros,
      adicionalesCatalogo: CATALOGO_ADICIONALES,
      cupon: cuponCodigo.trim().toUpperCase() === 'TIKTOK10' ? {
        codigo: 'TIKTOK10',
        tipo: 'PORCENTAJE',
        valor: 10,
        activo: true,
      } : undefined,
    };

    try {
      return PricingEngine.calcularCotizacion(input);
    } catch {
      return null;
    }
  }, [salidaActiva, pasajeros, cuponCodigo]);

  // Manejador para agregar pasajero
  const agregarPasajero = () => {
    setPasajeros([
      ...pasajeros,
      {
        nombres: '',
        apellidos: '',
        tipoDocumento: 'DNI',
        numeroDocumento: '',
        edad: 25,
        paraderoEmbarqueId: paraderoPrincipal,
        adicionalesIds: [],
      },
    ]);
  };

  // Manejador para quitar pasajero
  const quitarPasajero = (index: number) => {
    if (pasajeros.length <= 1) return;
    setPasajeros(pasajeros.filter((_, i) => i !== index));
  };

  // Toggle de adicionales por pasajero
  const toggleAdicional = (pasajeroIndex: number, adicionalId: string) => {
    const actualizados = [...pasajeros];
    const p = actualizados[pasajeroIndex];
    if (!p) return;

    const actuales = p.adicionalesIds || [];
    if (actuales.includes(adicionalId)) {
      p.adicionalesIds = actuales.filter((id) => id !== adicionalId);
    } else {
      p.adicionalesIds = [...actuales, adicionalId];
    }
    setPasajeros(actualizados);
  };

  // Confirmar y Generar Voucher WhatsApp
  const handleGenerarVoucher = () => {
    if (!cotizacion) return;

    try {
      // Validar cada pasajero normativamente
      pasajeros.forEach((p) => PassengerValidator.validarPasajero(p));

      // Validar aforo
      CapacityEngine.validarReservaEntrante(
        salidaActiva.capacidadTotal,
        salidaActiva.asientosOcupados,
        cotizacion.asientosOcupados
      );

      const paraderoNombre = PARADEROS.find((p) => p.id === paraderoPrincipal)?.nombre || paraderoPrincipal;
      const saldoPendiente = Math.max(0, cotizacion.montoTotal - montoAdelanto);

      const texto = VoucherGenerator.generarMensajeWhatsApp({
        codigoReserva: `RL-${Math.floor(1000 + Math.random() * 9000)}`,
        codigoExpedicion: salidaActiva.codigo,
        nombreTour: salidaActiva.tourNombre,
        fechaSalida: salidaActiva.fecha,
        horaConcentracion: salidaActiva.horaEmbarque,
        titularNombre,
        titularTelefono,
        cotizacion,
        montoAdelantoPagado: montoAdelanto,
        saldoPendiente,
        puntoEmbarquePrincipal: paraderoNombre,
      });

      setMensajeVoucher(texto);
      navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3500);

      // Simular reserva ocupando asientos en el panel
      setExpediciones((prev) =>
        prev.map((e) =>
          e.id === salidaActiva.id
            ? { ...e, asientosOcupados: e.asientosOcupados + cotizacion.asientosOcupados }
            : e
        )
      );
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Ruta Libre Perú <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Operaciones</span>
              </h1>
              <p className="text-xs text-slate-500">Panel Centralizado de Salidas y Reservas WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Realtime WebSockets Conectado
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800">Abel Huallullo</p>
              <p className="text-[10px] text-slate-500">Administrador General</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-8">
        
        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Ocupación Fin de Semana</span>
              <Bus className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">81.4%</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">40 / 53 cupos confirmados</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Recaudación Yape/Plin</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">S/ 3,420.00</p>
            <p className="text-xs text-slate-500 mt-1">Adelantos verificados</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Por Cobrar en el Bus</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">S/ 1,840.00</p>
            <p className="text-xs text-slate-500 mt-1">A recolectar por guías (TC)</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Punto de Equilibrio</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">3 de 3</p>
            <p className="text-xs text-blue-600 font-medium mt-1">Salidas 100% confirmadas</p>
          </div>
        </div>

        {/* Sección 1: Semáforo de Salidas e Inventario */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Semáforo de Salidas Programadas (Tiempo Real)
              </h2>
              <p className="text-xs text-slate-500">Selecciona una salida para cotizar y registrar pasajeros</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {expediciones.map((exp) => {
              const aforo = CapacityEngine.evaluarAforo(exp.capacidadTotal, 12, exp.asientosOcupados);
              const isSelected = exp.id === salidaActiva.id;

              return (
                <div
                  key={exp.id}
                  onClick={() => setSalidaSeleccionadaId(exp.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {exp.codigo}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        aforo.semaforo === 'DISPONIBLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : aforo.semaforo === 'ULTIMOS_CUPOS'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {aforo.semaforo === 'DISPONIBLE'
                        ? '🟢 DISPONIBLE'
                        : aforo.semaforo === 'ULTIMOS_CUPOS'
                        ? `🟡 ÚLTIMOS ${aforo.asientosDisponibles} CUPOS`
                        : '🔴 LLENO'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug">{exp.tourNombre}</h3>
                  <p className="text-xs text-slate-500 mb-4">{exp.fecha} • Concentración {exp.horaEmbarque}</p>

                  {/* Barra de Progreso de Asientos */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Aforo: {exp.asientosOcupados}/{exp.capacidadTotal} asientos</span>
                      <span className="text-slate-900">{Math.round((exp.asientosOcupados / exp.capacidadTotal) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          aforo.semaforo === 'LLENO' ? 'bg-red-500' : aforo.semaforo === 'ULTIMOS_CUPOS' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(exp.asientosOcupados / exp.capacidadTotal) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 border-t border-slate-100 pt-3 flex items-center justify-between">
                    <span>Guía: <strong>{exp.guiaTC}</strong></span>
                    <span>Tarifa: <strong className="text-emerald-700">S/ {exp.precioBase}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección 2: Cotizador y Registro Rápido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario Pasajeros y Adicionales (2 Columnas) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Registro de Reserva para: <span className="text-emerald-700">{salidaActiva.tourNombre}</span>
                </h3>
                <p className="text-xs text-slate-500">Ingresa los datos mientras atiendes al cliente en WhatsApp</p>
              </div>
              <button
                type="button"
                onClick={agregarPasajero}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Agregar Acompañante
              </button>
            </div>

            {/* Datos del Titular y Paradero */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Titular (WhatsApp)</label>
                <input
                  type="text"
                  value={titularNombre}
                  onChange={(e) => setTitularNombre(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Celular WhatsApp</label>
                <input
                  type="text"
                  value={titularTelefono}
                  onChange={(e) => setTitularTelefono(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Punto de Embarque Principal</label>
                <select
                  value={paraderoPrincipal}
                  onChange={(e) => setParaderoPrincipal(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PARADEROS.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista Dinámica de Pasajeros */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lista de Pasajeros ({pasajeros.length})
              </h4>

              {pasajeros.map((pasajero, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Pasajero #{idx + 1}
                    </span>
                    {pasajeros.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarPasajero(idx)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Eliminar pasajero"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Nombres</label>
                      <input
                        type="text"
                        value={pasajero.nombres}
                        onChange={(e) => {
                          const next = [...pasajeros];
                          if (next[idx]) next[idx].nombres = e.target.value;
                          setPasajeros(next);
                        }}
                        placeholder="Nombres"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Apellidos</label>
                      <input
                        type="text"
                        value={pasajero.apellidos}
                        onChange={(e) => {
                          const next = [...pasajeros];
                          if (next[idx]) next[idx].apellidos = e.target.value;
                          setPasajeros(next);
                        }}
                        placeholder="Apellidos"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">DNI (8 dígitos)</label>
                      <input
                        type="text"
                        maxLength={8}
                        value={pasajero.numeroDocumento}
                        onChange={(e) => {
                          const next = [...pasajeros];
                          if (next[idx]) next[idx].numeroDocumento = e.target.value;
                          setPasajeros(next);
                        }}
                        placeholder="71234567"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Edad</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={pasajero.edad}
                        onChange={(e) => {
                          const next = [...pasajeros];
                          if (next[idx]) next[idx].edad = parseInt(e.target.value, 10) || 0;
                          setPasajeros(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Selector de Adicionales para este pasajero */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      Adicionales para este pasajero:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(CATALOGO_ADICIONALES).map((ad) => {
                        const checked = (pasajero.adicionalesIds || []).includes(ad.id);
                        return (
                          <button
                            key={ad.id}
                            type="button"
                            onClick={() => toggleAdicional(idx, ad.id)}
                            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                              checked
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {checked ? '✓ ' : '+ '}{ad.nombre} (+S/ {ad.precioVenta})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Cuenta y Generador de Voucher */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Resumen Financiero y Saldos
              </h3>

              {cotizacion ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Pasajes Tour ({cotizacion.totalPasajeros} personas)</span>
                    <span className="font-semibold text-slate-900">S/ {cotizacion.subtotalTours.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Adicionales (Botes, Cuatrimotos)</span>
                    <span className="font-semibold text-slate-900">+S/ {cotizacion.subtotalAdicionales.toFixed(2)}</span>
                  </div>

                  {cotizacion.descuentoAplicado > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg">
                      <span>Descuentos Automáticos</span>
                      <span>-S/ {cotizacion.descuentoAplicado.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Cupón Promocional Input */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">¿Tienes un cupón de TikTok/Campaña?</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: TIKTOK10"
                        value={cuponCodigo}
                        onChange={(e) => setCuponCodigo(e.target.value)}
                        className="w-full text-xs uppercase px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-400 self-center">Prueba: TIKTOK10</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-bold text-slate-900">
                    <span>TOTAL A PAGAR</span>
                    <span className="text-base text-emerald-700">S/ {cotizacion.montoTotal.toFixed(2)}</span>
                  </div>

                  {/* Adelanto y Saldo en Bus */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">Adelanto por Yape / Plin:</label>
                      <input
                        type="number"
                        value={montoAdelanto}
                        onChange={(e) => setMontoAdelanto(parseFloat(e.target.value) || 0)}
                        className="w-24 text-right text-xs font-bold px-2 py-1 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div className="flex justify-between text-xs pt-1 border-t border-slate-200 font-bold">
                      <span className="text-slate-800">SALDO AL SUBIR AL BUS:</span>
                      <span className="text-amber-600 font-bold text-sm">
                        S/ {Math.max(0, cotizacion.montoTotal - montoAdelanto).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Botón Principal Generador de Voucher */}
                  <button
                    type="button"
                    onClick={handleGenerarVoucher}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md mt-4 text-xs tracking-wide"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-4 h-4" /> ¡VOUCHER COPIADO AL PORTAPAPELES!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> GENERAR Y COPIAR VOUCHER PARA WHATSAPP
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Al hacer clic, se descuentan los cupos y el texto formal queda listo para pegar en el chat del cliente.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-red-500">Error en el cálculo de tarifas.</p>
              )}
            </div>

            {/* Vista Previa del Voucher Generado */}
            {mensajeVoucher && (
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl shadow-lg border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-sans font-bold flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-400" /> Vista Previa WhatsApp
                  </span>
                  <span className="text-[10px]">Listo para enviar</span>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 max-h-60 overflow-y-auto leading-relaxed">
                  {mensajeVoucher}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
