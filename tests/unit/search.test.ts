import { describe, expect, it } from "vitest";
import { normalize, searchProducts } from "@/lib/services/search";
import type { ProductDTO } from "@/lib/services/catalog";

const p = (id: string, nameAr: string, nameEn: string, tags: string[]): ProductDTO => ({ id, slug: id, sku: null, kind: "SIMPLE", nameAr, nameEn, descAr: null, descEn: null, categoryId: "c", categorySlug: "c", categoryNameAr: "", categoryNameEn: "", unit: "KG", step: 1, minQty: 1, maxQty: null, approxWeightKg: null, soldByActualWeight: false, price: 100, compareAtPrice: null, vatApplicable: true, inStock: true, lowStock: false, availableQty: 10, origin: null, tags, isFeatured: false, images: [] });
const catalog = [p("tom", "طماطم إماراتية", "Tomatoes", ["طماطم", "tomato"]), p("cuc", "خيار محلي", "Cucumber", ["خيار", "cucumber"]), p("mint", "نعناع", "Mint", ["نعناع", "mint"])];

describe("normalized search", () => {
  it("normalizes Arabic variants and digits", () => {
    expect(normalize("أَلطَّمَاطِم ٣")).toBe("الطماطم 3");
    expect(normalize("خيارة")).toBe("خياره");
  });
  it("finds products through tags, prefixes and plurals", () => {
    expect(searchProducts("طماطم وخيار", catalog).map((x) => x.id).sort()).toEqual(["cuc", "tom"]);
    expect(searchProducts("tomatoes", catalog)[0].id).toBe("tom");
    expect(searchProducts("النعناع", catalog)[0].id).toBe("mint");
    expect(searchProducts("شوكولاتة", catalog)).toEqual([]);
  });
});
