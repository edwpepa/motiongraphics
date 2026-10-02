import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppleLine } from "./AppleText";
import { clamp01, ease } from "../lib/anim";
import { KWord } from "./KineticText";

export const ACCENT: [string, string] = ["#b9ffd6", "#00c46a"];
export const ACCENT_LIGHT: [string, string] = ["#2be38a", "#00964d"];

export type PhraseDef = {
  words: KWord[];
  /** frame the phrase starts leaving (blur + scale back) */
  out: number;
  breaks?: number[];
};

/**
 * A few words at a time, centred: Apple-style word reveal (see AppleLine), then the phrase leaves
 * with a soft blur + slight lift before the next one lands in the same spot.
 */
export const PhraseSeq: React.FC<{ phrases: PhraseDef[]; fontSize: number; y?: number; dur?: number; light?: boolean }> = ({ phrases, fontSize, y = 0, dur = 14, light = false }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {phrases.map((p, i) => {
        const start = p.words[0].at - 2;
        // leave before the next phrase lands so two lines never overlap
        const next = phrases[i + 1];
        const out = next ? Math.min(p.out, next.words[0].at - 7) : p.out;
        if (frame < start || frame > out + 9) return null;
        const t = ease.inOutCubic(clamp01((frame - out) / 8));
        return (
          <AbsoluteFill
            key={i}
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `translateY(${y - fontSize * 0.25 * t}px)`,
              opacity: 1 - t,
              filter: t > 0 ? `blur(${fontSize * 0.14 * t}px)` : undefined,
            }}
          >
            <AppleLine words={p.words} fontSize={fontSize} breaks={p.breaks} light={light} dur={dur} style={light ? undefined : { filter: "drop-shadow(0 0 24px rgba(0,191,99,0.22))" }} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};
