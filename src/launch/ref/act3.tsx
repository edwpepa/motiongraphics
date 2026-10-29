import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { EarnScreen, HoursScreen, ScheduleScreen, SetupScreen, TasksScreen } from "../tv/handly";
import { Sym, SymName } from "../tv/ios";
import { Device, Pose, mixPose } from "../tv/kit";
import { Mark } from "../tv3d/drop";
import { beatPulse, GREEN, io3, outExpo, Sparkle, spring } from "../tv3d/kit3d";
import { BREAK_F, BUILD, C1_END, C2_END, C3_END, CTA, END_FLY, F1_START, FINAL_F, STAR, V, bt } from "./marks";
import { RefLine } from "./type";
import { AppTile, Card, Cursor, GlossIcon, PillBtn } from "./ui";

// ------------------------------------------------------------------ 1 · "Dar Handly nu e doar / pentru cei care au nevoie de ajutor." — soft, on the night
export const C1: React.FC = () => (
  <>
    <RefLine
      dark
      enter="soft"
      size={80}
      y={480}
      words={[
        { t: "Dar", at: V("dar", 0) },
        { at: V("dar", 1) - 2, w: 100, node: (p, k) => <div style={{ transform: `scale(${0.3 + 0.7 * spring(clamp01(k / 18))}) rotate(${(1 - p) * -24}deg)` }}><AppTile size={96} /></div> },
        { t: "Handly", at: V("dar", 1), acc: true },
        { t: "nu", at: V("dar", 2) },
        { t: "e", at: V("dar", 3) },
        { t: "doar", at: V("dar", 4) },
      ]}
      out={C1_END - 10}
      exit="blur"
      drift={0.02}
    />
    <RefLine
      dark
      enter="pop"
      size={80}
      y={600}
      words={[
        { t: "pentru", at: V("dar", 5) },
        { t: "cei", at: V("dar", 6) },
        { t: "care", at: V("dar", 7) },
        { t: "au", at: V("dar", 8) },
        { t: "nevoie", at: V("dar", 9) },
        { t: "de", at: V("dar", 10) },
        { t: "ajutor.", at: V("dar", 11), acc: true },
      ]}
      out={C1_END - 8}
      exit="blur"
      drift={0.02}
    />
  </>
);

// ------------------------------------------------------------------ 2 · "Dacă știi să faci ceva"
export const C2: React.FC = () => (
  <RefLine dark size={92} words={[{ t: "Dacă", at: V("daca", 0) }, { t: "știi", at: V("daca", 1) }, { t: "să", at: V("daca", 2) }, { t: "faci", at: V("daca", 3) }, { t: "ceva", at: V("daca", 4), acc: true }]} out={C2_END - 8} />
);

