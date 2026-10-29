import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { Sym, SymName } from "../tv/ios";
import { GREEN, GREEN2, io3, outExpo, spring } from "../tv3d/kit3d";
import { RFONT, RINK } from "./type";

export const BG = "#f7f8fa";
export const UI = "Inter, sans-serif";

// ------------------------------------------------------------------ stages
export const RefBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 62% 58% at ${50 + Math.sin(f / 130) * 5}% ${46 + Math.cos(f / 150) * 4}%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 72%), radial-gradient(ellipse 45% 40% at 92% 96%, rgba(0,191,99,0.05) 0%, rgba(0,191,99,0) 70%), radial-gradient(ellipse 40% 40% at 6% 6%, rgba(0,191,99,0.035) 0%, rgba(0,0,0,0) 70%)` }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ a white card with a small, neutral grey shadow (no coloured glow anywhere)
export const cardShadow = (k = 1) => `0 ${8 * k}px ${24 * k}px rgba(0,0,0,${0.07 * k}), 0 ${1 * k}px ${3 * k}px rgba(0,0,0,${0.06 * k})`;

/** glossy app-style icon (the reference's folder): a green tile with depth, a highlight and a white glyph */
export const GlossIcon: React.FC<{ n: SymName | "logo"; size: number; tilt?: number }> = ({ n, size, tilt = 0 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.26, position: "relative", transform: `rotate(${tilt}deg)`, background: "linear-gradient(160deg, #4ae6a1 0%, #00c066 52%, #00a052 100%)", boxShadow: `0 ${size * 0.2}px ${size * 0.4}px rgba(0,140,70,0.32), inset 0 ${size * 0.03}px 0 rgba(255,255,255,0.55), inset 0 -${size * 0.05}px ${size * 0.1}px rgba(0,80,40,0.25)`, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: "48%", background: "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.05) 100%)", borderRadius: `${size * 0.26}px ${size * 0.26}px ${size * 0.5}px ${size * 0.5}px / ${size * 0.26}px ${size * 0.26}px ${size * 0.12}px ${size * 0.12}px` }} />
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {n === "logo" ? <Img src={staticFile("images/logo.webp")} style={{ width: size * 0.62, height: size * 0.62, filter: "brightness(0) invert(1)" }} /> : <Sym n={n} size={size * 0.5} color="#fff" w={2.2} />}
    </div>
  </div>
);

/** the Handly app icon: white tile, the mark */
export const AppTile: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.24, background: "#fff", boxShadow: `0 ${size * 0.12}px ${size * 0.3}px rgba(0,60,30,0.16), inset 0 0 0 1px rgba(0,0,0,0.04)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Img src={staticFile("images/logo.webp")} style={{ width: size * 0.66, height: size * 0.66 }} />
  </div>
);

// ------------------------------------------------------------------ the hand cursor, moving between key poses (eased), pressing on clicks
export type CK = { f: number; x: number; y: number };
export const Cursor: React.FC<{ keys: CK[]; clicks?: number[]; hideAt?: number; size?: number }> = ({ keys, clicks = [], hideAt, size = 54 }) => {
  const f = useCurrentFrame();
  if (f < keys[0].f || (hideAt !== undefined && f > hideAt + 8)) return null;
  let x = keys[keys.length - 1].x, y = keys[keys.length - 1].y;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f >= a.f && f <= b.f) {
      const t = io3((f - a.f) / Math.max(1, b.f - a.f));
      x = lerp(a.x, b.x, t);
      y = lerp(a.y, b.y, t) - Math.sin(Math.PI * t) * 26;
      break;
    }
  }
  let press = 0;
  for (const c of clicks) if (f >= c - 3 && f <= c + 5) press = Math.max(press, Math.sin((Math.PI * (f - c + 3)) / 8));
  const op = clamp01((f - keys[0].f) / 5) * (hideAt === undefined ? 1 : 1 - clamp01((f - hideAt) / 8));
  return (
    <div style={{ position: "absolute", left: x - size * 0.36, top: y - size * 0.06, width: size, height: size, opacity: op, transform: `scale(${1 - 0.16 * press})`, transformOrigin: "36% 6%", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.22))" }}>
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <path d="M11.2 2.6c1.2 0 2.1.9 2.1 2.1v8.1l.2-.1c.5-1.1 2-1.6 3.1-.9.5.3.8.7 1 1.2.6-.9 1.9-1.3 2.9-.8.6.3 1 .8 1.2 1.4.7-.6 1.8-.7 2.6-.2.8.5 1.2 1.3 1.2 2.2v5.6c0 4.4-3.3 7.9-7.6 7.9h-2.4c-2.4 0-4.1-.9-5.6-2.8l-4.6-6.1c-.7-.9-.5-2.2.4-2.9.9-.7 2.1-.6 2.9.2l1.5 1.6V4.7c0-1.2.9-2.1 1.9-2.1z" fill="#fff" stroke="#111" strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M13.4 13.2v5 M17.5 14.4v4 M21.5 15.8v3" stroke="#111" strokeWidth={1.3} strokeLinecap="round" />
      </svg>
      {press > 0 && <div style={{ position: "absolute", left: size * 0.36 - 26, top: size * 0.06 - 26, width: 52, height: 52, borderRadius: 26, border: `3px solid rgba(0,191,99,${0.6 * press})`, transform: `scale(${0.4 + press * 0.8})` }} />}
    </div>
  );
};

