import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { FONT, Logo, clamp01, ease, hash } from "../edw/kit";
import WORDS from "./vo-words.json";

/** the vertical frame */
export const RW = 1080;
export const RH = 1920;
export const END = 74.5;

type Phrase = { start: number; end: number; text: string; words: [string, number][] };
export const VO = WORDS as unknown as Record<string, Phrase>;
/** onset (s) of word i of phrase `key` */
export const w = (key: string, i = 0) => VO[key].words[Math.min(i, VO[key].words.length - 1)][1];

export const useT = () => useCurrentFrame() / 30;

/** a full-frame canvas, drawn synchronously each frame */
export const RCanvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D, t: number) => void; style?: React.CSSProperties }> = ({ draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const t = useT();
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, RW, RH);
    draw(ctx, t);
  });
  return <canvas ref={ref} width={RW} height={RH} style={{ position: "absolute", inset: 0, width: RW, height: RH, ...style }} />;
};

/** mounts children for [from, to) seconds */
export const Win: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useT();
  return t >= from && t < to ? <>{children}</> : null;
};

/** an even field of faint stars */
export function starfield(ctx: CanvasRenderingContext2D, T: number, a: number, n = 260, drift = 0) {
  for (let i = 0; i < n; i++) {
    const z = 0.3 + hash(i * 3.7) * 0.7;
    const x = (((hash(i * 1.37) * RW - drift * z) % RW) + RW) % RW;
    const y = hash(i * 2.71) * RH;
    const tw = 0.55 + 0.45 * Math.sin(T * (0.6 + hash(i) * 1.8) + i);
    ctx.fillStyle = `rgba(236,239,246,${a * (0.12 + 0.55 * z) * tw})`;
    const s = z > 0.93 ? 2.4 : 1.3;
    ctx.fillRect(x, y, s, s);
  }
}

// ------------------------------------------------------------------ the finish: vignette, grain, a soft floor of shade where the words sit
export const ReelGrade: React.FC = () => {
  const t = useT();
  const k = Math.floor(t * 15);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.5) 74%, rgba(0,0,0,0.62) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />
      <AbsoluteFill
        style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", backgroundPosition: `${Math.floor(hash(k) * 512)}px ${Math.floor(hash(k + 7.3) * 512)}px`, opacity: 0.055, mixBlendMode: "screen" }}
      />
    </AbsoluteFill>
  );
};

/** the small mark at the top */
export const TopMark: React.FC<{ until: number }> = ({ until }) => {
  const t = useT();
  const o = clamp01((t - 0.8) / 1.0) * (1 - clamp01((t - until) / 0.5));
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: RW / 2 - 52, top: 150, opacity: 0.9 * o }}>
      <Logo width={104} white />
    </div>
  );
};

// ------------------------------------------------------------------ the words, exactly as spoken, low in the frame
type Chunk = { words: [string, number][]; end: number };
type Wd = [string, number];
/** words a new line reads well from, and how much */
const STARTS: Record<string, number> = { to: 3, with: 2, than: 3, so: 3, where: 3, could: 2, based: 3, around: 3, from: 3, maybe: 3, or: 3, but: 3, that: 2, like: 2, what: 2, on: 2.5, in: 1.5, and: 1.5, is: 1, twenty: 1 };
/** words a line should not end on */
const DANGLE = new Set(["the", "a", "an", "of", "our", "their", "its", "based", "to", "and", "twenty", "my", "your", "same", "other", "every", "this", "no", "that"]);
const bare = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");
/** split a spoken phrase into caption chunks of about five words, breaking where the sentence breathes */
const chunkPhrase = (ws: Wd[]): Wd[][] => {
  const n = ws.length;
  const best = new Array(n + 1).fill(Infinity), prev = new Array(n + 1).fill(0);
  best[0] = 0;
  for (let j = 1; j <= n; j++)
    for (let i = Math.max(0, j - 9); i < j; i++) {
      const len = j - i;
      let c = best[i] + 0.25 * (len - 5.5) ** 2 + (len < 3 && n >= 3 ? 25 : len === 3 && n > 3 ? 2 : 0) + (len > 8 ? 40 : 0);
      if (j < n) {
        c += 1.5;
        if (/[,.!?:]$/.test(ws[j - 1][0])) c -= 8;
        else c -= STARTS[bare(ws[j][0])] ?? 0;
        if (DANGLE.has(bare(ws[j - 1][0]))) c += 6;
      }
      if (c < best[j]) {
        best[j] = c;
        prev[j] = i;
      }
    }
  const out: Wd[][] = [];
  for (let j = n; j > 0; j = prev[j]) out.unshift(ws.slice(prev[j], j));
  return out;
};
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  for (const k of Object.keys(VO)) for (const words of chunkPhrase(VO[k].words)) out.push({ words, end: 0 });
  for (let i = 0; i < out.length; i++) {
    const next = out[i + 1]?.words[0][1] ?? 99;
    out[i].end = Math.min(next - 0.06, out[i].words[out[i].words.length - 1][1] + 1.0);
  }
  return out;
})();

export const Captions: React.FC<{ y?: number; until?: number }> = ({ y = 1335, until = 1e9 }) => {
  const t = useT();
  const c = CHUNKS.find((x) => t >= x.words[0][1] - 0.16 && t < x.end);
  if (!c) return null;
  const t0 = c.words[0][1] - 0.16;
  const o = clamp01((Math.min(c.end, until) - t) / 0.16);
  if (o <= 0) return null;
  // one line if it fits, otherwise two lines of even width that break where the words allow (never a lone word underneath)
  const est = (ws: Wd[]) => ws.reduce((s, [x]) => s + x.length * 27.5, 0) + (ws.length - 1) * 14;
  let cut = c.words.length;
  if (est(c.words) > 900) {
    let best = 1e9;
    for (let k = 1; k < c.words.length; k++) {
      const a = est(c.words.slice(0, k)), b = est(c.words.slice(k));
      const d = Math.abs(a - b) + (Math.max(a, b) > 920 ? 2000 : 0) + (DANGLE.has(bare(c.words[k - 1][0])) || /^(on|in|of|with|from)$/.test(bare(c.words[k - 1][0])) ? 300 : 0) - 60 * (STARTS[bare(c.words[k][0])] ?? 0);
      if (d < best) {
        best = d;
        cut = k;
      }
    }
  }
  const rows = cut < c.words.length ? [c.words.slice(0, cut), c.words.slice(cut)] : [c.words];
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", rowGap: 2, opacity: o }}>
      {rows.map((row, r) => (
        <div key={r} style={{ display: "flex", justifyContent: "center", columnGap: 14 }}>
          {row.map(([wd, at], j) => {
            const i = r ? cut + j : j;
            const rise = ease.outExpo(clamp01((t - t0 - i * 0.03) / 0.55));
            const lit = ease.outCubic(clamp01((t - at + 0.05) / 0.2));
            const text = i === 0 ? wd.charAt(0).toUpperCase() + wd.slice(1) : wd;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 50,
                  lineHeight: 1.2,
                  letterSpacing: "-0.012em",
                  color: "#f3f4f7",
                  opacity: (0.3 + 0.7 * lit) * rise,
                  transform: `translateY(${(1 - rise) * 22}px)`,
                  filter: `blur(${(1 - rise) * 6}px)`,
                  whiteSpace: "nowrap",
                }}
              >
                {text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
