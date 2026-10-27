import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GlassStage } from "./glass";
import { OUTFIT, useOutfit } from "./font";

export const GlassTest: React.FC = () => {
  const ready = useOutfit();
  const f = useCurrentFrame();
  if (!ready) return null;
  const x = 420 + Math.sin(f / 40) * 260;
  const under = (
    <AbsoluteFill style={{ background: "#eceef0" }}>
      <div style={{ position: "absolute", left: 150, top: -40, width: 1900, height: 1300, borderRadius: 320, background: "#d9dbe1", backgroundImage: "linear-gradient(rgba(255,255,255,0.55) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.55) 2px, transparent 2px)", backgroundSize: "390px 390px", backgroundPosition: "0 140px" }} />
      <div style={{ position: "absolute", left: 830, top: 330, fontFamily: OUTFIT, fontWeight: 600, fontSize: 330, letterSpacing: "-0.045em", color: "#16161a", lineHeight: 1 }}>Liquid</div>
      <div style={{ position: "absolute", left: 1250, top: 660, fontFamily: OUTFIT, fontWeight: 600, fontSize: 190, letterSpacing: "-0.04em", color: "#6c6c74", lineHeight: 1, filter: "blur(3px)" }}>glass</div>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <GlassStage
        under={under}
        panes={[
          {
            x, y: 270, w: 540, h: 540, tone: "light",
            content: (
              <svg width={540} height={540}>
                <path d="M270 200 V340 M200 270 H340" stroke="#fff" strokeWidth={26} strokeLinecap="round" opacity={0.95} />
              </svg>
            ),
          },
          { x: 1180, y: 860, w: 560, h: 150, radius: 75, tone: "light" },
        ]}
      />
    </AbsoluteFill>
  );
};
