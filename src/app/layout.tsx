import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";
import { PwaSetup } from "@/components/store/pwa";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-cairo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Reeef | ريف — خضار وفواكه طازجة", template: "%s | Reeef ريف" },
  description: "من المزرعة إلى بيتك مباشرة — توصيل الخضروات والفواكه الطازجة داخل الإمارات",
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Reeef ريف", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "ar_AE",
        url: process.env.APP_URL || "https://reeef.io",
    siteName: "Reeef | ريف",
    title: "Reeef | ريف — خضار وفواكه طازجة",
    description: "من المزرعة إلى بيتك مباشرة — توصيل الخضروات والفواكه الطازجة داخل الإمارات",
    images: [{ url: "/img/farm-hero.webp", width: 1200, height: 630, alt: "Reeef — Fresh produce delivery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reeef | ريف — خضار وفواكه طازجة",
    description: "من المزرعة إلى بيتك مباشرة — توصيل الخضروات والفواكه الطازجة داخل الإمارات",
    images: ["/img/farm-hero.webp"],
  },
};
export const viewport: Viewport = { themeColor: "#17623b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={cairo.variable}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale}>{children}<PwaSetup /></I18nProvider>
      </body>
    </html>
  );
}
