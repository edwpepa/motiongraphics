import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { iw, S1_END, S2_END, S3_END, S4_END, S5_END, S6_END, S7_END } from "../introTimes";
import { A10_END } from "../scenes";
import { w } from "../timeline";
import { BankScreen, CalendarScreen, CallScreen, ContactsScreen, HANDLY_ICON, HeartScreen, HomeScreen, LockScreen, MessagesScreen, Notif, RemindersScreen, SearchScreen, ShopScreen, SH, SW } from "./ios";
import { addPose, CutFlash, DarkStage, Device, drift, GREY, Headline, Line, outExpo, Pose, r01, RED, Rig, vo } from "./kit";

// ------------------------------------------------------------------ act I: the whole problem, told on his phone at midnight
const dimTo = (f: number, at: number) => `rgba(245,245,247,${lerp(1, 0.32, r01(f, at, at + 10))})`;
/** a quick whip of the phone on each cut, the motion carried across it */
const whip = (f: number, cuts: number[], amp = 34) => {
  let ry = 0, blur = 0, x = 0;
  for (const c of cuts) {
    const t = (f - c) / 12;
    if (t >= 0 && t < 1) {
      const e = 1 - outExpo(t);
      ry += amp * e;
      x += 90 * e;
      blur += 7 * e * e;
    }
  }
  return { ry, blur, x };
};
/** the white dot of a finger touching glass */
const Touch: React.FC<{ x: number; y: number; at: number; f: number }> = ({ x, y, at, f }) => {
  const t = (f - at + 6) / 18;
  if (t < 0 || t > 1) return null;
  const down = Math.sin(t * Math.PI);
  return <div style={{ position: "absolute", left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26, background: `rgba(255,255,255,${0.55 * down})`, boxShadow: `0 0 0 ${10 * (1 - down)}px rgba(255,255,255,${0.25 * down})`, transform: `scale(${0.8 + 0.3 * down})`, zIndex: 20 }} />;
};
const Screen: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, overflow: "hidden", ...style }}>{children}</div>;

