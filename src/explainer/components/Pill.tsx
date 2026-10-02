import React from "react";
import { C, FONT } from "../theme";

/** White floating tag with an emoji — the reference's "Health Goals / Workouts" chips. */
export const Pill: React.FC<{
  emoji?: string;
  label: string;
  size?: number;
  dark?: boolean;
  style?: React.CSSProperties;
}> = ({ emoji, label, size = 28, dark, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.4,
      padding: `${size * 0.42}px ${size * 0.78}px ${size * 0.42}px ${size * 0.55}px`,
      borderRadius: 999,
      background: dark ? "rgba(32,36,35,0.92)" : C.white,
      border: dark ? "1.5px solid rgba(255,255,255,0.09)" : "1px solid rgba(20,24,22,0.05)",
      boxShadow: dark
        ? "0 18px 40px rgba(0,0,0,0.45)"
        : "0 14px 34px rgba(20,24,22,0.12), 0 2px 6px rgba(20,24,22,0.06)",
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: size,
      color: dark ? C.nightInk : C.ink,
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {emoji && <span style={{ fontSize: size * 1.05, lineHeight: 1 }}>{emoji}</span>}
    <span>{label}</span>
  </div>
);
