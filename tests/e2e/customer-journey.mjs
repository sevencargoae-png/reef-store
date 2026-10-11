// Customer journey against a running server: node tests/e2e/customer-journey.mjs [baseUrl]
// API-level journey: register → cart → address → slot → quote → order → reorder → cancel
const B = process.argv[2] ?? "http://localhost:3100";
let cookie = "";
async function call(method, path, body) {
  const r = await fetch(B + path, { method, headers: { "content-type": "application/json", cookie }, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
  const sc = r.headers.getSetCookie?.() ?? [];
  for (const c of sc) { const [kv] = c.split(";"); const [k] = kv.split("="); cookie = cookie.split("; ").filter((x) => x && !x.startsWith(k + "=")).concat(kv).join("; "); }
  const j = await r.json().catch(() => ({}));
  console.log(method, path, r.status, JSON.stringify(j).slice(0, 160));
  if (!r.ok) throw new Error(`${path} ${r.status} ${JSON.stringify(j)}`);
  return j.data;
}
const phone = "05" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
const first = await call("POST", "/api/auth/phone-login", { phone });
if (!first.isNew) throw new Error("expected new");
await call("POST", "/api/auth/phone-login", { phone, name: "عميل تجريبي" });
await call("POST", "/api/auth/logout");
const again = await call("POST", "/api/auth/phone-login", { phone });
if (again.isNew) throw new Error("expected existing");
const prods = await call("GET", "/api/products?pageSize=5");
const p1 = prods.items[0], p2 = prods.items[1];
await call("PUT", "/api/cart/items", { productId: p1.id, qty: p1.minQty });
await call("PUT", "/api/cart/items", { productId: p2.id, qty: p2.minQty * 3 });
await call("PUT", "/api/cart/items", { productId: p1.id, qty: 500 }); // should clamp to stock
const geo = await call("GET", "/api/areas");
const area = geo.areas[0];
const addr = await call("POST", "/api/account/addresses", { emirateId: area.emirateId, areaId: area.id, street: "شارع الوصل", building: "فيلا 12" });
const slots = await call("GET", "/api/checkout/slots");
const slot = slots[0];
const q = await call("POST", "/api/checkout/quote", { addressId: addr.id, couponCode: "WELCOME10" });
console.log("quote", q.quote, "coupon", q.coupon, q.couponError, "minOrderMet", q.minOrderMet);
const order = await call("POST", "/api/orders", { addressId: addr.id, slotId: slot.slotId, deliveryDate: slot.date, couponCode: "WELCOME10" });
console.log("ORDER", order.number, order.total, order.items.length);
const cartAfter = await call("GET", "/api/cart");
if (cartAfter.items.length) throw new Error("cart not cleared");
await call("POST", `/api/orders/${order.id}/reorder`);
// keep order open for admin lifecycle
const after = await call("GET", `/api/products?q=${encodeURIComponent(p1.nameAr)}`);
console.log("stock after cancel", after.items[0]?.availableQty, "before", p1.availableQty);
await call("POST", "/api/account/lists", { name: "أسبوعي", isWeekly: true, items: [{ productId: p1.id, qty: 1 }] });
await call("POST", "/api/account/subscriptions", { name: "سلة", frequency: "WEEKLY", weekday: slot.weekday, slotId: slot.slotId, addressId: addr.id, items: [{ productId: p2.id, qty: 2 }] });
console.log("JOURNEY OK");
