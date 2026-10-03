import React from "react";
import { C1_END, C2_END, C3_END, C4_END, C5_END, C8_END, C9_END } from "./scenes";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { textWidth } from "../explainer/components/AppleText";
import { Avatar } from "../explainer/components/Avatar";
import { Glyph } from "../explainer/components/Icons";
import { Phone, PHONE_H, PHONE_W } from "../explainer/components/Phone";
import { StoreBadge } from "../explainer/components/StoreBadge";
import { clamp01, ease, lerp, seeded } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { Bg, BgKind, GREEN_INK, Label, Logo, MINT_INK, P, Shape, Txt, Win, Wordmark, punch } from "./kit";
import { morphNamed, shape, ShapeName } from "./morph";
import { Slam } from "./slam";
import { absorbed, Explosion, ServiceName, ServiceTile, SERVICES, Vortex } from "./fx";
import { HEARTBEATS, SPLIT } from "./scenes";
import { BEATS, BREAK, BRIDGE, DROP, END, END_HIT, F, FINAL, kw, pEnd, pStart, w, words } from "./timeline";

const CX = 960;
const CY = 540;
const D0 = F(DROP);
const bt = (k: number) => Math.round(D0 + k * BEATS);
const beatAt = (frame: number) => Math.floor((frame - D0 + 0.5) / BEATS);

// ------------------------------------------------------------------ C1: not only for those who need help

type PW = { text: string; i: number; x: number; y: number; size: number; color: string };

/** lays the line out as a kinetic poster: big "Dar Handly", a huge "doar", the rest underneath */
const posterLayout = (): { words: PW[]; logo: { x: number; y: number; s: number } } => {
  const ws = words("dar").map(([t]) => t);
  const rows: Array<{ idx: number[]; size: number; y: number; lead?: number }> = [
    { idx: [0, 1], size: 130, y: -230, lead: 150 },
    { idx: [2, 3, 4], size: 130, y: -20 },
    { idx: [5, 6, 7, 8, 9, 10, 11], size: 66, y: 250 },
  ];
  const out: PW[] = [];
  let logo = { x: 0, y: 0, s: 130 };
  rows.forEach((r) => {
    const sizes = r.idx.map((i) => (i === 4 ? 220 : r.size));
    const widths = r.idx.map((i, j) => textWidth(ws[i], sizes[j], -0.045));
    const gaps = sizes.map((z) => 0.27 * z);
    const total = (r.lead ?? 0) + widths.reduce((a, b) => a + b, 0) + gaps.slice(0, -1).reduce((a, b) => a + b, 0);
    let x = -total / 2;
    if (r.lead) {
      logo = { x: x + 65, y: r.y, s: 130 };
      x += r.lead;
    }
    r.idx.forEach((i, j) => {
      const color = i === 1 || i === 4 ? P.green : r.size < 100 ? "#3b4440" : P.ink;
      out.push({ text: ws[i], i, x: x + widths[j] / 2, y: r.y + (i === 4 ? 18 : 0), size: sizes[j], color });
      x += widths[j] + gaps[j];
    });
  });
  return { words: out, logo };
};

