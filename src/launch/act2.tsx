import React from "react";
import { B1_END, B2_END, B3_END, B4_END, B5_END, B6_END, B7_END } from "./scenes";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppScreen, TASK_TEXT } from "../explainer/components/AppScreen";
import { Avatar, Person } from "../explainer/components/Avatar";
import { Glyph } from "../explainer/components/Icons";
import { Phone } from "../explainer/components/Phone";
import { clamp01, ease, lerp, seeded } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { Bg, BgKind, GREEN_GRAD, GREEN_INK, Label, Logo, MINT_INK, P, Shape, Txt, Win, Wordmark, io, punch } from "./kit";
import { morphNamed, shape, ShapeName } from "./morph";
import { Slam } from "./slam";
import { Explosion, ServiceTile, SERVICES } from "./fx";
import { BEATS, BRIDGE, DROP, F, kw, pEnd, pStart, w } from "./timeline";

const CX = 960;
const CY = 540;
const D0 = F(DROP);
/** frame of the k-th beat after the drop */
const bt = (k: number) => Math.round(D0 + k * BEATS);
/** index of the beat at/just before `frame` */
const beatAt = (frame: number) => Math.floor((frame - D0 + 0.5) / BEATS);

// ------------------------------------------------------------------ B1: the drop — brand on the beat
const SLAM: Array<{ bg: BgKind; logo: "white" | "green"; word: string }> = [
  { bg: "green", logo: "white", word: "#ffffff" },
  { bg: "black", logo: "green", word: "#ffffff" },
  { bg: "white", logo: "green", word: P.ink },
  { bg: "deep", logo: "green", word: "#ffffff" },
];

const B1: React.FC = () => <Slam from={D0} zoomOutAt={B1_END - 8} shakeAt={D0} />;

// ------------------------------------------------------------------ B2: post it in under a minute

