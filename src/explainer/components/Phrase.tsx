import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, ease } from "../lib/anim";
import { INK_DARK, KineticText, KWord, SHADOW_DARK } from "./KineticText";

export const ACCENT: [string, string] = ["#b9ffd6", "#00c46a"];

export type PhraseDef = {
  words: KWord[];
  /** frame the phrase starts leaving (blur + scale back) */
  out: number;
  breaks?: number[];
};

/**
 * A few big words at a time, centred: they rise in letter by letter, then leave with an Apple-style
 * blur + slight scale back before the next phrase lands in the same spot.
 */
export const PhraseSeq: React.FC<{ phrases: PhraseDef[]; fontSize: number; y?: number; dur?: number }> = ({ phrases, fontSize, y = 0, dur = 14 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {phrases.map((p, i) => {
        const start = p.words[0].at - 2;
        // leave before the next phrase lands so two lines never overlap
        const next = phrases[i + 1];
        const out = next ? Math.min(p.out, next.words[0].at - 9) : p.out;
        if (frame < start || frame > out + 8) return null;
        const t = clamp01((frame - out) / 7);
        return (
          <AbsoluteFill
            key={i}
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `translateY(${y - 30 * ease.inCubic(t)}px) scale(${1 - 0.08 * ease.inCubic(t)})`,
              opacity: 1 - ease.inCubic(t),
              filter: t > 0 ? `blur(${18 * t}px)` : undefined,
            }}
          >
            <KineticText words={p.words} fontSize={fontSize} breaks={p.breaks} ink={INK_DARK} tint={ACCENT} shadow={SHADOW_DARK} dur={dur} style={{ letterSpacing: "-0.035em", textAlign: "center" }} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};
