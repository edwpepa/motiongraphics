import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ACCENT_LIGHT, PhraseSeq } from "../components/Phrase";
import { clamp01, ease } from "../lib/anim";
import { useLayout } from "../layout";
import { f, VO } from "../timing";

const LEAD = 3;
const at = (i: number) => f(VO.hook[i][1]) - LEAD;

/**
 * Apple-Watch-"Breathe"-style flower: six translucent mint petals that slowly open, turn and close
 * again (a long, held thought), with a hairline orbit and a single dot circling it like a pending wait.
 */
const Breathe: React.FC<{ frame: number; open: number; R: number }> = ({ frame, open, R }) => {
  const b = open * (0.82 + 0.18 * Math.sin(frame / 14));
  const r = R * (0.32 + 0.38 * b);
  const d = R * 0.42 * b;
  const rot = 40 * b + frame * 0.35;
  const orbitR = R * 1.18;
  const dotA = frame / 9;
  return (
    <div style={{ position: "relative", width: 0, height: 0 }}>
      <svg width={R * 3} height={R * 3} viewBox={`${-R * 1.5} ${-R * 1.5} ${R * 3} ${R * 3}`} style={{ position: "absolute", left: -R * 1.5, top: -R * 1.5, overflow: "visible" }}>
        <defs>
          <radialGradient id="petal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2fbec" stopOpacity={0.5} />
            <stop offset="70%" stopColor="#6ee3a6" stopOpacity={0.38} />
            <stop offset="100%" stopColor="#19c477" stopOpacity={0.45} />
          </radialGradient>
        </defs>
        <circle r={orbitR} fill="none" stroke="rgba(16,40,28,0.10)" strokeWidth={1.5} opacity={open} />
        <circle r={orbitR} fill="none" stroke="#00c46a" strokeWidth={2.5} strokeLinecap="round" strokeDasharray={`${orbitR * 0.5} ${orbitR * 7}`} transform={`rotate(${(dotA * 180) / Math.PI - 30})`} opacity={open * 0.7} />
        <circle cx={Math.cos(dotA) * orbitR} cy={Math.sin(dotA) * orbitR} r={6} fill="#00c46a" opacity={open} />
        <g transform={`rotate(${rot})`} style={{ mixBlendMode: "multiply" }}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3;
            return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r} fill="url(#petal)" style={{ mixBlendMode: "multiply" }} />;
          })}
        </g>
      </svg>
    </div>
  );
};

// White opening: the "thinking…" bubble (you keep thinking about it) sits under big, calm words.
export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;

  // inhale over the hook, exhale into nothing as the question lands
  const inhale = ease.inOutCubic(clamp01(frame / 40));
  const exhale = ease.inOutCubic(clamp01((frame - (f(VO.hookEnd) - 14)) / 16));
  const open = inhale * (1 - exhale);

  const fs = V ? 124 : 150;
  const phrases = [
    { words: [0, 1, 2].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: at(3) - 3, breaks: V ? [1] : [] },
    { words: [3, 4, 5].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: at(6) - 3 },
    { words: [{ text: VO.hook[6][0], at: at(6), color: ACCENT_LIGHT }], out: at(7) - 3 },
    { words: [7, 8].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: f(VO.hookEnd) - 4 },
  ];

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translateY(${V ? -330 : -170}px)`, opacity: clamp01(open * 1.5), filter: exhale > 0 ? `blur(${exhale * 14}px)` : undefined }}>
        <Breathe frame={frame} open={open} R={V ? 210 : 165} />
      </AbsoluteFill>
      <PhraseSeq phrases={phrases} fontSize={fs} y={V ? 170 : 190} light />
    </AbsoluteFill>
  );
};
