import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Advanced Systems — Industrial Automation Marketplace",
    template: "%s | Advanced Systems",
  },
  description:
    "Your trusted source for industrial automation components, PLCs, drives, sensors, and more. Serving engineers worldwide.",
  keywords: ["industrial automation", "PLC", "drives", "sensors", "industrial parts", "automation marketplace"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://advanced-systems.com",
    siteName: "Advanced Systems",
    title: "Advanced Systems — Industrial Automation Marketplace",
    description: "Professional industrial automation marketplace for engineers and buyers worldwide.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-industrial-950 text-white antialiased min-h-screen flex flex-col">
        <QueryProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
