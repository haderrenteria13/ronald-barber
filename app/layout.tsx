import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ronaldbarber.shop'),
  title: {
    default: "Ronald Barber",
    template: "%s | Ronald Barber"
  },
  description: "Agenda tu cita con Ronald Barber. Cortes de cabello, barba y estilo profesional en un ambiente exclusivo. Reserva tu turno online fácilmente.",
  keywords: ["barbería", "corte de cabello", "barba", "estilo", "ronald barber", "citas online"],
  authors: [{ name: "Ronald Barber" }],
  openGraph: {
    title: "Ronald Barber | Estilo y Elegancia",
    description: "Agenda tu cita con Ronald Barber. Cortes de cabello, barba y estilo profesional.",
    url: '/',
    siteName: 'Ronald Barber',
    images: [
      {
        url: '/og-image.png', 
        width: 1200,
        height: 630,
        alt: 'Ronald Barber Shop',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ronald Barber | Estilo y Elegancia",
    description: "Agenda tu cita con Ronald Barber. Cortes de cabello, barba y estilo profesional.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
