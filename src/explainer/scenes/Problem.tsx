import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { textWidth } from "../components/AppleText";
import { INK, KineticText, SHADOW } from "../components/KineticText";
import { ACCENT_LIGHT, PhraseSeq } from "../components/Phrase";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease, lerp, pop, seeded } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, FONT } from "../theme";
import { f, MUSIC_LIFT_FRAME, VO } from "../timing";

/**
 * Problem half on a clean white set (slow white-green gradient + quiet grid):
 *   big kinetic phrases (same animation as "Postezi.") → a paper planner rises in and its pages keep
 *   flipping to the next day on every syllable of "pe care o tot amâni?" → it flips to a page per
 *   chore while the camera leans in on the line being written → the planner slips away, the green
 *   orb appears and pulls every particle in, charges, and bursts into the dark half on the drop.
 */

const LEAD = 3;
const hw = (i: number) => f(VO.hook[i][1]) - LEAD;
const DROP = MUSIC_LIFT_FRAME;
const HOPS = VO.postponeSyllables.map((s) => f(s) - 1);
const CHORES = [
  { words: [["Robinet", 5.55], ["care", 5.95], ["curge", 6.2]] as [string, number][], days: 14, day: "Joi", date: 24, month: "Octombrie" },
  { words: [["Dulap", 7.13], ["de", 7.5], ["montat", 7.62]] as [string, number][], days: 31, day: "Luni", date: 10, month: "Noiembrie" },
  { words: [["Perete", 8.65], ["de", 9.05], ["zugrăvit", 9.18]] as [string, number][], days: 92, day: "Vineri", date: 23, month: "Ianuarie" },
];
const arrive = (i: number) => f(VO.chores[i]) - LEAD;
const END = f(VO.choresEnd);
const FLY = END + 4;
const PLAN_IN = f(VO.hookEnd) - 6;
const FD = 9; // page-flip duration
const DAYS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

type Page = { day: string; date: number; month: string; chore?: number };
const PAGES: Page[] = [
  ...Array.from({ length: HOPS.length + 1 }, (_, i) => ({ day: DAYS[(i + 1) % 7], date: 14 + i, month: "Octombrie" })),
  ...CHORES.map((c, i) => ({ day: c.day, date: c.date, month: c.month, chore: i })),
];
const FLIPS = [...HOPS, ...CHORES.map((_, i) => arrive(i) - 7)];

