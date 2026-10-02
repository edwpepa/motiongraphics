import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { INK_DARK, KineticText, SHADOW_DARK } from "../components/KineticText";
import { ACCENT } from "../components/Phrase";
import { clamp01, ease, pop } from "../lib/anim";
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
  const check = clamp01((frame - (REZOLVA + 5)) / 12);
  const checkPop = pop(frame, REZOLVA + 3, 12, 170);
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
        <div style={{ display: "flex", flexDirection: V ? "column" : "row", alignItems: "center", gap: 44 }}>
          <div
            style={{
              width: cs,
              height: cs,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #9dffc9 0%, #00d26a 45%, #008f47 100%)",
              boxShadow: "inset 0 3px 0 rgba(255,255,255,0.35), 0 0 60px rgba(0,230,118,0.55)",
              transform: `scale(${checkPop})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={cs * 0.6} height={cs * 0.6} viewBox="0 0 70 70">
              <path d="M18 36 L30 48 L53 22" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease.outCubic(check)} />
            </svg>
          </div>
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
