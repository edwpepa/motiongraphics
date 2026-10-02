import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, ease } from "../lib/anim";
import { INK, INK_DARK, KineticText, KWord, SHADOW, SHADOW_DARK } from "./KineticText";

export const ACCENT: [string, string] = ["#b9ffd6", "#00c46a"];
export const ACCENT_LIGHT: [string, string] = ["#2be38a", "#00964d"];

export type PhraseDef = {
  words: KWord[];
  /** frame the phrase starts leaving (blur + scale back) */
  out: number;
  breaks?: number[];
};

/**
 * A few words at a time, centred, animated exactly like the "handly.ro / Postezi. / Se rezolvă!"
 * beats: letters rise in from below on a wave (left to right) inside a fixed layout, the phrase
 * lands with a soft punch-in, and leaves with a blur + slight shrink before the next one arrives.
 */
export const PhraseSeq: React.FC<{ phrases: PhraseDef[]; fontSize: number; y?: number; dur?: number; light?: boolean }> = ({ phrases, fontSize, y = 0, dur = 13, light = false }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {phrases.map((p, i) => {
        const start = p.words[0].at - 1;
        const next = phrases[i + 1];
        const out = next ? Math.min(p.out, next.words[0].at - 8) : p.out;
        if (frame < start || frame > out + 8) return null;
        const k = 1 - ease.outExpo(clamp01((frame - start) / 12));
        const t = clamp01((frame - out) / 7);
        return (
          <AbsoluteFill
            key={i}
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `translateY(${y}px) scale(${(1 + 0.12 * k) * (1 - 0.1 * ease.inCubic(t))})`,
              opacity: 1 - ease.inCubic(t),
              filter: t > 0 ? `blur(${20 * t}px)` : undefined,
            }}
          >
            <KineticText words={p.words} fontSize={fontSize} breaks={p.breaks} ink={light ? INK : INK_DARK} tint={light ? ACCENT_LIGHT : ACCENT} shadow={light ? SHADOW : SHADOW_DARK} dur={dur} style={{ letterSpacing: "-0.04em", textAlign: "center" }} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};