/** one planner page (right-hand side) */
const PageFace: React.FC<{ page: Page; w: number; h: number; frame: number; live: boolean }> = ({ page, w, h, frame, live }) => {
  const c = page.chore !== undefined ? CHORES[page.chore] : null;
  const a = c ? arrive(page.chore!) : 0;
  const count = c ? Math.round(1 + (c.days - 1) * ease.outCubic(clamp01((frame - a - 12) / 22))) : 0;
  const sub = c ? ease.outCubic(clamp01((frame - a - 12) / 10)) : 1;
  const pad = w * 0.11;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, fontWeight: BOLD, color: "#0c1511", overflow: "hidden", borderRadius: "4px 18px 18px 4px", background: "linear-gradient(90deg, #ecefed 0%, #fbfcfb 7%, #ffffff 100%)" }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: pad, right: pad, top: h * 0.42 + i * h * 0.068, height: 2, background: "rgba(16,40,28,0.06)" }} />
      ))}
      <div style={{ position: "absolute", left: pad, top: h * 0.07, fontSize: w * 0.04, letterSpacing: "0.12em", color: "rgba(12,21,17,0.4)" }}>{page.day.toUpperCase()}</div>
      <div style={{ position: "absolute", left: pad - w * 0.01, top: h * 0.1, fontSize: w * 0.26, letterSpacing: "-0.05em", lineHeight: 1 }}>{page.date}</div>
      <div style={{ position: "absolute", left: pad, top: h * 0.3, fontSize: w * 0.05, color: "#00a352", letterSpacing: "-0.01em" }}>{page.month}</div>
      <div style={{ position: "absolute", left: pad, top: h * 0.445, width: w * 0.075, height: w * 0.075, borderRadius: "50%", border: `${Math.max(3, w * 0.007)}px solid rgba(12,21,17,0.25)`, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: pad + w * 0.11, top: h * 0.43 }}>
        {c ? (
          live ? (
            <KineticText words={c.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={w * 0.085} ink={INK} tint={ACCENT_LIGHT} shadow="none" style={{ letterSpacing: "-0.035em", alignItems: "flex-start" }} />
          ) : (
            <div style={{ fontSize: w * 0.085, letterSpacing: "-0.035em", lineHeight: 1.22 }}>{c.words.map(([t]) => t).join(" ")}</div>
          )
        ) : (
          <div style={{ fontSize: w * 0.085, letterSpacing: "-0.035em", lineHeight: 1.22, color: "rgba(12,21,17,0.8)" }}>Treaba aia</div>
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

// little hand-drawn doodles for the blank left pages (viewBox 100 × 125)
const G = "#00a352";
const K = "rgba(12,21,17,0.55)";
const DOODLES: React.ReactNode[] = [
  // coffee + zzz
  <g key="0">
    <path d="M30 72 h26 v12 a10 10 0 0 1 -10 10 h-6 a10 10 0 0 1 -10 -10 z" stroke={K} />
    <path d="M56 76 c7 0 7 9 0 9" stroke={K} />
    <path d="M37 64 c-3 -4 3 -6 0 -10 M45 64 c-3 -4 3 -6 0 -10" stroke={G} />
    <path d="M62 44 h8 l-8 8 h8 M72 32 h6 l-6 6 h6" stroke={G} />
    <text x="24" y="30" fontSize="7" fill={K} transform="rotate(-6 24 30)">azi nu…</text>
  </g>,
  // sun, cloud, smiley
  <g key="1">
    <circle cx="30" cy="40" r="8" stroke={G} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return <path key={i} d={`M${30 + Math.cos(a) * 12} ${40 + Math.sin(a) * 12} L${30 + Math.cos(a) * 16} ${40 + Math.sin(a) * 16}`} stroke={G} />;
    })}
    <path d="M52 52 c0 -8 12 -10 15 -3 c6 -3 12 2 10 8 c4 2 2 9 -3 9 h-20 c-6 0 -7 -12 -2 -14 z" stroke={K} />
    <circle cx="50" cy="90" r="10" stroke={K} />
    <circle cx="46.5" cy="88" r="0.8" fill={K} stroke={K} />
    <circle cx="53.5" cy="88" r="0.8" fill={K} stroke={K} />
    <path d="M45.5 93 q4.5 4 9 0" stroke={K} />
  </g>,
  // arrow loop → "mâine?"
  <g key="2">
    <path d="M22 60 c8 -16 30 -18 36 -2 c4 12 -14 18 -14 4 c0 -10 18 -12 30 -4" stroke={G} />
    <path d="M70 54 l5 5 l-7 2" stroke={G} />
    <text x="28" y="88" fontSize="10" fill={K} transform="rotate(-5 28 88)">mâine?</text>
    <path d="M28 92 q20 4 34 -1" stroke={G} />
  </g>,
  // little house + heart
  <g key="3">
    <path d="M28 92 v-22 l18 -15 l18 15 v22 z" stroke={K} />
    <path d="M41 92 v-10 h10 v10" stroke={K} />
    <path d="M46 70 c-3 -4 -9 -1 -6 3 l6 5 l6 -5 c3 -4 -3 -7 -6 -3 z" stroke={G} />
    <path d="M66 40 l2 5 l5 1 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 -1 z" stroke={G} />
  </g>,
  // spiral + stars
  <g key="4">
    <path d="M45 62 c0 -3 4 -3 4 0 c0 5 -8 5 -8 0 c0 -8 12 -8 12 0 c0 11 -16 11 -16 0 c0 -14 20 -14 20 0" stroke={K} />
    <path d="M28 34 l1.5 4 l4 0.5 l-3 2.5 l1 4 l-3.5 -2 l-3.5 2 l1 -4 l-3 -2.5 l4 -0.5 z" stroke={G} />
    <path d="M70 90 l1.5 4 l4 0.5 l-3 2.5 l1 4 l-3.5 -2 l-3.5 2 l1 -4 l-3 -2.5 l4 -0.5 z" stroke={G} />
    <circle cx="72" cy="38" r="1.5" fill={G} stroke={G} />
  </g>,
  // alarm clock "!!"
  <g key="5">
    <circle cx="46" cy="66" r="16" stroke={K} />
    <path d="M46 56 v10 l7 5" stroke={G} />
    <path d="M33 50 l-5 -4 M59 50 l5 -4 M36 82 l-3 5 M56 82 l3 5" stroke={K} />
    <path d="M72 50 v10 M78 48 v10" stroke={G} />
    <circle cx="72" cy="65" r="0.9" fill={G} stroke={G} />
    <circle cx="78" cy="63" r="0.9" fill={G} stroke={G} />
  </g>,
  // lightbulb
  <g key="6">
    <path d="M38 70 c-8 -6 -8 -22 8 -24 c16 2 16 18 8 24 v6 h-16 z" stroke={K} />
    <path d="M40 82 h12 M42 87 h8" stroke={K} />
    <path d="M46 36 v-6 M30 44 l-4 -4 M62 44 l4 -4" stroke={G} />
    <text x="60" y="96" fontSize="7" fill={K} transform="rotate(-8 60 96)">idee!</text>
  </g>,
  // paper plane
  <g key="7">
    <path d="M24 70 l50 -22 l-14 40 l-10 -12 z M50 76 l24 -28" stroke={K} />
    <path d="M22 84 c8 6 14 -4 22 2 c6 4 10 -2 14 2" stroke={G} strokeDasharray="3 3" />
  </g>,
];

