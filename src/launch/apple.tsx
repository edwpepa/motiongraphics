import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp01, lerp } from "../explainer/lib/anim";
import { FONT } from "../explainer/theme";

// ------------------------------------------------------------------ Apple-keynote motion kit for the launch film's story
export const INK = "#1d1d1f";
export const INK2 = "#86868b";
export const GREEN = "#00bf63";
export const MINT = "#5df0a5";

export const outQuart = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
export const inOutQuint = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2;
};
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const r01 = (f: number, a: number, b: number, fn: (t: number) => number = inOutQuint) => fn(clamp01((f - a) / (b - a)));

export { iw, iEnd, iWords } from "./introTimes";

// ------------------------------------------------------------------ backgrounds
/** white keynote stage: soft light, a hairline grid that breathes with the camera */
export const Light: React.FC<{ zoom?: number }> = ({ zoom = 1 }) => {
  const f = useCurrentFrame();
  const g = 120 * zoom;
  const ox = 960 - (960 % g) + Math.sin(f / 90) * 6, oy = 540 + Math.cos(f / 110) * 6;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 80% at 50% 45%, #ffffff 0%, #f5f6f5 70%, #eceeed 100%)" }}>
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.045) 1px, transparent 1px)",
          backgroundSize: `${g}px ${g}px`,
          backgroundPosition: `${ox}px ${oy}px`,
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 85%)",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 85%)",
        }}
      />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", opacity: 0.025, mixBlendMode: "multiply" }} />
    </AbsoluteFill>
  );
};
/** black stage: a slow green light drifting in the dark */
export const Dark: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const f = useCurrentFrame();
  const s = f / 30;
  const x = 50 + 22 * Math.sin(s * 0.35), y = 46 + 14 * Math.cos(s * 0.28);
  return (
    <AbsoluteFill style={{ background: "#020303" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 60% at ${x}% ${y}%, rgba(0,191,99,${0.11 * glow}) 0%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 90% 80% at 50% 50%, #0d1110 0%, #020303 80%)` }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", opacity: 0.06, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the camera: never still; real motion blur along its own movement
export type CamState = { s: number; x: number; y: number; r?: number };
let MB = 0;
export const Cam: React.FC<{ at: (f: number) => CamState; children: React.ReactNode; blur?: number }> = ({ at, children, blur = 1 }) => {
  const f = useCurrentFrame();
  const a = at(f), b = at(f - 1);
  const vx = (a.x - b.x) * a.s, vy = (a.y - b.y) * a.s, vs = Math.abs(a.s - b.s) / a.s;
  const bx = Math.min(60, Math.abs(vx) * 0.45 * blur) + vs * 260 * blur;
  const by = Math.min(60, Math.abs(vy) * 0.45 * blur) + vs * 260 * blur;
  const id = React.useMemo(() => `mb${MB++}`, []);
  const on = bx > 0.35 || by > 0.35;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {on && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
          </filter>
        </svg>
      )}
      <AbsoluteFill
        style={{
          transformOrigin: "960px 540px",
          transform: `translate(${-a.x * a.s}px, ${-a.y * a.s}px) scale(${a.s}) rotate(${a.r ?? 0}deg)`,
          filter: on ? `url(#${id})` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ type
export type AW = [string, number];
/** a line of words that resolve out of blur one by one, Apple style */
export const AText: React.FC<{
  words: AW[];
  size: number;
  x?: number;
  y?: number;
  color?: string;
  weight?: number;
  align?: "center" | "left";
  out?: number;
  hi?: Record<number, string>;
  dim?: number;
  tracking?: string;
  dur?: number;
  style?: React.CSSProperties;
}> = ({ words, size, x = 960, y = 540, color = INK, weight = 600, align = "center", out, hi = {}, dim, tracking = "-0.035em", dur = 15, style }) => {
  const f = useCurrentFrame();
  if (!words.length || f < words[0][1] - 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? 0 : x,
        width: align === "center" ? 1920 : undefined,
        top: y,
        transform: `translate(${align === "center" ? x - 960 : 0}px, -50%)`,
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        whiteSpace: "nowrap",
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: tracking,
        lineHeight: 1.1,
        ...style,
      }}
    >
      {words.map(([w, at], i) => {
        const p = outQuart((f - at) / dur);
        const q = out === undefined ? 0 : r01(f, out + i * 0.8, out + i * 0.8 + 9, (t) => t * t);
        const blur = (1 - p) * size * 0.22 + q * size * 0.2;
        const op = clamp01((f - at) / 5) * (0.1 + 0.9 * p) * (1 - q);
        const c = hi[i] ?? (dim !== undefined && i < dim ? INK2 : color);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: i < words.length - 1 ? "0.25em" : 0,
              color: c,
              opacity: op,
              transform: `translateY(${((1 - p) * 0.3 - q * 0.15).toFixed(3)}em) scale(${1 + 0.04 * (1 - p)})`,
              filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** green selection brackets (the corners of a text selection) around a box */
export const Brackets: React.FC<{ x: number; y: number; w: number; h: number; p: number; color?: string }> = ({ x, y, w, h, p, color = GREEN }) => {
  if (p <= 0) return null;
  const k = 26, t = 5;
  const e = outExpo(p);
  const c = (dx: number, dy: number) => (
    <div style={{ position: "absolute", left: dx < 0 ? -t : undefined, right: dx > 0 ? -t : undefined, top: dy < 0 ? -t : undefined, bottom: dy > 0 ? -t : undefined, width: k, height: k, borderColor: color, borderStyle: "solid", borderWidth: `${dy < 0 ? t : 0}px ${dx > 0 ? t : 0}px ${dy > 0 ? t : 0}px ${dx < 0 ? t : 0}px`, borderRadius: 6 }} />
  );
  const sw = lerp(w * 0.6, w, e), sh = lerp(h * 0.6, h, e);
  return (
    <div style={{ position: "absolute", left: x - sw / 2, top: y - sh / 2, width: sw, height: sh, opacity: clamp01(p * 3), background: `rgba(0,191,99,${0.08 * e})`, borderRadius: 10 }}>
      {c(-1, -1)}
      {c(1, -1)}
      {c(-1, 1)}
      {c(1, 1)}
    </div>
  );
};

/** soft entrance for any element: blur + rise + scale, and an optional blurred exit */
export const enter = (f: number, at: number, dur = 16, out?: number, outDur = 10): React.CSSProperties => {
  const p = outQuart((f - at) / dur);
  const q = out === undefined ? 0 : r01(f, out, out + outDur, (t) => t * t);
  const b = (1 - p) * 18 + q * 18;
  return { opacity: clamp01((f - at) / 4) * p * (1 - q), transform: `translateY(${(1 - p) * 40 - q * 20}px) scale(${0.94 + 0.06 * p + 0.04 * q})`, filter: b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined };
};

export const SFX: React.CSSProperties = { fontFamily: FONT };
