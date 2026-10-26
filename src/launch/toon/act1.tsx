import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { FONT } from "../../explainer/theme";
import { AText, AW, Cam, iw, iWords, outExpo, outQuart, r01 } from "../apple";
import { Lawn, Socket } from "../chores";
import { S1_END, S2_END, S3_END, S4_END, S5_END, S6_END, S7_END } from "../introTimes";
import { Logo } from "../kit";
import { w, words } from "../timeline";
import { C, Dust, Grade, Halftone, Head, Rain, Rays, Sparks, SpeedLines, TapHand, ToonPhone } from "./kit";

export const W2 = (key: string, lead = 3) => words(key as "lumea").map(([t, f]) => [t, f - lead] as AW);
export const WHITE = "#f6f3ee";
/** a dark band under the words so they read over any picture */
export const Floor: React.FC<{ a?: number }> = ({ a = 0.75 }) => <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 58%, rgba(0,0,0,${a}) 100%)` }} />;
/** cut flash: a few frames of light at a hard cut */
export const Flash: React.FC<{ at: number; color?: string; len?: number }> = ({ at, color = "255,240,220", len = 6 }) => {
  const f = useCurrentFrame();
  const t = (f - at) / len;
  if (t < 0 || t > 1) return null;
  return <AbsoluteFill style={{ background: `rgba(${color},${0.85 * (1 - t) ** 2})`, mixBlendMode: "screen" }} />;
};
const night = (x = 35, y = 40) => `radial-gradient(ellipse 60% 70% at ${x}% ${y}%, #23474f 0%, ${C.night} 70%, #030809 100%)`;

/** tall grass in cel style: each blade has a shadow side, a lit edge facing the sun, and an ink outline */
const ToonGrass: React.FC<{ f: number; seed: number; n: number; base: number; h: [number, number]; w: number; color: string; lit: string; ink?: boolean; spanX?: [number, number]; seeds?: boolean }> = ({ f, seed, n, base, h, w: bw, color, lit, ink = true, spanX = [-100, 2100], seeds }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    {Array.from({ length: n }, (_, i) => {
      const x = lerp(spanX[0], spanX[1], seeded(i, seed * 11));
      const hh = lerp(h[0], h[1], seeded(i, seed * 13));
      const ww = bw * (0.6 + 0.8 * seeded(i, seed * 17));
      const lean = (seeded(i, seed * 19) - 0.55) * hh * 0.45;
      const sway = Math.sin(f / 18 + i * 0.7 + seed) * hh * 0.06;
      const tx = x + lean + sway, ty = base - hh;
      const cx = x + (lean + sway) * 0.35, cy = base - hh * 0.55;
      const body = `M${x - ww / 2} ${base + 4} Q${cx - ww * 0.3} ${cy} ${tx} ${ty} Q${cx + ww * 0.45} ${cy} ${x + ww / 2} ${base + 4} Z`;
      const edge = `M${x + ww * 0.1} ${base + 4} Q${cx + ww * 0.25} ${cy} ${tx} ${ty} Q${cx + ww * 0.45} ${cy} ${x + ww / 2} ${base + 4} Z`;
      return (
        <g key={i}>
          <path d={body} fill={color} stroke={ink ? C.ink : "none"} strokeWidth={ink ? Math.max(2, ww * 0.12) : 0} strokeLinejoin="round" />
          <path d={edge} fill={lit} opacity={0.75} />
          {seeds && seeded(i, seed * 23) > 0.72 && (
            <g>
              <path d={`M${tx} ${ty} q${ww * 0.1} ${-hh * 0.14} ${ww * 0.5} ${-hh * 0.22}`} fill="none" stroke={C.ink} strokeWidth={Math.max(2, ww * 0.1)} />
              <ellipse cx={tx + ww * 0.5} cy={ty - hh * 0.22} rx={ww * 0.28} ry={ww * 0.8} transform={`rotate(${20 + sway} ${tx + ww * 0.5} ${ty - hh * 0.22})`} fill="#e8b878" stroke={C.ink} strokeWidth={Math.max(2, ww * 0.08)} />
            </g>
          )}
        </g>
      );
    })}
  </svg>
);

// ------------------------------------------------------------------ T1: his eyes in the dark, lit by the phone; fingers pressing his temples
export const T1: React.FC = () => {
  const f = useCurrentFrame();
  const end = S1_END;
  const blink = f > 30 && f < 36 ? 1 - Math.sin(((f - 30) / 6) * Math.PI) : 1;
  const press = r01(f, iw("probleme", 3) - 6, iw("probleme", 3) + 12);
  const look = r01(f, iw("probleme", 6) - 4, iw("probleme", 6) + 8);
  const into = r01(f, end - 14, end, (t) => t * t * t);
  const cam = (fr: number) => {
    const th = r01(fr, end - 14, end, (t) => t * t * t);
    return { s: (1 + 0.1 * clamp01(fr / end)) * (1 + 7 * th), x: lerp(0, -120, th), y: lerp(0, -40, th) };
  };
  const rub = Math.sin(f / 3.5) * 5 * press;
  // two hands rise into frame and press his temples; rotate about the fingertip
  const finger = (side: -1 | 1) => (
    <div style={{ position: "absolute", left: 990 + side * 245 - 201, top: 470 - 51 + (1 - outQuart(press)) * 700, width: 380, height: 608, transformOrigin: "201px 51px", transform: `rotate(${side * -38 + rub * side}deg) scaleX(${side})` }}>
      <TapHand width={380} lit="#9fe0ff" />
    </div>
  );
  return (
    <AbsoluteFill style={{ background: night(70, 30) }}>
      <Cam at={cam} blur={0.6}>
        {/* city lights out of focus behind him */}
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 1300 + seeded(i, 1) * 600, top: 80 + seeded(i, 2) * 500, width: 40 + seeded(i, 3) * 90, height: 40 + seeded(i, 3) * 90, borderRadius: "50%", background: `rgba(${seeded(i, 4) > 0.5 ? "255,180,90" : "120,200,230"},0.18)`, filter: "blur(8px)" }} />
        ))}
        <div style={{ position: "absolute", left: 960 - 520, top: 540 - 236 * 2.6 - 10 }}>
          <Head width={1040} l={{ side: -1, key: C.warm, rim: "#9fe0ff", under: "#8fd0ff", underAmt: 0.8, shade: 0.9 }} e={{ open: 0.62 * blink + (1 - blink) * 0.05, brow: -0.5 + press * 0.3, tired: 1, gy: lerp(10, -4, look), gx: lerp(-4, 0, look), mouth: "flat" }} f={f} neck={false} />
        </div>
        {finger(-1)}
        {finger(1)}
      </Cam>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 40% at 50% 100%, rgba(120,200,255,0.18), rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
      <Floor />
      <AText words={iWords("probleme")} size={62} y={930} color={WHITE} hi={{ 6: C.warmLight, 7: C.warmLight, 8: C.warmLight }} />
      <AbsoluteFill style={{ background: "#000", opacity: into }} />
      <Grade vignette={0.7} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ T2: the socket sparks, the grass grows wild, the boxes wait — three quick shots
