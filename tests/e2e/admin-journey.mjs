// Admin journey against a running server (needs the seeded SUPER_ADMIN): ADMIN_PHONE=+9715… ADMIN_PASSWORD=… node tests/e2e/admin-journey.mjs [baseUrl]
const B = process.argv[2] ?? "http://localhost:3100"; let cookie = "";
async function call(method, path, body, raw) {
  const r = await fetch(B + path, { method, headers: { ...(body && !raw ? { "content-type": "application/json" } : {}), cookie }, body: body ? (raw ? body : JSON.stringify(body)) : undefined });
  for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const [k] = kv.split("="); cookie = cookie.split("; ").filter((x) => x && !x.startsWith(k + "=")).concat(kv).join("; "); }
  const j = await r.json().catch(() => ({}));
  console.log(method, path, r.status, JSON.stringify(j).slice(0, 120));
  if (!r.ok) throw new Error(`${path} ${r.status} ${JSON.stringify(j)}`);
  return j.data;
}
// unauthenticated must be rejected
let r = await fetch(B + "/api/admin/products"); console.log("anon admin products →", r.status);
await call("POST", "/api/admin/auth/login", { phone: process.env.ADMIN_PHONE ?? "+971500000001", password: process.env.ADMIN_PASSWORD });
await call("GET", "/api/admin/dashboard");
const cats = await call("GET", "/api/admin/categories");
const p = await call("POST", "/api/admin/products", { slug: "test-lettuce-" + Date.now(), nameAr: "خس اختبار", nameEn: "Test lettuce", categoryId: cats.items[0].id, unit: "PIECE", step: 1, minQty: 1, price: 4.5, costPrice: 2, stockQty: 10, tags: ["اختبار"], images: [] });
await call("POST", `/api/admin/products/${p.id}/stock`, { delta: 5, reason: "RECEIVE" });
await call("PATCH", `/api/admin/products/${p.id}`, { price: 5, isFeatured: true });
// orders: find a pending order, confirm → preparing → weights → out → delivered
const orders = await call("GET", "/api/admin/orders?status=PENDING");
let o = orders.items[0];
if (o) {
  o = await call("POST", `/api/admin/orders/${o.id}/status`, { status: "CONFIRMED" });
  o = await call("POST", `/api/admin/orders/${o.id}/status`, { status: "PREPARING" });
  const weighed = o.items.map((i) => ({ itemId: i.id, actualQty: i.soldByActualWeight ? i.qty * 0.9 : i.qty }));
  o = await call("POST", `/api/admin/orders/${o.id}/weights`, { items: weighed });
  console.log("total", o.total, "final", o.finalTotal);
  o = await call("POST", `/api/admin/orders/${o.id}/status`, { status: "OUT_FOR_DELIVERY" });
  o = await call("POST", `/api/admin/orders/${o.id}/status`, { status: "DELIVERED" });
  console.log("payment", o.paymentStatus);
  try { await call("POST", `/api/admin/orders/${o.id}/status`, { status: "PENDING" }); } catch { console.log("invalid transition rejected OK"); }
}
await call("GET", "/api/admin/reports");
const area = await call("POST", "/api/admin/areas", { emirateId: (await call("GET", "/api/admin/emirates")).items[0].id, nameAr: "منطقة اختبار", nameEn: "Test area", deliveryFee: 9, minOrder: 30 });
await call("PATCH", `/api/admin/areas/${area.id}`, { deliveryFee: 11 });
await call("DELETE", `/api/admin/areas/${area.id}`);
const staff = await call("POST", "/api/admin/users", { name: "موظف تجهيز", phone: "0509" + String(Math.floor(Math.random()*1e6)).padStart(6,"0"), role: "OPERATIONS" });
await call("PATCH", "/api/admin/settings", { deliveryPromiseAr: "يصلك طازجًا في موعدك المختار", minOrderAed: 50 });
await call("GET", "/api/admin/audit?q=Product");
// RBAC: operations staff must not access users
let c2 = ""; const r2 = await fetch(B + "/api/admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone: staff.phone, password: staff.tempPassword }) });
c2 = (r2.headers.getSetCookie?.() ?? [])[0]?.split(";")[0] ?? ""; const r3 = await fetch(B + "/api/admin/users", { headers: { cookie: c2 } }); console.log("operations → users:", r3.status, "(expect 403)");
console.log("ADMIN OK");
