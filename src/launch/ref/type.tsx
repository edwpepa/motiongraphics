import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp01 } from "../../explainer/lib/anim";
import { beatPulse } from "./marks";

// ------------------------------------------------------------------ the reference's type, frame for frame:
// a new line slams in from big and blurred and settles fast; every next word pops into its slot (a hair bigger,
// a hair low, sharp); the line never stops — it keeps zooming slowly; it leaves zooming away, or melting into blur.
export const RFONT = "Inter, sans-serif";
export const RINK = "#0e1211";
export const RINK_D = "#f2f5f3";
export const ACC: [string, string] = ["#00ae59", "#4ade9a"];
export const ACC_D: [string, string] = ["#1fd17d", "#9ff2c4"];

let CTX: CanvasRenderingContext2D | null = null;
export const measure = (t: string, size: number, weight: number, track = -0.015) => {
  if (!CTX) CTX = document.createElement("canvas").getContext("2d");
  if (!CTX) return t.length * size * 0.5;
  CTX.font = `${weight} ${size}px Inter`;
  return CTX.measureText(t).width + t.length * size * track;
};

/** a word (t) or an inline object (node, w px wide) that opens a gap in the line when it arrives */
export type RW = { t?: string; at: number; acc?: boolean; accOff?: number; node?: (p: number, f: number) => React.ReactNode; w?: number };
export type Enter = "slam" | "pop" | "soft";
export type Exit = "zoom" | "blur" | "push" | "none";

const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));

