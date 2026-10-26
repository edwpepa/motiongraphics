import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";

// ------------------------------------------------------------------ an animated-feature look in code: cel shading, ink lines, halftone in the shadows, warm key / teal fill
export const C = {
  ink: "#16110f",
  night: "#071418",
  nightMid: "#0e2a31",
  teal: "#1d5562",
  tealLight: "#3f8b97",
  warm: "#ff9440",
  warmLight: "#ffc47a",
  amber: "#ffb547",
  skin: "#e6a27a",
  skinLit: "#f7c39b",
  skinShade: "#8e5a58",
  skinDeep: "#5a3a44",
  hair: "#15151b",
  hoodie: "#5d6675",
  hoodieShade: "#30384a",
  green: "#00bf63",
  greenLight: "#5df0a5",
  white: "#f6f3ee",
};

let UID = 0;
export const useId = (p: string) => React.useMemo(() => `${p}${UID++}`, [p]);

/** shared SVG defs: halftone dots for shadows */
export const Halftone: React.FC<{ id: string; color?: string; size?: number; opacity?: number }> = ({ id, color = "#000", size = 7, opacity = 0.35 }) => (
  <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
    <circle cx={size / 2} cy={size / 2} r={size * 0.26} fill={color} opacity={opacity} />
  </pattern>
);

