/**
 * Definiciones de Tipos de Dominio - Ruta Libre Perú
 * Clean Architecture - Capa de Dominio (Pure TypeScript, Zero External Dependencies)
 */

export type TipoDocumento = 'DNI' | 'CE' | 'PASAPORTE';

export type TipoHabitacion = 
  | 'NO_APLICA_FULLDAY'
  | 'MATRIMONIAL'
  | 'DOBLE_TWIN'
  | 'TRIPLE'
  | 'SIMPLE_INDIVIDUAL';

export interface PasajeroInput {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  edad: number;
  paraderoEmbarqueId: string;
  asientoNumero?: number;
  tipoHabitacion?: TipoHabitacion;
  condicionesMedicas?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  adicionalesIds?: string[];
}

export interface AdicionalItem {
  id: string;
  nombre: string;
  precioVenta: number;
  costoProveedor: number;
}

export interface TourTarifas {
  precioBaseRegular: number;
  precioPreventa?: number;
  precioGrupo4Mas?: number;
  precioNino?: number; // Para niños de 4 a 10 años
}

export interface CuponDescuento {
  codigo: string;
  tipo: 'MONTO_FIJO' | 'PORCENTAJE';
  valor: number; // Ej: 10 para S/ 10 o 15 para 15%
  topeMaximoDescuento?: number;
  activo: boolean;
  fechaExpiracion?: Date;
}

export interface DescuentoManual {
  monto: number;
  motivo: string;
  autorizadoPorAdmin: boolean;
}

export interface CotizacionReservaInput {
  tarifas: TourTarifas;
  esPreventa?: boolean;
  pasajeros: PasajeroInput[];
  adicionalesCatalogo: Record<string, AdicionalItem>;
  cupon?: CuponDescuento;
  descuentoManual?: DescuentoManual;
}

export interface DesglosePasajero {
  nombreCompleto: string;
  edad: number;
  categoriaEdad: 'INFANTE_EN_BRAZOS' | 'NINO' | 'ADULTO';
  precioTour: number;
  subtotalAdicionales: number;
  totalPasajero: number;
}

export interface ResultadoCotizacion {
  totalPasajeros: number;
  asientosOcupados: number; // Los infantes <4 años en brazos no ocupan asiento
  subtotalTours: number;
  subtotalAdicionales: number;
  descuentoAplicado: number;
  desgloseDescuento: string[];
  montoTotal: number;
  adelantoMinimoSugerido: number; // 50% o S/ 30 por asiento
  desglosePasajeros: DesglosePasajero[];
}

export interface EstadoAforo {
  capacidadTotal: number;
  cupoMinimoBreakEven: number;
  asientosOcupados: number;
  asientosDisponibles: number;
  estaLleno: boolean;
  alcanzoBreakEven: boolean;
  semaforo: 'DISPONIBLE' | 'ULTIMOS_CUPOS' | 'LLENO';
}

export type TipoSolicitudTC = 
  | 'GASTO_EMERGENCIA' 
  | 'ABORDAJE_ESPECIAL' 
  | 'DESCUENTO_EXCEPCION'
  | 'REASIGNACION_ASIENTO';

export type EstadoSolicitudTC = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface SolicitudAprobacionTC {
  id: string;
  expedicionId: string;
  codigoExpedicion: string;
  solicitanteTC: string;
  tipoSolicitud: TipoSolicitudTC;
  titulo: string;
  monto?: number;
  descripcion: string;
  estado: EstadoSolicitudTC;
  creadoEn: string;
  autorizadoPor?: string;
  observacionAdmin?: string;
}

export type MetodoPago = 'YAPE' | 'PLIN' | 'BCP' | 'BBVA' | 'INTERBANK' | 'EFECTIVO_TC' | 'WALLET_SALDO';

export interface PagoRegistro {
  id: string;
  codigoOperacion?: string;
  expedicionCodigo: string;
  titularNombre: string;
  monto: number;
  metodo: MetodoPago;
  fechaHora: string;
  conciliado: boolean;
  registradoPor: string;
  observaciones?: string;
}

export interface ClienteWallet {
  id: string;
  clienteNombre: string;
  clienteDni: string;
  clienteTelefono: string;
  saldoDisponible: number;
  motivoCredito: string;
  fechaEmision: string;
  fechaExpiracion: string;
  estado: 'ACTIVO' | 'UTILIZADO' | 'VENCIDO';
}


