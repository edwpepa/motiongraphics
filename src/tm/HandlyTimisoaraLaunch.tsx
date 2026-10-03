import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { AppScreen, TASK_TEXT } from "../explainer/components/AppScreen";
import { Avatar, Person } from "../explainer/components/Avatar";
import { Glyph } from "../explainer/components/Icons";
import { Phone } from "../explainer/components/Phone";
import { StoreBadge } from "../explainer/components/StoreBadge";
import { useExplainerFonts } from "../explainer/fonts";
import { clamp01, ease, lerp, seeded } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { Explosion, ServiceName, ServiceTile, Vortex, absorbed } from "../launch/fx";
import { Bg, BgKind, GREEN_INK, Label, Logo, MINT_INK, P, Txt, Win, Wordmark, punch } from "../launch/kit";
import { Slam } from "../launch/slam";
import { CITIES, proj, roPath } from "./art";
import { BEAT, DROP, DROP_S, FPS, TOTAL, kw, pStart, w } from "./timeline";

const CX = 960;
const CY = 540;
const GRID = { d0: DROP_S * FPS, beats: BEAT * FPS };
const HIT = Math.round((DROP_S + 40 * BEAT) * FPS); // the last hit, on "Handly."

const S1 = pStart("orice") - 8;
const S2 = pStart("s0") - 4;
const S3 = pStart("tot") - 4;
const APP = DROP + 26;
const OFF = pStart("oferte") - 4;
const S5 = pStart("alegi") - 6;
const S6 = pStart("daca") - 6;
const S7 = pStart("pornit") - 6;
const S8 = pStart("handly") - 10;

const ALL: ServiceName[] = ["droplet", "sofa", "roller", "sparkles", "leaf", "box", "dog", "plug", "wrench", "hammer"];

// ------------------------------------------------------------------ 1. Timișoara — a good news
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const pin = ease.outBack(clamp01((f - 4) / 14), 1.6);
  const ring = (f % 36) / 36;
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <div style={{ position: "absolute", left: CX, top: CY - 190, transform: `translate(-50%, -100%) translateY(${(1 - pin) * -200}px)`, opacity: clamp01(pin * 2) }}>
        <svg width={90} height={120} viewBox="0 0 90 120">
          <path d="M45 118 C 15 80, 4 60, 4 42 A 41 41 0 0 1 86 42 C 86 60, 75 80, 45 118 Z" fill={P.green} />
          <circle cx={45} cy={42} r={16} fill="#fff" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: CX - 120 * (1 + ring), top: CY - 190 - 24 * (1 + ring), width: 240 * (1 + ring), height: 48 * (1 + ring), borderRadius: "50%", border: `3px solid ${P.green}`, opacity: (1 - ring) * pin }} />
      <Txt words={kw("tm")} size={170} on="black" y={CY + 20} out={pStart("veste") - 6} />
      <Txt words={kw("veste", { color: { 2: MINT_INK, 3: MINT_INK } })} size={130} on="black" y={CY + 20} out={S1 - 4} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2. anything you need — one single place
const Needs: React.FC = () => {
  const f = useCurrentFrame();
  const suck = w("loc", 4) - 6;
  const pos = ALL.map((_, i) => ({ x: 260 + (i % 5) * 350 + (seeded(i, 1) - 0.5) * 80, y: i < 5 ? 420 : 760 + (seeded(i, 2) - 0.5) * 60 }));
  const core = ease.outBack(clamp01((f - (suck + 6)) / 14), 1.3);
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      {ALL.map((icon, i) => {
        const at = S1 + 6 + i * 4;
        const p = ease.outBack(clamp01((f - at) / 12), 1.3);
        if (p <= 0) return null;
        const t = ease.inCubic(clamp01((f - (suck + i * 1.2)) / 14));
        if (t >= 1) return null;
        const x = lerp(pos[i].x, CX, t);
        const y = lerp(pos[i].y + Math.sin(f / 14 + i) * 10, CY + 120, t);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${p * (1 - 0.7 * t)}) rotate(${(seeded(i, 3) - 0.5) * 16 * (1 - t)}deg)` }}>
            <ServiceTile name={icon} size={150} tone={i % 3 === 1 ? "white" : "green"} />
          </div>
        );
      })}
      {core > 0 && (
        <div style={{ position: "absolute", left: CX - 110, top: CY + 10, width: 220, height: 220, borderRadius: "50%", background: "#fff", boxShadow: "0 40px 80px rgba(0,60,30,0.18)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${core * punch(f, suck + 20, 0.08, 12)})` }}>
          <Logo size={150} />
        </div>
      )}
      <Txt words={kw("orice")} size={96} on="white" y={150} out={pStart("loc") - 5} />
      <Txt words={kw("loc", { cap: true, color: { 5: GREEN_INK, 6: GREEN_INK } })} size={76} on="white" y={150} out={S2 - 4} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3. the services — colour cuts
