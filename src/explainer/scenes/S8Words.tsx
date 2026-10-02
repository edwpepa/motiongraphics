import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { INK_DARK, KineticText, SHADOW_DARK } from "../components/KineticText";
import { ACCENT } from "../components/Phrase";
import { clamp01, ease } from "../lib/anim";
import { SuccessMark } from "../components/SuccessMark";
import { useLayout } from "../layout";
import { f, VO } from "../timing";

const LEAD = 3;
const HANDLY = f(VO.handly) - LEAD;
const POSTEZI = f(VO.postezi2) - LEAD;
const REZOLVA = f(VO.seRezolva) - LEAD;
export const LOGO_START = f(VO.voEnd) + 2;

/** In → hold (with a tiny punch) → blurred out; each beat owns the centre of the frame. */
const Beat: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 8) return null;
  const k = 1 - ease.outExpo(clamp01((frame - from) / 12));
  const t = clamp01((frame - to) / 7);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${(1 + 0.2 * k) * (1 - 0.1 * ease.inCubic(t))})`,
        opacity: 1 - ease.inCubic(t),
        filter: t > 0 ? `blur(${20 * t}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// "Handly. Postezi. Se rezolvă!"
export const S8Words: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const cs = V ? 130 : 132;
  const style = { letterSpacing: "-0.045em" };

  return (
    <AbsoluteFill>
      <Beat from={HANDLY} to={POSTEZI - 2}>
        <KineticText words={[{ text: "handly.ro", at: HANDLY }]} fontSize={V ? 190 : 250} ink={ACCENT} tint={ACCENT} shadow="drop-shadow(0 0 50px rgba(0,230,118,0.45))" style={style} />
      </Beat>
      <Beat from={POSTEZI} to={REZOLVA - 2}>
        <KineticText words={[{ text: "Postezi.", at: POSTEZI }]} fontSize={V ? 180 : 230} ink={INK_DARK} tint={ACCENT} shadow={SHADOW_DARK} style={style} />
      </Beat>
      <Beat from={REZOLVA} to={LOGO_START - 1}>
        <div style={{ display: "flex", flexDirection: V ? "column" : "row", alignItems: "center", gap: 60 }}>
          <SuccessMark frame={frame} at={REZOLVA - 1} size={cs} />
          <KineticText
            words={[
              { text: "Se", at: REZOLVA },
              { text: "rezolvă!", at: f(VO.rezolva) - LEAD },
            ]}
            fontSize={V ? 150 : 180}
            ink={INK_DARK}
            tint={ACCENT}
            shadow={SHADOW_DARK}
            style={style}
          />
        </div>
      </Beat>
    </AbsoluteFill>
  );
};
