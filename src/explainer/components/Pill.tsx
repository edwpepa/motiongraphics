import React from "react";
import { BOLD, C, FONT } from "../theme";

/** Floating tag with an icon — the reference's "Health Goals / Workouts" chips. */
export const Pill: React.FC<{
  icon?: React.ReactNode;
  label: string;
  size?: number;
  dark?: boolean;
  style?: React.CSSProperties;
}> = ({ icon, label, size = 28, dark, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.42,
      padding: `${size * 0.38}px ${size * 0.8}px ${size * 0.38}px ${icon ? size * 0.4 : size * 0.8}px`,
      borderRadius: 999,
      background: dark ? "rgba(32,36,35,0.92)" : C.white,
      border: dark ? "1.5px solid rgba(255,255,255,0.09)" : "1px solid rgba(20,24,22,0.05)",
      boxShadow: dark ? "0 18px 40px rgba(0,0,0,0.45)" : "0 14px 34px rgba(20,24,22,0.12), 0 2px 6px rgba(20,24,22,0.06)",
      fontFamily: FONT,
      fontWeight: BOLD,
      fontSize: size,
      color: dark ? C.nightInk : C.ink,
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {icon}
    <span>{label}</span>
  </div>
);