const C1: React.FC = () => {
  const frame = useCurrentFrame();
  const { words: pw, logo } = posterLayout();
  const at = words("dar").map(([, f]) => f - 3);
  // the camera rides from word to word, then pulls back to the whole poster
  const focusAt = (k: number) => (k >= 5 ? { x: 0, y: 10, z: 1.02 } : { x: pw[k].x, y: pw[k].y, z: k === 4 ? 1.05 : 1.45 });
  let cam = focusAt(0);
  for (let k = 1; k < pw.length; k++) {
    const t = ease.inOutCubic(clamp01((frame - at[k] + 2) / 12));
    if (t <= 0) break;
    const nx = focusAt(k);
    cam = { x: lerp(cam.x, nx.x, t), y: lerp(cam.y, nx.y, t), z: lerp(cam.z, nx.z, t) };
  }
  const drift = 1 + 0.03 * clamp01((frame - at[5]) / 60);
  const out = ease.inCubic(clamp01((frame - (C1_END - 8)) / 8));
  const underline = ease.inOutCubic(clamp01((frame - (at[4] + 10)) / 18));
  const doar = pw[4];
  const dw = textWidth(doar.text, doar.size, -0.045);
  const lp = ease.outBack(clamp01((frame - at[1]) / 14));
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 16}px)` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${CX - cam.x * cam.z * drift}px, ${CY - cam.y * cam.z * drift}px) scale(${cam.z * drift})` }}>
          {/* a thin brush line under "doar", drawn left to right */}
          <svg width={dw + 80} height={60} style={{ position: "absolute", left: doar.x - dw / 2 - 40, top: doar.y + doar.size * 0.42, overflow: "visible" }}>
            <defs>
              <filter id="bristle" x="-5%" y="-100%" width="110%" height="300%">
                <feTurbulence type="fractalNoise" baseFrequency="0.02 0.6" numOctaves={2} seed={7} result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale={5} />
              </filter>
              <linearGradient id="taper" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fff" stopOpacity={0} />
                <stop offset="8%" stopColor="#fff" stopOpacity={1} />
                <stop offset="88%" stopColor="#fff" stopOpacity={1} />
                <stop offset="100%" stopColor="#fff" stopOpacity={0} />
              </linearGradient>
              <mask id="taperMask">
                <rect x={0} y={-20} width={dw + 80} height={100} fill="url(#taper)" />
              </mask>
            </defs>
            <g filter="url(#bristle)" mask="url(#taperMask)">
              <path d={`M 40 34 C ${dw * 0.35} 24, ${dw * 0.7} 38, ${dw + 40} 22`} stroke={P.green} strokeWidth={11} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${underline} 1`} />
              <path d={`M 52 38 C ${dw * 0.35} 29, ${dw * 0.7} 42, ${dw + 30} 27`} stroke={P.green} strokeOpacity={0.45} strokeWidth={4} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(underline - 0.06)} 1`} />
            </g>
          </svg>
          <div style={{ position: "absolute", left: logo.x - logo.s / 2, top: logo.y - logo.s / 2 - 8, transform: `scale(${lp}) rotate(${(1 - lp) * -30}deg)`, opacity: clamp01(lp * 2) }}>
            <Logo size={logo.s} />
          </div>
          {pw.map((p, k) => {
            const t = clamp01((frame - at[k]) / 11);
            if (t <= 0) return null;
            const e = ease.outCubic(t);
            const big = p.i === 4;
            const sc = lerp(big ? 1.9 : 2.2, 1, e);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  transform: `translate(-50%, -50%) scale(${sc}) translateY(${(1 - e) * 30}px)`,
                  opacity: clamp01(t * 2.5),
                  filter: e < 0.98 ? `blur(${(1 - e) * 18}px)` : undefined,
                  fontFamily: FONT,
                  fontWeight: BOLD,
                  fontSize: p.size,
                  letterSpacing: "-0.045em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  color: p.color,
                }}
              >
                {p.text}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C2: if you know how to do something

const C2: React.FC = () => {
  const frame = useCurrentFrame();
  const spark = ease.outBack(clamp01((frame - (w("daca", 4) - 2)) / 12));
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      <Txt words={kw("daca", { color: { 4: GREEN_INK } })} size={140} on="white" />
      {spark > 0 && <Shape pts={shape("star")} x={CX + 640} y={CY - 110} size={110 * spark} rot={frame * 3} fill={P.green} />}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C3: the skills — colour cuts with morphing badges
const ICONS: Record<string, string> = {
  box: `<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>`,
  sparkles: `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>`,
  sofa: `<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/>`,
};
const Icon: React.FC<{ name: string; size: number; color: string }> = ({ name, size, color }) =>
  name in ICONS ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
  ) : (
    <Glyph name={name as "wrench"} size={size} color={color} weight={2} />
  );

const SKILLS: Array<{ from: number; words: number[]; bg: BgKind; shape: ShapeName; icon: string }> = [
  { from: 0, words: [0, 1], bg: "green", shape: "square", icon: "sofa" },
  { from: 2, words: [2], bg: "black", shape: "circle", icon: "roller" },
  { from: 3, words: [3], bg: "white", shape: "flower", icon: "wrench" },
  { from: 4, words: [4], bg: "deep", shape: "badge", icon: "sparkles" },
  { from: 5, words: [5], bg: "green", shape: "star", icon: "box" },
];

const C3: React.FC = () => {
  const frame = useCurrentFrame();
  const cuts = SKILLS.map((s) => w("skills", s.from) - 3);
  let i = 0;
  for (let k = 0; k < cuts.length; k++) if (frame >= cuts[k]) i = k;
  const s = SKILLS[i];
  const prev = SKILLS[Math.max(0, i - 1)];
  const local = frame - cuts[i];
  const t = clamp01(local / 8);
  const pts = i === 0 ? shape(s.shape) : morphNamed(prev.shape, s.shape, ease.outBack(t), 1.3, frame);
  const fill = s.bg === "green" ? "#ffffff" : s.bg === "white" ? P.green : s.bg === "deep" ? P.mint : P.green;
  const iconColor = s.bg === "green" ? P.green : s.bg === "deep" ? P.deep : "#ffffff";
  const pop = ease.outBack(clamp01(local / 14), 1.2);
  return (
    <AbsoluteFill>
      <Bg kind={s.bg} />
      <div style={{ position: "absolute", left: CX - 135, top: CY - 310, transform: `scale(${pop * punch(frame, cuts[i], 0.06, 14)}) rotate(${(1 - pop) * -20}deg)` }}>
        <ServiceTile name={s.icon as ServiceName} size={270} tone={s.bg === "green" ? "white" : "green"} />
      </div>
      <Txt key={i} words={kw("skills", { only: s.words, lead: 4 }).map((x) => ({ ...x, at: Math.max(x.at, cuts[i]) }))} size={150} on={s.bg} y={CY + 170} dur={9} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C4: sign up as a tasker, start earning

const C4: React.FC = () => {
  const frame = useCurrentFrame();
  const b0 = C3_END;
  const ph2 = w("cont", 8) - 6;
  const card = ease.outExpo(clamp01((frame - (w("cont", 2) - 8)) / 20));
  const badge = ease.outBack(clamp01((frame - (w("cont", 4) - 2)) / 12));
  const lift = ease.inOutCubic(clamp01((frame - ph2) / 16));
  const earn = ease.outExpo(clamp01((frame - (ph2 + 4)) / 20));
  const amount = Math.round(lerp(0, 2450, ease.inOutCubic(clamp01((frame - (w("cont", 11) - 6)) / 34))));
  const outT = ease.inCubic(clamp01((frame - (C4_END - 7)) / 7));
  const RX = 1150;
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      <Txt words={kw("cont", { only: [0, 1, 2, 3, 4], color: { 4: MINT_INK } })} size={88} on="deep" x={140} y={CY - 60} align="left" out={ph2 - 4} />
      <Txt words={kw("cont", { only: [5, 6, 7] })} size={88} on="deep" x={140} y={CY + 50} align="left" out={ph2 - 4} />
      <Txt words={kw("cont", { only: [8, 9, 10, 11], color: { 11: MINT_INK } })} size={88} on="deep" x={140} y={CY - 60} align="left" out={C4_END - 6} />
      <Txt words={kw("cont", { only: [12, 13, 14, 15, 16, 17] })} size={88} on="deep" x={140} y={CY + 50} align="left" out={C4_END - 6} />
      {/* profile */}
      <div
        style={{
          position: "absolute",
          left: RX,
          top: CY - 250 - 150 * lift,
          width: 620,
          height: 300,
          borderRadius: 44,
          background: "#fff",
          boxShadow: "0 50px 100px rgba(0,0,0,0.35)",
          transform: `translateX(${(1 - card) * 700}px) scale(${1 - 0.08 * lift - 0.06 * outT})`,
          opacity: card * (1 - outT),
          fontFamily: FONT,
          fontWeight: BOLD,
          padding: 36,
          display: "flex",
          gap: 28,
        }}
      >
        <Avatar person="andrei" size={150} dark={false} lit={badge} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
          <div style={{ fontSize: 44, color: P.ink, letterSpacing: "-0.03em" }}>Andrei P.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, color: P.green, transform: `scale(${badge})`, transformOrigin: "0 50%" }}>
            <Glyph name="check" size={24} color={P.green} weight={3.2} />
            Tasker verificat
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {["Montaj", "Zugrăveli", "Reparații"].map((c, i) => {
              const p = ease.outBack(clamp01((frame - (w("cont", 5) + i * 4)) / 10));
              return (
                <div key={c} style={{ padding: "10px 18px", borderRadius: 999, background: "#eef5f1", fontSize: 22, color: P.ink, fontWeight: 500, transform: `scale(${p})`, opacity: p }}>
                  {c}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* earnings */}
      {earn > 0 && (
        <div
          style={{
            position: "absolute",
            left: RX,
            top: CY - 40,
            width: 620,
            height: 330,
            borderRadius: 44,
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(185,255,214,0.2)",
            backdropFilter: "blur(20px)",
            transform: `translateY(${(1 - earn) * 200}px) scale(${1 - 0.06 * outT})`,
            opacity: earn * (1 - outT),
            fontFamily: FONT,
            fontWeight: BOLD,
            padding: 40,
          }}
        >
          <div style={{ fontSize: 26, color: "rgba(185,255,214,0.75)", fontWeight: 500 }}>Câștigat luna asta</div>
          <div style={{ fontSize: 88, color: "#fff", letterSpacing: "-0.05em", marginTop: 6 }}>
            {amount.toLocaleString("ro-RO")} <span style={{ fontSize: 44, color: P.mint }}>lei</span>
          </div>
          <div style={{ position: "absolute", left: 40, right: 40, bottom: 36, height: 90, display: "flex", alignItems: "flex-end", gap: 14 }}>
            {[0.3, 0.45, 0.4, 0.62, 0.55, 0.78, 0.7, 1].map((h, i) => {
              const g = ease.outCubic(clamp01((frame - (ph2 + 12 + i * 3)) / 14));
              return <div key={i} style={{ flex: 1, height: `${h * 100 * g}%`, borderRadius: 8, background: i === 7 ? P.green : "rgba(185,255,214,0.25)" }} />;
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C5: you choose — the slot word rolls
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

const C5: React.FC = () => {
  const frame = useCurrentFrame();
  const FS = 124;
  const lead = textWidth("Tu alegi", FS, -0.045) + 0.42 * FS;
  const slots = [
    { key: "program" as const, words: [2], width: textWidth("programul.", FS, -0.045) },
    { key: "taskurile" as const, words: [2], width: textWidth("task-urile.", FS, -0.045) },
    { key: "muncesti" as const, words: [2, 3], width: textWidth("cât muncești.", FS, -0.045) + 0.27 * FS },
  ];
  const starts = [w("program", 2), w("taskurile", 2), w("muncesti", 2)];
  let i = 0;
  for (let k = 0; k < 3; k++) if (frame >= starts[k] - 4) i = k;
  const widths = slots.map((s) => lead + s.width);
  const prevW = widths[Math.max(0, i - 1)];
  const lineW = lerp(prevW, widths[i], ease.inOutCubic(clamp01((frame - (starts[i] - 6)) / 10)));
  const x0 = CX - lineW / 2;
  const Y = CY - 170;
  const vis = (k: number) => clamp01((frame - (starts[k] - 6)) / 8) * (k < 2 ? 1 - clamp01((frame - (starts[k + 1] - 8)) / 6) : 1);
  const outT = ease.inCubic(clamp01((frame - (C5_END - 8)) / 8));
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <div style={{ opacity: 1 - outT }}>
        <Txt words={kw("program", { only: [0, 1] })} size={FS} on="black" x={x0} y={Y} align="left" />
        {slots.map((s, k) => (
          <Txt key={k} words={kw(s.key, { only: s.words, color: { 2: MINT_INK, 3: MINT_INK } })} size={FS} on="black" x={x0 + lead} y={Y} align="left" out={k < 2 ? starts[k + 1] - 7 : undefined} />
        ))}
        {/* 1: the week — days toggle on */}
        {vis(0) > 0 && (
          <div style={{ position: "absolute", left: CX, top: CY + 160, transform: `translate(-50%, -50%) translateY(${(1 - vis(0)) * 40}px)`, opacity: vis(0), display: "flex", gap: 22 }}>
            {DAYS.map((d, j) => {
              const on = [0, 2, 3, 5].includes(j) && frame >= starts[0] + j * 3;
              return (
                <div key={j} style={{ width: 120, height: 120, borderRadius: 34, background: on ? P.green : "rgba(255,255,255,0.06)", border: on ? "none" : "1.5px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${on ? punch(frame, starts[0] + j * 3, 0.12, 8) : 1})` }}>
                  <Label size={44} color={on ? "#fff" : "rgba(255,255,255,0.5)"}>
                    {d}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
        {/* 2: tasks — swipe the ones you want */}
        {vis(1) > 0 && (
          <div style={{ position: "absolute", left: CX, top: CY + 160, transform: `translate(-50%, -50%) translateY(${(1 - vis(1)) * 40}px)`, opacity: vis(1), display: "flex", gap: 26 }}>
            {[
              ["Montaj dulap", "200 lei", true],
              ["Zugrăvit hol", "450 lei", false],
              ["Schimbat priză", "90 lei", true],
            ].map(([t, p, ok], j) => {
              const at = starts[1] + 4 + j * 5;
              const d = ease.outCubic(clamp01((frame - at) / 8));
              return (
                <div key={j} style={{ width: 330, height: 150, borderRadius: 32, background: ok ? "rgba(0,191,99,0.16)" : "rgba(255,255,255,0.05)", border: `1.5px solid ${ok ? `rgba(0,191,99,${0.3 + 0.5 * d})` : "rgba(255,255,255,0.12)"}`, padding: 26, fontFamily: FONT, fontWeight: BOLD, position: "relative", opacity: ok ? 1 : 1 - 0.6 * d, transform: `translateY(${ok ? 0 : d * 30}px)` }}>
                  <div style={{ fontSize: 30, color: "#fff", letterSpacing: "-0.02em" }}>{t as string}</div>
                  <div style={{ fontSize: 26, color: P.mint, marginTop: 10 }}>{p as string}</div>
                  {ok && (
                    <div style={{ position: "absolute", right: 22, top: 22, width: 44, height: 44, borderRadius: 22, background: P.green, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${ease.outBack(d)})` }}>
                      <Glyph name="check" size={26} color="#fff" weight={3.4} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* 3: how much — the hours slider (it carries straight on into the next shot, so it never fades) */}
      <div>
        {vis(2) > 0 && (
          <div style={{ position: "absolute", left: CX - 450, top: CY + 120, width: 900, opacity: vis(2), transform: `translateY(${(1 - vis(2)) * 40}px)` }}>
            {(() => {
              const v = ease.inOutCubic(clamp01((frame - (starts[2] + 2)) / 22));
              const hours = Math.round(lerp(5, 25, v));
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 26, opacity: 1 - outT }}>
                    <Label size={34} color="rgba(255,255,255,0.6)" weight={500}>
                      Ore pe săptămână
                    </Label>
                    <Label size={40} color={P.mint}>{`${hours}h`}</Label>
                  </div>
                  <div style={{ position: "relative", height: 16, borderRadius: 8, background: "rgba(255,255,255,0.1)" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${lerp(10, 70, v)}%`, borderRadius: 8, background: P.green }} />
                    <div style={{ position: "absolute", left: `${lerp(10, 70, v)}%`, top: 8, width: 56, height: 56, marginLeft: -28, marginTop: -28, borderRadius: 28, background: "#fff", boxShadow: "0 10px 24px rgba(0,0,0,0.4)" }} />
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C6: the build — every shape spirals in
const C6: React.FC = () => {
  const frame = useCurrentFrame();
  const a = C5_END;
  const L = BREAK - a;
  const RUN = Math.round(L * 0.4);
  const hit = a + RUN;
  // ---- phase 1: the line runs right; the camera follows with an easing lag; the ring waits ahead
  const pA = clamp01((frame - a) / RUN);
  const sm = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x); // sine in-out: no jerks
  const DIST = 2400;
  const tipWorld = CX + 180 + DIST * sm(pA);
  const tipScreenX = lerp(CX + 180, CX, sm(pA));
  const camX = tipWorld - tipScreenX;
  const tipX = tipScreenX;
  const tipY = lerp(CY + 198, CY, sm(pA));
  const ringScreenX = CX + 180 + DIST - camX;
  const speed = Math.sin(Math.PI * pA);
  const arrow = lerp(26, 92, sm(pA));
  const melt = ease.inOutCubic(clamp01((frame - (hit - 4)) / 10));
  // ---- phase 2: it bursts into the charging ring, which fills on a racing heart
  const pB = clamp01((frame - hit) / (BREAK - hit));
  const ringIn = 0.94 + 0.06 * ease.outBack(clamp01((frame - hit) / 14));
  const collapse = ease.inExpo(clamp01((frame - (BREAK - 12)) / 12));
  let hb = 0;
  for (const h of HEARTBEATS) {
    const d = frame - h;
    if (d >= 0 && d < 14) hb = Math.max(hb, Math.exp(-d / 3) + 0.6 * Math.exp(-Math.max(0, d - 5) / 3) * (d >= 5 ? 1 : 0));
  }
  const charge = ease.inOutCubic(pB);
  const core = (70 + 110 * charge) * (1 + 0.1 * hb) * (1 - collapse * 0.92) * ringIn;
  const dots = Array.from({ length: 40 }, (_, i) => ({ kind: "dot" as const, d: 10 + Math.round(seeded(i, 8) * 34) }));
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      {frame < hit + 10 && (
        <>
          {/* parallax dust drifting past */}
          {Array.from({ length: 30 }, (_, i) => {
            const y = 60 + seeded(i, 1) * 960;
            const depth = 0.3 + 0.7 * seeded(i, 4);
            const x = (((seeded(i, 3) * 2600 - camX * depth) % 2600) + 2600) % 2600 - 340;
            return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + 50 * speed * depth, height: 3, borderRadius: 2, background: "rgba(185,255,214,0.35)", opacity: 0.25 + 0.5 * depth }} />;
          })}
          {/* the ring waiting ahead */}
          <svg width={700} height={700} viewBox="-175 -175 350 350" style={{ position: "absolute", left: ringScreenX - 350, top: tipY - 350 + (CY - tipY) * 0, opacity: clamp01((CX + 900 - ringScreenX) / 500) }}>
            <circle r={140} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={5} />
            {Array.from({ length: 60 }, (_, j) => {
              const an = (j / 60) * Math.PI * 2 - Math.PI / 2;
              return <line key={j} x1={Math.cos(an) * 156} y1={Math.sin(an) * 156} x2={Math.cos(an) * 168} y2={Math.sin(an) * 168} stroke="rgba(255,255,255,0.12)" strokeWidth={3} strokeLinecap="round" />;
            })}
          </svg>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - melt }}>
            <defs>
              <linearGradient id="trail" gradientUnits="userSpaceOnUse" x1={tipX - 1000} y1={0} x2={tipX} y2={0}>
                <stop offset="0%" stopColor="#00bf63" stopOpacity={0} />
                <stop offset="60%" stopColor="#00bf63" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#b9ffd6" stopOpacity={1} />
              </linearGradient>
            </defs>
            <line x1={-60} y1={tipY} x2={tipX - arrow * 0.35} y2={tipY} stroke="url(#trail)" strokeWidth={14} strokeLinecap="round" />
            <line x1={tipX - 700} y1={tipY} x2={tipX - arrow * 0.35} y2={tipY} stroke="rgba(185,255,214,0.35)" strokeWidth={30} strokeLinecap="round" style={{ filter: "blur(10px)" }} opacity={0.4 + 0.6 * speed} />
            <path
              d={`M ${tipX - arrow * 0.55} ${tipY - arrow * 0.5} Q ${tipX - arrow * 0.1} ${tipY - arrow * 0.12}, ${tipX + arrow * 0.45} ${tipY} Q ${tipX - arrow * 0.1} ${tipY + arrow * 0.12}, ${tipX - arrow * 0.55} ${tipY + arrow * 0.5} Q ${tipX - arrow * 0.3} ${tipY}, ${tipX - arrow * 0.55} ${tipY - arrow * 0.5} Z`}
              fill="#d9ffe9"
              transform={`scale(${1 - 0.6 * melt})`}
              style={{ transformOrigin: `${tipX}px ${tipY}px` }}
            />
          </svg>
        </>
      )}
      {frame >= hit && (
        <>
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,191,99,${0.12 + 0.3 * charge + 0.12 * hb}) 0%, rgba(0,0,0,0) ${35 + 25 * charge}%)` }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)", opacity: 0.6 + 0.4 * hb }} />
          <Vortex items={dots} from={hit + 6} stagger={Math.max(2, Math.floor((BREAK - hit - 40) / dots.length))} travel={30} cx={CX} cy={CY} radius={900} />
          <div style={{ position: "absolute", left: CX - core / 2, top: CY - core / 2, width: core, height: core, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #d9ffe9 0%, #2be38a 40%, #00a352 100%)", boxShadow: `0 0 ${60 + 140 * charge}px rgba(0,191,99,${0.5 + 0.4 * charge})` }} />
          <svg width={700} height={700} viewBox="-175 -175 350 350" style={{ position: "absolute", left: CX - 350, top: CY - 350, opacity: 1 - collapse, transform: `scale(${ringIn * (1 + 0.04 * hb)})` }}>
            <circle r={140} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
            <circle r={140} fill="none" stroke={P.green} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${charge} 1`} transform="rotate(-90)" style={{ filter: "drop-shadow(0 0 12px rgba(0,191,99,0.9))" }} />
            {Array.from({ length: 60 }, (_, j) => {
              const on = j / 60 < charge;
              const an = (j / 60) * Math.PI * 2 - Math.PI / 2;
              return <line key={j} x1={Math.cos(an) * 156} y1={Math.sin(an) * 156} x2={Math.cos(an) * 168} y2={Math.sin(an) * 168} stroke={on ? P.mint : "rgba(255,255,255,0.12)"} strokeWidth={3} strokeLinecap="round" />;
            })}
          </svg>
          <div style={{ position: "absolute", left: CX, top: CY + 200, transform: "translate(-50%, 0)", opacity: ringIn * (1 - collapse) }}>
            <Label size={40} color={P.mint}>{`${Math.round(charge * 100)}%`}</Label>
          </div>
          {(() => {
            const u = clamp01((frame - hit) / 24);
            if (u >= 1) return null;
            return (
              <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                <circle cx={CX} cy={CY} r={140 + 420 * ease.outCubic(u)} fill="none" stroke={P.mint} strokeWidth={10 * (1 - u) + 1} opacity={(1 - u) * 0.7} style={{ filter: "blur(2px)" }} />
                <circle cx={CX} cy={CY} r={200 * ease.outCubic(u)} fill={`rgba(0,191,99,${0.35 * (1 - u)})`} style={{ filter: "blur(30px)" }} />
              </svg>
            );
          })()}
        </>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C7: silence. "Handly."
const C7: React.FC = () => {
  const frame = useCurrentFrame();
  const at = w("handly", 0);
  const grow = ease.outBack(clamp01((frame - (at - 6)) / 12));
  const toLogo = ease.outBack(clamp01((frame - (at - 4)) / 12));
  const real = clamp01((frame - (at + 8)) / 6);
  const gather = 1 - 0.1 * ease.inCubic(clamp01((frame - (FINAL - 8)) / 8));
  const S = lerp(14, 300, grow) * gather;
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <Shape pts={morphNamed("circle", "logo", toLogo, 1, frame)} x={CX} y={CY - 40} size={S} fill={P.green} opacity={1 - real} />
      {real > 0 && <Logo size={S * 1.2} style={{ position: "absolute", left: CX - S * 0.6, top: CY - 40 - S * 0.58, opacity: real }} />}
      <Txt words={kw("handly", { lead: 1 })} size={72} on="black" y={CY + 220} ink={["#ffffff", "#cfe9db"]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C8: final chorus — help when you need it / money when you have time

const C8: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - SPLIT;
  const inL = ease.outExpo(clamp01(t / 14));
  const inR = ease.outExpo(clamp01((frame - (w("bani", 0) - 8)) / 14));
  const badge = ease.outBack(clamp01((t - 2) / 14));
  const outT = ease.inCubic(clamp01((frame - (C8_END - 8)) / 8));
  const k = beatAt(frame);
  const pb = punch(frame, bt(k), 0.04, 8);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      {/* right: money when you have time */}
      <div style={{ position: "absolute", left: CX, top: 0, width: CX, height: 1080, overflow: "hidden", transform: `translateY(${(1 - inR) * 1080}px)` }}>
        <Bg kind="black" />
      </div>
      {/* left: help when you need it */}
      <div style={{ position: "absolute", left: 0, top: 0, width: CX, height: 1080, overflow: "hidden", transform: `translateY(${(inL - 1) * 1080}px)` }}>
        <Bg kind="green" style={{ width: 1920 }} />
      </div>
      <Txt words={kw("ajutor", { lead: 2, color: { 0: ["#ffffff", "#ffffff"] } })} size={96} on="green" x={CX / 2 - 60} y={CY + 10} breaks={[0]} out={C8_END - 6} />
      <Txt words={kw("bani", { lead: 2, color: { 0: MINT_INK } })} size={96} on="black" x={CX + CX / 2 + 60} y={CY + 10} breaks={[0]} out={C8_END - 6} />
      {/* the mark sits on the seam: two hands, two sides */}
      <div style={{ position: "absolute", left: CX - 105, top: CY - 105, width: 210, height: 210, borderRadius: "50%", background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${badge * pb * (1 - outT)})` }}>
        <Logo size={150} />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C9: download the app

const Splash: React.FC<{ frame: number; at: number }> = ({ frame, at }) => {
  const p = ease.outBack(clamp01((frame - at) / 14));
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #19d176, #00a856)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
      <div style={{ transform: `scale(${p})` }}>
        <Logo size={150} tone="white" />
      </div>
      <div style={{ opacity: clamp01((frame - at - 6) / 8) }}>
        <Wordmark size={64} color="#fff" ro />
      </div>
    </div>
  );
};

const C9: React.FC = () => {
  const frame = useCurrentFrame();
  const a = C8_END;
  const enter = ease.outExpo(clamp01((frame - a) / 24));
  const badges = (k: number) => ease.outBack(clamp01((frame - (w("cta", 1) - 4 + k * 4)) / 12));
  const outT = ease.inCubic(clamp01((frame - (C9_END - 8)) / 8));
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      <Txt words={kw("cta", { only: [0, 1], color: { 1: GREEN_INK } })} size={100} on="white" x={140} y={CY - 150} align="left" out={C9_END - 6} />
      <Txt words={kw("cta", { only: [2, 3, 4, 5] })} size={100} on="white" x={140} y={CY - 30} align="left" out={C9_END - 6} />
      <div style={{ position: "absolute", left: 140, top: CY + 110, display: "flex", gap: 24, opacity: 1 - outT }}>
        {(["apple", "google"] as const).map((s, k) => (
          <div key={s} style={{ transform: `scale(${badges(k)})`, transformOrigin: "0 50%" }}>
            <StoreBadge store={s} h={100} shine={clamp01((frame - (w("cta", 3) + k * 6)) / 20)} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 1360 - PHONE_W / 2, top: CY - PHONE_H / 2, transform: `perspective(2200px) translateY(${(1 - enter) * 800 - outT * 60}px) rotateY(${-16 + 8 * enter}deg) rotateX(${(1 - enter) * 25}deg) scale(0.9)`, opacity: 1 - outT, filter: "drop-shadow(0 60px 90px rgba(10,40,25,0.3))" }}>
        <Phone>
          <Splash frame={frame} at={a + 10} />
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C10: the end card, landing on the song's last hit
const C10: React.FC = () => {
  const frame = useCurrentFrame();
  const a = C9_END;
  const hit = frame - END_HIT;
  const fadeOut = ease.inOutCubic(clamp01((frame - (F(END) - 22)) / 20));
  if (hit < 0) return <Slam from={a} ro badges />;
  const flood = ease.outExpo(clamp01(hit / 10));
  const pb = punch(frame, END_HIT, 0.08, 14);
  return (
    <AbsoluteFill>
      <Bg kind="green" />
      <Shape pts={shape("circle")} x={CX} y={CY} size={2600 * flood} fill="rgba(255,255,255,0.18)" opacity={1 - flood} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 70, transform: `scale(${pb * (1 + 0.03 * clamp01(hit / 90))})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <Logo size={190} tone="white" />
          <div style={{ transform: "translateY(-12px)" }}>
            <Wordmark size={190} color="#fff" ro />
          </div>
        </div>
        <div style={{ display: "flex", gap: 26 }}>
          <StoreBadge store="apple" h={92} shine={clamp01((hit - 4) / 20)} />
          <StoreBadge store="google" h={92} shine={clamp01((hit - 10) / 20)} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#000", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

export const ACT3: React.FC = () => (
  <>
    <Win from={BRIDGE} to={C1_END}>
      <C1 />
    </Win>
    <Win from={C1_END} to={C2_END}>
      <C2 />
    </Win>
    <Win from={C2_END} to={C3_END}>
      <C3 />
    </Win>
    <Win from={C3_END} to={C4_END}>
      <C4 />
    </Win>
    <Win from={C4_END} to={C5_END}>
      <C5 />
    </Win>
    <Win from={C5_END} to={BREAK}>
      <C6 />
    </Win>
    <Win from={BREAK} to={FINAL}>
      <C7 />
    </Win>
    <Win from={FINAL} to={SPLIT}>
      <Slam from={FINAL} shakeAt={FINAL} />
      <Explosion at={FINAL} cx={960} cy={540} />
    </Win>
    <Win from={SPLIT} to={C8_END}>
      <C8 />
    </Win>
    <Win from={C8_END} to={C9_END}>
      <C9 />
    </Win>
    <Win from={C9_END} to={F(END)}>
      <C10 />
    </Win>
  </>
);
