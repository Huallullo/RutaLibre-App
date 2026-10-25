import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ruta Libre Perú — Panel Operativo y Gestión de Reservas',
  description: 'Sistema Integral de Gestión de Salidas, Cupos, Pasajeros y Liquidación Financiera',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
