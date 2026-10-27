import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppScreen } from "../../explainer/components/AppScreen";
import { clamp01, ease, lerp } from "../../explainer/lib/anim";
import { FONT } from "../../explainer/theme";
import { B1, B8 } from "../act2";
import { Explosion } from "../fx";
import { Win } from "../kit";
import { B1_END, B2_END, B3_END, B4_END, B5_END, B6_END, B7_END } from "../scenes";
import { BRIDGE, DROP, F, w } from "../timeline";
import { OUTFIT } from "./font";
import { ChatScreen, OffersScreen, PayScreen, ProfileScreen, TrackScreen } from "./handly";
import { HomeBar, Notif, StatusBar, SW, Sym } from "./ios";
import { addPose, cap, CutFlash, Device, drift, GREEN, GREY, Headline, INK, Line, LightStage, outExpo, r01, Rig, vo } from "./kit";

// ------------------------------------------------------------------ act II: the same night's problem, solved in the Handly app
const D0 = F(DROP);
const G_TXT = "#00a852";
const dimTo = (f: number, at: number) => `rgba(29,29,31,${lerp(1, 0.28, r01(f, at, at + 10))})`;
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
  return <div style={{ position: "absolute", left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26, background: `rgba(20,24,22,${0.22 * down})`, border: `2px solid rgba(255,255,255,${0.7 * down})`, transform: `scale(${0.8 + 0.3 * down})`, zIndex: 20 }} />;
};

