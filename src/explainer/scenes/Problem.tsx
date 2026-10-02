import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { textWidth } from "../components/AppleText";
import { IconTile } from "../components/Icons";
import { INK_DARK, KineticText, SHADOW_DARK } from "../components/KineticText";
import { ACCENT, PhraseSeq } from "../components/Phrase";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease, lerp, mixColor } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, FONT } from "../theme";
import { f, MUSIC_LIFT_FRAME, VO } from "../timing";

/**
 * Problem half on a dark set:
 *   the opening lines are tracked by a camera that drops from phrase to phrase (tilt + motion blur),
 *   each lands with a light streak; "obositoare" sags letter by letter → one move onto a snoozed
 *   reminder (a tap on "Amână" on every syllable, the snoozed copies piling up) → a notebook takes
 *   over: a page per chore with the camera leaning in, then the pages riffle forward fast → the
 *   notebook collapses into the centre where the handly logo takes over.
 */

const LEAD = 3;
const hw = (i: number) => f(VO.hook[i][1]) - LEAD;
const TAPS = VO.postponeSyllables.map((s) => f(s) - 1);
const WHEN = ["Azi, 18:00", "Mâine", "Joi", "Weekendul ăsta", "Săptămâna viitoare", "Luna viitoare", "Cândva…"];
const CHORES = [
  { words: [["Robinet", 5.55], ["care", 5.95], ["curge", 6.2]] as [string, number][], days: 14, day: "Joi", date: 24, month: "Octombrie" },
  { words: [["Dulap", 7.13], ["de", 7.5], ["montat", 7.62]] as [string, number][], days: 31, day: "Luni", date: 10, month: "Noiembrie" },
  { words: [["Perete", 8.65], ["de", 9.05], ["zugrăvit", 9.18]] as [string, number][], days: 92, day: "Vineri", date: 23, month: "Ianuarie" },
];
const arrive = (i: number) => f(VO.chores[i]) - LEAD;
const END = f(VO.choresEnd);
const PAN = f(VO.hookEnd) - 8;
const NOTE_OUT = f(VO.postponeEnd) - 2;
const RIFFLE_FROM = END - 2;
const RIFFLE_TO = MUSIC_LIFT_FRAME - 14;
const COLLAPSE = MUSIC_LIFT_FRAME - 14;

// ---------------------------------------------------------------- notebook pages
type Page = { day: string; date: number; month: string; chore?: number; text?: string };
const MONTHS = ["Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie"];
const RIFFLE = Array.from({ length: Math.floor((RIFFLE_TO - RIFFLE_FROM) / 2) + 1 }, (_, i) => RIFFLE_FROM + i * 2);
const PAGES: Page[] = [
  { day: "Luni", date: 14, month: "Octombrie", text: "Treaba aia" },
  ...CHORES.map((c, i) => ({ day: c.day, date: c.date, month: c.month, chore: i })),
  ...RIFFLE.map((_, i) => ({ day: ["Marți", "Joi", "Sâmbătă", "Luni"][i % 4], date: 3 + ((i * 7) % 25), month: MONTHS[i % MONTHS.length], chore: i % 3 })),
];
const FLIPS: { at: number; d: number }[] = [...CHORES.map((_, i) => ({ at: arrive(i) - 7, d: 9 })), ...RIFFLE.map((at) => ({ at, d: 6 }))];