export const RefLine: React.FC<{
  words: RW[];
  size?: number;
  x?: number;
  y?: number;
  out?: number;
  exit?: Exit;
  enter?: Enter;
  /** slow zoom per second while on screen (the reference shrinks; > 0 grows) */
  drift?: number;
  dark?: boolean;
  weight?: number;
  bump?: number;
  exitLen?: number;
  /** a small punch on every beat of the song */
  beat?: number;
}> = ({ words, size = 76, x = 960, y = 540, out, exit = "zoom", enter = "slam", drift = -0.035, dark = false, weight = 400, bump = 1, exitLen, beat = 0.022 }) => {
  const f = useCurrentFrame();
  const widths = useMemo(() => words.map((w) => (w.node ? w.w ?? size : measure(w.t ?? "", size, weight))), [words, size, weight]);
  const t0 = words[0].at;
  if (f < t0) return null;

  // leaving
  let es = 1, eb = 0, eo = 1;
  if (out !== undefined && f >= out) {
    if (exit === "zoom") {
      const u = clamp01((f - out) / (exitLen ?? 8));
      es = 1 - 0.55 * u * u;
      eb = 10 * u * u;
      eo = 1 - u * u * u;
    } else if (exit === "blur") {
      const u = clamp01((f - out) / (exitLen ?? 6));
      es = 1 + 0.05 * u;
      eb = 16 * u;
      eo = 1 - u;
    } else if (exit === "push") {
      const u = clamp01((f - out) / (exitLen ?? 12));
      es = 1 + 0.7 * u * u;
      eb = 12 * u * u;
      eo = 1 - u * u;
    }
    if (eo <= 0.002) return null;
  }
  // arriving
  const k = f - t0;
  let ns = 1, nb = 0, no = 1;
  if (enter === "slam") {
    ns = 1 + 0.62 * Math.exp(-k / 3.2);
    nb = 18 * Math.exp(-k / 2.4);
    no = clamp01(0.3 + k / 3);
  } else if (enter === "soft") {
    const u = clamp01(k / 18);
    const e = 1 - Math.pow(1 - u, 3);
    ns = 1 + 0.08 * (1 - e);
    nb = 14 * (1 - e);
    no = e;
  }
  const scale = ns * (1 + (drift * k) / 30) * es * bump * (1 + beat * beatPulse(f, 7));
  const blur = nb + eb;

  const gap = size * 0.27;
  // the line re-centres on what's already there: each new word opens its slot in a few frames, the rest slide over
  const vis = words.map((w) => (f < w.at ? 0 : w.node ? outExpo(clamp01((f - w.at) / 9)) : w.at <= t0 + 1 && enter !== "pop" ? 1 : outExpo(clamp01((f - w.at + 1) / 6))));
  // a word always sits a full gap after the previous one; only the centring eases (inline objects really open up)
  const cur = words.map((w, i) => (w.node ? widths[i] * vis[i] : f >= w.at ? widths[i] : 0));
  const gaps = words.map((w, i) => (i === 0 || f < w.at ? 0 : w.node ? gap * vis[i] : gap));
  const total = words.reduce((s, w, i) => s + (w.node ? cur[i] + gaps[i] : (widths[i] + (i === 0 ? 0 : gap)) * vis[i]), 0);
  const ink = dark ? RINK_D : RINK;
  const [ga, gb] = dark ? ACC_D : ACC;
  let cx = 0;
  return (
    <div style={{ position: "absolute", left: x - total / 2, top: y - size * 0.62, width: total, height: size * 1.24, transform: `scale(${scale})`, transformOrigin: `${total / 2}px 50%`, opacity: no * eo, filter: blur > 0.25 ? `blur(${blur}px)` : undefined, pointerEvents: "none" }}>
      {words.map((w, i) => {
        const left = cx + gaps[i];
        cx = left + cur[i];
        if (f < w.at) return null;
        const kk = f - w.at;
        const first = enter === "slam" && w.at <= t0 + 1;
        const pop = first || w.node ? 0 : Math.exp(-kk / 2.2);
        const base: React.CSSProperties = { position: "absolute", left, top: 0, height: size * 1.24, display: "flex", alignItems: "center", whiteSpace: "nowrap", transform: `translateY(${pop * size * 0.12}px) scale(${1 + 0.16 * pop})`, transformOrigin: "0% 60%", opacity: first || w.node ? 1 : clamp01(0.45 + kk / 2) };
        if (w.node)
          return (
            <div key={i} style={{ ...base, width: cur[i], justifyContent: "center" }}>
              {w.node(outExpo(clamp01(kk / 12)), kk)}
            </div>
          );
        const a = w.acc ? (w.accOff !== undefined ? 1 - clamp01((f - w.accOff) / 6) : 1) : 0;
        const txt: React.CSSProperties = { fontFamily: RFONT, fontWeight: weight, fontSize: size, letterSpacing: "-0.015em", lineHeight: 1 };
        return (
          <div key={i} style={base}>
            <span style={{ ...txt, color: ink, opacity: 1 - a }}>{w.t}</span>
            {a > 0 && <span style={{ ...txt, position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", backgroundImage: `linear-gradient(90deg, ${ga} 0%, ${gb} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", opacity: a, paddingRight: 2 }}>{w.t}</span>}
          </div>
        );
      })}
    </div>
  );
};

/** words with explicit times; `acc` marks accent word indexes */
export const ws = (pairs: [string, number][], acc: number[] = []): RW[] => pairs.map(([t, at], i) => ({ t, at, acc: acc.includes(i) }));

