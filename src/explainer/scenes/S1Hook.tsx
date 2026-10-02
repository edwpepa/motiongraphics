import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Orb } from "../components/Orb";
import { ACCENT, PhraseSeq } from "../components/Phrase";
import { clamp01, ease, lerp } from "../lib/anim";
import { useLayout } from "../layout";
import { f, VO } from "../timing";

const LEAD = 3;
const at = (i: number) => f(VO.hook[i][1]) - LEAD;

// Opening: three drops of green light drift together and melt into one orb (gooey merge), the orb
// rises to become the scene's light, and the line arrives a few big words at a time.
export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;

  const size = V ? 900 : 760;
  const merge = ease.inOutCubic(clamp01((frame + 6) / 20));
  const c = size / 2;
  const spread = (1 - merge) * size * 0.3;
  const breathe = 1 + 0.04 * Math.sin(frame / 7);
  const r = size * 0.17 * (0.6 + 0.4 * merge) * breathe;
  const blobs = [
    { x: c - spread, y: c + spread * 0.35, r },
    { x: c + spread, y: c + spread * 0.25, r: r * 0.9 },
    { x: c + spread * 0.1, y: c - spread * 0.9, r: r * 0.8 },
  ];
  // after the merge the orb lifts up and softens into the top light
  const rise = ease.inOutCubic(clamp01((frame - 5) / 20));
  const orbY = lerp(0, V ? -L.H * 0.36 : -L.H * 0.42, rise);
  const orbScale = lerp(1, 0.55, rise);
  const fade = 1 - 0.55 * rise - 0.45 * clamp01((frame - 105) / 15);
  const enter = ease.outCubic(clamp01(frame / 10));

  const fs = V ? 124 : 150;
  const phrases = [
    { words: [0, 1, 2].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: at(3) - 3, breaks: V ? [1] : [] },
    { words: [3, 4, 5].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: at(6) - 3 },
    { words: [{ text: VO.hook[6][0], at: at(6), color: ACCENT }], out: at(7) - 3 },
    { words: [7, 8].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: f(VO.hookEnd) - 4 },
  ];

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: L.cx - size / 2,
          top: L.cy - size / 2,
          width: size,
          height: size,
          transform: `translateY(${orbY}px) scale(${orbScale * (0.6 + 0.4 * enter)})`,
          opacity: fade * enter,
        }}
      >
        <Orb blobs={blobs} size={size} soften={rise * 6} />
      </div>
      <PhraseSeq phrases={phrases} fontSize={fs} />
    </AbsoluteFill>
  );
};