const PageFace: React.FC<{ page: Page; w: number; h: number; frame: number; live: boolean }> = ({ page, w, h, frame, live }) => {
  const c = page.chore !== undefined ? CHORES[page.chore] : null;
  const a = c && live ? arrive(page.chore!) : -999;
  const count = c ? (live ? Math.round(1 + (c.days - 1) * ease.outCubic(clamp01((frame - a - 12) / 22))) : c.days) : 0;
  const sub = live ? ease.outCubic(clamp01((frame - a - 12) / 10)) : 1;
  const pad = w * 0.11;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, fontWeight: BOLD, color: "#0c1511", overflow: "hidden", borderRadius: "4px 18px 18px 4px", background: "linear-gradient(90deg, #e6e9e7 0%, #f9faf9 7%, #ffffff 100%)" }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: pad, right: pad, top: h * 0.42 + i * h * 0.068, height: 2, background: "rgba(16,40,28,0.06)" }} />
      ))}
      <div style={{ position: "absolute", left: pad, top: h * 0.07, fontSize: w * 0.04, letterSpacing: "0.12em", color: "rgba(12,21,17,0.4)" }}>{page.day.toUpperCase()}</div>
      <div style={{ position: "absolute", left: pad - w * 0.01, top: h * 0.1, fontSize: w * 0.26, letterSpacing: "-0.05em", lineHeight: 1 }}>{page.date}</div>
      <div style={{ position: "absolute", left: pad, top: h * 0.3, fontSize: w * 0.05, color: "#00a352", letterSpacing: "-0.01em" }}>{page.month}</div>
      <div style={{ position: "absolute", left: pad, top: h * 0.445, width: w * 0.075, height: w * 0.075, borderRadius: "50%", border: `${Math.max(3, w * 0.007)}px solid rgba(12,21,17,0.25)`, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: pad + w * 0.11, top: h * 0.43 }}>
        {c && live ? (
          <KineticText words={c.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={w * 0.085} ink={["#2a3530", "#060908"]} tint={["#2be38a", "#00964d"]} shadow="none" style={{ letterSpacing: "-0.035em", alignItems: "flex-start" }} />
        ) : (
          <div style={{ fontSize: w * 0.085, letterSpacing: "-0.035em", lineHeight: 1.22 }}>{c ? c.words.map(([t]) => t).join(" ") : page.text}</div>
        )}
      </div>
      <div style={{ position: "absolute", left: pad + w * 0.11, top: h * 0.43 + w * 0.12, fontSize: w * 0.042, color: "rgba(12,21,17,0.42)", opacity: sub }}>
        {c ? (
          <>
            Amânat de <span style={{ color: "#00a352" }}>{count} zile</span>
          </>
        ) : (
          "Mutat pe mâine"
        )}
      </div>
    </div>
  );
};

const ODD_JOBS = [
  ["Bec hol", "Raft baie", "Ușă scârțâie"],
  ["Priză bucătărie", "Silicon cadă", "Jaluzele"],
  ["Calorifer", "Mâner geam", "Gresie crăpată"],
];

