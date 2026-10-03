import React from "react";
import { A10_END, A12_END, A1_END, A2_END, A3_END, A5_END, A6_END, A7_END, A8_END, A9_END } from "./scenes";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { textWidth } from "../explainer/components/AppleText";
import { Avatar } from "../explainer/components/Avatar";
import { Glyph } from "../explainer/components/Icons";
import { clamp01, ease, lerp, mixColor, seeded } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { Bg, GREEN_GRAD, GREEN_INK, Label, Logo, MINT_INK, P, Shape, Txt, io } from "./kit";
import { blob, mix, morphNamed, shape } from "./morph";
import { absorbed, SERVICES, Vortex } from "./fx";
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

// one drop, followed by the camera from the tap to the puddle
export const DROP_FORM = 22;
export const DROP_IMPACT = 46;
const FALL = 1150;

export const A2: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - A1_END;
  const DX = CX + 400;
  const R = 92;
  // drop position in the world (y down, 0 = tap)
  const forming = clamp01(t / DROP_FORM);
  const fallT = clamp01((t - DROP_FORM) / (DROP_IMPACT - DROP_FORM));
  const dropY = t < DROP_FORM ? 40 + 50 * ease.inOutCubic(forming) : 90 + (FALL - 90) * fallT * fallT;
  // camera: holds on the tap, then tracks the falling drop with a little lag, then settles on the puddle
  const camTarget = t < DROP_FORM ? 0 : t < DROP_IMPACT ? dropY - 260 : FALL - 470;
  const lag = t < DROP_FORM ? 0 : t < DROP_IMPACT ? 40 * (1 - fallT) : 0;
  const settle = ease.outCubic(clamp01((t - DROP_IMPACT) / 26));
  const camY = t < DROP_IMPACT ? Math.max(0, camTarget - lag) : lerp(FALL - 300, FALL - 470, settle);
  const zoom = t < DROP_IMPACT ? lerp(1.15, 1.0, fallT) : lerp(1.0, 0.92, settle);
  const toScreen = (wy: number) => 300 + (wy - camY);
  // shape of the drop
  const hang = t < DROP_FORM ? Math.sin(forming * Math.PI * 0.5) : 0;
  const wob = t >= DROP_FORM ? Math.exp(-(t - DROP_FORM) / 5) * Math.cos((t - DROP_FORM) * 0.9) : 0;
  const speed = t >= DROP_FORM && t < DROP_IMPACT ? fallT : 0;
  const sy = 1 + 0.35 * hang + 0.12 * wob + 0.25 * speed;
  const sx = 1 - 0.15 * hang - 0.08 * wob - 0.12 * speed;
  const imp = t - DROP_IMPACT;
  const days = Math.round(lerp(1, 14, ease.inOutCubic(clamp01((frame - (w("robinet", 4) - 10)) / 30))));
  const outT = ease.inCubic(clamp01((frame - (A2_END - 8)) / 8));
  const puddleY = FALL + 30;
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${DX}px 540px`, opacity: 1 - outT }}>
        {/* the tap: a sleek chrome spout */}
        <div style={{ position: "absolute", left: DX - 70, top: toScreen(-420), width: 140, height: 430, borderRadius: "0 0 40px 40px", background: "linear-gradient(90deg, #2c3833 0%, #93a59d 22%, #e8f1ec 34%, #6f827a 55%, #26302c 100%)", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }} />
        <div style={{ position: "absolute", left: DX - 46, top: toScreen(-6), width: 92, height: 18, borderRadius: "0 0 30px 30px", background: "linear-gradient(90deg, #1d2724, #5d6f68, #1d2724)" }} />
        {/* residual bead left on the tap */}
        {t >= DROP_FORM && <Shape pts={shape("circle")} x={DX} y={toScreen(18)} size={R * 0.4 * (1 + 0.2 * wob)} fill={P.mint} gradient={["#d9ffe9", "#3ee699"]} id="bead" />}
        {/* the puddle */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="pud" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1fd17c" stopOpacity={0.55} />
              <stop offset="70%" stopColor="#0a7a45" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0a7a45" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={DX} cy={toScreen(puddleY)} rx={420} ry={70} fill="url(#pud)" />
          <ellipse cx={DX} cy={toScreen(puddleY) - 4} rx={300} ry={40} fill="none" stroke="rgba(185,255,214,0.25)" strokeWidth={2} />
          {/* ripples */}
          {imp >= 0 &&
            [0, 7, 15].map((d, i) => {
              const u = clamp01((imp - d) / 40);
              if (u <= 0 || u >= 1) return null;
              const e = ease.outQuint(u);
              return <ellipse key={i} cx={DX} cy={toScreen(puddleY)} rx={20 + 400 * e} ry={(20 + 400 * e) * 0.16} fill="none" stroke={i ? P.green : P.mint} strokeWidth={3.5 * (1 - u) + 0.6} opacity={(1 - u) * 0.9} />;
            })}
          {/* crown splash */}
          {imp >= 0 && imp < 16 && (
            <path
              d={(() => {
                const u = imp / 16;
                const h = Math.sin(Math.PI * u) * 150;
                const rx = 60 + 130 * ease.outCubic(u);
                const y0 = toScreen(puddleY);
                return `M ${DX - rx} ${y0} Q ${DX - rx * 0.9} ${y0 - h}, ${DX - rx * 0.7} ${y0 - h * 1.05} L ${DX + rx * 0.7} ${y0 - h * 1.05} Q ${DX + rx * 0.9} ${y0 - h}, ${DX + rx} ${y0} Z`;
              })()}
              fill="rgba(62,230,153,0.55)"
            />
          )}
          {imp >= 0 &&
            Array.from({ length: 18 }, (_, i) => {
              const u = imp / 24;
              if (u >= 1) return null;
              const a = (i / 12) * Math.PI * 2;
              const vx = Math.cos(a) * (200 + 90 * seeded(i, 1));
              const vz = Math.sin(a) * 0.18;
              const up = 300 + 140 * seeded(i, 2);
              const x = DX + vx * u;
              const y = toScreen(puddleY) + vz * 200 * u - up * u + 420 * u * u;
              return <circle key={i} cx={x} cy={y} r={11 * (1 - u) + 3} fill={P.mint} />;
            })}
          {/* the jet that kicks back up and drops a bead */}
          {imp >= 8 && imp < 34 && (() => {
            const u = (imp - 8) / 26;
            const h = Math.sin(Math.PI * Math.min(1, u * 1.4)) * 220;
            const bead = u > 0.55 ? (u - 0.55) / 0.45 : 0;
            const y0 = toScreen(puddleY);
            return (
              <g>
                <path d={`M ${DX - 22} ${y0} Q ${DX} ${y0 - h * 1.1}, ${DX + 22} ${y0} Z`} fill="rgba(62,230,153,0.7)" />
                {bead > 0 && <circle cx={DX} cy={y0 - 220 * (1 - bead) - 40 + 260 * bead * bead} r={15} fill={P.mint} />}
              </g>
            );
          })()}
        </svg>
        {/* the drop */}
        {t < DROP_IMPACT && (
          <Shape pts={shape("drop")} x={DX} y={toScreen(dropY)} size={R * 2} sx={sx} sy={sy} fill={P.green} gradient={["#8dffc4", "#00b35c"]} id="a2d" shadow="drop-shadow(0 20px 30px rgba(0,0,0,0.35))">
            <ellipse cx={-R * 0.22} cy={R * 0.2} rx={R * 0.1} ry={R * 0.22} fill="rgba(255,255,255,0.6)" transform={`rotate(18 ${-R * 0.22} ${R * 0.2})`} />
          </Shape>
        )}
        {/* motion streak while falling */}
        {speed > 0.3 && <div style={{ position: "absolute", left: DX - 3, top: toScreen(dropY) - 260 * speed, width: 6, height: 220 * speed, borderRadius: 3, background: "linear-gradient(180deg, rgba(185,255,214,0), rgba(185,255,214,0.35))" }} />}
      </AbsoluteFill>
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
const shrinkOf = (frame: number, kAll: number) => ease.inOutCubic(clamp01((frame - (kAll - 6)) / 14));

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
  else if (frame >= kNerves - 10) pts = morphNamed("square", "battery", ease.outBack(clamp01((frame - (kNerves - 10)) / 12)), 1, frame);
  const appear = ease.outBack(clamp01((frame - (kTime - 12)) / 14));
  const jitter = 0;
  const bat = clamp01((frame - (kNerves - 2)) / 6) * (1 - shrinkOf(frame, kAll));
  const level = lerp(0.85, 0.06, ease.inOutCubic(clamp01((frame - kNerves) / 22)));
  const shrink = ease.inOutCubic(clamp01((frame - (kAll - 6)) / 14));
  const size = 360 * appear * (1 - shrink);
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
      {/* eyebrow */}
      <div style={{ position: "absolute", left: 170, top: CY - 250, opacity: clamp01((frame - (w("nici1", 0) - 4)) / 8) * (1 - clamp01((frame - outAll) / 7)), fontFamily: FONT, fontWeight: 500, fontSize: 30, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(185,255,214,0.7)" }}>care n-ai</div>
      {/* a picker wheel: the current "nici …" sits in the middle, the others roll away above it */}
      {(() => {
        const pos = lerp(0, 1, ease.inOutCubic(clamp01((frame - (kTools - 8)) / 12))) + lerp(0, 1, ease.inOutCubic(clamp01((frame - (kNerves - 8)) / 12)));
        const fade = 1 - ease.inCubic(clamp01((frame - outAll) / 8));
        return lines.map(([at, a, b], i) => {
          const key = i < 2 ? "nici1" : "nici2";
          const d = i - pos;
          if (frame < at - 6) return null;
          const ad = Math.abs(d);
          const y = CY + d * 150;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, transformOrigin: `170px ${y}px`, transform: `perspective(1200px) rotateX(${-d * 28}deg) scale(${1 - 0.22 * Math.min(1, ad)})`, opacity: (1 - 0.7 * Math.min(1, ad)) * fade, filter: ad > 0.4 ? `blur(${(ad - 0.4) * 4}px)` : undefined }}>
              <Txt words={kw(key, { only: [a, b], color: { [b]: MINT_INK } })} size={130} on="black" x={170} y={y} align="left" />
            </div>
          );
        });
      })()}
      <Shape pts={pts} x={SX + jitter} y={SY} size={size} fill={bat > 0 ? "#1c2420" : P.green} gradient={bat > 0 ? ["#2a3631", "#141a17"] : GREEN_GRAD} id={bat > 0 ? "a5b" : "a5"} shadow="drop-shadow(0 30px 70px rgba(0,191,99,0.25))" />
      {/* nerves: a battery draining into the red */}
      {bat > 0 && (
        <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ position: "absolute", left: SX - size / 2, top: SY - size / 2, opacity: bat, overflow: "visible" }}>
          <rect x={-10} y={-53} width={20} height={6} rx={2} fill="#2a3631" />
          <rect x={-21} y={-41 + 82 * (1 - level)} width={42} height={82 * level} rx={7} fill={level > 0.3 ? P.green : "#ff4d42"} style={{ filter: `drop-shadow(0 0 6px ${level > 0.3 ? "rgba(0,191,99,0.7)" : "rgba(255,77,66,0.8)"})` }} />
          {level < 0.3 && <path d="M3 -18 L-7 2 L1 2 L-3 20 L9 -4 L1 -4 Z" fill="#fff" opacity={0.5 + 0.5 * Math.sin(frame / 2)} />}
        </svg>
      )}
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
  const L = A6_END - t0;
  const p = clamp01((frame - t0) / L);
  const CW = 210;
  const CH = 176;
  const G = 18;
  const COLS = 7;
  const ROWS = 5;
  const GW = COLS * CW + (COLS - 1) * G;
  const GH = ROWS * CH + (ROWS - 1) * G;
  const FIRST = 3; // October starts on a Thursday
  // the postponing spreads day by day across the month
  const reach = lerp(1, 22, 0.5 - 0.5 * Math.cos(Math.PI * clamp01((frame - (t0 + 2)) / (L - 4))));
  const count = Math.max(0, Math.floor(reach));
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <AbsoluteFill style={{ perspective: 1700 }}>
        <div
          style={{
            position: "absolute",
            left: CX - GW / 2,
            top: CY - GH / 2 + 90,
            width: GW,
            height: GH,
            transformStyle: "preserve-3d",
            transform: `rotateX(${lerp(54, 46, p)}deg) rotateZ(${lerp(-14, -8, p)}deg) translate3d(${lerp(160, -120, p)}px, ${lerp(60, -40, p)}px, ${lerp(-80, 60, p)}px)`,
          }}
        >
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const day = i - FIRST + 1;
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            if (day < 1 || day > 31) return null;
            const r = clamp01((reach - day + 1.8) / 1.8);
            const f = ease.inOutCubic(r);
            const isToday = day === count + 1;
            const face: React.CSSProperties = {
              position: "absolute",
              inset: 0,
              borderRadius: 34,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              fontFamily: FONT,
              fontWeight: BOLD,
              overflow: "hidden",
            };
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: col * (CW + G),
                  top: row * (CH + G),
                  width: CW,
                  height: CH,
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${Math.sin(Math.PI * f) * 60 + (isToday ? 20 : 0)}px) rotateX(${-180 * f}deg)`,
                }}
              >
                {/* front: an ordinary day */}
                <div style={{ ...face, background: "linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))", border: `1.5px solid ${isToday ? "rgba(185,255,214,0.8)" : "rgba(255,255,255,0.1)"}` }}>
                  <div style={{ position: "absolute", left: 22, top: 16, fontSize: 52, letterSpacing: "-0.04em", color: "#fff" }}>{day}</div>
                </div>
                {/* back: postponed */}
                <div style={{ ...face, transform: "rotateX(180deg)", background: "linear-gradient(160deg, #ff5247 0%, #e0261b 100%)", boxShadow: `0 0 50px rgba(255,59,48,${0.5 * f}), inset 0 1px 0 rgba(255,255,255,0.35)` }}>
                  <div style={{ position: "absolute", left: 22, top: 16, fontSize: 52, letterSpacing: "-0.04em", color: "#fff" }}>{day}</div>
                  <div style={{ position: "absolute", left: 22, bottom: 18, fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>amânat</div>
                  <div style={{ position: "absolute", left: 18, right: 18, top: 50, height: 4, borderRadius: 2, background: "#ffffff", transformOrigin: "0 50%", transform: `scaleX(${ease.inOutCubic(clamp01((r - 0.6) / 0.4))}) rotate(-10deg)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #060807 0%, rgba(6,8,7,0.85) 26%, rgba(6,8,7,0) 50%)" }} />
      <Txt words={kw("amani", { color: { 2: ["#ff8a80", "#ff4d42"] } })} size={120} on="black" y={150} out={A6_END - 5} />
      <div style={{ position: "absolute", right: 120, bottom: 90, display: "flex", alignItems: "baseline", gap: 14, opacity: clamp01((frame - t0 - 4) / 6) * (1 - clamp01((frame - (A6_END - 5)) / 5)) }}>
        <Label size={34} color="rgba(255,150,140,0.85)" weight={500}>
          Amânat de
        </Label>
        <Label size={96} color="#ff453a">
          {count}
        </Label>
        <Label size={34} color="rgba(255,150,140,0.85)" weight={500}>
          zile
        </Label>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A7: hoping it fixes itself

export const A7: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A6_END;
  const a = io(frame, t0 + 2, A7_END, 10, 8);
  // the loader spins… slows… closes into a dull ring… and unrolls into a flat line
  const failAt = w("speri3", 2) - 2;
  const slow = clamp01((frame - (failAt - 12)) / 16);
  const l = frame - t0;
  const head = l * 9 * (1 - 0.85 * ease.outCubic(slow)) + 120 * (1 - Math.cos(l / 9));
  const len = lerp(0.18 + 0.5 * (0.5 + 0.5 * Math.sin(l / 7)), 1, ease.inOutCubic(clamp01((frame - (failAt - 2)) / 10)));
  const dull = ease.inOutCubic(clamp01((frame - (failAt - 2)) / 10));
  const unroll = ease.inOutCubic(clamp01((frame - (failAt + 8)) / 18));
  const col = mixColor(P.green, "#ff3b30", dull);
  const N = 120;
  const R = 50;
  const HALF = 170;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const ang = Math.PI / 2 + u * Math.PI * 2;
    const cx = Math.cos(ang) * R;
    const cy = Math.sin(ang) * R;
    const lx = (u - 0.5) * 2 * HALF;
    const ly = R;
    // a last tiny blip travels along the line once it's flat
    const blipC = clamp01((frame - (failAt + 26)) / 16);
    const blip = unroll >= 1 && blipC > 0 && blipC < 1 ? Math.exp(-Math.pow((u - blipC) * 18, 2)) * -16 * (1 - blipC) : 0;
    pts.push(`${lerp(cx, lx, unroll).toFixed(2)},${(lerp(cy, ly, unroll) + blip).toFixed(2)}`);
  }
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <svg width={600} height={300} viewBox="-200 -75 400 200" style={{ position: "absolute", left: CX - 300, top: CY - 250, opacity: a, overflow: "visible" }}>
        {unroll <= 0 ? (
          <>
            <circle r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
            <circle r={R} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${len} 1`} transform={`rotate(${head - 90})`} style={{ filter: `drop-shadow(0 0 6px ${dull > 0.5 ? "rgba(255,59,48,0.5)" : "rgba(0,191,99,0.6)"})` }} />
          </>
        ) : (
          <polyline points={pts.join(" ")} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(255,59,48,0.5))" }} />
        )}
      </svg>
      <Txt words={[...kw("speri1"), ...kw("speri2")]} size={84} on="black" y={CY + 110} out={w("speri3", 0) - 6} />
      <Txt words={kw("speri3", { color: { 2: ["#ff8a80", "#ff3b30"] } })} size={84} on="black" y={CY + 110} out={A7_END - 6} />
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
  // every postponed chore gets pulled into the mark
  const VF = A10_END + 2;
  const VS = 3;
  const VT = 38;
  const items = Array.from({ length: 24 }, (_, i) => ({ kind: "bubble" as const, icon: SERVICES[i % SERVICES.length].icon, d: 70 + Math.round(seeded(i, 7) * 110), tone: (i % 3) as 0 | 1 | 2 }));
  const ab = absorbed(frame, items.length, VF, VS, VT);
  const gulp = ab.since >= 0 && ab.since < 8 ? Math.sin((ab.since / 8) * Math.PI) * 0.12 : 0;
  const size = (lerp(40 + 3.5 * ab.count, 340, grow) + 6 * Math.sin(frame / 6)) * dotIn * gather * (1 + gulp);
  const pts = frame < hand - 4 ? shape("circle") : morphNamed("circle", "logo", toLogo, 1.2, frame);
  const real = clamp01((frame - (hand + 8)) / 6);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <Vortex items={items} from={VF} stagger={VS} travel={VT} cx={CX} cy={CY + 30} radius={820} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${CX}px ${CY + 30}px, rgba(0,191,99,${0.08 + 0.02 * ab.count}) 0%, rgba(0,0,0,0) 40%)` }} />
      <Shape pts={pts} x={CX + tremble} y={CY + 30} size={size} fill={P.green} gradient={GREEN_GRAD} id="a12" opacity={1 - real} shadow={`drop-shadow(0 0 ${40 * grow}px rgba(0,191,99,0.35))`} />
      {real > 0 && <Logo size={size * 1.2} style={{ position: "absolute", left: CX + tremble - size * 0.6, top: CY + 30 - size * 0.58, opacity: real }} />}
      <Txt words={kw("aici", { only: [0, 1] })} size={64} on="black" y={CY - 300} />
      <Txt words={kw("aici", { only: [2], color: { 2: GREEN_INK } })} size={64} on="black" y={CY + 330} />
    </AbsoluteFill>
  );
};
