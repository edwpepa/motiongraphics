import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { StoreBadge } from "../../explainer/components/StoreBadge";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { FONT } from "../../explainer/theme";
import { io3 } from "../tv3d/kit3d";
import { END_HIT, STAR, TOTAL } from "./marks";
import { measure } from "./type";
import { BG } from "./ui";

// ------------------------------------------------------------------ the finale: the button becomes a point of light, the point draws a
// perfectly symmetric heart (two strokes rising from its tip, meeting at the top), the heart fills, beats twice
// with heart-shaped echoes, and turns into the Handly mark; handly.ro opens beside it, then the stores.

// one half of the heart, from the tip (0, 0.95) up the right side to the dip (0, -0.6); the left half is its mirror
const SEG: [number, number][][] = [
  [[0, 0.95], [0.42, 0.62], [1.0, 0.18], [1.0, -0.32]],
  [[1.0, -0.32], [1.0, -0.78], [0.62, -1.0], [0.36, -1.0]],
  [[0.36, -1.0], [0.17, -1.0], [0.02, -0.86], [0, -0.6]],
];
const half = (sx: number) => `M${SEG[0][0][0] * sx} ${SEG[0][0][1]} ` + SEG.map((s) => `C${s[1][0] * sx} ${s[1][1]} ${s[2][0] * sx} ${s[2][1]} ${s[3][0] * sx} ${s[3][1]}`).join(" ");
const FILL =
  `M0 0.95 ` +
  SEG.map((s) => `C${s[1][0]} ${s[1][1]} ${s[2][0]} ${s[2][1]} ${s[3][0]} ${s[3][1]}`).join(" ") +
  " " +
  [...SEG].reverse().map((s) => `C${-s[2][0]} ${s[2][1]} ${-s[1][0]} ${s[1][1]} ${-s[0][0]} ${s[0][1]}`).join(" ") +
  " Z";
const bez = (k: number, t: number): [number, number] => {
  const [a, b, c, d] = SEG[k];
  const m = 1 - t;
  return [m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]];
};
// arc-length table, so the heads of light ride exactly on the tips of the strokes
const TABLE: { s: number; p: [number, number] }[] = (() => {
  const out: { s: number; p: [number, number] }[] = [];
  let acc = 0;
  let prev = bez(0, 0);
  for (let k = 0; k < 3; k++)
    for (let i = 0; i <= 120; i++) {
      const p = bez(k, i / 120);
      acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      out.push({ s: acc, p });
      prev = p;
    }
  return out.map((o) => ({ s: o.s / acc, p: o.p }));
})();
/** the point at a fraction u of the right half's length (0 at the tip → 1 at the dip) */
const along = (u: number): [number, number] => {
  let lo = 0, hi = TABLE.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (TABLE[mid].s < u) lo = mid;
    else hi = mid;
  }
  return TABLE[hi].p;
};

