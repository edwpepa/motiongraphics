import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Avatar, Person } from "../../explainer/components/Avatar";
import { AppScreen } from "../../explainer/components/AppScreen";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { ChatScreen, OffersScreen, PayScreen, TrackScreen, Verified } from "../tv/handly";
import { Sym } from "../tv/ios";
import { Device, Pose, mixPose } from "../tv/kit";
import { DarkBg, GREEN, io3, outExpo, Sparkle, spring } from "../tv3d/kit3d";
import { B_END, GATA, PHONE_IN, SWOOSH, V, pEnd } from "./marks";
import { RefLine } from "./type";
import { Card, CheckCircle, Cursor, PillBtn, ProgressBar, RefBg, Shards, Stack } from "./ui";

const MUTE = "#7c8481";
const RED = "#ff453a";

// ------------------------------------------------------------------ the phone's one continuous move through the app (it only lives here, while the app is shown)
const T_OFFERS = V("taskeri", 0) - 6;
const T_PICK = V("alegi", 1);
const T_CHAT = V("alegi", 5) - 6;
const T_PAY = V("alegi", 11) - 8;
const T_CASH = V("cash", 0) - 4;
const T_TRACK = V("urmaresti", 0) - 8;
const idle = (f: number, x: number, s = 0.98): Pose => ({ x: x + Math.sin(f / 97) * 10, y: 548 + Math.sin(f / 61) * 8, s: s * (1 + 0.012 * Math.sin(f / 73)), rx: 4 + 2.5 * Math.sin(f / 83), ry: (x < 960 ? 14 : x > 960 ? -14 : 0) + 6 * Math.sin(f / 71), rz: 1.2 * Math.sin(f / 113) });
const poseAt = (f: number): Pose => {
  const enter = spring(clamp01((f - PHONE_IN) / 28));
  let p = idle(f, 800);
  p = mixPose(p, idle(f, 640), io3(clamp01((f - T_OFFERS + 4) / 18)));
  p = mixPose(p, idle(f, 960, 1.02), io3(clamp01((f - T_TRACK) / 16)));
  p = { ...p, y: p.y + (1 - enter) * 900, rx: p.rx + (1 - enter) * 40, ry: p.ry + (1 - enter) * -26, rz: p.rz + (1 - enter) * -12 };
  // the whip out: a fast turn to the left, the green swoosh follows
  const wv = clamp01((f - SWOOSH) / 10);
  if (wv > 0) p = { ...p, x: p.x - 1500 * wv * wv, ry: p.ry - 80 * wv, rz: p.rz - 16 * wv, s: p.s * (1 + 0.3 * wv) };
  return p;
};

const appState = (f: number) => {
  const t0 = V("postezi", 0) + 2;
  const pressAt = V("postezi", 9) - 12;
  return {
    typed: clamp01((f - t0) / 22) * 15,
    caret: Math.floor(f / 8) % 2 === 0,
    focus: clamp01((f - (t0 - 6)) / 6),
    category: clamp01((f - (t0 + 26)) / 8),
    press: clamp01((f - pressAt) / 10),
    loading: clamp01((f - pressAt - 4) / 10),
    success: f > pressAt + 12 ? 1 : 0,
    check: clamp01((f - pressAt - 12) / 12),
    location: 1,
    priceSel: clamp01((f - (t0 + 34)) / 8),
    since: Math.max(0, f - pressAt - 12),
  };
};

type O = { p: Person; name: string; rating: string; reviews: number; dist: string; price: string; at: number };
const OFFERS: O[] = [
  { p: "mihai", name: "Mihai D.", rating: "4,9", reviews: 312, dist: "1,2 km", price: "150 lei", at: V("taskeri", 1) },
  { p: "andrei", name: "Andrei P.", rating: "4,8", reviews: 187, dist: "2,4 km", price: "170 lei", at: V("taskeri", 4) },
  { p: "radu", name: "Radu S.", rating: "5,0", reviews: 96, dist: "3,1 km", price: "160 lei", at: V("taskeri", 7) - 4 },
];
const SCREEN: [number, number] = [640, 560];