const B2: React.FC = () => {
  const frame = useCurrentFrame();
  const b0 = B1_END;
  const enter = ease.outExpo(clamp01((frame - b0) / 22));
  const TYPE = b0 + 10;
  const CAT = TYPE + 24;
  const PRESS = b0 + 66;
  const SUCC = PRESS + 12;
  const app = {
    typed: clamp01((frame - TYPE) / 18) * TASK_TEXT.length,
    caret: Math.floor(frame / 7) % 2 === 0 || (frame > TYPE && frame < TYPE + 20),
    focus: clamp01((frame - (TYPE - 4)) / 4) * (1 - clamp01((frame - CAT) / 4)),
    category: ease.outCubic(clamp01((frame - CAT) / 6)),
    location: clamp01((frame - (CAT + 8)) / 16),
    priceSel: ease.outCubic(clamp01((frame - (CAT + 20)) / 8)),
    press: clamp01((frame - PRESS) / 9),
    loading: clamp01((frame - (PRESS + 3)) / 10),
    success: ease.outCubic(clamp01((frame - SUCC) / 9)),
    check: clamp01((frame - (SUCC + 4)) / 12),
    since: frame - SUCC,
  };
  const secs = Math.round(lerp(0, 52, clamp01((frame - TYPE) / (SUCC - TYPE))));
  const ring = clamp01((frame - TYPE) / (SUCC - TYPE)) * (52 / 60);
  const done = ease.outBack(clamp01((frame - SUCC) / 10));
  const outT = ease.inCubic(clamp01((frame - (B2_END - 7)) / 7));
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      <Txt words={kw("postezi", { only: [0, 1, 2, 3] })} size={84} on="white" x={130} y={CY - 56} align="left" out={B2_END - 6} />
      <Txt words={kw("postezi", { only: [4, 5, 6, 7, 8, 9], color: { 8: GREEN_INK, 9: GREEN_INK } })} size={84} on="white" x={130} y={CY + 48} align="left" out={B2_END - 6} />
      <div
        style={{
          position: "absolute",
          left: 1340 - 215,
          top: CY - 442,
          transform: `perspective(2200px) translateY(${(1 - enter) * 700 + outT * -80}px) rotateX(${(1 - enter) * 30}deg) rotateY(${-14 + 6 * enter}deg) scale(0.86)`,
          opacity: 1 - outT,
          filter: "drop-shadow(0 50px 80px rgba(10,40,25,0.25))",
        }}
      >
        <Phone>
          <AppScreen s={app} />
        </Phone>
      </div>
      {/* stopwatch: under a minute */}
      <div style={{ position: "absolute", left: 1730, top: CY - 250, transform: `translate(-50%, -50%) scale(${ease.outBack(clamp01((frame - (TYPE - 6)) / 12)) * (1 - outT)})` }}>
        <div style={{ width: 230, height: 230, borderRadius: "50%", background: "#fff", boxShadow: "0 30px 60px rgba(10,40,25,0.18)", position: "relative" }}>
          <svg width={230} height={230} viewBox="-60 -60 120 120" style={{ position: "absolute", inset: 0 }}>
            <circle r={48} fill="none" stroke="#e7ece9" strokeWidth={8} />
            <circle r={48} fill="none" stroke={P.green} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring} 1`} transform="rotate(-90)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: BOLD, fontSize: 54, color: P.ink, letterSpacing: "-0.04em", opacity: 1 - done }}>
            0:{String(secs).padStart(2, "0")}
          </div>
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

// ------------------------------------------------------------------ B3: verified taskers nearby send offers
const OFFERS: Array<{ p: Person; name: string; price: string; x: number; y: number }> = [
  { p: "mihai", name: "Mihai D.", price: "150 lei", x: 250, y: 230 },
  { p: "andrei", name: "Andrei P.", price: "140 lei", x: 860, y: 200 },
  { p: "radu", name: "Radu S.", price: "170 lei", x: 760, y: 590 },
];
const MW = 1100;
const MH = 780;
const ME: [number, number] = [550, 400];

/** a dark, premium city map: parks, a river, avenues, blocks */
const CityMap: React.FC<{ frame: number; routes: number[] }> = ({ frame, routes }) => (
  <svg width={MW} height={MH} viewBox={`0 0 ${MW} ${MH}`} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="mapGlow" cx="50%" cy="51%" r="60%">
        <stop offset="0%" stopColor="#11261d" />
        <stop offset="100%" stopColor="#0a110e" />
      </radialGradient>
      <clipPath id="mapClip">
        <rect width={MW} height={MH} rx={56} />
      </clipPath>
    </defs>
    <g clipPath="url(#mapClip)">
      <rect width={MW} height={MH} fill="url(#mapGlow)" />
      {/* parks */}
      <path d="M60 470 q80 -60 190 -20 q60 40 40 130 q-30 90 -150 80 q-110 -20 -80 -190z" fill="rgba(0,191,99,0.12)" />
      <path d="M840 470 q90 -30 170 30 q30 80 -40 130 q-120 30 -150 -50 q-20 -80 20 -110z" fill="rgba(0,191,99,0.1)" />
      {/* river */}
      <path d="M-40 140 C 220 120, 380 300, 600 260 S 920 60, 1160 120" stroke="rgba(90,170,150,0.22)" strokeWidth={46} fill="none" strokeLinecap="round" />
      {/* blocks */}
      {Array.from({ length: 64 }, (_, i) => {
        const cx = (i % 11) * 104 + 20;
        const cy = Math.floor(i / 11) * 128 + 30;
        return <rect key={i} x={cx + seeded(i, 2) * 14} y={cy + seeded(i, 3) * 14} width={62 + seeded(i, 4) * 18} height={70 + seeded(i, 5) * 22} rx={10} fill="rgba(255,255,255,0.035)" />;
      })}
      {/* streets */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <line key={`v${i}`} x1={i * 104 + 6} y1={0} x2={i * 104 + 6} y2={MH} stroke={`rgba(255,255,255,${i % 3 === 0 ? 0.11 : 0.05})`} strokeWidth={i % 3 === 0 ? 12 : 5} />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={`h${i}`} x1={0} y1={i * 128 + 14} x2={MW} y2={i * 128 + 14} stroke={`rgba(255,255,255,${i % 2 === 0 ? 0.1 : 0.05})`} strokeWidth={i % 2 === 0 ? 12 : 5} />
      ))}
      <line x1={-20} y1={MH + 20} x2={MW + 20} y2={-40} stroke="rgba(255,255,255,0.09)" strokeWidth={16} />
      {/* your area */}
      <circle cx={ME[0]} cy={ME[1]} r={300} fill="rgba(0,191,99,0.07)" stroke="rgba(0,191,99,0.35)" strokeWidth={2.5} strokeDasharray="10 12" />
      {/* routes from each tasker to you */}
      {OFFERS.map((o, i) => {
        const p = routes[i];
        if (p <= 0) return null;
        const d = `M${o.x} ${o.y} Q ${(o.x + ME[0]) / 2 + (i - 1) * 90} ${(o.y + ME[1]) / 2 - 80}, ${ME[0]} ${ME[1]}`;
        return (
          <g key={i}>
            <path d={d} stroke="rgba(0,191,99,0.25)" strokeWidth={14} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} />
            <path d={d} stroke={P.mint} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray="2 14" strokeDashoffset={-frame * 1.6} opacity={p} />
          </g>
        );
      })}
      {/* you */}
      {[0, 1].map((k) => {
        const r = ((frame + k * 20) % 40) / 40;
        return <circle key={k} cx={ME[0]} cy={ME[1]} r={20 + 90 * r} fill="none" stroke={P.green} strokeWidth={3} opacity={(1 - r) * 0.7} />;
      })}
      <circle cx={ME[0]} cy={ME[1]} r={20} fill={P.green} stroke="#fff" strokeWidth={6} />
    </g>
    <rect x={1} y={1} width={MW - 2} height={MH - 2} rx={55} fill="none" stroke="rgba(185,255,214,0.18)" strokeWidth={2} />
  </svg>
);

const B3: React.FC = () => {
  const frame = useCurrentFrame();
  const b0 = B2_END;
  const plane = ease.outExpo(clamp01((frame - b0) / 26));
  const outT = ease.inCubic(clamp01((frame - (B3_END - 7)) / 7));
  const TILT = 48 + 12 * (1 - plane);
  const SPIN = -16 + (frame - b0) * 0.08;
  const pinAt = (i: number) => w("taskeri", 1) - 4 + i * 5;
  const routes = OFFERS.map((_, i) => ease.inOutCubic(clamp01((frame - (pinAt(i) + 10)) / 18)));
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <AbsoluteFill style={{ perspective: 1900, opacity: plane * (1 - outT) }}>
        <div
          style={{
            position: "absolute",
            left: 800 - MW / 2,
            top: 680 - MH / 2,
            width: MW,
            height: MH,
            transformStyle: "preserve-3d",
            transform: `translateY(${(1 - plane) * 260}px) rotateX(${TILT}deg) rotateZ(${SPIN}deg) scale(${1.1 + 0.06 * plane})`,
            borderRadius: 56,
            boxShadow: "0 80px 140px rgba(0,0,0,0.6), 0 0 120px rgba(0,191,99,0.12)",
          }}
        >
          <CityMap frame={frame} routes={routes} />
          {/* pins stand up out of the map */}
          {OFFERS.map((o, i) => {
            const pop = ease.outBack(clamp01((frame - pinAt(i)) / 12));
            if (pop <= 0) return null;
            return (
              <div key={o.p} style={{ position: "absolute", left: o.x, top: o.y, width: 0, height: 0, transformStyle: "preserve-3d" }}>
                <div style={{ position: "absolute", left: -40, top: -14, width: 80, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.45)", filter: "blur(6px)", transform: `scale(${pop})` }} />
                <div
                  style={{
                    position: "absolute",
                    left: -62,
                    top: -168,
                    width: 124,
                    height: 168,
                    transformOrigin: "50% 100%",
                    transform: `rotateZ(${-SPIN}deg) rotateX(${-TILT}deg) scale(${pop})`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
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
      {/* offers stack in */}
      {OFFERS.map((o, i) => {
        const at = w("taskeri", 6) - 4 + i * 5;
        const p = ease.outExpo(clamp01((frame - at) / 16));
        if (p <= 0) return null;
        return (
          <div
            key={`o${i}`}
            style={{
              position: "absolute",
              left: 1330,
              top: 170 + i * 150,
              width: 480,
              height: 124,
              borderRadius: 32,
              background: "rgba(22,28,25,0.85)",
              border: "1.5px solid rgba(255,255,255,0.12)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px)",
              transform: `translateX(${(1 - p) * 600}px) scale(${1 - outT * 0.1})`,
              opacity: p * (1 - outT),
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "0 26px",
              fontFamily: FONT,
              fontWeight: BOLD,
            }}
          >
            <Avatar person={o.p} size={76} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, color: "#fff", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 8 }}>
                {o.name}
                <svg width={26} height={26} viewBox="0 0 24 24">
                  <path d="M12 1.5l2.6 2 3.3-.2.9 3.2 2.8 1.8-1.2 3.1 1.2 3.1-2.8 1.8-.9 3.2-3.3-.2-2.6 2-2.6-2-3.3.2-.9-3.2-2.8-1.8 1.2-3.1-1.2-3.1 2.8-1.8.9-3.2 3.3.2z" fill={P.green} />
                  <path d="M8 12.2l2.7 2.7 5.3-5.6" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: 22, color: "#8d9792", fontWeight: 500, marginTop: 4 }}>Ofertă nouă</div>
            </div>
            <div style={{ fontSize: 36, color: P.mint, letterSpacing: "-0.03em" }}>{o.price}</div>
          </div>
        );
      })}
      <Txt words={kw("taskeri", { only: [0, 1], color: { 1: MINT_INK } })} size={88} on="black" x={140} y={190} align="left" out={B3_END - 6} />
      <Txt words={kw("taskeri", { only: [2, 3, 4] })} size={88} on="black" x={140} y={295} align="left" out={B3_END - 6} />
      <Txt words={kw("taskeri", { only: [5, 6, 7] })} size={88} on="black" x={140} y={400} align="left" out={B3_END - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B4: choose → chat → pay safely
const PICKS: Array<{ p: Person; name: string; r: string }> = [
  { p: "radu", name: "Radu", r: "4.8" },
  { p: "andrei", name: "Andrei", r: "5.0" },
  { p: "mihai", name: "Mihai", r: "4.9" },
];

const Bubble: React.FC<{ text: string; me?: boolean; at: number; frame: number }> = ({ text, me, at, frame }) => {
  const p = ease.outBack(clamp01((frame - at) / 10));
  if (p <= 0) return null;
  return (
    <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: 440, padding: "18px 24px", borderRadius: 28, borderBottomRightRadius: me ? 8 : 28, borderBottomLeftRadius: me ? 28 : 8, background: me ? P.green : "#eef2ef", color: me ? "#fff" : P.ink, fontSize: 28, fontWeight: 500, letterSpacing: "-0.01em", transform: `scale(${p})`, transformOrigin: me ? "100% 100%" : "0% 100%", opacity: clamp01(p * 2) }}>
      {text}
    </div>
  );
};

const B4: React.FC = () => {
  const frame = useCurrentFrame();
  const b0 = B3_END;
  const sel = w("alegi", 3);
  const s2 = w("alegi", 5) - 4;
  const s3 = w("alegi", 11) - 4;
  const grow = ease.inOutCubic(clamp01((frame - (s2 - 6)) / 14));
  const toShield = ease.outBack(clamp01((frame - s3) / 14));
  const showShield = frame >= s3;
  const PW = lerp(300, 640, grow);
  const PH = lerp(380, 560, grow);
  const PY = CY - 70;
  const outT = ease.inCubic(clamp01((frame - (B4_END - 7)) / 7));
  return (
    <AbsoluteFill>
      <Bg kind="green" />
      {/* three picks; the middle one is chosen */}
      {!showShield &&
        PICKS.map((c, i) => {
          const enter = ease.outExpo(clamp01((frame - (b0 + 2 + i * 3)) / 18));
          const chosen = i === 1;
          const s = ease.outBack(clamp01((frame - sel) / 12));
          const away = chosen ? 0 : ease.inOutCubic(clamp01((frame - sel) / 12));
          if (!chosen && away >= 1) return null;
          const x = chosen ? CX : CX + (i - 1) * 360 + (i - 1) * 300 * away;
          const width = chosen ? PW : 300;
          const height = chosen ? PH : 380;
          return (
            <div
              key={c.p}
              style={{
                position: "absolute",
                left: x - width / 2,
                top: PY - height / 2 + (1 - enter) * 500,
                width,
                height,
                borderRadius: 40,
                background: "#fff",
                boxShadow: `0 40px 80px rgba(0,60,30,0.3), 0 0 0 ${chosen ? 6 * s * (1 - grow) : 0}px rgba(255,255,255,0.5)`,
                transform: `scale(${chosen ? 1 + 0.06 * s * (1 - grow) : 1 - 0.2 * away}) rotate(${(i - 1) * 8 * away}deg)`,
                opacity: enter * (1 - away),
                fontFamily: FONT,
                fontWeight: BOLD,
                overflow: "hidden",
              }}
            >
              {/* the card face */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 46, gap: 14, opacity: 1 - grow * 2 }}>
                <Avatar person={c.p} size={130} dark={false} />
                <div style={{ fontSize: 38, color: P.ink, letterSpacing: "-0.03em" }}>{c.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 26, color: "#6d7672" }}>
                  <svg width={24} height={24} viewBox="0 0 24 24">
                    <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill="#ffc531" />
                  </svg>
                  {c.r}
                </div>
                {chosen && (
                  <div style={{ marginTop: 6, padding: "10px 26px", borderRadius: 999, background: P.green, color: "#fff", fontSize: 24, opacity: s }}>Ales</div>
                )}
              </div>
              {/* the chat it becomes */}
              {chosen && grow > 0 && (
                <div style={{ position: "absolute", inset: 0, opacity: clamp01((grow - 0.4) / 0.4), padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: "1.5px solid #edf0ee" }}>
                    <Avatar person="andrei" size={64} dark={false} />
                    <div>
                      <div style={{ fontSize: 30, color: P.ink, letterSpacing: "-0.03em" }}>Andrei</div>
                      <div style={{ fontSize: 20, color: P.green, fontWeight: 500 }}>online</div>
                    </div>
                  </div>
                  <Bubble text="Salut! Pot veni mâine la 10." at={s2 + 10} frame={frame} />
                  <Bubble text="Perfect, te aștept!" me at={s2 + 24} frame={frame} />
                  <Bubble text="Îmi iau sculele, e rezolvat." at={s2 + 38} frame={frame} />
                </div>
              )}
            </div>
          );
        })}
      {/* the chat folds into a shield: paid safely */}
      {showShield && (
        <>
          <Shape
            pts={morphNamed("card", "shield", toShield, 1, frame)}
            x={CX}
            y={PY}
            size={lerp(610, 470, toShield)}
            sx={lerp(PW / 427, 1, toShield)}
            sy={lerp(PH / 561, 1, toShield)}
            fill="#fff"
            shadow="drop-shadow(0 40px 80px rgba(0,60,30,0.3))"
            opacity={1 - outT}
          />
          <div style={{ position: "absolute", left: CX - 90, top: PY - 110, opacity: clamp01((toShield - 0.5) * 3) * (1 - outT), transform: `scale(${0.6 + 0.4 * toShield})` }}>
            <svg width={180} height={200} viewBox="0 0 24 26" fill="none" stroke={P.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <rect x={4} y={11} width={16} height={12} rx={3} fill={P.green} />
              <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
              <circle cx={12} cy={17} r={1.6} fill="#fff" stroke="none" />
            </svg>
          </div>
        </>
      )}
      <Txt words={kw("alegi", { only: [0, 1, 2, 3, 4] })} size={76} on="green" y={CY + 330} out={s2 - 4} />
      <Txt words={kw("alegi", { only: [5, 6, 7, 8, 9, 10] })} size={76} on="green" y={CY + 330} out={s3 - 4} />
      <Txt words={kw("alegi", { only: [11, 12, 13, 14] })} size={76} on="green" y={CY + 330} out={B4_END - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B5: no cash that vanishes
const NW = 640;
const NH = 320;
const COLS = 16;
const ROWS = 8;

const Note: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: NW, height: NH, borderRadius: 26, background: "linear-gradient(135deg, #dff6e9 0%, #a6e3c3 55%, #7fd1a7 100%)", overflow: "hidden", fontFamily: FONT, fontWeight: BOLD, boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)" }}>
    <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, borderRadius: "50%", border: "18px solid rgba(255,255,255,0.35)" }} />
    <div style={{ position: "absolute", right: 10, top: 10, width: 180, height: 180, borderRadius: "50%", border: "10px solid rgba(255,255,255,0.3)" }} />
    <div style={{ position: "absolute", left: 40, top: 30, fontSize: 130, color: "#05502f", letterSpacing: "-0.06em" }}>100</div>
    <div style={{ position: "absolute", left: 46, bottom: 34, fontSize: 40, color: "#05502f", letterSpacing: "0.2em" }}>LEI</div>
    <div style={{ position: "absolute", right: 40, bottom: 34, width: 120, height: 120, borderRadius: "50%", background: "rgba(5,80,47,0.12)" }} />
  </div>
);

const B5: React.FC = () => {
  const frame = useCurrentFrame();
  const b0 = B4_END;
  const enter = ease.outExpo(clamp01((frame - b0) / 18));
  const dis = w("cash", 3) - 6;
  const float = Math.sin(frame / 10) * 8;
  const NX = CX - NW / 2;
  const NY = CY + 60 - NH / 2;
  const tilt = `perspective(1600px) rotateX(${12 + Math.sin(frame / 14) * 4}deg) rotateY(${-16 + Math.sin(frame / 18) * 6}deg)`;
  return (
    <AbsoluteFill>
      <Bg kind="white" />
      <div style={{ position: "absolute", left: NX, top: NY + float + (1 - enter) * 300, width: NW, height: NH, transform: `${tilt} scale(1.3)`, filter: "drop-shadow(0 40px 60px rgba(10,60,30,0.2))" }}>
        {frame < dis ? (
          <Note />
        ) : (
          Array.from({ length: COLS * ROWS }, (_, i) => {
            const cx = i % COLS;
            const cy = Math.floor(i / COLS);
            const delay = cx * 1.3 + seeded(i, 1) * 6;
            const t = clamp01((frame - dis - delay) / 18);
            if (t >= 1) return null;
            const e = ease.inCubic(t);
            const tw = NW / COLS;
            const th = NH / ROWS;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx * tw,
                  top: cy * th,
                  width: tw + 0.5,
                  height: th + 0.5,
                  overflow: "hidden",
                  transform: `translate(${e * (260 + seeded(i, 2) * 300)}px, ${e * -(120 + seeded(i, 3) * 260)}px) rotate(${e * (seeded(i, 4) - 0.5) * 220}deg) scale(${1 - e * 0.6})`,
                  opacity: 1 - e,
                }}
              >
                <div style={{ position: "absolute", left: -cx * tw, top: -cy * th }}>
                  <Note />
                </div>
              </div>
            );
          })
        )}
      </div>
      <Txt words={kw("cash", { color: { 0: GREEN_INK, 1: GREEN_INK } })} size={96} on="white" y={CY - 300} out={B5_END - 6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B6: live tracking until done
const STEPS = [
  ["Task postat", "10:02"],
  ["Andrei e pe drum", "10:15"],
  ["În lucru", "10:31"],
  ["Gata!", "11:05"],
];

const B6: React.FC = () => {
  const frame = useCurrentFrame();
  const b0 = B5_END;
  const enter = ease.outExpo(clamp01((frame - b0) / 20));
  const done = w("urmaresti", 8) - 2;
  const stepAt = (i: number) => (i < 3 ? b0 + 10 + i * 20 : done);
  const fill = (frame - b0 - 10) / (done - b0 - 10);
  const outT = ease.inCubic(clamp01((frame - (B6_END - 7)) / 7));
  const finalPop = ease.outBack(clamp01((frame - done) / 10));
  return (
    <AbsoluteFill>
      <Bg kind="deep" />
      <Txt words={kw("urmaresti", { only: [0, 1] })} size={96} on="deep" x={140} y={CY - 110} align="left" out={B6_END - 6} />
      <Txt words={kw("urmaresti", { only: [2, 3, 4], color: { 3: MINT_INK, 4: MINT_INK } })} size={96} on="deep" x={140} y={CY} align="left" out={B6_END - 6} />
      <Txt words={kw("urmaresti", { only: [5, 6, 7, 8] })} size={96} on="deep" x={140} y={CY + 110} align="left" out={B6_END - 6} />
      <div
        style={{
          position: "absolute",
          left: 1120,
          top: CY - 330,
          width: 640,
          height: 660,
          borderRadius: 48,
          background: "rgba(255,255,255,0.06)",
          border: "1.5px solid rgba(185,255,214,0.18)",
          boxShadow: "0 50px 100px rgba(0,0,0,0.35)",
          backdropFilter: "blur(24px)",
          transform: `translateY(${(1 - enter) * 200}px) scale(${1 - 0.06 * outT})`,
          opacity: enter * (1 - outT),
          fontFamily: FONT,
          fontWeight: BOLD,
          padding: 44,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 38, color: "#fff", letterSpacing: "-0.03em" }}>Robinet care curge</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: "rgba(0,191,99,0.18)", color: P.mint, fontSize: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: P.green, opacity: 0.5 + 0.5 * Math.sin(frame / 3) }} />
            LIVE
          </div>
        </div>
        <div style={{ position: "relative", marginTop: 44 }}>
          <div style={{ position: "absolute", left: 21, top: 22, width: 4, height: 3 * 118, background: "rgba(255,255,255,0.1)", borderRadius: 2 }} />
          <div style={{ position: "absolute", left: 21, top: 22, width: 4, height: 3 * 118 * clamp01(fill), background: P.green, borderRadius: 2, boxShadow: "0 0 16px rgba(0,191,99,0.6)" }} />
          {STEPS.map(([label, time], i) => {
            const on = frame >= stepAt(i);
            const p = ease.outBack(clamp01((frame - stepAt(i)) / 10));
            const last = i === 3;
            return (
              <div key={i} style={{ position: "absolute", left: 0, top: i * 118, display: "flex", alignItems: "center", gap: 28, width: "100%" }}>
                <div style={{ width: 46, height: 46, borderRadius: 23, background: on ? P.green : "#1d2a24", border: on ? "none" : "3px solid rgba(255,255,255,0.15)", transform: `scale(${on ? (last ? 1 + 0.3 * finalPop - 0.3 * clamp01((frame - done - 10) / 10) : p) : 1})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: on ? "0 0 24px rgba(0,191,99,0.6)" : undefined }}>
                  {on && <Glyph name="check" size={26} color="#fff" weight={3.6} />}
                </div>
                <div style={{ flex: 1, fontSize: last ? 40 : 32, color: on ? "#fff" : "rgba(255,255,255,0.35)", letterSpacing: "-0.03em" }}>{label}</div>
                <div style={{ fontSize: 24, color: on ? P.mint : "rgba(255,255,255,0.25)", fontWeight: 500 }}>{time}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* the finish line burst */}
      {frame >= done && (
        <svg width={600} height={600} viewBox="-150 -150 300 300" style={{ position: "absolute", left: 1120 + 44 + 23 - 300, top: CY - 330 + 44 + 46 + 44 + 3 * 118 + 23 - 300, pointerEvents: "none" }}>
          {Array.from({ length: 12 }, (_, i) => {
            const t = clamp01((frame - done) / 16);
            const a = (i / 12) * Math.PI * 2;
            const r0 = 30 + 70 * ease.outCubic(t);
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * (r0 + 16 * (1 - t))} y2={Math.sin(a) * (r0 + 16 * (1 - t))} stroke={P.mint} strokeWidth={4} strokeLinecap="round" opacity={1 - t} />;
          })}
        </svg>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B7: no hassle. no stress.

const B7: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = w("fara2", 0) - 3;
  const calm = ease.inOutCubic(clamp01((frame - (w("fara2", 1) - 2)) / 14));
  if (frame < cut) {
    return (
      <AbsoluteFill>
        <Bg kind="black" />
        <Txt words={kw("fara1", { color: { 0: MINT_INK } })} size={170} on="black" />
      </AbsoluteFill>
    );
  }
  // a stress chart: jagged spikes that calm into a smooth, slow wave
  const W = 1100;
  const pts: string[] = [];
  for (let i = 0; i <= 220; i++) {
    const x = (i / 220) * W;
    const ph = i * 0.35 - frame * 0.5;
    const spiky = (Math.sin(ph * 3.1) * 0.6 + Math.sin(ph * 7.3) * 0.4) * (i % 9 === 0 ? 2.2 : 1) * 70;
    const smooth = Math.sin(i * 0.06 - frame * 0.08) * 26;
    pts.push(`${x.toFixed(1)},${lerp(spiky, smooth, calm).toFixed(1)}`);
  }
  const drawIn = ease.outCubic(clamp01((frame - cut) / 12));
  return (
    <AbsoluteFill>
      <Bg kind="green" />
      <svg width={W} height={300} viewBox={`0 -150 ${W} 300`} style={{ position: "absolute", left: CX - W / 2, top: CY - 380, overflow: "visible" }}>
        <polyline points={pts.join(" ")} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${drawIn} 1`} style={{ filter: "blur(6px)" }} />
        <polyline points={pts.join(" ")} fill="none" stroke="#ffffff" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${drawIn} 1`} />
        <circle cx={W * drawIn} cy={0} r={12 + 4 * Math.sin(frame / 3)} fill="#fff" opacity={drawIn < 1 ? 1 : 0} />
      </svg>
      <div style={{ position: "absolute", left: CX + 470, top: CY - 420, display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 999, background: "rgba(6,48,31,0.25)", opacity: drawIn }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: calm > 0.5 ? "#fff" : "#ff5a50" }} />
        <Label size={26} color="#fff" weight={500}>
          {calm > 0.5 ? "Calm" : "Stres"}
        </Label>
      </div>
      <Txt words={kw("fara2", { color: { 0: ["#06301f", "#021a10"] } })} size={190} on="green" y={CY + 150} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B8: the beat montage — every kind of help, one per beat, landing on the mark
