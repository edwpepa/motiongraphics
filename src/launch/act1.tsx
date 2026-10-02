import React from "react";
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

// ------------------------------------------------------------------ A1: the weight of it all
export const A1_END = pStart("robinet") - 4;

const CHORES = ["Robinet", "Perete", "Dulap", "Priză"];

export const A1: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = ease.outBack(clamp01((frame - 8) / 16));
  // the sigh: a breath in, then the shape sags
  const sigh0 = F(1.28);
  const inhale = Math.sin(Math.PI * clamp01((frame - sigh0) / 16)) * 0.1;
  const sag = ease.inOutCubic(clamp01((frame - (sigh0 + 10)) / 18));
  const lands = CHORES.map((_, i) => w("cap", 0) + 2 + Math.round(i * BEAT_PRE * 0.75));
  const weight = lands.reduce((s, at) => s + (frame >= at ? 1 : 0), 0);
  const squash = lands.reduce((s, at) => s + (frame >= at ? Math.exp(-(frame - at) / 5) * Math.cos((frame - at) * 0.7) * 0.06 : 0), 0);
  const sy = (1 + inhale) * (1 - 0.1 * sag) * (1 - 0.045 * weight - squash);
  const sx = (1 + inhale * 0.6) * (1 + 0.06 * sag) * (1 + 0.035 * weight + squash * 0.8);
  // turn into a drop as the next line comes in, and move right
  const toDrop = ease.inOutCubic(clamp01((frame - (A1_END - 16)) / 16));
  const R0 = 165;
  const bx = lerp(CX, CX + 430, toDrop);
  const groundY = CY + 300;
  const by = lerp(groundY - R0 * sy, CY + 20, toDrop);
  const pts = toDrop > 0 ? mix(blob(frame / 30, 1 - toDrop), shape("drop"), ease.outBack(toDrop), undefined, 1, frame) : blob(frame / 30);
  const wipe = ease.inOutCubic(clamp01((frame - (A1_END - 14)) / 16));
  const outT = clamp01((frame - (A1_END - 18)) / 10);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      {/* deep green floods out of the shape as it becomes a drop */}
      {wipe > 0 && <Shape pts={shape("circle")} x={bx} y={by} size={R0 * 2 + 2600 * wipe} fill={P.deep} />}
      {wipe > 0 && <Bg kind="deep" style={{ opacity: clamp01((wipe - 0.85) / 0.15) }} />}
      {/* stack of chores landing on it */}
      {CHORES.map((c, i) => {
        const at = lands[i];
        if (frame < at - 12) return null;
        const fall = clamp01((frame - (at - 12)) / 12);
        const topOfBlob = groundY - R0 * 2 * sy;
        const yRest = topOfBlob - 42 - i * 84;
        const y = lerp(-120, yRest, ease.inCubic(fall)) + (frame >= at ? Math.exp(-(frame - at) / 4) * Math.sin((frame - at) * 0.9) * -10 : 0);
        const rot = [-6, 5, -3, 7][i] * (1 - 0.4 * fall);
        const x = CX + [-30, 26, -14, 18][i];
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              padding: "18px 36px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(255,255,255,0.16)",
              backdropFilter: "blur(12px)",
              opacity: (1 - outT) * clamp01((frame - (at - 12)) / 4),
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 6, background: P.green }} />
            <Label size={44} color="#fff" weight={500}>
              {c}
            </Label>
          </div>
        );
      })}
      <Shape pts={pts} x={bx} y={by} size={R0 * 2 * appear} sx={lerp(sx, 1, toDrop)} sy={lerp(sy, 1, toDrop)} fill={P.green} gradient={GREEN_GRAD} id="a1" shadow="drop-shadow(0 30px 60px rgba(0,191,99,0.25))" />
      <Txt words={kw("of")} size={84} on="black" y={CY - 330} out={w("cap", 0) - 8} />
      <Txt words={kw("cap", { color: { 3: MINT_INK } })} size={84} on="black" y={CY - 330} out={A1_END - 10} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A2: the dripping tap
export const A2_END = pStart("perete") - 3;