const OfferCard: React.FC<{ o: O; sel?: number }> = ({ o, sel = 0 }) => (
  <Card w={560} r={28} pad={20} style={{ display: "flex", alignItems: "center", gap: 18, boxShadow: sel > 0 ? `0 0 0 ${4 * sel}px ${GREEN}, 0 30px 70px rgba(0,120,60,${0.25 * sel})` : undefined }}>
    <Avatar person={o.p} size={86} dark={false} ring="#fff" />
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 27, fontWeight: 600, letterSpacing: "-0.02em" }}>
        {o.name} <Verified size={24} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 19, fontWeight: 500, color: MUTE }}>
        <Sym n="star" size={18} color="#ffb800" fill="#ffb800" w={1} /> {o.rating} ({o.reviews}) · {o.dist}
      </div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: GREEN, letterSpacing: "-0.02em" }}>{o.price}</div>
      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, padding: "6px 14px", borderRadius: 99, background: sel > 0.5 ? GREEN : "#eef2ef", color: sel > 0.5 ? "#fff" : "#1d2321" }}>{sel > 0.5 ? "Ales" : "Vezi"}</div>
    </div>
  </Card>
);

const Bubble: React.FC<{ t: string; me?: boolean }> = ({ t, me }) => (
  <div style={{ maxWidth: 520, padding: "20px 26px", borderRadius: 30, borderBottomLeftRadius: me ? 30 : 8, borderBottomRightRadius: me ? 8 : 30, background: me ? `linear-gradient(135deg, #12cd74 0%, ${GREEN} 100%)` : "#fff", color: me ? "#fff" : "#141816", fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 500, letterSpacing: "-0.01em", boxShadow: me ? "0 20px 40px rgba(0,191,99,0.3)" : "0 20px 50px rgba(20,40,32,0.1)", display: "flex", alignItems: "center", gap: 14 }}>
    {!me && <Avatar person="mihai" size={44} dark={false} ring="#fff" />}
    {t}
  </div>
);

