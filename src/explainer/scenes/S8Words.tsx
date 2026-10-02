import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppleLine, GREEN_D, textWidth } from "../components/AppleText";
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
  const cs = V ? 120 : 116;
  const rezW = textWidth("Se rezolvă!", V ? 120 : 130, -0.04);
  const style = { letterSpacing: "-0.045em" };

  return (
    <AbsoluteFill>
      <Beat from={HANDLY} to={POSTEZI - 2}>
        <AppleLine words={[{ text: "handly.ro", at: HANDLY, color: GREEN_D }]} fontSize={V ? 160 : 190} tracking={-0.045} style={{ filter: "drop-shadow(0 0 40px rgba(0,230,118,0.35))" }} />
      </Beat>
      <Beat from={POSTEZI} to={REZOLVA - 2}>
        <AppleLine words={[{ text: "Postezi.", at: POSTEZI }]} fontSize={V ? 140 : 160} tracking={-0.04} style={{ filter: "drop-shadow(0 0 30px rgba(0,191,99,0.25))" }} />
      </Beat>
      <Beat from={REZOLVA} to={LOGO_START - 1}>
        <div style={{ display: "flex", flexDirection: V ? "column" : "row", alignItems: "center", gap: V ? 30 : 40 }}>
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
          <div style={{ position: "relative", width: V ? 0 : rezW, height: V ? 130 : 0 }}>
            <div style={{ position: "absolute", left: V ? 0 : rezW / 2, top: V ? 65 : 0 }}>
              <AppleLine words={[{ text: "Se", at: REZOLVA }, { text: "rezolvă!", at: f(VO.rezolva) - LEAD }]} fontSize={V ? 120 : 130} tracking={-0.04} style={{ filter: "drop-shadow(0 0 30px rgba(0,191,99,0.25))" }} />
            </div>
          </div>
        </div>
      </Beat>
    </AbsoluteFill>
  );
};