/** a button that goes black → green when it's pressed (the reference's black button turning blue) */
export const PillBtn: React.FC<{ label: string; w: number; h: number; press?: number; on?: number; size?: number; icon?: SymName }> = ({ label, w, h, press = 0, on = 0, size = 24, icon }) => (
  <div style={{ width: w, height: h, borderRadius: h * 0.28, position: "relative", overflow: "hidden", background: "#0e1110", transform: `scale(${1 - 0.07 * press + 0.06 * Math.sin(Math.PI * clamp01(on * 1.4))})`, boxShadow: "0 6px 16px rgba(0,0,0,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${GREEN} 0%, ${GREEN2} 100%)`, opacity: on }} />
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, color: "#fff", fontFamily: UI, fontWeight: 500, fontSize: size, letterSpacing: "-0.01em" }}>
      {icon && <Sym n={icon} size={size * 1.05} color="#fff" w={2.4} />}
      {label}
    </div>
  </div>
);

// ------------------------------------------------------------------ progress, done
export const ProgressBar: React.FC<{ x: number; y: number; w: number; h: number; p: number; dark?: boolean }> = ({ x, y, w, h, p, dark }) => (
  <div style={{ position: "absolute", left: x, top: y - h / 2, width: w, height: h, borderRadius: h / 2, background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)", boxShadow: dark ? undefined : "0 10px 30px rgba(20,40,32,0.06)" }}>
    <div style={{ position: "absolute", left: 0, top: 0, height: h, width: Math.max(h, w * clamp01(p)), borderRadius: h / 2, background: `linear-gradient(90deg, #c9f5dd 0%, #4fdc98 35%, ${GREEN} 70%, #63e7ad 100%)`, boxShadow: `0 ${h * 0.45}px ${h * 0.9}px rgba(0,191,99,0.32), inset 0 2px 0 rgba(255,255,255,0.45)` }} />
  </div>
);

export const CheckCircle: React.FC<{ size: number; t: number; glow?: number }> = ({ size, t, glow = 0 }) => {
  const c = outExpo(t);
  const draw = clamp01((t - 0.25) / 0.6);
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, position: "relative", transform: `scale(${0.6 + 0.4 * spring(clamp01(t * 1.2))})`, opacity: c, background: "radial-gradient(circle at 35% 30%, #ffffff 0%, #eafaf1 55%, #d3f5e2 100%)", boxShadow: `0 ${size * 0.14}px ${size * 0.34}px rgba(0,191,99,${0.22 + 0.4 * glow}), 0 0 ${size * 0.8 * glow}px rgba(0,191,99,${0.6 * glow}), inset 0 0 0 ${size * 0.025}px rgba(0,191,99,0.35)` }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
        <path d="M30 52 L44 65 L71 36" fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={70} strokeDashoffset={70 * (1 - io3(draw))} />
      </svg>
    </div>
  );
};

