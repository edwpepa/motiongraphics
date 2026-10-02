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
        background: `radial-gradient(circle, ${color} 0%, ${color} 18%, transparent 70%)`,
        opacity,
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
      }}
    />
  );
};

const DotGrid: React.FC<{ opacity: number; dotColor: string }> = ({ opacity, dotColor }) => {
  const frame = useCurrentFrame();
  const shift = idleDrift(frame, 4, 500, 0);
  return (
    <div
      style={{
        position: "absolute",
        inset: -20,
        opacity,
        backgroundImage: `radial-gradient(${dotColor} 2.4px, transparent 2.4px)`,
        backgroundSize: "38px 38px",
        transform: `translate(${shift}px, ${shift * 0.6}px)`,
      }}
    />
  );
};

/** Light theme — matches the app's white sign-up panel: off-white + soft dot-grid + faint green glow. */
export const LightBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const glowShift = idleDrift(frame, 6, 540, 0.4);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#fafbfa" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 120% 60% at 50% ${18 + glowShift}%, #eafbf2 0%, #fafbfa 55%, #fafbfa 100%)`,
        }}
      />
      <DotGrid opacity={0.55} dotColor="#dbe3de" />
      <Blob size={760} top="-14%" left="55%" color={COLORS.green} opacity={0.1} driftAmp={22} period={380} phase={0} />
      <Blob size={560} top="68%" left="-18%" color={COLORS.green} opacity={0.08} driftAmp={18} period={420} phase={1.4} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0) 50%, rgba(235,240,237,0.65) 100%)",
        }}
      />
    </div>
  );
};

/** Dark theme — matches the app's green hero panel (the "Bine ai venit pe handly.ro!" side). */
export const DarkBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = 150 + idleDrift(frame, 14, 480, 0);
  const posShift = idleDrift(frame, 7, 600, 0.6);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: COLORS.greenPanelDeep }}>
      <div
        style={{
          position: "absolute",
          inset: -40,
          background: `linear-gradient(${angle}deg, ${COLORS.greenPanel} 0%, ${COLORS.greenPanelDeep} ${58 + posShift}%, ${COLORS.greenPanelDeep} 100%)`,
        }}
      />
      <DotGrid opacity={0.14} dotColor="#1d6b43" />
      <Blob size={1000} top="-16%" left="-25%" color={COLORS.green} opacity={0.22} driftAmp={28} period={360} phase={0} />
      <Blob size={760} top="60%" left="55%" color={COLORS.green} opacity={0.16} driftAmp={24} period={320} phase={2} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${staticFile("images/grain.png")})`,
          backgroundSize: "512px 512px",
          opacity: 0.04,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
};