// ------------------------------------------------------------------ 3 · the skills float in, one per word, then fly into the phone
const SK: [SymName, string, number][] = [
  ["box", "Montaj mobilă", 0],
  ["roller", "Zugrăveli", 2],
  ["wrench", "Reparații", 3],
  ["sparkles", "Curățenie", 4],
  ["truck", "Mutări", 5],
];
export const C3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {SK.map(([ic, label, wi], i) => {
        const at = V("skills", wi) - 2;
        if (f < at) return null;
        const e = spring(clamp01((f - at) / 22));
        const x0 = 960 + (i - 2) * 360, y0 = 540 + (i % 2 ? -70 : 60);
        const u = clamp01((f - (C3_END - 12 + i)) / 14);
        const k = u * u;
        const x = lerp(x0, 960, k), y = lerp(y0 + (1 - e) * 160, 560, k);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y + Math.sin(f / 21 + i) * 8, transform: `translate(-50%, -50%) perspective(1200px) rotateY(${(x0 - 960) * -0.02 + Math.sin(f / 37 + i) * 6}deg) rotateZ(${(1 - e) * (i - 2) * 6}deg) scale(${(0.6 + 0.4 * e) * (1 - 0.8 * k) * 1.15})`, opacity: clamp01((f - at) / 4) * (1 - clamp01((u - 0.7) / 0.3)) }}>
            <Card dark w={280} r={30} pad={26} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <GlossIcon n={ic} size={96} tilt={Math.sin(f / 30 + i) * 3} />
              <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.01em" }}>{label}</div>
            </Card>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4 · the tasker's side of the app: account, earnings, schedule, tasks, hours
const P_IN = C3_END - 12;
const T_EARN = V("cont", 8) - 6;
const T_SCHED = V("program", 0) - 6;
const T_TASKS = V("taskurile", 0) - 6;
const T_HOURS = V("muncesti", 0) - 6;
const idle = (f: number, x: number, s = 0.98): Pose => ({ x: x + Math.sin(f / 97) * 10, y: 548 + Math.sin(f / 61) * 8, s: s * (1 + 0.012 * Math.sin(f / 73)), rx: 4 + 2.5 * Math.sin(f / 83), ry: (x < 960 ? 14 : 0) + 6 * Math.sin(f / 71), rz: 1.2 * Math.sin(f / 113) });
const poseAt = (f: number): Pose => {
  const enter = spring(clamp01((f - P_IN) / 28));
  let p = idle(f, 960, 1.0);
  p = mixPose(p, idle(f, 640), io3(clamp01((f - T_EARN) / 18)));
  p = { ...p, y: p.y + (1 - enter) * 900, rx: p.rx + (1 - enter) * 40, ry: p.ry + (1 - enter) * 30, rz: p.rz + (1 - enter) * 10 };
  // the build: the phone turns faster and faster and folds into a point of light
  const b = clamp01((f - BUILD) / (BREAK_F - BUILD));
  if (b > 0) {
    const k = b * b;
    p = { ...p, x: lerp(p.x, 960, io3(b)), y: lerp(p.y, 540, io3(b)), ry: p.ry + 720 * k, s: p.s * (1 - 0.92 * k) };
  }
  return p;
};
const Stack2: React.FC<{ screens: { at: number; node: React.ReactNode }[] }> = ({ screens }) => {
  const f = useCurrentFrame();
  let cur = 0;
  for (let i = 0; i < screens.length; i++) if (f >= screens[i].at) cur = i;
  const t = cur > 0 ? io3(clamp01((f - screens[cur].at) / 12)) : 1;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0b1410" }}>
      {cur > 0 && t < 1 && <div style={{ position: "absolute", inset: 0, transform: `translateX(${-30 * t}%)`, filter: `brightness(${1 - 0.4 * t})` }}>{screens[cur - 1].node}</div>}
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${100 * (1 - t)}%)` }}>{screens[cur].node}</div>
    </div>
  );
};
const DarkPop: React.FC<{ at: number; to: [number, number]; out: number; children: React.ReactNode; from?: [number, number] }> = ({ at, to, out, children, from = [640, 540] }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const e = outExpo(clamp01((f - at) / 18));
  const s = spring(clamp01((f - at) / 24));
  // leaving: back into the phone during the build, or melting away
  const u = clamp01((f - out) / 12);
  const k = u * u;
  const x = lerp(lerp(from[0], to[0], e), 960, f >= BUILD ? k : 0), y = lerp(lerp(from[1], to[1], e), 540, f >= BUILD ? k : 0);
  const op = clamp01((f - at) / 4) * (f >= BUILD ? 1 - clamp01((u - 0.6) / 0.4) : 1 - u);
  if (op <= 0.003) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y + Math.sin((f - at) / 23) * 6, transform: `translate(-50%, -50%) scale(${(0.35 + 0.65 * s) * (f >= BUILD ? 1 - 0.85 * k : 1) * 1.25})`, opacity: op, filter: f < BUILD && u > 0 ? `blur(${u * 14}px)` : undefined }}>
      {children}
    </div>
  );
};

export const TaskerShot: React.FC = () => {
  const f = useCurrentFrame();
  if (f < P_IN - 2 || f >= BREAK_F) return null;
  const pose = poseAt(f);
  const minute = V("cont", 7);
  const tasksPress = V("taskurile", 2);
  const b = clamp01((f - BUILD) / (BREAK_F - BUILD));
  return (
    <AbsoluteFill>
      <Device pose={pose} dark glow={`rgba(0,191,99,${0.22 + 0.5 * b})`}>
        <Stack2
          screens={[
            { at: 0, node: <SetupScreen f={f} typed={clamp01((f - V("cont", 0)) / 24)} ver={clamp01((f - V("cont", 3)) / (minute - V("cont", 3)))} ready={clamp01((f - minute) / 8)} /> },
            { at: T_EARN, node: <EarnScreen f={f} amount={2450 * io3(clamp01((f - V("cont", 9)) / 40))} bars={clamp01((f - T_EARN - 4) / 30)} pings={[V("cont", 11), V("cont", 13), V("cont", 15)]} /> },
            { at: T_SCHED, node: <ScheduleScreen f={f} days={5 * clamp01((f - V("program", 1)) / 12)} end={io3(clamp01((f - V("program", 2)) / 14))} /> },
            { at: T_TASKS, node: <TasksScreen f={f} acc={f > tasksPress + 2 ? 1 : 0} press={f >= tasksPress - 3 && f <= tasksPress + 5 ? Math.sin((Math.PI * (f - tasksPress + 3)) / 8) : 0} /> },
            { at: T_HOURS, node: <HoursScreen f={f} hours={lerp(10, 24, io3(clamp01((f - V("muncesti", 2)) / 18)))} /> },
          ]}
        />
      </Device>
      {/* account ready in minutes */}
      <DarkPop at={minute} from={[960, 700]} to={[1420, 330]} out={T_EARN + 6}>
        <Card dark w={400} r={28} pad={22} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}><Sym n="check" size={30} color="#fff" w={3.2} /></div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Cont de tasker</div>
            <div style={{ fontSize: 19, fontWeight: 500, color: "#8fa79a" }}>gata în 3 minute</div>
          </div>
        </Card>
      </DarkPop>
      {/* earnings */}
      <DarkPop at={V("cont", 11) - 2} to={[1320, 400]} out={T_SCHED - 2}>
        <Card dark w={520} r={30} pad={28}>
          <div style={{ fontSize: 21, fontWeight: 500, color: "#8fa79a" }}>Câștigat luna asta</div>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
            {Math.round(2450 * io3(clamp01((f - V("cont", 11)) / 36))).toLocaleString("ro-RO")} <span style={{ fontSize: 36, color: GREEN }}>lei</span>
          </div>
        </Card>
      </DarkPop>
      {([["Montaj dulap", "+180 lei", "box"], ["Zugrăvit hol", "+450 lei", "roller"]] as [string, string, SymName][]).map(([t, v, ic], i) => (
        <DarkPop key={t} at={V("cont", 13 + i * 2) - 2} to={[1320 + i * 40, 620 + i * 120]} out={T_SCHED - 2}>
          <Card dark w={460} r={24} pad={18} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <GlossIcon n={ic} size={52} />
            <div style={{ fontSize: 24, fontWeight: 500 }}>{t}</div>
            <div style={{ marginLeft: "auto", fontSize: 26, fontWeight: 600, color: GREEN }}>{v}</div>
          </Card>
        </DarkPop>
      ))}
      {/* you choose: the schedule, the tasks, how much */}
      <DarkPop at={V("program", 2) - 4} to={[1330, 300]} out={BUILD}>
        <Card dark w={540} r={28} pad={24}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 21, fontWeight: 500, color: "#8fa79a" }}><Sym n="cal" size={22} color={GREEN} w={2.2} /> Programul tău</div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => {
              const on = i < 5 && f > V("program", 2) + i * 2;
              return <div key={i} style={{ width: 58, height: 58, borderRadius: 29, background: on ? GREEN : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, color: on ? "#fff" : "#5e7468" }}>{d}</div>;
            })}
          </div>
        </Card>
      </DarkPop>
      <DarkPop at={V("taskurile", 2) - 10} to={[1360, 545]} out={BUILD + 2}>
        <Card dark w={540} r={28} pad={22} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <GlossIcon n="box" size={64} />
          <div>
            <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-0.02em" }}>Montaj dulap</div>
            <div style={{ fontSize: 19, fontWeight: 500, color: "#8fa79a" }}>1,4 km · 180 lei</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <PillBtn label={f > tasksPress + 2 ? "Acceptat" : "Acceptă"} icon={f > tasksPress + 2 ? "check" : undefined} w={170} h={58} size={20} press={f >= tasksPress - 3 && f <= tasksPress + 5 ? Math.sin((Math.PI * (f - tasksPress + 3)) / 8) : 0} on={clamp01((f - tasksPress) / 6)} />
          </div>
        </Card>
      </DarkPop>
      <Cursor keys={[{ f: tasksPress - 22, x: 1750, y: 900 }, { f: tasksPress - 3, x: 1550, y: 560 }, { f: tasksPress + 20, x: 1620, y: 700 }]} clicks={[tasksPress]} hideAt={tasksPress + 12} />
      <DarkPop at={V("muncesti", 3) - 4} to={[1330, 790]} out={BUILD + 4}>
        <Card dark w={540} r={28} pad={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 21, fontWeight: 500, color: "#8fa79a" }}>Cât muncești</span>
            <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{Math.round(lerp(10, 24, io3(clamp01((f - V("muncesti", 3)) / 18))))} h<span style={{ fontSize: 20, color: "#8fa79a" }}> / săpt.</span></span>
          </div>
          <div style={{ position: "relative", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.08)", marginTop: 18 }}>
            <div style={{ width: `${lerp(25, 60, io3(clamp01((f - V("muncesti", 3)) / 18)))}%`, height: 12, borderRadius: 6, background: GREEN }} />
            <div style={{ position: "absolute", top: -10, left: `calc(${lerp(25, 60, io3(clamp01((f - V("muncesti", 3)) / 18)))}% - 16px)`, width: 32, height: 32, borderRadius: 16, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }} />
          </div>
        </Card>
      </DarkPop>
      {/* the build: sparks rush into the turning phone */}
      {b > 0 &&
        Array.from({ length: 16 }, (_, i) => {
          const a = seeded(i, 91) * Math.PI * 2;
          const r = lerp(900, 30, clamp01(b * 1.1 - seeded(i, 92) * 0.1) ** 1.6);
          return <Sparkle key={i} x={960 + Math.cos(a + b * 3) * r * 1.3} y={540 + Math.sin(a + b * 3) * r * 0.75} size={10 + 18 * seeded(i, 93)} t={1} rot={f * 8} opacity={clamp01(b * 3)} color="#9ff2c4" color2="#ffffff" />;
        })}
      {b > 0.6 && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(220,255,236,${((b - 0.6) / 0.4) ** 2}) 0%, rgba(0,191,99,${0.5 * ((b - 0.6) / 0.4) ** 2}) 30%, rgba(0,0,0,0) 70%)` }} />}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · the break: "Handly." alone in the dark
