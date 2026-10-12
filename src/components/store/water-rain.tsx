"use client";
/** A light mist of water drops falling across the plants, like a fresh rinse in the morning sun. */
import { useEffect, useRef } from "react";

type Drop = { x: number; y: number; vy: number; len: number; w: number; stop: number; a: number };
type Ring = { x: number; y: number; r: number; a: number };

export function WaterRain({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const g = c.getContext("2d"); if (!g) return;
    let w = 0, h = 0, raf = 0, running = true, last = 0;
    const drops: Drop[] = []; const rings: Ring[] = [];
    const resize = () => {
      const touch = matchMedia("(hover: none)").matches;
      const dpr = touch ? 1 : Math.min(window.devicePixelRatio || 1, 2), r = c.getBoundingClientRect();
      w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (): Drop => ({
      x: Math.random() * w, y: -20 - Math.random() * h * 0.3, vy: 3.2 + Math.random() * 3.5,
      len: 10 + Math.random() * 16, w: 1.2 + Math.random() * 1.6, stop: h * (0.35 + Math.random() * 0.55), a: 0.35 + Math.random() * 0.45,
    });
    resize();
    const target = Math.round((w / 1400) * 22 * density) + 4;
    const frame = (t: number) => {
      if (!running) return;
      const dt = Math.min(2, (t - (last || t)) / 16.7); last = t;
      g.clearRect(0, 0, w, h);
      while (drops.length < target) drops.push(spawn());
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.y += d.vy * dt; d.vy += 0.05 * dt;
        if (d.y >= d.stop) { rings.push({ x: d.x, y: d.stop, r: 1, a: 0.55 }); drops.splice(i, 1); continue; }
        const grad = g.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, `rgba(255,255,255,${d.a})`);
        g.strokeStyle = grad; g.lineWidth = d.w; g.lineCap = "round";
        g.beginPath(); g.moveTo(d.x, d.y - d.len); g.lineTo(d.x, d.y); g.stroke();
        // glossy head
        g.fillStyle = `rgba(255,255,255,${Math.min(1, d.a + 0.25)})`;
        g.beginPath(); g.ellipse(d.x, d.y, d.w * 1.2, d.w * 1.7, 0, 0, Math.PI * 2); g.fill();
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; r.r += 0.7 * dt; r.a -= 0.025 * dt;
        if (r.a <= 0) { rings.splice(i, 1); continue; }
        g.strokeStyle = `rgba(255,255,255,${r.a})`; g.lineWidth = 1.2;
        g.beginPath(); g.ellipse(r.x, r.y, r.r * 1.8, r.r * 0.6, 0, 0, Math.PI * 2); g.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) { last = 0; raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf);
    });
    io.observe(c);
    window.addEventListener("resize", resize);
    return () => { running = false; cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", resize); };
  }, [density]);
  return <canvas ref={ref} className="water-rain" aria-hidden />;
}
