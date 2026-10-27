import React, { useMemo } from "react";

/**
 * Liquid glass. Whatever sits under the glass is drawn a second time, refracted through a displacement
 * map (flat in the middle, bending hard in a bezel round the edge, like a thick convex squircle), a little
 * magnified, then clipped to the glass shape. A specular rim, a sheen, a contact shadow and a touch of
 * chromatic aberration at the rim finish it. Exact at any render scale, unlike backdrop-filter.
 */

const FW = 1920, FH = 1080;
const MAPS = new Map<string, string>();

/** displacement map for a rounded rect (a circle when radius = min(w,h)/2): R/G = 0.5 ± outward offset */
const lensMap = (w: number, h: number, radius: number, bezel: number) => {
  const key = `${w}x${h}r${radius}b${bezel}`;
  const hit = MAPS.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const r = Math.min(radius, w / 2, h / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - w / 2, py = y + 0.5 - h / 2;
      const qx = Math.abs(px) - (w / 2 - r), qy = Math.abs(py) - (h / 2 - r);
      let d: number, nx: number, ny: number;
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(qx, qy) || 1;
        d = r - l;
        nx = (qx / l) * Math.sign(px);
        ny = (qy / l) * Math.sign(py);
      } else if (qx > qy) {
        d = r - qx;
        nx = Math.sign(px);
        ny = 0;
      } else {
        d = r - qy;
        nx = 0;
        ny = Math.sign(py);
      }
      let m = 0;
      if (d > -2 && d < bezel) {
        // slope of a circular profile: steep at the rim, flat where the bezel meets the face
        const t = Math.min(1, 1 - Math.max(0, d) / bezel);
        m = Math.min(1, t / Math.sqrt(Math.max(0.02, 1 - t * t)) / 4);
      }
      const i = (y * w + x) * 4;
      img.data[i] = Math.round(128 + 127 * m * nx);
      img.data[i + 1] = Math.round(128 + 127 * m * ny);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = c.toDataURL("image/png");
  MAPS.set(key, url);
  return url;
};

export type Pane = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** corner radius; w/2 for a round lens */
  radius?: number;
  /** how far the bend reaches in from the edge, px */
  bezel?: number;
  /** strength of the bend at the rim, px */
  refract?: number;
  /** blur inside, px */
  frost?: number;
  /** magnification of what is under the face */
  zoom?: number;
  /** chromatic split at the rim (0 = none) */
  aberration?: number;
  /** "light" over bright scenes, "dark" over footage */
  tone?: "light" | "dark";
  /** extra tint over the glass, e.g. a green for Handly */
  tint?: string;
  shadow?: number;
  opacity?: number;
  /** what sits on the glass (icons, labels, UI) */
  content?: React.ReactNode;
};

let FID = 0;
const useIds = (n: number) => useMemo(() => Array.from({ length: 16 }, () => `lg${FID++}`), []).slice(0, n);

const Refracted: React.FC<{ p: Pane; id: string; under: React.ReactNode }> = ({ p, id, under }) => {
  const W = Math.max(4, Math.round(p.w)), H = Math.max(4, Math.round(p.h));
  const R = Math.round(p.radius ?? Math.min(W, H) / 2);
  const bz = Math.round(p.bezel ?? Math.min(W, H) * 0.3);
  const s = p.refract ?? Math.min(W, H) * 0.3;
  const ab = p.aberration ?? 0.05;
  const map = useMemo(() => lensMap(W, H, R, bz), [W, H, R, bz]);
  const ch = (k: number) => `${k === 0 ? 1 : 0} 0 0 0 0  0 ${k === 1 ? 1 : 0} 0 0 0  0 0 ${k === 2 ? 1 : 0} 0 0  0 0 0 1 0`;
  const x = Math.round(p.x), y = Math.round(p.y);
  const z = p.zoom ?? 1.06;
  const dark = p.tone === "dark";
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x={0} y={0} width={FW} height={FH} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={map} x={x} y={y} width={W} height={H} result="map" preserveAspectRatio="none" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={s * 2} xChannelSelector="R" yChannelSelector="G" result="dr" />
          {ab > 0 && (
            <>
              <feDisplacementMap in="SourceGraphic" in2="map" scale={s * 2 * (1 + ab)} xChannelSelector="R" yChannelSelector="G" result="dg" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={s * 2 * (1 + ab * 2)} xChannelSelector="R" yChannelSelector="G" result="db" />
              <feColorMatrix in="dr" type="matrix" values={ch(0)} result="r" />
              <feColorMatrix in="dg" type="matrix" values={ch(1)} result="g" />
              <feColorMatrix in="db" type="matrix" values={ch(2)} result="b" />
              <feBlend in="r" in2="g" mode="screen" result="rg" />
              <feBlend in="rg" in2="b" mode="screen" result="dr" />
            </>
          )}
          <feGaussianBlur in="dr" stdDeviation={p.frost ?? 0.5} />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: `url(#${id}) saturate(${dark ? 1.35 : 1.15}) brightness(${dark ? 1.1 : 1.03})`,
          clipPath: `inset(${y}px ${FW - x - W}px ${FH - y - H}px ${x}px round ${R}px)`,
          opacity: p.opacity ?? 1,
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: `${x + W / 2}px ${y + H / 2}px` }}>{under}</div>
      </div>
    </>
  );
};