/** the left-hand page: a mini month with the slipped days marked, a few other odd jobs, a sticky note */
const LeftFace: React.FC<{ w: number; h: number; idx?: number }> = ({ w, h, idx = 0 }) => {
  const pad = w * 0.11;
  const cell = (w - pad * 2) / 7;
  const jobs = ODD_JOBS[idx % ODD_JOBS.length];
  const marked = new Set([3 + (idx % 4), 9 + (idx % 3), 10 + (idx % 3), 16 + (idx % 5), 23, 24 + (idx % 2)]);
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: "18px 4px 4px 18px", background: "linear-gradient(270deg, #e3e7e5 0%, #f7f9f8 8%, #ffffff 100%)", overflow: "hidden", fontFamily: FONT, fontWeight: BOLD }}>
      <div style={{ position: "absolute", left: pad, top: h * 0.07, fontSize: w * 0.04, letterSpacing: "0.12em", color: "rgba(12,21,17,0.4)" }}>{["OCTOMBRIE", "NOIEMBRIE", "DECEMBRIE", "IANUARIE"][idx % 4]}</div>
      {/* mini month */}
      {Array.from({ length: 31 }, (_, d) => {
        const col = (d + 2) % 7;
        const row = Math.floor((d + 2) / 7);
        const on = marked.has(d + 1);
        return (
          <div key={d} style={{ position: "absolute", left: pad + col * cell, top: h * 0.13 + row * cell * 0.82, width: cell, height: cell * 0.82, display: "flex", alignItems: "center", justifyContent: "center", fontSize: w * 0.034, color: on ? "#ffffff" : "rgba(12,21,17,0.45)" }}>
            {on && <div style={{ position: "absolute", width: cell * 0.62, height: cell * 0.62, borderRadius: "50%", background: "rgba(0,163,82,0.85)" }} />}
            <span style={{ position: "relative" }}>{d + 1}</span>
          </div>
        );
      })}
      {/* other odd jobs, also waiting */}
      <div style={{ position: "absolute", left: pad, top: h * 0.56, fontSize: w * 0.034, letterSpacing: "0.1em", color: "rgba(12,21,17,0.35)" }}>ȘI ALTE TREBURI</div>
      {jobs.map((j, i) => (
        <div key={j} style={{ position: "absolute", left: pad, top: h * 0.61 + i * h * 0.068, display: "flex", alignItems: "center", gap: w * 0.03, fontSize: w * 0.045, color: "rgba(12,21,17,0.7)" }}>
          <div style={{ width: w * 0.045, height: w * 0.045, borderRadius: 6, border: "3px solid rgba(12,21,17,0.22)", boxSizing: "border-box" }} />
          {j}
        </div>
      ))}
      {/* sticky note */}
      <div style={{ position: "absolute", right: pad * 0.7, bottom: h * 0.06, width: w * 0.36, height: w * 0.3, background: "linear-gradient(180deg, #dff7e9 0%, #cdf0dc 100%)", boxShadow: "0 10px 20px rgba(16,40,28,0.12)", transform: `rotate(${idx % 2 ? 4 : -3}deg)`, padding: w * 0.035, boxSizing: "border-box", fontSize: w * 0.042, color: "#0b6b3d", lineHeight: 1.25 }}>
        Sună un meșter?
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- set + small UI bits
/** dark set: near-black, one soft green light from the top, a faint grid that drifts with the camera */
const DarkSet: React.FC<{ shift: number }> = ({ shift }) => {
  const L = useLayout();
  const cell = L.vertical ? 90 : 96;
  const grid = "rgba(160,255,200,0.045)";
  const mask = `radial-gradient(ellipse ${L.vertical ? "95% 60%" : "70% 85%"} at 50% 50%, #000 30%, transparent 100%)`;
  return (
    <AbsoluteFill style={{ background: "#030504" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse ${L.vertical ? "90% 45%" : "55% 70%"} at 50% -8%, rgba(0,191,99,0.26) 0%, rgba(0,140,72,0.09) 38%, rgba(0,0,0,0) 72%)` }} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${grid} 1.5px, transparent 1.5px), linear-gradient(90deg, ${grid} 1.5px, transparent 1.5px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${(L.W / 2 - shift) % cell}px ${(L.H / 2) % cell}px`,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", opacity: 0.05, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

const Touch: React.FC<{ frame: number; at: number; x: number; y: number }> = ({ frame, at, x, y }) => {
  const t = frame - at;
  if (t < -5 || t > 8) return null;
  const inA = ease.outCubic(clamp01((t + 5) / 4));
  const outA = 1 - ease.inCubic(clamp01((t - 3) / 5));
  const press = t >= 0 && t < 4 ? 1 - 0.16 * Math.sin((t / 4) * Math.PI) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 34,
        top: y - 34,
        width: 68,
        height: 68,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.22)",
        border: "2.5px solid rgba(255,255,255,0.75)",
        opacity: inA * outA,
        transform: `scale(${(0.8 + 0.2 * inA) * press})`,
      }}
    />
  );
};

const Roll: React.FC<{ frame: number; values: string[]; changes: number[]; style?: React.CSSProperties }> = ({ frame, values, changes, style }) => {
  const k = changes.filter((c) => frame >= c).length;
  const p = k ? ease.outCubic(clamp01((frame - changes[k - 1]) / 6)) : 1;
  return (
    <span style={{ position: "relative", display: "inline-block", overflow: "hidden", verticalAlign: "bottom", ...style }}>
      <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 100}%)`, opacity: p }}>{values[Math.min(values.length - 1, k)]}</span>
      {k > 0 && p < 1 && <span style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${-p * 100}%)`, opacity: 1 - p }}>{values[k - 1]}</span>}
    </span>
  );
};

/**
 * A dial of dates (Visa-reference clock): 31 days around a ring with fine ticks. On every syllable of
 * "pe care o tot amâni?" the ring clicks one day forward under the marker at the top — the day keeps
 * slipping. The question sits in the middle of it.
 */
