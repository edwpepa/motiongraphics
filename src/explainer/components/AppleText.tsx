import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, ease, mixColor } from "../lib/anim";
import { BOLD, FONT } from "../theme";

export type AWord = {
  text: string;
  /** frame the word starts appearing */
  at: number;
  /** settled colour override [top, bottom] */
  color?: [string, string];
  /** an empty slot of this width (px) instead of text — something else (the orb) sits there */
  slot?: number;
};

export const INK_L: [string, string] = ["#2a3530", "#060908"];
export const INK_D: [string, string] = ["#ffffff", "#c3cfc9"];
export const TINT_L: [string, string] = ["#2bd987", "#00a352"];
export const TINT_D: [string, string] = ["#b9ffd6", "#2be38a"];
export const GREEN_L: [string, string] = ["#1fd17c", "#00964d"];
export const GREEN_D: [string, string] = ["#b9ffd6", "#00c46a"];

let ctx: CanvasRenderingContext2D | null = null;
/** Width of a run of Inter Bold at `size`, including letter-spacing (canvas text metrics). */
export const textWidth = (text: string, size: number, tracking: number) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * size * 0.55;
  ctx.font = `${BOLD} ${size}px Inter`;
  return ctx.measureText(text).width + Array.from(text).length * tracking * size;
};

const fill = (c: [string, string]): React.CSSProperties => ({
  backgroundImage: `linear-gradient(180deg, ${c[0]} 12%, ${c[1]} 92%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

/**
 * Line reveal: every word's letters rise in from below on a soft wave, left to right, out of a blur and
 * from the accent tint into ink, while the line it belongs to glides to stay centred — no
 * empty slots waiting for words that haven't been said yet.
 */
export const AppleLine: React.FC<{
  words: AWord[];
  fontSize: number;
  light?: boolean;
  /** word indices after which a new line starts */
  breaks?: number[];
  tracking?: number;
  lineHeight?: number;
  /** how long a word takes to settle, frames */
  dur?: number;
  /** "left": the line grows rightwards from x = 0 instead of re-centring */
  align?: "center" | "left";
  style?: React.CSSProperties;
}> = ({ words, fontSize: fs, light = false, breaks = [], tracking = -0.03, lineHeight = 1.18, dur = 14, align = "center", style }) => {
  const frame = useCurrentFrame();
  const ink = light ? INK_L : INK_D;
  const tint = light ? TINT_L : TINT_D;
  const space = textWidth(" ", fs, tracking);

  const lines: { w: AWord; width: number }[][] = [[]];
  words.forEach((w, i) => {
    lines[lines.length - 1].push({ w, width: w.slot ?? textWidth(w.text, fs, tracking) });
    if (breaks.includes(i)) lines.push([]);
  });
  const shown = lines.filter((l) => l.some(({ w }) => frame >= w.at - 1));
  const blockH = Math.max(1, shown.length) * fs * lineHeight;

  return (
    <div style={{ position: "relative", width: 0, height: 0, fontFamily: FONT, fontWeight: BOLD, fontSize: fs, letterSpacing: `${tracking}em`, lineHeight: 1, whiteSpace: "pre", ...style }}>
      {lines.map((line, li) => {
        // each word's share of the line opens smoothly, so the line re-centres as it grows
        const grow = line.map(({ w }) => ease.inOutCubic(clamp01((frame - w.at + 1) / 11)));
        const total = line.reduce((s, { width }, i) => s + (width + (i ? space : 0)) * grow[i], 0);
        let x = align === "left" ? 0 : -total / 2;
        const lineIdx = shown.indexOf(line);
        const y = (align === "left" ? -fs * lineHeight * 0.5 : -blockH / 2) + Math.max(0, lineIdx) * fs * lineHeight;
        return line.map(({ w, width }, i) => {
          if (i) x += space * grow[i];
          const left = x;
          x += width * grow[i];
          const local = frame - w.at;
          if (local < -1 || w.slot !== undefined) return null;
          // letters rise in on a soft wave from below, left to right, blurred and tinted, then settle to ink
          const settled = w.color ?? ink;
          const letters = Array.from(w.text);
          const seed = li * 7 + i * 3;
          const wordP = clamp01(local / (dur + letters.length * 0.55));
          const blur = (1 - ease.outCubic(clamp01(local / (dur * 0.9)))) * fs * 0.11;
          return (
            <span
              key={`${li}-${i}`}
              style={{
                position: "absolute",
                left,
                top: y,
                height: fs * lineHeight,
                display: "flex",
                alignItems: "center",
                transform: `skewX(${(1 - ease.outExpo(wordP)) * -10}deg)`,
                filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
              }}
            >
              {letters.map((ch, k) => {
                const l = local - k * 0.55;
                const e = ease.outExpo(clamp01(l / dur));
                const wave = Math.sin(k * 0.85 + seed) * 0.16 + 0.42;
                const c = clamp01((l - 3) / 13);
                return (
                  <span
                    key={k}
                    style={{
                      display: "inline-block",
                      whiteSpace: "pre",
                      opacity: clamp01(l / 4),
                      transform: `translateY(${(1 - e) * wave}em) rotate(${(1 - e) * Math.sin(k * 1.7 + seed) * 12}deg)`,
                      ...fill([mixColor(tint[0], settled[0], c), mixColor(tint[1], settled[1], c)]),
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          );
        });
      })}
    </div>
  );
};

/** the layout share a word has opened up to at `frame` (same curve AppleLine uses) */
export const wordGrow = (frame: number, at: number) => ease.inOutCubic(clamp01((frame - at + 1) / 11));

/** current width of an AppleLine (single line) at `frame` */
export const lineWidth = (words: AWord[], fs: number, frame: number, tracking = -0.03) => {
  const space = textWidth(" ", fs, tracking);
  return words.reduce((s, w, i) => s + ((w.slot ?? textWidth(w.text, fs, tracking)) + (i ? space : 0)) * wordGrow(frame, w.at), 0);
};

/** x of the centre of word `idx` in a centred single-line AppleLine at `frame` (slot fully open) */
export const wordCenter = (words: AWord[], idx: number, fs: number, frame: number, tracking = -0.03) => {
  const space = textWidth(" ", fs, tracking);
  let x = -lineWidth(words, fs, frame, tracking) / 2;
  for (let i = 0; i < idx; i++) x += ((words[i].slot ?? textWidth(words[i].text, fs, tracking)) + (i ? space : 0)) * wordGrow(frame, words[i].at);
  const own = words[idx].slot ?? textWidth(words[idx].text, fs, tracking);
  return x + (idx ? space : 0) + own / 2;
};