/** the grade over every toon shot: vignette, grain, a hint of print misregistration */
export const Grade: React.FC<{ vignette?: number; warm?: number }> = ({ vignette = 0.55, warm = 0 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)` }} />
      {warm > 0 && <AbsoluteFill style={{ background: `rgba(255,140,60,${0.06 * warm})`, mixBlendMode: "soft-light" }} />}
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "420px 420px", backgroundPosition: `${(f * 37) % 420}px ${(f * 53) % 420}px`, opacity: 0.09, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ faces
export type Expr = {
  /** eyelid opening 0..1 */
  open?: number;
  /** brows: + angry (inner ends down), − worried */
  brow?: number;
  /** brow height offset, px */
  browY?: number;
  /** gaze offset in px */
  gx?: number;
  gy?: number;
  mouth?: "flat" | "tight" | "smile" | "grin" | "open" | "sigh";
  /** jaw clench, 0..1 */
  clench?: number;
  /** tired bags under the eyes */
  tired?: number;
};
export type Light = { side: -1 | 1; key?: string; rim?: string; under?: string; underAmt?: number; shade?: number };
type Who = "andrei" | "mihai";

const FACE = "M118 192 C114 118 160 88 200 88 C248 88 288 120 284 194 L282 262 C280 320 252 374 200 394 C148 374 120 322 118 262 Z";
const FACE_M = "M110 196 C106 116 156 84 200 84 C250 84 296 116 290 198 L290 262 C290 326 256 382 200 400 C144 382 110 326 110 262 Z";
const HAIR_A =
  "M100 214 C90 140 118 80 178 66 C220 56 270 66 294 104 C312 132 308 176 298 218 C292 188 282 164 266 150 C268 172 258 180 246 160 C238 178 220 172 212 150 C204 172 184 174 178 150 C168 172 148 170 144 148 C136 170 122 184 116 214Z M108 150 C120 104 150 82 184 76 C150 96 132 120 124 160 Z M290 150 C284 110 262 86 232 76 C258 100 270 124 276 164 Z";
/** the light/shadow line for light from the left: down the brow, round the eye socket, over the cheekbone, along the jaw */
const TERM = "M212 80 C226 132 236 182 230 214 C224 240 206 250 214 280 C222 312 226 352 206 400 L330 400 L330 80 Z";
const HAIR_M = "M106 196 C100 128 140 86 200 84 C262 84 300 126 294 196 C288 162 276 138 252 126 C230 118 170 118 148 126 C124 136 112 160 106 196 Z";

/** a face, three-quarter-on, cel shaded; `who` swaps hair, jaw and beard */
export const Head: React.FC<{ who?: Who; e?: Expr; l: Light; f?: number; style?: React.CSSProperties; width?: number; neck?: boolean }> = ({ who = "andrei", e = {}, l, f = 0, style, width = 400, neck = true }) => {
  const id = useId("hd");
  const open = clamp01(e.open ?? 1);
  const blink = 1;
  const brow = e.brow ?? 0;
  const by = e.browY ?? 0;
  const gx = e.gx ?? 0, gy = e.gy ?? 0;
  const face = who === "mihai" ? FACE_M : FACE;
  const key = l.key ?? C.warm, rim = l.rim ?? C.warmLight;
  const eye = (cx: number, side: number) => {
    const h = 22 * open * blink;
    const w = 30;
    const lidTilt = side * brow * 3;
    return (
      <g>
        <path d={`M${cx - w} ${236} Q${cx} ${236 - h - 4 + lidTilt} ${cx + w} ${236} Q${cx} ${236 + h * 0.75} ${cx - w} ${236} Z`} fill="#f4ece4" />
        <clipPath id={`${id}e${side}`}>
          <path d={`M${cx - w} ${236} Q${cx} ${236 - h - 4 + lidTilt} ${cx + w} ${236} Q${cx} ${236 + h * 0.75} ${cx - w} ${236} Z`} />
        </clipPath>
        <g clipPath={`url(#${id}e${side})`}>
          <circle cx={cx + gx} cy={235 + gy} r={13.5} fill={who === "mihai" ? "#3b2a1e" : "#2a1d18"} />
          <circle cx={cx + gx} cy={235 + gy} r={6.5} fill="#090606" />
          <circle cx={cx + gx - 4} cy={231 + gy} r={3.4} fill="#fff" opacity={0.95} />
          {l.underAmt ? <circle cx={cx + gx + 3} cy={240 + gy} r={2.2} fill={l.under ?? "#bfe6ff"} opacity={0.9} /> : null}
          <rect x={cx - w} y={236 - 30} width={w * 2} height={18} fill="rgba(60,30,30,0.35)" />
        </g>
        <path d={`M${cx - w - 3} ${237} Q${cx} ${236 - h - 7 + lidTilt} ${cx + w + 3} ${235}`} fill="none" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" />
        {(e.tired ?? 0) > 0 && <path d={`M${cx - w + 4} ${252} Q${cx} ${262} ${cx + w - 4} ${251}`} fill="none" stroke={C.skinDeep} strokeWidth={3} opacity={0.6 * (e.tired ?? 0)} strokeLinecap="round" />}
      </g>
    );
  };
  const browPath = (cx: number, side: number) => {
    const inner = cx - side * 26, outer = cx + side * 30;
    const yi = 206 + by + brow * 9, yo = 198 + by - brow * 4;
    return `M${outer} ${yo} Q${cx} ${yo - 10 - brow * 2} ${inner} ${yi} L${inner} ${yi + 11} Q${cx} ${yo + 2} ${outer} ${yo + 9} Z`;
  };
  const m = e.mouth ?? "flat";
  const mouth = {
    flat: "M176 336 Q200 340 224 335",
    tight: "M178 338 L222 336",
    sigh: "M184 340 Q200 334 216 340",
    smile: "M170 328 Q200 356 230 328",
    grin: "M168 326 Q200 362 232 326 Q200 342 168 326 Z",
    open: "M182 330 Q200 356 218 330 Q200 338 182 330 Z",
  }[m];
  return (
    <svg width={width} height={width * 1.3} viewBox="0 0 400 520" style={{ overflow: "visible", ...style }}>
      <defs>
        <Halftone id={`${id}ht`} color={C.skinDeep} opacity={0.55} />
        <clipPath id={`${id}face`}>
          <path d={face} />
        </clipPath>
        <linearGradient id={`${id}sk`} x1={l.side < 0 ? "0" : "1"} y1="0" x2={l.side < 0 ? "1" : "0"} y2="0">
          <stop offset="0" stopColor={C.skinLit} />
          <stop offset="0.55" stopColor={C.skin} />
          <stop offset="1" stopColor={C.skinShade} />
        </linearGradient>
        <linearGradient id={`${id}up`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={l.under ?? "#9fd6ff"} stopOpacity={0.55 * (l.underAmt ?? 0)} />
          <stop offset="0.6" stopColor={l.under ?? "#9fd6ff"} stopOpacity={0} />
        </linearGradient>
      </defs>
      {neck && (
        <>
          <path d="M162 360 L160 452 L240 452 L238 360 Z" fill={C.skinShade} />
          <path d="M40 520 C60 452 130 430 200 446 C270 430 340 452 360 520 Z" fill={who === "mihai" ? "#1d4a35" : C.hoodie} stroke={C.ink} strokeWidth={5} />
          <path d={`M${l.side < 0 ? 200 : 40} 520 C${l.side < 0 ? 270 : 60} 440 ${l.side < 0 ? 340 : 130} 452 ${l.side < 0 ? 360 : 200} 520 Z`} fill={who === "mihai" ? "#0f2c20" : C.hoodieShade} opacity={0.7} />
          {who === "andrei" && <path d="M150 452 C170 480 230 480 250 452" fill="none" stroke={C.ink} strokeWidth={4} />}
        </>
      )}
      {/* ears */}
      <ellipse cx={114} cy={262} rx={15} ry={26} fill={l.side < 0 ? C.skin : C.skinShade} stroke={C.ink} strokeWidth={4} />
      <ellipse cx={286} cy={262} rx={15} ry={26} fill={l.side < 0 ? C.skinShade : C.skin} stroke={C.ink} strokeWidth={4} />
      <path d={face} fill={`url(#${id}sk)`} />
      <g clipPath={`url(#${id}face)`}>
        {/* the cel shadow: the far side of the face, under the brows, under the nose and jaw */}
        <g transform={l.side < 0 ? undefined : "translate(400 0) scale(-1 1)"}>
          <path d={TERM} fill={C.skinShade} opacity={l.shade ?? 0.85} />
          <path d={TERM} fill={`url(#${id}ht)`} />
          <path d="M224 210 C246 222 270 222 284 212 L284 250 C266 256 244 252 228 240 Z" fill={C.skinDeep} opacity={0.35} />
        </g>
        <path d="M120 214 Q200 236 280 214 L280 226 Q200 246 120 226 Z" fill={C.skinShade} opacity={0.45} />
        <path d="M150 360 Q200 392 250 360 L260 410 L140 410 Z" fill={C.skinShade} opacity={0.6} />
        <rect x={80} y={80} width={240} height={340} fill={`url(#${id}up)`} />
        {who === "mihai" && <path d="M126 282 C140 360 176 392 200 396 C226 392 262 360 274 282 C258 330 236 344 200 346 C164 344 142 330 126 282 Z" fill="#2a1d18" opacity={0.92} />}
      </g>
      {/* rim light on the lit edge */}
      <path d={face} fill="none" stroke={rim} strokeWidth={9} clipPath={`url(#${id}rim)`} opacity={0.95} />
      <clipPath id={`${id}rim`}>
        <rect x={l.side < 0 ? 60 : 200} y={120} width={140} height={300} />
      </clipPath>
      <path d={face} fill="none" stroke={C.ink} strokeWidth={6} />
      {/* nose */}
      <path d={l.side < 0 ? "M204 234 C206 262 214 282 214 292 C208 300 196 302 188 298" : "M196 234 C194 262 186 282 186 292 C192 300 204 302 212 298"} fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
      <path d={l.side < 0 ? "M206 250 L214 292 L196 300 Z" : "M194 250 L186 292 L204 300 Z"} fill={C.skinShade} opacity={0.6} />
      {eye(158, -1)}
      {eye(242, 1)}
      <path d={browPath(158, -1)} fill={C.hair} />
      <path d={browPath(242, 1)} fill={C.hair} />
      <path d={mouth} fill={m === "grin" || m === "open" ? "#3a1416" : "none"} stroke={C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      {m === "grin" && <path d="M178 332 Q200 346 222 332" fill="#fff" />}
      {(e.clench ?? 0) > 0.05 && (
        <g stroke={C.skinDeep} strokeWidth={3.5} strokeLinecap="round" opacity={e.clench}>
          <path d="M138 318 Q146 330 142 342" fill="none" />
          <path d="M262 318 Q254 330 258 342" fill="none" />
        </g>
      )}
      {/* hair */}
      <path d={who === "mihai" ? HAIR_M : HAIR_A} fill={C.hair} stroke={C.ink} strokeWidth={4} />
      <path d={who === "mihai" ? "M150 110 C180 98 230 98 262 112" : "M170 82 C200 70 236 72 262 92"} fill="none" stroke={key} strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      {who === "andrei" &&
        [0, 1, 2].map((k) => (
          <path key={k} d={`M${150 + k * 40} ${120 + Math.sin(f / 20 + k) * 2} q${10 - k * 6} 30 ${-4 + k * 8} 58`} fill="none" stroke={C.hair} strokeWidth={9} strokeLinecap="round" />
        ))}
    </svg>
  );
};

// ------------------------------------------------------------------ hands
/** a hand with the index finger out (to tap), drawn pointing up; rotate it into place */
export const TapHand: React.FC<{ width?: number; style?: React.CSSProperties; lit?: string }> = ({ width = 300, style, lit = C.warmLight }) => (
  <svg width={width} height={width * 1.6} viewBox="0 0 300 480" style={{ overflow: "visible", ...style }}>
    <path d="M118 470 L122 300 C110 290 92 270 96 236 C100 210 126 206 136 222 L140 70 C140 38 178 38 178 70 L180 214 C196 206 216 210 220 230 C236 222 256 230 256 252 C270 248 286 262 282 286 L272 360 C266 400 240 430 236 470 Z" fill={C.skin} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M180 214 C182 250 180 280 178 300 M220 230 C222 262 220 290 216 310 M256 252 C256 280 252 300 248 320" fill="none" stroke={C.skinDeep} strokeWidth={4} strokeLinecap="round" />
    <path d="M150 70 C150 52 168 52 168 70 L168 96 C162 104 156 104 150 96 Z" fill="#f7d8c4" opacity={0.85} />
    <path d="M140 70 C140 38 178 38 178 70" fill="none" stroke={lit} strokeWidth={6} opacity={0.9} />
    <path d="M236 470 C240 430 266 400 272 360 L282 286" fill="none" stroke={C.skinDeep} strokeWidth={14} opacity={0.35} />
  </svg>
);

// ------------------------------------------------------------------ effects
/** a burst of sparks from (x, y), t = 0..1 through the burst */
export const Sparks: React.FC<{ x: number; y: number; t: number; n?: number; seed?: number; spread?: number; len?: number }> = ({ x, y, t, n = 14, seed = 1, spread = 1, len = 340 }) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`spk${seed}`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.3" stopColor="#ffe2a0" />
          <stop offset="1" stopColor="#ff8a2a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={60 + 160 * t} fill={`url(#spk${seed})`} opacity={1 - t} />
      {Array.from({ length: n }, (_, i) => {
        const a = -Math.PI / 2 + (seeded(i, seed) - 0.5) * 3.4 * spread;
        const sp = 0.4 + seeded(i, seed + 3) * 0.8;
        const d0 = len * sp * t, d1 = d0 + 40 + 70 * seeded(i, seed + 7);
        const g = 380 * t * t;
        return <line key={i} x1={x + Math.cos(a) * d0} y1={y + Math.sin(a) * d0 + g} x2={x + Math.cos(a) * d1} y2={y + Math.sin(a) * d1 + g * 1.1} stroke="#ffe7a8" strokeWidth={5 - 3 * t} strokeLinecap="round" opacity={1 - t * 0.8} />;
      })}
    </svg>
  );
};

