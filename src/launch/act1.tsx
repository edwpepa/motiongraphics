import React from "react";
import { A10_END, A12_END, A1_END, A2_END, A3_END, A5_END, A6_END, A7_END, A8_END, A9_END } from "./scenes";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { textWidth } from "../explainer/components/AppleText";
import { Avatar } from "../explainer/components/Avatar";
import { Glyph } from "../explainer/components/Icons";
import { clamp01, ease, lerp, seeded } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { Bg, GREEN_GRAD, GREEN_INK, Label, Logo, MINT_INK, P, Shape, Txt, io } from "./kit";
import { blob, mix, morphNamed, shape } from "./morph";
import { DROP, F, kw, pEnd, pStart, w } from "./timeline";

const CX = 960;
const CY = 540;
const BEAT_PRE = 0.4812 * 30; // the muffled verse's beat, in frames

// ------------------------------------------------------------------ A1: the weight of it all — a sheet full of postponed chores
const SHEET = [
  "Robinet care curge", "Perete de zugrăvit", "Dulap de montat", "Priză defectă", "Bec ars în hol", "Ușă care scârțâie",
  "Gresie crăpată", "Chiuvetă înfundată", "Calorifer rece", "Jaluzele rupte", "Mașina de spălat", "Raft de pus",
  "Silicon la cadă", "Fereastră blocată", "Tablou de agățat", "Balcon de curățat", "Yală care se blochează", "Lustră de montat",
  "Parchet zgâriat", "Hotă de schimbat", "Mutat mobila", "Curățenie generală", "Faianță desprinsă", "TV pe perete",
  "Sertar stricat", "Gard de vopsit", "Iarba de tuns", "Boiler care curge", "Pervaz umflat", "Ușă de reglat",
  "Cablu de ascuns", "Rafturi în cămară", "Gaură în perete", "Becuri în baie", "Robinet în curte", "Plintă desprinsă",
];
const COLS_S = 6;
const TW = 420;
const TH = 156;
const GAP = 30;

const Tile: React.FC<{ text: string; i: number; a: number }> = ({ text, i, a }) => {
  const days = 3 + Math.floor(seeded(i, 9) * 88);
  return (
    <div
      style={{
        width: TW,
        height: TH,
        borderRadius: 30,
        background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
        border: "1.5px solid rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 28px",
        opacity: a,
        transform: `translateY(${(1 - a) * 40}px)`,
        fontFamily: FONT,
        fontWeight: BOLD,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 20, border: "3px solid rgba(255,255,255,0.35)", flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 31, color: "#fff", letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{text}</div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginTop: 6 }}>{`Amânat de ${days} zile`}</div>
      </div>
    </div>
  );
};

