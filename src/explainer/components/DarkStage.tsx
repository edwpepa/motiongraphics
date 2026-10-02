import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease } from "../lib/anim";
import { NightBackground } from "./Backgrounds";

/**
 * Shared dark set for the radar + tasker scenes. Enters as a radar-ping circle reveal from
 * the posted phone, leaves through a horizontal scan-line wipe (the reference's dark → light cut).
 */
export const DarkStage: React.FC<{ revealAt: number; exitAt: number; children: React.ReactNode }> = ({ revealAt, exitAt, children }) => {
  const frame = useCurrentFrame();

  const r = 1150 * ease.inOutCubic(clamp01((frame - revealAt) / 15));
  const ex = clamp01((frame - exitAt) / 11);
  const exPrev = clamp01((frame - 1 - exitAt) / 11);
  const stripe = 11;
  const duty = (1 - ease.inCubic(ex)) * stripe;
  const mask = ex > 0 ? `repeating-linear-gradient(180deg, #000 0px, #000 ${duty}px, transparent ${duty}px, transparent ${stripe}px)` : undefined;
  const shift = -160 * ease.inCubic(ex);

  // the light ribbon sits low behind the radar, then drifts up behind the cards
  const k = ease.inOutCubic(clamp01((frame - (revealAt + 72)) / 30));
  const glowX = 0.3 - 0.02 * k;
  const glowY = 0.62 + 0.02 * k;
  const glowI = 0.55 + 0.1 * k;
  const glowS = 1 - 0.12 * k;

  return (
    <AbsoluteFill
      style={{
        clipPath: frame < revealAt + 15 ? `circle(${r}px at 50% 50%)` : undefined,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <DirBlur x={Math.abs(ex - exPrev) * 260} style={{ position: "absolute", inset: 0, transform: `translateX(${shift}px)` }}>
        <NightBackground cx={glowX} cy={glowY} intensity={glowI} scale={glowS} />
        {children}
      </DirBlur>
    </AbsoluteFill>
  );
};