/** rain streaks on glass */
export const Rain: React.FC<{ f: number; n?: number; color?: string; opacity?: number }> = ({ f, n = 90, color = "rgba(190,225,255,0.55)", opacity = 1 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity }}>
    {Array.from({ length: n }, (_, i) => {
      const x = seeded(i, 2) * 1920;
      const sp = 18 + seeded(i, 3) * 26;
      const y = ((seeded(i, 4) * 1300 + f * sp) % 1300) - 120;
      const l = 30 + seeded(i, 5) * 60;
      return <line key={i} x1={x} y1={y} x2={x - l * 0.12} y2={y + l} stroke={color} strokeWidth={1.5 + seeded(i, 6) * 1.5} strokeLinecap="round" />;
    })}
  </svg>
);

/** soft light shafts from the top */
export const Rays: React.FC<{ x: number; color?: string; a?: number; f: number }> = ({ x, color = "255,190,120", a = 0.18, f }) => (
  <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
    {[0, 1, 2, 3].map((k) => (
      <div key={k} style={{ position: "absolute", left: x - 160 + k * 90 + Math.sin(f / 50 + k) * 20, top: -200, width: 70 + k * 30, height: 1500, transform: `rotate(${18 + k * 4}deg)`, transformOrigin: "50% 0%", background: `linear-gradient(180deg, rgba(${color},${a}) 0%, rgba(${color},0) 80%)`, filter: "blur(16px)" }} />
    ))}
  </AbsoluteFill>
);

