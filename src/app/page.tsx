'use client';

import React, { useState, useMemo } from 'react';
import { 
  Bus, 
  Users, 
  Calendar, 
  DollarSign, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Send, 
  Clock, 
  TrendingUp, 
  X, 
  MessageSquare, 
  AlertTriangle, 
  ExternalLink,
  FileText,
  Printer,
  Smartphone,
  CheckCircle2,
  XCircle,
  Radio,
  Receipt,
  Bell,
  BellRing,
  QrCode,
  MapPin,
  Phone,
  ShieldCheck,
  Search,
  Sparkles,
  Navigation,
  Armchair,
  HelpCircle,
  BarChart3,
  PieChart,
  TrendingDown,
  Target,
  Activity,
  Sliders,
  Percent,
  Zap,
  Flame,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { PricingEngine } from '@/domain/pricing-engine';
import { CapacityEngine } from '@/domain/capacity-engine';
import { PassengerValidator } from '@/domain/passenger-validator';
import { VoucherGenerator } from '@/domain/voucher-generator';
import { 
  PasajeroInput, 
  TourTarifas, 
  AdicionalItem, 
  CotizacionReservaInput,
  SolicitudAprobacionTC,
  TipoSolicitudTC
} from '@/domain/types';

interface ExpedicionMock {
  id: string;
  codigo: string;
  tourNombre: string;
  categoria: 'FULLDAY_COSTA' | 'FULLDAY_SIERRA' | 'MULTIDAY';
  fecha: string;
  horaEmbarque: string;
  capacidadTotal: number;
  asientosOcupados: number;
  chofer: string;
  placa: string;
  empresaTransporte: string;
  soatNumero: string;
  guiaTC: string;
  guiaTelefono: string;
  precioBase: number;
  precioGrupo4Mas: number;
  precioNino: number;
  costoFleteBus: number;
  costoGuia: number;
}

interface PasajeroEnRuta {
  id: string;
  expedicionId: string;
  nombres: string;
  apellidos: string;
  tipoDoc: string;
  numDoc: string;
  telefono?: string;
  edad: number;
  asientoNumero?: number;
  paraderoId: string;
  paraderoNombre: string;
  abordo: boolean;
  noShow: boolean;
  saldoPendiente: number;
  saldoCobrado: boolean;
  adicionales: string[];
}

const EXPEDICIONES_INICIALES: ExpedicionMock[] = [
  {
    id: 'exp-1',
    codigo: 'EXP-20261102-LUN-01',
    tourNombre: 'Full Day Lunahuaná & Canotaje Aventura',
    categoria: 'FULLDAY_COSTA',
    fecha: 'Sábado 02 de Noviembre',
    horaEmbarque: '04:15 AM',
    capacidadTotal: 19,
    asientosOcupados: 14,
    chofer: 'Manuel Quispe',
    placa: 'B1X-782 (Sprinter)',
    empresaTransporte: 'Transportes Turísticos del Sur S.A.C.',
    soatNumero: 'SOAT-POSITIVA-884219',
    guiaTC: 'Carlos Mendoza',
    guiaTelefono: '984512367',
    precioBase: 89.0,
    precioGrupo4Mas: 69.0,
    precioNino: 59.0,
    costoFleteBus: 850.0,
    costoGuia: 150.0,
  },
  {
    id: 'exp-2',
    codigo: 'EXP-20261102-PAR-01',
    tourNombre: 'Full Day Paracas, Ica & Huacachina',
    categoria: 'FULLDAY_COSTA',
    fecha: 'Sábado 02 de Noviembre',
    horaEmbarque: '03:45 AM',
    capacidadTotal: 19,
    asientosOcupados: 18,
    chofer: 'Jorge Ramos',
    placa: 'F5T-910 (Sprinter)',
    empresaTransporte: 'Línea Expreso Paracas E.I.R.L.',
    soatNumero: 'SOAT-RIMAC-194022',
    guiaTC: 'Lucía Benites',
    guiaTelefono: '971234567',
    precioBase: 99.0,
    precioGrupo4Mas: 85.0,
    precioNino: 69.0,
    costoFleteBus: 1100.0,
    costoGuia: 180.0,
  },
  {
    id: 'exp-3',
    codigo: 'EXP-20261103-RAU-01',
    tourNombre: 'Full Day Nevado Raura & Cordillera',
    categoria: 'FULLDAY_SIERRA',
    fecha: 'Domingo 03 de Noviembre',
    horaEmbarque: '03:30 AM',
    capacidadTotal: 15,
    asientosOcupados: 8,
    chofer: 'Héctor Silva',
    placa: 'C4M-112 (H1 4x4)',
    empresaTransporte: 'Turismo Altura & Aventura S.A.C.',
    soatNumero: 'SOAT-PACIFICO-552194',
    guiaTC: 'Renzo Paredes',
    guiaTelefono: '912345678',
    precioBase: 129.0,
    precioGrupo4Mas: 110.0,
    precioNino: 95.0,
    costoFleteBus: 950.0,
    costoGuia: 160.0,
  },
];

const CATALOGO_ADICIONALES: Record<string, AdicionalItem> = {
  bote: { id: 'bote', nombre: 'Paseo en Bote a Islas Ballestas', precioVenta: 35.0, costoProveedor: 25.0 },
  cuatrimoto: { id: 'cuatrimoto', nombre: 'Cuatrimotos Lunahuaná (30 min)', precioVenta: 45.0, costoProveedor: 30.0 },
  canotaje: { id: 'canotaje', nombre: 'Canotaje Río Cañete', precioVenta: 40.0, costoProveedor: 28.0 },
  almuerzo: { id: 'almuerzo', nombre: 'Almuerzo Campestre Típico', precioVenta: 25.0, costoProveedor: 18.0 },
};

const PARADEROS = [
  { 
    id: 'plaza-norte', 
    nombre: 'Plaza Norte - Los Olivos (04:15 AM)',
    referencia: 'Puerta Principal Av. Tomás Valle frente a C.C.',
    mapsUrl: 'https://maps.google.com/?q=-12.0068,-77.0588'
  },
  { 
    id: 'san-borja', 
    nombre: 'Calle Comercio / Javier Prado - San Borja (04:50 AM)',
    referencia: 'Espalda del Museo de la Nación, parada de buses turísticos',
    mapsUrl: 'https://maps.google.com/?q=-12.0869,-77.0019'
  },
  { 
    id: 'mall-sur', 
    nombre: 'Mall del Sur - Puente Alipio (05:25 AM)',
    referencia: 'Puente Peatonal Alipio Ponce, costado de la estación',
    mapsUrl: 'https://maps.google.com/?q=-12.1624,-76.9839'
  },
];

const PASAJEROS_INICIALES: PasajeroEnRuta[] = [
  { id: 'p1', expedicionId: 'exp-1', nombres: 'Carlos Alberto', apellidos: 'Mendoza Ruiz', tipoDoc: 'DNI', numDoc: '45892147', telefono: '984512367', edad: 28, asientoNumero: 1, paraderoId: 'plaza-norte', paraderoNombre: 'Plaza Norte', abordo: true, noShow: false, saldoPendiente: 89.0, saldoCobrado: true, adicionales: ['Cuatrimotos'] },
  { id: 'p2', expedicionId: 'exp-1', nombres: 'Ana María', apellidos: 'Soto Castro', tipoDoc: 'DNI', numDoc: '71458963', telefono: '912789456', edad: 26, asientoNumero: 2, paraderoId: 'plaza-norte', paraderoNombre: 'Plaza Norte', abordo: true, noShow: false, saldoPendiente: 69.0, saldoCobrado: true, adicionales: ['Canotaje'] },
  { id: 'p3', expedicionId: 'exp-1', nombres: 'Gerson', apellidos: 'Huamán Vega', tipoDoc: 'DNI', numDoc: '40128795', telefono: '978541236', edad: 34, asientoNumero: 5, paraderoId: 'plaza-norte', paraderoNombre: 'Plaza Norte', abordo: true, noShow: false, saldoPendiente: 120.0, saldoCobrado: true, adicionales: ['Cuatrimotos', 'Almuerzo'] },
  { id: 'p4', expedicionId: 'exp-1', nombres: 'Valeria', apellidos: 'Quispe Ramos', tipoDoc: 'DNI', numDoc: '46891234', telefono: '932145879', edad: 31, asientoNumero: 6, paraderoId: 'plaza-norte', paraderoNombre: 'Plaza Norte', abordo: true, noShow: false, saldoPendiente: 69.0, saldoCobrado: true, adicionales: [] },
  { id: 'p5', expedicionId: 'exp-1', nombres: 'Rodrigo', apellidos: 'Dávila Paredes', tipoDoc: 'DNI', numDoc: '72349012', telefono: '945612378', edad: 29, asientoNumero: 7, paraderoId: 'san-borja', paraderoNombre: 'San Borja', abordo: false, noShow: false, saldoPendiente: 89.0, saldoCobrado: false, adicionales: ['Canotaje'] },
  { id: 'p6', expedicionId: 'exp-1', nombres: 'Mariana', apellidos: 'López Gil', tipoDoc: 'DNI', numDoc: '70451239', telefono: '963258741', edad: 27, asientoNumero: 8, paraderoId: 'san-borja', paraderoNombre: 'San Borja', abordo: false, noShow: false, saldoPendiente: 89.0, saldoCobrado: false, adicionales: ['Canotaje'] },
  { id: 'p7', expedicionId: 'exp-1', nombres: 'Fernando', apellidos: 'Chávez Flores', tipoDoc: 'DNI', numDoc: '41908234', telefono: '951753852', edad: 42, asientoNumero: 9, paraderoId: 'san-borja', paraderoNombre: 'San Borja', abordo: false, noShow: false, saldoPendiente: 140.0, saldoCobrado: false, adicionales: ['Almuerzo'] },
  { id: 'p8', expedicionId: 'exp-1', nombres: 'Karla', apellidos: 'Vargas Silva', tipoDoc: 'DNI', numDoc: '48901235', telefono: '987456321', edad: 38, asientoNumero: 10, paraderoId: 'san-borja', paraderoNombre: 'San Borja', abordo: false, noShow: false, saldoPendiente: 69.0, saldoCobrado: false, adicionales: [] },
  { id: 'p9', expedicionId: 'exp-1', nombres: 'Sebastián', apellidos: 'Pinto Ríos', tipoDoc: 'DNI', numDoc: '73458901', telefono: '923456789', edad: 24, asientoNumero: 13, paraderoId: 'mall-sur', paraderoNombre: 'Mall del Sur', abordo: false, noShow: false, saldoPendiente: 89.0, saldoCobrado: false, adicionales: ['Cuatrimotos'] },
  { id: 'p10', expedicionId: 'exp-1', nombres: 'Luciana', apellidos: 'Pinto Ríos', tipoDoc: 'DNI', numDoc: '74561238', telefono: '934567890', edad: 22, asientoNumero: 14, paraderoId: 'mall-sur', paraderoNombre: 'Mall del Sur', abordo: false, noShow: false, saldoPendiente: 89.0, saldoCobrado: false, adicionales: ['Cuatrimotos'] },
  { id: 'p11', expedicionId: 'exp-2', nombres: 'Renata', apellidos: 'Morales Alva', tipoDoc: 'DNI', numDoc: '75489612', telefono: '965412387', edad: 30, asientoNumero: 3, paraderoId: 'plaza-norte', paraderoNombre: 'Plaza Norte', abordo: true, noShow: false, saldoPendiente: 0.0, saldoCobrado: true, adicionales: ['Bote'] },
];

const SOLICITUDES_INICIALES: SolicitudAprobacionTC[] = [
  {
    id: 'sol-1',
    expedicionId: 'exp-1',
    codigoExpedicion: 'EXP-20261102-LUN-01',
    solicitanteTC: 'Carlos Mendoza',
    tipoSolicitud: 'GASTO_EMERGENCIA',
    titulo: 'Pinchazo de neumático y vulcanización en Mala',
    monto: 55.0,
    descripcion: 'Se reportó fuga de aire en la llanta trasera derecha de la Sprinter en el km 88 Panamericana Sur. Se procedió a parchar para seguridad.',
    estado: 'PENDIENTE',
    creadoEn: 'Hace 12 minutos',
  },
  {
    id: 'sol-2',
    expedicionId: 'exp-1',
    codigoExpedicion: 'EXP-20261102-LUN-01',
    solicitanteTC: 'Carlos Mendoza',
    tipoSolicitud: 'ABORDAJE_ESPECIAL',
    titulo: 'Cambio de paradero de última hora: Pasajera Karla Vargas',
    descripcion: 'Pasajera Karla Vargas no llegó a San Borja por tráfico en Av. Javier Prado, solicita abordar en Mall del Sur sin penalidad.',
    estado: 'APROBADO',
    creadoEn: 'Hace 45 minutos',
    autorizadoPor: 'Abel Huallullo (Admin)',
  },
];

export default function DashboardPage() {
  const [tabActiva, setTabActiva] = useState<'reservas' | 'portal_tc' | 'manifiesto' | 'liquidacion' | 'busqueda' | 'analitica'>('reservas');
  const [expediciones, setExpediciones] = useState<ExpedicionMock[]>(EXPEDICIONES_INICIALES);
  const [salidaSeleccionadaId, setSalidaSeleccionadaId] = useState<string>('exp-1');
  const [copiado, setCopiado] = useState(false);

  // Estados del Simulador What-If (Sensibilidad Financiera)
  const [simPasajeros, setSimPasajeros] = useState<number>(14);
  const [simPrecioPasaje, setSimPrecioPasaje] = useState<number>(89);
  const [simCostoFlete, setSimCostoFlete] = useState<number>(850);
  const [simCostoGuia, setSimCostoGuia] = useState<number>(150);
  const [simGastoAdicionalesPorPax, setSimGastoAdicionalesPorPax] = useState<number>(35);

  // Notificaciones y Aprobaciones en Tiempo Real
  const [solicitudes, setSolicitudes] = useState<SolicitudAprobacionTC[]>(SOLICITUDES_INICIALES);
  const [panelNotificacionesAbierto, setPanelNotificacionesAbierto] = useState(false);
  const [modalNuevaSolicitudTC, setModalNuevaSolicitudTC] = useState(false);
  const [nuevaSolicitudTipo, setNuevaSolicitudTipo] = useState<TipoSolicitudTC>('GASTO_EMERGENCIA');
  const [nuevaSolicitudTitulo, setNuevaSolicitudTitulo] = useState('');
  const [nuevaSolicitudMonto, setNuevaSolicitudMonto] = useState<number>(40);
  const [nuevaSolicitudDesc, setNuevaSolicitudDesc] = useState('');

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalBoletoDigital, setModalBoletoDigital] = useState(false);
  const [textoVoucher, setTextoVoucher] = useState('');
  const [enlaceWhatsAppDirecto, setEnlaceWhatsAppDirecto] = useState('');
  const [reservaActivaGenerada, setReservaActivaGenerada] = useState<{
    codigo: string;
    titular: string;
    telefono: string;
    total: number;
    adelanto: number;
    saldo: number;
    asientos: number[];
  } | null>(null);

  // Formulario de Reserva
  const [titularNombre, setTitularNombre] = useState('Juan Carlos Flores');
  const [titularTelefono, setTitularTelefono] = useState('987654321');
  const [paraderoPrincipal, setParaderoPrincipal] = useState('plaza-norte');
  const [montoAdelanto, setMontoAdelanto] = useState<number>(100);
  const [cuponCodigo, setCuponCodigo] = useState('');
  const [pasajeroSeleccionadoParaAsiento, setPasajeroSeleccionadoParaAsiento] = useState<number>(0);

  // Pasajeros en Ruta (para el Portal TC)
  const [pasajerosRuta, setPasajerosRuta] = useState<PasajeroEnRuta[]>(PASAJEROS_INICIALES);
  const [filtroParaderoTC, setFiltroParaderoTC] = useState<string>('todos');

  // Filtro de búsqueda global
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  // Pasajeros en el formulario de nueva reserva
  const [pasajeros, setPasajeros] = useState<PasajeroInput[]>([
    {
      nombres: 'Juan Carlos',
      apellidos: 'Flores',
      tipoDocumento: 'DNI',
      numeroDocumento: '45892147',
      edad: 28,
      paraderoEmbarqueId: 'plaza-norte',
      asientoNumero: 3,
      adicionalesIds: ['cuatrimoto'],
    },
    {
      nombres: 'Diana',
      apellidos: 'Mendoza',
      tipoDocumento: 'DNI',
      numeroDocumento: '71458963',
      edad: 26,
      paraderoEmbarqueId: 'plaza-norte',
      asientoNumero: 4,
      adicionalesIds: ['cuatrimoto'],
    },
  ]);

  const salidaActiva = expediciones.find((e) => e.id === salidaSeleccionadaId) || expediciones[0]!;

  // Conteo de notificaciones pendientes
  const solicitudesPendientes = useMemo(() => {
    return solicitudes.filter((s) => s.estado === 'PENDIENTE');
  }, [solicitudes]);

  const estadoAforo = useMemo(() => {
    return CapacityEngine.evaluarAforo(
      salidaActiva.capacidadTotal,
      12,
      salidaActiva.asientosOcupados
    );
  }, [salidaActiva]);

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

  // Asientos ocupados en la expedición activa
  const asientosOcupadosSet = useMemo(() => {
    const ocupados = new Set<number>();
    pasajerosRuta
      .filter((p) => p.expedicionId === salidaActiva.id && p.asientoNumero)
      .forEach((p) => ocupados.add(p.asientoNumero!));
    return ocupados;
  }, [pasajerosRuta, salidaActiva.id]);

  // Asignar un asiento del croquis al pasajero activo
  const handleSeleccionarAsiento = (numeroAsiento: number) => {
    if (asientosOcupadosSet.has(numeroAsiento)) return; // Asiento ocupado por otro pasajero

    const actualizados = [...pasajeros];
    const actual = actualizados[pasajeroSeleccionadoParaAsiento];
    if (!actual) return;

    if (actual.asientoNumero === numeroAsiento) {
      actual.asientoNumero = undefined; // Deseleccionar
    } else {
      actual.asientoNumero = numeroAsiento;
    }
    setPasajeros(actualizados);
  };

  const agregarPasajero = () => {
    // Buscar el primer asiento disponible
    const asientosEnUsoPorGrupo = new Set(pasajeros.map((p) => p.asientoNumero).filter(Boolean));
    let primerAsientoLibre: number | undefined = undefined;
    for (let i = 1; i <= salidaActiva.capacidadTotal; i++) {
      if (!asientosOcupadosSet.has(i) && !asientosEnUsoPorGrupo.has(i)) {
        primerAsientoLibre = i;
        break;
      }
    }

    setPasajeros([
      ...pasajeros,
      {
        nombres: '',
        apellidos: '',
        tipoDocumento: 'DNI',
        numeroDocumento: '',
        edad: 25,
        paraderoEmbarqueId: paraderoPrincipal,
        asientoNumero: primerAsientoLibre,
        adicionalesIds: [],
      },
    ]);
    setPasajeroSeleccionadoParaAsiento(pasajeros.length);
  };

  const quitarPasajero = (index: number) => {
    if (pasajeros.length <= 1) return;
    setPasajeros(pasajeros.filter((_, i) => i !== index));
    if (pasajeroSeleccionadoParaAsiento >= index && pasajeroSeleccionadoParaAsiento > 0) {
      setPasajeroSeleccionadoParaAsiento(pasajeroSeleccionadoParaAsiento - 1);
    }
  };

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

  // Abrir Modal de Confirmación y Revisión Previa
  const handleAbrirRevisionVoucher = () => {
    if (!cotizacion) return;

    try {
      pasajeros.forEach((p) => PassengerValidator.validarPasajero(p));

      if (!PassengerValidator.validarTelefono(titularTelefono)) {
        alert('Por favor ingresa un número de celular de WhatsApp válido para el titular.');
        return;
      }

      CapacityEngine.validarReservaEntrante(
        salidaActiva.capacidadTotal,
        salidaActiva.asientosOcupados,
        cotizacion.asientosOcupados
      );

      const paraderoObj = PARADEROS.find((p) => p.id === paraderoPrincipal);
      const paraderoNombre = paraderoObj?.nombre || paraderoPrincipal;
      const mapsUrl = paraderoObj?.mapsUrl;
      const saldoPendiente = Math.max(0, cotizacion.montoTotal - montoAdelanto);
      const codigoGenerado = `RL-${Math.floor(1000 + Math.random() * 9000)}`;

      const asientos = pasajeros.map((p) => p.asientoNumero).filter(Boolean) as number[];

      const texto = VoucherGenerator.generarMensajeWhatsApp({
        codigoReserva: codigoGenerado,
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
        asientosAsignados: asientos.length > 0 ? asientos : undefined,
        enlaceUbicacionMaps: mapsUrl,
      });

      const enlace = VoucherGenerator.generarEnlaceWhatsApp(titularTelefono, texto);

      setTextoVoucher(texto);
      setEnlaceWhatsAppDirecto(enlace);
      setReservaActivaGenerada({
        codigo: codigoGenerado,
        titular: titularNombre,
        telefono: titularTelefono,
        total: cotizacion.montoTotal,
        adelanto: montoAdelanto,
        saldo: saldoPendiente,
        asientos,
      });
      setModalAbierto(true);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Enviar Directo a WhatsApp
  const handleEnviarDirectoWhatsApp = () => {
    if (cotizacion) {
      setExpediciones((prev) =>
        prev.map((e) =>
          e.id === salidaActiva.id
            ? { ...e, asientosOcupados: e.asientosOcupados + cotizacion.asientosOcupados }
            : e
        )
      );

      // Agregar los pasajeros al estado de la ruta
      const paraderoObj = PARADEROS.find((p) => p.id === paraderoPrincipal);
      const nuevosPasajerosRuta: PasajeroEnRuta[] = pasajeros.map((p, idx) => ({
        id: `nuevo-${Date.now()}-${idx}`,
        expedicionId: salidaActiva.id,
        nombres: p.nombres,
        apellidos: p.apellidos,
        tipoDoc: p.tipoDocumento,
        numDoc: p.numeroDocumento,
        telefono: idx === 0 ? titularTelefono : undefined,
        edad: p.edad,
        asientoNumero: p.asientoNumero,
        paraderoId: paraderoPrincipal,
        paraderoNombre: paraderoObj?.nombre.split(' (')[0] || paraderoPrincipal,
        abordo: false,
        noShow: false,
        saldoPendiente: idx === 0 ? Math.max(0, cotizacion.montoTotal - montoAdelanto) : 0,
        saldoCobrado: false,
        adicionales: (p.adicionalesIds || []).map((id) => CATALOGO_ADICIONALES[id]?.nombre || id),
      }));

      setPasajerosRuta((prev) => [...prev, ...nuevosPasajerosRuta]);
    }

    window.open(enlaceWhatsAppDirecto, '_blank');
    setModalAbierto(false);
  };

  const handleCopiarPortapapeles = () => {
    navigator.clipboard.writeText(textoVoucher);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // Funciones del Portal TC (Checkin y Cobro)
  const toggleAbordajeTC = (id: string) => {
    setPasajerosRuta((prev) =>
      prev.map((p) => (p.id === id ? { ...p, abordo: !p.abordo, noShow: false } : p))
    );
  };

  const toggleCobroSaldoTC = (id: string) => {
    setPasajerosRuta((prev) =>
      prev.map((p) => (p.id === id ? { ...p, saldoCobrado: !p.saldoCobrado } : p))
    );
  };

  // Aprobación o Rechazo de Solicitud de Administración
  const resolverSolicitud = (id: string, nuevoEstado: 'APROBADO' | 'RECHAZADO') => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              estado: nuevoEstado,
              autorizadoPor: 'Abel Huallullo (Admin)',
            }
          : s
      )
    );
  };

  // Crear nueva solicitud desde el Portal TC
  const handleCrearSolicitudTC = () => {
    if (!nuevaSolicitudTitulo.trim()) {
      alert('Por favor ingresa un título o motivo.');
      return;
    }

    const nueva: SolicitudAprobacionTC = {
      id: `sol-${Date.now()}`,
      expedicionId: salidaActiva.id,
      codigoExpedicion: salidaActiva.codigo,
      solicitanteTC: salidaActiva.guiaTC,
      tipoSolicitud: nuevaSolicitudTipo,
      titulo: nuevaSolicitudTitulo,
      monto: nuevaSolicitudTipo === 'GASTO_EMERGENCIA' ? nuevaSolicitudMonto : undefined,
      descripcion: nuevaSolicitudDesc || 'Sin descripción detallada.',
      estado: 'PENDIENTE',
      creadoEn: 'Hace unos instantes',
    };

    setSolicitudes([nueva, ...solicitudes]);
    setModalNuevaSolicitudTC(false);
    setNuevaSolicitudTitulo('');
    setNuevaSolicitudDesc('');
    alert('🚨 Solicitud enviada a la Administración. Se emitirá una notificación en pantalla.');
  };

  // Enviar mensaje directo de urgencia al pasajero que falta abordar
  const handleAvisarPasajeroRetrasado = (pasajero: PasajeroEnRuta) => {
    const telefono = pasajero.telefono || '987654321';
    const mensaje = `Hola ${pasajero.nombres}, te saluda ${salidaActiva.guiaTC}, Guía de Ruta Libre Perú 🚌. Estamos en el paradero *${pasajero.paraderoNombre}* y el bus partirá en 5 minutos. ¿Te falta mucho para llegar? Por favor confírmanos.`;
    const url = VoucherGenerator.generarEnlaceWhatsApp(telefono, mensaje);
    window.open(url, '_blank');
  };

  const pasajerosFiltradosTC = useMemo(() => {
    const delTour = pasajerosRuta.filter((p) => p.expedicionId === salidaActiva.id);
    if (filtroParaderoTC === 'todos') return delTour;
    return delTour.filter((p) => p.paraderoId === filtroParaderoTC);
  }, [pasajerosRuta, salidaActiva.id, filtroParaderoTC]);

  // Búsqueda global de pasajeros
  const resultadosBusquedaGlobal = useMemo(() => {
    if (!terminoBusqueda.trim()) return [];
    const q = terminoBusqueda.toLowerCase();
    return pasajerosRuta.filter(
      (p) =>
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        p.numDoc.includes(q) ||
        (p.telefono && p.telefono.includes(q))
    );
  }, [pasajerosRuta, terminoBusqueda]);

  // Cálculos Financieros P&L para la Expedición Seleccionada
  const finanzasPnl = useMemo(() => {
    const totalPasajes = salidaActiva.asientosOcupados * salidaActiva.precioBase;
    const ingresosAdicionales = 480.0;
    const ingresosBrutos = totalPasajes + ingresosAdicionales;

    const costoTransporte = salidaActiva.costoFleteBus;
    const costoGuia = salidaActiva.costoGuia;
    const costoProveedores = 280.0;
    const tasasSernanp = salidaActiva.asientosOcupados * 11.0;

    // Gastos imprevistos de ruta aprobados
    const gastosRutaAprobados = solicitudes
      .filter((s) => s.expedicionId === salidaActiva.id && s.estado === 'APROBADO' && s.monto)
      .reduce((sum, s) => sum + (s.monto || 0), 0);

    const costosTotales = costoTransporte + costoGuia + costoProveedores + tasasSernanp + gastosRutaAprobados;
    const utilidadNeta = ingresosBrutos - costosTotales;
    const margenPorcentaje = (utilidadNeta / ingresosBrutos) * 100;

    return {
      ingresosBrutos,
      costosTotales,
      utilidadNeta,
      margenPorcentaje,
      costoTransporte,
      costoGuia,
      costoProveedores,
      tasasSernanp,
      gastosRutaAprobados,
    };
  }, [salidaActiva, solicitudes]);

  // Cálculos Consolidados de Analítica Global para Toda la Flota
  const analiticaConsolidada = useMemo(() => {
    const totalCupos = expediciones.reduce((sum, e) => sum + e.capacidadTotal, 0);
    const totalOcupados = expediciones.reduce((sum, e) => sum + e.asientosOcupados, 0);
    const tasaOcupacion = totalCupos > 0 ? (totalOcupados / totalCupos) * 100 : 0;

    const ingresosPasajes = expediciones.reduce((sum, e) => sum + e.asientosOcupados * e.precioBase, 0);
    const ingresosAdicionalesEstimados = 1220.0;
    const ingresosTotales = ingresosPasajes + ingresosAdicionalesEstimados;

    const costosFletes = expediciones.reduce((sum, e) => sum + e.costoFleteBus, 0);
    const costosGuias = expediciones.reduce((sum, e) => sum + e.costoGuia, 0);
    const costosAdicionalesProv = 720.0;
    const tasasSernanpTotal = totalOcupados * 11.0;
    const gastosRutaAprobados = solicitudes
      .filter((s) => s.estado === 'APROBADO' && s.monto)
      .reduce((sum, s) => sum + (s.monto || 0), 0);

    const costosTotales = costosFletes + costosGuias + costosAdicionalesProv + tasasSernanpTotal + gastosRutaAprobados;
    const utilidadNetaTotal = ingresosTotales - costosTotales;
    const margenNeto = ingresosTotales > 0 ? (utilidadNetaTotal / ingresosTotales) * 100 : 0;
    const revPas = totalCupos > 0 ? ingresosTotales / totalCupos : 0;
    const ticketPromedio = totalOcupados > 0 ? ingresosTotales / totalOcupados : 0;

    // Desglose comparativo por tour
    const desglosePorTour = expediciones.map((exp) => {
      const ingPasajes = exp.asientosOcupados * exp.precioBase;
      const ingExtras = exp.id === 'exp-1' ? 480 : exp.id === 'exp-2' ? 560 : 180;
      const ingTour = ingPasajes + ingExtras;

      const flete = exp.costoFleteBus;
      const guia = exp.costoGuia;
      const prov = exp.id === 'exp-1' ? 280 : exp.id === 'exp-2' ? 320 : 120;
      const sernanp = exp.asientosOcupados * 11.0;
      const gastosAprob = solicitudes
        .filter((s) => s.expedicionId === exp.id && s.estado === 'APROBADO' && s.monto)
        .reduce((sum, s) => sum + (s.monto || 0), 0);

      const costoTour = flete + guia + prov + sernanp + gastosAprob;
      const utilTour = ingTour - costoTour;
      const margTour = ingTour > 0 ? (utilTour / ingTour) * 100 : 0;
      const ocupacionPct = (exp.asientosOcupados / exp.capacidadTotal) * 100;

      return {
        id: exp.id,
        nombre: exp.tourNombre,
        codigo: exp.codigo,
        ocupados: exp.asientosOcupados,
        capacidad: exp.capacidadTotal,
        ocupacionPct,
        ingresos: ingTour,
        costos: costoTour,
        utilidad: utilTour,
        margen: margTour,
        esRentable: utilTour >= 0,
      };
    });

    return {
      totalCupos,
      totalOcupados,
      tasaOcupacion,
      ingresosTotales,
      ingresosPasajes,
      ingresosAdicionalesEstimados,
      costosTotales,
      utilidadNetaTotal,
      margenNeto,
      revPas,
      ticketPromedio,
      desglosePorTour,
    };
  }, [expediciones, solicitudes]);

  // Cálculos del Simulador What-If
  const calculoSimulador = useMemo(() => {
    const ingresosPasajes = simPasajeros * simPrecioPasaje;
    const ingresosAdicionales = simPasajeros * simGastoAdicionalesPorPax;
    const ingresosTotales = ingresosPasajes + ingresosAdicionales;

    const costoVariables = simPasajeros * (simGastoAdicionalesPorPax * 0.65 + 11);
    const costoFijos = simCostoFlete + simCostoGuia;
    const costosTotales = costoFijos + costoVariables;

    const utilidad = ingresosTotales - costosTotales;
    const margen = ingresosTotales > 0 ? (utilidad / ingresosTotales) * 100 : 0;

    const margenContribucionPorPax = (simPrecioPasaje + simGastoAdicionalesPorPax) - (simGastoAdicionalesPorPax * 0.65 + 11);
    const breakEvenPax = margenContribucionPorPax > 0 ? Math.ceil(costoFijos / margenContribucionPorPax) : 0;

    return {
      ingresosTotales,
      costosTotales,
      utilidad,
      margen,
      breakEvenPax,
      esRentable: utilidad >= 0,
    };
  }, [simPasajeros, simPrecioPasaje, simCostoFlete, simCostoGuia, simGastoAdicionalesPorPax]);


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
                Ruta Libre Perú <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Suite Operativa Pro</span>
              </h1>
              <p className="text-xs text-slate-500">Centro de Mando: Ventas, Croquis, Guías en Ruta, SUTRAN y Liquidación</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Campana de Notificaciones en Tiempo Real */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPanelNotificacionesAbierto(!panelNotificacionesAbierto)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notificaciones de Guías en Ruta"
              >
                {solicitudesPendientes.length > 0 ? (
                  <BellRing className="w-5 h-5 text-amber-600 animate-bounce" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
                {solicitudesPendientes.length > 0 && (
                  <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
                    {solicitudesPendientes.length}
                  </span>
                )}
              </button>

              {/* Bandeja Desplegable de Notificaciones */}
              {panelNotificacionesAbierto && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">Aprobaciones en Ruta</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      {solicitudesPendientes.length} pendientes
                    </span>
                  </div>

                  <div className="p-3 max-h-96 overflow-y-auto divide-y divide-slate-100 space-y-2">
                    {solicitudes.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No hay solicitudes activas</p>
                    ) : (
                      solicitudes.map((sol) => (
                        <div key={sol.id} className="pt-2 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{sol.solicitanteTC} (TC)</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              sol.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                              sol.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {sol.estado}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-700">{sol.titulo}</p>
                          <p className="text-[11px] text-slate-500 leading-tight">{sol.descripcion}</p>
                          {sol.monto && (
                            <p className="font-mono font-bold text-red-600">Monto solicitado: S/ {sol.monto.toFixed(2)}</p>
                          )}

                          {sol.estado === 'PENDIENTE' && (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => resolverSolicitud(sol.id, 'APROBADO')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded-lg text-[11px] transition-colors"
                              >
                                ✓ Aprobar
                              </button>
                              <button
                                type="button"
                                onClick={() => resolverSolicitud(sol.id, 'RECHAZADO')}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1 px-2 rounded-lg text-[11px] transition-colors"
                              >
                                ✕ Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Enlace Satelital Activo
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800">Abel Huallullo</p>
              <p className="text-[10px] text-slate-500">Administrador General</p>
            </div>
          </div>
        </div>

        {/* Barra de Navegación de Pestañas (Las 5 Dimensiones del Negocio) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-100 overflow-x-auto py-2">
          <button
            onClick={() => setTabActiva('reservas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tabActiva === 'reservas'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" /> 1. Ventas & Croquis Bus
          </button>

          <button
            onClick={() => setTabActiva('portal_tc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap relative ${
              tabActiva === 'portal_tc'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4" /> 2. Portal TC en Ruta (Check-in)
            {solicitudesPendientes.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          <button
            onClick={() => setTabActiva('manifiesto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tabActiva === 'manifiesto'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" /> 3. Manifiesto SUTRAN (PDF)
          </button>

          <button
            onClick={() => setTabActiva('liquidacion')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tabActiva === 'liquidacion'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" /> 4. Liquidación Financiera (P&L)
          </button>

          <button
            onClick={() => setTabActiva('busqueda')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tabActiva === 'busqueda'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" /> 5. Directorio Pasajeros
          </button>

          <button
            onClick={() => setTabActiva('analitica')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tabActiva === 'analitica'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> 6. Analítica & Métricas
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-8">
        
        {/* KPI Cards Globales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Aforo Fin de Semana</span>
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
            <p className="text-xs text-slate-500 mt-1">Adelantos conciliados</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Por Cobrar en Puerta</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">S/ 1,840.00</p>
            <p className="text-xs text-slate-500 mt-1">Saldos en ruta por guías (TC)</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Punto de Equilibrio</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">3 de 3</p>
            <p className="text-xs text-blue-600 font-medium mt-1">Fletes 100% cubiertos</p>
          </div>
        </div>

        {/* Selector de Expedición Activa */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Expedición Seleccionada:
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {expediciones.map((exp) => {
              const aforo = CapacityEngine.evaluarAforo(exp.capacidadTotal, 12, exp.asientosOcupados);
              const isSelected = exp.id === salidaActiva.id;

              return (
                <div
                  key={exp.id}
                  onClick={() => setSalidaSeleccionadaId(exp.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {exp.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                  <h3 className="font-bold text-slate-900 text-xs mb-1 leading-snug">{exp.tourNombre}</h3>
                  <p className="text-[11px] text-slate-500 mb-2">{exp.fecha} • {exp.horaEmbarque}</p>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${aforo.semaforo === 'LLENO' ? 'bg-red-500' : aforo.semaforo === 'ULTIMOS_CUPOS' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${(exp.asientosOcupados / exp.capacidadTotal) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: VENTAS, CROQUIS INTERACTIVO DEL BUS Y WHATSAPP */}
        {/* ========================================================================= */}
        {tabActiva === 'reservas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* Formulario de Pasajeros y Adicionales */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Registro de Pasajeros para: <span className="text-emerald-700">{salidaActiva.tourNombre}</span>
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
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Celular</label>
                  <input
                    type="text"
                    value={titularTelefono}
                    onChange={(e) => setTitularTelefono(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Punto de Embarque</label>
                  <select
                    value={paraderoPrincipal}
                    onChange={(e) => setParaderoPrincipal(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    {PARADEROS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CROQUIS GRÁFICO INTERACTIVO DE ASIENTOS DEL BUS / SPRINTER */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-inner border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Armchair className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        Croquis Digital de Asientos • {salidaActiva.placa}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Haz clic en un asiento libre para asignarlo al pasajero seleccionado: <span className="text-white font-bold">{pasajeros[pasajeroSeleccionadoParaAsiento]?.nombres || `Pasajero #${pasajeroSeleccionadoParaAsiento + 1}`}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Libre</span>
                    <span className="flex items-center gap-1 text-blue-400"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block"></span> Tu Selección</span>
                    <span className="flex items-center gap-1 text-red-400"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block"></span> Ocupado</span>
                  </div>
                </div>

                {/* Grid Visual de Asientos de la Sprinter (19 Pax) */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex flex-col items-center">
                  {/* Cabina Chofer & Guía */}
                  <div className="w-full max-w-md flex justify-between items-center border-b border-slate-700 pb-3 mb-4 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-700/50 px-2.5 py-1 rounded-md">
                      🚗 Chofer: <strong className="text-slate-200">{salidaActiva.chofer}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-700/50 px-2.5 py-1 rounded-md">
                      🎤 Guía (TC): <strong className="text-emerald-300">{salidaActiva.guiaTC}</strong>
                    </span>
                  </div>

                  {/* Asientos */}
                  <div className="grid grid-cols-4 gap-2.5 w-full max-w-md">
                    {Array.from({ length: salidaActiva.capacidadTotal }, (_, i) => i + 1).map((num) => {
                      const ocupadoOtro = asientosOcupadosSet.has(num);
                      const asignadoPasajeroGrupo = pasajeros.find((p) => p.asientoNumero === num);
                      const esSeleccionadoGrupo = !!asignadoPasajeroGrupo;

                      let estilo = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 hover:bg-emerald-500/40 cursor-pointer';
                      let label = `#${num < 10 ? '0' + num : num}`;

                      if (ocupadoOtro) {
                        estilo = 'bg-red-950/60 border-red-700 text-red-400 opacity-60 cursor-not-allowed';
                      } else if (esSeleccionadoGrupo) {
                        estilo = 'bg-blue-600 border-blue-400 text-white font-bold ring-2 ring-blue-300 cursor-pointer scale-105';
                      }

                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={ocupadoOtro}
                          onClick={() => handleSeleccionarAsiento(num)}
                          title={ocupadoOtro ? `Asiento ${num} ya ocupado` : `Asignar Asiento ${num}`}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all ${estilo}`}
                        >
                          <Armchair className="w-4 h-4 mb-0.5" />
                          <span className="font-mono text-[10px] font-bold">{label}</span>
                          {esSeleccionadoGrupo && (
                            <span className="text-[8px] truncate max-w-[60px] text-blue-100">
                              {asignadoPasajeroGrupo.nombres.split(' ')[0] || 'Pax'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lista Dinámica de Pasajeros */}
              <div className="space-y-4">
                {pasajeros.map((p, index) => (
                  <div
                    key={index}
                    onClick={() => setPasajeroSeleccionadoParaAsiento(index)}
                    className={`p-4 rounded-xl border transition-all ${
                      pasajeroSeleccionadoParaAsiento === index
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-sm'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Pasajero #{index + 1} {index === 0 && '(Titular del Viaje)'}
                        </span>
                        {p.asientoNumero && (
                          <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-300">
                            Butaca #{p.asientoNumero < 10 ? '0' + p.asientoNumero : p.asientoNumero}
                          </span>
                        )}
                      </div>
                      {pasajeros.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPasajero(index);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-1 font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Nombres</label>
                        <input
                          type="text"
                          value={p.nombres}
                          onChange={(e) => {
                            const actualizados = [...pasajeros];
                            actualizados[index]!.nombres = e.target.value;
                            setPasajeros(actualizados);
                          }}
                          placeholder="Ej: Carlos Alberto"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Apellidos</label>
                        <input
                          type="text"
                          value={p.apellidos}
                          onChange={(e) => {
                            const actualizados = [...pasajeros];
                            actualizados[index]!.apellidos = e.target.value;
                            setPasajeros(actualizados);
                          }}
                          placeholder="Ej: Mendoza Ruiz"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">DNI (8 dígitos) / Doc</label>
                        <input
                          type="text"
                          value={p.numeroDocumento}
                          onChange={(e) => {
                            const actualizados = [...pasajeros];
                            actualizados[index]!.numeroDocumento = e.target.value;
                            setPasajeros(actualizados);
                          }}
                          placeholder="Ej: 45892147"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Edad</label>
                        <input
                          type="number"
                          value={p.edad}
                          onChange={(e) => {
                            const actualizados = [...pasajeros];
                            actualizados[index]!.edad = parseInt(e.target.value) || 0;
                            setPasajeros(actualizados);
                          }}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Checkbox de Adicionales para este Pasajero */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2">
                        Adicionales:
                      </span>
                      {Object.values(CATALOGO_ADICIONALES).map((item) => {
                        const checked = (p.adicionalesIds || []).includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAdicional(index, item.id);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                              checked
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {checked ? '✓ ' : '+ '} {item.nombre} (+S/ {item.precioVenta})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Cotización en Tiempo Real */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-24">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>Resumen de Cuentas</span>
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </h3>

                {cotizacion ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Pasajeros a cotizar:</span>
                      <span className="font-bold text-slate-800">{cotizacion.totalPasajeros} ({cotizacion.asientosOcupados} asientos)</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Tours:</span>
                      <span className="font-semibold text-slate-800">S/ {cotizacion.subtotalTours.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Adicionales:</span>
                      <span className="font-semibold text-slate-800">S/ {cotizacion.subtotalAdicionales.toFixed(2)}</span>
                    </div>

                    {cotizacion.descuentoAplicado > 0 && (
                      <div className="flex justify-between text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                        <span>Descuentos aplicados:</span>
                        <span className="font-bold">-S/ {cotizacion.descuentoAplicado.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Cupón Promocional */}
                    <div className="pt-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Cupón de Descuento</label>
                      <input
                        type="text"
                        value={cuponCodigo}
                        onChange={(e) => setCuponCodigo(e.target.value)}
                        placeholder="Ej: TIKTOK10"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                      />
                    </div>

                    <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-900">Monto Total:</span>
                      <span className="text-2xl font-black text-emerald-700">
                        S/ {cotizacion.montoTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Adelanto y Saldo en Ruta */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 mt-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Adelanto por Yape / Plin / BCP (S/)
                        </label>
                        <input
                          type="number"
                          value={montoAdelanto}
                          onChange={(e) => setMontoAdelanto(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                        />
                      </div>

                      <div className="flex justify-between text-xs pt-1">
                        <span className="font-medium text-slate-600">Saldo a Cobrar en Bus:</span>
                        <span className="text-amber-600 font-bold text-sm">
                          S/ {Math.max(0, cotizacion.montoTotal - montoAdelanto).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAbrirRevisionVoucher}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md mt-4 text-xs tracking-wide"
                    >
                      <MessageSquare className="w-4 h-4" /> REVISAR Y ENVIAR A WHATSAPP
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-red-500">Error en el cálculo de tarifas.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: PORTAL MÓVIL DEL GUÍA / TC EN RUTA */}
        {/* ========================================================================= */}
        {tabActiva === 'portal_tc' && (
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                  📱 Vista de Smartphone del Tour Conductor (Guía Líder)
                </span>
                <h3 className="text-lg font-bold">{salidaActiva.tourNombre}</h3>
                <p className="text-xs text-emerald-200">
                  Guía: <strong>{salidaActiva.guiaTC}</strong> • Unidad: <strong>{salidaActiva.placa}</strong> • Chofer: <strong>{salidaActiva.chofer}</strong>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevaSolicitudTC(true)}
                  className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4" /> Solicitar Aprobación en Ruta
                </button>
                <button
                  type="button"
                  onClick={() => alert(`📢 Mensaje Broadcast enviado a los ${pasajerosFiltradosTC.length} pasajeros del viaje: "¡Buenos días equipo Ruta Libre! El bus está en camino a su paradero."`)}
                  className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <Radio className="w-4 h-4" /> Aviso Masivo
                </button>
              </div>
            </div>

            {/* Filtro por Paradero del Bus */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Paradero Actual:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setFiltroParaderoTC('todos')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filtroParaderoTC === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Todos ({pasajerosRuta.filter((p) => p.expedicionId === salidaActiva.id).length})
                  </button>
                  <button
                    onClick={() => setFiltroParaderoTC('plaza-norte')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filtroParaderoTC === 'plaza-norte' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Plaza Norte
                  </button>
                  <button
                    onClick={() => setFiltroParaderoTC('san-borja')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filtroParaderoTC === 'san-borja' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    San Borja
                  </button>
                  <button
                    onClick={() => setFiltroParaderoTC('mall-sur')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      filtroParaderoTC === 'mall-sur' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Mall del Sur
                  </button>
                </div>
              </div>

              <div className="text-xs font-medium text-slate-500">
                A bordo: <strong className="text-emerald-700 font-bold">{pasajerosFiltradosTC.filter((p) => p.abordo).length}</strong> de {pasajerosFiltradosTC.length}
              </div>
            </div>

            {/* Lista Táctil de Pasajeros para Checkin */}
            <div className="divide-y divide-slate-100">
              {pasajerosFiltradosTC.map((p) => (
                <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{p.nombres} {p.apellidos}</span>
                      {p.asientoNumero && (
                        <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          Asiento #{p.asientoNumero < 10 ? '0' + p.asientoNumero : p.asientoNumero}
                        </span>
                      )}
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {p.tipoDoc}: {p.numDoc}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Paradero: <strong>{p.paraderoNombre}</strong> • Edad: {p.edad} años
                      {p.adicionales.length > 0 && (
                        <span className="text-emerald-700 font-semibold ml-2">
                          [Extras: {p.adicionales.join(', ')}]
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Botón WhatsApp de aviso rápido si no ha abordado */}
                    {!p.abordo && (
                      <button
                        type="button"
                        onClick={() => handleAvisarPasajeroRetrasado(p)}
                        className="text-xs font-bold px-2.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1 transition-colors"
                        title="Enviar WhatsApp de aviso de partida al pasajero"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Avisar
                      </button>
                    )}

                    {/* Botón de Cobranza de Saldo en Puerta */}
                    <button
                      type="button"
                      onClick={() => toggleCobroSaldoTC(p.id)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                        p.saldoCobrado
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {p.saldoCobrado ? '✓ Saldo Cobrado' : `Cobrar S/ ${p.saldoPendiente}`}
                    </button>

                    {/* Botón de Check-in (Abordó) */}
                    <button
                      type="button"
                      onClick={() => toggleAbordajeTC(p.id)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                        p.abordo
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.abordo ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {p.abordo ? 'Abordó' : 'Por Abordar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: MANIFIESTO OFICIAL SUTRAN / MTC */}
        {/* ========================================================================= */}
        {tabActiva === 'manifiesto' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">MANIFIESTO OFICIAL DE PASAJEROS</h3>
                <p className="text-xs text-slate-500">Conforme al Reglamento Nacional de Transporte Turístico Terrestre (MTC / SUTRAN)</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" /> Imprimir / Exportar PDF
              </button>
            </div>

            {/* Membrete Oficial */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Agencia Operadora</span>
                <span className="font-bold text-slate-900">Ruta Libre Perú E.I.R.L.</span>
                <span className="text-[10px] text-slate-500 block">RUC: 20601234567</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Expedición</span>
                <span className="font-bold text-emerald-800">{salidaActiva.codigo}</span>
                <span className="text-[10px] text-slate-500 block">{salidaActiva.tourNombre}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Unidad / Transporte</span>
                <span className="font-bold text-slate-900">{salidaActiva.placa}</span>
                <span className="text-[10px] text-slate-500 block">SOAT: {salidaActiva.soatNumero}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tripulación Oficial</span>
                <span className="font-bold text-slate-900">Chofer: {salidaActiva.chofer}</span>
                <span className="text-[10px] text-slate-500 block">Guía (TC): {salidaActiva.guiaTC}</span>
              </div>
            </div>

            {/* Tabla Normativa de Pasajeros */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 border-b">Asiento</th>
                    <th className="p-3 border-b">Nombres y Apellidos</th>
                    <th className="p-3 border-b">Tipo Doc</th>
                    <th className="p-3 border-b">N° Documento</th>
                    <th className="p-3 border-b">Edad</th>
                    <th className="p-3 border-b">Nacionalidad</th>
                    <th className="p-3 border-b">Punto de Embarque</th>
                    <th className="p-3 border-b text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pasajerosRuta
                    .filter((p) => p.expedicionId === salidaActiva.id)
                    .map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-blue-700">
                          {p.asientoNumero ? `#${p.asientoNumero < 10 ? '0' + p.asientoNumero : p.asientoNumero}` : `#${i + 1}`}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{p.nombres} {p.apellidos}</td>
                        <td className="p-3 font-mono">{p.tipoDoc}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{p.numDoc}</td>
                        <td className="p-3">{p.edad} años</td>
                        <td className="p-3">Peruana</td>
                        <td className="p-3">{p.paraderoNombre}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.abordo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.abordo ? 'A Bordo' : 'Confirmado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 4: LIQUIDACIÓN FINANCIERA (P&L POR EXPEDICIÓN) */}
        {/* ========================================================================= */}
        {tabActiva === 'liquidacion' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Liquidación de Cuentas y Rentabilidad (P&L): <span className="text-emerald-700">{salidaActiva.tourNombre}</span>
                </h3>
                <p className="text-xs text-slate-500">Balance dominical de ingresos totales versus costos directos de la salida</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 block">Utilidad Neta del Viaje:</span>
                <span className="text-2xl font-black text-emerald-600">S/ {finanzasPnl.utilidadNeta.toFixed(2)}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">Margen Neto: {finanzasPnl.margenPorcentaje.toFixed(1)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Ingresos */}
              <div className="space-y-3 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ingresos Brutos Recaudados
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Pasajes Base ({salidaActiva.asientosOcupados} pasajeros × S/ {salidaActiva.precioBase})</span>
                    <span className="font-bold text-slate-900">S/ {(salidaActiva.asientosOcupados * salidaActiva.precioBase).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Adicionales (Cuatrimotos, Botes, Almuerzos)</span>
                    <span className="font-bold text-slate-900">+S/ 480.00</span>
                  </div>
                  <div className="border-t border-emerald-300 pt-2 flex justify-between font-bold text-emerald-900 text-sm">
                    <span>TOTAL INGRESOS BRUTOS:</span>
                    <span>S/ {finanzasPnl.ingresosBrutos.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Columna Costos */}
              <div className="space-y-3 bg-red-50/50 p-5 rounded-2xl border border-red-200">
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" /> Costos y Gastos Directos
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Flete de la Unidad Móvil ({salidaActiva.placa})</span>
                    <span className="font-bold text-red-700">-S/ {finanzasPnl.costoTransporte.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Honorarios de Guía / TC ({salidaActiva.guiaTC})</span>
                    <span className="font-bold text-red-700">-S/ {finanzasPnl.costoGuia.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Pago a Operadores Locales (Botes/Muelle)</span>
                    <span className="font-bold text-red-700">-S/ {finanzasPnl.costoProveedores.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Tasas de Ingreso SERNANP</span>
                    <span className="font-bold text-red-700">-S/ {finanzasPnl.tasasSernanp.toFixed(2)}</span>
                  </div>
                  {finanzasPnl.gastosRutaAprobados > 0 && (
                    <div className="flex justify-between text-amber-800 bg-amber-100/60 p-1.5 rounded-lg font-semibold">
                      <span>🚨 Gastos Extra de Ruta (Aprobados por Admin)</span>
                      <span>-S/ {finanzasPnl.gastosRutaAprobados.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-red-300 pt-2 flex justify-between font-bold text-red-900 text-sm">
                    <span>TOTAL COSTOS OPERATIVOS:</span>
                    <span>-S/ {finanzasPnl.costosTotales.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 5: DIRECTORIO Y BÚSQUEDA GLOBAL DE PASAJEROS */}
        {/* ========================================================================= */}
        {tabActiva === 'busqueda' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                Directorio y Búsqueda Global de Pasajeros
              </h3>
              <p className="text-xs text-slate-500">Busca a cualquier cliente por DNI, Nombres o Teléfono entre todas las expediciones activas</p>
            </div>

            <div className="max-w-xl">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  placeholder="Escribe el DNI, nombre del pasajero o celular..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {terminoBusqueda.trim() && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Expedición</th>
                      <th className="p-3">Pasajero</th>
                      <th className="p-3">DNI</th>
                      <th className="p-3">Teléfono</th>
                      <th className="p-3">Asiento</th>
                      <th className="p-3">Paradero</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultadosBusquedaGlobal.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400">
                          No se encontraron pasajeros con el término "{terminoBusqueda}".
                        </td>
                      </tr>
                    ) : (
                      resultadosBusquedaGlobal.map((p) => {
                        const exp = expediciones.find((e) => e.id === p.expedicionId);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-emerald-800">{exp?.tourNombre || p.expedicionId}</td>
                            <td className="p-3 font-bold text-slate-900">{p.nombres} {p.apellidos}</td>
                            <td className="p-3 font-mono">{p.numDoc}</td>
                            <td className="p-3 font-mono">{p.telefono || '-'}</td>
                            <td className="p-3 font-mono font-bold text-blue-700">
                              {p.asientoNumero ? `#${p.asientoNumero}` : '-'}
                            </td>
                            <td className="p-3">{p.paraderoNombre}</td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                p.abordo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {p.abordo ? 'A Bordo' : 'Registrado'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 6: CENTRO DE INTELIGENCIA Y ANALÍTICA FINANCIERA (BI) */}
        {/* ========================================================================= */}
        {tabActiva === 'analitica' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Cabecera del Módulo Estadístico */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Executive Analytics • Real-Time BI
                  </span>
                  <span className="text-xs text-slate-400">Actualizado hace 3 min</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Centro de Control Estadístico y Rendimiento de Flota</h3>
                <p className="text-xs text-slate-500">
                  Monitoreo de ingresos consolidados, RevPAS por asiento, ocupación de Sprinters y simulador de sensibilidad
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Printer className="w-4 h-4" /> Exportar Informe Ejecutivo
                </button>
              </div>
            </div>

            {/* Tarjetas KPI Ejecutivas con Comparativa de Periodo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facturación Proyectada</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  S/ {analiticaConsolidada.ingresosTotales.toFixed(2)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <span className="text-emerald-700 font-bold flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
                  </span>
                  <span className="text-slate-400 text-[11px]">vs semana anterior</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                  <span>Pasajes: S/ {analiticaConsolidada.ingresosPasajes.toFixed(0)}</span>
                  <span>Extras: S/ {analiticaConsolidada.ingresosAdicionalesEstimados.toFixed(0)}</span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilidad Neta del Fin de Semana</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-700">
                  S/ {analiticaConsolidada.utilidadNetaTotal.toFixed(2)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                    Margen Neto: {analiticaConsolidada.margenNeto.toFixed(1)}%
                  </span>
                  <span className="text-slate-400 text-[11px]">libre de fletes</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                  <span>Costos Totales:</span>
                  <span className="font-semibold text-red-600">-S/ {analiticaConsolidada.costosTotales.toFixed(2)}</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa de Ocupación Flota</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Bus className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {analiticaConsolidada.tasaOcupacion.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                    {analiticaConsolidada.totalOcupados} / {analiticaConsolidada.totalCupos} asientos
                  </span>
                  <span className="text-slate-400 text-[11px]">en 3 unidades</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                  <span>Break-Even Min: 65%</span>
                  <span className="text-emerald-600 font-bold">✓ Superado</span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RevPAS & Ticket Promedio</span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-purple-700">
                  S/ {analiticaConsolidada.revPas.toFixed(2)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <span className="text-purple-800 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                    Ticket Prom: S/ {analiticaConsolidada.ticketPromedio.toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                  <span>RevPAS = Ingreso / Asiento Disponible</span>
                </div>
              </div>
            </div>

            {/* Gráfico Comparativo de Rentabilidad y P&L por Tour */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" /> Comparativa de Rentabilidad por Destino (P&L por Tour)
                  </h4>
                  <p className="text-xs text-slate-500">Compara ingresos brutos, costos operativos y margen neto de cada unidad móvil</p>
                </div>
                <span className="text-xs text-slate-400">Valores en Soles (PEN)</span>
              </div>

              <div className="space-y-4 pt-2">
                {analiticaConsolidada.desglosePorTour.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{t.nombre}</span>
                          <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-semibold">
                            {t.codigo}
                          </span>
                          {t.id === 'exp-2' && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Flame className="w-3 h-3 text-emerald-600" /> Tour Más Rentable
                            </span>
                          )}
                          {t.id === 'exp-3' && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> A 2 cupos de Break-Even
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ocupación: <strong>{t.ocupados} de {t.capacidad} asientos ({t.ocupacionPct.toFixed(0)}%)</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Ingresos</span>
                          <span className="font-bold text-slate-900 text-xs">S/ {t.ingresos.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Costos</span>
                          <span className="font-bold text-red-600 text-xs">-S/ {t.costos.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Utilidad Neta</span>
                          <span className={`font-black text-sm ${t.utilidad >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            S/ {t.utilidad.toFixed(2)}
                          </span>
                        </div>
                        <div className="min-w-[65px]">
                          <span className="text-[10px] text-slate-400 uppercase block">Margen</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                            t.margen >= 25 ? 'bg-emerald-100 text-emerald-800' :
                            t.margen > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {t.margen.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra Visual Proporcional de Costos vs Utilidad */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-red-400 h-full"
                        style={{ width: `${Math.min(100, (t.costos / t.ingresos) * 100)}%` }}
                        title={`Costos Directos: S/ ${t.costos.toFixed(2)}`}
                      ></div>
                      {t.utilidad > 0 && (
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${(t.utilidad / t.ingresos) * 100}%` }}
                          title={`Utilidad Neta: S/ ${t.utilidad.toFixed(2)}`}
                        ></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dos Columnas: Estructura del Ingreso vs Paraderos y Métodos de Pago */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estructura del Ingreso & Upselling */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" /> Composición del Ingreso y Poder del Upselling
                </h4>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                  💡 <strong>Insight Estratégico:</strong> Los servicios adicionales (canotaje, cuatrimotos y botes) representan el <strong>19.6% de los ingresos</strong> pero aportan más del <strong>42% de la utilidad líquida</strong> porque el margen de reventa con proveedores locales es superior al pasaje regular.
                </div>

                <div className="space-y-3 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-slate-700">Pasajes Base de Tour (Transporte + Guía)</span>
                      <span className="font-bold text-slate-900">80.4% (S/ {analiticaConsolidada.ingresosPasajes.toFixed(2)})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full w-[80.4%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-slate-700">Actividades Adicionales (Canotaje, Cuatrimoto, Bote)</span>
                      <span className="font-bold text-emerald-700">19.6% (S/ {analiticaConsolidada.ingresosAdicionalesEstimados.toFixed(2)})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full w-[19.6%]"></div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Top Adicionales Más Vendidos en Ruta</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block">Paseo Ballestas</span>
                      <span className="text-[10px] text-slate-500">18 contratados • Margen 28.6%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block">Cuatrimotos Lunahuaná</span>
                      <span className="text-[10px] text-slate-500">14 contratados • Margen 33.3%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block">Canotaje Cañete</span>
                      <span className="text-[10px] text-slate-500">12 contratados • Margen 30.0%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800 block">Almuerzo Campestre</span>
                      <span className="text-[10px] text-slate-500">9 contratados • Margen 28.0%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matriz de Paraderos y Canales de Pago */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Demografía de Abordaje & Canales de Recaudación
                </h4>

                <div className="space-y-3 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Distribución por Punto de Encuentro en Lima</span>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-700">1. C.C. Plaza Norte (Puerta Principal)</span>
                      <span className="font-bold text-slate-900">45.0% (18 pax)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full w-[45%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-700">2. Calle Comercio / Javier Prado (San Borja)</span>
                      <span className="font-bold text-slate-900">35.0% (14 pax)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full w-[35%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-700">3. Mall del Sur (Puente Alipio)</span>
                      <span className="font-bold text-slate-900">20.0% (8 pax)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-600 h-full w-[20%]"></div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Canales de Conciliación de Pagos</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="font-bold text-emerald-800 text-sm block">64%</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Yape / Plin</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="font-bold text-blue-800 text-sm block">24%</span>
                      <span className="text-[10px] text-blue-600 font-medium">Transf. BCP/BBVA</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="font-bold text-amber-800 text-sm block">12%</span>
                      <span className="text-[10px] text-amber-700 font-medium">Efectivo en Puerta</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SIMULADOR TÁCTICO INTERACTIVO: WHAT-IF SENSITIVITY SIMULATOR */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Simulador Financiero What-If • Análisis de Sensibilidad
                    </span>
                  </div>
                  <h4 className="text-lg font-bold mt-1">Calculadora Táctica de Punto de Equilibrio y Rentabilidad</h4>
                  <p className="text-xs text-slate-400">
                    Mueve los controles para simular diferentes escenarios de precio, fletes y pasajeros antes de abrir una nueva expedición
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-2xl border text-center ${
                  calculoSimulador.esRentable 
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                    : 'bg-red-950/80 border-red-500 text-red-300'
                }`}>
                  <span className="text-[10px] uppercase font-bold block">Veredicto Operativo:</span>
                  <span className="text-sm font-black">
                    {calculoSimulador.esRentable ? '🟢 RENTABLE (Superávit)' : '🔴 DÉFICIT (Pérdida)'}
                  </span>
                </div>
              </div>

              {/* Controles Deslizantes (Sliders) y Resultados */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Sliders */}
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 font-medium">Pasajeros Confirmados en la Unidad:</span>
                      <span className="font-bold text-emerald-400 text-sm font-mono">{simPasajeros} pasajeros</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={simPasajeros}
                      onChange={(e) => setSimPasajeros(parseInt(e.target.value) || 1)}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>1 pax</span>
                      <span>10 pax (Punto crítico)</span>
                      <span>20 pax (Lleno)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 font-medium">Precio del Pasaje Base:</span>
                      <span className="font-bold text-emerald-400 text-sm font-mono">S/ {simPrecioPasaje}</span>
                    </div>
                    <input
                      type="range"
                      min={49}
                      max={160}
                      step={5}
                      value={simPrecioPasaje}
                      onChange={(e) => setSimPrecioPasaje(parseInt(e.target.value) || 49)}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>S/ 49 (Promoción)</span>
                      <span>S/ 89 (Regular)</span>
                      <span>S/ 160 (Alta montaña)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 font-medium">Costo de Flete de la Movilidad (Sprinter / H1):</span>
                      <span className="font-bold text-red-400 text-sm font-mono">S/ {simCostoFlete}</span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={1500}
                      step={50}
                      value={simCostoFlete}
                      onChange={(e) => setSimCostoFlete(parseInt(e.target.value) || 600)}
                      className="w-full accent-red-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 font-medium">Gasto Promedio en Adicionales por Pax (Upselling):</span>
                      <span className="font-bold text-teal-400 text-sm font-mono">S/ {simGastoAdicionalesPorPax}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={simGastoAdicionalesPorPax}
                      onChange={(e) => setSimGastoAdicionalesPorPax(parseInt(e.target.value) || 0)}
                      className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                {/* Dashboard de Métricas del Simulador */}
                <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-700 pb-2">
                    Proyección Financiera en Tiempo Real
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Ingresos Totales:</span>
                      <span className="text-lg font-bold text-slate-100 font-mono">
                        S/ {calculoSimulador.ingresosTotales.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Costos Totales:</span>
                      <span className="text-lg font-bold text-red-400 font-mono">
                        S/ {calculoSimulador.costosTotales.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Utilidad Neta Proyectada:</span>
                      <span className={`text-2xl font-black font-mono ${
                        calculoSimulador.esRentable ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        S/ {calculoSimulador.utilidad.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Margen Neto:</span>
                      <span className={`text-base font-bold font-mono ${
                        calculoSimulador.esRentable ? 'text-emerald-300' : 'text-red-300'
                      }`}>
                        {calculoSimulador.margen.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Punto de Equilibrio (Break-Even):</span>
                    <span className="font-bold text-amber-300 font-mono">
                      Mínimo {calculoSimulador.breakEvenPax} pasajeros
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    {simPasajeros >= calculoSimulador.breakEvenPax ? (
                      <span className="text-emerald-400">
                        ✓ Con {simPasajeros} pasajeros superas el punto de equilibrio por {simPasajeros - calculoSimulador.breakEvenPax} cupos, asegurando ganancias netas para la empresa.
                      </span>
                    ) : (
                      <span className="text-red-400">
                        ⚠️ Alerta: Te faltan {calculoSimulador.breakEvenPax - simPasajeros} pasajeros para cubrir los costos fijos (flete y guía).
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* MODAL DE CONFIRMACIÓN Y REVISIÓN PREVIA DEL VOUCHER */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Confirmar Envío por WhatsApp</h3>
                  <p className="text-xs text-emerald-100">Revisa la redacción y los saldos antes de enviar al cliente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Destinatario (Titular):</span>
                  <span className="text-sm font-bold text-slate-900">{titularNombre}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">WhatsApp:</span>
                  <span className="text-sm font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                    +51 {titularTelefono}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Mensaje que recibirá el cliente:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Puedes editar el texto si deseas agregar una nota</span>
                </label>
                <textarea
                  value={textoVoucher}
                  onChange={(e) => {
                    setTextoVoucher(e.target.value);
                    setEnlaceWhatsAppDirecto(VoucherGenerator.generarEnlaceWhatsApp(titularTelefono, e.target.value));
                  }}
                  rows={9}
                  className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-300 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Al presionar <strong>Enviar a WhatsApp</strong>, se abrirá el chat oficial con el cliente y los asientos quedarán reservados en el sistema.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopiarPortapapeles}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-2.5 rounded-xl transition-colors"
                >
                  {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiado ? '¡Copiado!' : 'Copiar Texto'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalAbierto(false);
                    setModalBoletoDigital(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-2.5 rounded-xl transition-colors"
                >
                  <QrCode className="w-4 h-4 text-blue-600" /> Ver Boleto Digital
                </button>
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-1/2 sm:w-auto text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Modificar
                </button>
                <button
                  type="button"
                  onClick={handleEnviarDirectoWhatsApp}
                  className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  <ExternalLink className="w-4 h-4" /> Enviar a WhatsApp
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DEL BOLETO / VOUCHER DIGITAL DE EMBARQUE */}
      {modalBoletoDigital && reservaActivaGenerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Boleto Turístico Digital de Abordaje</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalBoletoDigital(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs bg-slate-50">
              {/* Tarjeta Tipo Pase de Abordaje */}
              <div className="bg-white border-2 border-dashed border-emerald-500 rounded-2xl p-5 shadow-sm space-y-4 relative">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-black text-slate-900 tracking-tight text-sm">RUTA LIBRE PERÚ</span>
                    <p className="text-[10px] text-slate-400">Turismo & Expediciones</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {reservaActivaGenerada.codigo}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tour</span>
                    <span className="font-bold text-slate-800 text-xs">{salidaActiva.tourNombre}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fecha & Hora</span>
                    <span className="font-bold text-slate-800">{salidaActiva.fecha} • {salidaActiva.horaEmbarque}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Titular</span>
                    <span className="font-bold text-slate-800">{reservaActivaGenerada.titular}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Butacas Asignadas</span>
                    <span className="font-bold text-blue-700">
                      {reservaActivaGenerada.asientos.length > 0
                        ? reservaActivaGenerada.asientos.map((a) => `#${a < 10 ? '0' + a : a}`).join(', ')
                        : 'Por orden de llegada'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Saldo a pagar al guía al abordar:</span>
                    <span className="font-black text-amber-600 text-sm">S/ {reservaActivaGenerada.saldo.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Estado:</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Confirmado
                    </span>
                  </div>
                </div>

                {/* Código QR Ilustrativo */}
                <div className="flex items-center justify-center pt-2">
                  <div className="bg-slate-900 text-white p-3 rounded-xl text-center flex flex-col items-center">
                    <QrCode className="w-16 h-16 text-emerald-400" />
                    <span className="text-[9px] font-mono tracking-widest mt-1 text-slate-300">
                      {reservaActivaGenerada.codigo}-VALIDO-SUTRAN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir Pase de Abordaje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA QUE EL GUÍA (TC) SOLICITE APROBACIÓN DE ADMINISTRACIÓN */}
      {modalNuevaSolicitudTC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">🚨 Solicitar Aprobación de Administración</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevaSolicitudTC(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Solicitud</label>
                <select
                  value={nuevaSolicitudTipo}
                  onChange={(e) => setNuevaSolicitudTipo(e.target.value as TipoSolicitudTC)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="GASTO_EMERGENCIA">Gasto Imprevisto / Emergencia en Ruta</option>
                  <option value="ABORDAJE_ESPECIAL">Abordaje Especial / Cambio de Paradero</option>
                  <option value="DESCUENTO_EXCEPCION">Excepción de Cobro / Pago Diferido</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Motivo / Título Breve</label>
                <input
                  type="text"
                  value={nuevaSolicitudTitulo}
                  onChange={(e) => setNuevaSolicitudTitulo(e.target.value)}
                  placeholder="Ej: Pago de cochera extra en Paracas"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {nuevaSolicitudTipo === 'GASTO_EMERGENCIA' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Monto Estimado (S/)</label>
                  <input
                    type="number"
                    value={nuevaSolicitudMonto}
                    onChange={(e) => setNuevaSolicitudMonto(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Detalle / Justificación</label>
                <textarea
                  value={nuevaSolicitudDesc}
                  onChange={(e) => setNuevaSolicitudDesc(e.target.value)}
                  rows={3}
                  placeholder="Explica a la administración el motivo de la solicitud..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalNuevaSolicitudTC(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrearSolicitudTC}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
