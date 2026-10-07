import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, ease, lerp, seeded } from "../explainer/lib/anim";
import { Bg, GREEN_GRAD, GREEN_INK, Logo, P, Shape, Txt } from "./kit";
import { morphNamed, shape } from "./morph";
import { absorbed, SERVICES, Vortex } from "./fx";
import { A10_END, A12_END } from "./scenes";
import { kw, w } from "./timeline";

const CX = 960;
const CY = 540;

// ------------------------------------------------------------------ "Aici intervine Handly": every postponed chore spirals into the mark, the charge before the drop
export const A12: React.FC = () => {
  const frame = useCurrentFrame();
  const hand = w("aici", 2);
  const dotIn = ease.outBack(clamp01((frame - (A10_END + 2)) / 14));
  const grow = ease.inOutCubic(clamp01((frame - (hand - 10)) / 12));
  const toLogo = ease.outBack(clamp01((frame - (hand - 4)) / 14));
  const tremble = frame > hand + 8 ? Math.sin(frame * 3.1) * 3 * clamp01((frame - (hand + 8)) / 8) : 0;
  const gather = 1 - 0.12 * ease.inCubic(clamp01((frame - (A12_END - 8)) / 8));
  // every postponed chore gets pulled into the mark
  const VF = A10_END + 2;
  const VS = 3;
  const VT = 38;
  const items = Array.from({ length: 24 }, (_, i) => ({ kind: "bubble" as const, icon: SERVICES[i % SERVICES.length].icon, d: 70 + Math.round(seeded(i, 7) * 110), tone: (i % 3) as 0 | 1 | 2 }));
  const ab = absorbed(frame, items.length, VF, VS, VT);
  const gulp = ab.since >= 0 && ab.since < 8 ? Math.sin((ab.since / 8) * Math.PI) * 0.12 : 0;
  const size = (lerp(40 + 3.5 * ab.count, 340, grow) + 6 * Math.sin(frame / 6)) * dotIn * gather * (1 + gulp);
  const pts = frame < hand - 4 ? shape("circle") : morphNamed("circle", "logo", toLogo, 1.2, frame);
  const real = clamp01((frame - (hand + 8)) / 6);
  return (
    <AbsoluteFill>
      <Bg kind="black" />
      <Vortex items={items} from={VF} stagger={VS} travel={VT} cx={CX} cy={CY + 30} radius={820} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${CX}px ${CY + 30}px, rgba(0,191,99,${0.08 + 0.02 * ab.count}) 0%, rgba(0,0,0,0) 40%)` }} />
      <Shape pts={pts} x={CX + tremble} y={CY + 30} size={size} fill={P.green} gradient={GREEN_GRAD} id="a12" opacity={1 - real} shadow={`drop-shadow(0 0 ${40 * grow}px rgba(0,191,99,0.35))`} />
      {real > 0 && <Logo size={size * 1.2} style={{ position: "absolute", left: CX + tremble - size * 0.6, top: CY + 30 - size * 0.58, opacity: real }} />}
      <Txt words={kw("aici", { only: [0, 1] })} size={64} on="black" y={CY - 300} />
      <Txt words={kw("aici", { only: [2], color: { 2: GREEN_INK } })} size={64} on="black" y={CY + 330} />
    </AbsoluteFill>
  );
};