const HeartArt: React.FC<{ draw: number; fill: number; glow: number }> = ({ draw, fill, glow }) => (
  <svg viewBox="-1.25 -1.25 2.5 2.5" width="100%" height="100%" style={{ overflow: "visible", display: "block" }}>
    <defs>
      <linearGradient id="fz-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6eedb1" />
        <stop offset="0.45" stopColor="#14c96f" />
        <stop offset="1" stopColor="#00924a" />
      </linearGradient>
      <radialGradient id="fz-core" cx="0.5" cy="0.36" r="0.5">
        <stop offset="0" stopColor="rgba(255,255,255,0.35)" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      <linearGradient id="fz-gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,0.75)" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <linearGradient id="fz-line" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#00b85c" />
        <stop offset="1" stopColor="#5fe8a6" />
      </linearGradient>
      <clipPath id="fz-clip">
        <path d={FILL} />
      </clipPath>
      <clipPath id="fz-rise">
        <rect x={-1.3} y={0.98 - 2.0 * fill} width={2.6} height={2.6} />
      </clipPath>
    </defs>
    {/* the fill rises from the tip, with a soft core of light and an even gloss across both lobes */}
    <g clipPath="url(#fz-rise)">
      <path d={FILL} fill="url(#fz-fill)" />
      <g clipPath="url(#fz-clip)">
        <rect x={-1.3} y={-1.3} width={2.6} height={2.6} fill="url(#fz-core)" />
        <ellipse cx={0} cy={-0.78} rx={1.05} ry={0.34} fill="url(#fz-gloss)" opacity={0.55} />
        <path d={FILL} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.05} transform="translate(0 0.035)" />
      </g>
    </g>
    {/* the two strokes, drawn together from the tip */}
    {[1, -1].map((sx) => (
      <path key={sx} d={half(sx)} fill="none" stroke="url(#fz-line)" strokeWidth={0.045} strokeLinecap="round" pathLength={1} strokeDasharray="1 3" strokeDashoffset={1 - draw} opacity={draw > 0.002 ? 1 - 0.6 * fill : 0} />
    ))}
    {/* the two heads of light while they draw */}
    {draw > 0 && draw < 1 &&
      [1, -1].map((sx) => {
        const [px, py] = along(draw);
        return <circle key={sx} cx={px * sx} cy={py} r={0.075} fill="#ffffff" opacity={0.9} style={{ filter: "blur(0.02px)" }} />;
      })}
    {glow > 0 && <path d={FILL} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={0.02} opacity={glow} />}
  </svg>
);

