import React, { useId, useMemo } from "react";
import { useCurrentFrame } from "remotion";

// ---------------------------------------------------------------------------------------------
// Liquid glass: the backdrop is *refracted* (bent towards the centre along a rounded bezel, like a
// thick lens edge), lightly frosted and saturated, then lit with a rim highlight and a moving
// specular sheen. The refraction uses an SVG displacement map generated for the exact size/radius.
// ---------------------------------------------------------------------------------------------

const mapCache = new Map<string, string>();

/** Displacement map for a rounded rect: pixels within `bezel` of the edge are pulled inward. */
function lensMap(w: number, h: number, r: number, bezel: number): string {
  const key = [w, h, r, bezel].map((v) => Math.round(v)).join("x");
  const hit = mapCache.get(key);
  if (hit) return hit;
  if (typeof document === "undefined") return "";
  const s = Math.min(1, 220 / Math.max(w, h)); // compute at reduced size, the filter scales it up smoothly
  const cw = Math.max(8, Math.round(w * s));
  const ch = Math.max(8, Math.round(h * s));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(cw, ch);
  const rr = Math.min(r, w / 2, h / 2);
  for (let py = 0; py < ch; py++) {
    for (let px = 0; px < cw; px++) {
      const x = (px + 0.5) / s - w / 2;
      const y = (py + 0.5) / s - h / 2;
      // signed distance to the rounded rect (negative inside)
      const qx = Math.abs(x) - (w / 2 - rr);
      const qy = Math.abs(y) - (h / 2 - rr);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const d = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - rr;
      // outward normal
      let nx: number;
      let ny: number;
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(ox, oy) || 1;
        nx = (ox / l) * Math.sign(x);
        ny = (oy / l) * Math.sign(y);
      } else if (qx > qy) {
        nx = Math.sign(x);
        ny = 0;
      } else {
        nx = 0;
        ny = Math.sign(y);
      }
      const k = Math.max(0, 1 + d / bezel); // 1 at the edge → 0 at bezel depth
      const mag = Math.pow(k, 2.2);
      const i = (py * cw + px) * 4;
      img.data[i] = 128 - nx * mag * 127;
      img.data[i + 1] = 128 - ny * mag * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  mapCache.set(key, url);
  return url;
}

export type GlassProps = {
  width: number;
  height: number;
  radius: number;
  /** "light" glass over bright scenes, "dark" over the night scenes */
  tone?: "light" | "dark";
  /** refraction strength in px */
  strength?: number;
  bezel?: number;
  frost?: number;
  /** 0..1 position of the sheen sweep; leave undefined for a slow automatic drift */
  sheen?: number;
  /** white body tint (0..1) over the refracted backdrop */
  tint?: number;
  /** strength of the inner white glow + top highlight (1 = default; low values = clear glass) */
  glow?: number;
  /** drop shadow under the glass (off for free-floating spheres) */
  shadow?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const LiquidGlass: React.FC<GlassProps> = ({
  width,
  height,
  radius,
  tone = "light",
  strength = 70,
  bezel,
  frost = 3,
  sheen,
  tint,
  glow = 1,
  shadow = true,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const id = "lg" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const bz = bezel ?? Math.min(radius, Math.min(width, height) * 0.32);
  const map = useMemo(() => lensMap(width, height, radius, bz), [width, height, radius, bz]);
  const sweep = sheen ?? ((frame / 150) % 1.6) - 0.3;
  const light = tone === "light";

  return (
    <div style={{ position: "relative", width, height, flexShrink: 0, ...style }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter id={id} x="0" y="0" width={width} height={height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={map} x={0} y={0} width={width} height={height} preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {/* refracted + frosted backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          clipPath: `inset(0 round ${radius}px)`,
          backdropFilter: `url(#${id}) blur(${frost}px) saturate(${light ? 1.7 : 1.5}) brightness(${light ? 1.06 : 1.1})`,
          WebkitBackdropFilter: `url(#${id}) blur(${frost}px) saturate(${light ? 1.7 : 1.5})`,
          background: light ? `rgba(255,255,255,${tint ?? 0.16})` : `rgba(255,255,255,${tint ?? 0.045})`,
        }}
      />
      {/* lighting: rim, inner glow, specular sheen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          overflow: "hidden",
          boxShadow: light
            ? `inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.45), inset 1px 0 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(255,255,255,0.35), inset 0 0 ${Math.min(width, height) * 0.25 * glow}px rgba(255,255,255,${0.28 * glow})${shadow ? `, 0 ${height * 0.08 + 8}px ${height * 0.25 + 24}px rgba(16,52,36,0.16)` : ""}`
            : `inset 0 1.5px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(255,255,255,0.10), inset 0 0 ${Math.min(width, height) * 0.25}px rgba(255,255,255,0.05), 0 ${height * 0.08 + 10}px ${height * 0.25 + 30}px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: light
              ? `radial-gradient(120% 90% at 18% 0%, rgba(255,255,255,${0.55 * glow}) 0%, rgba(255,255,255,0) 45%)`
              : "radial-gradient(120% 90% at 18% 0%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 45%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -height,
            bottom: -height,
            left: `${sweep * 100}%`,
            width: Math.max(60, width * 0.18),
            transform: "rotate(18deg)",
            background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${light ? 0.45 : 0.14}) 50%, rgba(255,255,255,0) 100%)`,
          }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
};
