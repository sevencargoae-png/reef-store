import { readFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.resolve(process.env.STORAGE_LOCAL_DIR ?? "./storage");
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Serves uploaded images from the storage directory (path-traversal safe, immutable caching). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const rel = parts.join("/");
  const abs = path.resolve(DIR, rel);
  if (!abs.startsWith(DIR + path.sep)) return new Response("Not found", { status: 404 });
  const ext = abs.split(".").pop() ?? "";
  if (!MIME[ext]) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(abs);
    return new Response(new Uint8Array(buf), { headers: { "content-type": MIME[ext], "cache-control": "public, max-age=31536000, immutable" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
