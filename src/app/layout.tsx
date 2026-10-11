import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-cairo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Reef | ريف — خضار وفواكه طازجة", template: "%s | Reef ريف" },
  description: "من المزرعة إلى بيتك مباشرة — توصيل الخضروات والفواكه الطازجة داخل الإمارات",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#1c7a47", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={cairo.variable}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
