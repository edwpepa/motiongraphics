import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText } from "../components/KineticText";
import { clamp01, drift, ease, keys } from "../lib/anim";
import { f, VO } from "../timing";

const LEAD = 3;

/** Old phrase blurs and lifts away as the next one lands in the same spot (the reference's Simple → Clean swap). */
export const swapOut = (frame: number, at: number) => {
  const t = clamp01((frame - at) / 6);
  return {
    opacity: 1 - ease.inCubic(t),
    filter: t > 0 ? `blur(${10 * t}px)` : undefined,
    transform: `translateY(${-26 * ease.inCubic(t)}px) scale(${1 - 0.06 * t})`,
  };
};

/** Fading horizontal scan lines over the light scene right after the dark → light glitch cut. */
const ScanLines: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const frame = useCurrentFrame();
  const t = clamp01((frame - start) / dur);
  if (t >= 1) return null;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: "repeating-linear-gradient(180deg, rgba(20,24,22,0.16) 0px, rgba(20,24,22,0.16) 2px, transparent 2px, transparent 9px)",
        backgroundPosition: `0px ${frame * 7}px`,
        opacity: 1 - ease.outCubic(t),
      }}
    />
  );
};

// "Fără tarife de firmă. Fără intermediari."
export const S7NoFees: React.FC = () => {
  const frame = useCurrentFrame();
  const swap = f(VO.noMiddlemen[0][1]) - LEAD - 1;
  const exit = f(VO.handly) - LEAD - 1;
  const push = keys(frame, [
    [585, 0.97],
    [exit, 1.04],
  ], ease.linear);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <ScanLines start={584} dur={16} />
      <div style={{ position: "relative", transform: `scale(${push}) translateY(${drift(frame, 4, 150)}px)` }}>
        {frame < swap + 7 && (
          <div style={swapOut(frame, swap)}>
            <KineticText words={VO.noFees.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={74} weight={600} />
          </div>
        )}
        {frame >= swap && (
          <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)" }}>
            <div style={swapOut(frame, exit)}>
              <KineticText
                words={VO.noMiddlemen.map(([text, sec]) => ({ text, at: f(sec) - LEAD - 1 }))}
                fontSize={74}
                weight={600}
                mode="track"
              />
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