const SERV: Array<{ k: "s0" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6"; icon: ServiceName; bg: BgKind }> = [
  { k: "s0", icon: "droplet", bg: "green" },
  { k: "s1", icon: "sofa", bg: "black" },
  { k: "s2", icon: "roller", bg: "white" },
  { k: "s3", icon: "sparkles", bg: "deep" },
  { k: "s4", icon: "leaf", bg: "green" },
  { k: "s5", icon: "box", bg: "black" },
  { k: "s6", icon: "dog", bg: "white" },
];
const Services: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SERV.map((s) => pStart(s.k) - 3);
  let i = 0;
  for (let k = 0; k < cuts.length; k++) if (f >= cuts[k]) i = k;
  const s = SERV[i];
  const local = f - cuts[i];
  const pop = ease.outBack(clamp01(local / 12), 1.3);
  return (
    <AbsoluteFill>
      <Bg kind={s.bg} />
      <div style={{ position: "absolute", left: CX - 140, top: CY - 330, transform: `scale(${pop * punch(f, cuts[i], 0.06, 12)}) rotate(${(1 - pop) * -18}deg)` }}>
        <ServiceTile name={s.icon} size={280} tone={s.bg === "green" ? "white" : "green"} />
      </div>
      <Txt key={i} words={kw(s.k, { lead: 4 }).map((x) => ({ ...x, at: Math.max(x.at, cuts[i]) }))} size={i === 6 ? 120 : 150} on={s.bg} y={CY + 170} dur={10} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4. "Tot. Pe Handly." — everything into the mark, then the drop
const All: React.FC = () => {
  const f = useCurrentFrame();
  const VF = S3 + 2;
  const items = Array.from({ length: 20 }, (_, i) => ({ kind: "bubble" as const, icon: ALL[i % ALL.length], d: 70 + Math.round(seeded(i, 7) * 100), tone: (i % 3) as 0 | 1 | 2 }));
  const ab = absorbed(f, items.length, VF, 2, 26);
  const grow = ease.inOutCubic(clamp01((f - (w("pe", 1) - 10)) / 12));
  const size = (40 + 4 * ab.count) * (1 + 0.8 * grow);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <Vortex items={items} from={VF} stagger={2} travel={26} cx={CX} cy={CY + 40} radius={900} />
      <div style={{ position: "absolute", left: CX - size / 2, top: CY + 40 - size / 2, width: size, height: size, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #b9ffd6 0%, #2be38a 45%, #00a352 100%)", boxShadow: `0 0 ${60 + 3 * ab.count}px rgba(0,191,99,0.6)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {grow > 0 && <Logo size={size * 0.62 * grow} tone="white" />}
      </div>
      <Txt words={kw("tot")} size={150} on="black" y={190} out={w("pe", 0) - 4} />
      <Txt words={kw("pe", { color: { 1: MINT_INK } })} size={130} on="black" y={190} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5. post it in under a minute
const AppScene: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = APP;
  const enter = ease.outExpo(clamp01((f - b0) / 22));
  const TYPE = b0 + 6;
  const CAT = TYPE + 18;
  const PRESS = w("postezi", 9) - 8;
  const SUCC = PRESS + 10;
  const app = {
    typed: clamp01((f - TYPE) / 16) * TASK_TEXT.length,
    caret: Math.floor(f / 7) % 2 === 0 || (f > TYPE && f < TYPE + 18),
    focus: clamp01((f - (TYPE - 4)) / 4) * (1 - clamp01((f - CAT) / 4)),
    category: ease.outCubic(clamp01((f - CAT) / 6)),
    location: clamp01((f - (CAT + 6)) / 14),
    priceSel: ease.outCubic(clamp01((f - (CAT + 16)) / 8)),
    press: clamp01((f - PRESS) / 8),
    loading: clamp01((f - (PRESS + 3)) / 8),
    success: ease.outCubic(clamp01((f - SUCC) / 9)),
    check: clamp01((f - (SUCC + 4)) / 12),
    since: f - SUCC,
  };
  const secs = Math.round(lerp(0, 47, clamp01((f - TYPE) / (SUCC - TYPE))));
  const ring = clamp01((f - TYPE) / (SUCC - TYPE)) * (47 / 60);
  const done = ease.outBack(clamp01((f - SUCC) / 10));
  const outT = ease.inCubic(clamp01((f - (OFF - 7)) / 7));
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      <Txt words={kw("postezi", { only: [0, 1, 2, 3], color: { 0: GREEN_INK } })} size={84} on="white" x={130} y={CY - 56} align="left" out={OFF - 6} />
      <Txt words={kw("postezi", { only: [4, 5, 6, 7, 8, 9], color: { 8: GREEN_INK, 9: GREEN_INK } })} size={84} on="white" x={130} y={CY + 48} align="left" out={OFF - 6} />
      <div style={{ position: "absolute", left: 1340 - 215, top: CY - 442, transform: `perspective(2200px) translateY(${(1 - enter) * 700 + outT * -80}px) rotateX(${(1 - enter) * 30}deg) rotateY(${-14 + 6 * enter}deg) scale(0.86)`, opacity: 1 - outT, filter: "drop-shadow(0 50px 80px rgba(10,40,25,0.25))" }}>
        <Phone>
          <AppScreen s={app} />
        </Phone>
      </div>
      <div style={{ position: "absolute", left: 1730, top: CY - 250, transform: `translate(-50%, -50%) scale(${ease.outBack(clamp01((f - (TYPE - 6)) / 12)) * (1 - outT)})` }}>
        <div style={{ width: 230, height: 230, borderRadius: "50%", background: "#fff", boxShadow: "0 30px 60px rgba(10,40,25,0.18)", position: "relative" }}>
          <svg width={230} height={230} viewBox="-60 -60 120 120" style={{ position: "absolute", inset: 0 }}>
            <circle r={48} fill="none" stroke="#e7ece9" strokeWidth={8} />
            {ring > 0.005 && <circle r={48} fill="none" stroke={P.green} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring} 1`} transform="rotate(-90)" />}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: BOLD, fontSize: 54, color: P.ink, letterSpacing: "-0.04em", opacity: 1 - done }}>0:{String(secs).padStart(2, "0")}</div>
          {done > 0 && (
            <div style={{ position: "absolute", inset: 30, borderRadius: "50%", background: P.green, transform: `scale(${done})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Glyph name="check" size={90} color="#fff" weight={3.4} />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6. verified taskers in Timișoara send offers
const OFFERS: Array<{ p: Person; name: string; price: string; x: number; y: number }> = [
  { p: "mihai", name: "Mihai D.", price: "150 lei", x: 250, y: 230 },
  { p: "andrei", name: "Andrei P.", price: "140 lei", x: 860, y: 200 },
  { p: "radu", name: "Radu S.", price: "170 lei", x: 760, y: 590 },
];
const Offers: React.FC = () => {
  const f = useCurrentFrame();
  const plane = ease.outExpo(clamp01((f - OFF) / 24));
  const outT = ease.inCubic(clamp01((f - (S5 - 7)) / 7));
  const pinAt = (i: number) => w("oferte", 1) - 4 + i * 5;
  const MW = 1100;
  const MH = 780;
  const TILT = 50 + 10 * (1 - plane);
  const SPIN = -16 + (f - OFF) * 0.08;
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <AbsoluteFill style={{ perspective: 1900, opacity: plane * (1 - outT) }}>
        <div style={{ position: "absolute", left: 800 - MW / 2, top: 690 - MH / 2, width: MW, height: MH, transformStyle: "preserve-3d", transform: `translateY(${(1 - plane) * 260}px) rotateX(${TILT}deg) rotateZ(${SPIN}deg) scale(1.12)`, borderRadius: 56, boxShadow: "0 80px 140px rgba(0,0,0,0.6), 0 0 120px rgba(0,191,99,0.12)" }}>
          <svg width={MW} height={MH} style={{ position: "absolute", inset: 0, borderRadius: 56 }}>
            <defs>
              <radialGradient id="tmMap" cx="50%" cy="51%" r="60%">
                <stop offset="0%" stopColor="#11261d" />
                <stop offset="100%" stopColor="#0a110e" />
              </radialGradient>
              <clipPath id="tmClip">
                <rect width={MW} height={MH} rx={56} />
              </clipPath>
            </defs>
            <g clipPath="url(#tmClip)">
              <rect width={MW} height={MH} fill="url(#tmMap)" />
              <path d="M-40 420 C 220 400, 380 520, 600 470 S 920 300, 1160 360" stroke="rgba(90,170,150,0.25)" strokeWidth={46} fill="none" strokeLinecap="round" />
              {Array.from({ length: 60 }, (_, i) => (
                <rect key={i} x={(i % 10) * 112 + 16 + seeded(i, 2) * 14} y={Math.floor(i / 10) * 132 + 26 + seeded(i, 3) * 14} width={64 + seeded(i, 4) * 18} height={72 + seeded(i, 5) * 22} rx={10} fill="rgba(255,255,255,0.035)" />
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <line key={`v${i}`} x1={i * 112 + 4} y1={0} x2={i * 112 + 4} y2={MH} stroke={`rgba(255,255,255,${i % 3 === 0 ? 0.11 : 0.05})`} strokeWidth={i % 3 === 0 ? 12 : 5} />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line key={`h${i}`} x1={0} y1={i * 132 + 12} x2={MW} y2={i * 132 + 12} stroke={`rgba(255,255,255,${i % 2 === 0 ? 0.1 : 0.05})`} strokeWidth={i % 2 === 0 ? 12 : 5} />
              ))}
              <circle cx={550} cy={400} r={300} fill="rgba(0,191,99,0.07)" stroke="rgba(0,191,99,0.35)" strokeWidth={2.5} strokeDasharray="10 12" />
              {[0, 1].map((k) => {
                const r = ((f + k * 20) % 40) / 40;
                return <circle key={k} cx={550} cy={400} r={20 + 90 * r} fill="none" stroke={P.green} strokeWidth={3} opacity={(1 - r) * 0.7} />;
              })}
              <circle cx={550} cy={400} r={20} fill={P.green} stroke="#fff" strokeWidth={6} />
            </g>
          </svg>
          {OFFERS.map((o, i) => {
            const pop = ease.outBack(clamp01((f - pinAt(i)) / 12));
            if (pop <= 0) return null;
            return (
              <div key={o.p} style={{ position: "absolute", left: o.x, top: o.y, width: 0, height: 0, transformStyle: "preserve-3d" }}>
                <div style={{ position: "absolute", left: -62, top: -168, width: 124, height: 168, transformOrigin: "50% 100%", transform: `rotateZ(${-SPIN}deg) rotateX(${-TILT}deg) scale(${pop})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ position: "relative", padding: 7, borderRadius: "50%", background: "#fff", boxShadow: "0 18px 40px rgba(0,0,0,0.45), 0 0 40px rgba(0,191,99,0.35)" }}>
                    <Avatar person={o.p} size={100} ring={P.green} />
                    <div style={{ position: "absolute", right: -6, bottom: -2, width: 40, height: 40, borderRadius: 20, background: P.green, border: "4px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Glyph name="check" size={20} color="#fff" weight={3.6} />
                    </div>
                  </div>
                  <div style={{ width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "18px solid #fff", marginTop: -2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* the Timișoara chip */}
      <div style={{ position: "absolute", left: 130, top: 400, opacity: plane * (1 - outT), display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 999, background: "rgba(0,191,99,0.16)", border: "1.5px solid rgba(0,191,99,0.45)" }}>
        <Glyph name="pin" size={28} color={P.mint} weight={2.6} />
        <Label size={32} color={P.mint}>
          Timișoara
        </Label>
      </div>
      {OFFERS.map((o, i) => {
        const at = w("oferte", 7) - 6 + i * 5;
        const p = ease.outExpo(clamp01((f - at) / 16));
        if (p <= 0) return null;
        return (
          <div key={`o${i}`} style={{ position: "absolute", left: 1330, top: 330 + i * 150, width: 480, height: 124, borderRadius: 32, background: "rgba(22,28,25,0.85)", border: "1.5px solid rgba(255,255,255,0.12)", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", transform: `translateX(${(1 - p) * 600}px)`, opacity: p * (1 - outT), display: "flex", alignItems: "center", gap: 20, padding: "0 26px", fontFamily: FONT, fontWeight: BOLD }}>
            <Avatar person={o.p} size={76} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, color: "#fff", letterSpacing: "-0.03em" }}>{o.name}</div>
              <div style={{ fontSize: 22, color: "#8d9792", fontWeight: 500, marginTop: 4 }}>Ofertă nouă</div>
            </div>
            <div style={{ fontSize: 36, color: P.mint, letterSpacing: "-0.03em" }}>{o.price}</div>
          </div>
        );
      })}
      <Txt words={kw("oferte", { only: [0, 1, 2], cap: true, color: { 2: MINT_INK } })} size={80} on="black" x={130} y={170} align="left" out={S5 - 6} />
      <Txt words={kw("oferte", { only: [3, 4, 5, 6, 7], color: { 4: MINT_INK } })} size={80} on="black" x={130} y={270} align="left" out={S5 - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7. choose · pay safely · follow it live
const Trust: React.FC = () => {
  const f = useCurrentFrame();
  const at = [w("alegi", 1) - 8, w("platesti", 0) - 8, w("urmaresti", 1) - 8];
  const card = (k: number, child: React.ReactNode) => {
    const p = ease.outBack(clamp01((f - at[k]) / 14), 1.2);
    if (p <= 0) return null;
    return (
      <div style={{ width: 420, height: 400, borderRadius: 44, background: "#ffffff", boxShadow: "0 40px 80px rgba(0,60,30,0.3)", transform: `translateY(${(1 - p) * 120}px) scale(${0.8 + 0.2 * p})`, opacity: clamp01(p * 2), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, fontFamily: FONT, fontWeight: BOLD, color: P.ink }}>
        {child}
      </div>
    );
  };
  const steps = clamp01((f - (at[2] + 6)) / 28);
  return (
    <AbsoluteFill>
      <Bg kind="green" />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 50 }}>
        <div style={{ width: 420, height: 400 }}>
          {card(
            0,
            <>
              <div style={{ position: "relative" }}>
                <Avatar person="andrei" size={150} dark={false} lit={1} />
                <div style={{ position: "absolute", right: -4, bottom: 0, width: 50, height: 50, borderRadius: 25, background: P.green, border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Glyph name="check" size={26} color="#fff" weight={3.6} />
                </div>
              </div>
              <div style={{ fontSize: 38, letterSpacing: "-0.03em" }}>Andrei P.</div>
              <div style={{ padding: "10px 26px", borderRadius: 999, background: P.green, color: "#fff", fontSize: 26 }}>Ales</div>
            </>,
          )}
        </div>
        <div style={{ width: 420, height: 400 }}>
          {card(
            1,
            <>
              <svg width={150} height={170} viewBox="0 0 24 26">
                <path d="M12 1.5 C 15 3, 18 3.5, 21 3.5 C 21 12, 18 19, 12 24 C 6 19, 3 12, 3 3.5 C 6 3.5, 9 3, 12 1.5 Z" fill={P.green} />
                <rect x={8.5} y={11} width={7} height={6} rx={1.4} fill="#fff" />
                <path d="M10 11 V 9.3 A 2 2 0 0 1 14 9.3 V 11" fill="none" stroke="#fff" strokeWidth={1.4} />
              </svg>
              <div style={{ fontSize: 34, letterSpacing: "-0.03em" }}>Plată securizată</div>
            </>,
          )}
        </div>
        <div style={{ width: 420, height: 400 }}>
          {card(
            2,
            <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 22 }}>
              {["Acceptat", "Pe drum", "În lucru", "Gata"].map((t, k) => {
                const on = steps >= k / 3 - 0.01;
                return (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: on ? P.ink : "#a7b0ab" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: on ? P.green : "#e6ebe8", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${on ? 1 : 0.9})` }}>{on && <Glyph name="check" size={18} color="#fff" weight={3.6} />}</div>
                    {t}
                  </div>
                );
              })}
            </div>,
          )}
        </div>
      </div>
      <Txt words={kw("alegi", { color: { 1: ["#06301f", "#021a10"] } })} size={70} on="green" x={415} y={680} />
      <Txt words={kw("platesti", { cap: true, color: { 2: ["#06301f", "#021a10"] } })} size={60} on="green" x={960} y={680} />
      <Txt words={kw("urmaresti", { only: [1, 2], cap: true, color: { 2: ["#06301f", "#021a10"] } })} size={60} on="green" x={1505} y={680} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 8. know how to do something? earn, on your time
const Earn: React.FC = () => {
  const f = useCurrentFrame();
  const card = ease.outExpo(clamp01((f - (S6 + 4)) / 20));
  const earnAt = w("castigi", 0) - 8;
  const earn = ease.outExpo(clamp01((f - earnAt) / 18));
  const amount = Math.round(lerp(0, 2450, ease.inOutCubic(clamp01((f - earnAt) / 30))));
  const clock = ease.outBack(clamp01((f - (w("timp", 0) - 6)) / 12));
  const outT = ease.inCubic(clamp01((f - (S7 - 7)) / 7));
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      <Txt words={kw("daca", { color: { 5: MINT_INK } })} size={72} on="deep" x={120} y={CY - 60} align="left" out={S7 - 6} />
      <Txt words={[...kw("castigi", { cap: true, color: { 0: MINT_INK } }), ...kw("timp", { cap: false, color: { 3: MINT_INK } })]} size={66} on="deep" x={120} y={CY + 40} align="left" out={S7 - 6} />
      <div style={{ position: "absolute", left: 1200, top: CY - 300, width: 600, height: 250, borderRadius: 44, background: "#fff", boxShadow: "0 50px 100px rgba(0,0,0,0.35)", transform: `translateX(${(1 - card) * 700}px)`, opacity: card * (1 - outT), padding: 34, display: "flex", gap: 26, fontFamily: FONT, fontWeight: BOLD }}>
        <Avatar person="andrei" size={150} dark={false} lit={1} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 10 }}>
          <div style={{ fontSize: 42, color: P.ink, letterSpacing: "-0.03em" }}>Tasker</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, color: P.green }}>
            <Glyph name="check" size={24} color={P.green} weight={3.2} />
            Verificat · Timișoara
          </div>
        </div>
      </div>
      {earn > 0 && (
        <div style={{ position: "absolute", left: 1200, top: CY - 20, width: 600, height: 230, borderRadius: 44, background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(185,255,214,0.2)", transform: `translateY(${(1 - earn) * 200}px)`, opacity: earn * (1 - outT), padding: 36, fontFamily: FONT, fontWeight: BOLD }}>
          <div style={{ fontSize: 26, color: "rgba(185,255,214,0.75)", fontWeight: 500 }}>Câștigat luna asta</div>
          <div style={{ fontSize: 96, color: "#fff", letterSpacing: "-0.05em", marginTop: 4 }}>
            {amount.toLocaleString("ro-RO")} <span style={{ fontSize: 46, color: P.mint }}>lei</span>
          </div>
        </div>
      )}
      {clock > 0 && (
        <div style={{ position: "absolute", left: 1200, top: CY + 240, transform: `scale(${clock})`, transformOrigin: "0 50%", opacity: 1 - outT, display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", borderRadius: 999, background: P.green, color: "#fff", fontFamily: FONT, fontWeight: BOLD, fontSize: 30 }}>
          <Glyph name="clock" size={30} color="#fff" weight={2.6} />
          Programul tău
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 9. we started in Timișoara — soon everywhere
const RoMap: React.FC = () => {
  const f = useCurrentFrame();
  const draw = ease.inOutCubic(clamp01((f - S7) / 26));
  const tm = proj(CITIES[0].lon, CITIES[0].lat);
  const spreadAt = w("curand", 3) - 6;
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateY(60px) scale(${lerp(1.15, 1.0, draw)})`, transformOrigin: `${tm[0]}px ${tm[1]}px` }}>
        <defs>
          <filter id="glowRo">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <path d={roPath()} fill={`rgba(0,191,99,${0.1 * draw})`} stroke={P.green} strokeWidth={10} strokeLinejoin="round" opacity={0.5} filter="url(#glowRo)" pathLength={1} strokeDasharray={`${draw} 2`} />
        <path d={roPath()} fill="none" stroke={P.mint} strokeWidth={3.5} strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 2`} />
        {CITIES.slice(1).map((c, i) => {
          const at = spreadAt + i * 3;
          const [x, y] = proj(c.lon, c.lat);
          const p = ease.inOutCubic(clamp01((f - at) / 12));
          const pop = ease.outBack(clamp01((f - (at + 10)) / 10), 1.6);
          return (
            <g key={c.n}>
              {p > 0.01 && <line x1={tm[0]} y1={tm[1]} x2={lerp(tm[0], x, p)} y2={lerp(tm[1], y, p)} stroke={P.green} strokeWidth={3} opacity={0.7} style={{ filter: "drop-shadow(0 0 6px rgba(0,191,99,0.9))" }} />}
              {pop > 0 && (
                <g transform={`translate(${x} ${y}) scale(${pop})`}>
                  <circle r={11} fill={P.green} style={{ filter: "drop-shadow(0 0 10px rgba(0,191,99,0.9))" }} />
                  <text x={18} y={-12} fontFamily={FONT} fontWeight={BOLD} fontSize={26} fill="#fff">
                    {c.n}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {f >= w("pornit", 3) - 8 && (
          <g transform={`translate(${tm[0]} ${tm[1]})`}>
            <circle r={20 + ((f % 36) / 36) * 70} fill="none" stroke={P.green} strokeWidth={3} opacity={1 - (f % 36) / 36} />
            <circle r={16} fill={P.mint} style={{ filter: "drop-shadow(0 0 14px rgba(0,191,99,1))" }} />
            <text x={-30} y={-24} textAnchor="end" fontFamily={FONT} fontWeight={BOLD} fontSize={40} fill="#fff">
              Timișoara
            </text>
          </g>
        )}
      </svg>
      <Txt words={kw("pornit", { color: { 3: MINT_INK } })} size={84} on="black" y={140} out={pStart("curand") - 6} />
      <Txt words={kw("curand", { color: { 3: MINT_INK, 4: MINT_INK } })} size={84} on="black" y={140} out={S8 - 4} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 10. Handly — the brand switch, the hit, download
const Final: React.FC = () => {
  const f = useCurrentFrame();
  if (f < HIT) return <Slam from={S8} grid={GRID} ro />;
  const t = f - HIT;
  const pb = punch(f, HIT, 0.08, 14);
  const fade = ease.inOutCubic(clamp01((f - (TOTAL - 20)) / 18));
  return (
    <AbsoluteFill>
      <Bg kind="green" />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 60, transform: `scale(${pb * (1 + 0.03 * clamp01(t / 90))}) translateY(-40px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <Logo size={180} tone="white" />
          <div style={{ transform: "translateY(-12px)" }}>
            <Wordmark size={180} color="#fff" ro />
          </div>
        </div>
        <div style={{ display: "flex", gap: 26 }}>
          <StoreBadge store="apple" h={92} shine={clamp01((t - 4) / 20)} />
          <StoreBadge store="google" h={92} shine={clamp01((t - 10) / 20)} />
        </div>
      </AbsoluteFill>
      <Txt words={kw("cta", { color: { 5: ["#06301f", "#021a10"] } })} size={64} on="green" y={930} />
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};

export const HandlyTimisoaraLaunch: React.FC = () => {
  const ready = useExplainerFonts();
  if (!ready) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win from={0} to={S1}>
        <Intro />
      </Win>
      <Win from={S1} to={S2}>
        <Needs />
      </Win>
      <Win from={S2} to={S3}>
        <Services />
      </Win>
      <Win from={S3} to={DROP}>
        <All />
      </Win>
      <Win from={DROP} to={APP}>
        <Slam from={DROP} grid={GRID} shakeAt={DROP} zoomOutAt={APP - 8} />
        <Explosion at={DROP} cx={960} cy={560} />
      </Win>
      <Win from={APP} to={OFF}>
        <AppScene />
      </Win>
      <Win from={OFF} to={S5}>
        <Offers />
      </Win>
      <Win from={S5} to={S6}>
        <Trust />
      </Win>
      <Win from={S6} to={S7}>
        <Earn />
      </Win>
      <Win from={S7} to={S8}>
        <RoMap />
      </Win>
      <Win from={S8} to={TOTAL}>
        <Final />
        <Explosion at={HIT} cx={960} cy={500} />
      </Win>
      <Audio src={staticFile("audio/tm-mix.mp3")} />
    </AbsoluteFill>
  );
};