export const T2: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S1_END, t1 = iw("iarba", 0) - 6, t2 = iw("dulap", 0) - 6, end = S2_END;
  const spark = iw("priza", 2) - 2;
  const shot = f < t1 ? 0 : f < t2 ? 1 : 2;
  if (shot === 0) {
    const tt = (f - spark) / 22;
    const flash = tt > 0 && tt < 1 ? 1 - tt : 0;
    const pull = r01(f, spark, spark + 8, outExpo);
    const cam = (fr: number) => ({ s: lerp(1.25, 1.05, r01(fr, a0, a0 + 20, outExpo)) * (1 + 0.04 * clamp01((fr - a0) / 30)) + (fr > spark && fr < spark + 6 ? (seeded(fr, 3) - 0.5) * 0.02 : 0), x: 0, y: 0 });
    return (
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 70% at 60% 45%, #2e4c50 0%, #10262b 60%, #050c0e 100%)` }}>
        <Cam at={cam}>
          {/* painted wall texture */}
          <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(95deg, rgba(255,255,255,0.025) 0 3px, rgba(0,0,0,0) 3px 11px)" }} />
          <div style={{ position: "absolute", left: 1180 - 380, top: 520 - 380, filter: `drop-shadow(0 0 ${60 * flash}px rgba(255,170,60,${flash}))` }}>
            <Socket f={f} at={spark} />
          </div>
          <Sparks x={1180 - 120} y={560} t={tt} n={22} len={520} seed={4} />
          <Sparks x={1180 - 120} y={560} t={(f - spark - 9) / 18} n={10} len={300} seed={9} />
          {/* his hand jerks back */}
          <div style={{ position: "absolute", left: 1500 + pull * 260, top: 640 + pull * 200, transform: `rotate(${-70 + pull * 25}deg)`, transformOrigin: "50% 100%" }}>
            <TapHand width={260} lit={C.warmLight} />
          </div>
        </Cam>
        <AbsoluteFill style={{ background: `rgba(255,150,60,${0.35 * flash})`, mixBlendMode: "screen" }} />
        <Floor a={0.6} />
        <AText words={iWords("priza")} size={84} x={120} y={540} align="left" color={WHITE} hi={{ 2: C.warmLight }} />
        <Grade vignette={0.6} warm={flash} />
      </AbsoluteFill>
    );
  }
  if (shot === 1) {
    const T = r01(f, t1, t2, (t) => t);
    const dolly = lerp(0, 1, T);
    return (
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #213650 0%, #6a4a5c 34%, #e0784a 58%, #ffb565 70%, #3a2a1c 100%)", overflow: "hidden" }}>
        {/* the low sun behind the house */}
        <div style={{ position: "absolute", left: 1290 - 150 - dolly * 30, top: 470, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #fff2c8 0%, #ffd27a 40%, rgba(255,170,80,0) 72%)" }} />
        <AbsoluteFill style={{ transform: `translateX(${-dolly * 60}px)` }}>
          {/* the house: a dark shape, its door lit, a small figure standing in it */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path d="M1030 700 L1030 520 L1230 400 L1430 520 L1430 700 Z" fill="#241a1e" stroke={C.ink} strokeWidth={6} />
            <rect x={1300} y={440} width={40} height={70} fill="#241a1e" />
            <rect x={1090} y={560} width={70} height={60} fill="#ffb565" opacity={0.85} />
            <rect x={1205} y={580} width={64} height={120} fill="#ffd27a" />
            <path d="M1226 700 L1226 640 C1226 628 1248 628 1248 640 L1248 700 Z" fill="#1a1216" />
            <circle cx={1237} cy={622} r={10} fill="#1a1216" />
          </svg>
        </AbsoluteFill>
        <AbsoluteFill style={{ transform: `translateX(${-dolly * 140}px)` }}>
          <ToonGrass f={f} seed={1} n={150} base={720} h={[40, 150]} w={14} color="#6b5a3c" lit="#d98e52" ink={false} />
          <ToonGrass f={f} seed={2} n={70} base={800} h={[90, 300]} w={20} color="#4b5a34" lit="#f0a060" seeds />
        </AbsoluteFill>
        {/* the mower, rusting, swallowed by the grass */}
        <AbsoluteFill style={{ transform: `translateX(${-dolly * 260}px)` }}>
          <svg width={460} height={300} viewBox="0 0 460 300" style={{ position: "absolute", left: 380, top: 560 }}>
            <path d="M300 150 L420 20" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
            <path d="M300 150 L420 20" stroke="#8c4a2a" strokeWidth={10} strokeLinecap="round" />
            <path d="M380 46 L450 52" stroke={C.ink} strokeWidth={18} strokeLinecap="round" />
            <path d="M60 140 C70 110 110 96 180 96 L300 100 C330 102 350 120 352 150 L360 200 L40 200 Z" fill="#9c4a26" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
            <path d="M70 140 C80 116 116 106 180 106 L260 108" fill="none" stroke="#ffb06a" strokeWidth={8} opacity={0.8} />
            <path d="M120 150 L150 160 M210 150 L260 170 M300 140 L320 176" stroke="#5a2a16" strokeWidth={7} strokeLinecap="round" />
            <circle cx={90} cy={210} r={42} fill="#1e1a18" stroke={C.ink} strokeWidth={8} />
            <circle cx={310} cy={210} r={42} fill="#1e1a18" stroke={C.ink} strokeWidth={8} />
          </svg>
          <ToonGrass f={f} seed={5} n={120} base={880} h={[60, 170]} w={20} color="#405c30" lit="#ffb565" />
        </AbsoluteFill>
        <Rays x={1300} f={f} a={0.2} />
        <AbsoluteFill style={{ transform: `translateX(${-dolly * 480}px)` }}>
          <ToonGrass f={f} seed={3} n={30} base={1110} h={[380, 900]} w={56} color="#1c3020" lit="#ff9a52" spanX={[-200, 2600]} seeds />
        </AbsoluteFill>
        <Dust f={f} n={34} color="255,214,150" area={[0, 300, 1920, 700]} />
        <AText words={iWords("iarba")} size={88} x={130} y={210} align="left" color={WHITE} />
        <Grade vignette={0.55} warm={0.6} />
      </AbsoluteFill>
    );
  }
  // top-down: the flat-pack boxes on the floor; days and nights sweep across, nothing moves
  const T = (f - t2) / (end - t2);
  const cyc = (f - t2) / 14;
  const day = 0.5 + 0.5 * Math.sin(cyc * Math.PI * 2);
  const days = Math.min(30, Math.max(1, Math.round(30 * r01(f, iw("dulap", 1), iw("dulap", 6) + 4, (t) => t))));
  const cam = (fr: number) => ({ s: 1.18 - 0.12 * r01(fr, t2, end, (t) => t), x: 0, y: 0, r: lerp(-4, 2, r01(fr, t2, end, (t) => t)) });
  return (
    <AbsoluteFill style={{ background: "#1a120c" }}>
      <Cam at={cam}>
        <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, #6b4a32 0 180px, #5e412c 180px 184px)", filter: `brightness(${0.45 + 0.55 * day})` }} />
        <div style={{ position: "absolute", left: 420, top: 180, width: 1080, height: 720, borderRadius: 30, background: "#3a4a52", opacity: 0.85, filter: `brightness(${0.45 + 0.55 * day})` }} />
        {/* the boxes from above */}
        {[[620, 330, 520, 300, -6], [1060, 420, 360, 240, 8], [760, 600, 420, 200, 3]].map(([x, y, w0, h0, r], i) => (
          <div key={i} style={{ position: "absolute", left: x - w0 / 2, top: y - h0 / 2, width: w0, height: h0, transform: `rotate(${r}deg)`, background: "linear-gradient(135deg,#d9ad72,#b98a52)", border: `6px solid ${C.ink}`, boxShadow: `${20 - 40 * day}px 30px 0 rgba(0,0,0,0.35)`, filter: `brightness(${0.5 + 0.5 * day})` }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: "44%", height: "12%", background: "rgba(255,240,200,0.5)" }} />
            <div style={{ position: "absolute", left: 24, top: 20, fontFamily: FONT, fontWeight: 700, fontSize: 30, color: "rgba(70,45,20,0.7)" }}>{i === 0 ? "DULAP · 1/3" : i === 1 ? "2/3" : "3/3"}</div>
          </div>
        ))}
        {/* window light sweeping across: a day per sweep */}
        <AbsoluteFill style={{ background: `linear-gradient(${110 + ((cyc % 1) * 60)}deg, rgba(255,210,140,0) ${10 + (cyc % 1) * 60}%, rgba(255,210,140,${0.35 * day}) ${25 + (cyc % 1) * 60}%, rgba(255,210,140,0) ${45 + (cyc % 1) * 60}%)`, mixBlendMode: "screen" }} />
        <AbsoluteFill style={{ background: `rgba(10,30,60,${0.45 * (1 - day)})` }} />
      </Cam>
      {/* the calendar on the wall: one red X a day */}
      <div style={{ position: "absolute", right: 120, top: 120, width: 330, borderRadius: 26, background: "#fbf8f2", border: `6px solid ${C.ink}`, overflow: "hidden", transform: `rotate(3deg) translateY(${(1 - outQuart((f - t2) / 14)) * -40}px)`, opacity: clamp01((f - t2) / 6) }}>
        <div style={{ background: "#e8463a", color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: "0.1em", padding: "14px 22px" }}>LUNA ASTA</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, padding: 16 }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} style={{ position: "relative", height: 34, fontFamily: FONT, fontWeight: 600, fontSize: 17, color: i < days ? "#b9b4ab" : "#2a2622", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i + 1}
              {i < days && <span style={{ position: "absolute", fontSize: 30, color: "#e8463a", fontWeight: 700, lineHeight: 1 }}>×</span>}
            </div>
          ))}
        </div>
      </div>
      <Floor a={0.7} />
      <AText words={iWords("dulap").slice(0, 3)} size={78} x={120} y={830} align="left" color={WHITE} />
      <AText words={iWords("dulap").slice(3)} size={78} x={120} y={925} align="left" color={WHITE} hi={{ 0: "#ff8a6a" }} />
      <Grade vignette={0.6} />
      <div style={{ display: "none" }}>{T}</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ T3: no time (a clock racing), no tools (one lonely screwdriver), no nerves (his jaw locks)
