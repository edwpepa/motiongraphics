import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { C10, C6, C7, C8, C9 } from "../act3";
import { Explosion } from "../fx";
import { Win } from "../kit";
import { C1_END, C2_END, C3_END, C4_END, C5_END, C8_END, C9_END, SPLIT } from "../scenes";
import { Slam } from "../slam";
import { BREAK, BRIDGE, END, F, FINAL, w } from "../timeline";
import { EarnScreen, HoursScreen, ModeScreen, ScheduleScreen, SetupScreen, SkillsScreen, TasksScreen } from "./handly";
import { addPose, CutFlash, DarkStage, Device, drift, Headline, INK, Line, LightStage, MINT, outExpo, r01, Rig, vo } from "./kit";

// ------------------------------------------------------------------ act III: the other side of the app — the person who earns from what he knows
const dimTo = (f: number, at: number) => `rgba(245,245,247,${lerp(1, 0.3, r01(f, at, at + 10))})`;
const whip = (f: number, cuts: number[], amp = 30) => {
  let ry = 0, blur = 0, x = 0;
  for (const c of cuts) {
    const t = (f - c) / 12;
    if (t >= 0 && t < 1) {
      const e = 1 - outExpo(t);
      ry += amp * e;
      x += 80 * e;
      blur += 6 * e * e;
    }
  }
  return { ry, blur, x };
};
const Touch: React.FC<{ x: number; y: number; at: number; f: number }> = ({ x, y, at, f }) => {
  const t = (f - at + 6) / 18;
  if (t < 0 || t > 1) return null;
  const down = Math.sin(t * Math.PI);
  return <div style={{ position: "absolute", left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26, background: `rgba(255,255,255,${0.5 * down})`, transform: `scale(${0.8 + 0.3 * down})`, zIndex: 20 }} />;
};
const GREEN_STAGE = "0,191,99";

