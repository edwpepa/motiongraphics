import React from "react";
import { AbsoluteFill } from "remotion";
import { CanvasScene, H, Logo, W, clamp01, ease, flare, glow, hash, lerp, mulberry, rng01, useT, w } from "./kit";

/** drifting fog: a few big soft blobs */
export function fog(ctx: CanvasRenderingContext2D, T: number, a: number, y0 = H * 0.55) {
  for (let i = 0; i < 7; i++) {
    const x = ((i * 410 + T * (14 + i * 5)) % 2400) - 240;
    const y = y0 + Math.sin(i * 1.7 + T * 0.2) * 90;
    const r = 380 + 120 * hash(i);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.38);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(150,155,165,${0.07 * a})`);
    g.addColorStop(1, "rgba(150,155,165,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.restore();
  }
}

/** a searchlight beam from (x, y) at angle `ang` (0 = straight up) */
export function beam(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, spread: number, a: number) {
  if (a <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, 0, 0, -len);
  g.addColorStop(0, `rgba(235,238,245,${0.32 * a})`);
  g.addColorStop(1, "rgba(235,238,245,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.lineTo(len * spread, -len);
  ctx.lineTo(-len * spread, -len);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

let SHARDS: { a: number; e: number; v: number; s: number; ph: number }[] | null = null;
/** the burst behind the logo: a flash and embers flung outwards, slowing down */
export function burst(ctx: CanvasRenderingContext2D, x: number, y: number, T: number, at: number) {
  if (T < at) return;
  const age = T - at;
  SHARDS ??= (() => {
    const r = mulberry(77);
    return Array.from({ length: 260 }, () => ({ a: r() * Math.PI * 2, e: (r() - 0.5) * 0.9, v: 0.35 + r() * 1.0, s: 0.6 + r() * 1.8, ph: r() * 10 }));
  })();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const k = Math.exp(-age / 0.45);
  flare(ctx, x, y, k * 0.9, 1500, 120);
  glow(ctx, x, y, 520, 0.22 * Math.exp(-age / 1.2));
  for (const p of SHARDS) {
    const dist = p.v * 760 * (1 - Math.exp(-age * 2.4)) + age * 22;
    const px = x + Math.cos(p.a) * dist, py = y + Math.sin(p.a) * dist * 0.55 + p.e * dist * 0.3 + age * age * 18;
    const fl = 0.55 + 0.45 * Math.sin(T * 11 + p.ph * 5);
    const a = fl * Math.exp(-age / 1.6) * clamp01(age * 10);
    glow(ctx, px, py, 6 * p.s, a);
  }
  ctx.restore();
}

let PEOPLE: { sx: number; sy: number; tx: number; ty: number; d: number }[] | null = null;
const ROOF = { cx: W / 2, base: 700, half: 330, peak: 395, eave: 525 };
function people() {
  if (PEOPLE) return PEOPLE;
  const r = mulberry(17);
  const out = [];
  const cols = 15, rows = 5;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = r() * Math.PI * 2, d = 900 + r() * 500;
      out.push({ sx: W / 2 + Math.cos(a) * d, sy: 640 + Math.sin(a) * d * 0.7, tx: ROOF.cx + (i - (cols - 1) / 2) * 38, ty: ROOF.base - 18 - j * 34 + (j % 2) * 0, d: r() });
    }
  PEOPLE = out;
  return out;
}

/** 29.4 – 36.7 s: silence, beams in the fog, BRAAM — "At EDW ENTERPRISE, we decided to bring those people together under one roof." */
export const LogoScene: React.FC<{ from: number; to: number; roofOnly?: boolean }> = ({ from, to, roofOnly }) => {
  const T = useT();
  const R = w("edw", 0) - 0.02;
  const reveal = rng01(T, R, R + 0.55, ease.outCubic);
  const up = rng01(T, w("roof", 0) - 0.35, w("roof", 0) + 0.45, ease.inOut);
  const sweep = rng01(T, R + 0.1, R + 1.5, ease.inOut);
  const out = rng01(T, to - 0.3, to, ease.inCubic);
  const scale = lerp(1.06, 1.0, ease.outCubic((T - R) / 3));
  return (
    <AbsoluteFill>
      <CanvasScene
        draw={(ctx, T) => {
          const t = T - from;
          // before the hit: two beams search the fog
          const pre = rng01(t, 0.2, 1.2) * (1 - reveal);
          const post = reveal * (1 - up * 0.6);
          ctx.globalCompositeOperation = "lighter";
          fog(ctx, T, 0.6 + 0.8 * post, H * 0.62);
          if (!roofOnly) {
          for (const s of [-1, 1]) {
            const ang = s * (0.42 - 0.3 * ease.inOut(t / 2.4)) + Math.sin(T * 0.9 + s) * 0.06;
            const outw = ease.inOutSine(clamp01((T - R) / 2.6));
            beam(ctx, W / 2 + s * lerp(520, 760, outw), H + 20, ang * (1 - reveal) + s * (0.08 + 0.72 * outw) * reveal, 1700, 0.09, pre * 0.9 + post * 0.45 * (1 - outw));
          }
          // the slit of light that opens into the logo
          const slit = rng01(T, R - 0.55, R, ease.inCubic) * (1 - reveal);
          if (slit > 0) {
            ctx.fillStyle = `rgba(255,255,255,${slit})`;
            ctx.fillRect(W / 2 - 900 * slit, H / 2 - 1, 1800 * slit, 2);
            glow(ctx, W / 2, H / 2, 200 * slit, slit * 0.6);
          }
          if (T >= R) {
            const k = Math.exp(-(T - R) / 0.35);
            burst(ctx, W / 2, H / 2 - 10, T, R);
            ctx.fillStyle = `rgba(255,255,255,${0.08 * Math.exp(-(T - R) / 0.2)})`;
            ctx.fillRect(0, 0, W, H);
          }
          // dust in the light
          for (let i = 0; i < 90; i++) {
            const x = (hash(i) * W + T * 8 * (hash(i + 3) - 0.5) * 6 + W) % W;
            const y = (hash(i + 1.7) * H - T * 12 * hash(i + 9) + H * 4) % H;
            glow(ctx, x, y, 3 + 3 * hash(i + 5), 0.35 * (pre + post) * (0.5 + 0.5 * Math.sin(T * 2 + i)));
          }
          }
          ctx.globalCompositeOperation = "source-over";
          // the people, gathering under one roof
          if (up > 0) {
            const gStart = w("roof", 2), gEnd = w("roof", 6) + 0.2;
            for (const p of people()) {
              const u = rng01(T, gStart + p.d * 0.6, gEnd + p.d * 0.4, ease.inOut);
              const x = lerp(p.sx, p.tx, u), y = lerp(p.sy, p.ty, u) + Math.sin(T * 2 + p.d * 9) * 3 * (1 - u);
              const a = clamp01(u * 3);
              ctx.globalCompositeOperation = "lighter";
              glow(ctx, x, y, 16, 0.25 * a);
              ctx.globalCompositeOperation = "source-over";
              ctx.fillStyle = `rgba(240,242,248,${a})`;
              ctx.beginPath();
              ctx.arc(x, y, 5, 0, Math.PI * 2);
              ctx.fill();
            }
            // the roof draws over them on "one roof"
            const rf = rng01(T, w("roof", 8) - 0.15, w("roof", 9) + 0.5, ease.outCubic);
            const base = rng01(T, w("roof", 7), w("roof", 9) + 0.3, ease.outCubic);
            ctx.strokeStyle = "rgba(245,247,252,0.95)";
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            const { cx, base: by, half, peak, eave } = ROOF;
            if (rf > 0) {
              ctx.beginPath();
              const L = rf;
              // left slope then right slope, drawn outward from the peak
              ctx.moveTo(cx, peak);
              ctx.lineTo(lerp(cx, cx - half - 50, L), lerp(peak, eave, L));
              ctx.moveTo(cx, peak);
              ctx.lineTo(lerp(cx, cx + half + 50, L), lerp(peak, eave, L));
              ctx.stroke();
              ctx.globalCompositeOperation = "lighter";
              glow(ctx, cx, peak, 60, 0.6 * (1 - rf) + 0.15);
              ctx.globalCompositeOperation = "source-over";
            }
            if (base > 0) {
              ctx.strokeStyle = "rgba(245,247,252,0.5)";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(cx - (half + 10) * base, by + 12);
              ctx.lineTo(cx + (half + 10) * base, by + 12);
              ctx.stroke();
            }
          }
          if (out > 0) {
            ctx.fillStyle = `rgba(0,0,0,${out})`;
            ctx.fillRect(0, 0, W, H);
          }
        }}
      />
      {!roofOnly && T >= R - 0.05 && (
        <div
          style={{
            position: "absolute",
            left: W / 2,
            top: H / 2 - 10,
            transform: `translate(-50%, -50%) scale(${scale})`,
            filter: `blur(${(1 - reveal) * 10 + up * 8}px)`,
            opacity: reveal * (1 - out) * (1 - up),
          }}
        >
          <Logo width={380} sweep={sweep} />
        </div>
      )}
    </AbsoluteFill>
  );
};
