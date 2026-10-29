import React, { useMemo } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { BEATS, DROP, F } from "../timeline";
import { OUTFIT } from "../tv/font";

// ------------------------------------------------------------------ the launch-ad language: soft light stage, centered type, green paint, sparkles, photos in masks
export const GREEN = "#00bf63";
export const GREEN2 = "#2fd88a";
export const INK = "#1d1d1f";
export const D0 = F(DROP);
/** frame of beat k (k can be negative: the grid runs back into the story too) */
export const bt = (k: number) => Math.round(D0 + k * BEATS);
/** nearest beat to a frame */
export const snap = (f: number) => bt(Math.round((f - D0) / BEATS));
/** beat pulse: 1 on each beat, decaying */
export const beatPulse = (f: number, len = 7) => {
  const k = Math.floor((f - D0) / BEATS);
  const t = (f - (D0 + k * BEATS)) / len;
  return t >= 0 && t < 1 ? (1 - t) ** 2 : 0;
};

export const clampE = clamp01;
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const outQuart = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
export const inOut = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2;
};
export const io3 = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const r01 = (f: number, a: number, b: number, fn: (t: number) => number = inOut) => fn(clamp01((f - a) / (b - a)));
/** iOS-like spring 0→1 (slight overshoot, settles) */
export const spring = (t: number, k = 1) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.exp(-6.5 * t) * Math.cos(t * Math.PI * 2.2 * k);
};

