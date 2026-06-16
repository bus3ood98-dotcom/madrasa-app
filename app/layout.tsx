import type { Metadata } from "next";
import { Lalezar, Tajawal } from "next/font/google";
import "./globals.css";

const lalezar = Lalezar({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-lalezar",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "إنجاز | منصة الواجبات",
  description: "منصة متابعة الواجبات والإنجازات للطلاب",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "إنجاز",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#0F6E5F",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${lalezar.variable} ${tajawal.variable} font-body bg-cream text-navy antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
