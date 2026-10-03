import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import WORDS from "./vo-words.json";

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const END = 70;
export const BAR_H = 96;
export const FONT = "Inter, sans-serif";
export const MONO = "'Liberation Mono', 'DejaVu Sans Mono', monospace";

type Phrase = { start: number; end: number; text: string; words: [string, number][] };
export const VO = WORDS as unknown as Record<string, Phrase>;
export const ORDER = Object.keys(VO);
/** onset (s) of word i of phrase `key` */
export const w = (key: string, i = 0) => VO[key].words[Math.min(i, VO[key].words.length - 1)][1];
export const ph = (key: string) => VO[key];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - clamp01(t), 3),
  outQuint: (t: number) => 1 - Math.pow(1 - clamp01(t), 5),
  outExpo: (t: number) => (t >= 1 ? 1 : t <= 0 ? 0 : 1 - Math.pow(2, -10 * t)),
  inCubic: (t: number) => Math.pow(clamp01(t), 3),
  inOut: (t: number) => {
    t = clamp01(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  inOutSine: (t: number) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2,
};
/** 0→1 over [a, b] seconds with an easing */
export const rng01 = (t: number, a: number, b: number, fn: (x: number) => number = ease.inOut) => fn(clamp01((t - a) / (b - a)));

export const useT = () => useCurrentFrame() / FPS;

// ------------------------------------------------------------------ deterministic noise
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const h3 = (x: number, y: number, z: number) => hash(x * 157.31 + y * 113.97 + z * 271.13);
const sm = (t: number) => t * t * (3 - 2 * t);
export function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
  let v = 0;
  for (let dx = 0; dx < 2; dx++)
    for (let dy = 0; dy < 2; dy++)
      for (let dz = 0; dz < 2; dz++) {
        const w0 = (dx ? xf : 1 - xf) * (dy ? yf : 1 - yf) * (dz ? zf : 1 - zf);
        v += w0 * h3(xi + dx, yi + dy, zi + dz);
      }
  return v;
}
export const fbm = (x: number, y: number, z: number) => noise3(x, y, z) * 0.6 + noise3(x * 2.1, y * 2.1, z * 2.1) * 0.3 + noise3(x * 4.3, y * 4.3, z * 4.3) * 0.1;

// ------------------------------------------------------------------ 3D
export type V3 = [number, number, number];
export const rotY = (p: V3, a: number): V3 => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
export const rotX = (p: V3, a: number): V3 => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
export const rotZ = (p: V3, a: number): V3 => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
/** perspective projection: camera at z = -dist looking +z, y up */
export const proj = (p: V3, scale: number, dist: number, cx = W / 2, cy = H / 2) => {
  const k = dist / (dist + p[2]);
  return { x: cx + p[0] * scale * k, y: cy - p[1] * scale * k, k, z: p[2] };
};

// ------------------------------------------------------------------ canvas scene: the draw function is called synchronously every frame
export const CanvasScene: React.FC<{ draw: (ctx: CanvasRenderingContext2D, t: number) => void; style?: React.CSSProperties }> = ({ draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const t = useT();
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.clearRect(0, 0, W, H);
    draw(ctx, t);
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H, ...style }} />;
};

/** soft round light */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, core = "255,255,255") {
  if (a <= 0.002 || r <= 0.5) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${core},${a})`);
  g.addColorStop(0.25, `rgba(${core},${a * 0.45})`);
  g.addColorStop(1, `rgba(${core},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
/** anamorphic lens flare: a long thin horizontal streak through a bright core */
export function flare(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len = 900, core = 60) {
  if (a <= 0.002) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, x, y, core * 3, a * 0.5);
  glow(ctx, x, y, core, a);
  ctx.translate(x, y);
  ctx.scale(1, 0.018);
  glow(ctx, 0, 0, len, a * 0.9, "225,232,255");
  ctx.restore();
}

