import React from "react";
import { C, FONT } from "../theme";
import { mixColor } from "../lib/anim";

/** Emoji avatar disc for taskers; `lit` (0–1) turns on the green ring + glow. */
export const Avatar: React.FC<{ emoji: string; size: number; lit?: number; bg?: string }> = ({ emoji, size, lit = 0, bg }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: bg ?? "radial-gradient(circle at 35% 30%, #34403b 0%, #1d2421 70%)",
      border: `${Math.max(2, size * 0.035)}px solid ${mixColor("#3a4440", C.green, lit)}`,
      boxShadow: `0 0 ${size * 0.45 * lit}px rgba(0,191,99,${0.55 * lit}), 0 ${size * 0.12}px ${size * 0.3}px rgba(0,0,0,0.45)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT,
      fontSize: size * 0.56,
      lineHeight: 1,
      flexShrink: 0,
    }}
  >
    {emoji}
  </div>
);