export const T3: React.FC = () => {
  const f = useCurrentFrame();
  const c1 = iw("timpul", 3) - 5, c2 = iw("sculele", 0) - 5, c3 = iw("nervii", 0) - 5;
  const shot = f < c2 ? 0 : f < c3 ? 1 : 2;
  const L1 = [...iWords("timpul"), ...iWords("sculele")];
  const L2 = iWords("nervii");
  const text = (
    <>
      <Floor a={0.8} />
      <AText words={L1} size={58} y={880} color={WHITE} />
      <AText words={L2} size={58} y={960} color={WHITE} hi={{ 1: "#ff8a6a" }} />
    </>
  );
  if (shot === 0) {
    const a = (f - S2_END) * 0.5;
    const cam = (fr: number) => ({ s: 1.05 + 0.08 * clamp01((fr - S2_END) / 40), x: 0, y: 0, r: Math.sin(fr / 12) * 1.2 });
    return (
      <AbsoluteFill style={{ background: night(50, 40) }}>
        <Cam at={cam}>
          <svg width={1920} height={1080}>
            <defs>
              <radialGradient id="cf">
                <stop offset="0" stopColor="#fff6e6" />
                <stop offset="1" stopColor="#e3cfb0" />
              </radialGradient>
              <Halftone id="ht1" color="#3b2a1e" opacity={0.35} />
            </defs>
            <circle cx={960} cy={470} r={330} fill="url(#cf)" stroke={C.ink} strokeWidth={14} />
            <path d="M960 140 A330 330 0 0 1 1290 470 L960 470 Z" fill="url(#ht1)" />
            {Array.from({ length: 12 }, (_, k) => {
              const t = (k / 12) * Math.PI * 2;
              return <line key={k} x1={960 + Math.sin(t) * 280} y1={470 - Math.cos(t) * 280} x2={960 + Math.sin(t) * 310} y2={470 - Math.cos(t) * 310} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />;
            })}
            {/* hands racing, smeared with motion */}
            {[0, 1, 2, 3, 4].map((k) => (
              <line key={k} x1={960} y1={470} x2={960 + Math.sin(a - k * 0.06) * 250} y2={470 - Math.cos(a - k * 0.06) * 250} stroke={C.ink} strokeWidth={12} strokeLinecap="round" opacity={1 - k * 0.22} />
            ))}
            <line x1={960} y1={470} x2={960 + Math.sin(a / 12) * 170} y2={470 - Math.cos(a / 12) * 170} stroke={C.ink} strokeWidth={18} strokeLinecap="round" />
            <circle cx={960} cy={470} r={16} fill={C.warm} stroke={C.ink} strokeWidth={6} />
          </svg>
        </Cam>
        <Rays x={500} f={f} a={0.12} />
        {text}
        <Grade vignette={0.65} />
      </AbsoluteFill>
    );
  }
  if (shot === 1) {
    const open = outQuart((f - c2) / 12);
    return (
      <AbsoluteFill style={{ background: "#120d0a" }}>
        <Cam at={(fr) => ({ s: 1.12 - 0.08 * clamp01((fr - c2) / 25), x: 0, y: 0 })}>
          <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, #3b2a1e 0 200px, #34251a 200px 204px)" }} />
          {/* the toolbox, open, empty but for one screwdriver */}
          <div style={{ position: "absolute", left: 960 - 520, top: 300, width: 1040, height: 560, borderRadius: 30, background: "linear-gradient(180deg,#c0392b,#8e2b20)", border: `10px solid ${C.ink}` }}>
            <div style={{ position: "absolute", inset: 40, borderRadius: 18, background: "#2a1512", boxShadow: "inset 0 20px 40px rgba(0,0,0,0.6)" }} />
            <svg width={600} height={120} viewBox="0 0 600 120" style={{ position: "absolute", left: 220, top: 230, transform: `rotate(${-8 + open * 4}deg)` }}>
              <rect x={10} y={30} width={230} height={60} rx={28} fill={C.amber} stroke={C.ink} strokeWidth={8} />
              <rect x={240} y={50} width={330} height={20} rx={6} fill="#b8c0c4" stroke={C.ink} strokeWidth={6} />
            </svg>
          </div>
          <div style={{ position: "absolute", left: 960 - 520, top: 300, width: 1040, height: 120, borderRadius: 30, background: "#a63327", border: `10px solid ${C.ink}`, transformOrigin: "50% 0%", transform: `perspective(1400px) rotateX(${open * 115}deg)` }} />
        </Cam>
        <Rays x={960} f={f} a={0.16} />
        {text}
        <Grade vignette={0.7} />
      </AbsoluteFill>
    );
  }
  const clench = r01(f, c3 + 4, c3 + 14);
  const shake = clench > 0.5 ? Math.sin(f * 2.3) * 3 : 0;
  return (
    <AbsoluteFill style={{ background: night(30, 50) }}>
      <Cam at={(fr) => ({ s: 1.0 + 0.1 * clamp01((fr - c3) / 40), x: 0, y: 0 })}>
        <div style={{ position: "absolute", left: 960 - 700 + shake, top: 540 - 330 * 3.5, transform: "rotate(-4deg)" }}>
          <Head width={1400} l={{ side: 1, key: C.warm, rim: "#ff7a4a", shade: 0.95 }} e={{ open: 0.55, brow: 1, tired: 1, mouth: "tight", clench, gx: 3 }} f={f} neck={false} />
        </div>
      </Cam>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 50% at 80% 50%, rgba(255,90,60,${0.18 * clench}), rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
      {text}
      <Grade vignette={0.7} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ T4: his thumb on "Amână", again, and again
const NOTES = ["Repară priza", "Tunde iarba", "Montează dulapul"];
export const T4: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S3_END;
  const arr = [a0 + 2, iw("amani", 1) - 2, iw("amani", 2) + 3];
  const taps = [arr[1] - 6, arr[2] - 6, S4_END - 10];
  const tapK = taps.reduce((m, t) => Math.max(m, Math.sin(Math.PI * clamp01((f - t) / 7))), 0);
  return (
    <AbsoluteFill style={{ background: night(50, 30) }}>
      <Cam at={(fr) => ({ s: 1.0 + 0.08 * clamp01((fr - a0) / 45), x: 0, y: Math.sin(fr / 20) * 4 })}>
        {/* the reflection of his eyes in the glass */}
        <div style={{ position: "absolute", left: 960 - 330, top: -260, opacity: 0.16, filter: "blur(2px)" }}>
          <Head width={660} l={{ side: -1, underAmt: 1 }} e={{ open: 0.5, brow: -0.6, tired: 1, gy: 12 }} f={f} neck={false} />
        </div>
        <div style={{ position: "absolute", left: 960 - 270, top: 120, transform: "rotate(-6deg)" }}>
          <ToonPhone w={540}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#203a44,#0d1b20)" }} />
            {NOTES.map((t, i) => {
              if (f < arr[i]) return null;
              const p = outQuart((f - arr[i]) / 10);
              const depth = arr.filter((a, j) => j > i && f >= a).length;
              return (
                <div key={i} style={{ position: "absolute", left: 24, right: 24, top: 120 + depth * 26 + (1 - p) * -120, height: 150, borderRadius: 34, background: "rgba(250,250,248,0.96)", transform: `scale(${1 - depth * 0.05})`, opacity: clamp01(p * 2) * (1 - depth * 0.3), zIndex: 10 + i, fontFamily: FONT, padding: "22px 26px", boxSizing: "border-box", boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }}>
                  <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "0.08em", color: "#8a8f8d" }}>MEMENTO</div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: "#1d1d1f", marginTop: 4, letterSpacing: "-0.02em" }}>{t}</div>
                  <div style={{ position: "absolute", right: 22, bottom: 22, padding: "10px 22px", borderRadius: 99, background: `rgba(0,0,0,${0.08 + (i === NOTES.length - 1 || depth === 0 ? 0.12 * tapK : 0)})`, fontSize: 24, fontWeight: 700, color: "#1d1d1f" }}>Amână</div>
                </div>
              );
            })}
          </ToonPhone>
        </div>
        <div style={{ position: "absolute", left: 1090, top: 470 - tapK * 40, transform: "rotate(-28deg)" }}>
          <TapHand width={330} lit="#9fe0ff" />
        </div>
      </Cam>
      <Floor />
      <AText words={iWords("amani")} size={70} y={960} color={WHITE} />
      <Grade vignette={0.7} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ T5: on the couch, staring at the ceiling; the chores float around him like bubbles
