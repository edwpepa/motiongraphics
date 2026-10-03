import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Glyph } from "../explainer/components/Icons";
import { clamp01, ease, lerp, seeded } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { P } from "./kit";

// ------------------------------------------------------------------ service icons (Lucide geometry, ISC)
const EXTRA: Record<string, string> = {
  box: `<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>`,
  sparkles: `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>`,
  sofa: `<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/>`,
  plug: `<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>`,
  dog: `<path d="M11.25 16.25h1.5L12 17z"/><path d="M16 14v.5"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/><path d="M8 14v.5"/><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>`,
  leaf: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`,
};

export type ServiceName = "droplet" | "roller" | "wrench" | "hammer" | "sparkles" | "box" | "sofa" | "plug" | "leaf" | "dog";
export const SERVICES: Array<{ icon: ServiceName; label: string }> = [
  { icon: "droplet", label: "Instalații" },
  { icon: "roller", label: "Zugrăveli" },
  { icon: "wrench", label: "Reparații" },
  { icon: "plug", label: "Electrice" },
  { icon: "sparkles", label: "Curățenie" },
  { icon: "box", label: "Mutări" },
  { icon: "hammer", label: "Montaj" },
  { icon: "leaf", label: "Grădină" },
];

export const ServiceIcon: React.FC<{ name: ServiceName; size: number; color: string; weight?: number }> = ({ name, size, color, weight = 2 }) =>
  name in EXTRA ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }} dangerouslySetInnerHTML={{ __html: EXTRA[name] }} />
  ) : (
    <Glyph name={name as "wrench"} size={size} color={color} weight={weight} />
  );

/** premium app-icon tile: rounded square, soft gradient, inner highlight */
export const ServiceTile: React.FC<{ name: ServiceName; size: number; tone?: "green" | "white" | "dark"; style?: React.CSSProperties }> = ({ name, size, tone = "green", style }) => {
  const bg = tone === "green" ? "linear-gradient(160deg, #3ff09a 0%, #00b35c 100%)" : tone === "white" ? "linear-gradient(160deg, #ffffff 0%, #e6ece8 100%)" : "linear-gradient(160deg, #26302c 0%, #0f1412 100%)";
  const ink = tone === "green" ? "#ffffff" : tone === "white" ? P.green : P.mint;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: bg,
        boxShadow: `0 ${size * 0.14}px ${size * 0.34}px rgba(0,0,0,0.35), inset 0 ${size * 0.02}px 0 rgba(255,255,255,0.45)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <ServiceIcon name={name} size={size * 0.5} color={ink} weight={2.2} />
    </div>
  );
};

// ------------------------------------------------------------------ vortex: things spiral in and get absorbed
export type VortexItem = { kind: "pill"; label: string } | { kind: "tile"; icon: ServiceName } | { kind: "bubble"; icon: ServiceName; d: number; tone: 0 | 1 | 2 } | { kind: "dot"; d: number };

/**
 * Items fly in from all around on a tightening spiral and vanish into (cx, cy). Item i starts at
 * `from + i * stagger` and takes `travel` frames; `accel` makes the late ones arrive faster.
 */
export const Vortex: React.FC<{ items: VortexItem[]; from: number; stagger: number; travel: number; cx: number; cy: number; radius?: number; size?: number }> = ({
  items,
  from,
  stagger,
  travel,
  cx,
  cy,
  radius = 1100,
  size = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {items.map((it, i) => {
        const start = from + i * stagger;
        const p = (frame - start) / travel;
        if (p < 0 || p >= 1) return null;
        const e = p * p * (3 - 2 * p) * 0.35 + Math.pow(p, 2.2) * 0.65;
        const a0 = seeded(i, 3) * Math.PI * 2;
        const a = a0 + e * (2.2 + seeded(i, 4));
        const r = radius * (1 - e) * (0.8 + 0.3 * seeded(i, 5));
        const x = cx + Math.cos(a) * r * 1.25;
        const y = cy + Math.sin(a) * r * 0.75;
        const sc = (1.25 - e * 1.05) * size;
        const op = clamp01(p * 6) * (1 - clamp01((p - 0.9) / 0.1));
        const blur = e > 0.6 ? (e - 0.6) * 10 : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${sc}) rotate(${(1 - e) * (seeded(i, 6) - 0.5) * 50}deg)`, opacity: op, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
            {it.kind === "bubble" ? (
              <div
                style={{
                  width: it.d,
                  height: it.d,
                  borderRadius: "50%",
                  background: it.tone === 0 ? "radial-gradient(circle at 35% 30%, #8dffc4 0%, #00bf63 55%, #008f49 100%)" : it.tone === 1 ? "radial-gradient(circle at 35% 30%, #ffffff 0%, #e2ebe6 100%)" : "radial-gradient(circle at 35% 30%, rgba(80,110,95,0.9) 0%, rgba(20,30,25,0.9) 100%)",
                  boxShadow: `0 ${it.d * 0.12}px ${it.d * 0.35}px rgba(0,0,0,0.4), inset 0 ${it.d * 0.03}px 0 rgba(255,255,255,0.5), 0 0 ${it.d * 0.4}px rgba(0,191,99,0.25)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ServiceIcon name={it.icon} size={it.d * 0.48} color={it.tone === 1 ? P.green : "#ffffff"} weight={2.3} />
              </div>
            ) : it.kind === "dot" ? (
              <div style={{ width: it.d, height: it.d, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #d9ffe9, #2be38a 60%, #00a352)", boxShadow: `0 0 ${it.d}px rgba(0,191,99,0.7)` }} />
            ) : it.kind === "pill" ? (
              <div style={{ padding: "16px 28px", borderRadius: 999, background: "rgba(30,40,35,0.85)", border: "1.5px solid rgba(185,255,214,0.35)", boxShadow: "0 0 30px rgba(0,191,99,0.25)", display: "flex", alignItems: "center", gap: 12, fontFamily: FONT, fontWeight: BOLD, fontSize: 40, color: "#fff", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, border: "3px solid rgba(255,255,255,0.5)" }} />
                {it.label}
              </div>
            ) : (
              <ServiceTile name={it.icon} size={150} tone={i % 3 === 0 ? "white" : i % 3 === 1 ? "green" : "dark"} />
            )}
          </div>
        );
      })}
    </>
  );
};