/** dust motes drifting in a light */
export const Dust: React.FC<{ f: number; n?: number; color?: string; area?: [number, number, number, number] }> = ({ f, n = 40, color = "255,220,170", area = [0, 0, 1920, 1080] }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
    {Array.from({ length: n }, (_, i) => {
      const x = area[0] + ((seeded(i, 1) * area[2] + Math.sin(f / 60 + i) * 30 + f * 0.3) % area[2]);
      const y = area[1] + ((seeded(i, 2) * area[3] - f * (0.2 + seeded(i, 3) * 0.4) + area[3] * 10) % area[3]);
      return <circle key={i} cx={x} cy={y} r={1 + seeded(i, 4) * 2.6} fill={`rgba(${color},${0.3 + 0.5 * seeded(i, 5)})`} />;
    })}
  </svg>
);

/** comic speed lines converging on a point */
export const SpeedLines: React.FC<{ x: number; y: number; a: number; f: number; color?: string }> = ({ x, y, a, f, color = "255,255,255" }) =>
  a <= 0.01 ? null : (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: a }}>
      {Array.from({ length: 70 }, (_, i) => {
        const ang = (i / 70) * Math.PI * 2 + seeded(i + (f % 3) * 70, 4) * 0.05;
        const r0 = 330 + seeded(i + (f % 4) * 70, 5) * 260;
        return <line key={i} x1={x + Math.cos(ang) * r0} y1={y + Math.sin(ang) * r0} x2={x + Math.cos(ang) * 1500} y2={y + Math.sin(ang) * 1500} stroke={`rgba(${color},${0.25 + 0.35 * seeded(i, 6)})`} strokeWidth={2 + seeded(i, 7) * 5} />;
      })}
    </svg>
  );