const MBG: BgKind[] = ["white", "black", "green", "deep", "white"];
const MONTAGE_N = 5;

const B8: React.FC = () => {
  const frame = useCurrentFrame();
  const k0 = Math.ceil((B7_END - D0) / BEATS);
  if (frame >= bt(k0 + MONTAGE_N)) return <Slam from={bt(k0 + MONTAGE_N)} />;
  const k = beatAt(frame) - k0;
  const i = Math.max(0, Math.min(MONTAGE_N - 1, k));
  const at = bt(k0 + i);
  const bg = MBG[i];
  const s = SERVICES[i];
  const p = ease.outBack(clamp01((frame - at) / 8));
  const sc = punch(frame, at, 0.14, 10);
  const ink = bg === "white" ? P.ink : "#ffffff";
  return (
    <AbsoluteFill>
      <Bg kind={bg} />
      {/* the previous ones stack up behind, faded */}
      {SERVICES.slice(0, i).map((q, j) => (
        <div key={j} style={{ position: "absolute", left: CX + (j - i) * 230 - 90, top: CY - 210, opacity: 0.25, transform: `scale(${0.7})` }}>
          <ServiceTile name={q.icon} size={180} tone={bg === "green" ? "white" : "green"} />
        </div>
      ))}
      <div style={{ position: "absolute", left: CX - 150, top: CY - 260, transform: `scale(${p * sc}) rotate(${(1 - p) * -18}deg)` }}>
        <ServiceTile name={s.icon} size={300} tone={bg === "green" ? "white" : bg === "white" ? "green" : "green"} />
      </div>
      <div style={{ position: "absolute", left: CX, top: CY + 180, transform: `translate(-50%, -50%) translateY(${(1 - p) * 40}px)`, opacity: clamp01(p * 1.5) }}>
        <Label size={110} color={ink}>
          {s.label}
        </Label>
      </div>
    </AbsoluteFill>
  );
};

export const ACT2: React.FC = () => (
  <>
    <Win from={D0} to={B1_END}>
      <B1 />
      <Explosion at={D0} cx={960} cy={570} />
    </Win>
    <Win from={B1_END} to={B2_END}>
      <B2 />
    </Win>
    <Win from={B2_END} to={B3_END}>
      <B3 />
    </Win>
    <Win from={B3_END} to={B4_END}>
      <B4 />
    </Win>
    <Win from={B4_END} to={B5_END}>
      <B5 />
    </Win>
    <Win from={B5_END} to={B6_END}>
      <B6 />
    </Win>
    <Win from={B6_END} to={B7_END}>
      <B7 />
    </Win>
    <Win from={B7_END} to={BRIDGE}>
      <B8 />
    </Win>
  </>
);