// ------------------------------------------------------------------ 1 · post it in under a minute
export const E2: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B1_END;
  const enter = outExpo(clamp01((f - b0) / 22));
  const TYPE = b0 + 8, CAT = TYPE + 26, PRESS = w("postezi", 7) - 4, SUCC = w("postezi", 9) - 4;
  const text = "Priză stricată în bucătărie";
  const app = {
    typed: clamp01((f - TYPE) / 22) * text.length,
    caret: Math.floor(f / 7) % 2 === 0 || (f > TYPE && f < TYPE + 24),
    focus: clamp01((f - (TYPE - 4)) / 4) * (1 - clamp01((f - CAT) / 4)),
    category: ease.outCubic(clamp01((f - CAT) / 6)),
    location: clamp01((f - (CAT + 6)) / 14),
    priceSel: ease.outCubic(clamp01((f - (CAT + 16)) / 8)),
    press: clamp01((f - PRESS) / 9),
    loading: clamp01((f - (PRESS + 3)) / 8),
    success: ease.outCubic(clamp01((f - SUCC) / 8)),
    check: clamp01((f - (SUCC + 4)) / 12),
    since: f - SUCC,
  };
  const secs = Math.round(52 * r01(f, TYPE, SUCC, (u) => u));
  const done = r01(f, SUCC, SUCC + 8);
  const pose = addPose(drift(f), { y: (1 - enter) * 600, rx: (1 - enter) * 24, ry: (1 - enter) * -20 });
  const L = vo("postezi");
  const lines: Line[] = [
    { w: L.slice(0, 4), size: 84, color: INK },
    { w: L.slice(4), size: 84, color: INK, hi: { 4: G_TXT, 5: G_TXT } },
  ];
  return (
    <AbsoluteFill>
      <LightStage />
      <Rig from={b0} to={B2_END} push={0.03}>
        <Device pose={pose} dark={false}>
          <AppScreen s={app} text={text} placeholder="ex: Priză stricată" cats={[[<Sym key="z" n="zap" size={16} w={2.4} />, "Electrice"], [<Sym key="d" n="drop" size={16} w={2.4} />, "Instalații"], [<Sym key="b" n="box" size={16} w={2.4} />, "Montaj"]]} />
          <Touch x={200} y={773} at={PRESS} f={f} />
        </Device>
        <Headline lines={lines} y={270} gap={0.1} out={B2_END - 7} />
        {/* the clock that never gets to a minute */}
        <div style={{ position: "absolute", left: 120, top: 560, display: "flex", alignItems: "center", gap: 22, opacity: clamp01((f - TYPE) / 8) * (1 - r01(f, B2_END - 8, B2_END - 2)), fontFamily: OUTFIT }}>
          <svg width={110} height={110} viewBox="0 0 110 110">
            <circle cx={55} cy={55} r={48} fill="none" stroke="#e3e6e4" strokeWidth={8} />
            <circle cx={55} cy={55} r={48} fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${(secs / 60) * 1} 1`} transform="rotate(-90 55 55)" />
            {done > 0 && <path d="M35 56 L49 70 L76 42" fill="none" stroke={GREEN} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - done} />}
          </svg>
          <div style={{ fontSize: 110, fontWeight: 600, letterSpacing: "-0.04em", color: done > 0.5 ? G_TXT : INK, fontVariantNumeric: "tabular-nums" }}>0:{String(secs).padStart(2, "0")}</div>
        </div>
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2 · verified taskers nearby send offers
const OFFERS = [
  { p: "mihai" as const, name: "Mihai D.", rating: "4,9", reviews: 312, dist: "1,2 km", price: "150 lei" },
  { p: "radu" as const, name: "Radu S.", rating: "4,8", reviews: 187, dist: "2,4 km", price: "170 lei" },
  { p: "andrei" as const, name: "Andrei P.", rating: "4,7", reviews: 96, dist: "3,1 km", price: "160 lei" },
];
export const E3: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B2_END;
  const ats = [w("taskeri", 1) - 2, w("taskeri", 4) - 4, w("taskeri", 6) - 4];
  const offers = OFFERS.map((o, i) => ({ ...o, at: ats[i] }));
  const pose = addPose(drift(f), { s: lerp(1.0, 1.12, r01(f, b0, B3_END, (u) => u)), y: 20 });
  const L = vo("taskeri");
  const lines: Line[] = [
    { w: L.slice(0, 2), size: 104, color: INK, hi: { 1: G_TXT } },
    { w: L.slice(2, 5), size: 104, color: INK },
    { w: L.slice(5), size: 104, color: INK },
  ];
  return (
    <AbsoluteFill>
      <LightStage />
      <Rig from={b0} to={B3_END} push={0.03}>
        <Device pose={pose} dark={false}>
          <OffersScreen f={f} offers={offers} />
        </Device>
        <Headline lines={lines} y={330} gap={0.08} out={B3_END - 7} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3 · choose who you want, talk to him in the app, pay safely
export const E4: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B3_END;
  const s2 = w("alegi", 5) - 5, s3 = w("alegi", 11) - 5;
  const shot = f < s2 ? 0 : f < s3 ? 1 : 2;
  const wp = whip(f, [s2, s3]);
  const pose = addPose(drift(f), { ry: wp.ry, x: wp.x, s: 1.04 });
  const L = vo("alegi");
  const pick = w("alegi", 4) - 2;
  return (
    <AbsoluteFill>
      <LightStage />
      <Rig from={b0} to={B4_END} push={0.03}>
        <Device pose={pose} dark={false} blur={wp.blur}>
          {shot === 0 && <ProfileScreen f={f - b0} press={Math.sin(Math.PI * clamp01((f - pick) / 8))} />}
          {shot === 1 && (
            <ChatScreen
              f={f}
              msgs={[
                { t: "Salut! Pot veni azi la 18:00.", at: s2 + 4 },
                { t: "Perfect, te aștept!", me: true, at: s2 + 20 },
                { t: "Îmi iau sculele. Rezolvăm repede.", at: s2 + 36 },
              ]}
            />
          )}
          {shot === 2 && <PayScreen f={f} scan={r01(f, w("alegi", 12) - 4, w("alegi", 12) + 6)} paid={r01(f, w("alegi", 14) - 4, w("alegi", 14) + 12, (u) => u)} />}
          {shot === 0 && <Touch x={200} y={772} at={pick} f={f} />}
        </Device>
        <Headline lines={[{ w: L.slice(0, 2), size: 132, color: INK }, { w: L.slice(2, 5), size: 132, color: INK }]} y={330} out={s2 - 7} />
        <Headline lines={[{ w: L.slice(5, 9), size: 104, color: INK }, { w: L.slice(9, 11), size: 104, color: INK, hi: { 1: G_TXT } }]} y={350} out={s3 - 7} />
        <Headline lines={[{ w: L.slice(11, 13), size: 132, color: INK }, { w: L.slice(13), size: 132, color: INK, hi: { 1: G_TXT } }]} y={330} out={B4_END - 7} />
      </Rig>
      <CutFlash at={s2} a={0.3} />
      <CutFlash at={s3} a={0.3} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4 · no cash that vanishes
export const E5: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B4_END;
  const x = r01(f, w("cash", 1) - 2, w("cash", 1) + 10);
  const zoom = r01(f, b0, b0 + 30);
  const pose = addPose(drift(f), { s: lerp(1.0, 1.4, zoom), y: lerp(0, -90, zoom), x: -20 * zoom });
  const L = vo("cash");
  return (
    <AbsoluteFill>
      <LightStage />
      <Rig from={b0} to={B5_END} push={0.03}>
        <Device pose={pose} dark={false}>
          <PayScreen f={f} scan={0} paid={0} cashX={x} />
        </Device>
        <Headline lines={[{ w: cap(L.slice(0, 2)), size: 176, color: INK, hi: { 1: "#e8463a" } }, { w: L.slice(2), size: 60, color: GREY }]} y={360} out={B5_END - 7} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · track it live, until it's done
export const E6: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B5_END;
  const t = r01(f, b0 + 4, w("urmaresti", 5), (u) => u);
  const step = f >= w("urmaresti", 8) - 2 ? 4 : f >= w("urmaresti", 6) - 2 ? 3 : t >= 1 ? 2 : 1;
  const done = r01(f, w("urmaresti", 8) - 2, w("urmaresti", 8) + 14, (u) => u);
  const pose = addPose(drift(f), { s: 1.04 });
  const L = vo("urmaresti");
  const lines: Line[] = [
    { w: L.slice(0, 2), size: 104, color: INK },
    { w: L.slice(2, 5), size: 104, color: INK, hi: { 1: G_TXT, 2: G_TXT } },
    { w: L.slice(5), size: 104, color: INK, hi: { 3: G_TXT } },
  ];
  return (
    <AbsoluteFill>
      <LightStage />
      <Rig from={b0} to={B6_END} push={0.03}>
        <Device pose={pose} dark={false}>
          <TrackScreen f={f} t={t} step={step} done={done} />
        </Device>
        <Headline lines={lines} y={330} gap={0.08} out={B6_END - 7} />
      </Rig>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6 · no hassle, no stress — the evening he gets back
const DayLock: React.FC<{ f: number; children?: React.ReactNode }> = ({ f, children }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #e9f7ef 0%, #bfe8d2 55%, #7fd1a8 100%)" }} />
    <div style={{ position: "absolute", left: -100 + Math.sin(f / 80) * 20, top: 420, width: 600, height: 420, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)", filter: "blur(20px)" }} />
    <StatusBar time="" />
    <div style={{ position: "absolute", top: 84, width: SW, textAlign: "center", fontSize: 21, fontWeight: 600, color: "#1d3a2c" }}>Luni, 27 octombrie</div>
    <div style={{ position: "absolute", top: 106, width: SW, textAlign: "center", fontSize: 112, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#0e2a1d" }}>18:42</div>
    {children}
    <HomeBar />
  </div>
);
export const E7: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B6_END;
  const cut = w("fara2", 0) - 4;
  const settle = r01(f, b0, B7_END, (u) => 1 - (1 - u) ** 3);
  const base = drift(f);
  const pose = { ...base, ry: lerp(base.ry, -4, settle), rx: lerp(base.rx, 2, settle), s: lerp(1.12, 1.2, settle) };
  const n = outExpo(clamp01((f - b0 - 4) / 12));
  const A = vo("fara1"), B = vo("fara2");
  return (
    <AbsoluteFill>
      <LightStage />
      <Rig from={b0} to={B7_END} push={0.05}>
        <Device pose={pose} dark={false}>
          <DayLock f={f}>
            <Notif k="handly" app="Handly" title="Mihai a terminat lucrarea" body="Priza funcționează. Plata a fost eliberată." dark={false} style={{ top: 300 - (1 - n) * 60, opacity: n }} />
            <Notif k="reminders" app="Mementouri" title="Repară priza din bucătărie" body="Finalizat ✓" dark={false} style={{ top: 400 - (1 - n) * 60, opacity: clamp01((f - b0 - 12) / 8) }} />
          </DayLock>
        </Device>
        <Headline lines={[{ w: A.slice(0, 2), size: 132, color: INK }, { w: A.slice(2), size: 132, color: INK }]} y={340} out={cut - 6} />
        <Headline lines={[{ w: B, size: 190, color: INK, hi: { 1: G_TXT } }]} y={420} />
      </Rig>
    </AbsoluteFill>
  );
};

/** act II for TV: the kept drop, the new phone scenes, the kept beat montage */
export const ACT2TV: React.FC = () => (
  <>
    <Win from={D0} to={B1_END}>
      <B1 />
      <Explosion at={D0} cx={960} cy={570} />
    </Win>
    <Win still from={B1_END} to={B2_END}><E2 /></Win>
    <Win still from={B2_END} to={B3_END}><E3 /></Win>
    <Win still from={B3_END} to={B4_END}><E4 /></Win>
    <Win still from={B4_END} to={B5_END}><E5 /></Win>
    <Win still from={B5_END} to={B6_END}><E6 /></Win>
    <Win still from={B6_END} to={B7_END}><E7 /></Win>
    <Win from={B7_END} to={BRIDGE}><B8 /></Win>
  </>
);
