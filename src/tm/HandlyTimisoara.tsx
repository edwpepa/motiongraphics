import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Avatar, Person } from "../explainer/components/Avatar";
import { StoreBadge } from "../explainer/components/StoreBadge";
import { useExplainerFonts } from "../explainer/fonts";
import { clamp01, ease, lerp, seeded } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { GREEN_INK, Label, Logo, Txt, Wordmark } from "../launch/kit";
import { CITIES, Cathedral, Doodle, House, PhoneSketch, ServiceDoodle, proj, roPath } from "./art";
import { C, Drift, Ink, InkDefs, Paper, Wash, drawP } from "./ink";
import { DROP, F, TOTAL, bt, kw, pEnd, pStart, w } from "./timeline";

const CX = 960;
const CY = 540;

const Win: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  // each page fades/slides in over the last one, like a fresh sheet
  const inT = ease.outCubic(clamp01((f - from) / 10));
  return (
    <AbsoluteFill style={{ opacity: from === 0 ? 1 : inT, transform: `translateY(${(1 - inT) * 24}px)` }}>
      <Drift from={from} to={to}>{children}</Drift>
    </AbsoluteFill>
  );
};

/** brush highlight behind a word */
const Highlight: React.FC<{ x: number; y: number; w: number; at: number; color?: string }> = ({ x, y, w: wd, at, color = C.mint }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <Wash d={`M ${x - 20} ${y - 40} C ${x + wd * 0.3} ${y - 52}, ${x + wd * 0.7} ${y - 34}, ${x + wd + 20} ${y - 46} L ${x + wd + 14} ${y + 36} C ${x + wd * 0.6} ${y + 44}, ${x + wd * 0.3} ${y + 30}, ${x - 16} ${y + 40} Z`} p={drawP(f, at, 12)} color={color} seed={2} opacity={0.7} ox={x - 40} oy={y} r={wd + 160} />
    </svg>
  );
};

// ------------------------------------------------------------------ scene ends
const S1 = pStart("orice") - 8;
const S2 = pStart("s0") - 4;
const S3 = pStart("tot") - 4;
const S4 = DROP;
const S5 = pStart("alegi") - 6;
const S6 = pStart("daca") - 6;
const S7 = pStart("pornit") - 6;
const S8 = pStart("handly") - 8;

// ------------------------------------------------------------------ 1. Timișoara
const Intro: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <div style={{ position: "absolute", inset: 0, transform: "translateY(80px) scale(0.86)", transformOrigin: "50% 60%" }}>
      <Cathedral at={2} speed={1.3} />
    </div>
    <Txt words={kw("tm")} size={110} on="white" y={120} ink={[C.ink, C.ink]} tint={GREEN_INK} out={pStart("veste") - 6} />
    <Txt words={kw("veste", { color: { 2: GREEN_INK, 3: GREEN_INK } })} size={92} on="white" y={120} ink={[C.ink, C.ink]} tint={GREEN_INK} out={S1 - 4} />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 2. everything for the home, one place
const Home: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <House at={S1 + 2} x={1420} y={600} s={0.9} />
    <Txt words={kw("orice")} size={72} on="white" x={130} y={CY - 70} align="left" ink={[C.ink, C.ink]} tint={GREEN_INK} out={S2 - 4} />
    <Txt words={kw("loc", { cap: false, color: { 5: GREEN_INK, 6: GREEN_INK } })} size={72} on="white" x={130} y={CY + 30} align="left" ink={[C.ink, C.ink]} tint={GREEN_INK} out={S2 - 4} />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 3. the list: every doodle drawn as it's named
const SERV: Array<{ k: "s0" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6"; doodle: Doodle; label: string; at?: number }> = [
  { k: "s0", doodle: "pipes", label: "Instalații" },
  { k: "s1", doodle: "furniture", label: "Montat mobilă" },
  { k: "s2", doodle: "paint", label: "Zugrăvit" },
  { k: "s3", doodle: "clean", label: "Curățenie" },
  { k: "s4", doodle: "mower", label: "Tuns iarba" },
  { k: "s5", doodle: "boxes", label: "Mutat" },
  { k: "s6", doodle: "dog", label: "Plimbat cățelul" },
];
const cell = (i: number) => {
  const row = i < 4 ? 0 : 1;
  const col = row === 0 ? i : i - 4;
  const n = row === 0 ? 4 : 3;
  const x = CX + (col - (n - 1) / 2) * 420;
  const y = row === 0 ? 360 : 760;
  return { x, y };
};
const startOf = (i: number) => (i === 6 ? w("s6", 3) - 6 : pStart(SERV[i].k) - 4);