/** the whole app walk-through, one phone, the UI flying out of the glass */
export const AppShot: React.FC = () => {
  const f = useCurrentFrame();
  if (f < PHONE_IN - 2 || f > SWOOSH + 12) return null;
  const pose = poseAt(f);
  const s = appState(f);
  const pressAt = V("postezi", 9) - 12;
  const cashCut = clamp01((f - V("cash", 1)) / 8);
  return (
    <AbsoluteFill>
      <Device pose={pose} dark={false} glow="rgba(0,191,99,0.10)">
        <Stack
          screens={[
            { at: 0, node: <AppScreen s={s} text="Montez un dulap" placeholder="ex: Montez un dulap" cats={[["hammer", "Montaj"], ["wrench", "Reparații"], ["roller", "Zugrăveli"]]} /> },
            { at: T_OFFERS, node: <OffersScreen f={f} offers={OFFERS.map((o) => ({ ...o, at: o.at - 8 }))} pick={0} pickAt={T_PICK} /> },
            { at: T_CHAT, node: <ChatScreen f={f} msgs={[{ t: "Bună! Pot veni mâine la 10.", at: V("alegi", 5) }, { t: "Perfect, te aștept!", me: true, at: V("alegi", 8) }]} /> },
            { at: T_PAY, node: <PayScreen f={f} scan={clamp01((f - (V("alegi", 13) - 4)) / 10)} paid={clamp01((f - (V("alegi", 14) + 2)) / 14)} cashX={cashCut} /> },
            { at: T_TRACK, node: <TrackScreen f={f} t={clamp01((f - T_TRACK) / 60)} step={f > T_TRACK + 30 ? 2 : 1} done={0} /> },
          ]}
        />
      </Device>

      {/* 1 · posting: under a minute */}
      <Pop at={V("postezi", 4) - 2} from={[820, 520]} to={[1360, 420]} out={T_OFFERS - 4}>
        <Card w={430} r={28} pad={22} style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 74, height: 74, borderRadius: 37, position: "relative", background: "#eefaf3" }}>
            <svg width={74} height={74} viewBox="0 0 74 74" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx={37} cy={37} r={31} fill="none" stroke="#dff3e8" strokeWidth={7} />
              <circle cx={37} cy={37} r={31} fill="none" stroke={GREEN} strokeWidth={7} strokeLinecap="round" strokeDasharray={195} strokeDashoffset={195 * (1 - 0.8 * clamp01((f - V("postezi", 4)) / 30))} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Sym n="timer" size={30} color={GREEN} w={2.4} /></div>
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 500, color: MUTE }}>Timp de postare</div>
            <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>0:{String(Math.min(48, Math.round(48 * clamp01((f - V("postezi", 4)) / 30)))).padStart(2, "0")}</div>
          </div>
        </Card>
      </Pop>
      <Pop at={pressAt + 12} from={[820, 760]} to={[1350, 640]} out={T_OFFERS - 4} tilt={-6}>
        <Card w={360} r={26} pad={20} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 27, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${spring(clamp01((f - pressAt - 12) / 16))})` }}><Sym n="check" size={30} color="#fff" w={3.2} /></div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Task postat</div>
        </Card>
      </Pop>

      {/* 2 · offers from verified taskers nearby */}
      {OFFERS.map((o, i) => {
        const sel = clamp01((f - T_PICK) / 8);
        const out = i === 0 ? T_CHAT - 6 : T_PICK + 6;
        return (
          <Pop key={i} at={o.at} from={[SCREEN[0], 470 + i * 118]} to={[1300, 330 + i * 200]} out={out} tilt={-8}>
            <div style={{ transform: i === 0 ? `scale(${1 + 0.06 * spring(sel)})` : undefined }}>
              <OfferCard o={o} sel={i === 0 ? sel : 0} />
            </div>
          </Pop>
        );
      })}
      <Pop at={V("taskeri", 3) - 4} from={[640, 330]} to={[1060, 180]} out={T_PICK + 4}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: 99, background: "#fff", boxShadow: "0 16px 40px rgba(20,40,32,0.1)", fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 600 }}>
          <Sym n="pin" size={24} color={GREEN} w={2.4} /> Lângă tine · 3 taskeri
        </div>
      </Pop>
      <Cursor keys={[{ f: T_PICK - 22, x: 1700, y: 960 }, { f: T_PICK - 3, x: 1450, y: 350 }, { f: T_PICK + 18, x: 1560, y: 520 }]} clicks={[T_PICK]} hideAt={T_PICK + 12} />

      {/* 3 · talk in the app */}
      <Pop at={V("alegi", 5)} from={[640, 400]} to={[1290, 400]} out={T_PAY - 4}>
        <Bubble t="Bună! Pot veni mâine la 10." />
      </Pop>
      <Pop at={V("alegi", 8)} from={[640, 500]} to={[1380, 560]} out={T_PAY - 4}>
        <Bubble t="Perfect, te aștept!" me />
      </Pop>

      {/* 4 · pay safely */}
      <Pop at={T_PAY + 4} from={[640, 420]} to={[1320, 470]} out={T_CASH + 2}>
        <Card w={500} r={30} pad={26}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 600, color: GREEN }}>
            <Sym n="shield" size={28} color={GREEN} fill="rgba(0,191,99,0.15)" w={2.2} /> Plată protejată
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 16 }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: MUTE }}>Montaj dulap</span>
            <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>150 lei</span>
          </div>
          <div style={{ marginTop: 20 }}>
            <PillBtn label={f > V("alegi", 14) + 2 ? "Plătit" : "Plătește"} icon={f > V("alegi", 14) + 2 ? "check" : "lock"} w={448} h={70} size={24} press={f >= V("alegi", 14) - 3 && f <= V("alegi", 14) + 5 ? Math.sin((Math.PI * (f - V("alegi", 14) + 3)) / 8) : 0} on={clamp01((f - V("alegi", 14)) / 6)} />
          </div>
        </Card>
      </Pop>
      <Cursor keys={[{ f: T_PAY + 10, x: 1750, y: 940 }, { f: V("alegi", 14) - 3, x: 1340, y: 600 }, { f: T_CASH, x: 1420, y: 760 }]} clicks={[V("alegi", 14)]} hideAt={T_CASH - 6} />

      {/* 5 · no cash that vanishes */}
      <Cash />

      {/* 6 · live */}
      <Pop at={V("urmaresti", 2) - 2} from={[960, 420]} to={[1420, 300]} out={SWOOSH - 2}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderRadius: 99, background: "#fff", boxShadow: "0 16px 40px rgba(20,40,32,0.12)", fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 600 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: RED, boxShadow: `0 0 0 ${4 + 3 * Math.sin(f / 4)}px rgba(255,69,58,0.2)` }} /> LIVE · Mihai ajunge în 4 min
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

// a local copy of the pop-out, so this file reads on its own
const Pop: React.FC<{ at: number; from: [number, number]; to: [number, number]; out?: number; children: React.ReactNode; tilt?: number }> = ({ at, from, to, out, children, tilt = 0 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const e = outExpo(clamp01((f - at) / 18));
  const s = spring(clamp01((f - at) / 24));
  let op = clamp01((f - at) / 4), blur = 0, sc = (0.35 + 0.65 * s) * 1.3;
  if (out !== undefined && f >= out) {
    const u = clamp01((f - out) / 8);
    blur = 14 * u;
    op *= 1 - u;
    sc *= 1 + 0.05 * u;
    if (op <= 0.003) return null;
  }
  return (
    <div style={{ position: "absolute", left: lerp(from[0], to[0], e), top: lerp(from[1], to[1], e) + Math.sin((f - at) / 23) * 6, transform: `translate(-50%, -50%) scale(${sc}) rotate(${(1 - e) * tilt}deg)`, opacity: op, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
};

/** banknotes that are crossed out, then crumble away */
const Cash: React.FC = () => {
  const f = useCurrentFrame();
  const at = V("cash", 0) - 4;
  if (f < at || f > V("urmaresti", 0)) return null;
  const e = spring(clamp01((f - at) / 22));
  const strike = io3(clamp01((f - V("cash", 1)) / 8));
  const crumble = clamp01((f - V("cash", 3)) / 22);
  return (
    <div style={{ position: "absolute", left: 1320 - 230, top: 540 - 140 + (1 - e) * 120, width: 460, height: 280, opacity: clamp01((f - at) / 4) }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 30 + i * 16, top: 40 - i * 12, width: 380, height: 190, borderRadius: 16, transform: `rotate(${-8 + i * 6}deg) translate(${crumble * crumble * (300 + i * 80)}px, ${-crumble * 90 * (i - 1)}px)`, opacity: 1 - crumble, filter: crumble > 0 ? `blur(${crumble * 10}px)` : undefined, background: "linear-gradient(135deg, #cfe9d6 0%, #a9d7b7 100%)", boxShadow: "0 18px 40px rgba(20,60,40,0.18), inset 0 0 0 6px rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", boxSizing: "border-box", fontFamily: "Inter, sans-serif" }}>
          <div style={{ width: 92, height: 92, borderRadius: 46, border: "4px solid rgba(40,110,70,0.35)" }} />
          <div style={{ fontSize: 64, fontWeight: 700, color: "rgba(30,100,60,0.55)", letterSpacing: "-0.03em" }}>100</div>
        </div>
      ))}
      {/* the notes crumble into specks that blow away */}
      {crumble > 0 &&
        Array.from({ length: 34 }, (_, i) => {
          const sx = 60 + seeded(i, 3) * 360, sy = 60 + seeded(i, 4) * 170;
          const d = crumble * (200 + seeded(i, 5) * 500);
          return <div key={i} style={{ position: "absolute", left: sx + d, top: sy - d * (0.2 + seeded(i, 6) * 0.5), width: 6 + seeded(i, 7) * 10, height: 6 + seeded(i, 7) * 10, borderRadius: 3, background: "#b6dcc2", opacity: (1 - crumble) * 1.2, transform: `rotate(${crumble * 300 * seeded(i, 8)}deg)` }} />;
        })}
      <svg width={460} height={280} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - crumble }}>
        <path d="M30 240 L430 40" stroke={RED} strokeWidth={14} strokeLinecap="round" strokeDasharray={450} strokeDashoffset={450 * (1 - strike)} />
      </svg>
    </div>
  );
};

// ------------------------------------------------------------------ the swoosh that becomes the progress bar, then "Gata" ✓ + confetti
export const Track: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SWOOSH - 2) return null;
  const sw = clamp01((f - SWOOSH) / 12);
  const fill = io3(clamp01((f - (SWOOSH + 8)) / (GATA - SWOOSH - 10)));
  const pct = Math.round(lerp(38, 100, fill));
  const gone = clamp01((f - GATA) / 4);
  // the swoosh: a thick green ribbon sweeping in from the left that narrows into the bar
  const th = lerp(560, 92, outExpo(sw));
  const len = lerp(200, 1500, outExpo(sw));
  return (
    <AbsoluteFill>
      {f < GATA + 4 && (
        <AbsoluteFill style={{ opacity: 1 - gone }}>
          {sw < 1 && <div style={{ position: "absolute", left: -60 - (1 - sw) * 600, top: 600 - th / 2, width: len + 200, height: th, borderRadius: th / 2, background: `linear-gradient(90deg, rgba(0,191,99,0) 0%, #4fdc98 30%, ${GREEN} 70%, #63e7ad 100%)`, filter: `blur(${(1 - sw) * 18}px)`, opacity: 0.9 }} />}
          {sw > 0.6 && (
            <>
              <ProgressBar x={-60} y={600} w={1770} h={92} p={lerp(0.38, 1, fill)} />
              <div style={{ position: "absolute", right: 1920 - 1710, top: 340, fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 150, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "baseline" }}>
                <span style={{ backgroundImage: `linear-gradient(90deg, #00ae59 0%, #4ade9a 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{pct}</span>
                <span style={{ color: "#cfd5d2" }}>/100</span>
              </div>
            </>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const Done: React.FC = () => {
  const f = useCurrentFrame();
  if (f < GATA) return null;
  const t = clamp01((f - GATA) / 22);
  const fade = clamp01((f - (pEnd("fara2") + 8)) / 40);
  return (
    <AbsoluteFill>
      <RefLine size={92} y={400} words={[{ t: "Gata", at: GATA, acc: true }]} out={V("fara1", 0) - 6} exit="blur" drift={-0.02} />
      <RefLine
        size={80}
        y={400}
        words={[
          { t: "Fără", at: V("fara1", 0) },
          { t: "bătaie", at: V("fara1", 1), acc: true },
          { t: "de", at: V("fara1", 2), acc: true },
          { t: "cap.", at: V("fara1", 3), acc: true },
          { t: "Fără", at: V("fara2", 0) },
          { t: "stres.", at: V("fara2", 1), acc: true },
        ]}
        out={pEnd("fara2") + 10}
        exit="blur"
        exitLen={22}
        drift={0.015}
      />
      <div style={{ position: "absolute", left: 960 - 85, top: 640 - 85 - 40 * io3(fade), transform: `scale(${1 + 0.25 * io3(fade)})`, opacity: 1 - io3(clamp01((io3(clamp01((f - (pEnd("fara2") + 4)) / (B_END - pEnd("fara2") + 2))) - 0.8) / 0.17)), filter: `blur(${8 * clamp01((io3(clamp01((f - (pEnd("fara2") + 4)) / (B_END - pEnd("fara2") + 2))) - 0.8) / 0.17)}px)` }}>
        <CheckCircle size={170} t={t} glow={io3(fade)} />
      </div>
      <Shards at={GATA} x={960} y={600} n={44} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the bridge: the light dims to night, very slowly, around the glowing check
export const Bridge: React.FC = () => {
  const f = useCurrentFrame();
  const from = pEnd("fara2") + 4;
  const t = io3(clamp01((f - from) / (B_END - from + 6)));
  // a soft iris: the dark comes in from the edges and leaves the check glowing in the middle, then takes it too
  const r0 = lerp(130, -40, t), r1 = r0 + lerp(60, 30, t);
  const mask = `radial-gradient(circle at 50% 55%, rgba(0,0,0,0) ${r0}%, rgba(0,0,0,1) ${r1}%)`;
  return (
    <AbsoluteFill>
      <RefBg />
      {/* what's left of the light turns mint as the spotlight closes on the check */}
      {t > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, rgba(0,191,99,${0.22 * t}) 0%, rgba(0,191,99,${0.1 * t}) 18%, rgba(0,191,99,0) 40%)` }} />}
      {t > 0 && (
        <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
          <DarkBg glow={0.6 + 0.4 * t} />
        </AbsoluteFill>
      )}
      {t > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${(600 - 40 * t) / 10.8}%, rgba(0,191,99,${0.3 * Math.sin(Math.PI * t)}) 0%, rgba(0,191,99,0) ${14 + 26 * t}%)` }} />}
      {t > 0.2 && [0, 1, 2].map((i) => <Sparkle key={i} x={960 + (i - 1) * 220 + Math.sin(f / 30 + i) * 20} y={520 - i * 40 - (f - from) * 0.8} size={12 + i * 4} t={1} rot={f * 2} opacity={Math.sin(Math.PI * t) * 0.8} color="#9ff2c4" color2="#ffffff" />)}
    </AbsoluteFill>
  );
};
