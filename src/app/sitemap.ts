import type { MetadataRoute } from "next";

const BASE = "https://reef-ztg0.onrender.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/offers`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
