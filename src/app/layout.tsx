import type { Metadata, Viewport } from "next";
import { Inter, Special_Elite } from "next/font/google";
import "./globals.css";
import { Soundscape } from "@/components/layout/Soundscape";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-special-elite",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "S.O.M.B.R.A",
  description: "Serviço Operacional de Missões Bizarras, Ridículas e Absurdamente Inúteis",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-round-128.png", type: "image/png" },
      { url: "/icons/icon-square.svg", type: "image/svg+xml" }
    ],
    apple: "/icons/icon-square-128.png",
    shortcut: "/icons/icon-round-128.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "S.O.M.B.R.A",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${specialElite.variable}`}>
      <body className="antialiased bg-[#0a0a0a] min-h-screen">
        <Soundscape />
        {children}
      </body>
    </html>
  );
}
