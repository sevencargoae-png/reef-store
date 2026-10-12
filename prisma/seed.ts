/**
 * REEF seed — reference data (emirates, slots) + a SAMPLE catalog so the store can be previewed.
 * Sample products/areas are clearly marked (tags: ["sample"]) and meant to be replaced from the admin panel
 * with the real commercial catalog. Idempotent: re-running updates by slug/code.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const EMIRATES = [
  { code: "DXB", nameAr: "دبي", nameEn: "Dubai", sort: 1 },
  { code: "AUH", nameAr: "أبوظبي", nameEn: "Abu Dhabi", sort: 2 },
  { code: "SHJ", nameAr: "الشارقة", nameEn: "Sharjah", sort: 3 },
  { code: "AJM", nameAr: "عجمان", nameEn: "Ajman", sort: 4 },
  { code: "UAQ", nameAr: "أم القيوين", nameEn: "Umm Al Quwain", sort: 5 },
  { code: "RAK", nameAr: "رأس الخيمة", nameEn: "Ras Al Khaimah", sort: 6 },
  { code: "FUJ", nameAr: "الفجيرة", nameEn: "Fujairah", sort: 7 },
];

// Sample delivery areas & fees — adjust from Admin → Delivery areas (no code change needed).
const AREAS: { emirate: string; nameAr: string; nameEn: string; fee: number; free?: number }[] = [
  { emirate: "DXB", nameAr: "جميرا", nameEn: "Jumeirah", fee: 10, free: 150 },
  { emirate: "DXB", nameAr: "أم سقيم", nameEn: "Umm Suqeim", fee: 10, free: 150 },
  { emirate: "DXB", nameAr: "البرشاء", nameEn: "Al Barsha", fee: 10, free: 150 },
  { emirate: "DXB", nameAr: "المرابع العربية", nameEn: "Arabian Ranches", fee: 15, free: 200 },
  { emirate: "DXB", nameAr: "مردف", nameEn: "Mirdif", fee: 12, free: 150 },
  { emirate: "DXB", nameAr: "دبي مارينا", nameEn: "Dubai Marina", fee: 12, free: 150 },
  { emirate: "DXB", nameAr: "الخوانيج", nameEn: "Al Khawaneej", fee: 15, free: 200 },
  { emirate: "SHJ", nameAr: "المجاز", nameEn: "Al Majaz", fee: 15, free: 200 },
  { emirate: "SHJ", nameAr: "الخان", nameEn: "Al Khan", fee: 15, free: 200 },
  { emirate: "SHJ", nameAr: "مويلح", nameEn: "Muwaileh", fee: 18, free: 200 },
  { emirate: "AJM", nameAr: "الراشدية", nameEn: "Al Rashidiya", fee: 20, free: 250 },
  { emirate: "AUH", nameAr: "جزيرة الريم", nameEn: "Al Reem Island", fee: 20, free: 250 },
  { emirate: "AUH", nameAr: "الخالدية", nameEn: "Al Khalidiya", fee: 20, free: 250 },
  { emirate: "AUH", nameAr: "مدينة خليفة", nameEn: "Khalifa City", fee: 25, free: 300 },
];

const CATEGORIES = [
  { slug: "vegetables", nameAr: "خضروات طازجة", nameEn: "Fresh vegetables", image: "/img/categories/tomatoes.jpg", sort: 1, descAr: "خضروات يومية من المزارع المحلية", descEn: "Everyday vegetables from local farms" },
  { slug: "cucumbers-greens", nameAr: "خيار وفواكه خضراء", nameEn: "Cucumbers & green fruits", image: "/img/categories/cucumbers.jpg", sort: 2, descAr: "خيار وكوسا وفلفل وفواكه خضراء", descEn: "Cucumber, zucchini, peppers and green fruits" },
  { slug: "strawberries", nameAr: "فراولة محلية", nameEn: "Local strawberries", image: "/img/categories/strawberries.jpg", sort: 3, descAr: "فراولة وتوت من المزارع الإماراتية", descEn: "Strawberries and berries from UAE farms" },
  { slug: "leafy", nameAr: "خضروات ورقية", nameEn: "Leafy greens", image: "/img/categories/leafy.jpg", sort: 4, descAr: "ورقيات وأعشاب طازجة", descEn: "Fresh leaves and herbs" },
  { slug: "citrus", nameAr: "حمضيات", nameEn: "Citrus", image: "/img/categories/citrus.jpg", sort: 5, descAr: "برتقال وليمون وجريب فروت", descEn: "Oranges, lemons and grapefruit" },
  { slug: "dates", nameAr: "تمور فاخرة", nameEn: "Premium dates", image: "/img/categories/dates.jpg", sort: 6, descAr: "تمور إماراتية مختارة", descEn: "Selected Emirati dates" },
  { slug: "fruits", nameAr: "فواكه", nameEn: "Fruits", image: "/img/categories/citrus.jpg", sort: 7, showOnHome: false, descAr: "فواكه موسمية", descEn: "Seasonal fruits" },
  { slug: "herbs", nameAr: "أعشاب", nameEn: "Herbs", image: "/img/categories/leafy.jpg", sort: 8, showOnHome: false, descAr: "نعناع وبقدونس وكزبرة", descEn: "Mint, parsley, coriander" },
  { slug: "baskets", nameAr: "سلال", nameEn: "Baskets", image: "/img/categories/tomatoes.jpg", sort: 9, showOnHome: false, descAr: "سلال جاهزة للأسبوع", descEn: "Ready weekly baskets" },
];

type U = "KG" | "PIECE" | "BUNCH" | "PACK" | "BOX";
interface P { slug: string; cat: string; ar: string; en: string; unit: U; price: number; compare?: number; cost: number; stock: number; step?: number; min?: number; origin?: string; tags: string[]; weight?: boolean; featured?: boolean; img?: string }
const PRODUCTS: P[] = [
  // vegetables
  { slug: "tomato-local", cat: "vegetables", ar: "طماطم إماراتية طازجة", en: "Fresh Emirati tomatoes", unit: "KG", price: 12.5, cost: 7, stock: 120, step: 0.5, min: 0.5, origin: "الإمارات", tags: ["طماطم", "tomato", "tomatoes", "بندورة", "sample"], weight: true, featured: true },
  { slug: "cherry-tomato", cat: "vegetables", ar: "طماطم كرزية", en: "Cherry tomatoes", unit: "PACK", price: 9, cost: 5, stock: 60, origin: "الإمارات", tags: ["طماطم", "cherry", "tomato", "sample"] },
  { slug: "potato", cat: "vegetables", ar: "بطاطس", en: "Potatoes", unit: "KG", price: 5.5, cost: 3, stock: 200, step: 0.5, min: 1, origin: "مصر", tags: ["بطاطس", "بطاطا", "potato", "potatoes", "sample"], weight: true },
  { slug: "onion-red", cat: "vegetables", ar: "بصل أحمر", en: "Red onions", unit: "KG", price: 4.5, cost: 2.5, stock: 150, step: 0.5, min: 0.5, origin: "الهند", tags: ["بصل", "onion", "onions", "sample"], weight: true },
  { slug: "garlic", cat: "vegetables", ar: "ثوم", en: "Garlic", unit: "KG", price: 18, cost: 11, stock: 40, step: 0.25, min: 0.25, origin: "الصين", tags: ["ثوم", "garlic", "sample"], weight: true },
  { slug: "carrot", cat: "vegetables", ar: "جزر", en: "Carrots", unit: "KG", price: 6, cost: 3.5, stock: 100, step: 0.5, min: 0.5, origin: "الإمارات", tags: ["جزر", "carrot", "carrots", "sample"], weight: true },
  { slug: "eggplant", cat: "vegetables", ar: "باذنجان", en: "Eggplant", unit: "KG", price: 7, cost: 4, stock: 70, step: 0.5, min: 0.5, origin: "الإمارات", tags: ["باذنجان", "eggplant", "aubergine", "sample"], weight: true },
  { slug: "cauliflower", cat: "vegetables", ar: "قرنبيط", en: "Cauliflower", unit: "PIECE", price: 8, cost: 4.5, stock: 35, origin: "الإمارات", tags: ["قرنبيط", "زهرة", "cauliflower", "sample"] },
  { slug: "broccoli", cat: "vegetables", ar: "بروكلي", en: "Broccoli", unit: "PIECE", price: 9.5, cost: 5.5, stock: 30, origin: "الإمارات", tags: ["بروكلي", "broccoli", "sample"] },
  { slug: "okra", cat: "vegetables", ar: "بامية", en: "Okra", unit: "KG", price: 16, cost: 10, stock: 40, step: 0.25, min: 0.25, origin: "الأردن", tags: ["بامية", "okra", "sample"], weight: true },
  { slug: "cabbage", cat: "vegetables", ar: "ملفوف أبيض", en: "White cabbage", unit: "PIECE", price: 7, cost: 4, stock: 30, origin: "الإمارات", tags: ["ملفوف", "كرنب", "cabbage", "sample"] },
  { slug: "sweet-potato", cat: "vegetables", ar: "بطاطا حلوة", en: "Sweet potato", unit: "KG", price: 9, cost: 5, stock: 60, step: 0.5, min: 0.5, origin: "مصر", tags: ["بطاطا حلوة", "sweet potato", "sample"], weight: true },
  // cucumbers & greens
  { slug: "cucumber-local", cat: "cucumbers-greens", ar: "خيار محلي", en: "Local cucumber", unit: "KG", price: 8, compare: 10, cost: 4.5, stock: 90, step: 0.5, min: 0.5, origin: "الإمارات", tags: ["خيار", "cucumber", "cucumbers", "sample"], weight: true, featured: true },
  { slug: "zucchini", cat: "cucumbers-greens", ar: "كوسا", en: "Zucchini", unit: "KG", price: 9, cost: 5, stock: 60, step: 0.5, min: 0.5, origin: "الإمارات", tags: ["كوسا", "كوسة", "zucchini", "courgette", "sample"], weight: true },
  { slug: "capsicum-green", cat: "cucumbers-greens", ar: "فلفل أخضر", en: "Green capsicum", unit: "KG", price: 10, cost: 6, stock: 50, step: 0.5, min: 0.5, origin: "الإمارات", tags: ["فلفل", "capsicum", "pepper", "bell pepper", "sample"], weight: true },
  { slug: "capsicum-mix", cat: "cucumbers-greens", ar: "فلفل ملون", en: "Mixed capsicum", unit: "KG", price: 16, cost: 10, stock: 30, step: 0.5, min: 0.5, origin: "هولندا", tags: ["فلفل", "ملون", "capsicum", "sample"] },
  { slug: "green-beans", cat: "cucumbers-greens", ar: "فاصوليا خضراء", en: "Green beans", unit: "KG", price: 14, cost: 8, stock: 40, step: 0.25, min: 0.25, origin: "الأردن", tags: ["فاصوليا", "فاصولياء", "beans", "green beans", "sample"], weight: true },
  { slug: "avocado", cat: "cucumbers-greens", ar: "أفوكادو", en: "Avocado", unit: "PIECE", price: 6, cost: 3.5, stock: 80, origin: "كينيا", tags: ["أفوكادو", "avocado", "sample"] },
  { slug: "green-apple", cat: "cucumbers-greens", ar: "تفاح أخضر", en: "Green apples", unit: "KG", price: 11, cost: 7, stock: 70, step: 0.5, min: 0.5, origin: "جنوب أفريقيا", tags: ["تفاح", "apple", "apples", "sample"], weight: true },
  { slug: "green-grapes", cat: "cucumbers-greens", ar: "عنب أخضر", en: "Green grapes", unit: "KG", price: 18, cost: 11, stock: 40, step: 0.5, min: 0.5, origin: "مصر", tags: ["عنب", "grapes", "sample"], weight: true },
  // strawberries
  { slug: "strawberry-local", cat: "strawberries", ar: "فراولة إماراتية", en: "Emirati strawberries", unit: "PACK", price: 14, compare: 17, cost: 9, stock: 50, origin: "الإمارات", tags: ["فراولة", "strawberry", "strawberries", "sample"], featured: true },
  { slug: "blueberry", cat: "strawberries", ar: "توت أزرق", en: "Blueberries", unit: "PACK", price: 16, cost: 10, stock: 30, origin: "بيرو", tags: ["توت", "blueberry", "blueberries", "sample"] },
  { slug: "raspberry", cat: "strawberries", ar: "توت العليق", en: "Raspberries", unit: "PACK", price: 19, cost: 12, stock: 20, origin: "المغرب", tags: ["توت", "raspberry", "sample"] },
  // leafy
  { slug: "spinach", cat: "leafy", ar: "سبانخ", en: "Spinach", unit: "BUNCH", price: 4, cost: 2, stock: 60, origin: "الإمارات", tags: ["سبانخ", "spinach", "sample"], featured: true },
  { slug: "lettuce-iceberg", cat: "leafy", ar: "خس أيسبرغ", en: "Iceberg lettuce", unit: "PIECE", price: 6, cost: 3.5, stock: 40, origin: "الإمارات", tags: ["خس", "lettuce", "iceberg", "sample"] },
  { slug: "lettuce-romaine", cat: "leafy", ar: "خس روماني", en: "Romaine lettuce", unit: "PIECE", price: 5.5, cost: 3, stock: 40, origin: "الإمارات", tags: ["خس", "lettuce", "romaine", "sample"] },
  { slug: "rocca", cat: "leafy", ar: "جرجير", en: "Rocket (arugula)", unit: "BUNCH", price: 3.5, cost: 1.8, stock: 60, origin: "الإمارات", tags: ["جرجير", "rocca", "rocket", "arugula", "sample"] },
  { slug: "molokhia", cat: "leafy", ar: "ملوخية خضراء", en: "Fresh molokhia", unit: "BUNCH", price: 6, cost: 3, stock: 25, origin: "الإمارات", tags: ["ملوخية", "molokhia", "sample"] },
  { slug: "kale", cat: "leafy", ar: "كيل", en: "Kale", unit: "BUNCH", price: 8, cost: 4.5, stock: 20, origin: "الإمارات", tags: ["كيل", "kale", "sample"] },
  // herbs
  { slug: "mint", cat: "herbs", ar: "نعناع", en: "Mint", unit: "BUNCH", price: 3, cost: 1.5, stock: 80, origin: "الإمارات", tags: ["نعناع", "mint", "sample"] },
  { slug: "parsley", cat: "herbs", ar: "بقدونس", en: "Parsley", unit: "BUNCH", price: 3, cost: 1.5, stock: 80, origin: "الإمارات", tags: ["بقدونس", "parsley", "sample"] },
  { slug: "coriander", cat: "herbs", ar: "كزبرة", en: "Coriander", unit: "BUNCH", price: 3, cost: 1.5, stock: 80, origin: "الإمارات", tags: ["كزبرة", "coriander", "cilantro", "sample"] },
  { slug: "dill", cat: "herbs", ar: "شبت", en: "Dill", unit: "BUNCH", price: 3, cost: 1.5, stock: 40, origin: "الإمارات", tags: ["شبت", "dill", "sample"] },
  { slug: "basil", cat: "herbs", ar: "ريحان", en: "Basil", unit: "BUNCH", price: 4, cost: 2, stock: 30, origin: "الإمارات", tags: ["ريحان", "basil", "sample"] },
  { slug: "spring-onion", cat: "herbs", ar: "بصل أخضر", en: "Spring onions", unit: "BUNCH", price: 3.5, cost: 1.8, stock: 50, origin: "الإمارات", tags: ["بصل أخضر", "spring onion", "scallion", "sample"] },
  // citrus
  { slug: "orange-navel", cat: "citrus", ar: "برتقال أبو صرة", en: "Navel oranges", unit: "KG", price: 9, cost: 5, stock: 120, step: 0.5, min: 1, origin: "مصر", tags: ["برتقال", "orange", "oranges", "sample"], weight: true, featured: true },
  { slug: "orange-juice", cat: "citrus", ar: "برتقال عصير", en: "Juicing oranges", unit: "KG", price: 7, compare: 8.5, cost: 4, stock: 150, step: 0.5, min: 1, origin: "مصر", tags: ["برتقال", "عصير", "orange", "juice", "sample"], weight: true },
  { slug: "lemon", cat: "citrus", ar: "ليمون أصفر", en: "Lemons", unit: "KG", price: 10, cost: 6, stock: 60, step: 0.25, min: 0.25, origin: "تركيا", tags: ["ليمون", "lemon", "lemons", "sample"], weight: true },
  { slug: "lime", cat: "citrus", ar: "ليمون أخضر", en: "Limes", unit: "KG", price: 12, cost: 7, stock: 40, step: 0.25, min: 0.25, origin: "الهند", tags: ["ليمون أخضر", "lime", "limes", "sample"], weight: true },
  { slug: "grapefruit", cat: "citrus", ar: "جريب فروت", en: "Grapefruit", unit: "KG", price: 9, cost: 5, stock: 40, step: 0.5, min: 0.5, origin: "جنوب أفريقيا", tags: ["جريب فروت", "grapefruit", "sample"], weight: true },
  { slug: "mandarin", cat: "citrus", ar: "يوسفي", en: "Mandarins", unit: "KG", price: 11, cost: 6.5, stock: 60, step: 0.5, min: 0.5, origin: "باكستان", tags: ["يوسفي", "مندرين", "mandarin", "clementine", "sample"], weight: true },
  // dates
  { slug: "dates-khalas", cat: "dates", ar: "تمر خلاص", en: "Khalas dates", unit: "KG", price: 38, cost: 24, stock: 40, step: 0.5, min: 0.5, origin: "الإمارات", tags: ["تمر", "خلاص", "dates", "khalas", "sample"], featured: true },
  { slug: "dates-medjool", cat: "dates", ar: "تمر مجهول", en: "Medjool dates", unit: "KG", price: 55, cost: 36, stock: 30, step: 0.5, min: 0.5, origin: "الإمارات", tags: ["تمر", "مجهول", "dates", "medjool", "sample"] },
  { slug: "dates-sukkari", cat: "dates", ar: "تمر سكري", en: "Sukkari dates", unit: "KG", price: 42, compare: 48, cost: 27, stock: 25, step: 0.5, min: 0.5, origin: "السعودية", tags: ["تمر", "سكري", "dates", "sukkari", "sample"] },
  { slug: "dates-box-gift", cat: "dates", ar: "علبة تمور هدية", en: "Dates gift box", unit: "BOX", price: 95, cost: 60, stock: 15, origin: "الإمارات", tags: ["تمر", "هدية", "dates", "gift", "sample"] },
  // fruits
  { slug: "banana", cat: "fruits", ar: "موز", en: "Bananas", unit: "KG", price: 7, cost: 4, stock: 120, step: 0.5, min: 0.5, origin: "الفلبين", tags: ["موز", "banana", "bananas", "sample"], weight: true },
  { slug: "mango", cat: "fruits", ar: "مانجو", en: "Mango", unit: "KG", price: 16, cost: 10, stock: 40, step: 0.5, min: 0.5, origin: "الهند", tags: ["مانجو", "مانجا", "mango", "sample"], weight: true },
  { slug: "watermelon", cat: "fruits", ar: "بطيخ", en: "Watermelon", unit: "PIECE", price: 18, cost: 11, stock: 20, origin: "الإمارات", tags: ["بطيخ", "watermelon", "sample"] },
  { slug: "pomegranate", cat: "fruits", ar: "رمان", en: "Pomegranate", unit: "KG", price: 14, cost: 8.5, stock: 40, step: 0.5, min: 0.5, origin: "مصر", tags: ["رمان", "pomegranate", "sample"], weight: true },
  { slug: "apple-red", cat: "fruits", ar: "تفاح أحمر", en: "Red apples", unit: "KG", price: 10, cost: 6, stock: 80, step: 0.5, min: 0.5, origin: "إيطاليا", tags: ["تفاح", "apple", "apples", "sample"], weight: true },
  { slug: "pear", cat: "fruits", ar: "كمثرى", en: "Pears", unit: "KG", price: 12, cost: 7.5, stock: 40, step: 0.5, min: 0.5, origin: "جنوب أفريقيا", tags: ["كمثرى", "إجاص", "pear", "pears", "sample"], weight: true },
  { slug: "kiwi", cat: "fruits", ar: "كيوي", en: "Kiwi", unit: "PACK", price: 9, cost: 5.5, stock: 40, origin: "إيران", tags: ["كيوي", "kiwi", "sample"] },
];

const CAT_IMG: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.image]));

async function main() {
  for (const e of EMIRATES) await prisma.emirate.upsert({ where: { code: e.code }, create: e, update: e });
  const emirates = Object.fromEntries((await prisma.emirate.findMany()).map((e) => [e.code, e.id]));

  for (const a of AREAS) {
    const existing = await prisma.area.findFirst({ where: { emirateId: emirates[a.emirate], nameEn: a.nameEn } });
    const data = { emirateId: emirates[a.emirate], nameAr: a.nameAr, nameEn: a.nameEn, deliveryFee: a.fee, freeDeliveryThreshold: a.free ?? null, minOrder: 50 };
    if (existing) await prisma.area.update({ where: { id: existing.id }, data }); else await prisma.area.create({ data });
  }

  // Two slots every day except Friday morning.
  if ((await prisma.deliverySlot.count()) === 0) {
    for (let wd = 0; wd < 7; wd++) {
      if (wd !== 5) await prisma.deliverySlot.create({ data: { weekday: wd, startTime: "09:00", endTime: "12:00", capacity: 25, cutoffHours: 12 } });
      await prisma.deliverySlot.create({ data: { weekday: wd, startTime: "16:00", endTime: "20:00", capacity: 30, cutoffHours: 6 } });
    }
  }

  for (const c of CATEGORIES) {
    const { slug, ...rest } = c;
    await prisma.category.upsert({ where: { slug }, create: { slug, ...rest }, update: rest });
  }
  const cats = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  const supplier = await prisma.supplier.findFirst({ where: { name: "مزارع الإمارات (نموذج)" } })
    ?? await prisma.supplier.create({ data: { name: "مزارع الإمارات (نموذج)", notes: "مورد نموذجي للمعاينة — عدّل البيانات من لوحة التحكم" } });

  for (const p of PRODUCTS) {
    const data = {
      nameAr: p.ar, nameEn: p.en, categoryId: cats[p.cat], supplierId: supplier.id, unit: p.unit,
      step: p.step ?? 1, minQty: p.min ?? 1, soldByActualWeight: p.weight ?? false,
      price: p.price, compareAtPrice: p.compare ?? null, costPrice: p.cost, stockQty: p.stock, lowStockThreshold: p.unit === "KG" ? 5 : 5,
      origin: p.origin ?? null, tags: p.tags, isFeatured: p.featured ?? false, isActive: true,
    };
    const prod = await prisma.product.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
    if ((await prisma.productImage.count({ where: { productId: prod.id } })) === 0) {
      await prisma.productImage.create({ data: { productId: prod.id, url: p.img ?? CAT_IMG[p.cat], alt: p.en, sort: 0 } });
    }
  }

  // Weekly family basket bundle
  const bundleSlug = "basket-family-week";
  const comps = [["tomato-local", 2], ["cucumber-local", 1], ["potato", 2], ["onion-red", 1], ["carrot", 1], ["lettuce-iceberg", 1], ["mint", 2], ["parsley", 1], ["orange-navel", 2], ["banana", 1]] as const;
  const bundle = await prisma.product.upsert({
    where: { slug: bundleSlug },
    create: { slug: bundleSlug, kind: "BUNDLE", nameAr: "سلة العائلة الأسبوعية", nameEn: "Weekly family basket", descAr: "تشكيلة أساسية تكفي أسرة من 4 أفراد لأسبوع", descEn: "Essential mix for a family of 4 for a week", categoryId: cats.baskets, unit: "BOX", price: 95, compareAtPrice: 110, costPrice: 60, trackStock: false, tags: ["سلة", "basket", "عائلة", "sample"], isFeatured: true },
    update: { kind: "BUNDLE", price: 95, compareAtPrice: 110 },
  });
  if ((await prisma.productImage.count({ where: { productId: bundle.id } })) === 0) await prisma.productImage.create({ data: { productId: bundle.id, url: CAT_IMG.vegetables, alt: "Weekly basket" } });
  const bySlug = Object.fromEntries((await prisma.product.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id]));
  for (const [slug, qty] of comps) {
    await prisma.bundleItem.upsert({ where: { bundleId_componentId: { bundleId: bundle.id, componentId: bySlug[slug] } }, create: { bundleId: bundle.id, componentId: bySlug[slug], qty }, update: { qty } });
  }

  await prisma.coupon.upsert({ where: { code: "WELCOME10" }, create: { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 80, maxDiscount: 30, perUserLimit: 1 }, update: {} });

  await prisma.setting.upsert({ where: { key: "store" }, create: { key: "store", value: { vatEnabled: false, vatRate: 0.05, pricesIncludeVat: true, codEnabled: true, minOrderAed: 50, bookingWindowDays: 7 } }, update: {} });

  // First admin: phone/password from env; a random password is generated (and printed once) when not provided.
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? "+971500000001";
  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!existingAdmin) {
    const pw = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");
    await prisma.user.create({ data: { phone: adminPhone, name: "مدير ريف", role: "SUPER_ADMIN", passwordHash: await hashPassword(pw), mustChangePassword: true } }); // always forced to change on first login
    console.log(`\n[seed] SUPER_ADMIN created: ${adminPhone}${process.env.SEED_ADMIN_PASSWORD ? "" : ` — temporary password (shown once): ${pw}`}\n`);
  } else if (existingAdmin.role === "CUSTOMER") {
    // The owner's number may already exist as a customer (e.g. after trying the store): promote it.
    const pw = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");
    await prisma.user.update({ where: { id: existingAdmin.id }, data: { role: "SUPER_ADMIN", passwordHash: await hashPassword(pw), mustChangePassword: true } });
    console.log(`\n[seed] SUPER_ADMIN promoted from customer: ${adminPhone}${process.env.SEED_ADMIN_PASSWORD ? "" : ` — temporary password (shown once): ${pw}`}\n`);
  }
  // One-off owner password reset: set ADMIN_RESET_PASSWORD on Render, deploy, log in, then clear it.
  const resetPw = process.env.ADMIN_RESET_PASSWORD;
  if (resetPw) {
    await prisma.user.update({ where: { phone: adminPhone }, data: { passwordHash: await hashPassword(resetPw), mustChangePassword: true, status: "ACTIVE" } })
      .then(() => console.log(`[seed] admin password reset for ${adminPhone}`))
      .catch((e) => console.error("[seed] admin password reset failed", e));
  }
  console.log("[seed] done");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
