import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { LiquidGlass } from "../components/Glass";
import { KineticText } from "../components/KineticText";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, lerp, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { f, VO } from "../timing";

const LEAD = 3; // words start entering a hair before they're spoken

// "Te tot gândești la treaba aia obositoare prin casă..."
// Opening: a light bloom, a liquid-glass drop that morphs into a lens and glides over the line,
// bending the words as they arrive.
export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const exitStart = f(VO.hookEnd) - 1;
  const words = VO.hook.map(([text, sec]) => ({ text, at: f(sec) - LEAD }));

  // camera: slow push, then whip left
  const push = keys(frame, [
    [0, 0.95],
    [exitStart, 1.04],
  ], ease.outCubic);
  const whipT = clamp01((frame - exitStart) / 8);
  const whipX = -L.W * 0.8 * ease.inExpo(whipT);
  const prevX = -L.W * 0.8 * ease.inExpo(clamp01((frame - 1 - exitStart) / 8));
  const vel = Math.abs(whipX - prevX);

  // white bloom fading into the mesh
  const bloom = 1 - ease.outCubic(clamp01(frame / 16));

  // the glass: drop (circle) → stretches into a lens pill → glides across the text
  const drop = pop(frame, 1, 11, 120);
  const morph = ease.inOutCubic(clamp01((frame - 10) / 18));
  const gw = lerp(V ? 300 : 280, V ? 560 : 520, morph) * drop;
  const gh = lerp(V ? 300 : 280, V ? 220 : 220, morph) * drop;
  const travel = ease.inOutCubic(clamp01((frame - 14) / (exitStart - 14)));
  const gx = lerp(0, V ? -170 : -560, morph) + (V ? 340 : 1120) * travel + drift(frame, 10, 90);
  // glides just under the line so it bends the edge of the words without hiding them
  const gy = (V ? lerp(0, 420, morph) : lerp(0, 190, morph)) + drift(frame, 8, 110, 1);
  const rot = drift(frame, 4, 140, 0.4);

  const fontSize = V ? 92 : 66;
  const breaks = V ? [2, 5, 6] : [5];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <DirBlur
        x={vel * 0.45}
        style={{ position: "absolute", inset: 0, transform: `translateX(${whipX}px) scale(${push})`, opacity: 1 - ease.inCubic(clamp01((frame - exitStart - 3) / 5)) }}
      >
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <KineticText words={words} fontSize={fontSize} breaks={breaks} />
        </AbsoluteFill>
        {gw > 4 && (
          <div style={{ position: "absolute", left: L.cx + gx - gw / 2, top: L.cy + gy - gh / 2, transform: `rotate(${rot}deg)` }}>
            <LiquidGlass width={gw} height={gh} radius={Math.min(gw, gh) / 2} strength={90} frost={0.6} />
          </div>
        )}
      </DirBlur>
      <AbsoluteFill style={{ background: "#ffffff", opacity: bloom, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