const DateRing: React.FC<{ frame: number; R: number; inA: number; outA: number }> = ({ frame, R, inA, outA }) => {
  const N = 31;
  const step = 360 / N;
  const START = 14;
  let day = START;
  TAPS.forEach((t) => (day += ease.outBack(clamp01((frame - t) / 6), 1.4)));
  const rot = -(day - 1) * step - frame * 0.06;
  const sel = Math.round(day);
  const slipped = day - START; // days postponed so far
  // the green arc trails back from the marker over every day that slipped by
  const arcR = R * 0.84;
  const arcA = (slipped * step * Math.PI) / 180;
  const arc = `M 0 ${-arcR} A ${arcR} ${arcR} 0 ${arcA > Math.PI ? 1 : 0} 0 ${-Math.sin(arcA) * arcR} ${-Math.cos(arcA) * arcR}`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: inA * (1 - outA), transform: `scale(${(0.85 + 0.15 * inA) * (1 + 0.6 * outA)})`, filter: outA > 0 ? `blur(${outA * 14}px)` : undefined }}>
      {/* dark glass disc */}
      <div style={{ position: "absolute", left: -R * 0.78, top: -R * 0.78, width: R * 1.56, height: R * 1.56, borderRadius: "50%", background: "radial-gradient(circle at 50% 30%, rgba(40,58,50,0.55) 0%, rgba(10,16,13,0.85) 70%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 60px rgba(0,191,99,0.08), 0 40px 90px rgba(0,0,0,0.6)" }} />
      <svg width={R * 2.6} height={R * 2.6} viewBox={`${-R * 1.3} ${-R * 1.3} ${R * 2.6} ${R * 2.6}`} style={{ position: "absolute", left: -R * 1.3, top: -R * 1.3, overflow: "visible" }}>
        <defs>
          <linearGradient id="dr-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b9ffd6" />
            <stop offset="100%" stopColor="#00c46a" />
          </linearGradient>
        </defs>
        <circle r={R * 0.84} fill="none" stroke="rgba(160,255,200,0.08)" strokeWidth={10} />
        {slipped > 0.02 && (
          <>
            <path d={arc} fill="none" stroke="#00e676" strokeWidth={22} strokeLinecap="round" opacity={0.35} style={{ filter: "blur(10px)" }} />
            <path d={arc} fill="none" stroke="url(#dr-arc)" strokeWidth={10} strokeLinecap="round" />
          </>
        )}
        <g transform={`rotate(${rot})`}>
          {Array.from({ length: N * 4 }, (_, i) => {
            const a = (i / (N * 4)) * Math.PI * 2 - Math.PI / 2;
            const major = i % 4 === 0;
            const reveal = clamp01(inA * 1.6 - (i / (N * 4)) * 0.6);
            return <line key={i} x1={Math.cos(a) * R * 0.9} y1={Math.sin(a) * R * 0.9} x2={Math.cos(a) * R * (major ? 0.96 : 0.93)} y2={Math.sin(a) * R * (major ? 0.96 : 0.93)} stroke={major ? "rgba(220,255,236,0.5)" : "rgba(220,255,236,0.16)"} strokeWidth={major ? 3 : 2} strokeLinecap="round" opacity={reveal} />;
          })}
          {Array.from({ length: N }, (_, i) => {
            const n = i + 1;
            const a = (i / N) * Math.PI * 2 - Math.PI / 2;
            // fisheye: numbers near the marker at the top are larger and brighter
            const screenA = ((((i / N) * 360 + rot) % 360) + 540) % 360 - 180;
            const near = Math.max(0, 1 - Math.abs(screenA) / 70);
            const on = n === sel;
            const reveal = clamp01(inA * 1.6 - (i / N) * 0.6);
            const x = Math.cos(a) * R * 1.06;
            const y = Math.sin(a) * R * 1.06;
            return (
              <text key={n} x={x} y={y} transform={`rotate(${-rot} ${x} ${y})`} textAnchor="middle" dominantBaseline="central" fontFamily="Inter" fontWeight={700} fontSize={R * (0.065 + 0.045 * near)} fill={on ? "#ffffff" : `rgba(220,255,236,${0.22 + 0.4 * near})`} opacity={on ? 0 : reveal}>
                {n}
              </text>
            );
          })}
        </g>
        {/* marker: a pill at the top showing the day it's slipped to */}
        <g opacity={inA}>
          <rect x={-R * 0.17} y={-R * 1.06 - R * 0.085} width={R * 0.34} height={R * 0.17} rx={R * 0.085} fill="#00c46a" style={{ filter: "drop-shadow(0 8px 20px rgba(0,196,106,0.45))" }} />
          <text x={0} y={-R * 1.06} textAnchor="middle" dominantBaseline="central" fontFamily="Inter" fontWeight={700} fontSize={R * 0.085} fill="#ffffff">
            {sel} Oct
          </text>
          <circle cx={0} cy={-R * 0.84} r={9} fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};