/** confetti like the reference: big flat shards tumbling in 3D */
export const Shards: React.FC<{ at: number; x?: number; y?: number; n?: number; colors?: string[]; spread?: number }> = ({ at, x = 960, y = 540, n = 40, colors = [GREEN, "#7be8b2", "#0a8c48", "#c8f6dc", "#ffffff", GREEN2], spread = 1 }) => {
  const f = useCurrentFrame();
  const t = (f - at) / 30;
  if (t < 0 || t > 2.6) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", perspective: 1200 }}>
      {Array.from({ length: n }, (_, i) => {
        const a = seeded(i, 31) * Math.PI * 2;
        const v = (420 + seeded(i, 32) * 760) * spread;
        const e = outExpo(t * 0.8);
        const px = x + Math.cos(a) * v * e;
        const py = y + Math.sin(a) * v * e * 0.62 + 240 * t * t;
        const s = 18 + seeded(i, 33) * 34;
        const pts = [0, 1, 2, 3].map((j) => `${50 + Math.cos(j * 1.57 + seeded(i, 40 + j)) * (30 + seeded(i, 50 + j) * 20)}% ${50 + Math.sin(j * 1.57 + seeded(i, 60 + j)) * (30 + seeded(i, 70 + j) * 20)}%`).join(",");
        return <div key={i} style={{ position: "absolute", left: px - s / 2, top: py - s / 2, width: s, height: s, background: colors[i % colors.length], clipPath: `polygon(${pts})`, transform: `rotateX(${t * 540 * seeded(i, 34)}deg) rotateY(${t * 380 * (seeded(i, 35) - 0.5)}deg) rotateZ(${seeded(i, 36) * 360 + t * 200}deg)`, opacity: clamp01((2.6 - t) / 0.6), filter: colors[i % colors.length] === "#ffffff" ? "drop-shadow(0 2px 4px rgba(0,0,0,0.12))" : undefined }} />;
      })}
    </AbsoluteFill>
  );
};

/** something that pops out of the phone's glass and lands where it belongs */
export const Pop: React.FC<{ at: number; from: [number, number]; to: [number, number]; out?: number; outTo?: [number, number]; children: React.ReactNode; tilt?: number; outKind?: "blur" | "fly" }> = ({ at, from, to, out, outTo, children, tilt = 0, outKind = "blur" }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const e = outExpo(clamp01((f - at) / 18));
  const s = spring(clamp01((f - at) / 24));
  let x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e);
  let sc = 0.35 + 0.65 * s, op = clamp01((f - at) / 4), blur = 0;
  if (out !== undefined && f >= out) {
    const u = clamp01((f - out) / (outKind === "fly" ? 12 : 8));
    if (outKind === "fly" && outTo) {
      const k = u * u;
      x = lerp(x, outTo[0], k);
      y = lerp(y, outTo[1], k);
      sc *= 1 - 0.75 * k;
      op *= 1 - clamp01((u - 0.6) / 0.4);
    } else {
      blur = 14 * u;
      op *= 1 - u;
      sc *= 1 + 0.05 * u;
    }
    if (op <= 0.003) return null;
  }
  const fl = Math.sin((f - at) / 23) * 6;
  return (
    <div style={{ position: "absolute", left: x, top: y + fl, transform: `translate(-50%, -50%) scale(${sc}) rotate(${(1 - e) * tilt}deg)`, opacity: op, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
};

/** iOS push between screens: the new one slides in from the right, the old one slides back and dims */
export const Stack: React.FC<{ screens: { at: number; node: React.ReactNode }[]; len?: number }> = ({ screens, len = 12 }) => {
  const f = useCurrentFrame();
  let cur = 0;
  for (let i = 0; i < screens.length; i++) if (f >= screens[i].at) cur = i;
  const t = cur > 0 ? io3(clamp01((f - screens[cur].at) / len)) : 1;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {cur > 0 && t < 1 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${-30 * t}%)`, filter: `brightness(${1 - 0.25 * t})` }}>{screens[cur - 1].node}</div>
      )}
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${100 * (1 - t)}%)`, boxShadow: t < 1 ? "-20px 0 40px rgba(0,0,0,0.18)" : undefined }}>{screens[cur].node}</div>
    </div>
  );
};

