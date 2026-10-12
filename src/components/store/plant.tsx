"use client";
/**
 * Live produce: real transparent plant photos split into a foliage layer and a fruit layer.
 * The plant itself is the control — it leans toward the pointer, and a tap rustles the
 * leaves, swings the fruit and splashes water droplets. Glossy dew beads sit on the fruit.
 */
import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { cx } from "@/components/ui/cx";

export type PlantKey = "tomato" | "cucumber" | "strawberry" | "leafy" | "citrus" | "date";

type Meta = { fx: number; fy: number; ftop: number; fruit: boolean; splash: string; beads: [number, number, number][] };
const META: Record<PlantKey, Meta> = {
  tomato:     { fx: 46.5, fy: 53.7, ftop: 24, fruit: true, splash: "255,226,214", beads: [[55.3, 41.6, 1.22], [34.6, 35.5, 0.78], [43.4, 32, 1.22], [56.3, 24.4, 0.65], [20.3, 75.4, 0.74], [69.8, 51.9, 0.99], [69, 43.7, 0.71], [29.5, 65.7, 0.6], [77.3, 50.9, 1.01]] },
  cucumber:   { fx: 52.5, fy: 57.5, ftop: 22, fruit: true, splash: "226,246,232", beads: [[43.9, 66.2, 1.03], [56.3, 17.9, 1.24], [42.2, 56.3, 0.77], [60.8, 61.8, 1.02], [56, 53.8, 1.07], [55.4, 76.3, 0.97], [55.2, 82.1, 1.23], [60.9, 67.1, 1.1], [49.5, 40.5, 0.89]] },
  strawberry: { fx: 55, fy: 70.8, ftop: 52.5, fruit: true, splash: "255,224,228", beads: [[70.5, 84.7, 0.85], [67.5, 75.9, 0.79], [75.5, 87.4, 0.85], [30.2, 84.8, 0.68], [63.1, 54.7, 0.9], [73.3, 75.6, 1.08], [78.5, 53.6, 0.95], [70.3, 91.3, 0.65], [68.8, 55.1, 1.14]] },
  leafy:      { fx: 50, fy: 50, ftop: 50, fruit: false, splash: "226,246,232", beads: [[78.6, 69, 0.74], [83.7, 78.4, 1.09], [46.4, 70.3, 0.78], [33.8, 49.4, 0.68], [51.3, 47.9, 0.78], [74.6, 84.6, 0.84], [48.3, 76, 0.6], [50.8, 27.7, 0.94]] },
  citrus:     { fx: 49.8, fy: 59.1, ftop: 36.5, fruit: true, splash: "255,236,206", beads: [[30.7, 66.7, 1], [66.6, 37, 0.58], [31.3, 59.1, 1.13], [32, 73.4, 0.92], [78.5, 42.2, 1.07], [50, 51.2, 0.72], [62.4, 60.9, 0.68], [43.3, 81, 0.91], [81.1, 36.3, 1.09]] },
  date:       { fx: 43.3, fy: 62, ftop: 38, fruit: true, splash: "255,232,196", beads: [[35.8, 48.6, 1.01], [50.9, 46.1, 0.92], [32.8, 90.4, 0.66], [28.8, 43.1, 0.81], [27.6, 50.1, 0.79], [30.4, 63.6, 1.1], [30.3, 75, 1.1], [38.9, 44, 0.96], [53.1, 51.3, 0.69]] },
};

/** Images in the catalog point at category photos; map them to the matching live plant. */
export function plantKeyFor(url?: string | null): PlantKey | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (/plants\/(tomato|cucumber|strawberry|leafy|citrus|date)/.test(u)) return u.match(/plants\/(\w+)/)![1] as PlantKey;
  if (u.includes("tomato")) return "tomato";
  if (u.includes("cucumber")) return "cucumber";
  if (u.includes("strawberr")) return "strawberry";
  if (u.includes("leafy") || u.includes("herb")) return "leafy";
  if (u.includes("citrus") || u.includes("orange") || u.includes("lemon")) return "citrus";
  if (u.includes("date")) return "date";
  return null;
}

const layer = (k: PlantKey, l: string) => ({ src: `/plants/${k}${l}-sm.webp`, srcSet: `/plants/${k}${l}-sm.webp 400w, /plants/${k}${l}.webp 772w, /plants/${k}${l}@2x.webp 1544w` });