export const T5: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S4_END, end = S5_END;
  const pop = iw("singur", 2) - 2;
  const rot = lerp(-6, 8, r01(f, a0, end, (t) => t));
  const items = [
    { x: 560, y: 260, s: 1, k: "plug" },
    { x: 1360, y: 300, s: 0.9, k: "grass" },
    { x: 1420, y: 760, s: 1.1, k: "box" },
    { x: 520, y: 760, s: 0.8, k: "drop" },
    { x: 960, y: 170, s: 0.7, k: "bulb" },
  ];
  return (
    <AbsoluteFill style={{ background: "#0d1a1e" }}>
      <Cam at={(fr) => ({ s: 1.08 - 0.06 * r01(fr, a0, end, (t) => t), x: 0, y: 0, r: rot })}>
        {/* the room from above: floorboards past every edge, a rug, the couch, a lamp's warm pool */}
        <div style={{ position: "absolute", left: -400, top: -400, width: 2720, height: 1880, backgroundImage: "repeating-linear-gradient(90deg, #1b2a2e 0 150px, #142125 150px 154px)" }} />
        <div style={{ position: "absolute", left: 960 - 820, top: 540 - 430, width: 1640, height: 860, borderRadius: 40, background: "#28403f", border: `8px solid ${C.ink}`, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 18px, rgba(0,0,0,0) 18px 60px)" }} />
        <div style={{ position: "absolute", left: 960 - 600, top: 540 - 220, width: 1200, height: 440, borderRadius: 64, background: "linear-gradient(180deg,#56688a,#3a4866)", border: `10px solid ${C.ink}`, boxShadow: "30px 40px 0 rgba(0,0,0,0.35)" }} />
        <div style={{ position: "absolute", left: 960 - 600, top: 540 - 220, width: 1200, height: 90, borderRadius: "64px 64px 20px 20px", background: "#2f3b55", borderBottom: `8px solid ${C.ink}` }} />
        <div style={{ position: "absolute", left: 960 - 540, top: 540 - 120, width: 1080, height: 300, borderRadius: 40, background: "#6a7c9c", border: `6px solid ${C.ink}` }} />
        <div style={{ position: "absolute", left: 960 - 16, top: 540 - 120, width: 12, height: 300, background: C.ink, opacity: 0.6 }} />
        {/* him, on his back, the phone face-down on his chest */}
        <svg width={1000} height={300} viewBox="0 0 1000 300" style={{ position: "absolute", left: 960 - 380, top: 540 - 120, overflow: "visible" }}>
          <defs><Halftone id="ht5" color="#141824" opacity={0.4} /></defs>
          <path d="M40 60 C40 30 70 18 110 20 L420 34 C460 36 480 70 480 110 L480 190 C480 230 460 262 420 264 L110 280 C70 282 40 270 40 240 Z" fill={C.hoodie} stroke={C.ink} strokeWidth={8} />
          <path d="M40 160 L480 150 L480 190 C480 230 460 262 420 264 L110 280 C70 282 40 270 40 240 Z" fill="url(#ht5)" />
          <path d="M470 70 L800 78 C820 80 826 100 820 112 L470 128 Z M470 158 L820 166 C826 178 820 200 800 202 L470 214 Z" fill="#283246" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
          <path d="M820 74 C860 70 870 112 836 118 Z M820 160 C860 158 870 202 836 206 Z" fill="#e9e4da" stroke={C.ink} strokeWidth={6} />
          <path d="M120 30 C140 -30 220 -60 300 -70 L310 -40 C240 -30 180 0 170 40 Z" fill={C.hoodie} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
          <circle cx={312} cy={-56} r={24} fill={C.skin} stroke={C.ink} strokeWidth={6} />
          <path d="M150 260 C190 230 250 200 300 180 L330 190 C290 214 240 244 200 284 Z" fill={C.hoodie} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
          <circle cx={320} cy={184} r={24} fill={C.skin} stroke={C.ink} strokeWidth={6} />
          <rect x={260} y={140} width={90} height={56} rx={10} fill="#111417" stroke={C.ink} strokeWidth={6} />
        </svg>
        <div style={{ position: "absolute", left: 960 - 380 - 250, top: 540 - 150 - 4, width: 300, height: 390, transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}>
          <Head width={300} l={{ side: 1, key: C.warm, rim: C.warmLight, shade: 0.85 }} e={{ open: 0.6, brow: -0.6, tired: 1, mouth: "sigh", gy: -2 }} f={f} neck={false} />
        </div>
        {/* side table with a lamp */}
        <div style={{ position: "absolute", left: 220, top: 180, width: 180, height: 180, borderRadius: "50%", background: "#3b2c22", border: `8px solid ${C.ink}` }} />
        <div style={{ position: "absolute", left: 250, top: 210, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,#fff0c8,#ffb764)", border: `6px solid ${C.ink}` }} />
        {/* the chores, floating */}
        {items.map((it, i) => {
          const bob = Math.sin(f / 22 + i * 1.7) * 14;
          const popT = clamp01((f - pop - i * 2) / 8);
          const R = 120 * it.s * (1 + popT * 0.4);
          return (
            <div key={i} style={{ position: "absolute", left: it.x - R, top: it.y - R + bob, width: R * 2, height: R * 2, borderRadius: "50%", opacity: 1 - popT, background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), rgba(160,220,240,0.08) 55%, rgba(160,220,240,0.02) 70%)", border: "3px solid rgba(220,245,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * outQuart((f - a0 - i * 3) / 16)})` }}>
              <svg width={R} height={R} viewBox="0 0 24 24" fill="none" stroke="#e6f6ff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                {it.k === "plug" && <path d="M12 22v-5 M9 8V2 M15 8V2 M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />}
                {it.k === "grass" && <path d="M4 20c1-4 1-8 0-12 M8 20c0-5 2-9 4-13 M12 20c0-5-1-9-3-11 M16 20c0-6 1-9 3-12 M20 20c-1-3-1-7 0-10 M2 20h20" />}
                {it.k === "box" && <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z M12 22V12 M3.3 7l8.7 5 8.7-5" />}
                {it.k === "drop" && <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />}
                {it.k === "bulb" && <path d="M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />}
              </svg>
            </div>
          );
        })}
      </Cam>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 40% 50% at 16% 22%, rgba(255,190,110,0.32), rgba(0,0,0,0) 70%)", mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 70% at 30% 30%, rgba(0,0,0,0) 30%, rgba(2,10,14,0.55) 100%)" }} />
      <Dust f={f} n={30} color="200,235,255" />
      <AText words={[...iWords("speri"), ...iWords("cumva"), ...iWords("singur")]} size={66} y={960} color={WHITE} />
      <Grade vignette={0.65} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ T6: over his shoulder — the contacts, a call that rings out; rain on the window
const PEOPLE = ["Adi", "Andreea", "Bogdan", "Mama", "Radu – vecin", "Tata", "Vlad"];
export const T6: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S5_END, end = S6_END;
  const scroll = r01(f, a0 + 6, w("lumea", 6), (t) => t) * 180;
  const call = w("lumea", 7) - 2;
  const calling = f >= call;
  const noAns = r01(f, w("lumea", 10) - 4, w("lumea", 10) + 6, outQuart);
  const L = W2("lumea");
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#0a1a24,#050b10)" }}>
      <Cam at={(fr) => ({ s: 1.04 + 0.06 * clamp01((fr - a0) / (end - a0)), x: 0, y: 0 })} blur={0.6}>
        {/* the window: rain, city lights melting */}
        <div style={{ position: "absolute", left: 160, top: 60, width: 1600, height: 760, borderRadius: 12, overflow: "hidden", background: "linear-gradient(180deg,#183142,#0a1620)", border: `10px solid ${C.ink}` }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: seeded(i, 1) * 1600, top: 380 + seeded(i, 2) * 360, width: 20 + seeded(i, 3) * 60, height: 20 + seeded(i, 3) * 60, borderRadius: "50%", background: `rgba(${seeded(i, 4) > 0.4 ? "255,190,110" : "130,210,255"},0.4)`, filter: "blur(10px)" }} />
          ))}
          <Rain f={f} n={120} />
        </div>
        {/* his shoulder and head, dark, in the foreground */}
        <svg width={1000} height={700} viewBox="0 0 1000 700" style={{ position: "absolute", left: 1180, top: 440, transform: "scaleX(-1)" }}>
          <path d="M0 700 C40 430 220 330 420 330 C560 330 640 400 700 520 L760 700 Z" fill="#141a22" stroke={C.ink} strokeWidth={10} />
          <circle cx={430} cy={200} r={190} fill="#0f1218" stroke={C.ink} strokeWidth={10} />
          <path d="M280 120 C300 40 420 0 520 40 C600 70 630 150 610 220 C590 160 560 130 520 120 C510 150 480 150 470 120 C450 150 420 150 410 118 C380 150 340 140 330 110 C310 140 290 150 280 120 Z" fill={C.hair} />
          <path d="M600 160 C640 220 640 300 600 360" fill="none" stroke="#7fc8ff" strokeWidth={8} opacity={0.6} />
        </svg>
        <div style={{ position: "absolute", left: 1020, top: 150, transform: "rotate(-4deg)" }}>
          <ToonPhone w={400} glow="rgba(140,210,255,0.4)">
            {!calling ? (
              <div style={{ position: "absolute", inset: 0, fontFamily: FONT, padding: "80px 26px 0", boxSizing: "border-box" }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.03em" }}>Contacte</div>
                <div style={{ position: "absolute", left: 26, right: 26, top: 150, bottom: 0, overflow: "hidden" }}>
                <div style={{ transform: `translateY(${-scroll}px)` }}>
                  {PEOPLE.map((p) => (
                    <div key={p} style={{ height: 76, borderBottom: "1px solid #e4e6e5", display: "flex", alignItems: "center", gap: 14, fontSize: 27, fontWeight: 500, color: "#1d1d1f", background: p === "Tata" && scroll > 150 ? "rgba(0,191,99,0.12)" : undefined }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#b8bfbc", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{p[0]}</div>
                      {p}
                    </div>
                  ))}
                </div>
                </div>
              </div>
            ) : (
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#30404a,#121a1f)", fontFamily: FONT, color: "#fff", textAlign: "center", paddingTop: 150 }}>
                <div style={{ width: 130, height: 130, borderRadius: "50%", margin: "0 auto", background: "#8b9692", fontSize: 54, fontWeight: 700, lineHeight: "130px" }}>T</div>
                <div style={{ fontSize: 40, fontWeight: 700, marginTop: 26 }}>Tata</div>
                <div style={{ fontSize: 26, marginTop: 10, color: noAns > 0.5 ? "#ff6b5e" : "#c8d2ce" }}>{noAns > 0.5 ? "Nu răspunde" : "Se apelează…"}</div>
                <div style={{ position: "absolute", top: 420, left: "50%", marginLeft: -45, width: 90, height: 90, borderRadius: "50%", background: "#ff453a" }} />
              </div>
            )}
          </ToonPhone>
        </div>
      </Cam>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)" }} />
      <AText words={L.slice(0, 6)} size={64} x={130} y={800} align="left" color={WHITE} />
      <AText words={L.slice(6)} size={64} x={130} y={886} align="left" color={WHITE} hi={{ 1: C.greenLight }} />
      <Grade vignette={0.65} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ T7: three phones on the table, like three lanes of a race — searching, calling, haggling
export const T7: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S6_END;
  const ats = [w("obositor", 4) - 6, w("obositor", 6) - 6, w("obositor", 8) - 6];
  const on = (i: number) => r01(f, ats[i], ats[i] + 8, outQuart);
  const L = W2("obositor");
  const lanes = [500, 960, 1420];
  return (
    <AbsoluteFill style={{ background: "#100c09" }}>
      <Cam at={(fr) => ({ s: 1.1 - 0.06 * clamp01((fr - a0) / 100), x: 0, y: 0, r: -2 })}>
        <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, #2e2219 0 160px, #281d15 160px 163px)" }} />
        {/* lane ropes between the phones */}
        {[730, 1190].map((x) => (
          <div key={x} style={{ position: "absolute", left: x - 8, top: -40, width: 16, height: 1160, backgroundImage: `repeating-linear-gradient(180deg, ${C.green} 0 26px, #f2f2f2 26px 52px)`, opacity: 0.55 }} />
        ))}
        {lanes.map((x, i) => (
          <div key={i} style={{ position: "absolute", left: x - 200, top: 90, filter: `brightness(${0.45 + 0.55 * on(i)})`, transform: `translateY(${(1 - on(i)) * 30}px)` }}>
            <ToonPhone w={400} glow={`rgba(150,210,255,${0.45 * on(i)})`}>
              <div style={{ position: "absolute", inset: 0, fontFamily: FONT, padding: "70px 20px 0", boxSizing: "border-box", color: "#1d1d1f" }}>
                {i === 0 &&
                  ["Electrician Non-Stop", "Meșter Priză 24/7", "Reparații Rapide", "Electrician Ionuț", "Meseriași de Top"].map((t, k) => (
                    <div key={t} style={{ height: 82, borderBottom: "1px solid #e5e7e6", transform: `translateY(${-r01(f, ats[0], ats[1], (q) => q) * 160}px)` }}>
                      <div style={{ fontSize: 22, fontWeight: 700, paddingTop: 16 }}>{t}</div>
                      <div style={{ fontSize: 17, color: "#8a8f8d" }}>{"★".repeat(3 + (k % 3))} · {9 + k * 6} recenzii</div>
                    </div>
                  ))}
                {i === 1 && (
                  <div style={{ textAlign: "center", paddingTop: 80 }}>
                    <div style={{ width: 110, height: 110, borderRadius: "50%", margin: "0 auto", background: "#a3aba8" }} />
                    <div style={{ fontSize: 30, fontWeight: 700, marginTop: 20 }}>Meșter Ionel</div>
                    <div style={{ fontSize: 21, marginTop: 8, color: f > ats[1] + 24 ? "#e8463a" : "#8a8f8d" }}>{f > ats[1] + 24 ? "Nu răspunde" : "Se apelează…"}</div>
                  </div>
                )}
                {i === 2 &&
                  [["Cât costă?", 1], ["450 lei + deplasare", 0], ["Cam mult…", 1], ["Hai 400, ultimul preț", 0]].map(([t, me], k) => (
                    <div key={k} style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginTop: 14, opacity: clamp01((f - ats[2] - 4 - k * 6) / 4) }}>
                      <div style={{ padding: "12px 18px", borderRadius: 22, background: me ? C.green : "#e7e9e8", color: me ? "#fff" : "#1d1d1f", fontSize: 20, fontWeight: 600, maxWidth: 230 }}>{t as string}</div>
                    </div>
                  ))}
              </div>
            </ToonPhone>
          </div>
        ))}
      </Cam>
      <SpeedLines x={960} y={540} a={0.18 * Math.max(...[0, 1, 2].map((i) => Math.sin(Math.PI * clamp01((f - ats[i]) / 8))))} f={f} />
      <Floor a={0.8} />
      <AText words={L} size={60} y={960} color={WHITE} hi={{ 4: C.amber, 6: C.amber, 8: C.amber }} />
      <Grade vignette={0.6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ T8: a stranger in the doorway takes the money, grins, and is gone; the door slams
/** his hand from the lower left, the bills pinched under the thumb */
const MoneyHand: React.FC<{ w?: number }> = ({ w = 560 }) => (
  <svg width={w} height={w * 0.6} viewBox="0 0 560 336" style={{ overflow: "visible" }}>
    <path d="M-40 336 L-40 190 C40 170 150 160 230 168 L250 280 C170 300 60 330 -40 336 Z" fill={C.hoodie} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M-40 270 C60 260 160 250 245 252 L250 280 C170 300 60 330 -40 336 Z" fill={C.hoodieShade} />
    {[[0, -10], [14, -4], [28, 2]].map(([dx, r], i) => (
      <g key={i} transform={`translate(${300 + dx} ${150 - i * 6}) rotate(${r - 14})`}>
        <rect x={0} y={-34} width={210} height={92} rx={6} fill={["#5f9a6a", "#6fae78", "#82c08a"][i]} stroke={C.ink} strokeWidth={6} />
        {i === 2 && <text x={150} y={26} fontFamily={FONT} fontWeight={700} fontSize={38} fill="#1d3a24">100</text>}
        {i === 2 && <circle cx={60} cy={12} r={24} fill="none" stroke="#1d3a24" strokeWidth={4} opacity={0.6} />}
      </g>
    ))}
    <path d="M226 170 C250 140 300 132 340 146 C372 158 380 196 362 226 C344 256 300 270 256 266 C236 264 224 250 222 232 Z" fill={C.skin} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M300 150 C330 138 372 140 392 156 C402 166 394 180 380 180 C356 178 330 176 306 182 Z" fill={C.skinLit} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M250 240 C280 250 320 248 350 232 M246 212 C278 222 318 220 352 204" fill="none" stroke={C.skinDeep} strokeWidth={4} strokeLinecap="round" />
    <path d="M232 178 C256 150 300 142 338 152" fill="none" stroke={C.warmLight} strokeWidth={6} opacity={0.8} />
  </svg>
);
export const T8: React.FC<{ end: number }> = ({ end }) => {
  const f = useCurrentFrame();
  const a0 = S7_END;
  const give = w("rogi", 5) - 4;
  const grin = w("rogi", 9) - 2;
  const gone = w("rogi", 11) - 6;
  const slam = w("rogi", 11) + 4;
  const g = outQuart((f - give) / 12);
  const leave = r01(f, gone, gone + 10);
  const door = r01(f, slam - 4, slam, (t) => t * t);
  const L = W2("rogi");
  const shake = f >= slam && f < slam + 10 ? (seeded(f, 2) - 0.5) * 20 : 0;
  const DX = 980; // the doorway's left edge
  return (
    <AbsoluteFill style={{ background: "#0a0706" }}>
      <Cam at={(fr) => ({ s: 1.05 + 0.08 * clamp01((fr - a0) / 90), x: shake, y: 0 })}>
        {/* the hall wall, the hot light behind the stranger */}
        <AbsoluteFill style={{ background: "linear-gradient(90deg, #120c0a 0%, #2a1a12 70%, #1a110c 100%)" }} />
        <div style={{ position: "absolute", left: DX + 20, top: 110, width: 640, height: 900, background: `linear-gradient(180deg,#ffcf8a,#ff8a3c)`, boxShadow: "0 0 220px rgba(255,150,70,0.6)", opacity: 1 - door }} />
        {/* the light spilling across the floor */}
        <div style={{ position: "absolute", left: DX - 500, top: 1010, width: 1200, height: 120, background: "linear-gradient(90deg, rgba(255,160,80,0), rgba(255,160,80,0.35))", clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0 100%)", opacity: 1 - door }} />
        <svg width={640} height={900} viewBox="0 0 640 900" style={{ position: "absolute", left: DX + 20, top: 110, overflow: "visible", transform: `translateX(${leave * 420}px)`, opacity: (1 - leave) * (1 - door) }}>
          <path d="M140 900 C150 640 210 520 320 520 C430 520 490 640 500 900 Z" fill="#120c0a" />
          <circle cx={320} cy={400} r={110} fill="#120c0a" />
          <path d="M200 360 C210 280 430 280 440 360 L520 372 L520 392 L200 390 Z" fill="#120c0a" />
          <path d={`M270 440 Q320 ${470 + 18 * clamp01((f - grin) / 6)} 370 440`} fill="none" stroke="#f3e6d2" strokeWidth={8} strokeLinecap="round" opacity={clamp01((f - grin) / 5)} />
          <circle cx={290} cy={404} r={6} fill="#f3e6d2" opacity={0.35 * clamp01((f - grin) / 5)} />
          <circle cx={352} cy={404} r={6} fill="#f3e6d2" opacity={0.35 * clamp01((f - grin) / 5)} />
          {/* his arm reaching out for the cash */}
          <path d={`M180 640 C120 ${660 - 40 * g} ${60 - 40 * g} ${640 - 30 * g} ${10 - 60 * g} ${620 - 20 * g} L${0 - 60 * g} ${670 - 20 * g} C60 690 120 700 170 700 Z`} fill="#120c0a" />
        </svg>
        <div style={{ position: "absolute", left: DX - 640 + g * 120, top: 600 - g * 40, transform: `rotate(${-6 + g * 4}deg)`, opacity: 1 - leave }}>
          <MoneyHand w={620} />
        </div>
        <div style={{ position: "absolute", left: DX, top: 90, width: 680, height: 940, border: `22px solid #1b1310`, borderBottom: "none" }} />
        <div style={{ position: "absolute", left: DX, top: 90, width: 680 * door, height: 940, background: "#1b1310", borderRight: `10px solid ${C.ink}` }} />
      </Cam>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 60% at 68% 50%, rgba(255,130,60,${0.25 * (1 - door)}), rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 45%)" }} />
      <AText words={L.slice(0, 5)} size={64} x={120} y={250} align="left" color={WHITE} />
      <AText words={L.slice(5, 9)} size={64} x={120} y={336} align="left" color={WHITE} />
      <AText words={L.slice(9)} size={64} x={120} y={422} align="left" color={WHITE} hi={{ 2: "#ff6b5e" }} />
      <AbsoluteFill style={{ background: "#000", opacity: r01(f, end - 6, end) }} />
      <Grade vignette={0.7} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ T9 (over the start of the charge): his finger on the Handly icon; green floods the frame
export const T9: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const touch = from + 10;
  const p = outQuart((f - from) / 10);
  const burst = clamp01((f - touch) / 16);
  const out = r01(f, touch + 6, touch + 18);
  if (f > touch + 20) return null;
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <AbsoluteFill style={{ background: "#03100a" }} />
      <div style={{ position: "absolute", left: 960 - 160, top: 540 - 160, width: 320, height: 320, borderRadius: 74, background: "linear-gradient(160deg,#3ff09a,#00a856)", border: `8px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${(0.9 + 0.1 * p) * (1 - 0.06 * Math.sin(Math.PI * clamp01((f - touch) / 6)))})`, boxShadow: `0 0 ${80 + 300 * burst}px rgba(0,191,99,${0.5 + 0.5 * burst})` }}>
        <Logo size={200} tone="white" />
      </div>
      <div style={{ position: "absolute", left: 1010, top: 560 + (1 - clamp01((f - from) / 10)) * 300, transform: "rotate(-22deg)" }}>
        <TapHand width={300} lit={C.greenLight} />
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(93,240,165,${burst}) 0%, rgba(0,191,99,${0.8 * burst}) ${20 + 60 * burst}%, rgba(0,0,0,0) ${30 + 80 * burst}%)`, mixBlendMode: "screen" }} />
      <SpeedLines x={960} y={540} a={burst * (1 - out)} f={f} color="180,255,210" />
    </AbsoluteFill>
  );
};
