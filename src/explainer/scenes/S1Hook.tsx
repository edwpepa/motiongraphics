import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText } from "../components/KineticText";
import { Swoosh } from "../components/Swoosh";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys } from "../lib/anim";
import { useLayout } from "../layout";
import { f, VO } from "../timing";

const LEAD = 3; // words start entering a hair before they're spoken

// "Te tot gândești la treaba aia obositoare prin casă..."
export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const exitStart = f(VO.hookEnd) - 1;

  const words = VO.hook.map(([text, sec]) => ({ text, at: f(sec) - LEAD }));

  // slow camera push while the line builds, then a whip to the left
  const push = keys(frame, [
    [0, 0.94],
    [exitStart, 1.04],
  ], ease.outCubic);
  const whipT = clamp01((frame - exitStart) / 8);
  const whipX = -L.W * 0.8 * ease.inExpo(whipT) + drift(frame, 6, 140);
  const prevX = -L.W * 0.8 * ease.inExpo(clamp01((frame - 1 - exitStart) / 8));
  const vel = Math.abs(whipX - prevX);

  // reel: four short lines, bigger type; 16:9: two lines
  const fontSize = L.vertical ? 92 : 64;
  const breaks = L.vertical ? [2, 5, 6] : [5];
  const sw = L.vertical
    ? [
        { x: -90, y: -40, w: 170, h: 56 },
        { x: 420, y: -70, w: 220, h: 50 },
        { x: 380, y: 440, w: 200, h: 50 },
      ]
    : [
        { x: -120, y: -34, w: 180, h: 60 },
        { x: 250, y: -74, w: 240, h: 50 },
        { x: 560, y: 150, w: 200, h: 50 },
      ];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <DirBlur x={vel * 0.45} style={{ transform: `translateX(${whipX}px) scale(${push})`, opacity: 1 - ease.inCubic(clamp01((frame - exitStart - 3) / 5)) }}>
        <div style={{ position: "relative" }}>
          <KineticText words={words} fontSize={fontSize} breaks={breaks} />
          <Swoosh {...sw[0]} start={words[0].at - 4} dur={18} />
          <Swoosh {...sw[1]} start={words[2].at - 2} dur={18} flip />
          <Swoosh {...sw[2]} start={words[8].at} dur={18} />
        </div>
      </DirBlur>
    </AbsoluteFill>
  );
};
