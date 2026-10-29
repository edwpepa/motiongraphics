import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Avatar } from "../../explainer/components/Avatar";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { C6, C7, C8, C9 } from "../act3";
import { Win } from "../kit";
import { C1_END, C2_END, C3_END, C4_END, C5_END, C8_END, C9_END, SPLIT } from "../scenes";
import { BREAK, BRIDGE, END, END_HIT, F, FINAL, w } from "../timeline";
import { OUTFIT } from "../tv/font";
import { EarnScreen, HoursScreen, ModeScreen, ScheduleScreen, SetupScreen, SKILLS, SkillsScreen, TasksScreen, Verified } from "../tv/handly";
import { Sym } from "../tv/ios";
import { vo } from "../tv/kit";
import { idle, PopOut, spin, Touch } from "./act1";
import { SpinSplash } from "./act2";
import { EndCard, PremiumDrop } from "./drop";
import { DarkBg, GREEN, GREEN2, r01, RefText, Sparkle, spring, Tok } from "./kit3d";
import { P3, Phones } from "./phone3d";

// ------------------------------------------------------------------ act III, dark: the other side of the app
const W2T = (ws: [string, number][], accent: number[] = []): Tok[] => ws.map(([t, at], i) => ({ t, at, accent: accent.includes(i) }));
const dcard: React.CSSProperties = { background: "#121c17", border: "1.5px solid #22322a", borderRadius: 28, fontFamily: OUTFIT, color: "#fff" };