export const Finale: React.FC = () => {
  const f = useCurrentFrame();
  const t = f - STAR;
  // 1 · the point of light glides in from the button
  const glide = io3(clamp01((t + 4) / 12));
  const px = lerp(1290, 960, glide), py = lerp(540, 560 + 0.95 * 230, glide); // it lands on the heart's tip
  // 2 · the strokes draw, 3 · the fill rises, 4 · two beats
  const draw = io3(clamp01((t - 4) / 18));
  const fill = io3(clamp01((t - 16) / 12));
  const beat = (at: number, amp: number) => (t >= at && t < at + 10 ? amp * Math.sin((Math.PI * (t - at)) / 10) : 0);
  const LUB = 28, DUB = 33;
  const pulse = beat(LUB, 0.07) + beat(DUB, 0.05);
  // 5 · into the mark
  const toMark = io3(clamp01((f - (END_HIT - 14)) / 14));
  const cross = clamp01((f - (END_HIT - 6)) / 8);
  const LOGO = 128;
  const WORD = Math.ceil(measure("handly.ro", 134, 700, -0.05)) + 16;
  const word = io3(clamp01((f - (END_HIT + 4)) / 18));
  const badges = io3(clamp01((f - (END_HIT + 16)) / 18));
  const groupW = LOGO + (LOGO * 0.3 + WORD) * word;
  const logoCx = 960 - groupW / 2 + LOGO / 2;
  const groupY = 540 - 52 * badges;
  const S = lerp(230, LOGO * 0.5, toMark) * (1 + pulse);
  const hx = lerp(960, logoCx, toMark), hy = lerp(560, groupY, toMark);
  const settle = Math.min(1, (f - END_HIT) / 20);
  const drift = 1 + 0.03 * clamp01((f - END_HIT) / (TOTAL - END_HIT));
  return (
    <AbsoluteFill style={{ background: t >= 7 ? BG : "transparent" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, rgba(255,255,255,${0.9 * fill}) 0%, rgba(255,255,255,0) 45%)` }} />
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        {/* the point of light before the heart */}
        {draw < 0.15 && t > -4 && (
          <div style={{ position: "absolute", left: px - 14, top: py - 14, width: 28, height: 28, borderRadius: 14, background: "radial-gradient(circle, #ffffff 0%, #7be8b2 45%, rgba(0,191,99,0) 70%)", opacity: clamp01((t + 4) / 4) * (1 - draw / 0.15), transform: `scale(${1 + 0.4 * Math.sin(t / 2)})` }} />
        )}
        {/* a soft shadow on the floor under the heart */}
        <div style={{ position: "absolute", left: hx - S * 0.75, top: hy + S * 1.18, width: S * 1.5, height: S * 0.22, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,40,20,0.16) 0%, rgba(0,40,20,0) 70%)", opacity: fill * (1 - cross), filter: "blur(6px)" }} />
        {/* heart-shaped echoes on the beats and on the landing */}
        {[LUB, DUB, END_HIT - STAR].map((at, i) => {
          const u = clamp01((t - at) / 26);
          if (u <= 0 || u >= 1) return null;
          const R = (i < 2 ? S : LOGO * 0.6) * (1 + 0.9 * io3(u));
          const cx = i < 2 ? hx : logoCx, cy = i < 2 ? hy : groupY;
          return (
            <svg key={i} viewBox="-1.25 -1.25 2.5 2.5" style={{ position: "absolute", left: cx - R * 1.25, top: cy - R * 1.25, width: R * 2.5, height: R * 2.5, overflow: "visible", opacity: (1 - u) * 0.7 }}>
              <path d={FILL} fill="none" stroke="#2fd88a" strokeWidth={0.02 / (1 + 0.9 * io3(u))} />
            </svg>
          );
        })}
        {/* tiny lights thrown out evenly round it on the first beat */}
        {t >= LUB &&
          Array.from({ length: 12 }, (_, i) => {
            const u = clamp01((t - LUB) / 30);
            if (u >= 1) return null;
            const a = (i / 12) * Math.PI * 2;
            const r = S * (1.25 + 1.1 * io3(u));
            return <div key={i} style={{ position: "absolute", left: hx + Math.cos(a) * r - 4, top: hy + Math.sin(a) * r * 0.9 - 4, width: 8, height: 8, borderRadius: 4, background: i % 2 ? "#7be8b2" : "#00bf63", opacity: (1 - u) * 0.9 }} />;
          })}
        {/* the heart */}
        {cross < 1 && draw > 0 && (
          <div style={{ position: "absolute", left: hx - S * 1.25, top: hy - S * 1.25, width: S * 2.5, height: S * 2.5, opacity: 1 - cross, filter: `drop-shadow(0 ${S * 0.08}px ${S * 0.16}px rgba(0,60,30,${0.18 * fill}))` }}>
            <HeartArt draw={draw} fill={fill} glow={beat(LUB, 1) * 0.6} />
          </div>
        )}
        {/* the mark, then handly.ro opening beside it */}
        {cross > 0 && (
          <div style={{ position: "absolute", left: logoCx - LOGO / 2, top: groupY - LOGO / 2, width: groupW + 10, height: LOGO, display: "flex", alignItems: "center" }}>
            <Img src={staticFile("images/logo.webp")} style={{ width: LOGO, height: LOGO, opacity: cross, transform: `scale(${0.92 + 0.08 * cross + 0.04 * Math.sin(Math.PI * settle) * (1 - settle)})` }} />
            <div style={{ overflow: "hidden", marginLeft: LOGO * 0.3 * word, width: WORD * word, flexShrink: 0 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 134, letterSpacing: "-0.05em", color: "#0e1211", lineHeight: 1, transform: `translateX(${(1 - word) * -90}px) translateY(-6px)`, whiteSpace: "nowrap", paddingRight: 8, opacity: word }}>handly.ro</div>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", left: 0, width: 1920, top: 540 + 98, display: "flex", justifyContent: "center", gap: 22, opacity: badges, transform: `translateY(${(1 - badges) * 26}px)`, filter: badges < 1 ? `blur(${(1 - badges) * 6}px)` : undefined }}>
          <StoreBadge store="apple" h={80} shine={clamp01((f - END_HIT - 24) / 20)} />
          <StoreBadge store="google" h={80} shine={clamp01((f - END_HIT - 30) / 20)} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: BG, opacity: io3(clamp01((f - (TOTAL - 14)) / 14)) }} />
    </AbsoluteFill>
  );
};