// ------------------------------------------------------------------ 1 · midnight, and the reminders keep coming
const NOTES: Array<[Parameters<typeof Notif>[0]["k"], string, string, string]> = [
  ["reminders", "Mementouri", "Repară priza din bucătărie", "Întârziat de 3 săptămâni"],
  ["reminders", "Mementouri", "Tunde iarba", "Întârziat de 2 săptămâni"],
  ["messages", "Mama", "Mama", "Ai rezolvat cu priza?"],
  ["reminders", "Mementouri", "Montează dulapul", "Stă în cutie de o lună"],
  ["mail", "Asociația de proprietari", "Spațiul verde din fața blocului", "Vă rugăm să tundeți iarba până vineri."],
];
export const A1: React.FC = () => {
  const f = useCurrentFrame();
  const enter = outExpo(clamp01(f / 34));
  const pose = addPose(drift(f), { y: (1 - enter) * 500, rx: (1 - enter) * 30, ry: (1 - enter) * -30, s: lerp(0.9, 1, enter) });
  const at = (i: number) => 14 + i * 17;
  const ws = vo("probleme");
  const lines: Line[] = [
    { w: ws.slice(0, 1), size: 176 },
    { w: ws.slice(1, 3), size: 176 },
    { w: ws.slice(3), size: 58, color: GREY },
  ];
  return (
    <AbsoluteFill>
      <DarkStage />
      <Rig from={0} to={S1_END} push={0.04}>
        <Device pose={pose} glow="rgba(80,110,255,0.18)">
          <LockScreen f={f} time="23:47">
            {NOTES.map(([k, app, t, b], i) => {
              const p = outExpo(clamp01((f - at(i)) / 12));
              if (p <= 0) return null;
              const above = NOTES.filter((_, j) => j > i && f >= at(j)).length;
              return <Notif key={i} k={k} app={app} title={t} body={b} style={{ top: 300 + above * 92 - (1 - p) * 60, opacity: clamp01(p * 2) * (above > 3 ? 0 : 1), transform: `scale(${(0.9 + 0.1 * p) * (1 - above * 0.02)})`, zIndex: 10 + i }} badge={k === "reminders" ? String(i + 1) : undefined} />;
            })}
          </LockScreen>
        </Device>
        <Headline lines={lines} y={250} out={S1_END - 9} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2 · the list: the socket, the grass, the cabinet
const REMS = [
  { t: "Repară priza din bucătărie", s: "Nu merge de 3 săptămâni", late: true },
  { t: "Tunde iarba", s: "Întârziat · 2 săptămâni", late: true },
  { t: "Montează dulapul", s: "În cutie de o lună", late: true },
  { t: "Schimbă becul de pe hol", s: "Mâine" },
  { t: "Sună administratorul", s: "Fără dată" },
];
export const A2: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S1_END;
  const open = outExpo(clamp01((f - a0) / 14));
  const t = [iw("priza", 0) - 3, iw("iarba", 0) - 3, iw("dulap", 0) - 3];
  const hi = t.map((at, i) => r01(f, at, at + 8) * (i < 2 ? 1 - r01(f, t[i + 1], t[i + 1] + 8) : 1));
  const pose = addPose(drift(f), { s: lerp(1, 1.12, r01(f, a0, S2_END, (u) => u)), x: -20 });
  const P = vo("priza"), I = vo("iarba"), D = vo("dulap");
  const lines: Line[] = [
    { w: P, size: 96, color: dimTo(f, t[1]) },
    { w: I, size: 96, color: dimTo(f, t[2]) },
    { w: D.slice(0, 1), size: 96 },
    { w: D.slice(1), size: 58, color: GREY, hi: { 3: "#ff6961", 4: "#ff6961", 5: "#ff6961" } },
  ];
  return (
    <AbsoluteFill>
      <DarkStage />
      <Rig from={a0} to={S2_END} push={0.03}>
        <Device pose={pose} glow="rgba(255,149,0,0.14)">
          <Screen style={{ transform: `scale(${lerp(0.92, 1, open)})`, opacity: open, borderRadius: 40 * (1 - open) }}>
            <RemindersScreen items={REMS} hi={hi} f={f} />
          </Screen>
        </Device>
        <Headline lines={lines} y={270} gap={0.12} out={S2_END - 8} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3 · no time, no tools, no nerves
export const A3: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S2_END;
  const c2 = iw("sculele", 0) - 5, c3 = iw("nervii", 0) - 5;
  const shot = f < c2 ? 0 : f < c3 ? 1 : 2;
  const wp = whip(f, [c2, c3]);
  const pose = addPose(drift(f), { ry: wp.ry, x: wp.x, s: 1.06 });
  const T = vo("timpul"), S = vo("sculele"), N = vo("nervii");
  const lines: Line[] = [
    { w: T.slice(0, 3), size: 58, color: GREY },
    { w: T.slice(3), size: 132, color: dimTo(f, c2) },
    { w: S, size: 132, color: dimTo(f, c3) },
    { w: N.slice(0, 2), size: 132 },
    { w: N.slice(2), size: 58, color: GREY },
  ];
  return (
    <AbsoluteFill>
      <DarkStage hue={shot === 2 ? "255,55,95" : "60,120,255"} glow={shot === 2 ? 0.2 : 0.16} />
      <Rig from={a0} to={S3_END} push={0.03}>
        <Device pose={pose} blur={wp.blur} glow={shot === 2 ? "rgba(255,55,95,0.2)" : "rgba(80,110,255,0.14)"}>
          {shot === 0 && <CalendarScreen f={f} fill={r01(f, a0, a0 + 26, (u) => u)} banner={r01(f, a0 + 18, a0 + 30)} />}
          {shot === 1 && <ShopScreen f={f} n={(f - c2) / 5} total={2886 * r01(f, c2 + 2, c2 + 24, (u) => u)} />}
          {shot === 2 && <HeartScreen f={f} bpm={lerp(76, 124, r01(f, c3, c3 + 34, (u) => 1 - (1 - u) ** 2))} t={r01(f, c3, c3 + 34, (u) => u)} />}
        </Device>
        <Headline lines={lines} y={150} gap={0.06} out={S3_END - 8} />
      </Rig>
      <CutFlash at={c2} a={0.18} />
      <CutFlash at={c3} a={0.18} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4 · and you keep snoozing it
export const A4: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S3_END;
  const taps = [iw("amani", 0) - 3, iw("amani", 1) - 2, iw("amani", 2) + 3];
  const k = taps.filter((t) => f >= t + 2).length;
  const bump = taps.reduce((m, t) => Math.max(m, Math.sin(Math.PI * clamp01((f - t - 2) / 8))), 0);
  const press = taps.reduce((m, t) => Math.max(m, Math.sin(Math.PI * clamp01((f - t + 3) / 7))), 0);
  const inP = outExpo(clamp01((f - a0) / 10));
  const pose = addPose(drift(f), { s: 1.32, y: 150, x: -30, rx: -2 });
  const ws = vo("amani");
  return (
    <AbsoluteFill>
      <DarkStage />
      <Rig from={a0} to={S4_END} push={0.04}>
        <Device pose={pose} glow="rgba(80,110,255,0.18)">
          <LockScreen f={f} time="23:59">
            <Notif
              k="reminders"
              app="Mementouri"
              title="Montează dulapul"
              body={`Amânat de ${12 + k} ori`}
              style={{ top: 268 - (1 - inP) * 120, opacity: inP, transform: `scale(${1 + 0.03 * bump})` }}
              action={
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {["Amână 1 oră", "Gata"].map((b, i) => (
                    <div key={b} style={{ flex: 1, height: 38, borderRadius: 19, background: `rgba(255,255,255,${i === 0 ? 0.2 + 0.3 * press : 0.1})`, transform: i === 0 ? `scale(${1 - 0.05 * press})` : undefined, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600 }}>
                      {b}
                    </div>
                  ))}
                </div>
              }
            />
            {taps.map((t, i) => (
              <Touch key={i} x={118} y={412} at={t} f={f} />
            ))}
          </LockScreen>
        </Device>
        <Headline lines={[{ w: ws.slice(0, 2), size: 176 }, { w: ws.slice(2), size: 176 }]} y={300} out={S4_END - 7} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · you put it face down and hope — and it buzzes again
export const A5: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S4_END;
  const down = r01(f, a0, a0 + 26, (u) => 1 - (1 - u) ** 3);
  const buzz = iw("singur", 1) - 4;
  const lit = clamp01((f - buzz) / 4);
  const shake = f >= buzz && f < buzz + 16 ? Math.sin(f * 2.6) * 7 * (1 - (f - buzz) / 16) : 0;
  const base = drift(f);
  const pose: Pose = { ...base, x: base.x + shake + 60 * down, y: lerp(base.y, 640, down), rx: lerp(base.rx, 68, down), ry: lerp(base.ry, -4, down), rz: lerp(base.rz, -18, down), s: lerp(1, 1.08, down) };
  const S = vo("speri"), C = vo("cumva"), G = vo("singur");
  const lines: Line[] = [
    { w: S, size: 120 },
    { w: C, size: 120 },
    { w: G, size: 120, hi: { 2: GREY } },
  ];
  return (
    <AbsoluteFill>
      <DarkStage glow={0.08 + 0.2 * lit} />
      <Rig from={a0} to={S5_END} push={0.04}>
        <Device pose={pose} glow={lit > 0 ? `rgba(80,110,255,${0.3 * lit})` : undefined}>
          <LockScreen f={f} time="00:12" dim={1 - lit}>
            {lit > 0 &&
              [0, 1, 2].map((i) => (
                <Notif key={i} k="reminders" app="Mementouri" title={REMS[i].t} body={REMS[i].s} style={{ top: 300 + i * 92, opacity: clamp01((f - buzz - i * 3) / 5) }} badge={String(5 - i)} />
              ))}
          </LockScreen>
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.94 * (1 - lit) * down})` }} />
        </Device>
        <Headline lines={lines} y={240} gap={0.05} out={S5_END - 8} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6 · no one you can trust, one call away
export const A6: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S5_END;
  const q = "meșter de încredere";
  const t0 = w("lumea", 2), t1 = w("lumea", 7) + 4;
  const n = Math.round(q.length * r01(f, t0, t1, (u) => u));
  const none = r01(f, t1 + 2, t1 + 12);
  const pose = addPose(drift(f), { s: lerp(1.05, 1.25, r01(f, t1, t1 + 30)), y: lerp(0, 80, r01(f, t1, t1 + 30)) });
  const L = vo("lumea");
  const lines: Line[] = [
    { w: L.slice(0, 4), size: 92 },
    { w: L.slice(4, 8), size: 92, hi: { 3: "#ff6961" } },
    { w: L.slice(8), size: 58, color: GREY },
  ];
  return (
    <AbsoluteFill>
      <DarkStage />
      <Rig from={a0} to={S6_END} push={0.035}>
        <Device pose={pose} glow="rgba(80,110,255,0.14)">
          <ContactsScreen f={f} query={q.slice(0, n)} caret={Math.floor(f / 8) % 2 === 0} none={none} list={1 - r01(f, t0, t0 + 8)} />
        </Device>
        <Headline lines={lines} y={300} gap={0.1} out={S6_END - 8} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7 · searching, calling, haggling
export const A7: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S6_END;
  const c2 = w("obositor", 6) - 7, c3 = w("obositor", 8) - 7;
  const shot = f < c2 ? 0 : f < c3 ? 1 : 2;
  const wp = whip(f, [c2, c3], 30);
  const pose = addPose(drift(f), { ry: wp.ry, x: wp.x, s: 1.06 });
  const O = vo("obositor");
  const lines: Line[] = [
    { w: O.slice(0, 3), size: 132 },
    { w: O.slice(3, 5), size: 84, color: dimTo(f, c2) },
    { w: O.slice(5, 7), size: 84, color: dimTo(f, c3) },
    { w: O.slice(7), size: 84 },
  ];
  return (
    <AbsoluteFill>
      <DarkStage />
      <Rig from={a0} to={S7_END} push={0.03}>
        <Device pose={pose} blur={wp.blur} glow="rgba(80,110,255,0.14)">
          {shot === 0 && <SearchScreen f={f} n={(f - a0 - 6) / 9} scroll={lerp(0, 120, r01(f, w("obositor", 3), c2))} />}
          {shot === 1 && <CallScreen f={f} name="Electrician NON-STOP" status={f > c2 + 10 ? "Apel nereușit" : "Se apelează…"} failed={clamp01((f - c2 - 10) / 4)} />}
          {shot === 2 && (
            <MessagesScreen
              f={f}
              name="Meseriași Rapid"
              bubbles={[
                { t: "Bună! Cât ar costa o priză?", me: true, at: c3 + 1 },
                { t: "500 + deplasarea", at: c3 + 6 },
                { t: "E cam mult…", me: true, at: c3 + 13 },
                { t: "Ultimul preț 450. Doar cash.", at: c3 + 20 },
              ]}
            />
          )}
        </Device>
        <Headline lines={lines} y={190} gap={0.1} out={S7_END - 7} />
      </Rig>
      <CutFlash at={c2} a={0.15} />
      <CutFlash at={c3} a={0.15} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 8 · the advance, sent — and the number that stops existing
export const A8: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S7_END;
  const bank = w("rogi", 5) - 6, back = w("rogi", 8) - 4, gone = w("rogi", 11) - 2;
  const shot = f < bank ? 0 : f < back ? 1 : 2;
  const wp = whip(f, [bank, back], 30);
  const glitch = f >= gone && f < gone + 10 ? (Math.floor(f / 2) % 2 ? 1 : -1) * (1 - (f - gone) / 10) : 0;
  const zoom = r01(f, gone + 2, gone + 18);
  const pose = addPose(drift(f), { ry: wp.ry * (1 - zoom) - 6 * zoom, x: wp.x + glitch * 12 - 40 * zoom, y: -330 * zoom, s: 1.0 + 0.42 * zoom });
  const R = vo("rogi");
  const lines: Line[] = [
    { w: R.slice(0, 4), size: 92 },
    { w: R.slice(4, 9), size: 92 },
    { w: R.slice(9), size: 92, hi: { 2: RED } },
  ];
  const scam = "Meșter Ionel";
  return (
    <AbsoluteFill>
      <DarkStage hue={f >= gone ? "255,59,48" : "60,120,255"} glow={f >= gone ? 0.22 : 0.16} />
      <Rig from={a0} to={A10_END} push={0.035}>
        <Device pose={pose} blur={wp.blur} glow={f >= gone ? "rgba(255,59,48,0.24)" : "rgba(80,110,255,0.14)"}>
          {shot === 0 && <MessagesScreen f={f} name={scam} bubbles={[{ t: "Pot veni mâine dimineață.", at: a0 + 2 }, { t: "Trimite-mi un avans de 400 lei pentru piese.", at: a0 + 12 }, { t: "Ok, ți-l trimit acum.", me: true, at: a0 + 22 }]} />}
          {shot === 1 && <BankScreen f={f} sent={r01(f, bank + 8, bank + 18)} to={scam} amount="400 lei" />}
          {shot === 2 && (
            <MessagesScreen
              f={f}
              name={scam}
              bubbles={[
                { t: "Trimite-mi un avans de 400 lei pentru piese.", at: 0 },
                { t: "Ok, ți-l trimit acum.", me: true, at: 0 },
                { t: "Gata, ți-am trimis. Vii mâine?", me: true, at: back + 2 },
                { t: "Alo?", me: true, at: back + 16 },
              ]}
              status="Nelivrat"
              statusAt={gone}
              blocked={r01(f, gone + 4, gone + 14)}
            />
          )}
          {glitch !== 0 && <div style={{ position: "absolute", inset: 0, background: "rgba(255,59,48,0.25)", mixBlendMode: "screen", transform: `translateX(${glitch * 8}px)` }} />}
        </Device>
        <Headline lines={lines} y={290} gap={0.1} />
      </Rig>
      <CutFlash at={bank} a={0.15} />
      <CutFlash at={back} a={0.15} />
      <AbsoluteFill style={{ background: "#000", opacity: r01(f, A10_END - 6, A10_END) }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 9 · over the start of the charge: his thumb on the Handly icon, and the camera dives into it
export const A9: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const tap = from + 9;
  const inP = outExpo(clamp01((f - from) / 8));
  const dive = r01(f, tap + 2, tap + 16, (u) => u * u * u);
  // dive toward the icon: scale up the whole phone around the icon's spot
  const sx = 960 - 215 + 15 + HANDLY_ICON.x, sy = 540 - 442 + 15 + HANDLY_ICON.y;
  if (f > tap + 18) return null;
  return (
    <AbsoluteFill style={{ opacity: 1 - r01(f, tap + 12, tap + 18, (u) => u) }}>
      <DarkStage hue="0,191,99" glow={0.25} x={50} />
      <AbsoluteFill style={{ transform: `scale(${1 + 9 * dive})`, transformOrigin: `${sx}px ${sy}px` }}>
        <Device pose={{ x: 960, y: 540 + (1 - inP) * 60, s: 1, rx: 0, ry: 0, rz: 0 }} glow="rgba(0,191,99,0.25)">
          <HomeScreen f={f} glow={clamp01((f - from) / 6)} press={Math.sin(Math.PI * clamp01((f - tap + 3) / 8))} others={1 - dive} />
          <Touch x={HANDLY_ICON.x} y={HANDLY_ICON.y} at={tap} f={f} />
        </Device>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,191,99,${dive}) 0%, rgba(0,60,30,${dive}) 40%, rgba(0,0,0,${dive * 0.8}) 80%)` }} />
    </AbsoluteFill>
  );
};