// ------------------------------------------------------------------ 1 · not only for those who need help — the phone turns over to the other side
export const F1: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = BRIDGE;
  const flipAt = C1_END - 22;
  const spin = r01(f, flipAt, flipAt + 20, (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2));
  const dark = spin > 0.5 ? 1 : 0;
  const enter = outExpo(clamp01((f - a0) / 24));
  const pose = addPose(drift(f), { ry: spin * 360 + (1 - enter) * -40, y: (1 - enter) * 500, rx: (1 - enter) * 20 });
  const L = vo("dar");
  const lines: Line[] = [
    { w: L.slice(0, 5), size: 104, color: INK, hi: { 1: "#00a852" } },
    { w: L.slice(5, 9), size: 104, color: INK },
    { w: L.slice(9), size: 104, color: INK },
  ];
  return (
    <AbsoluteFill>
      <LightStage />
      <AbsoluteFill style={{ opacity: r01(f, flipAt + 6, flipAt + 16) }}>
        <DarkStage hue={GREEN_STAGE} glow={0.22} />
      </AbsoluteFill>
      <Rig from={a0} to={C1_END} push={0.03}>
        <Device pose={pose} dark={dark > 0} glow={dark ? "rgba(0,191,99,0.22)" : undefined}>
          <ModeScreen f={f} flip={dark ? 1 : r01(f, flipAt - 10, flipAt - 2)} />
          <Touch x={300} y={329} at={flipAt - 6} f={f} />
        </Device>
        <Headline lines={lines} y={320} gap={0.08} out={flipAt - 4} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2 · if you know how to do something
export const F2: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C1_END;
  const pose = addPose(drift(f), { s: 1.04 });
  const L = vo("daca");
  return (
    <AbsoluteFill>
      <DarkStage hue={GREEN_STAGE} glow={0.22} />
      <Rig from={a0} to={C2_END} push={0.03}>
        <Device pose={pose} glow="rgba(0,191,99,0.2)">
          <SkillsScreen f={f} on={[]} />
        </Device>
        <Headline lines={[{ w: L.slice(0, 2), size: 176 }, { w: L.slice(2), size: 176, hi: { 2: MINT } }]} y={300} out={C2_END - 6} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3 · furniture, painting, repairs, cleaning, moving — each one ticked as it's said
export const F3: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C2_END;
  const ats = [w("skills", 0) - 2, w("skills", 2) - 2, w("skills", 3) - 2, w("skills", 4) - 2, w("skills", 5) - 2];
  const on = ats.map((t) => r01(f, t, t + 8));
  const pose = addPose(drift(f), { s: lerp(1.04, 1.16, r01(f, a0, C3_END, (u) => u)), y: 30 });
  const L = vo("skills");
  const lines: Line[] = [
    { w: cap(L.slice(0, 2)), size: 92, color: dimTo(f, ats[1]) },
    { w: L.slice(2, 3), size: 92, color: dimTo(f, ats[2]) },
    { w: L.slice(3, 4), size: 92, color: dimTo(f, ats[3]) },
    { w: L.slice(4, 5), size: 92, color: dimTo(f, ats[4]) },
    { w: L.slice(5), size: 92 },
  ];
  return (
    <AbsoluteFill>
      <DarkStage hue={GREEN_STAGE} glow={0.22} />
      <Rig from={a0} to={C3_END} push={0.03}>
        <Device pose={pose} glow="rgba(0,191,99,0.2)">
          <SkillsScreen f={f} on={on} />
        </Device>
        <Headline lines={lines} y={190} gap={0.06} out={C3_END - 7} />
      </Rig>
    </AbsoluteFill>
  );
};
const cap = (ws: [string, number][]): [string, number][] => ws.map(([t, at], i) => [i === 0 ? t.charAt(0).toUpperCase() + t.slice(1) : t, at]);

// ------------------------------------------------------------------ 4 · a tasker account in minutes, then the earnings start
export const F4: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C3_END;
  const cut = w("cont", 8) - 6;
  const shot = f < cut ? 0 : 1;
  const wp = whip(f, [cut]);
  const pose = addPose(drift(f), { ry: wp.ry, x: wp.x, s: 1.04 });
  const L = vo("cont");
  return (
    <AbsoluteFill>
      <DarkStage hue={GREEN_STAGE} glow={0.22} />
      <Rig from={a0} to={C4_END} push={0.03}>
        <Device pose={pose} glow="rgba(0,191,99,0.2)" blur={wp.blur}>
          {shot === 0 && <SetupScreen f={f} typed={r01(f, a0 + 4, w("cont", 3), (u) => u)} ver={r01(f, w("cont", 4) - 4, w("cont", 7), (u) => u)} ready={r01(f, w("cont", 7) - 2, w("cont", 7) + 6)} />}
          {shot === 1 && <EarnScreen f={f} amount={2460 * r01(f, w("cont", 11) - 4, w("cont", 17), (u) => 1 - (1 - u) ** 2)} bars={r01(f, cut + 4, cut + 30, (u) => u)} pings={[w("cont", 12), w("cont", 14), w("cont", 16)]} />}
        </Device>
        <Headline lines={[{ w: cap(L.slice(0, 5)), size: 104 }, { w: L.slice(5, 8), size: 104, hi: { 1: MINT, 2: MINT } }]} y={340} out={cut - 6} />
        <Headline lines={[{ w: L.slice(8, 12), size: 104, hi: { 3: MINT } }, { w: L.slice(12), size: 104 }]} y={340} out={C4_END - 7} />
      </Rig>
      <CutFlash at={cut} a={0.12} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · you choose your hours, your tasks, how much you work
export const F5: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C4_END;
  const c2 = w("taskurile", 0) - 4, c3 = w("muncesti", 0) - 4;
  const shot = f < c2 ? 0 : f < c3 ? 1 : 2;
  const wp = whip(f, [c2, c3]);
  const pose = addPose(drift(f), { ry: wp.ry, x: wp.x, s: 1.04 });
  const P = vo("program"), T = vo("taskurile"), M = vo("muncesti");
  const acc = w("taskurile", 2) - 2;
  return (
    <AbsoluteFill>
      <DarkStage hue={GREEN_STAGE} glow={0.24} />
      <Rig from={a0} to={C5_END} push={0.035}>
        <Device pose={pose} glow="rgba(0,191,99,0.22)" blur={wp.blur}>
          {shot === 0 && <ScheduleScreen f={f} days={(f - a0) / 4} end={r01(f, w("program", 2) - 6, w("program", 2) + 14)} />}
          {shot === 1 && (
            <>
              <TasksScreen f={f} acc={r01(f, acc, acc + 4)} press={Math.sin(Math.PI * clamp01((f - acc + 4) / 8))} />
              <Touch x={318} y={258} at={acc} f={f} />
            </>
          )}
          {shot === 2 && <HoursScreen f={f} hours={lerp(40, 20, r01(f, c3 + 2, w("muncesti", 3) + 6))} />}
        </Device>
        <Headline lines={[{ w: P.slice(0, 2), size: 176 }]} y={300} />
        <Headline lines={[{ w: P.slice(2), size: 150, color: MINT }]} y={500} out={c2 - 6} />
        <Headline lines={[{ w: T.slice(2), size: 150, color: MINT }]} y={500} out={c3 - 6} />
        <Headline lines={[{ w: M.slice(2), size: 150, color: MINT }]} y={500} out={C5_END - 6} />
      </Rig>
      <AbsoluteFill style={{ background: "#000", opacity: r01(f, C5_END - 6, C5_END) }} />
    </AbsoluteFill>
  );
};

/** act III for TV: the new phone scenes, then the kept build, break, final drop, split, CTA and end card */
export const ACT3TV: React.FC = () => (
  <>
    <Win still from={BRIDGE} to={C1_END}><F1 /></Win>
    <Win still from={C1_END} to={C2_END}><F2 /></Win>
    <Win still from={C2_END} to={C3_END}><F3 /></Win>
    <Win still from={C3_END} to={C4_END}><F4 /></Win>
    <Win still from={C4_END} to={C5_END}><F5 /></Win>
    <Win from={C5_END} to={BREAK}><C6 /></Win>
    <Win from={BREAK} to={FINAL}><C7 /></Win>
    <Win from={FINAL} to={SPLIT}>
      <Slam from={FINAL} shakeAt={FINAL} />
      <Explosion at={FINAL} cx={960} cy={540} />
    </Win>
    <Win from={SPLIT} to={C8_END}><C8 /></Win>
    <Win from={C8_END} to={C9_END}><C9 /></Win>
    <Win from={C9_END} to={F(END)}><C10 /></Win>
  </>
);
