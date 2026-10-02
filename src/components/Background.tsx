import React from "react";
import { useCurrentFrame, staticFile } from "remotion";
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
        // soft glow via radial-gradient instead of filter:blur() — far cheaper to paint per frame
        background: `radial-gradient(circle, ${color} 0%, ${color} 18%, transparent 70%)`,
        opacity,
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
      <Blob size={1100} top="-18%" left="-30%" color={COLORS.green} opacity={0.28} driftAmp={30} period={360} phase={0} />
      <Blob size={900} top="50%" left="50%" color={COLORS.green} opacity={0.18} driftAmp={26} period={300} phase={2} />
      <Blob size={700} top="70%" left="-25%" color={COLORS.greenDark} opacity={0.32} driftAmp={20} period={420} phase={1.2} />

      {/* subtle vignette for premium depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* static film grain texture (tiled) — cheap, no per-frame filter computation */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${staticFile("images/grain.png")})`,
          backgroundSize: "512px 512px",
          opacity: 0.045,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
};
