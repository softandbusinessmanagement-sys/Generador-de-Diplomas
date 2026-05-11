import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diplomas Web UC",
  description:
    "Plataforma de gestión y verificación de diplomas digitales con Next.js, Supabase Auth y PostgreSQL."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