export const A2: React.FC = () => {
  const frame = useCurrentFrame();
  const DX = CX + 430;
  const DY = CY + 20;
  const R = 300;
  const t0 = A1_END;
  const breathe = 1 + 0.025 * Math.sin(frame / 7);
  const drips = Array.from({ length: 6 }, (_, i) => t0 + 6 + Math.round(i * BEAT_PRE * 1.5));
  const days = Math.round(lerp(1, 14, ease.inOutCubic(clamp01((frame - (w("robinet", 4) - 10)) / 30))));
  const outT = clamp01((frame - (A2_END - 8)) / 8);
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      {/* ripples on the floor */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {drips.map((at, i) => {
          const t = (frame - (at + 9)) / 26;
          if (t < 0 || t > 1) return null;
          const e = ease.outCubic(t);
          return (
            <g key={i} opacity={(1 - t) * 0.8}>
              <ellipse cx={DX} cy={CY + 330} rx={30 + 230 * e} ry={(30 + 230 * e) * 0.18} fill="none" stroke={P.mint} strokeWidth={3 * (1 - t) + 1} />
              <ellipse cx={DX} cy={CY + 330} rx={10 + 120 * e} ry={(10 + 120 * e) * 0.18} fill="none" stroke={P.green} strokeWidth={2} />
            </g>
          );
        })}
      </svg>
      {drips.map((at, i) => {
        const t = (frame - at) / 9;
        if (t < 0 || t > 1) return null;
        return <Shape key={i} pts={shape("drop")} x={DX} y={lerp(DY + R * 0.5, CY + 320, ease.inCubic(t))} size={46} sy={1 + 0.4 * t} fill={P.mint} />;
      })}
      <Shape pts={blob(frame / 20, 0.25)} x={DX} y={DY} size={0} fill="none" />
      <Shape
        pts={mix(shape("drop"), blob(frame / 18, 0.3), 0.08)}
        x={DX}
        y={DY}
        size={R}
        sx={breathe}
        sy={2 - breathe}
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
export const A3_END = w("situ", 0) - 2;

export const A3: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A2_END - 2;
  // three roller passes paint the wall white
  const passes = [0, 1, 2].map((i) => ease.inOutCubic(clamp01((frame - (t0 + i * 3)) / 11)));
  const under = ease.inOutCubic(clamp01((frame - (w("perete", 5) - 4)) / 12));
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      {passes.map((p, i) => {
        const h = 420;
        const y = -60 + i * 380;
        return <div key={i} style={{ position: "absolute", left: -260, top: y, height: h, width: (1920 + 520) * p, borderRadius: h / 2, background: "#f4f6f3", boxShadow: "0 0 0 2px rgba(255,255,255,0.4)" }} />;
      })}
      {passes[2] >= 1 && <Bg kind="white" />}
      {/* the paint stroke under "o mână de vopsea" */}
      <div style={{ position: "absolute", left: CX - (textWidth("de o mână de vopsea", 104, -0.045) + 2 * 0.27 * 104 + 110) / 2, top: CY + 58, width: (textWidth("de o mână de vopsea", 104, -0.045) + 4 * 0.27 * 104 + 110) * under, height: 128, borderRadius: 60, background: "linear-gradient(90deg, #1fd17c, #00bf63)", opacity: 0.95, transform: "rotate(-1.5deg)" }} />
      <Txt words={kw("perete", { only: [0, 1, 2, 3] })} size={104} on="white" y={CY - 90} out={A3_END - 4} />
      <Txt words={kw("perete", { only: [4, 5, 6, 7, 8] })} size={104} on="white" y={CY + 120} out={A3_END - 4} ink={["#ffffff", "#f0fff6"]} tint={["#ffffff", "#ffffff"]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A4: "și tu."
export const A4_END = w("nici1", 0) - 3;

export const A4: React.FC = () => (
  <AbsoluteFill>
    <Bg kind="black" />
    <Txt words={kw("situ", { lead: 2, color: { 1: MINT_INK } })} size={92} on="black" />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ A5: no time, no tools, no nerve
export const A5_END = w("amani", 0) - 2;

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
export const A6_END = w("speri1", 0) - 3;
const DAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum", "Lun", "Mar", "Mie", "Joi", "Vin"];

export const A6: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A5_END;
  const scroll = (frame - t0) * 7;
  const hopEvery = Math.round(BEAT_PRE);
  const hops = Math.max(0, Math.floor((frame - (t0 + 6)) / hopEvery));
  const hp = clamp01(((frame - (t0 + 6)) % hopEvery) / (hopEvery * 0.7));
  const cellW = 250;
  const base = 2;
  const dayIdx = base + hops + ease.inOutCubic(hp);
  const chipX = 300 + dayIdx * cellW - scroll + cellW / 2;
  const chipY = CY + 50 - Math.sin(Math.PI * hp) * 100;
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      <div style={{ position: "absolute", left: 300 - scroll, top: CY + 120, display: "flex" }}>
        {DAYS.map((d, i) => (
          <div key={i} style={{ width: cellW - 18, marginRight: 18, height: 190, borderRadius: 36, background: "rgba(185,255,214,0.06)", border: "1.5px solid rgba(185,255,214,0.14)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Label size={34} color="rgba(185,255,214,0.6)" weight={500}>
              {d}
            </Label>
            <Label size={68} color="#fff">
              {12 + i}
            </Label>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: chipX, top: chipY, transform: "translate(-50%, -50%)", padding: "20px 36px", borderRadius: 999, background: "#fff", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", display: "flex", gap: 14, alignItems: "center" }}>
        <Glyph name="droplet" size={40} color={P.green} weight={2.6} />
        <Label size={44} color={P.ink}>
          Robinet
        </Label>
      </div>
      <Txt words={kw("amani", { color: { 2: MINT_INK } })} size={120} on="deep" y={CY - 220} out={A6_END - 5} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A7: hoping it fixes itself
export const A7_END = pStart("lumea") - 8;

export const A7: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = A6_END;
  // the ring tries to close into a check… and gives up
  const draw = ease.inOutCubic(clamp01((frame - (w("speri3", 0) - 14)) / 22));
  const giveUp = ease.inOutCubic(clamp01((frame - (w("speri3", 2) + 4)) / 16));
  const p = draw * 0.72 * (1 - giveUp);
  const droop = giveUp * 40;
  const a = io(frame, t0 + 2, A7_END, 8, 8);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <svg width={300} height={300} viewBox="-60 -60 120 120" style={{ position: "absolute", left: CX - 150, top: CY - 250, opacity: a, transform: `translateY(${droop}px)` }}>
        <circle r={50} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle r={50} fill="none" stroke={P.green} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} transform="rotate(-90)" />
      </svg>
      <Txt words={[...kw("speri1"), ...kw("speri2")]} size={84} on="black" y={CY + 110} out={w("speri3", 0) - 6} />
      <Txt words={kw("speri3", { color: { 2: MINT_INK } })} size={84} on="black" y={CY + 110} out={A7_END - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ A8: nobody to call
export const A8_END = pStart("obositor") - 2;
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
export const A9_END = w("rogi", 0) - 3;

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
export const A10_END = pEnd("rogi") + 14;

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
export const A12_END = F(DROP);

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