// ------------------------------------------------------------------ 1 · "but Handly isn't only for those who need help" — out of the dark, slowly; then the switch
export const L1: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = BRIDGE;
  const D = vo("dar");
  const rise = r01(f, a0, a0 + 70, (u) => 1 - Math.pow(1 - u, 3));
  const turn = r01(f, a0, C1_END, (u) => u);
  const swAt = C1_END - 46, flip = C1_END - 20;
  const fwd = r01(f, swAt - 20, swAt + 10);
  const p: P3 = { x: 960, y: lerp(820, 760, rise) - 120 * fwd, z: lerp(-1400, -400, rise) + 300 * fwd, rx: lerp(18, 6, rise), ry: -40 + 70 * turn, rz: lerp(-6, 0, rise), h: 680, color: "black", opacity: clamp01((f - a0 - 4) / 30) };
  const fl = r01(f, flip, flip + 10);
  const SW = 360;
  return (
    <AbsoluteFill>
      <DarkBg glow={rise} />
      <AbsoluteFill style={{ opacity: 1 - 0.65 * r01(f, D[0][1], D[0][1] + 20) * (1 - fwd) }}>
        <Phones dark slots={[{ p, screen: <><ModeScreen f={f} flip={fl} /><Touch x={290} y={329} at={flip - 2} /></> }]} />
      </AbsoluteFill>
      <RefText toks={W2T(D.slice(0, 5), [1])} size={84} y={140} color="#ffffff" out={swAt - 14} />
      <RefText toks={W2T(D.slice(5))} size={84} y={245} color="#ffffff" out={swAt - 12} />
      <PopOut p={p} sx={200} sy={329} w={SW} h={58} at={swAt} to={{ x: 960, y: 250, s: 2.3 }} back={C1_END - 6}>
        <div style={{ position: "relative", width: SW, height: 58, borderRadius: 29, background: "#1a2620", padding: 5, boxSizing: "border-box" }}>
          <div style={{ position: "absolute", top: 5, bottom: 5, left: 5 + fl * (SW / 2 - 5), width: SW / 2 - 5, borderRadius: 24, background: fl > 0.5 ? GREEN : "#fff" }} />
          {["Am nevoie de ajutor", "Vreau să câștig"].map((t, i) => (
            <div key={t} style={{ position: "absolute", top: 0, bottom: 0, left: i * (SW / 2), width: SW / 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: OUTFIT, fontSize: 15, fontWeight: 600, color: i === 1 ? (fl > 0.5 ? "#fff" : "#8fa79a") : fl > 0.5 ? "#8fa79a" : "#141816" }}>
              {t}
            </div>
          ))}
        </div>
      </PopOut>
      {[0, 1, 2].map((i) => <Sparkle key={i} x={960 + [-470, 450, 300][i]} y={250 + [-40, 30, -90][i]} size={[38, 30, 20][i]} t={Math.sin(Math.PI * clamp01((f - flip - 2 - i * 3) / 24))} rot={(f - flip) * 6} />)}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2 · if you know how to do something (the words)
export const L2: React.FC = () => {
  const f = useCurrentFrame();
  const D = vo("daca");
  return (
    <AbsoluteFill>
      <DarkBg />
      <RefText toks={W2T(D, [4])} size={110} color="#ffffff" out={C2_END - 8} />
      {[0, 1, 2, 3].map((i) => <Sparkle key={i} x={960 + [-620, 600, -380, 470][i]} y={540 + [-160, -120, 170, 190][i]} size={[30, 40, 22, 26][i]} t={Math.sin(Math.PI * clamp01((f - D[i + 1][1]) / 30))} rot={f * 3} />)}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3 · each skill lifts out of the phone as it's said
export const L3: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C2_END;
  const ats = [w("skills", 0) - 2, w("skills", 2) - 2, w("skills", 3) - 2, w("skills", 4) - 2, w("skills", 5) - 2];
  const on = ats.map((t) => r01(f, t, t + 8));
  const p = idle(f, 960, 600, 760, "green", -8);
  const TO = [
    { x: 460, y: 300, s: 1.5, r: -6 },
    { x: 1460, y: 300, s: 1.5, r: 5 },
    { x: 400, y: 640, s: 1.5, r: 4 },
    { x: 1520, y: 660, s: 1.5, r: -4 },
    { x: 960, y: 140, s: 1.4, r: 0 },
  ];
  return (
    <AbsoluteFill>
      <DarkBg />
      <SpinSplash at={a0} x={960} y={600} />
      <Phones dark slots={[{ p, screen: <SkillsScreen f={f} on={on} /> }]} />
      {ats.map((at, i) => {
        const [ic, label] = SKILLS[i];
        return (
          <PopOut key={i} p={p} sx={i % 2 === 0 ? 106 : 294} sy={216 + Math.floor(i / 2) * 124} w={250} h={86} at={at + 2} to={TO[i]}>
            <div style={{ width: 250, height: 86, borderRadius: 26, background: `linear-gradient(135deg, ${GREEN}, #00a352)`, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", boxSizing: "border-box", fontFamily: OUTFIT, fontSize: 24, fontWeight: 600, color: "#fff", boxShadow: "0 20px 40px rgba(0,191,99,0.35)" }}>
              <Sym n={ic} size={30} color="#fff" />
              {label}
            </div>
          </PopOut>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4 · a tasker account in minutes — and the money starts coming in
export const L4: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C3_END;
  const cut = w("cont", 8) - 6;
  const sp = spin(f, cut - 9, 18);
  const base = idle(f, 1320, 590, 800, "green", -18);
  const p: P3 = { ...base, ry: base.ry + sp.ry };
  const amount = 2460 * r01(f, w("cont", 11) - 4, w("cont", 17), (u) => 1 - (1 - u) ** 2);
  const screen = !sp.past ? <SetupScreen f={f} typed={r01(f, a0 + 4, w("cont", 3), (u) => u)} ver={r01(f, w("cont", 4) - 4, w("cont", 7), (u) => u)} ready={r01(f, w("cont", 7) - 2, w("cont", 7) + 6)} /> : <EarnScreen f={f} amount={amount} bars={r01(f, cut + 4, cut + 30, (u) => u)} pings={[w("cont", 12), w("cont", 14), w("cont", 16)]} />;
  const bars = [0.32, 0.45, 0.4, 0.58, 0.52, 0.74, 0.66, 0.88, 0.8, 1];
  return (
    <AbsoluteFill>
      <DarkBg />
      <SpinSplash at={cut - 2} x={1320} y={580} />
      <AbsoluteFill style={{ filter: sp.blur > 0.3 ? `blur(${sp.blur}px)` : undefined }}>
        <Phones dark slots={[{ p, screen }]} />
      </AbsoluteFill>
      {!sp.past && (
        <PopOut p={p} sx={200} sy={240} w={300} h={220} at={w("cont", 4) - 2} to={{ x: 620, y: 470, s: 1.5, r: -3 }} back={cut - 12}>
          <div style={{ width: 300, height: 220, ...dcard, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <Avatar person="mihai" size={110} dark ring={GREEN} lit={1} />
              <div style={{ position: "absolute", right: -6, bottom: 0 }}>
                <Verified size={36} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>Tasker verificat</div>
          </div>
        </PopOut>
      )}
      {sp.past && (
        <div style={{ position: "absolute", left: 620 - 330, top: 330, width: 660, transform: `translateY(${(1 - spring(clamp01((f - cut) / 20))) * 60}px)`, opacity: clamp01((f - cut) / 8) }}>
          <div style={{ fontFamily: OUTFIT, fontSize: 30, fontWeight: 500, color: "#8fa79a" }}>Câștiguri luna asta</div>
          <div style={{ fontFamily: OUTFIT, fontSize: 150, fontWeight: 600, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(amount).toLocaleString("ro-RO")} <span style={{ fontSize: 70, backgroundImage: `linear-gradient(90deg, ${GREEN}, ${GREEN2})`, WebkitBackgroundClip: "text", color: "transparent" }}>lei</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 170, marginTop: 20 }}>
            {bars.map((h, i) => {
              const g = spring(clamp01((f - cut - 4 - i * 3) / 14));
              return <div key={i} style={{ flex: 1, height: `${100 * h * g}%`, borderRadius: 10, background: i === 9 ? `linear-gradient(180deg, ${GREEN2}, ${GREEN})` : "rgba(0,191,99,0.32)", boxShadow: i === 9 ? "0 0 30px rgba(0,191,99,0.5)" : undefined }} />;
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · you choose ×3: three fast turns, colour bursting behind each
export const L5: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C4_END;
  const c2 = w("taskurile", 0) - 9, c3 = w("muncesti", 0) - 9;
  const s1 = spin(f, a0 - 6, 16), s2 = spin(f, c2, 16), s3 = spin(f, c3, 16);
  const shot = s3.past ? 2 : s2.past ? 1 : 0;
  const colors = ["black", "green", "white"] as const;
  const settle = r01(f, c3 + 20, C5_END, (u) => u);
  const base = idle(f, 960, 590, 800, colors[shot], -12);
  const p: P3 = { ...base, ry: base.ry + s1.ry + s2.ry + s3.ry + settle * 14, h: base.h * (1 - 0.06 * settle) };
  const blur = s1.blur + s2.blur + s3.blur;
  const acc = w("taskurile", 2) - 2;
  const screen = shot === 0 ? <ScheduleScreen f={f} days={(f - a0) / 4} end={r01(f, w("program", 2) - 6, w("program", 2) + 14)} /> : shot === 1 ? <><TasksScreen f={f} acc={r01(f, acc, acc + 4)} press={Math.sin(Math.PI * clamp01((f - acc + 4) / 8))} /><Touch x={318} y={258} at={acc} /></> : <HoursScreen f={f} hours={lerp(40, 20, r01(f, c3 + 10, w("muncesti", 3) + 6))} />;
  const pill = (t: string, sub: string) => (
    <div style={{ width: 330, height: 120, ...dcard, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 26px", boxSizing: "border-box" }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: "#8fa79a" }}>{sub}</div>
      <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em" }}>{t}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <DarkBg />
      <SpinSplash at={a0 + 2} x={960} y={580} color={GREEN} />
      <SpinSplash at={c2 + 8} x={960} y={580} color="#ffffff" light="#e8fff2" seed={13} />
      <SpinSplash at={c3 + 8} x={960} y={580} color={GREEN2} light="#bff5d8" seed={17} />
      <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
        <Phones dark slots={[{ p, screen }]} />
      </AbsoluteFill>
      {shot === 0 && (
        <PopOut p={p} sx={200} sy={318} w={330} h={120} at={w("program", 2)} to={{ x: 460, y: 540, s: 1.45, r: -3 }} back={c2 + 2}>
          {pill(`08:00 – ${String(Math.round(lerp(20, 14, r01(f, w("program", 2) - 6, w("program", 2) + 14)))).padStart(2, "0")}:00`, "Programul tău")}
        </PopOut>
      )}
      {shot === 1 && (
        <PopOut p={p} sx={200} sy={219} w={330} h={120} at={acc + 4} to={{ x: 1470, y: 520, s: 1.45, r: 3 }} back={c3 + 2}>
          {pill("Montaj dulap", "Acceptat · 180 lei")}
        </PopOut>
      )}
      {shot === 2 && (
        <PopOut p={p} sx={200} sy={260} w={330} h={120} at={c3 + 16} to={{ x: 460, y: 540, s: 1.45, r: -3 }}>
          {pill(`${Math.round(lerp(40, 20, r01(f, c3 + 10, w("muncesti", 3) + 6)))} ore / săpt.`, "Cât muncești")}
        </PopOut>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: r01(f, C5_END - 8, C5_END) }} />
    </AbsoluteFill>
  );
};

export const ACT3_3D: React.FC = () => (
  <>
    <Win still from={BRIDGE} to={C1_END}><L1 /></Win>
    <Win still from={C1_END} to={C2_END}><L2 /></Win>
    <Win still from={C2_END} to={C3_END}><L3 /></Win>
    <Win still from={C3_END} to={C4_END}><L4 /></Win>
    <Win still from={C4_END} to={C5_END}><L5 /></Win>
    <Win from={C5_END} to={BREAK}><C6 /></Win>
    <Win from={BREAK} to={FINAL}><C7 /></Win>
    <Win still from={FINAL} to={SPLIT}><PremiumDrop from={FINAL} offset={0} zoomOutAt={SPLIT - 10} /></Win>
    <Win from={SPLIT} to={C8_END}><C8 /></Win>
    <Win from={C8_END} to={C9_END}><C9 /></Win>
    <Win still from={C9_END} to={F(END)}><EndCard from={C9_END} hit={END_HIT} end={F(END)} /></Win>
  </>
);
