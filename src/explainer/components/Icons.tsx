import React from "react";

// Glyph geometry from Lucide (https://lucide.dev, ISC licence), drawn SF-Symbols style:
// rounded strokes, optionally on an iOS-style gradient tile.
const GLYPHS = {
  droplet: `<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>`,
  wrench: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>`,
  hammer: `<path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>`,
  roller: `<rect width="16" height="6" x="2" y="2" rx="2"/><path d="M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect width="4" height="6" x="8" y="16" rx="1"/>`,
  clock: `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`,
  timer: `<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>`,
  pin: `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`,
  check: `<path d="M20 6 9 17l-5-5"/>`,
  eye: `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`,
  star: `<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>`,
  bell: `<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>`,
  handshake: `<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>`,
  chevron: `<path d="m9 18 6-6-6-6"/>`,
} as const;

export type GlyphName = keyof typeof GLYPHS;

export const Glyph: React.FC<{
  name: GlyphName;
  size: number;
  color?: string;
  weight?: number;
  fill?: string;
  style?: React.CSSProperties;
}> = ({ name, size, color = "currentColor", weight = 2.1, fill = "none", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={weight}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...style }}
    dangerouslySetInnerHTML={{ __html: GLYPHS[name] }}
  />
);

// iOS system palette, top → bottom of the tile gradient
export const TILE = {
  blue: ["#4aa8ff", "#0a6cf0"],
  orange: ["#ffb340", "#ff8a00"],
  green: ["#2fe08a", "#00b35c"],
  red: ["#ff6b62", "#e8352b"],
  indigo: ["#8a88ff", "#5856d6"],
  teal: ["#5fd3e8", "#1aa7c2"],
  gray: ["#a8adb5", "#7b818a"],
} as const;

export type TileColor = keyof typeof TILE;

/** Rounded-square gradient tile with a white glyph, like an iOS Settings icon. */
export const IconTile: React.FC<{ name: GlyphName; color: TileColor; size: number; style?: React.CSSProperties }> = ({
  name,
  color,
  size,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.27,
      background: `linear-gradient(180deg, ${TILE[color][0]} 0%, ${TILE[color][1]} 100%)`,
      boxShadow: `inset 0 ${size * 0.03}px 0 rgba(255,255,255,0.28), 0 ${size * 0.08}px ${size * 0.22}px ${TILE[color][1]}55`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      ...style,
    }}
  >
    <Glyph name={name} size={size * 0.58} color="#ffffff" weight={2.3} />
  </div>
);