// ------------------------------------------------------------------ the cinematic finish: grain, vignette, letterbox
export const Grade: React.FC<{ bars?: number }> = ({ bars = 1 }) => {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / 2);
  const gx = Math.floor(hash(k) * 512), gy = Math.floor(hash(k + 7.3) * 512);
  const bh = BAR_H * bars;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 80% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", backgroundPosition: `${gx}px ${gy}px`, opacity: 0.06, mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bh, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bh, background: "#000" }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ subtitles: small, centred above the lower bar, word by word
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const Captions: React.FC<{ hide?: string[]; mute?: [number, number][] }> = ({ hide = [], mute = [] }) => {
  const t = useT();
  const quiet = mute.reduce((m, [a, b]) => Math.max(m, clamp01((t - a) / 0.15) * clamp01((b - t) / 0.2)), 0);
  if (quiet >= 1) return null;
  let cur: string | null = null;
  for (let i = 0; i < ORDER.length; i++) {
    const k = ORDER[i];
    const p = VO[k];
    const next = ORDER[i + 1] ? VO[ORDER[i + 1]].start : 99;
    if (t >= p.start - 0.12 && t < Math.min(next - 0.12, p.end + 0.7)) cur = k;
  }
  if (!cur || hide.includes(cur)) return null;
  const p = VO[cur];
  const next = ORDER[ORDER.indexOf(cur) + 1];
  const outAt = Math.min(next ? VO[next].start - 0.12 : 99, p.end + 0.7);
  const o = clamp01((t - (p.start - 0.12)) / 0.15) * clamp01((outAt - t) / 0.15);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: BAR_H + 46, display: "flex", justifyContent: "center", opacity: o * (1 - quiet) }}>
      <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 36, letterSpacing: "0.01em", color: "#f2f2f2", textShadow: "0 2px 14px rgba(0,0,0,0.9)", whiteSpace: "nowrap" }}>
        {p.words.map(([word, at], i) => {
          const a = clamp01((t - at + 0.06) / 0.16);
          return (
            <span key={i} style={{ opacity: 0.22 + 0.78 * a, display: "inline-block", marginRight: 11, filter: `blur(${(1 - a) * 3}px)` }}>
              {i === 0 ? cap(word) : word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** big cinematic line: letters arrive out of a blur with the tracking settling */
export const Hero: React.FC<{ text: string; at: number; out: number; size?: number; y?: number; weight?: number; color?: string; tracking?: number }> = ({
  text,
  at,
  out,
  size = 120,
  y = H / 2,
  weight = 800,
  color = "#f5f5f5",
  tracking = 0.18,
}) => {
  const t = useT();
  if (t < at - 0.1 || t > out + 0.5) return null;
  const o = clamp01((out + 0.4 - t) / 0.4);
  const settle = ease.outExpo((t - at) / 1.6);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, color, letterSpacing: `${tracking + 0.25 * (1 - settle)}em`, whiteSpace: "nowrap", marginRight: `-${tracking}em` }}>
        {text.split("").map((ch, i) => {
          const a = ease.outCubic((t - at - i * 0.035) / 0.5);
          return (
            <span key={i} style={{ opacity: a, filter: `blur(${(1 - a) * 14}px)`, display: "inline-block", whiteSpace: "pre" }}>
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** the logo, white, with a light sweep travelling across it */
export const Logo: React.FC<{ width: number; sweep?: number; opacity?: number; white?: boolean; style?: React.CSSProperties }> = ({ width, sweep = -1, opacity = 1, white, style }) => {
  const src = staticFile("images/edw-logo.png");
  const h = (width * 650) / 1792;
  const sx = -30 + 160 * sweep;
  return (
    <div style={{ position: "relative", width, height: h, opacity, ...style }}>
      <Img src={src} style={{ position: "absolute", inset: 0, width, height: h, filter: white ? "brightness(0) invert(1)" : "brightness(0.82) contrast(1.05)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "100% 100%",
          maskImage: `url(${src})`,
          maskSize: "100% 100%",
          background: `linear-gradient(105deg, rgba(255,255,255,0) ${sx - 18}%, rgba(255,255,255,1) ${sx}%, rgba(255,255,255,0) ${sx + 18}%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};

/** the small mark that lives in the top-left corner, hidden only while the logo itself is centre stage */
export const CornerLogo: React.FC = () => {
  const t = useT();
  const R = w("edw", 0);
  const o =
    rng01(t, 1.2, 2.4, ease.inOutSine) *
    (1 - rng01(t, 28.9, 29.4, ease.inOutSine)) +
    rng01(t, w("roof", 0) + 0.5, w("roof", 0) + 1.3, ease.inOutSine) * (1 - rng01(t, w("yours", 0) - 1.0, w("yours", 0) - 0.3, ease.inOutSine));
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 64, top: BAR_H + 36, opacity: o }}>
      <Logo width={104} white />
    </div>
  );
};