/** how many items have been absorbed by `frame` (for core pulses) */
export const absorbed = (frame: number, n: number, from: number, stagger: number, travel: number) => {
  let c = 0;
  let last = -999;
  for (let i = 0; i < n; i++) {
    const end = from + i * stagger + travel * 0.92;
    if (frame >= end) {
      c++;
      last = end;
    }
  }
  return { count: c, since: frame - last };
};

// ------------------------------------------------------------------ explosion: flash, shockwave, rays, debris
export const Explosion: React.FC<{ at: number; cx?: number; cy?: number; icons?: boolean; color?: string }> = ({ at, cx = 960, cy = 540, icons = true, color = P.mint }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 40) return null;
  const flash = t < 2 ? 1 : Math.max(0, 1 - (t - 2) / 6);
  const wave = ease.outCubic(clamp01(t / 18));
  const rays = clamp01(1 - t / 26);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* light rays */}
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${t * 2}deg at ${cx}px ${cy}px, rgba(255,255,255,${0.22 * rays}) 0deg 3deg, rgba(255,255,255,0) 3deg 14deg)`,
          WebkitMaskImage: `radial-gradient(circle at ${cx}px ${cy}px, #000 0%, #000 ${20 + 50 * wave}%, transparent ${45 + 55 * wave}%)`,
          maskImage: `radial-gradient(circle at ${cx}px ${cy}px, #000 0%, #000 ${20 + 50 * wave}%, transparent ${45 + 55 * wave}%)`,
          mixBlendMode: "screen",
        }}
      />
      {/* shockwave */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[0, 4].map((d, i) => {
          const u = clamp01((t - d) / 22);
          if (u <= 0 || u >= 1) return null;
          const e = ease.outCubic(u);
          return <circle key={i} cx={cx} cy={cy} r={60 + 1300 * e} fill="none" stroke={i ? color : "#ffffff"} strokeWidth={(1 - u) * (i ? 18 : 40) + 1} opacity={(1 - u) * 0.85} style={{ filter: "blur(2px)" }} />;
        })}
      </svg>
      {/* debris: icons and sparks thrown outwards */}
      {Array.from({ length: icons ? 26 : 40 }, (_, i) => {
        const u = clamp01(t / (26 + seeded(i, 1) * 10));
        if (u >= 1) return null;
        const a = (i / (icons ? 26 : 40)) * Math.PI * 2 + seeded(i, 2) * 0.4;
        const sp = 500 + seeded(i, 3) * 900;
        const e = ease.outCubic(u);
        const x = cx + Math.cos(a) * sp * e;
        const y = cy + Math.sin(a) * sp * e * 0.8 + 120 * u * u;
        const isIcon = icons && i % 3 === 0;
        return isIcon ? (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${1 - 0.5 * u}) rotate(${u * 220 * (seeded(i, 4) - 0.5)}deg)`, opacity: 1 - u }}>
            <ServiceTile name={SERVICES[i % SERVICES.length].icon} size={96} tone={i % 2 ? "white" : "green"} />
          </div>
        ) : (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 10 + 26 * (1 - u), height: 4 + 4 * (1 - u), borderRadius: 4, background: i % 2 ? "#ffffff" : color, transform: `translate(-50%, -50%) rotate(${(a * 180) / Math.PI}deg)`, opacity: 1 - u, boxShadow: `0 0 12px ${color}` }} />
        );
      })}
      <AbsoluteFill style={{ background: "#ffffff", opacity: flash * 0.9 }} />
    </AbsoluteFill>
  );
};

/** decaying camera shake, for wrapping a scene around a hit */
export const shake = (frame: number, at: number, amp = 26, len = 14) => {
  const t = frame - at;
  if (t < 0 || t > len) return { x: 0, y: 0 };
  const k = Math.pow(1 - t / len, 2) * amp;
  return { x: Math.sin(t * 2.9 + 1) * k, y: Math.cos(t * 3.7) * k * 0.7 };
};

export { lerp };
