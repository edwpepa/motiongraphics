import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText } from "../components/KineticText";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { f, VO } from "../timing";
import { swapOut } from "./S7NoFees";

const LEAD = 3;
const HANDLY = f(VO.handly) - LEAD;
const POSTEZI = f(VO.postezi2) - LEAD;
const REZOLVA = f(VO.seRezolva) - LEAD;
export const LOGO_START = f(VO.voEnd) + 2;

const Centered: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; punchAt?: number }> = ({ children, style, punchAt }) => {
  const frame = useCurrentFrame();
  const k = punchAt === undefined ? 0 : 1 - ease.outExpo(clamp01((frame - punchAt) / 12));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...style }}>
      <div style={{ transform: `scale(${1 + 0.22 * k})` }}>{children}</div>
    </AbsoluteFill>
  );
};

// "Handly. Postezi. Se rezolvă." — one big beat per word, swapping in place (brand always written handly.ro)
export const S8Words: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const push = keys(frame, [
    [HANDLY - 6, 0.96],
    [LOGO_START, 1.05],
  ], ease.linear);
  const check = clamp01((frame - (REZOLVA + 5)) / 12);
  const checkPop = pop(frame, REZOLVA + 3, 12, 170);
  const checkSize = V ? 132 : 128;

  return (
    <AbsoluteFill style={{ transform: `scale(${push}) translateY(${drift(frame, 3, 140)}px)` }}>
      {frame < POSTEZI + 6 && (
        <Centered style={swapOut(frame, POSTEZI - 1)} punchAt={HANDLY}>
          <KineticText words={[{ text: "handly.ro", at: HANDLY }]} fontSize={V ? 178 : 220} style={{ letterSpacing: "-0.045em" }} />
        </Centered>
      )}
      {frame >= POSTEZI - 1 && frame < REZOLVA + 6 && (
        <Centered style={swapOut(frame, REZOLVA - 1)} punchAt={POSTEZI}>
          <KineticText words={[{ text: "Postezi.", at: POSTEZI }]} fontSize={V ? 168 : 190} style={{ letterSpacing: "-0.04em" }} />
        </Centered>
      )}
      {frame >= REZOLVA - 1 && (
        <Centered punchAt={REZOLVA}>
          <div style={{ display: "flex", flexDirection: V ? "column" : "row", alignItems: "center", gap: V ? 40 : 44 }}>
            <div
              style={{
                width: checkSize,
                height: checkSize,
                borderRadius: "50%",
                background: "linear-gradient(180deg, #2fe08a 0%, #00b35c 100%)",
                boxShadow: "inset 0 3px 0 rgba(255,255,255,0.3), 0 18px 44px rgba(0,191,99,0.35)",
                transform: `scale(${checkPop})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={checkSize * 0.6} height={checkSize * 0.6} viewBox="0 0 70 70">
                <path
                  d="M18 36 L30 48 L53 22"
                  fill="none"
                  stroke="#fff"
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - ease.outCubic(check)}
                />
              </svg>
            </div>
            <KineticText
              words={[
                { text: "Se", at: REZOLVA },
                { text: "rezolvă!", at: f(VO.rezolva) - LEAD },
              ]}
              fontSize={V ? 136 : 150}
              style={{ letterSpacing: "-0.04em" }}
            />
          </div>
        </Centered>
      )}
    </AbsoluteFill>
  );
};
