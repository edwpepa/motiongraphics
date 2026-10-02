import React, { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { seeded } from "../lib/anim";
import { useLayout } from "../layout";
import { MorphShapes } from "./MorphShapes";

/**
 * The one set: near-black, a single soft green light falling from the top, slow dust motes and
 * film grain. Monochrome on purpose — the brand green is the only colour in the film.
 */
export const Stage: React.FC<{ light?: number; lightX?: number }> = ({ light = 1, lightX = 0.5 }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const motes = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        x: seeded(i, 1),
        y: seeded(i, 2),
        r: 1 + seeded(i, 3) * 2.6,
        a: 0.15 + seeded(i, 4) * 0.55,
        sp: 0.15 + seeded(i, 5) * 0.5,
        ph: seeded(i, 6) * 6.28,
      })),
    []
  );
  const breathe = 0.85 + 0.15 * Math.sin(frame / 40);

  return (
    <AbsoluteFill style={{ background: "#030504", overflow: "hidden" }}>
      {/* top light cone */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${L.vertical ? "90% 45%" : "55% 70%"} at ${lightX * 100}% -8%, rgba(0,191,99,${0.42 * light * breathe}) 0%, rgba(0,140,72,${0.16 * light}) 38%, rgba(0,0,0,0) 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${L.vertical ? "60% 30%" : "35% 45%"} at ${lightX * 100}% -4%, rgba(160,255,200,${0.12 * light}) 0%, rgba(0,0,0,0) 70%)`,
        }}
      />
      <MorphShapes tone="dark" opacity={0.45 * light} speed={1.3} />
      {/* dust */}
      <svg width={L.W} height={L.H} style={{ position: "absolute", inset: 0 }}>
        {motes.map((m, i) => {
          const y = ((m.y - (frame / 900) * m.sp + 10) % 1) * L.H;
          const x = m.x * L.W + Math.sin(frame / 60 + m.ph) * 12;
          const near = Math.max(0, 1 - Math.abs(x / L.W - lightX) * 1.6) * Math.max(0, 1 - y / L.H);
          return <circle key={i} cx={x} cy={y} r={m.r} fill={`rgba(140,255,190,${m.a * (0.25 + 0.75 * near) * light})`} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)" }} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("images/grain.png")})`,
          backgroundSize: "512px 512px",
          opacity: 0.06,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};