/** the left-hand page: faint ruled lines and a hand-drawn doodle */
const LeftFace: React.FC<{ w: number; h: number; idx?: number }> = ({ w, h, idx = 0 }) => (
  <div style={{ position: "absolute", inset: 0, borderRadius: "18px 4px 4px 18px", background: "linear-gradient(270deg, #e9ecea 0%, #f9faf9 8%, #ffffff 100%)", overflow: "hidden" }}>
    {Array.from({ length: 9 }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: w * 0.11, right: w * 0.11, top: h * 0.42 + i * h * 0.068, height: 2, background: "rgba(16,40,28,0.05)" }} />
    ))}
    <svg viewBox="0 0 100 125" width={w} height={h} style={{ position: "absolute", inset: 0 }} fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fontFamily="Inter" fontWeight={500}>
      {DOODLES[idx % DOODLES.length]}
    </svg>
  </div>
);

type PlantKind = "broad" | "tall" | "fern";

/**
 * A potted plant drawn as clean vector shapes: a soft white ceramic pot and gradient leaves that grow
 * in one after another, then keep swaying gently from their base, each on its own phase.
 */
const Plant: React.FC<{ x: number; floor: number; s: number; frame: number; at: number; kind: PlantKind; seed: number }> = ({ x, floor, s, frame, at, kind, seed }) => {
  const id = `pl${seed}`;
  const n = kind === "tall" ? 6 : kind === "fern" ? 9 : 7;
  const leaves = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1) - 0.5;
    const spread = kind === "tall" ? 34 : kind === "fern" ? 120 : 100;
    const base = u * spread + (seeded(i, seed) - 0.5) * 10;
    const len = (kind === "tall" ? 300 + 90 * (1 - Math.abs(u) * 1.6) : kind === "fern" ? 170 + 40 * seeded(i, seed + 3) : 190 + 70 * (1 - Math.abs(u))) * (0.85 + 0.3 * seeded(i, seed + 1));
    const w = kind === "tall" ? 34 : kind === "fern" ? 26 : 74;
    const grow = ease.outBack(clamp01((frame - at - i * 2) / 16));
    const sway = Math.sin(frame / (22 + 6 * seeded(i, seed + 2)) + seeded(i, seed + 4) * 6.28) * (kind === "fern" ? 5 : 3.5);
    return { rot: base + sway, len, w, grow, i };
  });
  const pot = ease.outCubic(clamp01((frame - at + 6) / 12));
  return (
    <svg width={600 * s} height={700 * s} viewBox="-300 -620 600 700" style={{ position: "absolute", left: x - 300 * s, top: floor - 620 * s, overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#0b7a45" />
          <stop offset="100%" stopColor="#35d488" />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f1f4f2" />
          <stop offset="100%" stopColor="#e2e8e4" />
        </linearGradient>
      </defs>
      {/* leaves */}
      <g transform="translate(0 -120)">
        {leaves.map((l) => (
          <g key={l.i} transform={`rotate(${l.rot}) scale(${l.grow})`}>
            {kind === "fern" ? (
              <path d={`M0 0 Q ${-l.w} ${-l.len * 0.5} 0 ${-l.len} Q ${l.w} ${-l.len * 0.5} 0 0 Z`} fill={`url(#${id}l)`} opacity={0.92} />
            ) : (
              <path d={`M0 0 C ${-l.w} ${-l.len * 0.25} ${-l.w * 0.9} ${-l.len * 0.8} 0 ${-l.len} C ${l.w * 0.9} ${-l.len * 0.8} ${l.w} ${-l.len * 0.25} 0 0 Z`} fill={`url(#${id}l)`} />
            )}
            <path d={`M0 -6 Q ${l.w * 0.08} ${-l.len * 0.5} 0 ${-l.len * 0.92}`} fill="none" stroke="rgba(220,255,236,0.45)" strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}
      </g>
      {/* pot */}
      <g transform={`translate(0 ${(1 - pot) * 30})`} opacity={pot}>
        <ellipse cx={0} cy={0} rx={110} ry={16} fill="rgba(16,40,28,0.10)" />
        <path d="M-92 -130 H92 L74 -4 Q72 4 62 4 H-62 Q-72 4 -74 -4 Z" fill={`url(#${id}p)`} stroke="rgba(16,40,28,0.08)" strokeWidth={2} />
        <rect x={-100} y={-142} width={200} height={20} rx={8} fill="#ffffff" stroke="rgba(16,40,28,0.08)" strokeWidth={2} />
      </g>
    </svg>
  );
};

/**
 * The room the camera drifts through: a clean white wall with a quiet grid and potted plants at three
 * depths (wall, mid, a soft out-of-focus foreground one), sliding at different speeds as it trucks right.
 */
const Room: React.FC<{ cam: number; W: number; H: number; vertical: boolean; frame: number; panAt: number }> = ({ cam, W, H, vertical, frame, panAt }) => {
  const cell = vertical ? 90 : 96;
  const wallX = -cam * 0.55;
  const midX = -cam * 0.85;
  const nearX = -cam * 1.35;
  const floorY = H * (vertical ? 0.8 : 0.84);
  const k = vertical ? 0.9 : 1;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(16,40,28,0.055) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(16,40,28,0.055) 1.5px, transparent 1.5px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${(W / 2 + wallX) % cell}px ${(H / 2) % cell}px`,
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 16%, #000 72%, transparent 100%)",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 16%, #000 72%, transparent 100%)",
        }}
      />
      {/* floor line */}
      <div style={{ position: "absolute", left: 0, right: 0, top: floorY, height: 2, background: "rgba(16,40,28,0.06)" }} />
      <div style={{ position: "absolute", left: wallX }}>
        <Plant x={W * 0.1} floor={floorY} s={0.75 * k} frame={frame} at={2} kind="tall" seed={1} />
        <Plant x={W * 0.9} floor={floorY} s={0.65 * k} frame={frame} at={8} kind="broad" seed={2} />
        <Plant x={W * 1.4} floor={floorY} s={0.7 * k} frame={frame} at={panAt + 4} kind="fern" seed={3} />
      </div>
      <div style={{ position: "absolute", left: midX }}>
        <Plant x={W * 1.18} floor={floorY + 60} s={0.95 * k} frame={frame} at={panAt} kind="broad" seed={4} />
        <Plant x={W * 1.95} floor={floorY + 40} s={0.85 * k} frame={frame} at={panAt + 8} kind="tall" seed={5} />
      </div>
      {/* a big soft foreground plant brushes past the lens during the move */}
      <div style={{ position: "absolute", left: nearX, filter: "blur(7px)", opacity: 0.9 }}>
        <Plant x={W * 1.05} floor={H + 160} s={1.9 * k} frame={frame} at={panAt - 6} kind="broad" seed={6} />
      </div>
    </AbsoluteFill>
  );
};

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const FS = V ? 112 : 136;

  // ---------------------------------------------------------------- intro: a slow push-in over the phrases
  const push = 1 + 0.06 * ease.inOutCubic(clamp01(frame / 118));
  const casaIn = hw(7);
  // camera tracking: one whip-pan carries us from the last phrase straight onto the planner
  const PAN = PLAN_IN - 2;
  const SPAN = L.W * 1.12;
  const panAt = (fr: number) => ease.inOutCubic(clamp01((fr - PAN) / 16));
  const pan = panAt(frame);
  const panBlur = Math.min(40, Math.abs(pan - panAt(frame - 1)) * SPAN * 0.18);
  const casaOut = PAN + 30;
  const casaK = 1 - ease.outExpo(clamp01((frame - (casaIn - 1)) / 12));
  const casaT = clamp01((frame - casaOut) / 7);
  const casaW = textWidth("prin casă", FS, -0.04);

  // ---------------------------------------------------------------- planner
  const PGW = V ? 520 : 560;
  const PGH = V ? 740 : 700;
  const planIn = ease.outCubic(clamp01((frame - PAN) / 18));
  const planOut = ease.inOutCubic(clamp01((frame - (END + 2)) / 12));
  const flipsDone = FLIPS.filter((s) => frame >= s + FD).length;
  const current = Math.min(PAGES.length - 1, FLIPS.filter((s) => frame >= s).length);

  // camera: whole spread → lean in on the line being written for each chore → back out to flip
  type Cam = { s: number; x: number; y: number };
  const base: Cam = V ? { s: 1.5, x: PGW / 2, y: 0 } : { s: 1, x: 0, y: 0 };
  const lean: Cam = V ? { s: 1.95, x: PGW * 0.5, y: -PGH * 0.02 } : { s: 1.55, x: PGW * 0.46, y: -PGH * 0.02 };
  const camAt = (fr: number): Cam => {
    const c = { ...base };
    CHORES.forEach((_, i) => {
      const a = arrive(i);
      const into = ease.inOutCubic(clamp01((fr - (a + 1)) / 12));
      const back = ease.inOutCubic(clamp01((fr - ((i < 2 ? arrive(i + 1) : END + 2) - 11)) / 9));
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

  // ---------------------------------------------------------------- the orb pulls everything in, charges and bursts
  const OS = V ? 150 : 140;
  return (
    <AbsoluteFill>

      <DirBlur x={panBlur} style={{ position: "absolute", inset: 0 }}>
      <Room cam={pan * SPAN} W={L.W} H={L.H} vertical={V} frame={frame} panAt={PAN} />
      {/* intro phrases */}
      {pan < 1 && (
      <AbsoluteFill style={{ transform: `translateX(${-pan * SPAN}px) scale(${push})` }}>
        <PhraseSeq
          light
          fontSize={FS}
          phrases={[
            { words: [0, 1, 2].map((i) => ({ text: VO.hook[i][0], at: hw(i) })), out: hw(3) - 5, breaks: V ? [1] : [] },
            { words: [3, 4, 5].map((i) => ({ text: VO.hook[i][0], at: hw(i) })), out: hw(6) - 5 },
            { words: [{ text: VO.hook[6][0], at: hw(6), color: ACCENT_LIGHT }], out: hw(7) - 6 },
          ]}
        />
        {frame >= casaIn - 1 && casaT < 1 && (
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${(1 + 0.12 * casaK) * (1 - 0.1 * ease.inCubic(casaT))})`,
              opacity: 1 - ease.inCubic(casaT),
              filter: casaT > 0 ? `blur(${20 * casaT}px)` : undefined,
            }}
          >
            <div style={{ position: "relative" }}>
              <KineticText words={[{ text: "prin", at: casaIn }, { text: "casă", at: hw(8) }]} fontSize={FS} ink={INK} tint={ACCENT_LIGHT} shadow={SHADOW} style={{ letterSpacing: "-0.04em" }} />
              {/* … as three dots hopping in a wave */}
              <div style={{ position: "absolute", left: casaW + FS * 0.08, bottom: FS * 0.26, display: "flex", gap: FS * 0.1 }}>
                {[0, 1, 2].map((d) => {
                  const local = frame - (hw(8) + 8) - d * 3;
                  const a = ease.outCubic(clamp01(local / 6));
                  const hop = local > 4 ? Math.max(0, Math.sin(((local - 4) / 15) * Math.PI * 2)) : 0;
                  return <div key={d} style={{ width: FS * 0.12, height: FS * 0.12, borderRadius: "50%", background: "linear-gradient(180deg, #34463d, #050a07)", opacity: a, transform: `translateY(${-hop * FS * 0.2}px) scale(${0.3 + 0.7 * a})` }} />;
                })}
              </div>
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      )}

      <AbsoluteFill style={{ transform: `translateX(${(1 - pan) * SPAN}px)` }}>
      {/* the planner */}
      {planIn > 0 && planOut < 1 && (
        <DirBlur x={camBlur} style={{ position: "absolute", inset: 0, opacity: 1 - planOut, filter: planOut > 0 ? `blur(${planOut * 20}px)` : undefined }}>
          <div
            style={{
              position: "absolute",
              left: L.cx,
              top: L.cy + (V ? 90 : 70),
              perspective: 2600,
              transform: `scale(${(0.94 + 0.06 * planIn) * (1 - 0.3 * planOut)})`,
            }}
          >
            <div style={{ transformStyle: "preserve-3d", transform: `scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px) rotateX(${lerp(38, 12, planIn) * (1 - 0.6 * clamp01((cam.s - base.s) / (lean.s - base.s)))}deg)` }}>
              {/* the table it rests on */}
              <div
                style={{
                  position: "absolute",
                  left: -PGW * 2.2,
                  top: -PGH / 2 - 70,
                  width: PGW * 4.4,
                  height: PGH + 900,
                  borderRadius: 30,
                  background: "linear-gradient(180deg, #f3eee6 0%, #ebe3d6 40%, #e4dacb 100%)",
                  boxShadow: "inset 0 3px 0 rgba(255,255,255,0.9), 0 -1px 0 rgba(16,40,28,0.06)",
                  backgroundImage: "repeating-linear-gradient(90deg, rgba(140,110,70,0.035) 0px, rgba(140,110,70,0.035) 2px, transparent 2px, transparent 46px), linear-gradient(180deg, #f3eee6 0%, #ebe3d6 40%, #e4dacb 100%)",
                }}
              />
              {/* soft contact shadow of the book */}
              <div style={{ position: "absolute", left: -PGW - 60, top: PGH / 2 - 10, width: PGW * 2 + 120, height: 90, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(60,45,25,0.22) 0%, rgba(60,45,25,0) 70%)" }} />
              {/* cover + page-block edges */}
              <div style={{ position: "absolute", left: -PGW - 26, top: -PGH / 2 - 22, width: PGW * 2 + 52, height: PGH + 44, borderRadius: 26, background: "linear-gradient(180deg, #13734a 0%, #0a4f32 100%)", boxShadow: "0 50px 90px rgba(10,50,30,0.28), 0 12px 24px rgba(10,50,30,0.16), inset 0 1px 0 rgba(255,255,255,0.18)" }} />
              {[3, 2, 1].map((k) => (
                <div key={k} style={{ position: "absolute", left: -PGW - 6 + k * 2, top: -PGH / 2 - 6 + k * 2, width: PGW * 2 + 12 - k * 4, height: PGH + 12 - k * 2, borderRadius: 18, background: k % 2 ? "#e7ebe9" : "#f4f6f5" }} />
              ))}
              {/* left page */}
              <div style={{ position: "absolute", left: -PGW, top: -PGH / 2, width: PGW, height: PGH }}>
                <LeftFace w={PGW} h={PGH} idx={flipsDone} />
              </div>
              {/* right page underneath = the page being flipped to */}
              <div style={{ position: "absolute", left: 0, top: -PGH / 2, width: PGW, height: PGH }}>
                <PageFace page={PAGES[current]} w={PGW} h={PGH} frame={frame} live={PAGES[current].chore !== undefined} />
                {FLIPS.map((s, j) => {
                  const p = clamp01((frame - s) / FD);
                  if (p <= 0 || p >= 1) return null;
                  return <div key={j} style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(10,40,25,${0.22 * Math.sin(Math.PI * p)}) 0%, rgba(10,40,25,0) 60%)` }} />;
                })}
              </div>
              {/* leaves turning over the spine */}
              {FLIPS.map((s, j) => {
                const p = ease.inOutCubic(clamp01((frame - s) / FD));
                if (p <= 0 || p >= 1 || j >= flipsDone + 3) return null;
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
              {/* spine shadow */}
              <div style={{ position: "absolute", left: -22, top: -PGH / 2, width: 44, height: PGH, background: "linear-gradient(90deg, rgba(10,40,25,0) 0%, rgba(10,40,25,0.16) 50%, rgba(10,40,25,0) 100%)" }} />
            </div>
          </div>
        </DirBlur>
      )}
      {/* "pe care o tot amâni?" above the planner */}
      <PhraseSeq
        light
        fontSize={V ? 84 : 78}
        y={V ? -720 : -430}
        phrases={[{ words: VO.postpone.map(([text, sec]) => ({ text, at: f(sec) - LEAD, color: text.startsWith("amâni") ? ACCENT_LIGHT : undefined })), out: arrive(0) - 12 }]}
      />

      </AbsoluteFill>
      </DirBlur>

    </AbsoluteFill>
  );
};
