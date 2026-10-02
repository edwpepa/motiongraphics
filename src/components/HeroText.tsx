import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../constants";
import { premiumMove } from "../utils/easing";
import { interFontFamily as fontFamily } from "../font";

interface HeroTextProps {
  text: string;
  startFrame: number;
  /** frame by which the entrance animation has fully landed */
  landFrame: number;
  accentWords?: string[];
  fontSize?: number;
  color?: string;
  accentColor?: string;
  align?: "left" | "center" | "right";
  from?: "bottom" | "top" | "left" | "right";
  style?: React.CSSProperties;
}

export const HeroText: React.FC<HeroTextProps> = ({
  text,
  startFrame,
  landFrame,
  accentWords = [],
  fontSize = 72,
  color = COLORS.white,
  accentColor = COLORS.green,
  align = "center",
  from = "bottom",
  style,
}) => {
  const frame = useCurrentFrame();

  const offsetDistance = from === "bottom" || from === "top" ? 50 : 70;
  const sign = from === "bottom" || from === "left" ? 1 : -1;

  const progressOffset = premiumMove(frame, {
    from: offsetDistance * sign,
    to: 0,
    startFrame,
    endFrame: landFrame,
  });

  const opacity = premiumMove(frame, {
    from: 0,
    to: 1,
    startFrame,
    endFrame: Math.min(landFrame, startFrame + Math.max(10, (landFrame - startFrame) * 0.7)),
    settleAmount: 0,
  });

  const translate =
    from === "bottom" || from === "top"
      ? `translateY(${progressOffset}px)`
      : `translateX(${progressOffset}px)`;

  const words = text.split(" ");

  return (
    <div
      style={{
        fontFamily,
        fontWeight: 700,
        fontSize,
        lineHeight: 1.15,
        color,
        textAlign: align,
        opacity: Math.max(0, Math.min(1, opacity)),
        transform: translate,
        letterSpacing: -0.5,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const clean = w.replace(/[.,—]/g, "");
        const isAccent = accentWords.includes(clean);
        return (
          <span key={i} style={{ color: isAccent ? accentColor : color }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};
