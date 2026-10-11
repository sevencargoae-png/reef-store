import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fail, handler, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth/session";

const DIR = process.env.STORAGE_LOCAL_DIR ?? "./storage";
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX = 5 * 1024 * 1024;

/** Stores product/category images under STORAGE_LOCAL_DIR/uploads and returns a /files/... URL served by app/files/[...path]. */
export const POST = handler(async (req) => {
  await requireStaff("catalog.write");
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(422, "VALIDATION", "file required");
  const ext = TYPES[file.type];
  if (!ext) return fail(422, "VALIDATION", "unsupported type");
  if (file.size > MAX) return fail(422, "VALIDATION", "too large");
  const buf = Buffer.from(await file.arrayBuffer());
  // magic-byte check so a renamed script cannot be stored as an image
  const magic = buf.subarray(0, 4).toString("hex");
  const okMagic = (ext === "jpg" && magic.startsWith("ffd8")) || (ext === "png" && magic === "89504e47") || (ext === "webp" && buf.subarray(8, 12).toString() === "WEBP");
  if (!okMagic) return fail(422, "VALIDATION", "corrupt image");
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  await mkdir(path.join(DIR, "uploads"), { recursive: true });
  await writeFile(path.join(DIR, "uploads", name), buf);
  return ok({ url: `/files/uploads/${name}` }, { status: 201 });
});
