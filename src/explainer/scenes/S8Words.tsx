import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText } from "../components/KineticText";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { C } from "../theme";
import { f, VO } from "../timing";
import { swapOut } from "./S7NoFees";

const LEAD = 3;
const HANDLY = f(VO.handly) - LEAD;
const POSTEZI = f(VO.postezi2) - LEAD;
const REZOLVA = f(VO.seRezolva) - LEAD;
export const LOGO_START = f(VO.voEnd) + 2;

const Centered: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...style }}>{children}</AbsoluteFill>
);

// "Handly. Postezi. Se rezolvă." — one beat per word, swapping in place
export const S8Words: React.FC = () => {
  const frame = useCurrentFrame();
  const push = keys(frame, [
    [HANDLY - 6, 0.96],
    [LOGO_START, 1.05],
  ], ease.linear);
  const check = clamp01((frame - (REZOLVA + 5)) / 12);
  const checkPop = pop(frame, REZOLVA + 3, 12, 170);

  return (
    <AbsoluteFill style={{ transform: `scale(${push}) translateY(${drift(frame, 3, 140)}px)` }}>
      {frame < POSTEZI + 6 && (
        <Centered style={swapOut(frame, POSTEZI - 1)}>
          <KineticText words={[{ text: "Handly.", at: HANDLY, color: C.green }]} fontSize={96} weight={700} />
        </Centered>
      )}
      {frame >= POSTEZI - 1 && frame < REZOLVA + 6 && (
        <Centered style={swapOut(frame, REZOLVA - 1)}>
          <KineticText words={[{ text: "Postezi.", at: POSTEZI }]} fontSize={96} weight={700} />
        </Centered>
      )}
      {frame >= REZOLVA - 1 && (
        <Centered>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: C.green,
                boxShadow: "0 14px 34px rgba(0,191,99,0.35)",
                transform: `scale(${checkPop})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={56} height={56} viewBox="0 0 70 70">
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
                { text: "rezolvă.", at: f(VO.seRezolva + 0.11) - LEAD },
              ]}
              fontSize={96}
              weight={700}
            />
          </div>
        </Centered>
      )}
    </AbsoluteFill>
  );
};