const List: React.FC<{ gather?: number }> = ({ gather = 0 }) => {
  const f = useCurrentFrame();
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {SERV.map((s, i) => {
          const at = startOf(i);
          if (f < at) return null;
          const c = cell(i);
          const gx = lerp(c.x, CX, gather);
          const gy = lerp(c.y - 30, CY + 40, gather);
          return <ServiceDoodle key={s.k} kind={s.doodle} at={at} x={gx} y={gy} s={1.12 * (1 - 0.88 * gather)} />;
        })}
      </svg>
      {SERV.map((s, i) => {
        const at = startOf(i);
        const t = clamp01((f - at - 4) / 10);
        if (t <= 0) return null;
        const c = cell(i);
        const active = i === SERV.length - 1 ? f >= at : f >= at && f < startOf(i + 1);
        return (
          <div key={s.k} style={{ position: "absolute", left: c.x, top: c.y + 140, transform: `translate(-50%, -50%) translateY(${(1 - ease.outCubic(t)) * 16}px) scale(${active ? 1.08 : 1})`, opacity: t * (1 - gather), fontFamily: FONT, fontWeight: BOLD, fontSize: 46, letterSpacing: "-0.03em", color: active ? C.greenDeep : C.ink, whiteSpace: "nowrap" }}>
            {s.label}
          </div>
        );
      })}
    </>
  );
};

