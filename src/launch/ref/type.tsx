import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp01 } from "../../explainer/lib/anim";

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
}> = ({ words, size = 76, x = 960, y = 540, out, exit = "zoom", enter = "slam", drift = -0.035, dark = false, weight = 400, bump = 1, exitLen }) => {
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
  const scale = ns * (1 + (drift * k) / 30) * es * bump;
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
        const base: React.CSSProperties = { position: "absolute", left, top: 0, height: size * 1.24, display: "flex", alignItems: "center", whiteSpace: "nowrap", transform: `translateY(${pop * size * 0.12}px) scale(${1 + 0.16 * pop})`, transformOrigin: "50% 60%", opacity: first || w.node ? 1 : clamp01(0.45 + kk / 2) };
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
