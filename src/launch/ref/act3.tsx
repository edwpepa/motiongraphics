import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { EarnScreen, HoursScreen, ScheduleScreen, SetupScreen, TasksScreen } from "../tv/handly";
import { Sym, SymName } from "../tv/ios";
import { Device, Pose, mixPose } from "../tv/kit";
import { Mark } from "../tv3d/drop";
import { io3, outExpo, Sparkle, spring } from "../tv3d/kit3d";
import { leanBack } from "./act2";
import { beatPulse, BREAK_F, BUILD, C1_END, C2_END, C3_END, CTA, END_FLY, F1_START, FINAL_F, STAR, V, bt2 } from "./marks";
import { HaloBack, HaloFront } from "./halo";
import { LINES } from "./lines";
import { KText } from "./type";
import { Card, Cursor, Heart, IOSC, IOSGroup, IOSIcon, PillBtn, UI } from "./ui";

// ------------------------------------------------------------------ 1 · "Dar [mark] Handly nu e doar / pentru cei care au nevoie de ajutor." — the intro's type, on the night
export const C1: React.FC = () => <KText {...LINES.dar()} out={C1_END - 6} />;

// ------------------------------------------------------------------ 2 · "Dacă știi să faci ceva"
export const C2: React.FC = () => <KText {...LINES.daca()} out={C2_END - 8} />;

