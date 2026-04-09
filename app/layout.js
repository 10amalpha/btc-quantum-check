import "./globals.css";

export const metadata = {
  title: "BTC Quantum Check — 10AMPRO",
  description: "Verifica si tu dirección Bitcoin es vulnerable a computación cuántica. Herramienta gratuita de 10AMPRO.",
  openGraph: {
    title: "¿Tu Bitcoin está preparado para la era cuántica?",
    description: "Verifica si tu dirección BTC expone tu clave pública on-chain — el vector de ataque que un computador cuántico explotaría primero.",
    siteName: "10AMPRO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BTC Quantum Check — 10AMPRO",
    description: "Verifica si tu dirección Bitcoin es vulnerable a computación cuántica.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