const Services: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <List />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 4. "Tot. Pe Handly." — everything into the phone
const All: React.FC = () => {
  const f = useCurrentFrame();
  const gather = ease.inOutCubic(clamp01((f - (S3 + 4)) / 16));
  const phoneAt = w("pe", 0) - 10;
  const fill = drawP(f, w("pe", 1) - 6, 12);
  const logo = ease.outBack(clamp01((f - (w("pe", 1) - 2)) / 12));
  return (
    <AbsoluteFill>
      <Paper />
      {gather < 1 && <List gather={gather} />}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {f >= phoneAt && <PhoneSketch at={phoneAt} x={CX} y={CY + 30} s={0.85} fill={fill} />}
      </svg>
      {logo > 0 && (
        <div style={{ position: "absolute", left: CX - 90, top: CY + 30 - 120, transform: `scale(${logo})` }}>
          <Logo size={180} tone="white" />
        </div>
      )}
      <Txt words={kw("tot")} size={150} on="white" x={360} y={CY} ink={[C.ink, C.ink]} tint={GREEN_INK} />
      <Txt words={kw("pe", { color: { 1: GREEN_INK } })} size={110} on="white" x={1540} y={CY} ink={[C.ink, C.ink]} tint={GREEN_INK} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5. post it; verified taskers from Timișoara send offers
const OFFERS: Array<{ p: Person; price: string }> = [
  { p: "mihai", price: "150 lei" },
  { p: "andrei", price: "140 lei" },
  { p: "radu", price: "170 lei" },
];
const App: React.FC = () => {
  const f = useCurrentFrame();
  const P = (k: number, d = 12) => drawP(f, S4 + k, d);
  const off = w("oferte", 6) - 6;
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <PhoneSketch at={S4} x={560} y={560} s={0.95}>
          {/* the form, scribbled in */}
          <Ink d="M -110 -200 L 60 -200" p={P(10)} w={6} />
          <Ink d="M -110 -150 L 110 -150 L 110 -100 L -110 -100 Z" p={P(14)} w={4} />
          <Ink d="M -95 -125 C -70 -135, -50 -115, -30 -125 S 10 -115, 30 -125" p={P(20, 10)} w={3.5} color={C.greenDeep} />
          <Ink d="M -110 -60 L 110 -60 L 110 40 L -110 40 Z" p={P(24)} w={4} />
          <Ink d="M -10 -10 C -10 -40, 20 -40, 20 -10 C 20 10, 5 20, 5 30 C 5 20, -10 10, -10 -10 Z" p={P(30)} w={3.5} color={C.greenDeep} />
          <Wash d="M -110 200 L 110 200 L 110 250 L -110 250 Z" p={P(36)} color={C.green} seed={0} opacity={0.9} ox={0} oy={225} r={160} />
          <Ink d="M -110 200 L 110 200 L 110 250 L -110 250 Z" p={P(34)} w={4} />
        </PhoneSketch>
        {/* stopwatch: under a minute */}
        <g transform="translate(860 300)">
          <Ink d="M 0 -70 C 40 -70, 70 -40, 70 0 C 70 40, 40 70, 0 70 C -40 70, -70 40, -70 0 C -70 -40, -40 -70, 0 -70" p={P(16)} w={5} />
          <Ink d="M -10 -84 L 10 -84 M 0 -84 L 0 -70" p={P(20)} w={5} />
          <Wash d="M 0 0 L 0 -62 A 62 62 0 1 1 -50 36 Z" p={P(30, 20)} color={C.mint} seed={1} ox={0} oy={0} r={90} />
          <Ink d="M 0 0 L 0 -48 M 0 0 L 30 18" p={P(24)} w={5} />
        </g>
      </svg>
      {/* offers coming in */}
      {OFFERS.map((o, i) => {
        const at = off + i * 6;
        const t = ease.outBack(clamp01((f - at) / 12), 1.3);
        if (t <= 0) return null;
        return (
          <div key={o.p} style={{ position: "absolute", left: 1060, top: 520 + i * 150, transform: `scale(${t}) rotate(${(1 - t) * -8 + (i - 1) * 1.2}deg)`, transformOrigin: "0 50%", display: "flex", alignItems: "center", gap: 20, padding: "14px 30px 14px 14px", borderRadius: 999, background: "#fffaf0", border: `3px solid ${C.ink}`, boxShadow: "6px 6px 0 rgba(31,42,37,0.15)" }}>
            <Avatar person={o.p} size={92} dark={false} ring={C.green} />
            <Label size={44} color={C.ink}>
              {o.price}
            </Label>
            <svg width={30} height={30} viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={C.greenDeep} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      })}
      <Txt words={kw("postezi", { only: [0, 1, 2, 3], color: { 0: GREEN_INK } })} size={72} on="white" x={1000} y={170} align="left" ink={[C.ink, C.ink]} tint={GREEN_INK} out={pStart("oferte") - 6} />
      <Txt words={kw("postezi", { only: [4, 5, 6, 7, 8, 9] })} size={72} on="white" x={1000} y={260} align="left" ink={[C.ink, C.ink]} tint={GREEN_INK} out={pStart("oferte") - 6} />
      <Txt words={kw("oferte", { only: [0, 1, 2], cap: true, color: { 2: GREEN_INK } })} size={68} on="white" x={1000} y={170} align="left" ink={[C.ink, C.ink]} tint={GREEN_INK} out={S5 - 6} />
      <Txt words={kw("oferte", { only: [3, 4, 5, 6, 7], color: { 4: GREEN_INK } })} size={68} on="white" x={1000} y={260} align="left" ink={[C.ink, C.ink]} tint={GREEN_INK} out={S5 - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6. choose · pay safely · follow it live
const Trust: React.FC = () => {
  const f = useCurrentFrame();
  const a1 = w("alegi", 1) - 8;
  const a2 = w("platesti", 0) - 8;
  const a3 = w("urmaresti", 1) - 8;
  const P = (at: number, k: number, d = 12) => drawP(f, at + k, d);
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* 1: a profile card, circled with a tick */}
        <g transform="translate(460 470)">
          <Wash d="M -120 -130 L 120 -130 L 120 130 L -120 130 Z" p={P(a1, 8, 16)} color={C.sand} seed={0} ox={0} oy={0} r={220} opacity={0.6} />
          <Ink d="M -120 -130 L 120 -130 L 120 130 L -120 130 Z" p={P(a1, 0)} />
          <Ink d="M 0 -80 C 30 -80, 40 -60, 40 -40 C 40 -15, 20 0, 0 0 C -20 0, -40 -15, -40 -40 C -40 -60, -30 -80, 0 -80 M -70 90 C -60 30, 60 30, 70 90" p={P(a1, 4)} w={4.5} />
          <Ink d="M -160 -170 C -40 -230, 200 -190, 170 -20 C 150 150, -100 200, -170 60 C -210 -40, -150 -150, -60 -175" p={P(a1, 12, 16)} w={4} color={C.greenDeep} />
          <Ink d="M 80 120 L 110 150 L 170 80" p={P(a1, 18, 8)} w={7} color={C.greenDeep} />
        </g>
        {/* 2: a shield with a lock */}
        <g transform="translate(960 470)">
          <Wash d="M 0 -150 C 60 -120, 110 -120, 130 -120 C 130 20, 90 110, 0 160 C -90 110, -130 20, -130 -120 C -110 -120, -60 -120, 0 -150 Z" p={P(a2, 8, 16)} color={C.green} seed={1} ox={0} oy={0} r={240} />
          <Ink d="M 0 -150 C 60 -120, 110 -120, 130 -120 C 130 20, 90 110, 0 160 C -90 110, -130 20, -130 -120 C -110 -120, -60 -120, 0 -150 Z" p={P(a2, 0)} />
          <Ink d="M -40 -10 L 40 -10 L 40 60 L -40 60 Z M -25 -10 L -25 -40 C -25 -70, 25 -70, 25 -40 L 25 -10" p={P(a2, 10)} w={5} color="#ffffff" />
        </g>
        {/* 3: progress, live */}
        <g transform="translate(1460 470)">
          <Ink d="M -150 0 L 150 0" p={P(a3, 0, 20)} w={5} color={C.inkSoft} />
          {[-150, -50, 50, 150].map((x, i) => {
            const on = P(a3, 6 + i * 6, 8);
            return (
              <g key={i}>
                <Wash d={`M ${x - 26} 0 C ${x - 26} -34, ${x + 26} -34, ${x + 26} 0 C ${x + 26} 34, ${x - 26} 34, ${x - 26} 0 Z`} p={on} color={C.green} seed={i % 3} ox={x} oy={0} r={50} />
                <Ink d={`M ${x - 26} 0 C ${x - 26} -34, ${x + 26} -34, ${x + 26} 0 C ${x + 26} 34, ${x - 26} 34, ${x - 26} 0`} p={P(a3, 2 + i * 4, 8)} w={4} />
              </g>
            );
          })}
          <Ink d="M 120 -60 L 145 -35 L 190 -95" p={P(a3, 34, 8)} w={7} color={C.greenDeep} />
        </g>
      </svg>
      <Txt words={kw("alegi", { color: { 1: GREEN_INK } })} size={56} on="white" x={460} y={790} ink={[C.ink, C.ink]} tint={GREEN_INK} />
      <Txt words={kw("platesti", { cap: true, color: { 2: GREEN_INK } })} size={56} on="white" x={960} y={790} ink={[C.ink, C.ink]} tint={GREEN_INK} />
      <Txt words={kw("urmaresti", { only: [1, 2], cap: true, color: { 2: GREEN_INK } })} size={56} on="white" x={1460} y={790} ink={[C.ink, C.ink]} tint={GREEN_INK} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7. earn from what you know, on your time
const Earn: React.FC = () => {
  const f = useCurrentFrame();
  const P = (k: number, d = 12) => drawP(f, S6 + k, d);
  const coinsAt = w("castigi", 0) - 6;
  const clockAt = w("timp", 0) - 8;
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* a tasker with a toolbox */}
        <g transform="translate(560 560)">
          <Wash d="M -90 -60 C -90 -100, 90 -100, 90 -60 L 110 140 L -110 140 Z" p={P(10, 18)} color={C.green} seed={0} ox={0} oy={40} r={240} />
          <Wash d="M 70 60 L 210 60 L 210 140 L 70 140 Z" p={P(16, 14)} color={C.warm} seed={1} ox={140} oy={100} r={140} />
          <Ink d="M 0 -220 C 45 -220, 60 -190, 60 -160 C 60 -120, 30 -100, 0 -100 C -30 -100, -60 -120, -60 -160 C -60 -190, -45 -220, 0 -220" p={P(0)} />
          <Ink d="M -70 -200 C -50 -250, 50 -250, 70 -200 L 100 -195" p={P(4)} w={5} />
          <Ink d="M -90 -60 C -90 -100, 90 -100, 90 -60 L 110 140 M -90 -60 L -110 140" p={P(6)} />
          <Ink d="M 70 60 L 210 60 L 210 140 L 70 140 Z M 115 60 L 115 40 L 165 40 L 165 60" p={P(12)} w={4.5} />
        </g>
        {/* coins into a jar */}
        <g transform="translate(1100 600)">
          <Ink d="M -90 -80 L -90 120 C -90 150, 90 150, 90 120 L 90 -80 M -100 -80 L 100 -80" p={drawP(f, coinsAt - 6, 12)} />
          {[0, 1, 2, 3, 4].map((i) => {
            const t = clamp01((f - (coinsAt + i * 4)) / 12);
            if (t <= 0) return null;
            const y = lerp(-260, 100 - i * 24, ease.inCubic(t)) + (t >= 1 ? 0 : 0);
            const x = (seeded(i, 2) - 0.5) * 40;
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <ellipse rx={44} ry={14} fill={C.warm} opacity={0.85} />
                <ellipse rx={44} ry={14} fill="none" stroke={C.ink} strokeWidth={3.5} />
              </g>
            );
          })}
        </g>
        {/* a clock: on your time */}
        <g transform="translate(1520 560)">
          <Wash d="M -110 0 C -110 -60, -60 -110, 0 -110 C 60 -110, 110 -60, 110 0 C 110 60, 60 110, 0 110 C -60 110, -110 60, -110 0 Z" p={drawP(f, clockAt + 6, 14)} color={C.mint} seed={2} ox={0} oy={0} r={160} />
          <Ink d="M -110 0 C -110 -60, -60 -110, 0 -110 C 60 -110, 110 -60, 110 0 C 110 60, 60 110, 0 110 C -60 110, -110 60, -110 0" p={drawP(f, clockAt, 14)} />
          <g transform={`rotate(${clamp01((f - clockAt - 8) / 30) * 300})`}>
            <Ink d="M 0 0 L 0 -75" p={drawP(f, clockAt + 8, 8)} w={6} />
          </g>
          <Ink d="M 0 0 L 45 25" p={drawP(f, clockAt + 10, 8)} w={6} />
        </g>
      </svg>
      <Txt words={kw("daca", { color: { 5: GREEN_INK } })} size={80} on="white" y={150} ink={[C.ink, C.ink]} tint={GREEN_INK} out={pStart("castigi") - 6} />
      <Txt words={[...kw("castigi", { cap: true, color: { 0: GREEN_INK } }), ...kw("timp", { cap: false, color: { 3: GREEN_INK } })]} size={80} on="white" y={150} ink={[C.ink, C.ink]} tint={GREEN_INK} out={S7 - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 8. we started in Timișoara — soon everywhere
const MapScene: React.FC = () => {
  const f = useCurrentFrame();
  const spreadAt = w("curand", 3) - 6;
  const tm = proj(CITIES[0].lon, CITIES[0].lat);
  const d = roPath();
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Wash d={d} p={drawP(f, S7 + 14, 26)} color={C.mint} seed={1} opacity={0.65} ox={tm[0]} oy={tm[1]} r={1200} />
        <Ink d={d} p={drawP(f, S7, 30)} w={5} />
        {/* the spread: dotted routes out of Timișoara */}
        {CITIES.slice(1).map((c, i) => {
          const at = spreadAt + i * 3;
          const p = drawP(f, at, 12);
          const [x, y] = proj(c.lon, c.lat);
          const mx = (tm[0] + x) / 2;
          const my = (tm[1] + y) / 2 - 60;
          const pop = ease.outBack(clamp01((f - (at + 10)) / 10), 1.6);
          return (
            <g key={c.n}>
              {p > 0.01 && (
                <polyline
                  points={Array.from({ length: 41 }, (_, j) => {
                    const u = (j / 40) * p;
                    const qx = (1 - u) * (1 - u) * tm[0] + 2 * (1 - u) * u * mx + u * u * x;
                    const qy = (1 - u) * (1 - u) * tm[1] + 2 * (1 - u) * u * my + u * u * y;
                    return `${qx.toFixed(1)},${qy.toFixed(1)}`;
                  }).join(" ")}
                  fill="none"
                  stroke={C.greenDeep}
                  strokeWidth={3.5}
                  strokeDasharray="1 11"
                  strokeLinecap="round"
                  opacity={0.75}
                />
              )}
              {pop > 0 && (
                <g transform={`translate(${x} ${y}) scale(${pop})`}>
                  <circle r={11} fill={C.green} stroke={C.ink} strokeWidth={3} />
                  <text x={16} y={-14} fontFamily={FONT} fontWeight={BOLD} fontSize={26} fill={C.ink} letterSpacing="-0.02em">
                    {c.n}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* Timișoara, glowing */}
        {(() => {
          const pop = ease.outBack(clamp01((f - (w("pornit", 3) - 8)) / 12), 1.5);
          if (pop <= 0) return null;
          const r = ((f % 40) / 40) * 70;
          return (
            <g transform={`translate(${tm[0]} ${tm[1]})`}>
              <circle r={20 + r} fill="none" stroke={C.green} strokeWidth={3} opacity={1 - r / 70} />
              <g transform={`scale(${pop})`}>
                <path d="M 0 0 C -30 -40, -30 -70, 0 -80 C 30 -70, 30 -40, 0 0 Z" fill={C.green} stroke={C.ink} strokeWidth={4} transform="translate(0 -4)" />
                <circle cy={-58} r={10} fill="#fff" />
                <text x={-34} y={-50} textAnchor="end" fontFamily={FONT} fontWeight={BOLD} fontSize={40} fill={C.ink} letterSpacing="-0.03em">
                  Timișoara
                </text>
              </g>
            </g>
          );
        })()}
      </svg>
      <Txt words={kw("pornit", { color: { 3: GREEN_INK } })} size={76} on="white" y={110} ink={[C.ink, C.ink]} tint={GREEN_INK} out={pStart("curand") - 6} />
      <Txt words={kw("curand", { color: { 3: GREEN_INK, 4: GREEN_INK } })} size={76} on="white" y={110} ink={[C.ink, C.ink]} tint={GREEN_INK} out={S8 - 4} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 9. Handly — a splash of paint, the mark, download
const Final: React.FC = () => {
  const f = useCurrentFrame();
  const splash = drawP(f, S8, 16);
  const logo = ease.outBack(clamp01((f - (S8 + 8)) / 14), 1.3);
  const badges = (k: number) => ease.outBack(clamp01((f - (w("cta", 1) - 4 + k * 5)) / 12));
  const fade = ease.inOutCubic(clamp01((f - (TOTAL - 20)) / 18));
  const blob = "M 960 230 C 1180 200, 1360 300, 1380 470 C 1420 640, 1300 800, 1060 820 C 820 860, 600 760, 560 560 C 520 380, 700 250, 960 230 Z M 1420 330 C 1450 320, 1470 340, 1460 360 C 1450 380, 1420 370, 1420 330 Z M 520 760 C 540 740, 570 750, 560 780 C 550 800, 515 790, 520 760 Z M 1360 800 C 1380 795, 1395 810, 1388 828 C 1380 842, 1355 832, 1360 800 Z";
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Wash d={blob} p={splash} color={C.green} seed={1} opacity={0.92} ox={960} oy={520} r={700} />
      </svg>
      <div style={{ position: "absolute", left: CX, top: 470, transform: `translate(-50%, -50%) scale(${logo})`, display: "flex", alignItems: "center", gap: 30 }}>
        <Logo size={150} tone="white" />
        <div style={{ transform: "translateY(-8px)" }}>
          <Wordmark size={150} color="#ffffff" ro />
        </div>
      </div>
      <div style={{ position: "absolute", left: CX, top: 660, transform: "translate(-50%, -50%)", display: "flex", gap: 24 }}>
        {(["apple", "google"] as const).map((s, k) => (
          <div key={s} style={{ transform: `scale(${badges(k)})` }}>
            <StoreBadge store={s} h={84} shine={clamp01((f - (w("cta", 2) + k * 6)) / 20)} />
          </div>
        ))}
      </div>
      <Txt words={kw("cta", { color: { 5: GREEN_INK } })} size={64} on="white" y={940} ink={[C.ink, C.ink]} tint={GREEN_INK} />
      <AbsoluteFill style={{ background: C.paper, opacity: fade }} />
    </AbsoluteFill>
  );
};

export const HandlyTimisoara: React.FC = () => {
  const ready = useExplainerFonts();
  if (!ready) return <AbsoluteFill style={{ background: C.paper }} />;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <InkDefs />
      <Win from={0} to={S1}>
        <Intro />
      </Win>
      <Win from={S1} to={S2}>
        <Home />
      </Win>
      <Win from={S2} to={S3}>
        <Services />
      </Win>
      <Win from={S3} to={S4}>
        <All />
      </Win>
      <Win from={S4} to={S5}>
        <App />
      </Win>
      <Win from={S5} to={S6}>
        <Trust />
      </Win>
      <Win from={S6} to={S7}>
        <Earn />
      </Win>
      <Win from={S7} to={S8}>
        <MapScene />
      </Win>
      <Win from={S8} to={TOTAL}>
        <Final />
      </Win>
      <Audio src={staticFile("audio/tm-mix.mp3")} />
    </AbsoluteFill>
  );
};

export { bt, F, pEnd };