/** a white UI card */
export const Card: React.FC<{ w: number; h?: number; children: React.ReactNode; r?: number; pad?: number; dark?: boolean; style?: React.CSSProperties }> = ({ w, h, children, r = 26, pad = 22, dark, style }) => (
  <div style={{ width: w, height: h, borderRadius: r, padding: pad, boxSizing: "border-box", background: dark ? "rgba(20,30,26,0.92)" : "#fff", border: dark ? "1px solid rgba(255,255,255,0.08)" : undefined, boxShadow: dark ? "0 30px 60px rgba(0,0,0,0.45), 0 0 50px rgba(0,191,99,0.08)" : cardShadow(), fontFamily: UI, color: dark ? "#f2f5f3" : RINK, position: "relative", ...style }}>
    {children}
  </div>
);
export { RFONT };

// ------------------------------------------------------------------ iOS, the way Settings looks: inset grouped lists, icon tiles, switches
export const IOSC = { green: "#34c759", blue: "#007aff", orange: "#ff9500", red: "#ff3b30", purple: "#af52de", teal: "#30b0c7", indigo: "#5856d6", pink: "#ff2d55", yellow: "#ffcc00", gray: "#8e8e93", brand: GREEN };
const PAL = {
  light: { cell: "#ffffff", text: "#000000", sub: "#8a8a8e", sep: "#e3e3e8", chev: "#c4c4c7", off: "#e9e9eb", head: "#6d6d72" },
  dark: { cell: "#1c1c1e", text: "#ffffff", sub: "#8e8e93", sep: "#38383a", chev: "#5a5a5f", off: "#39393d", head: "#8e8e93" },
};
export const IOSIcon: React.FC<{ n: SymName; color: string; size?: number }> = ({ n, color, size = 46 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.225, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Sym n={n} size={size * 0.6} color="#fff" w={2.3} />
  </div>
);
export const IOSToggle: React.FC<{ on: number; k?: number; dark?: boolean }> = ({ on, k = 1.6, dark }) => {
  const e = io3(clamp01(on));
  return (
    <div style={{ width: 51 * k, height: 31 * k, borderRadius: 16 * k, background: e > 0.5 ? IOSC.green : (dark ? PAL.dark : PAL.light).off, position: "relative", flexShrink: 0, transition: "none" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 16 * k, background: IOSC.green, opacity: e }} />
      <div style={{ position: "absolute", top: 2 * k, left: (2 + 20 * e) * k, width: 27 * k, height: 27 * k, borderRadius: 14 * k, background: "#fff", boxShadow: `0 ${3 * k}px ${8 * k}px rgba(0,0,0,0.15), 0 ${1 * k}px ${1 * k}px rgba(0,0,0,0.06)` }} />
    </div>
  );
};
export type IOSRow = { icon?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; value?: React.ReactNode; acc?: "chevron" | "toggle" | "none" | React.ReactNode; on?: number; at?: number; color?: string };
/** an inset grouped list (Settings): rows can arrive one by one (`at`), the group grows to take them */
export const IOSGroup: React.FC<{ rows: IOSRow[]; w: number; dark?: boolean; header?: string; footer?: string; k?: number }> = ({ rows, w, dark, header, footer, k = 1.6 }) => {
  const f = useCurrentFrame();
  const P = dark ? PAL.dark : PAL.light;
  return (
    <div style={{ width: w, fontFamily: UI }}>
      {header && <div style={{ fontSize: 13 * k, color: P.head, textTransform: "uppercase", letterSpacing: "0.02em", padding: `0 ${16 * k}px ${7 * k}px` }}>{header}</div>}
      <div style={{ background: P.cell, borderRadius: 11 * k, overflow: "hidden", boxShadow: dark ? "inset 0 0 0 1px rgba(255,255,255,0.05)" : cardShadow(0.8) }}>
        {rows.map((r, i) => {
          const a = r.at === undefined ? 1 : io3(clamp01((f - r.at) / 8));
          if (a <= 0) return null;
          const h = (r.sub ? 62 : 46) * k;
          return (
            <div key={i} style={{ height: h * a, opacity: a, display: "flex", alignItems: "center", paddingLeft: 16 * k, position: "relative", overflow: "hidden" }}>
              {r.icon && <div style={{ marginRight: 14 * k, display: "flex" }}>{r.icon}</div>}
              <div style={{ flex: 1, height: h, display: "flex", alignItems: "center", paddingRight: 16 * k, borderBottom: i < rows.length - 1 ? `${Math.max(1, 0.5 * k)}px solid ${P.sep}` : undefined, boxSizing: "border-box", minWidth: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17 * k, color: r.color ?? P.text, letterSpacing: "-0.01em", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 * k }}>{r.title}</div>
                  {r.sub && <div style={{ fontSize: 13.5 * k, color: P.sub, marginTop: 2 * k, whiteSpace: "nowrap" }}>{r.sub}</div>}
                </div>
                {r.value !== undefined && <div style={{ fontSize: 17 * k, color: P.sub, marginLeft: 10 * k, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{r.value}</div>}
                {r.acc === "chevron" && <div style={{ marginLeft: 8 * k, display: "flex" }}><Sym n="chevR" size={15 * k} color={P.chev} w={2.6} /></div>}
                {r.acc === "toggle" && <div style={{ marginLeft: 10 * k }}><IOSToggle on={r.on ?? 0} k={k} dark={dark} /></div>}
                {r.acc && typeof r.acc !== "string" && <div style={{ marginLeft: 10 * k }}>{r.acc}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {footer && <div style={{ fontSize: 13 * k, color: P.head, padding: `${7 * k}px ${16 * k}px 0`, lineHeight: 1.35 }}>{footer}</div>}
    </div>
  );
};
/** an iOS notification banner */
export const IOSBanner: React.FC<{ app: "messages" | "phone"; title: string; body: string; time?: string; w?: number; scale?: number }> = ({ app, title, body, time = "acum", w = 600, scale = 1 }) => (
  <div style={{ zoom: scale, width: w, borderRadius: 30, padding: "18px 22px", boxSizing: "border-box", background: "rgba(246,246,248,0.94)", boxShadow: cardShadow(1), fontFamily: UI, display: "flex", gap: 16, alignItems: "flex-start" }}>
    <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(180deg, #5df877 0%, #29c84d 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Sym n={app === "messages" ? "msg" : "phone"} size={30} color="#fff" fill={app === "messages" ? "#fff" : undefined} w={2} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <div style={{ fontSize: 23, fontWeight: 600, color: "#000" }}>{title}</div>
        <div style={{ marginLeft: "auto", fontSize: 19, color: "#8a8a8e" }}>{time}</div>
      </div>
      <div style={{ fontSize: 23, color: "#1c1c1e", marginTop: 2, lineHeight: 1.3 }}>{body}</div>
    </div>
  </div>
);

// ------------------------------------------------------------------ the heart (the mark's shape): what the button turns into at the end
export const Heart: React.FC<{ x: number; y: number; size: number; rot?: number; opacity?: number }> = ({ x, y, size, rot = 0, opacity = 1 }) => (
  <svg width={size * 2} height={size * 2} viewBox="-1.1 -1.1 2.2 2.2" style={{ position: "absolute", left: x - size, top: y - size, transform: `rotate(${rot}deg)`, overflow: "visible", opacity, filter: `drop-shadow(0 ${size * 0.08}px ${size * 0.2}px rgba(0,0,0,0.12))` }}>
    <defs>
      <linearGradient id="heartG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3fe39a" />
        <stop offset="1" stopColor="#00a856" />
      </linearGradient>
    </defs>
    <path d="M0 0.9 C-0.15 0.75 -1 0.2 -1 -0.35 C-1 -0.8 -0.55 -1 -0.3 -0.95 C-0.12 -0.92 0 -0.75 0 -0.62 C0 -0.75 0.12 -0.92 0.3 -0.95 C0.55 -1 1 -0.8 1 -0.35 C1 0.2 0.15 0.75 0 0.9 Z" fill="url(#heartG)" />
  </svg>
);