/** a soft streak of light that sweeps across a line once it has landed (only lights the letters) */
const Streak: React.FC<{ frame: number; at: number }> = ({ frame, at }) => {
  const p = clamp01((frame - at) / 16);
  if (p <= 0 || p >= 1) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-20%", bottom: "-20%", left: `${lerp(10, 90, ease.inOutCubic(p)) - 9}%`, width: "18%", transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(190,255,215,0) 0%, rgba(190,255,215,1) 50%, rgba(190,255,215,0) 100%)" }} />
    </AbsoluteFill>
  );
};

/** "obositoare": rises in like every other word, then sags letter by letter — tired */
const Tired: React.FC<{ frame: number; at: number; sag: number; fs: number }> = ({ frame, at, sag, fs }) => {
  const letters = Array.from("obositoare");
  return (
    <div style={{ display: "flex", fontFamily: FONT, fontWeight: BOLD, fontSize: fs, letterSpacing: "-0.04em", lineHeight: 1.22, filter: `drop-shadow(0 0 28px rgba(0,191,99,0.25))${frame - at < 12 ? ` blur(${(1 - ease.outCubic(clamp01((frame - at) / 12))) * fs * 0.08}px)` : ""}` }}>
      {letters.map((ch, i) => {
        const l = frame - at - i * 0.55;
        const e = ease.outExpo(clamp01(l / 13));
        const wave = Math.sin(i * 0.85) * 0.16 + 0.42;
        const d = ease.outBack(clamp01((frame - sag - i * 1.3) / 12), 2.2);
        const drop = d * (0.05 + 0.045 * ((i * 7) % 3)) * fs;
        const rot = d * (i % 2 ? 1 : -1) * (5 + 3 * ((i * 5) % 4));
        const c = clamp01((l - 3) / 13);
        const tired = ease.inOutCubic(clamp01((frame - sag - i * 1.3) / 14));
        // green while landing → white → a tired, faded grey-green as it sags
        const top = tired > 0 ? mixColor(INK_DARK[0], "#7f948a", tired) : mixColor(ACCENT[0], INK_DARK[0], c);
        const bottom = tired > 0 ? mixColor(INK_DARK[1], "#4d5f56", tired) : mixColor(ACCENT[1], INK_DARK[1], c);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: clamp01(l / 4),
              transform: `translateY(${(1 - e) * wave * fs + drop}px) rotate(${(1 - e) * Math.sin(i * 1.7) * 12 + rot}deg)`,
              transformOrigin: "50% 90%",
              backgroundImage: `linear-gradient(180deg, ${top} 10%, ${bottom} 90%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const SMALL = V ? 70 : 74;
  const HUGE = V ? 230 : 400;

  // ---------------------------------------------------------------- opening lines: a camera that drops from line to line
  const SPAN = L.W * 1.1;
  const panAt = (fr: number) => ease.inOutCubic(clamp01((fr - PAN) / 16));
  const pan = panAt(frame);
  const panBlur = Math.min(40, Math.abs(pan - panAt(frame - 1)) * SPAN * 0.18);
  // ---------------------------------------------------------------- reminder
  const NW = 900;
  const NH = 196;
  const notifIn = ease.outExpo(clamp01((frame - (PAN + 6)) / 18));
  const notifOut = ease.inCubic(clamp01((frame - NOTE_OUT) / 10));
  const taps = TAPS.filter((t) => frame >= t).length;
  const RING_Y = V ? 0 : 20;
  const notification = (depth: number, label: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: -NW / 2,
        top: -NH / 2,
        width: NW,
        height: NH,
        borderRadius: 40,
        background: "linear-gradient(180deg, rgba(34,40,38,0.97) 0%, rgba(22,26,25,0.97) 100%)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
        transform: `translateY(${-depth * 30}px) scale(${1 - depth * 0.06})`,
        opacity: depth < 0.01 ? 1 : Math.max(0, 1 - depth * 0.28),
        fontFamily: FONT,
        fontWeight: BOLD,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 30px",
        boxSizing: "border-box",
      }}
    >
      <IconTile name="bell" color="green" size={NH * 0.46} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: NH * 0.12, color: "rgba(220,240,230,0.45)", letterSpacing: "0.06em" }}>
          <span>MEMENTO</span>
          <span style={{ letterSpacing: 0 }}>acum</span>
        </div>
        <div style={{ fontSize: NH * 0.19, color: "#f2fff8", letterSpacing: "-0.02em" }}>Treaba aia de prin casă</div>
        <div style={{ fontSize: NH * 0.13, color: "rgba(220,240,230,0.5)" }}>
          Programat: {depth < 0.01 ? <Roll frame={frame} values={WHEN} changes={TAPS} style={{ color: "#2be38a" }} /> : <span style={{ color: "#2be38a" }}>{WHEN[label]}</span>}
        </div>
      </div>
      <div style={{ padding: `${NH * 0.07}px ${NH * 0.14}px`, borderRadius: 999, background: "rgba(255,255,255,0.09)", fontSize: NH * 0.12, color: "#f2fff8", transform: `scale(${TAPS.some((t) => frame >= t && frame < t + 4) ? 0.92 : 1})` }}>Amână</div>
    </div>
  );

  // ---------------------------------------------------------------- notebook
  const PGW = V ? 520 : 560;
  const PGH = V ? 740 : 700;
  const planIn = ease.outExpo(clamp01((frame - (NOTE_OUT + 2)) / 20));
  const collapse = ease.inOutCubic(clamp01((frame - COLLAPSE) / 10));
  const flipsStarted = FLIPS.filter((fl) => frame >= fl.at).length;
  const current = Math.min(PAGES.length - 1, flipsStarted);
  type Cam = { s: number; x: number; y: number };
  const base: Cam = V ? { s: 1.5, x: PGW / 2, y: 0 } : { s: 1, x: 0, y: 0 };
  const lean: Cam = V ? { s: 1.95, x: PGW * 0.5, y: -PGH * 0.02 } : { s: 1.55, x: PGW * 0.46, y: -PGH * 0.02 };
  const camAt = (fr: number): Cam => {
    const c = { ...base };
    CHORES.forEach((_, i) => {
      const into = ease.inOutCubic(clamp01((fr - (arrive(i) + 1)) / 12));
      const back = ease.inOutCubic(clamp01((fr - ((i < 2 ? arrive(i + 1) : END) - 11)) / 9));
      const k = into * (1 - back);
      c.s = lerp(c.s, lean.s, k);
      c.x = lerp(c.x, lean.x, k);
      c.y = lerp(c.y, lean.y, k);
    });
    return c;
  };
  const cam = camAt(frame);
  const camPrev = camAt(frame - 1);
  const camBlur = Math.min(24, Math.hypot(cam.x - camPrev.x, cam.y - camPrev.y) * cam.s * 0.25 + Math.abs(cam.s - camPrev.s) * 120);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, opacity: ease.inOutCubic(clamp01(frame / 14)) }}>
        <DarkSet shift={pan * SPAN * 0.3} />
      </div>
      <DirBlur x={panBlur} style={{ position: "absolute", inset: 0 }}>
        {/* opening lines — small, calm type that builds word by word; one word goes huge */}
        {pan < 1 && (
          <AbsoluteFill style={{ transform: `translateX(${-pan * SPAN}px)` }}>
            {/* "Te tot gândești la treaba aia" builds on one small line */}
            {(() => {
              const out = hw(6) - 4;
              const t = clamp01((frame - out) / 6);
              if (t >= 1) return null;
              const k = 1 - ease.outExpo(clamp01((frame - (hw(0) - 1)) / 14));
              return (
                <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${(1 + 0.06 * k) * (1 + 0.5 * ease.inCubic(t))})`, opacity: 1 - ease.inCubic(t), filter: t > 0 ? `blur(${t * 18}px)` : undefined }}>
                  <KineticText words={[0, 1, 2, 3, 4, 5].map((i) => ({ text: VO.hook[i][0], at: hw(i), color: i === 2 ? ACCENT : undefined }))} fontSize={SMALL} breaks={V ? [2] : []} ink={INK_DARK} tint={ACCENT} shadow={SHADOW_DARK} style={{ letterSpacing: "-0.035em" }} />
                </AbsoluteFill>
              );
            })()}
            {/* "obositoare" punches in huge, cropped by the frame — then a hard match cut to the next line */}
            {(() => {
              const at = hw(6);
              const cut = hw(7) - 1;
              if (frame < at - 2 || frame >= cut) return null;
              const z = ease.outExpo(clamp01((frame - (at - 2)) / 12));
              return (
                <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${0.25 + 0.75 * z})`, opacity: clamp01(z * 3), filter: z < 0.9 ? `blur(${(1 - z) * 16}px)` : undefined }}>
                  <KineticText words={[{ text: VO.hook[6][0], at, color: ACCENT }]} fontSize={HUGE} ink={INK_DARK} tint={ACCENT} shadow={SHADOW_DARK} style={{ letterSpacing: "-0.05em" }} />
                </AbsoluteFill>
              );
            })()}
            {/* "prin casă…" small again, the dots hopping */}
            {(() => {
              const at = hw(7);
              if (frame < at - 1) return null;
              const k = 0;
              const w2 = textWidth("prin casă", SMALL, -0.035);
              return (
                <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${1 + 0.08 * k})` }}>
                  <div style={{ position: "relative" }}>
                    <KineticText words={[{ text: "prin", at: at - 12 }, { text: "casă", at: hw(8) }]} fontSize={SMALL} ink={INK_DARK} tint={ACCENT} shadow={SHADOW_DARK} style={{ letterSpacing: "-0.035em" }} />
                    <div style={{ position: "absolute", left: w2 + SMALL * 0.08, bottom: SMALL * 0.26, display: "flex", gap: SMALL * 0.1 }}>
                      {[0, 1, 2].map((d) => {
                        const local = frame - (hw(8) + 8) - d * 3;
                        const a = ease.outCubic(clamp01(local / 6));
                        const hop = local > 4 ? Math.max(0, Math.sin(((local - 4) / 15) * Math.PI * 2)) : 0;
                        return <div key={d} style={{ width: SMALL * 0.12, height: SMALL * 0.12, borderRadius: "50%", background: "linear-gradient(180deg, #ffffff, #b4c4bb)", opacity: a, transform: `translateY(${-hop * SMALL * 0.2}px) scale(${0.3 + 0.7 * a})` }} />;
                      })}
                    </div>
                  </div>
                </AbsoluteFill>
              );
            })()}
          </AbsoluteFill>
        )}

        {/* the UI, arriving with the camera */}
        {pan > 0 && collapse < 1 && (
          <AbsoluteFill style={{ transform: `translateX(${(1 - pan) * SPAN}px)` }}>
            {notifOut < 1 && (
              <div style={{ position: "absolute", left: L.cx, top: L.cy + RING_Y }}>
                <DateRing frame={frame} R={V ? 420 : 380} inA={notifIn} outA={notifOut} />
              </div>
            )}
            <PhraseSeq
              fontSize={V ? 84 : 80}
              y={RING_Y}
              phrases={[{ words: VO.postpone.map(([text, sec]) => ({ text, at: f(sec) - LEAD, color: text.startsWith("amâni") ? ACCENT : undefined })), out: NOTE_OUT - 4, breaks: [2] }]}
            />
            {/* the notebook */}
            {planIn > 0 && (
              <DirBlur x={camBlur} style={{ position: "absolute", inset: 0, opacity: 1 - collapse, filter: collapse > 0 ? `blur(${collapse * 16}px)` : undefined }}>
                <div style={{ position: "absolute", left: L.cx, top: L.cy + (V ? 90 : 70), perspective: 2600, transform: `translateY(${(1 - planIn) * L.H * 0.6}px) scale(${(0.92 + 0.08 * planIn) * (1 - 0.75 * collapse)})` }}>
                  <div style={{ transformStyle: "preserve-3d", transform: `scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px) rotateX(${lerp(40, 12, planIn) * (1 - 0.6 * clamp01((cam.s - base.s) / (lean.s - base.s)))}deg)` }}>
                    <div style={{ position: "absolute", left: -PGW * 2, top: -PGH, width: PGW * 4, height: PGH * 2, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,191,99,0.12) 0%, rgba(0,0,0,0) 60%)" }} />
                    <div style={{ position: "absolute", left: -PGW - 26, top: -PGH / 2 - 22, width: PGW * 2 + 52, height: PGH + 44, borderRadius: 26, background: "linear-gradient(180deg, #13734a 0%, #0a4f32 100%)", boxShadow: "0 60px 110px rgba(0,0,0,0.6), 0 14px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)" }} />
                    {[3, 2, 1].map((k) => (
                      <div key={k} style={{ position: "absolute", left: -PGW - 6 + k * 2, top: -PGH / 2 - 6 + k * 2, width: PGW * 2 + 12 - k * 4, height: PGH + 12 - k * 2, borderRadius: 18, background: k % 2 ? "#dfe4e1" : "#eef1ef" }} />
                    ))}
                    <div style={{ position: "absolute", left: -PGW, top: -PGH / 2, width: PGW, height: PGH }}>
                      <LeftFace w={PGW} h={PGH} idx={flipsStarted} />
                    </div>
                    <div style={{ position: "absolute", left: 0, top: -PGH / 2, width: PGW, height: PGH }}>
                      <PageFace page={PAGES[current]} w={PGW} h={PGH} frame={frame} live={PAGES[current].chore !== undefined && current <= CHORES.length} />
                      {FLIPS.map((fl, j) => {
                        const p = clamp01((frame - fl.at) / fl.d);
                        if (p <= 0 || p >= 1) return null;
                        return <div key={j} style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(10,40,25,${0.22 * Math.sin(Math.PI * p)}) 0%, rgba(10,40,25,0) 60%)` }} />;
                      })}
                    </div>
                    {FLIPS.map((fl, j) => {
                      const p = ease.inOutCubic(clamp01((frame - fl.at) / fl.d));
                      if (p <= 0 || p >= 1) return null;
                      return (
                        <div key={j} style={{ position: "absolute", left: 0, top: -PGH / 2, width: PGW, height: PGH, transformOrigin: "0% 50%", transformStyle: "preserve-3d", transform: `rotateY(${-180 * p}deg)` }}>
                          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
                            <PageFace page={PAGES[j]} w={PGW} h={PGH} frame={frame} live={false} />
                            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(10,40,25,${0.18 * p}) 0%, rgba(255,255,255,0) 100%)` }} />
                          </div>
                          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                            <LeftFace w={PGW} h={PGH} idx={j + 1} />
                            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(270deg, rgba(10,40,25,${0.18 * (1 - p)}) 0%, rgba(255,255,255,0) 100%)` }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ position: "absolute", left: -22, top: -PGH / 2, width: 44, height: PGH, background: "linear-gradient(90deg, rgba(10,40,25,0) 0%, rgba(10,40,25,0.16) 50%, rgba(10,40,25,0) 100%)" }} />
                  </div>
                </div>
              </DirBlur>
            )}
          </AbsoluteFill>
        )}
      </DirBlur>
    </AbsoluteFill>
  );
};
