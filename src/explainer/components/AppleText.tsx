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
 * Apple-style line reveal: every word arrives on its own beat out of a soft blur, rising a touch and
 * settling from the accent tint into ink, while the line it belongs to glides to stay centred — no
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
    lines[lines.length - 1].push({ w, width: textWidth(w.text, fs, tracking) });
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
          if (local < -1) return null;
          const p = ease.outCubic(clamp01(local / dur));
          const c = clamp01((local - 3) / 16);
          const settled = w.color ?? ink;
          const col: [string, string] = [mixColor(tint[0], settled[0], c), mixColor(tint[1], settled[1], c)];
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
                opacity: clamp01(local / 7),
                transform: `translateY(${(1 - p) * fs * 0.2}px) scale(${0.94 + 0.06 * p})`,
                transformOrigin: "50% 70%",
                filter: p < 0.99 ? `blur(${(1 - p) * fs * 0.13}px)` : undefined,
                ...fill(col),
              }}
            >
              {w.text}
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
  return words.reduce((s, w, i) => s + (textWidth(w.text, fs, tracking) + (i ? space : 0)) * wordGrow(frame, w.at), 0);
};