export const Break: React.FC = () => {
  const f = useCurrentFrame();
  const at = V("handly", 0) - 3;
  const e = clamp01((f - at) / 16);
  const pre = clamp01((f - (FINAL_F - 12)) / 12);
  return (
    <AbsoluteFill style={{ background: "#020403", justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity: e, filter: e < 1 ? `blur(${(1 - e) * 14}px)` : undefined, transform: `scale(${(1.08 - 0.08 * outExpo(e)) * (1 + 0.012 * Math.max(0, f - at) / 10) * (1 + 0.3 * pre * pre)})` }}>
        <Mark size={84} logo="white" word="#ffffff" />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6 · the final chorus: "Ajutor când ai nevoie. / Bani când ai timp."
export const F1: React.FC = () => {
  const f = useCurrentFrame();
  const bump = 1 + 0.03 * beatPulse(f, 8);
  const k0 = Math.floor((f - bt(0)) / ((bt(100) - bt(0)) / 100));
  return (
    <AbsoluteFill>
      <RefLine size={104} words={[{ t: "Ajutor", at: V("ajutor", 0), acc: true }, { t: "când", at: V("ajutor", 1) }, { t: "ai", at: V("ajutor", 2) }, { t: "nevoie.", at: V("ajutor", 3) }]} out={V("bani", 0) - 8} bump={bump} drift={-0.03} />
      <RefLine size={104} words={[{ t: "Bani", at: V("bani", 0), acc: true }, { t: "când", at: V("bani", 1) }, { t: "ai", at: V("bani", 2) }, { t: "timp.", at: V("bani", 3) }]} out={CTA - 6} bump={bump} drift={0.03} />
      {/* a sparkle lights on every beat, somewhere around the line */}
      {Array.from({ length: 5 }, (_, j) => {
        const kk = k0 - j;
        const t = (f - bt(kk)) / 26;
        if (t < 0 || t > 1 || bt(kk) < F1_START) return null;
        const a = seeded(kk, 13) * Math.PI * 2;
        return <Sparkle key={j} x={960 + Math.cos(a) * (560 + 120 * seeded(kk, 14))} y={540 + Math.sin(a) * (260 + 60 * seeded(kk, 15))} size={22 + 26 * seeded(kk, 16)} t={Math.sin(Math.PI * t)} rot={t * 140} opacity={Math.sin(Math.PI * t)} />;
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7 · "Descarcă aplicația" — the black button turns green, becomes the star
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const click = V("cta", 1) - 1;
  const e = outExpo(clamp01((f - CTA) / 16));
  const BX = 960 + 330, BY = 540;
  const zoom = 1.22 + 0.3 * io3(clamp01((f - CTA) / (click - CTA + 10)));
  const rest = 1 - clamp01((f - (click + 6)) / 10);
  const m = clamp01((f - (STAR - 4)) / 10); // button → star
  const fly = clamp01((f - (STAR + 8)) / (END_FLY - STAR - 8));
  // star path: from the button to the middle (big), then away to where the end card picks it up
  const big = outExpo(m);
  const sx = lerp(lerp(BX, 960, big), 1500, io3(fly)), sy = lerp(lerp(BY, 540, big), 860, io3(fly));
  const ssize = lerp(lerp(40, 230, big), 60, io3(fly));
  // the camera lets go of the zoom as the star takes the stage
  const cam = lerp(zoom, 1, io3(m));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: `${(BX + 960) / 2}px ${BY}px` }}>
        <div style={{ position: "absolute", left: 960 - 560 + (1 - e) * -260, top: 540 - 76, opacity: clamp01((f - CTA) / 4), filter: e < 1 ? `blur(${(1 - e) * 16}px)` : undefined }}>
          <Card w={1120} h={152} r={34} pad={0} style={{ display: "flex", alignItems: "center", gap: 24, padding: "0 30px", background: `rgba(255,255,255,${rest})`, boxShadow: rest > 0.02 ? undefined : "none" }}>
            <div style={{ opacity: rest }}><AppTile size={96} /></div>
            <div style={{ flex: 1, opacity: rest }}>
              <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em" }}>Handly</div>
              <div style={{ fontSize: 21, fontWeight: 500, color: "#7c8481", marginTop: 4 }}>Ajutor la orice · Bani din ce știi</div>
            </div>
            <div style={{ opacity: 1 - m, transform: `scale(${1 - 0.5 * m})`, filter: m > 0 ? `blur(${m * 10}px)` : undefined }}>
              <PillBtn label="Descarcă aplicația" w={340} h={80} size={25} icon="sparkles" press={f >= click - 3 && f <= click + 5 ? Math.sin((Math.PI * (f - click + 3)) / 8) : 0} on={clamp01((f - click) / 6)} />
            </div>
          </Card>
        </div>
        <Cursor keys={[{ f: CTA + 8, x: 1500, y: 900 }, { f: click - 3, x: BX + 20, y: BY + 14 }, { f: click + 22, x: BX + 120, y: BY + 160 }]} clicks={[click]} hideAt={click + 12} />
      </AbsoluteFill>
      {m > 0 && f < END_FLY + 2 && <Sparkle x={sx} y={sy} size={ssize} t={1} rot={m * 90 + fly * 300} />}
      {m > 0 && m < 1 && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,191,99,${0.2 * Math.sin(Math.PI * m)}) 0%, rgba(0,191,99,0) 45%)` }} />}
    </AbsoluteFill>
  );
};
