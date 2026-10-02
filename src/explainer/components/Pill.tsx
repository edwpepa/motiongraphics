import React from "react";
import { BOLD, C, FONT } from "../theme";
import { LiquidGlass } from "./Glass";

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

/** Liquid-glass variant of the tag (width estimated from the label, Inter Bold ≈ 0.6em per glyph). */
export const GlassPill: React.FC<{ icon?: React.ReactNode; label: string; size?: number; tone?: "light" | "dark"; iconSize?: number }> = ({
  icon,
  label,
  size = 30,
  tone = "light",
  iconSize,
}) => {
  const h = size * 2.2;
  const w = label.length * size * 0.6 + (icon ? (iconSize ?? size * 1.45) + size * 0.45 : 0) + size * 1.5;
  return (
    <LiquidGlass width={w} height={h} radius={h / 2} tone={tone} strength={36} frost={10}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: size * 0.45,
          fontFamily: FONT,
          fontWeight: BOLD,
          fontSize: size,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          color: tone === "light" ? C.ink : C.nightInk,
          paddingRight: icon ? size * 0.15 : 0,
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
    </LiquidGlass>
  );
};
