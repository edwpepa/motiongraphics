import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ACCENT_LIGHT, PhraseSeq } from "../components/Phrase";
import { clamp01, ease, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { f, VO } from "../timing";

const LEAD = 3;
const at = (i: number) => f(VO.hook[i][1]) - LEAD;

/** iMessage-style "thinking" bubble: three dots breathing in a soft grey pill. */
const Thinking: React.FC<{ frame: number; scale: number }> = ({ frame, scale }) => (
  <div
    style={{
      display: "flex",
      gap: 18 * scale,
      padding: `${28 * scale}px ${38 * scale}px`,
      borderRadius: 999,
      background: "linear-gradient(180deg, #f1f2f4 0%, #e4e6e9 100%)",
      boxShadow: `0 ${20 * scale}px ${50 * scale}px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)`,
    }}
  >
    {[0, 1, 2].map((i) => {
      const k = (Math.sin(frame / 4.2 - i * 0.9) + 1) / 2;
      return (
        <div
          key={i}
          style={{
            width: 26 * scale,
            height: 26 * scale,
            borderRadius: "50%",
            background: `rgba(90,96,104,${0.35 + 0.5 * k})`,
            transform: `translateY(${-8 * k * scale}px)`,
          }}
        />
      );
    })}
  </div>
);

// White opening: the "thinking…" bubble (you keep thinking about it) sits under big, calm words.
export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;

  const appear = pop(frame, 0, 14, 120);
  const settle = ease.inOutCubic(clamp01((frame - 6) / 16));
  const leave = ease.inCubic(clamp01((frame - (f(VO.hookEnd) - 6)) / 8));
  const bubbleY = (V ? 300 : 220) * settle;

  const fs = V ? 124 : 150;
  const phrases = [
    { words: [0, 1, 2].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: at(3) - 3, breaks: V ? [1] : [] },
    { words: [3, 4, 5].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: at(6) - 3 },
    { words: [{ text: VO.hook[6][0], at: at(6), color: ACCENT_LIGHT }], out: at(7) - 3 },
    { words: [7, 8].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: f(VO.hookEnd) - 4 },
  ];

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `translateY(${bubbleY}px) scale(${appear * (1.25 - 0.45 * settle) * (1 - 0.3 * leave)})`,
          opacity: 1 - leave,
          filter: leave > 0 ? `blur(${leave * 16}px)` : undefined,
        }}
      >
        <Thinking frame={frame} scale={V ? 1.1 : 1} />
      </AbsoluteFill>
      <PhraseSeq phrases={phrases} fontSize={fs} y={V ? -40 : -30} light />
    </AbsoluteFill>
  );
};
