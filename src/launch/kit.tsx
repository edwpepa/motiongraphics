import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { INK, INK_DARK, KineticText, KWord } from "../explainer/components/KineticText";
import { clamp01, ease } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { Pt, toPath } from "./morph";

export const P = {
  white: "#f4f6f3",
  black: "#060807",
  green: "#00bf63",
  deep: "#06301f",
  mint: "#b9ffd6",
  ink: "#0b0f0d",
};

export type BgKind = "white" | "black" | "green" | "deep";

const BG: Record<BgKind, string> = {
  white: "radial-gradient(ellipse 80% 90% at 50% 45%, #ffffff 0%, #eef1ee 60%, #e2e7e3 100%)",
  black: "radial-gradient(ellipse 80% 90% at 50% 40%, #121715 0%, #070908 55%, #020303 100%)",
  green: "radial-gradient(ellipse 80% 90% at 50% 40%, #1cd57a 0%, #00bf63 50%, #009e51 100%)",
  deep: "radial-gradient(ellipse 80% 90% at 50% 40%, #0c4730 0%, #06301f 55%, #021a10 100%)",
};
export const isDark = (k: BgKind) => k !== "white";

/** full-bleed colour set with a whisper of grain */
export const Bg: React.FC<{ kind: BgKind; style?: React.CSSProperties }> = ({ kind, style }) => (
  <AbsoluteFill style={{ background: BG[kind], ...style }}>
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", opacity: kind === "white" ? 0.035 : 0.06, mixBlendMode: "overlay" }} />
  </AbsoluteFill>
);

/** Mounts children only inside [from, to). */
export const Win: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  return frame >= from && frame < to ? <>{children}</> : null;
};

/** an outline drawn as a filled SVG shape, centred at (x, y), `size` px for the 100-unit box */
export const Shape: React.FC<{
  pts: Pt[];
  x: number;
  y: number;
  size: number;
  fill: string;
  rot?: number;
  sx?: number;
  sy?: number;
  opacity?: number;
  shadow?: string;
  gradient?: [string, string];
  id?: string;
  children?: React.ReactNode;
}> = ({ pts, x, y, size, fill, rot = 0, sx = 1, sy = 1, opacity = 1, shadow, gradient, id = "g", children }) => {
  const box = size * 2.4;
  const k = size / 100;
  return (
    <svg
      width={box}
      height={box}
      viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}
      style={{ position: "absolute", left: x - box / 2, top: y - box / 2, overflow: "visible", opacity, filter: shadow, transform: `rotate(${rot}deg) scale(${sx}, ${sy})` }}
    >
      {gradient && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
      )}
      <path d={toPath(pts, k)} fill={gradient ? `url(#${id})` : fill} />
      {children}
    </svg>
  );
};

export const GREEN_GRAD: [string, string] = ["#3ff09a", "#00a856"];
export const WHITE_INK: [string, string] = ["#ffffff", "#e9f3ee"];
export const BLACK_INK: [string, string] = ["#1b221e", "#000000"];
export const GREEN_INK: [string, string] = ["#1fd17c", "#00964d"];
export const MINT_INK: [string, string] = ["#d9ffe9", "#5df0a5"];
export const DEEP_INK: [string, string] = ["#0a4a30", "#042417"];

/** Kinetic line, laid out at (x, y) as its centre or left edge. */
export const Txt: React.FC<{
  words: KWord[];
  size: number;
  on: BgKind;
  x?: number;
  y?: number;
  align?: "center" | "left" | "right";
  breaks?: number[];
  out?: number;
  ink?: [string, string];
  tint?: [string, string];
  dur?: number;
  tracking?: string;
  mode?: "rise" | "track";
  lineHeight?: number;
  weight?: number;
}> = ({ words, size, on, x = 960, y = 540, align = "center", breaks, out, ink, tint, dur = 12, tracking = "-0.045em", mode, lineHeight = 1.08, weight }) => {
  const frame = useCurrentFrame();
  if (!words.length || frame < words[0].at - 1) return null;
  const t = out === undefined ? 0 : clamp01((frame - out) / 7);
  if (t >= 1) return null;
  const dark = isDark(on);
  const defInk = ink ?? (on === "white" ? INK : on === "green" ? WHITE_INK : INK_DARK);
  const defTint = tint ?? (on === "white" ? GREEN_INK : on === "green" ? DEEP_INK : MINT_INK);
  const shadow = on === "white" ? "drop-shadow(0 10px 24px rgba(8,48,28,0.12))" : on === "green" ? "drop-shadow(0 10px 30px rgba(0,60,30,0.35))" : "drop-shadow(0 10px 30px rgba(0,0,0,0.5))";
  const k = 1 - ease.outExpo(clamp01((frame - words[0].at) / 14));
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${tx}, -50%) scale(${(1 + 0.06 * k) * (1 - 0.08 * ease.inCubic(t))})`,
        transformOrigin: align === "left" ? "0% 50%" : align === "right" ? "100% 50%" : "50% 50%",
        opacity: 1 - ease.inCubic(t),
        filter: t > 0 ? `blur(${18 * t}px)` : undefined,
      }}
    >
      <KineticText
        words={words}
        fontSize={size}
        breaks={breaks}
        ink={defInk}
        tint={defTint}
        shadow={dark ? shadow : shadow}
        dur={dur}
        mode={mode}
        weight={weight}
        lineHeight={lineHeight}
        style={{ letterSpacing: tracking, alignItems: align === "center" ? "center" : align === "left" ? "flex-start" : "flex-end" }}
      />
    </div>
  );
};

/** static (non-kinetic) label */
export const Label: React.FC<{ children: React.ReactNode; size: number; color: string; style?: React.CSSProperties; weight?: number }> = ({ children, size, color, style, weight = BOLD }) => (
  <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, color, letterSpacing: "-0.03em", lineHeight: 1.1, whiteSpace: "nowrap", ...style }}>{children}</div>
);

/** the handly mark; `tone` recolours it (white / black) with a filter */
export const Logo: React.FC<{ size: number; tone?: "green" | "white" | "black"; style?: React.CSSProperties }> = ({ size, tone = "green", style }) => (
  <Img
    src={staticFile("images/logo.webp")}
    style={{ width: size, height: size, display: "block", filter: tone === "white" ? "brightness(0) invert(1)" : tone === "black" ? "brightness(0)" : undefined, ...style }}
  />
);

export const Wordmark: React.FC<{ size: number; color: string; ro?: boolean }> = ({ size, color, ro }) => (
  <div style={{ fontFamily: FONT, fontWeight: BOLD, fontSize: size, color, letterSpacing: "-0.05em", lineHeight: 1 }}>{ro ? "handly.ro" : "handly"}</div>
);

/** soft punch on a beat: 1 → peak → 1 */
export const punch = (frame: number, at: number, amt = 0.06, len = 8) => {
  const t = (frame - at) / len;
  if (t < 0 || t > 1) return 1;
  return 1 + amt * Math.pow(1 - t, 3);
};

export const io = (frame: number, a: number, b: number, inD = 8, outD = 8) =>
  ease.outCubic(clamp01((frame - a) / inD)) * (1 - ease.inCubic(clamp01((frame - (b - outD)) / outD)));
