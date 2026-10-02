import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText } from "../components/KineticText";
import { clamp01, drift, ease, keys } from "../lib/anim";
import { useLayout } from "../layout";
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

// "Fără tarife de firmă. Fără intermediari." — the first line lifts and steps back, the second lands under it
export const S7NoFees: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const fs = V ? 108 : 92;
  const swap = f(VO.noMiddlemen[0][1]) - LEAD - 2;
  const exit = f(VO.handly) - LEAD - 1;
  const push = keys(frame, [
    [640, 0.97],
    [exit, 1.03],
  ], ease.linear);
  const lift = ease.inOutCubic(clamp01((frame - swap) / 12));
  const half = V ? 150 : 72;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <ScanLines start={640} dur={16} />
      <AbsoluteFill style={{ transform: `scale(${push}) translateY(${drift(frame, 4, 150)}px)` }}>
      <AbsoluteFill style={swapOut(frame, exit)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translateY(${-half * lift}px) scale(${1 - 0.14 * lift})`, opacity: 1 - 0.62 * lift }}>
          <KineticText words={VO.noFees.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={fs} breaks={V ? [1] : []} />
        </AbsoluteFill>
        {frame >= swap && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translateY(${half}px)` }}>
            <KineticText words={VO.noMiddlemen.map(([text, sec]) => ({ text, at: f(sec) - LEAD - 1 }))} fontSize={fs} breaks={V ? [0] : []} mode="track" />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
