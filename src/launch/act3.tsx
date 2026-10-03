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

const C1: React.FC = () => {
  const frame = useCurrentFrame();
  const ws = words("dar");
  const FS = 104;
  const gap = 0.27 * FS;
  const Y1 = CY + 40;
  const Y2 = CY + 170;
  // word centres, laid out exactly like the two centred lines below
  const centres = (idx: number[], y: number) => {
    const wd = idx.map((i) => textWidth(ws[i][0], FS, -0.045));
    const total = wd.reduce((p, q) => p + q, 0) + gap * (idx.length - 1);
    let x = CX - total / 2;
    return idx.map((_, j) => {
      const c = x + wd[j] / 2;
      x += wd[j] + gap;
      return { x: c, y };
    });
  };
  const pos = [...centres([0, 1, 2, 3, 4], Y1), ...centres([5, 6, 7, 8, 9, 10, 11], Y2)];
  const at = ws.map(([, f]) => f - 3);
  // camera: close on the words as they arrive, gliding along, then it pulls back to show it all
  let fx = pos[0].x;
  let fy = pos[0].y;
  for (let k = 1; k < pos.length; k++) {
    const t = ease.inOutCubic(clamp01((frame - at[k] + 4) / 14));
    if (t <= 0) break;
    fx = lerp(fx, pos[k].x, t);
    fy = lerp(fy, pos[k].y, t);
  }
  const wide = ease.inOutCubic(clamp01((frame - (at[at.length - 1] + 2)) / 22));
  const intro = ease.outCubic(clamp01((frame - (BRIDGE - 2)) / 16));
  const z = lerp(lerp(2.2, 1.75, intro), 1, wide);
  const cx = lerp(fx, CX, wide);
  const cy = lerp(fy, CY + 30, wide);
  const enter = ease.outExpo(clamp01((frame - BRIDGE) / 20));
  const spin = ease.inOutCubic(clamp01((frame - (at[4] - 2)) / 18));
  const S = 230;
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${CX - cx * z}px, ${CY - cy * z}px) scale(${z})` }}>
        <div style={{ position: "absolute", left: CX - S / 2, top: CY - 220 - S / 2, width: S, height: S, transform: `perspective(1200px) rotateY(${spin * 360}deg) scale(${(0.8 + 0.2 * enter) * (1 + 0.1 * Math.sin(Math.PI * spin))})`, opacity: enter * clamp01((frame - (at[1] - 6)) / 8) }}>
          <Logo size={S} />
        </div>
        <Txt words={kw("dar", { only: [0, 1, 2, 3, 4], color: { 1: GREEN_INK, 4: GREEN_INK } })} size={FS} on="white" y={Y1} out={C1_END - 6} />
        <Txt words={kw("dar", { only: [5, 6, 7, 8, 9, 10, 11] })} size={FS} on="white" y={Y2} out={C1_END - 6} />
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
      <Txt key={i} words={kw("skills", { only: s.words, lead: 4, cap: true }).map((x) => ({ ...x, at: Math.max(x.at, cuts[i]) }))} size={150} on={s.bg} y={CY + 170} dur={9} />
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
      <Txt words={kw("cont", { only: [8, 9, 10, 11], cap: true, color: { 11: MINT_INK } })} size={88} on="deep" x={140} y={CY - 60} align="left" out={C4_END - 6} />
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
          <div style={{ position: "absolute", left: CX - 450, top: CY + 120, width: 900, opacity: vis(2) * (1 - outT), transform: `translateY(${(1 - vis(2)) * 40}px)` }}>
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
// hyperspace: the camera dives through a tunnel of green light; stars streak past; the mark waits at the end
const C6: React.FC = () => {
  const frame = useCurrentFrame();
  const a = C5_END;
  const L = BREAK - a;
  const x = clamp01((frame - a) / L);
  // travelled distance = integral of an accelerating speed
  const travel = (u: number) => 0.25 * u + 1.6 * Math.pow(u, 3);
  const tr = travel(x) * (L / 30);
  const speed = 0.25 + 4.8 * x * x;
  const enter = ease.inOutCubic(clamp01((frame - a) / 18));
  const flash = clamp01((frame - (BREAK - 7)) / 7);
  const roll = x * 50 + Math.sin(frame / 20) * 4;
  const sh = x > 0.7 ? (x - 0.7) * 14 : 0;
  const shx = Math.sin(frame * 2.1) * sh;
  const shy = Math.cos(frame * 2.7) * sh;
  const proj = (z: number) => 1 / Math.max(0.04, z);
  const RINGS = 16;
  const STARS = 150;
  const logoS = lerp(10, 420, Math.pow(x, 2.6));
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,191,99,${0.1 + 0.35 * x}) 0%, rgba(0,40,22,0.4) 30%, rgba(0,0,0,0) 65%)`, opacity: enter }} />
      <svg width={1920} height={1080} viewBox="-960 -540 1920 1080" style={{ position: "absolute", inset: 0, opacity: enter, transform: `translate(${shx}px, ${shy}px)` }}>
        <g transform={`rotate(${roll})`}>
          {/* rings */}
          {Array.from({ length: RINGS }, (_, i) => {
            const z = 1 - ((i / RINGS + tr * 0.55) % 1);
            const r = 120 * proj(z);
            if (r > 2200) return null;
            const op = clamp01((1 - z) * 2.2) * clamp01((2000 - r) / 600);
            const sw = Math.max(1.2, 3.5 * proj(z) * 0.4);
            const sq = i % 2 === 0;
            return sq ? (
              <rect key={i} x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.32} fill="none" stroke={i % 4 === 0 ? P.mint : P.green} strokeWidth={sw} opacity={op * 0.85} transform={`rotate(${i * 11})`} />
            ) : (
              <circle key={i} r={r} fill="none" stroke={P.green} strokeWidth={sw * 0.7} opacity={op * 0.6} strokeDasharray={`${r * 0.25} ${r * 0.12}`} />
            );
          })}
          {/* star streaks */}
          {Array.from({ length: STARS }, (_, i) => {
            const th = seeded(i, 1) * Math.PI * 2;
            const off = 0.35 + seeded(i, 2) * 1.3;
            const z = 1 - ((seeded(i, 3) + tr * (0.7 + 0.6 * seeded(i, 4))) % 1);
            const z2 = Math.min(1, z + 0.02 + 0.06 * speed);
            const r1 = 150 * off * proj(z);
            const r2 = 150 * off * proj(z2);
            if (r2 > 1500) return null;
            const op = clamp01((1 - z) * 2.5);
            return <line key={i} x1={Math.cos(th) * r2} y1={Math.sin(th) * r2} x2={Math.cos(th) * r1} y2={Math.sin(th) * r1} stroke={i % 5 === 0 ? "#ffffff" : P.mint} strokeWidth={1 + 2.5 * (1 - z)} strokeLinecap="round" opacity={op * 0.9} />;
          })}
        </g>
      </svg>
      {/* the services fly past along the walls */}
      {SERVICES.map((sv, i) => {
        const z = 1 - ((i / SERVICES.length + tr * 0.4 + 0.13) % 1);
        const r = 170 * proj(z);
        if (r > 1300 || z > 0.95) return null;
        const th = (i / SERVICES.length) * Math.PI * 2 + (roll * Math.PI) / 180;
        const sc = proj(z) * 0.22;
        return (
          <div key={i} style={{ position: "absolute", left: CX + Math.cos(th) * r * 1.2 + shx, top: CY + Math.sin(th) * r + shy, transform: `translate(-50%, -50%) scale(${sc})`, opacity: clamp01((1 - z) * 2) * clamp01((1300 - r) / 400) * enter }}>
            <ServiceTile name={sv.icon} size={150} tone={i % 2 ? "white" : "green"} />
          </div>
        );
      })}
      {/* the mark at the end of the tunnel */}
      <div style={{ position: "absolute", left: CX - logoS / 2 + shx, top: CY - logoS / 2 + shy, opacity: clamp01(x * 3) }}>
        <div style={{ position: "absolute", inset: -logoS * 0.6, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,255,214,0.55) 0%, rgba(0,191,99,0.2) 35%, rgba(0,0,0,0) 70%)" }} />
        <Logo size={logoS} tone="white" />
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #ffffff 0%, #b9ffd6 40%, #00bf63 100%)", opacity: flash }} />
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
