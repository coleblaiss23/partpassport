"use client";

import { useEffect, useRef } from "react";

function cornerBracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  len: number,
) {
  ctx.beginPath();
  ctx.moveTo(x, y + dy * len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + dx * len, y);
  ctx.stroke();
}

/** One blade, drawn up from the hub. Caller rotates for the other two. */
function propellerBlade(ctx: CanvasRenderingContext2D, R: number) {
  const root = R * 0.18;
  const tip = R * 0.9;
  const rootW = R * 0.1;
  const tipW = R * 0.028;
  ctx.beginPath();
  ctx.moveTo(-rootW * 0.35, root);
  ctx.quadraticCurveTo(-rootW * 1.35, root + (tip - root) * 0.22, -tipW * 1.6, tip * 0.72);
  ctx.quadraticCurveTo(-tipW, tip * 0.94, 0, tip);
  ctx.quadraticCurveTo(tipW * 0.8, tip * 0.93, tipW * 0.9, tip * 0.7);
  ctx.quadraticCurveTo(rootW * 0.85, root + (tip - root) * 0.28, rootW * 0.42, root);
  ctx.closePath();
  ctx.stroke();
}

/**
 * Front-view three-blade propeller. Position is fixed.
 * Rotation comes from scroll only. Still when motion is reduced.
 */
export default function SchematicField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let lastKey = Number.NaN;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastKey = Number.NaN;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const draw = () => {
      if (!running) return;
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      const scroll = reduce ? 0 : window.scrollY;
      const key = scroll + w * 10 + h;
      if (w < 2 || h < 2 || key === lastKey) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastKey = key;
      ctx.clearRect(0, 0, w, h);

      const wide = w > h * 1.05;
      const cx = w * (wide ? 0.68 : 0.5);
      const cy = h * (wide ? 0.5 : 0.34);
      const R = Math.min(w, h) * 0.36;
      const spin = scroll * 0.0022;

      ctx.save();
      ctx.strokeStyle = "rgba(142,138,132,0.07)";
      ctx.lineWidth = 1;
      const step = 56;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);

      ctx.strokeStyle = "rgba(200,194,184,0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "rgba(200,194,184,0.45)";
      const frame = R * 1.16;
      const tick = Math.max(12, R * 0.08);
      cornerBracket(ctx, -frame, -frame, 1, 1, tick);
      cornerBracket(ctx, frame, -frame, -1, 1, tick);
      cornerBracket(ctx, frame, frame, -1, -1, tick);
      cornerBracket(ctx, -frame, frame, 1, -1, tick);

      ctx.save();
      ctx.rotate(spin);
      ctx.strokeStyle = "rgba(244,241,234,0.92)";
      ctx.lineWidth = 1.35;
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3);
        propellerBlade(ctx, R);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(0, 0, R * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.11, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * R * 0.155, Math.sin(a) * R * 0.155, Math.max(2.2, R * 0.022), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.035, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.font = "500 11px 'JetBrains Mono', ui-monospace, monospace";
      ctx.fillStyle = "rgba(200,194,184,0.8)";
      ctx.fillText("HUB", R * 0.24, -R * 0.02);
      ctx.fillText("TIP ARC", R * 0.55, -R * 0.78);

      ctx.restore();

      ctx.font = "500 11px 'JetBrains Mono', ui-monospace, monospace";
      ctx.fillStyle = "rgba(141,135,126,0.9)";
      ctx.fillText("PROP  ·  3 BLADE", 28, h - 18);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />;
}
