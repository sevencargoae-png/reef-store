/** Normalized (ar/en) product search used as a fallback when the plain DB search finds nothing. */
import type { ProductDTO } from "./catalog";

// ───────── text normalization ─────────
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export function normalize(s: string) {
  return s
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[ً-ْـ]/g, "") // diacritics, tatweel
    .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .toLowerCase().trim();
}
const stripAl = (w: string) => w.replace(/^(ال|و|وال|بال|لل)/, "");
const tokens = (s: string) => normalize(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// ───────── product matching ─────────
interface Indexed { p: ProductDTO; terms: Set<string>; nameTokens: string[] }
export function buildIndex(catalog: ProductDTO[]): Indexed[] {
  return catalog.map((p) => {
    const terms = new Set<string>();
    for (const t of [...p.tags, p.nameAr, p.nameEn]) for (const w of tokens(t)) terms.add(stripAl(w));
    for (const t of p.tags) terms.add(normalize(t));
    return { p, terms, nameTokens: tokens(p.nameAr).map(stripAl) };
  });
}

const sing = (w: string) => w.replace(/(ات|ان|ين|ه)$/, "").replace(/(es|s)$/, "");

/** Natural-language product search: normalized token match over names/tags, ranked. */
export function searchProducts(q: string, catalog: ProductDTO[], limit = 24): ProductDTO[] {
  const index = buildIndex(catalog);
  const words = tokens(q).map(stripAl).filter((w) => w.length > 1);
  if (!words.length) return [];
  return index.map((ix) => {
    let score = 0;
    for (const w of words) { if (ix.terms.has(w)) score += 4; else if ([...ix.terms].some((t) => sing(t) === sing(w) && w.length > 2)) score += 3; else if (w.length > 2 && [...ix.terms].some((t) => t.includes(w))) score += 1; }
    return { p: ix.p, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.p);
}
