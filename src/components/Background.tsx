import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../constants";
import { idleDrift } from "../utils/easing";

const Blob: React.FC<{
  size: number;
  top: string;
  left: string;
  color: string;
  opacity: number;
  driftAmp: number;
  period: number;
  phase: number;
}> = ({ size, top, left, color, opacity, driftAmp, period, phase }) => {
  const frame = useCurrentFrame();
  const dx = idleDrift(frame, driftAmp, period, phase);
  const dy = idleDrift(frame, driftAmp * 0.7, period * 1.3, phase + 1.4);
  const scale = 1 + idleDrift(frame, 0.04, period * 1.6, phase + 2.1);

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity,
        filter: "blur(140px)",
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
      }}
    />
  );
};

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow continuous rotation of the gradient angle — nothing ever sits fully still
  const angle = 135 + idleDrift(frame, 18, 480, 0);
  const posShift = idleDrift(frame, 8, 620, 0.6);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: COLORS.black,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -40,
          background: `linear-gradient(${angle}deg, ${COLORS.greenDark} 0%, ${COLORS.black} ${55 + posShift}%, ${COLORS.black} 100%)`,
        }}
      />
      <Blob size={900} top="-10%" left="-20%" color={COLORS.green} opacity={0.35} driftAmp={30} period={360} phase={0} />
      <Blob size={700} top="55%" left="60%" color={COLORS.green} opacity={0.22} driftAmp={26} period={300} phase={2} />
      <Blob size={520} top="75%" left="-15%" color={COLORS.greenDark} opacity={0.4} driftAmp={20} period={420} phase={1.2} />

      {/* subtle vignette for premium depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* film grain texture */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
};