export const A1: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = Math.ceil(SHEET.length / COLS_S);
  const SW = COLS_S * TW + (COLS_S - 1) * GAP;
  const SH = rows * TH + (rows - 1) * GAP;
  // the camera glides low across the sheet, then lifts and races along it on "câte avem pe cap"
  const t = frame / A1_END;
  const lift = ease.inOutCubic(clamp01((frame - (w("cap", 0) - 10)) / 40));
  const camX = lerp(SW * 0.28, -SW * 0.22, ease.inOutCubic(t));
  const camY = lerp(SH * 0.18, -SH * 0.05, t);
  const camZ = lerp(420, -260, lift) + 60 * Math.sin(frame / 40);
  const tiltX = lerp(58, 44, lift);
  const rotZ = lerp(-16, -9, t);
  const wipe = ease.inOutCubic(clamp01((frame - (A1_END - 14)) / 16));
  const fadeIn = clamp01(frame / 10);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <AbsoluteFill style={{ perspective: 1500, opacity: fadeIn }}>
        <div
          style={{
            position: "absolute",
            left: CX - SW / 2,
            top: CY - SH / 2,
            width: SW,
            height: SH,
            transformStyle: "preserve-3d",
            transform: `translateY(120px) rotateX(${tiltX}deg) rotateZ(${rotZ}deg) translate3d(${camX}px, ${camY}px, ${camZ}px)`,
            display: "grid",
            gridTemplateColumns: `repeat(${COLS_S}, ${TW}px)`,
            gap: GAP,
          }}
        >
          {SHEET.map((c, i) => {
            const r = Math.floor(i / COLS_S);
            const col = i % COLS_S;
            const a = ease.outCubic(clamp01((frame - 2 - (r + col) * 1.6) / 14));
            return <Tile key={i} text={c} i={i} a={a} />;
          })}
        </div>
      </AbsoluteFill>
      {/* fog: far tiles melt into the dark, the top stays clean for the words */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #060807 0%, rgba(6,8,7,0.92) 22%, rgba(6,8,7,0) 52%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 70% at 50% 65%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)" }} />
      <Txt words={kw("of")} size={84} on="black" y={150} out={w("cap", 0) - 8} />
      <Txt words={kw("cap", { color: { 3: MINT_INK } })} size={96} on="black" y={150} out={A1_END - 10} />
      {/* deep green opens up from the centre into the next scene */}
      {wipe > 0 && <Shape pts={shape("circle")} x={CX + 430} y={CY + 20} size={60 + 2800 * wipe} fill={P.deep} />}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A2: the dripping tap

export const A2: React.FC = () => {
  const frame = useCurrentFrame();
  const DX = CX + 430;
  const DY = CY + 10;
  const R = 300;
  const FLOOR = CY + 330;
  const t0 = A1_END;
  const drips = Array.from({ length: 6 }, (_, i) => t0 + 6 + Math.round(i * BEAT_PRE * 1.5));
  // springy body: it swells and stretches as each drip gathers at the tip, then wobbles back
  let sy = 1;
  let sx = 1;
  for (const at of drips) {
    const pre = clamp01((frame - (at - 8)) / 8);
    if (frame < at) {
      const e = ease.inOutCubic(pre);
      sy += 0.1 * e;
      sx -= 0.06 * e;
    } else {
      const t = frame - at;
      const k = Math.exp(-t / 7) * Math.cos(t * 0.62);
      sy += 0.1 * k;
      sx -= 0.07 * k;
    }
  }
  const pop = frame < t0 ? 0 : 1 - Math.exp(-(frame - t0) / 5) * Math.cos((frame - t0) * 0.45);
  const bob = Math.sin(frame / 16) * 8;
  const days = Math.round(lerp(1, 14, ease.inOutCubic(clamp01((frame - (w("robinet", 4) - 10)) / 30))));
  const outT = ease.inCubic(clamp01((frame - (A2_END - 8)) / 8));
  const tipY = DY + bob + R * 0.62 * sy;
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      {/* soft light pool on the floor */}
      <div style={{ position: "absolute", left: DX - 300, top: FLOOR - 60, width: 600, height: 120, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,191,99,0.18), rgba(0,0,0,0) 70%)" }} />
      {/* ripples + splash where each drip lands */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {drips.map((at, i) => {
          const land = at + 11;
          const t = (frame - land) / 34;
          if (t < 0 || t > 1) return null;
          const e = ease.outQuint(t);
          return (
            <g key={i} opacity={(1 - t) * 0.85}>
              <ellipse cx={DX} cy={FLOOR} rx={24 + 250 * e} ry={(24 + 250 * e) * 0.16} fill="none" stroke={P.mint} strokeWidth={3 * (1 - t) + 0.8} />
              <ellipse cx={DX} cy={FLOOR} rx={10 + 140 * ease.outQuint(clamp01(t * 1.3))} ry={(10 + 140 * ease.outQuint(clamp01(t * 1.3))) * 0.16} fill="none" stroke={P.green} strokeWidth={2} />
              {[-1, 1, -0.4, 0.5].map((d, j) => {
                const u = clamp01((frame - land) / 14);
                if (u >= 1) return null;
                const x = DX + d * 70 * u;
                const y = FLOOR - Math.sin(Math.PI * u) * (40 + 20 * j);
                return <circle key={j} cx={x} cy={y} r={5 - 3 * u} fill={P.mint} />;
              })}
            </g>
          );
        })}
      </svg>
      {/* drips: bead at the tip, let go, fall, land */}
      {drips.map((at, i) => {
        const grow = ease.outBack(clamp01((frame - (at - 8)) / 8));
        const t = (frame - at) / 11;
        if (frame < at - 8 || t > 1) return null;
        const falling = t > 0;
        const y = falling ? lerp(tipY + 14, FLOOR - 14, t * t) : tipY + 10 * grow;
        return <Shape key={i} pts={shape("drop")} x={DX} y={y} size={44 * (falling ? 1 : grow)} sy={falling ? 1 + 0.35 * t : 1 + 0.2 * grow} sx={falling ? 1 - 0.12 * t : 1} fill={P.mint} />;
      })}
      <Shape
        pts={mix(shape("drop"), blob(frame / 18, 0.3), 0.08)}
        x={DX}
        y={DY + bob}
        size={R * pop}
        sx={sx}
        sy={sy}
        fill={P.green}
        gradient={GREEN_GRAD}
        id="a2"
        opacity={1 - outT}
        shadow="drop-shadow(0 30px 70px rgba(0,0,0,0.35))"
      >
        <ellipse cx={-R * 0.12} cy={-R * 0.02} rx={R * 0.06} ry={R * 0.13} fill="rgba(255,255,255,0.55)" transform={`rotate(20 ${-R * 0.12} ${-R * 0.02})`} />
      </Shape>
      <Txt words={kw("robinet", { only: [0, 1, 2] })} size={100} on="deep" x={150} y={CY - 70} align="left" out={A2_END - 6} />
      <Txt words={kw("robinet", { only: [3, 4, 5], color: { 4: MINT_INK, 5: MINT_INK } })} size={100} on="deep" x={150} y={CY + 50} align="left" out={A2_END - 6} />
      {frame >= w("robinet", 4) - 10 && (
        <div style={{ position: "absolute", left: 150, top: CY + 160, opacity: io(frame, w("robinet", 4) - 10, A2_END, 8, 8), display: "flex", alignItems: "center", gap: 14, padding: "12px 24px 12px 18px", borderRadius: 999, background: "rgba(185,255,214,0.1)", border: "1.5px solid rgba(185,255,214,0.25)" }}>
          <Glyph name="droplet" size={30} color={P.mint} weight={2.4} />
          <Label size={32} color={P.mint} weight={500}>
            {`Picură de ${days} ${days === 1 ? "zi" : "zile"}`}
          </Label>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A3: a coat of paint
/** wet brush stroke: rough edges (turbulence), bristle streaks, and drips running down once it's laid */
const PaintStroke: React.FC<{ p: number; y: number; frame: number }> = ({ p, y, frame }) => {
  if (p <= 0) return null;
  const d = `M -80 ${y + 18} C 400 ${y - 30}, 900 ${y + 26}, 1300 ${y - 6} S 1800 ${y - 22}, 2020 ${y + 4}`;
  const bristles = Array.from({ length: 14 }, (_, i) => ({ off: -64 + i * 9.8 + seeded(i, 1) * 4, wdt: 3 + seeded(i, 2) * 6, a: 0.12 + seeded(i, 3) * 0.3, lag: seeded(i, 4) * 0.08, light: i % 3 === 0 }));
  const drips = [380, 690, 1120, 1460, 1720].map((x, i) => ({ x, len: 50 + seeded(i, 7) * 110, wdt: 9 + seeded(i, 8) * 9, at: 0.35 + (x / 1920) * 0.55 }));
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id="rough" x="-10%" y="-50%" width="120%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves={3} seed={4} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={26} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <linearGradient id="paint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2ee08a" />
          <stop offset="55%" stopColor="#00bf63" />
          <stop offset="100%" stopColor="#00a454" />
        </linearGradient>
      </defs>
      <g filter="url(#rough)">
        <path d={d} stroke="url(#paint)" strokeWidth={150} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} />
        {bristles.map((b, i) => (
          <path key={i} d={d} transform={`translate(0 ${b.off})`} stroke={b.light ? "#b9ffd6" : "#008a45"} strokeOpacity={b.a} strokeWidth={b.wdt} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(p - b.lag)} 1`} />
        ))}
        {drips.map((dr, i) => {
          const g = ease.outCubic(clamp01((p - dr.at) / 0.25)) * (0.6 + 0.4 * clamp01((frame % 600) / 600));
          if (g <= 0) return null;
          const top = y + 50;
          return (
            <g key={i}>
              <rect x={dr.x - dr.wdt / 2} y={top} width={dr.wdt} height={dr.len * g} rx={dr.wdt / 2} fill="#00a454" />
              <circle cx={dr.x} cy={top + dr.len * g} r={dr.wdt * 0.75} fill="#00a454" />
            </g>
          );
        })}
      </g>
      {/* wet sheen */}
      <path d={d} transform="translate(0 -40)" stroke="rgba(255,255,255,0.35)" strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(p - 0.1) * 0.9} 1`} style={{ filter: "blur(3px)" }} />
    </svg>
  );
};


export const A3: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A2_END - 2;
  // three roller passes paint the wall white
  const passes = [0, 1, 2].map((i) => ease.inOutCubic(clamp01((frame - (t0 + i * 3)) / 11)));
  const under = ease.inOutCubic(clamp01((frame - (w("perete", 4) - 6)) / 22));
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      {passes.map((p, i) => {
        const h = 420;
        const y = -60 + i * 380;
        return <div key={i} style={{ position: "absolute", left: -260, top: y, height: h, width: (1920 + 520) * p, borderRadius: h / 2, background: "#f4f6f3", boxShadow: "0 0 0 2px rgba(255,255,255,0.4)" }} />;
      })}
      {passes[2] >= 1 && <Bg kind="white" />}
      {/* a real brush mark of green paint across the wall, under "o mână de vopsea" */}
      <PaintStroke p={under} y={CY + 122} frame={frame} />
      <Txt words={kw("perete", { only: [0, 1, 2, 3] })} size={104} on="white" y={CY - 90} out={A3_END - 4} />
      <Txt words={kw("perete", { only: [4, 5, 6, 7, 8] })} size={104} on="white" y={CY + 120} out={A3_END - 4} ink={["#ffffff", "#f0fff6"]} tint={["#ffffff", "#ffffff"]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A4: "și tu."

export const A4: React.FC = () => (
  <AbsoluteFill>
    <Bg kind="black" />
    <Txt words={kw("situ", { lead: 2, color: { 1: MINT_INK } })} size={92} on="black" />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ A5: no time, no tools, no nerve

export const A5: React.FC = () => {
  const frame = useCurrentFrame();
  const kTime = w("nici1", 3);
  const kTools = w("nici1", 5);
  const kNerves = w("nici2", 1);
  const kAll = w("nici2", 2);
  const SX = CX + 470;
  const SY = CY;
  let pts = shape("circle");
  if (frame >= kTools - 10 && frame < kNerves - 10) pts = morphNamed("circle", "square", ease.outBack(clamp01((frame - (kTools - 10)) / 12)), 1, frame);
  else if (frame >= kNerves - 10) pts = morphNamed("square", "spiky", ease.outBack(clamp01((frame - (kNerves - 10)) / 12)), 1, frame);
  const appear = ease.outBack(clamp01((frame - (kTime - 12)) / 14));
  const jitter = frame >= kNerves - 2 ? Math.sin(frame * 2.3) * 4 : 0;
  const shrink = ease.inOutCubic(clamp01((frame - (kAll - 6)) / 14));
  const size = 360 * appear * (1 - 0.82 * shrink);
  const clock = 1 - clamp01((frame - (kTools - 12)) / 5);
  const toolA = clamp01((frame - (kTools - 2)) / 6) * (1 - clamp01((frame - (kNerves - 10)) / 5));
  const lines: Array<[number, number, number]> = [
    [kTime, 2, 3],
    [kTools, 4, 5],
    [kNerves, 0, 1],
  ];
  const outAll = kAll - 4;
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <Txt words={kw("nici1", { only: [0, 1] })} size={56} on="black" x={170} y={CY - 290} align="left" out={outAll} />
      {lines.map(([at, a, b], i) => {
        const key = i < 2 ? "nici1" : "nici2";
        const dim = i < 2 ? 1 - 0.65 * clamp01((frame - (lines[i + 1][0] - 6)) / 6) : 1;
        return (
          <div key={i} style={{ opacity: dim }}>
            <Txt words={kw(key, { only: [a, b], color: { [b]: MINT_INK } })} size={118} on="black" x={170} y={CY - 140 + i * 150} align="left" out={outAll} />
          </div>
        );
      })}
      <Shape pts={pts} x={SX + jitter} y={SY} size={size} rot={frame >= kNerves ? frame * 3 : 0} fill={P.green} gradient={GREEN_GRAD} id="a5" shadow="drop-shadow(0 30px 70px rgba(0,191,99,0.25))" />
      {/* clock hands */}
      {clock > 0 && appear > 0.3 && (
        <svg width={400} height={400} viewBox="-50 -50 100 100" style={{ position: "absolute", left: SX - 200, top: SY - 200, opacity: clock }}>
          <line x1={0} y1={0} x2={Math.sin(frame / 3) * 24} y2={-Math.cos(frame / 3) * 24} stroke="#fff" strokeWidth={4.5} strokeLinecap="round" />
          <line x1={0} y1={0} x2={Math.sin(frame / 30) * 15} y2={-Math.cos(frame / 30) * 15} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
          <circle r={4} fill="#fff" />
        </svg>
      )}
      {toolA > 0 && (
        <div style={{ position: "absolute", left: SX - 85, top: SY - 85, opacity: toolA, transform: `rotate(${(1 - toolA) * -40}deg)` }}>
          <Glyph name="wrench" size={170} color="#fff" weight={2.2} />
        </div>
      )}
      <Txt words={kw("nici2", { only: [2, 3, 4] })} size={96} on="black" y={CY} out={A5_END - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A6: "Și tot amâni." — the task keeps hopping a day
const DAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum", "Lun", "Mar", "Mie", "Joi", "Vin"];

export const A6: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A5_END;
  const cellW = 250;
  const scroll = (frame - t0) * 9;
  const x0 = 520;
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      {/* "today" marker */}
      <div style={{ position: "absolute", left: CX - 2, top: CY + 80, width: 4, height: 270, borderRadius: 2, background: "rgba(255,255,255,0.5)" }} />
      <div style={{ position: "absolute", left: CX, top: CY + 64, transform: "translate(-50%, -100%)" }}>
        <Label size={26} color="rgba(255,255,255,0.7)" weight={500}>
          azi
        </Label>
      </div>
      <div style={{ position: "absolute", left: x0 - scroll, top: CY + 120, display: "flex" }}>
        {[...DAYS, ...DAYS].map((d, i) => {
          const cx = x0 - scroll + i * cellW + (cellW - 18) / 2;
          const late = clamp01((CX - 30 - cx) / 90);
          const strike = clamp01((CX - 60 - cx) / 60);
          return (
            <div
              key={i}
              style={{
                width: cellW - 18,
                marginRight: 18,
                height: 190,
                borderRadius: 36,
                background: late > 0 ? `rgba(255,59,48,${0.08 + 0.14 * late})` : "rgba(185,255,214,0.06)",
                border: `1.5px solid ${late > 0 ? `rgba(255,90,80,${0.2 + 0.5 * late})` : "rgba(185,255,214,0.14)"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                position: "relative",
                transform: `scale(${1 - 0.04 * late})`,
              }}
            >
              <Label size={34} color={late > 0.5 ? "rgba(255,140,130,0.85)" : "rgba(185,255,214,0.6)"} weight={500}>
                {d}
              </Label>
              <Label size={68} color={late > 0.5 ? "#ff6b61" : "#fff"}>
                {12 + (i % 31)}
              </Label>
              <div style={{ position: "absolute", left: "22%", right: "22%", top: "62%", height: 5, borderRadius: 3, background: "#ff5a50", transformOrigin: "0 50%", transform: `scaleX(${strike}) rotate(-8deg)` }} />
            </div>
          );
        })}
      </div>
      <Txt words={kw("amani", { color: { 2: ["#ff8a80", "#ff4d42"] } })} size={120} on="deep" y={CY - 220} out={A6_END - 5} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A7: hoping it fixes itself

export const A7: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A6_END;
  // a loader that keeps going round and never finishes
  const a = io(frame, t0 + 2, A7_END, 10, 8);
  const local = frame - t0;
  const head = local * 9 + 120 * (1 - Math.cos(local / 9));
  const len = 0.18 + 0.5 * (0.5 + 0.5 * Math.sin(local / 7));
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <svg width={300} height={300} viewBox="-60 -60 120 120" style={{ position: "absolute", left: CX - 150, top: CY - 250, opacity: a, transform: `scale(${0.8 + 0.2 * a})` }}>
        <circle r={50} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle r={50} fill="none" stroke={P.green} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${len} 1`} transform={`rotate(${head - 90})`} style={{ filter: "drop-shadow(0 0 6px rgba(0,191,99,0.6))" }} />
      </svg>
      <Txt words={[...kw("speri1"), ...kw("speri2")]} size={84} on="black" y={CY + 110} out={w("speri3", 0) - 6} />
      <Txt words={kw("speri3", { color: { 2: MINT_INK } })} size={84} on="black" y={CY + 110} out={A7_END - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A8: nobody to call
const CONTACTS = ["Mama", "Andrei", "Vecinul Dan", "Ioana"];

export const A8: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A7_END;
  const enter = ease.outExpo(clamp01((frame - (t0 + 4)) / 18));
  const query = "meșter";
  const typed = Math.floor(clamp01((frame - (w("lumea", 5) - 2)) / 14) * query.length);
  const empty = clamp01((frame - (w("lumea", 9) - 2)) / 8);
  const outT = clamp01((frame - (A8_END - 8)) / 8);
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      <Txt words={kw("lumea", { only: [0, 1, 2, 3] })} size={80} on="white" x={150} y={CY - 100} align="left" out={A8_END - 6} />
      <Txt words={kw("lumea", { only: [4, 5, 6, 7], color: { 7: GREEN_INK } })} size={80} on="white" x={150} y={CY} align="left" out={A8_END - 6} />
      <Txt words={kw("lumea", { only: [8, 9, 10, 11] })} size={80} on="white" x={150} y={CY + 100} align="left" out={A8_END - 6} />
      <div
        style={{
          position: "absolute",
          left: 1130,
          top: CY - 290,
          width: 560,
          transformOrigin: "50% 50%",
          scale: "1.22",
          height: 580,
          borderRadius: 44,
          background: "#fff",
          boxShadow: "0 50px 100px rgba(10,40,25,0.16), 0 0 0 1px rgba(0,0,0,0.04)",
          transform: `translateY(${(1 - enter) * 120}px) scale(${1 - 0.05 * outT})`,
          opacity: enter * (1 - outT),
          fontFamily: FONT,
          fontWeight: BOLD,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 34, top: 34, fontSize: 40, color: P.ink, letterSpacing: "-0.03em" }}>Contacte</div>
        <div style={{ position: "absolute", left: 30, right: 30, top: 100, height: 64, borderRadius: 18, background: "#eff2f0", display: "flex", alignItems: "center", gap: 12, padding: "0 20px" }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth={2.6} strokeLinecap="round">
            <circle cx={11} cy={11} r={7} />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span style={{ fontSize: 28, color: typed ? P.ink : "#9aa29e", fontWeight: 500 }}>{typed ? query.slice(0, typed) : "Caută"}</span>
          {typed > 0 && typed < query.length && <span style={{ width: 2.5, height: 30, background: P.green }} />}
        </div>
        {CONTACTS.map((c, i) => {
          const fade = clamp01((frame - (w("lumea", 5) + 4 + i * 2)) / 6);
          return (
            <div key={c} style={{ position: "absolute", left: 30, right: 30, top: 196 + i * 86, height: 74, display: "flex", alignItems: "center", gap: 18, opacity: 1 - fade * 0.88, transform: `translateX(${-fade * 14}px)` }}>
              <Avatar size={56} dark={false} />
              <span style={{ fontSize: 30, color: P.ink, fontWeight: 500 }}>{c}</span>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", opacity: empty, transform: `translateY(${(1 - empty) * 16}px)` }}>
          <div style={{ fontSize: 34, color: P.ink, letterSpacing: "-0.03em" }}>Niciun rezultat</div>
          <div style={{ fontSize: 24, color: "#8a938e", marginTop: 10, fontWeight: 500 }}>pentru „meșter de încredere”</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A9: search, call, haggle — colour cuts

export const A9: React.FC = () => {
  const frame = useCurrentFrame();
  const cuts = [w("obositor", 3) - 3, w("obositor", 5) - 3, w("obositor", 7) - 3];
  const which = frame < cuts[0] ? -1 : frame < cuts[1] ? 0 : frame < cuts[2] ? 1 : 2;
  const kind = (["white", "green", "black", "white"] as const)[which + 1];
  const local = which < 0 ? 0 : frame - cuts[which];
  const pop = ease.outBack(clamp01(local / 10));
  const prices = ["350 lei", "250 lei", "300 lei"];
  const price = prices[Math.min(2, Math.floor(local / 6))];
  return (
    <AbsoluteFill>
      <Bg kind={kind} />
      {which < 0 && <Txt words={kw("obositor", { only: [0, 1, 2], color: { 2: GREEN_INK } })} size={130} on="white" />}
      {which === 0 && (
        <>
          <div style={{ position: "absolute", left: CX - 90, top: CY - 300, transform: `scale(${pop}) rotate(${(1 - pop) * -30}deg)` }}>
            <svg width={180} height={180} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
              <circle cx={10.5} cy={10.5} r={6.5} />
              <path d="m20 20-4.5-4.5" />
            </svg>
          </div>
          <Txt words={kw("obositor", { only: [3, 4] })} size={170} on="green" y={CY + 90} />
        </>
      )}
      {which === 1 && (
        <>
          <svg width={400} height={400} viewBox="-100 -100 200 200" style={{ position: "absolute", left: CX - 200, top: CY - 410 }}>
            {[0, 1, 2].map((i) => {
              const t = ((local + i * 5) % 15) / 15;
              return <circle key={i} r={36 + 60 * t} fill="none" stroke={P.green} strokeWidth={3} opacity={(1 - t) * 0.7} />;
            })}
            <circle r={36 * pop} fill={P.green} />
            <g transform={`translate(-14 -14) rotate(${Math.sin(local * 1.8) * 12} 14 14)`}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinejoin="round" transform="scale(1.2)" />
            </g>
          </svg>
          <Txt words={kw("obositor", { only: [5, 6], color: { 6: MINT_INK } })} size={170} on="black" y={CY + 90} />
        </>
      )}
      {which === 2 && (
        <>
          <div style={{ position: "absolute", left: CX, top: CY - 210, transform: `translate(-50%, -50%) scale(${pop}) rotate(${Math.sin(local * 0.9) * 4}deg)`, padding: "22px 40px", borderRadius: 999, background: P.ink, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: P.green }} />
            <Label size={56} color="#fff">
              {price}
            </Label>
          </div>
          <Txt words={kw("obositor", { only: [7, 8], color: { 8: GREEN_INK } })} size={170} on="white" y={CY + 90} />
        </>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A10: hoping you don't get scammed

export const A10: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A9_END;
  const enter = ease.outExpo(clamp01((frame - (t0 + 6)) / 20));
  const bust = w("rogi", 11);
  const fall = ease.inCubic(clamp01((frame - (bust + 10)) / 18));
  const crack = clamp01((frame - bust) / 4);
  const outT = clamp01((frame - (A10_END - 10)) / 10);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <Txt words={kw("rogi", { only: [0, 1, 2, 3] })} size={84} on="black" x={150} y={CY - 130} align="left" out={A10_END - 8} />
      <Txt words={kw("rogi", { only: [4, 5, 6, 7, 8] })} size={84} on="black" x={150} y={CY - 20} align="left" out={A10_END - 8} />
      <Txt words={kw("rogi", { only: [9, 10, 11], color: { 11: MINT_INK } })} size={84} on="black" x={150} y={CY + 90} align="left" out={A10_END - 8} />
      <div
        style={{
          position: "absolute",
          left: 1240,
          top: CY - 230,
          scale: "1.3",
          width: 440,
          height: 460,
          borderRadius: 40,
          background: "linear-gradient(180deg, #1a201d, #0d1110)",
          border: "1.5px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
          transform: `perspective(1400px) translateY(${(1 - enter) * 140 + fall * 160}px) rotateX(${fall * 50}deg) rotateZ(${crack * -4 + fall * -6}deg) scale(${1 - fall * 0.2})`,
          opacity: enter * (1 - fall) * (1 - outT),
          fontFamily: FONT,
          fontWeight: BOLD,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 50,
          gap: 18,
        }}
      >
        <Avatar size={140} />
        <div style={{ fontSize: 36, color: "#fff", letterSpacing: "-0.03em" }}>„Meșter” Gigel</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const drop = ease.inCubic(clamp01((frame - (bust + 2 + i * 2)) / 12));
            return (
              <svg key={i} width={40} height={40} viewBox="0 0 24 24" style={{ transform: `translateY(${drop * 260}px) rotate(${drop * (i % 2 ? 90 : -90)}deg)`, opacity: 1 - drop }}>
                <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill="#ffd34d" />
              </svg>
            );
          })}
        </div>
        <div style={{ fontSize: 24, color: "#7e8883", fontWeight: 500 }}>Plată doar cash, în avans</div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A11/12: silence, then "Aici intervine Handly."

export const A12: React.FC = () => {
  const frame = useCurrentFrame();
  const hand = w("aici", 2);
  const dotIn = ease.outBack(clamp01((frame - (A10_END + 2)) / 14));
  const grow = ease.inOutCubic(clamp01((frame - (hand - 10)) / 12));
  const toLogo = ease.outBack(clamp01((frame - (hand - 4)) / 14));
  const tremble = frame > hand + 8 ? Math.sin(frame * 3.1) * 3 * clamp01((frame - (hand + 8)) / 8) : 0;
  const gather = 1 - 0.12 * ease.inCubic(clamp01((frame - (A12_END - 8)) / 8));
  const size = (lerp(40, 340, grow) + 6 * Math.sin(frame / 6)) * dotIn * gather;
  const pts = frame < hand - 4 ? shape("circle") : morphNamed("circle", "logo", toLogo, 1.2, frame);
  const real = clamp01((frame - (hand + 8)) / 6);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <Shape pts={pts} x={CX + tremble} y={CY + 30} size={size} fill={P.green} gradient={GREEN_GRAD} id="a12" opacity={1 - real} shadow={`drop-shadow(0 0 ${40 * grow}px rgba(0,191,99,0.35))`} />
      {real > 0 && <Logo size={size * 1.2} style={{ position: "absolute", left: CX + tremble - size * 0.6, top: CY + 30 - size * 0.58, opacity: real }} />}
      <Txt words={kw("aici", { only: [0, 1] })} size={64} on="black" y={CY - 300} />
      <Txt words={kw("aici", { only: [2], color: { 2: GREEN_INK } })} size={64} on="black" y={CY + 330} />
    </AbsoluteFill>
  );
};