/** the rim, the sheen and the shadow of one pane, plus whatever sits on it */
const Face: React.FC<{ p: Pane; id: string }> = ({ p, id }) => {
  const W = Math.max(4, Math.round(p.w)), H = Math.max(4, Math.round(p.h));
  const R = Math.round(p.radius ?? Math.min(W, H) / 2);
  const dark = p.tone === "dark";
  return (
    <div style={{ position: "absolute", left: Math.round(p.x), top: Math.round(p.y), width: W, height: H, borderRadius: R, opacity: p.opacity ?? 1 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: R, background: p.tint ?? (dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)") }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={dark ? 0.8 : 1} />
            <stop offset="0.3" stopColor="#fff" stopOpacity={0.14} />
            <stop offset="0.7" stopColor="#fff" stopOpacity={0.05} />
            <stop offset="1" stopColor="#fff" stopOpacity={dark ? 0.5 : 0.75} />
          </linearGradient>
          <radialGradient id={`${id}sheen`} cx="0.28" cy="0.16" r="0.9">
            <stop offset="0" stopColor="#fff" stopOpacity={dark ? 0.14 : 0.24} />
            <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}low`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={dark ? 0.18 : 0.06} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} rx={R} fill={`url(#${id}sheen)`} />
        <rect x={0} y={0} width={W} height={H} rx={R} fill={`url(#${id}low)`} />
        <rect x={0.8} y={0.8} width={W - 1.6} height={H - 1.6} rx={Math.max(0, R - 0.8)} fill="none" stroke={`url(#${id}rim)`} strokeWidth={1.8} />
        <rect x={4} y={4} width={W - 8} height={H - 8} rx={Math.max(0, R - 4)} fill="none" stroke="#fff" strokeOpacity={dark ? 0.06 : 0.2} strokeWidth={4} style={{ filter: "blur(2px)" }} />
      </svg>
      {p.content && <div style={{ position: "absolute", inset: 0, borderRadius: R, overflow: "hidden" }}>{p.content}</div>}
    </div>
  );
};

const Shadow: React.FC<{ p: Pane }> = ({ p }) => {
  const W = p.w, H = p.h, R = p.radius ?? Math.min(W, H) / 2;
  const k = (p.shadow ?? 1) * (p.opacity ?? 1);
  if (k <= 0) return null;
  const dark = p.tone === "dark";
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, width: W, height: H, borderRadius: R, boxShadow: `0 ${H * 0.07}px ${H * 0.16}px rgba(0,0,0,${(dark ? 0.4 : 0.14) * k}), 0 ${H * 0.02}px ${H * 0.04}px rgba(0,0,0,${(dark ? 0.25 : 0.07) * k})` }} />
  );
};

/**
 * A stage with glass on it: `under` is drawn as is, then once more refracted under each pane.
 * Children render on top of everything (type that sits above the glass).
 */
export const GlassStage: React.FC<{ under: React.ReactNode; panes: Pane[]; children?: React.ReactNode }> = ({ under, panes, children }) => {
  const ids = useIds(panes.length);
  const live = panes.filter((p) => (p.opacity ?? 1) > 0.001 && p.w > 4 && p.h > 4);
  return (
    <>
      <div style={{ position: "absolute", inset: 0 }}>{under}</div>
      {live.map((p, i) => (
        <Shadow key={`s${i}`} p={p} />
      ))}
      {live.map((p, i) => (
        <Refracted key={`r${i}`} p={p} id={ids[i]} under={under} />
      ))}
      {live.map((p, i) => (
        <Face key={`f${i}`} p={p} id={ids[i]} />
      ))}
      {children}
    </>
  );
};
