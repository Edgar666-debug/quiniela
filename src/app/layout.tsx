import type { Metadata } from "next";
import "./globals.css";
import { themeInitScript } from "@/lib/theme";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Quiniela",
  description: "Plataforma de quinielas por torneo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
