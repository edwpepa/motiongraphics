import React from "react";
import { useCurrentFrame } from "remotion";
import { BOLD, C, FONT } from "../theme";
import { clamp01, ease, mixColor } from "../lib/anim";

export type KWord = {
  text: string;
  /** frame the word starts entering */
  at: number;
  /** final colour override (e.g. brand green for the product name) */
  color?: string;
  /** glue to the next word without a space (e.g. "handly" + ".ro") */
  joinNext?: boolean;
};

type Props = {
  words: KWord[];
  fontSize: number;
  weight?: number;
  ink?: string;
  tint?: string;
  /** word indices after which a new line starts */
  breaks?: number[];
  /** entrance length per letter, frames */
  dur?: number;
  mode?: "rise" | "track";
  lineHeight?: number;
  style?: React.CSSProperties;
};

/**
 * Word-by-word kinetic typography in the reference's style: each word's letters rise in on a
 * soft wave with a little rotation, start blurred and tinted with the accent colour, then
 * settle to ink. Layout is final from frame 0 (words just aren't visible yet), so nothing
 * reflows while the line builds.
 */
export const KineticText: React.FC<Props> = ({
  words,
  fontSize,
  weight = BOLD,
  ink = C.ink,
  tint = C.green,
  breaks = [],
  dur = 13,
  mode = "rise",
  lineHeight = 1.22,
  style,
}) => {
  const frame = useCurrentFrame();

  const lines: KWord[][] = [[]];
  words.forEach((w, i) => {
    lines[lines.length - 1].push(w);
    if (breaks.includes(i)) lines.push([]);
  });

  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: weight,
        fontSize,
        lineHeight,
        letterSpacing: "-0.02em",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", whiteSpace: "nowrap" }}>
          {line.map((w, wi) => (
            <span key={wi} style={{ display: "inline-block", marginRight: wi < line.length - 1 && !w.joinNext ? "0.27em" : 0 }}>
              <Word word={w} frame={frame} ink={w.color ?? ink} tint={tint} dur={dur} mode={mode} seed={li * 7 + wi * 3} blurMax={fontSize * 0.11} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

const Word: React.FC<{
  word: KWord;
  frame: number;
  ink: string;
  tint: string;
  dur: number;
  mode: "rise" | "track";
  seed: number;
  blurMax: number;
}> = ({ word, frame, ink, tint, dur, mode, seed, blurMax }) => {
  const local = frame - word.at;
  const letters = Array.from(word.text);
  const wordP = clamp01(local / (dur + letters.length * 0.55));
  const blur = (1 - ease.outCubic(clamp01(local / (dur * 0.9)))) * blurMax;
  const skew = (1 - ease.outExpo(wordP)) * -10;

  if (mode === "track") {
    // letters start spread around the word's centre and converge (transform-only, so layout never shifts)
    const p = ease.outExpo(clamp01(local / (dur + 6)));
    const mid = (letters.length - 1) / 2;
    return (
      <span
        style={{
          display: "inline-block",
          opacity: clamp01(local / 5),
          color: mixColor(tint, ink, clamp01((local - 6) / 14)),
          filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        }}
      >
        {letters.map((ch, i) => (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", transform: `translateX(${(i - mid) * 0.42 * (1 - p)}em)` }}>
            {ch}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-block",
        transform: `skewX(${skew}deg)`,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
      }}
    >
      {letters.map((ch, i) => {
        const l = local - i * 0.55;
        const p = clamp01(l / dur);
        const e = ease.outExpo(p);
        const wave = Math.sin(i * 0.85 + seed) * 0.16 + 0.42;
        const y = (1 - e) * wave * 1.0;
        const rot = (1 - e) * Math.sin(i * 1.7 + seed) * 12;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: clamp01(l / 4),
              transform: `translateY(${y}em) rotate(${rot}deg)`,
              color: mixColor(tint, ink, clamp01((l - 3) / 13)),
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};
