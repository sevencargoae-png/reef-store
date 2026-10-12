import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reeef | ريف — خضار وفواكه طازجة",
    short_name: "Reeef ريف",
    description: "من المزرعة إلى منزلك مباشرة — خضار وفواكه وتمور طازجة داخل الإمارات",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3fbf6",
    theme_color: "#17623b",
    categories: ["shopping", "food"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "العروض", url: "/offers" },
      { name: "السلة", url: "/cart" },
      { name: "لوحة التحكم", url: "/admin" },
    ],
  };
}