// ------------------------------------------------------------------ 3 · the skills, as a Settings list: a switch turns on with every word
const SK: [SymName, string, string, number][] = [
  ["box", "Montaj mobilă", IOSC.orange, 0],
  ["roller", "Zugrăveli", IOSC.blue, 2],
  ["wrench", "Reparații", IOSC.gray, 3],
  ["sparkles", "Curățenie", IOSC.teal, 4],
  ["truck", "Mutări", IOSC.indigo, 5],
];
export const C3: React.FC = () => {
  const f = useCurrentFrame();
  const at0 = V("skills", 0) - 6;
  const e = spring(clamp01((f - at0) / 24));
  const u = io3(clamp01((f - (C3_END - 10)) / 12));
  return (
    <div style={{ position: "absolute", left: 960, top: 540, transform: `translate(-50%, -50%) translateY(${(1 - e) * 200 + u * 120}px) scale(${(0.9 + 0.1 * e) * (1 - 0.3 * u)})`, opacity: clamp01((f - at0) / 5) * (1 - u), filter: u > 0 ? `blur(${u * 10}px)` : undefined }}>
      <IOSGroup
        dark
        w={900}
        k={2.1}
        header="Ce știi să faci"
        rows={SK.map(([ic, label, color, wi]) => ({ icon: <IOSIcon n={ic} color={color} size={60} />, title: label, acc: "toggle" as const, on: clamp01((f - (V("skills", wi) - 2)) / 6), at: V("skills", wi) - 8 }))}
        footer="Primești task-uri doar pentru ce ai bifat."
      />
    </div>
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
  // the build: it leans back on its spine, sinks into the light and fades
  const [pose, pop] = leanBack(poseAt(f), f, BUILD, Math.max(10, BREAK_F - BUILD - 8));
  const minute = V("cont", 7);
  const tasksPress = V("taskurile", 2);
  const b = clamp01((f - BUILD) / (BREAK_F - BUILD));
  return (
    <AbsoluteFill>
      <HaloBack x={pose.x} y={pose.y} s={pose.s} t={f - P_IN} f={f} dark opacity={pop} />
      <AbsoluteFill style={{ opacity: pop }}>
      <Device pose={pose} dark glow="rgba(0,191,99,0.12)">
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
      </AbsoluteFill>
      <HaloFront x={pose.x} y={pose.y} s={pose.s} t={f - P_IN} f={f} dark opacity={pop} />
      {/* account ready in minutes */}
      <DarkPop at={minute} from={[960, 700]} to={[1420, 360]} out={T_EARN + 6}>
        <IOSGroup dark w={600} k={1.75} rows={[{ icon: <IOSIcon n="user" color={IOSC.green} />, title: "Cont de tasker", sub: "gata în 3 minute", acc: "toggle", on: clamp01((f - minute - 4) / 6) }]} />
      </DarkPop>
      {/* earnings */}
      <DarkPop at={V("cont", 11) - 2} to={[1330, 470]} out={T_SCHED - 2}>
        <IOSGroup
          dark
          k={1.75}
          w={640}
          header="Câștiguri"
          rows={[
            { icon: <IOSIcon n="trend" color={IOSC.green} />, title: "Luna asta", value: `${Math.round(2450 * io3(clamp01((f - V("cont", 11)) / 36))).toLocaleString("ro-RO")} lei` },
            { icon: <IOSIcon n="box" color={IOSC.orange} />, title: "Montaj dulap", value: "+180 lei", at: V("cont", 13) - 2 },
            { icon: <IOSIcon n="roller" color={IOSC.blue} />, title: "Zugrăvit hol", value: "+450 lei", at: V("cont", 15) - 2 },
          ]}
        />
      </DarkPop>
      {/* you choose: the schedule, the tasks, how much */}
      <DarkPop at={V("program", 2) - 4} to={[1330, 300]} out={BUILD}>
        <IOSGroup
          dark
          k={1.75}
          w={640}
          header="Programul tău"
          rows={[
            { icon: <IOSIcon n="cal" color={IOSC.red} />, title: "Luni – Vineri", acc: "toggle", on: clamp01((f - V("program", 2)) / 6) },
            { icon: <IOSIcon n="clock" color={IOSC.indigo} />, title: "Interval", value: "08:00 – 14:00", acc: "chevron" },
          ]}
        />
      </DarkPop>
      <DarkPop at={V("taskurile", 2) - 10} to={[1330, 590]} out={BUILD + 2}>
        <IOSGroup
          dark
          k={1.75}
          w={640}
          rows={[{ icon: <IOSIcon n="box" color={IOSC.orange} />, title: "Montaj dulap", sub: "1,4 km · 180 lei", acc: <PillBtn label={f > tasksPress + 2 ? "Acceptat" : "Acceptă"} icon={f > tasksPress + 2 ? "check" : undefined} w={190} h={60} size={21} press={f >= tasksPress - 3 && f <= tasksPress + 5 ? Math.sin((Math.PI * (f - tasksPress + 3)) / 8) : 0} on={clamp01((f - tasksPress) / 6)} /> }]}
        />
      </DarkPop>
      <Cursor keys={[{ f: tasksPress - 22, x: 1750, y: 900 }, { f: tasksPress - 3, x: 1530, y: 600 }, { f: tasksPress + 20, x: 1620, y: 720 }]} clicks={[tasksPress]} hideAt={tasksPress + 12} />
      <DarkPop at={V("muncesti", 3) - 4} to={[1330, 820]} out={BUILD + 4}>
        <div style={{ width: 600, fontFamily: UI }}>
          <div style={{ background: "#1c1c1e", borderRadius: 18, padding: "20px 26px", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", color: "#fff", fontSize: 27 }}>
              <span>Ore pe săptămână</span>
              <span style={{ color: "#8e8e93", fontVariantNumeric: "tabular-nums" }}>{Math.round(lerp(10, 24, io3(clamp01((f - V("muncesti", 3)) / 18))))}</span>
            </div>
            <div style={{ position: "relative", height: 6, borderRadius: 3, background: "#39393d", marginTop: 22, marginBottom: 6 }}>
              <div style={{ width: `${lerp(25, 60, io3(clamp01((f - V("muncesti", 3)) / 18)))}%`, height: 6, borderRadius: 3, background: IOSC.blue }} />
              <div style={{ position: "absolute", top: -14, left: `calc(${lerp(25, 60, io3(clamp01((f - V("muncesti", 3)) / 18)))}% - 17px)`, width: 34, height: 34, borderRadius: 17, background: "#fff", boxShadow: "0 3px 8px rgba(0,0,0,0.35)" }} />
            </div>
          </div>
        </div>
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
  const k0 = Math.floor((f - bt2(0)) / ((bt2(100) - bt2(0)) / 100));
  return (
    <AbsoluteFill>
      <KText {...LINES.ajutor()} out={CTA - 6} />
      <KText {...LINES.bani()} out={CTA - 6} />
      {/* a sparkle lights on every beat, somewhere around the line */}
      {Array.from({ length: 5 }, (_, j) => {
        const kk = k0 - j;
        const t = (f - bt2(kk)) / 26;
        if (t < 0 || t > 1 || bt2(kk) < F1_START) return null;
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
  const m = clamp01((f - (STAR - 4)) / 12); // button → heart
  // the heart grows out of the button into the middle, beats twice (lub-dub), then breathes until the end card takes it
  const big = io3(m);
  const sx = lerp(BX, 960, big), sy = lerp(BY, 540, big);
  const beat = (at: number) => (f >= at && f < at + 9 ? Math.sin((Math.PI * (f - at)) / 9) : 0);
  const pulse = beat(STAR + 6) + 0.7 * beat(STAR + 13) + 0.04 * Math.sin((f - STAR) / 5);
  const ssize = lerp(30, 170, big);
  // the camera lets go of the zoom as the heart takes the stage
  const cam = lerp(zoom, 1, io3(m));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: `${(BX + 960) / 2}px ${BY}px` }}>
        <div style={{ position: "absolute", left: 960 - 560 + (1 - e) * -260, top: 540 - 76, opacity: clamp01((f - CTA) / 4), filter: e < 1 ? `blur(${(1 - e) * 16}px)` : undefined }}>
          <Card w={1120} h={152} r={34} pad={0} style={{ display: "flex", alignItems: "center", gap: 24, padding: "0 30px", background: `rgba(255,255,255,${rest})`, boxShadow: rest > 0.02 ? undefined : "none" }}>
            <div style={{ opacity: rest }}><Img src={staticFile("images/logo.webp")} style={{ width: 90, height: 90, display: "block" }} /></div>
            <div style={{ flex: 1, opacity: rest }}>
              <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em" }}>Handly</div>
              <div style={{ fontSize: 21, fontWeight: 500, color: "#7c8481", marginTop: 4 }}>Ajutor la orice · Bani din ce știi</div>
            </div>
            <div style={{ opacity: 1 - m, transform: `scale(${1 - 0.5 * m})`, filter: m > 0 ? `blur(${m * 10}px)` : undefined }}>
              <PillBtn label="Descarcă aplicația" w={340} h={80} size={25} press={f >= click - 3 && f <= click + 5 ? Math.sin((Math.PI * (f - click + 3)) / 8) : 0} on={clamp01((f - click) / 6)} />
            </div>
          </Card>
        </div>
        <Cursor keys={[{ f: CTA + 8, x: 1500, y: 900 }, { f: click - 3, x: BX + 20, y: BY + 14 }, { f: click + 22, x: BX + 120, y: BY + 160 }]} clicks={[click]} hideAt={click + 12} />
      </AbsoluteFill>
      {m > 0 && f < END_FLY + 2 && <Heart x={sx} y={sy} size={ssize} rot={Math.sin(m * Math.PI) * -10} opacity={clamp01(m * 3)} pulse={pulse} />}
      {/* glints that twinkle round it on the beats */}
      {m >= 1 &&
        [0, 1, 2, 3].map((i) => {
          const at = STAR + 6 + i * 4;
          const t = clamp01((f - at) / 16);
          if (t <= 0 || t >= 1) return null;
          const a = -2.2 + i * 1.5;
          return <Sparkle key={i} x={960 + Math.cos(a) * 250} y={540 + Math.sin(a) * 200} size={18 + 8 * (i % 2)} t={Math.sin(Math.PI * t)} rot={t * 90} opacity={Math.sin(Math.PI * t)} />;
        })}
    </AbsoluteFill>
  );
};