// ------------------------------------------------------------------ stages
export const LightBg: React.FC<{ tint?: number }> = ({ tint = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#f3f5f8" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 55% at ${50 + Math.sin(f / 120) * 6}% ${40 + Math.cos(f / 140) * 5}%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%), radial-gradient(ellipse 50% 50% at 85% 90%, rgba(0,191,99,${0.07 * tint}) 0%, rgba(0,191,99,0) 70%), radial-gradient(ellipse 45% 45% at 10% 15%, rgba(120,160,255,${0.06 * tint}) 0%, rgba(0,0,0,0) 70%)` }} />
    </AbsoluteFill>
  );
};
export const DarkBg: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#030605" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 55% at ${50 + Math.sin(f / 110) * 8}% ${45 + Math.cos(f / 130) * 6}%, rgba(0,191,99,${0.16 * glow}) 0%, rgba(0,60,30,${0.12 * glow}) 40%, rgba(0,0,0,0) 75%)` }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", opacity: 0.05, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ centered type, the reference's way: words resolve out of blur one by one, the line re-centres as it grows
let CTX: CanvasRenderingContext2D | null = null;
const measure = (t: string, size: number, weight: number) => {
  if (!CTX) CTX = document.createElement("canvas").getContext("2d");
  if (!CTX) return t.length * size * 0.5;
  CTX.font = `${weight} ${size}px Outfit`;
  return CTX.measureText(t).width - t.length * size * 0.02;
};
export type Tok = { t: string; at: number; accent?: boolean; logo?: boolean; strike?: number; color?: string };
export const RefText: React.FC<{ toks: Tok[]; size?: number; y?: number; x?: number; color?: string; out?: number; weight?: number; dur?: number; align?: "center" | "left" }> = ({ toks, size = 78, y = 540, x = 960, color = INK, out, weight = 500, dur = 16, align = "center" }) => {
  const f = useCurrentFrame();
  const gap = size * 0.26;
  const ws = useMemo(() => toks.map((k) => (k.logo ? size * 0.95 : measure(k.t, size, weight))), [toks, size, weight]);
  if (!toks.length || f < toks[0].at - 1) return null;
  const p = toks.map((k) => outExpo(clamp01((f - k.at) / dur)));
  const space = toks.map((k, i) => ws[i] * io3(clamp01((f - k.at + 2) / (dur * 0.8))));
  const total = space.reduce((s, w, i) => s + w + (i > 0 && space[i] > 0 ? gap * Math.min(1, space[i] / ws[i]) : 0), 0);
  let cx = align === "center" ? x - total / 2 : x;
  const q = out === undefined ? 0 : r01(f, out, out + 12, (u) => u * u);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
      {toks.map((k, i) => {
        const left = cx + (i > 0 && space[i] > 0 ? gap * Math.min(1, space[i] / ws[i]) : 0);
        cx = left + space[i];
        if (p[i] <= 0) return null;
        const blur = (1 - p[i]) * 14 + q * 16;
        const style: React.CSSProperties = { position: "absolute", left, top: y - size * 0.62, height: size * 1.25, display: "flex", alignItems: "center", whiteSpace: "nowrap", fontFamily: OUTFIT, fontWeight: weight, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1, color: k.color ?? color, opacity: p[i] * (1 - q), filter: blur > 0.2 ? `blur(${blur}px)` : undefined, transform: `translateY(${(1 - p[i]) * size * 0.18 - q * size * 0.12}px) scale(${1 + (1 - p[i]) * 0.04})` };
        if (k.logo)
          return (
            <div key={i} style={style}>
              <Img src={staticFile("images/logo.webp")} style={{ width: size * 0.95, height: size * 0.95 }} />
            </div>
          );
        return (
          <div key={i} style={style}>
            <span style={k.accent ? { backgroundImage: `linear-gradient(90deg, ${GREEN} 0%, ${GREEN2} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", paddingRight: 2 } : undefined}>{k.t}</span>
            {k.strike !== undefined && k.strike > 0 && <span style={{ position: "absolute", left: -4, top: "54%", height: size * 0.07, width: `calc(${k.strike * 100}% + 8px)`, background: "#ff453a", borderRadius: size * 0.04 }} />}
          </div>
        );
      })}
    </div>
  );
};
/** words with their own timing */
export const toksOf = (text: string, at: number, gap = 4, accent: number[] = []): Tok[] => text.split(" ").map((t, i) => ({ t, at: at + i * gap, accent: accent.includes(i) }));

// ------------------------------------------------------------------ paint: an organic splash with tendrils and droplets
const splashPath = (seed: number, _R: number, spikes = 6) => {
  const N = 220;
  const sp = Array.from({ length: spikes }, (_, i) => ({ a: (i / spikes) * Math.PI * 2 + (seeded(i, seed) - 0.5) * 0.8, w: 0.1 + seeded(i, seed + 1) * 0.08, l: 0.12 + seeded(i, seed + 2) * 0.26 }));
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    let r = 1 + 0.05 * Math.sin(a * 3 + seed) + 0.035 * Math.sin(a * 5 + seed * 2) + 0.018 * Math.sin(a * 9 + seed * 3);
    for (const s2 of sp) {
      let d = Math.abs(a - s2.a);
      d = Math.min(d, Math.PI * 2 - d);
      if (d < s2.w) r += s2.l * Math.pow(Math.cos((Math.PI / 2) * (d / s2.w)), 3);
    }
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  // Catmull-Rom → cubic Béziers: a liquid outline with no corners
  let d = `M${pts[0][0].toFixed(4)},${pts[0][1].toFixed(4)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(4)},${c1[1].toFixed(4)} ${c2[0].toFixed(4)},${c2[1].toFixed(4)} ${p2[0].toFixed(4)},${p2[1].toFixed(4)}`;
  }
  return { d: d + " Z", sp };
};
/** t: 0 → 1 the splash bursts out; R: its final size; at full frame cover use R ≥ 1300 */
export const Splash: React.FC<{ x: number; y: number; t: number; R: number; color?: string; seed?: number; light?: string; drops?: number; rot?: number; opacity?: number }> = ({ x, y, t, R, color = GREEN, seed = 3, light = GREEN2, drops = 14, rot = 0, opacity = 1 }) => {
  const shape = useMemo(() => splashPath(seed, 1, 9), [seed]);
  if (t <= 0) return null;
  const e = outExpo(t);
  const s = R * e;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity }}>
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
        <path d={shape.d} fill={color} />
        {shape.sp.map((q, i) => (
          <circle key={i} cx={Math.cos(q.a) * (1 + q.l + 0.09)} cy={Math.sin(q.a) * (1 + q.l + 0.09)} r={0.035 + q.w * 0.25} fill={color} />
        ))}
        {R < 1000 && <path d={shape.d} fill={light} opacity={0.3} transform="translate(-0.05 -0.06) scale(0.8)" />}
        {R < 1000 && <ellipse cx={-0.35} cy={-0.42} rx={0.22} ry={0.1} transform="rotate(-30 -0.35 -0.42)" fill="#fff" opacity={0.22} />}
      </g>
      {Array.from({ length: drops }, (_, i) => {
        const a = seeded(i, seed + 9) * Math.PI * 2;
        const dist = R * (1.1 + seeded(i, seed + 4) * 0.8) * outExpo(t * 1.1);
        const r = R * (0.012 + seeded(i, seed + 5) * 0.035) * (1 - 0.3 * t);
        return <circle key={i} cx={x + Math.cos(a) * dist} cy={y + Math.sin(a) * dist} r={Math.max(0, r)} fill={color} />;
      })}
    </svg>
  );
};

// ------------------------------------------------------------------ the four-point sparkle
export const Sparkle: React.FC<{ x: number; y: number; size: number; t?: number; rot?: number; color?: string; color2?: string; opacity?: number }> = ({ x, y, size, t = 1, rot = 0, color = GREEN, color2 = GREEN2, opacity = 1 }) => {
  const id = useMemo(() => `spk${Math.round(seeded(x * 7 + y, 3) * 1e6)}`, [x, y]);
  if (t <= 0) return null;
  const s = size * outExpo(t);
  return (
    <svg width={s * 2} height={s * 2} viewBox="-1 -1 2 2" style={{ position: "absolute", left: x - s, top: y - s, transform: `rotate(${rot}deg)`, overflow: "visible", opacity, filter: `drop-shadow(0 ${s * 0.12}px ${s * 0.3}px rgba(0,191,99,0.35))` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color2} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <path d="M0 -1 C0.08 -0.18 0.18 -0.08 1 0 C0.18 0.08 0.08 0.18 0 1 C-0.08 0.18 -0.18 0.08 -1 0 C-0.18 -0.08 -0.08 -0.18 0 -1 Z" fill={`url(#${id})`} />
    </svg>
  );
};

// ------------------------------------------------------------------ confetti for a "done"
export const Confetti: React.FC<{ at: number; x?: number; y?: number; n?: number; colors?: string[] }> = ({ at, x = 960, y = 540, n = 46, colors = [GREEN, GREEN2, "#0f7a45", "#bff5d8", "#ffffff"] }) => {
  const f = useCurrentFrame();
  const t = (f - at) / 30;
  if (t < 0 || t > 2.2) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = seeded(i, 21) * Math.PI * 2;
        const v = 500 + seeded(i, 22) * 700;
        const px = x + Math.cos(a) * v * outExpo(t * 0.9) * 0.9;
        const py = y + Math.sin(a) * v * outExpo(t * 0.9) * 0.6 + 260 * t * t;
        const w = 18 + seeded(i, 23) * 26, h = w * (0.35 + seeded(i, 24) * 0.4);
        return <div key={i} style={{ position: "absolute", left: px, top: py, width: w, height: h, borderRadius: 4, background: colors[i % colors.length], transform: `rotate(${seeded(i, 25) * 360 + t * 500 * (seeded(i, 26) - 0.5)}deg) rotateX(${t * 700 * seeded(i, 27)}deg)`, opacity: clamp01((2.2 - t) / 0.6), boxShadow: colors[i % colors.length] === "#ffffff" ? "0 2px 6px rgba(0,0,0,0.15)" : undefined }} />;
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ a photo in a mask: it opens out of a shape, drifts, and closes again
export type MaskKind = "circle" | "pill" | "wipe" | "card";
export const PhotoMask: React.FC<{ src: string; x: number; y: number; w: number; h: number; inAt: number; outAt?: number; kind?: MaskKind; radius?: number; tilt?: number; caption?: React.ReactNode; border?: boolean }> = ({ src, x, y, w, h, inAt, outAt, kind = "card", radius = 36, tilt = 0, caption, border = true }) => {
  const f = useCurrentFrame();
  const a = r01(f, inAt, inAt + 22, io3);
  const b = outAt === undefined ? 0 : r01(f, outAt, outAt + 16, io3);
  if (a <= 0 || b >= 1) return null;
  const k = a * (1 - b);
  let clip = "";
  if (kind === "circle") clip = `circle(${lerp(0, 75, k)}% at 50% 50%)`;
  else if (kind === "wipe") clip = `inset(0 ${lerp(100, 0, a)}% 0 ${lerp(0, 100, b)}% round ${radius}px)`;
  else if (kind === "pill") clip = `inset(${lerp(50, 0, k)}% ${lerp(30, 0, k)}% round ${lerp(h / 2, radius, k)}px)`;
  else clip = `inset(${lerp(18, 0, k)}% ${lerp(18, 0, k)}% round ${radius}px)`;
  const drift = (f - inAt) * 0.25;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2 - drift * 0.3, width: w, height: h, transform: `perspective(1600px) rotateY(${tilt + Math.sin(f / 40) * 3}deg) rotateX(${Math.cos(f / 50) * 2}deg) scale(${0.92 + 0.08 * k})`, filter: `drop-shadow(0 30px 50px rgba(20,40,30,${0.25 * k}))` }}>
      <div style={{ position: "absolute", inset: 0, clipPath: clip, WebkitClipPath: clip, borderRadius: radius, overflow: "hidden", background: "#fff", boxShadow: border ? "inset 0 0 0 6px #fff" : undefined }}>
        <Img src={staticFile(src)} style={{ position: "absolute", inset: border ? 6 : 0, width: border ? w - 12 : w, height: border ? h - 12 : h, objectFit: "cover", borderRadius: radius - 6, transform: `scale(${1.25 - 0.18 * a + 0.0008 * (f - inAt)})`, filter: b > 0 ? `blur(${b * 10}px)` : undefined }} />
        {caption}
      </div>
    </div>
  );
};