// ------------------------------------------------------------------ KText: the old Handly type, word by word on the voice.
// Inter Bold; the layout is final from the first frame (lines wrap, nothing moves while the sentence builds); each
// word's letters rise out of a soft blur one after another, tinted green, and settle to ink (accents stay green).
const LIGHT_INK: [string, string] = ["#34463d", "#050a07"];
const LIGHT_TINT: [string, string] = ["#1fd17c", "#00964d"];
const DARK_INK: [string, string] = ["#ffffff", "#b4c4bb"];
const DARK_TINT: [string, string] = ["#d9ffe9", "#5df0a5"];
const DARK_ACC: [string, string] = ["#7af0b4", "#1fd17c"];
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
const gradText = (a: [string, string], b: [string, string], t: number): React.CSSProperties => ({
  backgroundImage: `linear-gradient(180deg, ${mixHex(a[0], b[0], t)} 10%, ${mixHex(a[1], b[1], t)} 90%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});
const outE = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
const outC = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

export type Line = { words: RW[]; size?: number; x?: number; y?: number; maxW?: number; align?: "center" | "left"; dark?: boolean; lineHeight?: number; breaks?: number[] };

export const KText: React.FC<Line & { out?: number; dur?: number }> = ({ words, size = 80, x = 960, y = 540, maxW = 1400, align = "center", dark = false, lineHeight = 1.16, breaks, out, dur = 8 }) => {
  const f = useCurrentFrame();
  const gap = size * 0.27;
  const widths = useMemo(() => words.map((w) => (w.node ? w.w ?? size : measure(w.t ?? "", size, 700, -0.03))), [words, size]);
  // greedy line breaks, fixed for the whole life of the block
  const lines = useMemo(() => {
    const L: number[][] = [[]];
    if (breaks) {
      // breaks set by meaning: a new line after each listed word index
      words.forEach((_w, i) => {
        L[L.length - 1].push(i);
        if (breaks.includes(i) && i < words.length - 1) L.push([]);
      });
      return L;
    }
    let cur = 0;
    widths.forEach((wd, i) => {
      const add = (L[L.length - 1].length ? gap : 0) + wd;
      if (L[L.length - 1].length && cur + add > maxW) {
        L.push([i]);
        cur = wd;
      } else {
        L[L.length - 1].push(i);
        cur += add;
      }
    });
    return L;
  }, [widths, gap, maxW, breaks, words]);
  if (!words.length || f < words[0].at - 1) return null;
  const t = out === undefined ? 0 : clamp01((f - out) / 7);
  if (t >= 1) return null;
  const k = 1 - outE(clamp01((f - words[0].at) / 14));
  const LH = size * lineHeight;
  const top = y - (lines.length * LH) / 2;
  const ink = dark ? DARK_INK : LIGHT_INK;
  const tint = dark ? DARK_TINT : LIGHT_TINT;
  const acc = dark ? DARK_ACC : LIGHT_TINT;
  const blurMax = size * 0.11;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none", transform: `scale(${(1 + 0.04 * k) * (1 - 0.08 * t * t * t)})`, transformOrigin: `${x}px ${y}px`, opacity: 1 - t * t * t, filter: `${t > 0 ? `blur(${18 * t}px) ` : ""}drop-shadow(0 8px 22px rgba(0,0,0,${dark ? 0.45 : 0.07}))` }}>
      {lines.map((ln, li) => {
        const lw = ln.reduce((s, i, j) => s + widths[i] + (j ? gap : 0), 0);
        let cx = align === "center" ? x - lw / 2 : x;
        return ln.map((i, j) => {
          const w = words[i];
          const left = cx + (j ? gap : 0);
          cx = left + widths[i];
          const local = f - w.at;
          if (local < 0) return null;
          const base: React.CSSProperties = { position: "absolute", left, top: top + li * LH, height: LH, display: "flex", alignItems: "center", whiteSpace: "pre" };
          if (w.node) {
            const p = outE(clamp01(local / (dur + 2)));
            return (
              <div key={i} style={{ ...base, width: widths[i], justifyContent: "center", opacity: clamp01(local / 5), transform: `translateY(${(1 - p) * 0.3 * size}px)`, filter: p < 0.99 ? `blur(${(1 - p) * blurMax}px)` : undefined }}>
                {w.node(p, local)}
              </div>
            );
          }
          // the word resolves whole, quickly, right on its syllable: out of a light blur, a hair low, green for an instant
          const e = outE(clamp01(local / dur));
          const fin = w.acc ? acc : ink;
          return (
            <div key={i} style={{ ...base, fontFamily: RFONT, fontWeight: 700, fontSize: size, letterSpacing: "-0.03em", lineHeight: 1, opacity: clamp01(local / 3), transform: `translateY(${(1 - e) * 0.16 * size}px)`, filter: e < 0.98 ? `blur(${(1 - e) * blurMax}px)` : undefined }}>
              <span style={gradText(tint, fin, clamp01((local - 2) / 8))}>{w.t}</span>
            </div>
          );
        });
      })}
    </div>
  );
};
