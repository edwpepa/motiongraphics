import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, lerp, seeded } from "../explainer/lib/anim";
import { AText, Cam, INK, iw, iWords, outExpo, outQuart, r01 } from "./apple";
import { S1_END, S2_END } from "./introTimes";

// ------------------------------------------------------------------ S2: product shots of three chores — a broken socket, an overgrown lawn, a cabinet still in its box
const SHOT = 1920;

/** a seamless studio backdrop with a soft floor shadow, like a product page */
const Studio: React.FC<{ x: number; tone: [string, string] }> = ({ x, tone }) => (
  <div style={{ position: "absolute", left: x, top: 0, width: SHOT, height: 1080, background: `radial-gradient(ellipse 70% 75% at 62% 42%, ${tone[0]} 0%, ${tone[1]} 100%)` }} />
);

// ---------------------------------------------------------------- the socket: a white plate hanging crooked, cracked and scorched, still sparking
const Socket: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const sp = (k: number) => {
    const period = 17 + k * 5;
    const t = ((f - at + k * 7) % period) / 6;
    return t >= 0 && t <= 1 ? t : -1;
  };
  return (
    <svg width={760} height={760} viewBox="0 0 600 600" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="plate" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3e6e4" />
        </linearGradient>
        <radialGradient id="insert" cx="0.45" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9dddb" />
        </radialGradient>
        <radialGradient id="hole" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#111" />
          <stop offset="1" stopColor="#3a3d3c" />
        </radialGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa19e" />
          <stop offset="0.5" stopColor="#f2f4f3" />
          <stop offset="1" stopColor="#8d9491" />
        </linearGradient>
        <radialGradient id="scorch" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(40,25,10,0.75)" />
          <stop offset="0.5" stopColor="rgba(70,45,20,0.3)" />
          <stop offset="1" stopColor="rgba(70,45,20,0)" />
        </radialGradient>
        <radialGradient id="spark" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(255,255,255,1)" />
          <stop offset="0.25" stopColor="rgba(255,226,140,0.9)" />
          <stop offset="1" stopColor="rgba(255,170,40,0)" />
        </radialGradient>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      {/* the hole in the wall it came loose from */}
      <rect x="135" y="135" width="330" height="330" rx="40" fill="rgba(80,70,60,0.18)" filter="url(#soft)" />
      <g transform="rotate(8 300 300) translate(0 14)">
        <rect x="58" y="78" width="484" height="484" rx="92" fill="rgba(0,0,0,0.28)" filter="url(#soft)" />
        <rect x="50" y="50" width="500" height="500" rx="92" fill="url(#plate)" />
        <rect x="50" y="50" width="500" height="500" rx="92" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
        <rect x="50" y="50" width="500" height="500" rx="92" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="172" fill="url(#insert)" />
        <circle cx="300" cy="300" r="172" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="2" />
        <circle cx="300" cy="300" r="176" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
        <rect x="282" y="140" width="36" height="34" rx="6" fill="url(#metal)" />
        <rect x="282" y="426" width="36" height="34" rx="6" fill="url(#metal)" />
        <circle cx="300" cy="300" r="120" fill="url(#scorch)" transform="translate(-62 -12)" />
        <circle cx="236" cy="300" r="27" fill="url(#hole)" />
        <circle cx="364" cy="300" r="27" fill="url(#hole)" />
        {/* the crack */}
        <path d="M548 120 L470 168 L488 196 L410 238 L428 262 L372 286" fill="none" stroke="#5d625f" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M470 168 L452 140 M410 238 L392 214" fill="none" stroke="#7d827f" strokeWidth="2" strokeLinecap="round" />
        {/* screws: one still in, one gone */}
        <circle cx="300" cy="96" r="14" fill="url(#metal)" />
        <path d="M290 96h20" stroke="#6f7673" strokeWidth="3" />
        <circle cx="300" cy="504" r="12" fill="#cfd3d1" />
        <circle cx="300" cy="504" r="6" fill="#8b918e" />
      </g>
      {/* sparks out of the left hole */}
      {[0, 1, 2].map((k) => {
        const t = sp(k);
        if (t < 0) return null;
        const cx = 236 - 20, cy = 330 + 20;
        return (
          <g key={k} opacity={1 - t}>
            <circle cx={cx} cy={cy} r={40 + 50 * t} fill="url(#spark)" />
            {Array.from({ length: 7 }, (_, j) => {
              const a = -2.6 + j * 0.42 + seeded(k * 9 + j, 3) * 0.3;
              const l0 = 20 + 120 * t, l1 = l0 + 30 + 40 * seeded(j, k);
              return <line key={j} x1={cx + Math.cos(a) * l0} y1={cy + Math.sin(a) * l0 + 60 * t * t} x2={cx + Math.cos(a) * l1} y2={cy + Math.sin(a) * l1 + 60 * t * t} stroke="#ffe7a3" strokeWidth={3.5 - 2 * t} strokeLinecap="round" />;
            })}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- the lawn: grown far too long, swaying, a few dandelions gone to seed
const BLADES = Array.from({ length: 420 }, (_, i) => {
  const x = seeded(i, 1) * 1500 - 40;
  const h = 260 + seeded(i, 2) * 380;
  const depth = seeded(i, 3);
  return { x, h: h * (0.65 + 0.35 * depth), lean: (seeded(i, 4) - 0.5) * 120, w: 7 + 9 * depth, depth, ph: seeded(i, 5) * 6.28 };
}).sort((a, b) => a.depth - b.depth);
const Lawn: React.FC<{ f: number }> = ({ f }) => {
  const g = (d: number) => {
    const a = [24 + 40 * d, 92 + 70 * d, 44 + 40 * d];
    const b = [110 + 70 * d, 188 + 40 * d, 92 + 40 * d];
    return [`rgb(${a.join(",")})`, `rgb(${b.join(",")})`];
  };
  return (
    <svg width={1500} height={760} viewBox="0 0 1500 760" style={{ overflow: "visible" }}>
      <defs>
        {[0, 1, 2, 3].map((k) => {
          const [a, b] = g(k / 3);
          return (
            <linearGradient key={k} id={`bl${k}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          );
        })}
        <radialGradient id="puff" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(255,255,255,1)" />
          <stop offset="0.7" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="750" cy="740" rx="800" ry="50" fill="rgba(30,60,35,0.35)" />
      {BLADES.map((b, i) => {
        const sway = Math.sin(f / 16 + b.ph + b.x * 0.004) * 18 * (0.5 + b.depth);
        const tipX = b.x + b.lean + sway, tipY = 740 - b.h;
        const cx = b.x + b.lean * 0.3 + sway * 0.4, cy = 740 - b.h * 0.55;
        return <path key={i} d={`M${b.x - b.w / 2} 742 Q ${cx} ${cy} ${tipX} ${tipY} Q ${cx + b.w * 0.3} ${cy} ${b.x + b.w / 2} 742 Z`} fill={`url(#bl${Math.round(b.depth * 3)})`} />;
      })}
      {[[260, 300], [720, 230], [1130, 330]].map(([x, h], i) => {
        const sway = Math.sin(f / 18 + i * 2) * 14;
        return (
          <g key={i}>
            <path d={`M${x} 742 Q ${x + sway * 0.5} ${742 - h * 0.5} ${x + sway} ${742 - h}`} stroke="#5f8f55" strokeWidth="5" fill="none" />
            <circle cx={x + sway} cy={742 - h} r="44" fill="url(#puff)" />
            {Array.from({ length: 14 }, (_, j) => {
              const a = (j / 14) * 6.283;
              return <line key={j} x1={x + sway} y1={742 - h} x2={x + sway + Math.cos(a) * 38} y2={742 - h + Math.sin(a) * 38} stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />;
            })}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- the cabinet: still in its box, a panel against the wall, a calendar crossing off the days
const Cabinet: React.FC<{ f: number; days: number }> = ({ f, days }) => (
  <svg width={1500} height={860} viewBox="0 0 1500 860" style={{ overflow: "visible" }}>
    <defs>
      <linearGradient id="kTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e2bf8a" />
        <stop offset="1" stopColor="#d2ab72" />
      </linearGradient>
      <linearGradient id="kLeft" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#c99d62" />
        <stop offset="1" stopColor="#b98c53" />
      </linearGradient>
      <linearGradient id="kRight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a87b45" />
        <stop offset="1" stopColor="#966b38" />
      </linearGradient>
      <linearGradient id="board" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f4f2ee" />
        <stop offset="1" stopColor="#dedad3" />
      </linearGradient>
      <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="22" />
      </filter>
    </defs>
    {/* the calendar on the wall */}
    <g transform="translate(1040 40)">
      <rect x="6" y="14" width="380" height="410" rx="26" fill="rgba(0,0,0,0.18)" filter="url(#sh)" />
      <rect width="380" height="410" rx="26" fill="#ffffff" />
      <path d="M0 26a26 26 0 0 1 26-26h328a26 26 0 0 1 26 26v62H0z" fill="#ff453a" />
      <text x="190" y="62" textAnchor="middle" fontFamily="Inter" fontWeight="600" fontSize="34" fill="#fff" letterSpacing="2">LUNA ASTA</text>
      {Array.from({ length: 30 }, (_, i) => {
        const cx = 34 + (i % 7) * 52, cy = 128 + Math.floor(i / 7) * 62;
        const on = i < days;
        return (
          <g key={i}>
            <text x={cx} y={cy + 8} textAnchor="middle" fontFamily="Inter" fontWeight="500" fontSize="22" fill={on ? "#b6b9b8" : "#1d1d1f"}>
              {i + 1}
            </text>
            {on && <path d={`M${cx - 15} ${cy - 13} L${cx + 15} ${cy + 15} M${cx + 15} ${cy - 13} L${cx - 15} ${cy + 15}`} stroke="#ff453a" strokeWidth="3.4" strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
    {/* floor shadow */}
    <ellipse cx="620" cy="800" rx="560" ry="46" fill="rgba(60,40,20,0.3)" filter="url(#sh)" />
    {/* a white panel leaning on the wall */}
    <polygon points="140,800 230,250 290,250 214,800" fill="url(#board)" />
    <polygon points="214,800 290,250 300,252 226,800" fill="#c9c4bb" />
    {/* the box */}
    <polygon points="330,430 640,320 980,410 670,530" fill="url(#kTop)" />
    <polygon points="330,430 670,530 670,810 330,700" fill="url(#kLeft)" />
    <polygon points="670,530 980,410 980,690 670,810" fill="url(#kRight)" />
    {/* tape */}
    <polygon points="485,375 795,475 825,465 515,364" fill="rgba(255,240,210,0.55)" />
    <polygon points="485,375 515,364 515,520 485,530" fill="rgba(255,240,210,0.35)" transform="translate(185 106)" />
    {/* printed marks: this side up, fragile */}
    <g stroke="#5a3f20" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75">
      <path d="M420 640 L420 580 M402 598 L420 580 L438 598" />
      <path d="M470 660 L470 600 M452 618 L470 600 L488 618" />
    </g>
    <text x="800" y="620" fontFamily="Inter" fontWeight="700" fontSize="44" fill="#5a3f20" opacity="0.7" transform="skewY(-20) translate(0 300)">
      MONTAJ
    </text>
    {/* a bag of screws and the allen key, waiting */}
    <g transform="translate(1010 690)">
      <rect width="120" height="90" rx="14" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.12)" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={18 + (i % 3) * 30} y={18 + Math.floor(i / 3) * 22} width="18" height="7" rx="3" fill="#8f9693" transform={`rotate(${(i * 37) % 60 - 30} ${27 + (i % 3) * 30} ${21 + Math.floor(i / 3) * 22})`} />
      ))}
      <path d="M150 80 L150 20 L190 20" stroke="#5c6461" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
    {/* dust settling on the lid */}
    {Array.from({ length: 30 }, (_, i) => (
      <circle key={i} cx={420 + seeded(i, 1) * 480} cy={360 + seeded(i, 2) * 120 + Math.sin(f / 20 + i) * 3} r={1.4 + seeded(i, 3) * 2} fill="rgba(255,255,255,0.5)" />
    ))}
  </svg>
);

export const S2: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S1_END;
  const t1 = iw("iarba", 0) - 7, t2 = iw("dulap", 0) - 7;
  const cam = (fr: number) => {
    const p1 = r01(fr, t1, t1 + 10), p2 = r01(fr, t2, t2 + 10);
    const intro = r01(fr, a0 - 2, a0 + 16, outExpo);
    const shot = fr < t1 ? a0 : fr < t2 ? t1 : t2;
    return { s: lerp(1.5, 1, intro) * (1 + 0.05 * clamp01((fr - shot) / 70)), x: (p1 + p2) * SHOT, y: 0 };
  };
  const out = r01(f, S2_END - 10, S2_END, (t) => t * t);
  const days = Math.round(30 * r01(f, iw("dulap", 1), iw("dulap", 6) + 4, (t) => t));
  const shotIn = (at: number) => {
    const p = outQuart((f - at) / 22);
    return { opacity: clamp01((f - at + 4) / 6), transform: `translateY(${(1 - p) * 60}px) scale(${0.94 + 0.06 * p})` };
  };
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 18}px)` : undefined }}>
      <Cam at={cam} blur={1.4}>
        <Studio x={0} tone={["#fbfaf8", "#e7e4df"]} />
        <Studio x={SHOT} tone={["#f4f8f2", "#dfe7dc"]} />
        <Studio x={SHOT * 2} tone={["#faf8f5", "#e8e3dc"]} />
        {/* socket */}
        <div style={{ position: "absolute", left: 1260 - 380, top: 520 - 380, ...shotIn(a0 - 6) }}>
          <Socket f={f} at={iw("priza", 2)} />
        </div>
        <AText words={iWords("priza")} size={84} x={130} y={540} align="left" color={INK} hi={{ 2: "#e0821c" }} />
        {/* lawn */}
        <div style={{ position: "absolute", left: SHOT + 420, top: 1080 - 760 - 40, ...shotIn(t1 - 2) }}>
          <Lawn f={f} />
        </div>
        <AText words={iWords("iarba")} size={92} x={SHOT + 140} y={260} align="left" color={INK} hi={{ 1: "#2f9a4c" }} />
        {/* cabinet */}
        <div style={{ position: "absolute", left: SHOT * 2 + 300, top: 140, ...shotIn(t2 - 2) }}>
          <Cabinet f={f} days={days} />
        </div>
        <AText words={iWords("dulap").slice(0, 3)} size={84} x={SHOT * 2 + 140} y={160} align="left" color={INK} />
        <AText words={iWords("dulap").slice(3)} size={84} x={SHOT * 2 + 140} y={260} align="left" color={INK} hi={{ 0: "#c0392b" }} />
      </Cam>
    </AbsoluteFill>
  );
};