type Splash = { id: number; x: number; y: number; drops: { dx: number; dy: number; s: number; d: number }[] };

export function PlantVisual({ plant, alt, sizes = "(max-width: 768px) 50vw, 22vw", eager, className, size = "md", idle = false }: {
  plant: PlantKey; alt: string; sizes?: string; eager?: boolean; className?: string; size?: "sm" | "md" | "lg"; idle?: boolean;
}) {
  const m = META[plant];
  const ref = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(0);
  const [splashes, setSplashes] = useState<Splash[]>([]);

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2, y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    ref.current.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    ref.current.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
    ref.current.style.setProperty("--lean", x.toFixed(3));
  }, []);
  const onLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.setProperty("--ry", "0deg"); ref.current.style.setProperty("--rx", "0deg"); ref.current.style.setProperty("--lean", "0");
  }, []);
  const onDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const n = Date.now();
    setTouched(n);
    window.setTimeout(() => setTouched((t) => (t === n ? 0 : t)), 2100);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const drops = Array.from({ length: 14 }, () => {
      const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 70;
      return { dx: Math.cos(a) * v, dy: Math.sin(a) * v - 40, s: 4 + Math.random() * 7, d: Math.random() * 120 };
    });
    setSplashes((s) => [...s.slice(-2), { id: n, x: e.clientX - r.left, y: e.clientY - r.top, drops }]);
    window.setTimeout(() => setSplashes((s) => s.filter((x) => x.id !== n)), 1300);
    navigator.vibrate?.(10);
  }, []);

  const style = { "--fx": `${m.fx}%`, "--fy": `${m.fy}%`, "--ftop": `${m.ftop}%`, "--splash": m.splash } as CSSProperties;
  const beads = (
    <span className="plant-beads" aria-hidden>
      {m.beads.map(([x, y, s], i) => <i key={i} style={{ left: `${x}%`, top: `${y}%`, "--s": s, "--i": i } as CSSProperties} />)}
    </span>
  );
  return (
    <div ref={ref} role="img" aria-label={alt} style={style}
      className={cx("plant-live", `plant-${size}`, idle && "is-idle", touched > 0 && "is-touched", className)}
      onPointerMove={onMove} onPointerLeave={onLeave} onPointerDown={onDown}>
      <span className="plant-ground" aria-hidden />
      <div className="plant-3d">
        <div className="plant-leaves">
          <img {...layer(plant, m.fruit ? "-leaves" : "")} sizes={sizes} width={772} height={772} alt="" draggable={false} loading={eager ? "eager" : "lazy"} decoding="async" />
          {!m.fruit && beads}
        </div>
        {m.fruit && (
          <div className="plant-fruit">
            <img {...layer(plant, "-fruit")} sizes={sizes} width={772} height={772} alt="" draggable={false} loading={eager ? "eager" : "lazy"} decoding="async" />
            {beads}
          </div>
        )}
      </div>
      {splashes.map((s) => (
        <span key={s.id} className="plant-splash" style={{ left: s.x, top: s.y }} aria-hidden>
          {s.drops.map((d, i) => <i key={i} style={{ "--dx": `${d.dx}px`, "--dy": `${d.dy}px`, "--sz": `${d.s}px`, animationDelay: `${d.d}ms` } as CSSProperties} />)}
        </span>
      ))}
    </div>
  );
}

/** Any product/category image: a live plant when we have one, otherwise the photo without a hard frame. */
export function ProduceImage({ url, alt, sizes, eager, className, size, variant = "live", idle }: {
  url?: string | null; alt: string; sizes?: string; eager?: boolean; className?: string; size?: "sm" | "md" | "lg"; variant?: "live" | "thumb" | "icon"; idle?: boolean;
}) {
  const key = plantKeyFor(url);
  if (key && (variant === "thumb" || variant === "icon"))
    return <img src={`/plants/${key}-sm.webp`} alt={alt} width={400} height={400} className={cx(variant === "icon" ? "plant-icon" : "plant-thumb", className)} loading={eager ? "eager" : "lazy"} decoding="async" />;
  if (key) return <PlantVisual plant={key} alt={alt} sizes={sizes} eager={eager} className={className} size={size} idle={idle} />;
  if (url) return <img src={url} alt={alt} className={cx("plant-photo", className)} loading={eager ? "eager" : "lazy"} />;
  return <div className={cx("plant-photo bg-mint-100", className)} />;
}
