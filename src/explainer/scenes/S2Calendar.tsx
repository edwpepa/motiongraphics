import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PhraseSeq } from "../components/Phrase";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease, keys } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, FONT } from "../theme";
import { f, VO } from "../timing";

const HOPS = VO.postponeSyllables.map((s) => f(s));
const FIRST = 15;

const dayAt = (frame: number, dur: number, lag = 0) => {
  let d = FIRST;
  for (const h of HOPS) d += ease.inOutCubic(clamp01((frame - lag - h) / dur));
  return d;
};

// "pe care o tot amâni?" — a strip of days; the green ring keeps sliding to tomorrow
export const S2Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const enter = 118;
  const exit = f(VO.postponeEnd) + 4;
  const cell = V ? 200 : 230;

  const day = dayAt(frame, 5);
  const vel = Math.abs(day - dayAt(frame - 1, 5)) * cell;
  const camDay = dayAt(frame, 7, 3); // camera trails the ring

  const inT = ease.outCubic(clamp01((frame - enter) / 12));
  const outT = ease.inCubic(clamp01((frame - exit) / 10));
  const stripY = V ? 140 : 110;

  return (
    <AbsoluteFill style={{ opacity: inT * (1 - outT), filter: outT > 0 ? `blur(${outT * 20}px)` : undefined }}>
      <PhraseSeq
        phrases={[{ words: VO.postpone.map(([text, sec]) => ({ text, at: f(sec) - 3 })), out: exit, breaks: V ? [2] : [] }]}
        fontSize={V ? 112 : 104}
        y={V ? -300 : -190}
      />
      <div
        style={{
          position: "absolute",
          left: L.cx,
          top: L.cy + stripY,
          transform: `translateX(${-(camDay - FIRST) * cell - (1 - inT) * 200}px) scale(${keys(frame, [[enter, 1.08], [exit, 1]], ease.outCubic)})`,
        }}
      >
        {Array.from({ length: 16 }, (_, i) => {
          const d = 10 + i;
          const near = Math.max(0, 1 - Math.abs(d - day) / 1.2);
          const dist = Math.abs(d - camDay);
          return (
            <div
              key={d}
              style={{
                position: "absolute",
                left: (d - FIRST) * cell - cell / 2,
                top: -cell / 2,
                width: cell,
                height: cell,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT,
                fontWeight: BOLD,
                fontSize: cell * 0.42,
                letterSpacing: "-0.04em",
                color: `rgba(255,255,255,${Math.max(0.08, 0.5 - dist * 0.11) + near * 0.5})`,
                filter: dist > 2.5 ? `blur(${(dist - 2.5) * 2}px)` : undefined,
              }}
            >
              {d}
            </div>
          );
        })}
        {/* the glowing ring, smeared along its hop */}
        <DirBlur x={vel * 0.45} style={{ position: "absolute", left: (day - FIRST) * cell - cell * 0.42, top: -cell * 0.42 }}>
          <div
            style={{
              width: cell * 0.84,
              height: cell * 0.84,
              borderRadius: "50%",
              border: `${cell * 0.035}px solid #22e07f`,
              boxShadow: "0 0 30px rgba(0,230,118,0.65), inset 0 0 24px rgba(0,230,118,0.35)",
            }}
          />
        </DirBlur>
      </div>
    </AbsoluteFill>
  );
};