/** a phone in hand-drawn style; children render as the lit screen */
export const ToonPhone: React.FC<{ w?: number; children?: React.ReactNode; glow?: string; style?: React.CSSProperties }> = ({ w = 300, children, glow = "rgba(150,210,255,0.35)", style }) => (
  <div style={{ position: "relative", width: w, height: w * 2.04, borderRadius: w * 0.16, background: "#101214", border: `${w * 0.022}px solid ${C.ink}`, boxShadow: `0 0 ${w * 0.5}px ${glow}, inset 0 0 0 ${w * 0.018}px #2a2e33`, overflow: "hidden", ...style }}>
    <div style={{ position: "absolute", inset: w * 0.035, borderRadius: w * 0.13, overflow: "hidden", background: "#f3f5f4" }}>{children}</div>
    <div style={{ position: "absolute", left: "50%", top: w * 0.05, width: w * 0.3, height: w * 0.075, marginLeft: -w * 0.15, borderRadius: 99, background: "#0b0c0d" }} />
  </div>
);

export const mixc = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp01(t)))).join(",")})`;
};

/** a round avatar cut from the face rig */
export const MiniFace: React.FC<{ who?: Who; size: number; bg?: string; filter?: string; e?: Expr; side?: -1 | 1; ring?: string }> = ({ who = "mihai", size, bg = "#cfe9db", filter, e, side = -1, ring }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: bg, position: "relative", filter, boxShadow: ring ? `0 0 0 ${size * 0.05}px ${ring}` : undefined, flexShrink: 0 }}>
    <div style={{ position: "absolute", left: -size * 0.1, top: -size * 0.2 }}>
      <Head who={who} width={size * 1.2} l={{ side, shade: 0.7 }} e={e ?? { mouth: "smile" }} neck={false} />
    </div>
  </div>
);

/** a wall socket in the same ink-and-cel style; `broken` cracks and scorches it, `screw` turns its screw */
export const ToonSocket: React.FC<{ size: number; broken?: number; screw?: number; glow?: number }> = ({ size, broken = 0, screw = 0, glow = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 300 300" style={{ overflow: "visible" }}>
    <defs>
      <linearGradient id="tsPlate" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#f1efe9" />
        <stop offset="1" stopColor="#d9d5cc" />
      </linearGradient>
      <radialGradient id="tsScorch" cx="0.38" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#2a1a12" stopOpacity={0.85} />
        <stop offset="1" stopColor="#2a1a12" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={14} y={24} width={272} height={272} rx={56} fill="rgba(0,0,0,0.18)" />
    <rect x={10} y={10} width={280} height={280} rx={56} fill="url(#tsPlate)" stroke={C.ink} strokeWidth={8} />
    <path d="M40 270 L270 40 L280 60 L280 230 C280 260 260 280 230 280 L60 280 Z" fill="#c9c4b9" opacity={0.35} />
    <circle cx={150} cy={150} r={98} fill="#f7f6f2" stroke={C.ink} strokeWidth={7} />
    <path d="M90 210 A98 98 0 0 0 246 166 L232 162 A84 84 0 0 1 100 198 Z" fill="#d6d1c6" opacity={0.7} />
    <rect x={138} y={56} width={24} height={26} rx={4} fill="#b8bdbb" stroke={C.ink} strokeWidth={5} />
    <rect x={138} y={218} width={24} height={26} rx={4} fill="#b8bdbb" stroke={C.ink} strokeWidth={5} />
    <circle cx={112} cy={150} r={17} fill="#141414" stroke={C.ink} strokeWidth={5} />
    <circle cx={188} cy={150} r={17} fill="#141414" stroke={C.ink} strokeWidth={5} />
    <g transform={`rotate(${screw} 150 270)`}>
      <circle cx={150} cy={270} r={9} fill="#c7cbc9" stroke={C.ink} strokeWidth={4} />
      <line x1={143} y1={270} x2={157} y2={270} stroke={C.ink} strokeWidth={3} />
    </g>
    {broken > 0 && (
      <g opacity={broken}>
        <ellipse cx={112} cy={150} rx={58} ry={50} fill="url(#tsScorch)" />
        <path d="M188 70 L172 118 L196 132 L176 186 L204 214 L196 262" fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        <path d="M196 132 L232 120" fill="none" stroke={C.ink} strokeWidth={4} />
      </g>
    )}
    {glow > 0 && <rect x={10} y={10} width={280} height={280} rx={56} fill="none" stroke={C.greenLight} strokeWidth={10} opacity={glow} />}
  </svg>
);
