import React, { useId } from "react";

export type Blob = { x: number; y: number; r: number };

/**
 * Glowing brand orb made of metaballs: blobs are blurred and alpha-thresholded together, so when
 * they approach they melt into one another with a soft, liquid neck (the "gooey" merge), then the
 * whole shape is lit with a green → lime gradient and a bloom.
 */
export const Orb: React.FC<{
  blobs: Blob[];
  size: number;
  /** 0..1 overall glow strength */
  glow?: number;
  /** extra softness on the final shape (px) */
  soften?: number;
  style?: React.CSSProperties;
}> = ({ blobs, size, glow = 1, soften = 0, style }) => {
  const id = "orb" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const goo = Math.max(10, size * 0.05);
  // one gradient across the whole merged shape (per-circle gradients leave dark seams where blobs overlap)
  const x0 = Math.min(...blobs.map((b) => b.x - b.r));
  const x1 = Math.max(...blobs.map((b) => b.x + b.r));
  const y0 = Math.min(...blobs.map((b) => b.y - b.r));
  const y1 = Math.max(...blobs.map((b) => b.y + b.r));
  const gr = Math.max(x1 - x0, y1 - y0) * 0.75;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size, ...style }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id={`${id}g`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={goo} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" result="goo" />
            <feGaussianBlur in="goo" stdDeviation={soften} />
          </filter>
          <radialGradient id={`${id}f`} gradientUnits="userSpaceOnUse" cx={x0 + (x1 - x0) * 0.38} cy={y0 + (y1 - y0) * 0.3} r={gr}>
            <stop offset="0%" stopColor="#d9ffe9" />
            <stop offset="22%" stopColor="#7dffb4" />
            <stop offset="55%" stopColor="#00c866" />
            <stop offset="100%" stopColor="#005a2e" />
          </radialGradient>
        </defs>
        {/* bloom */}
        <g style={{ filter: `blur(${size * 0.12}px)` }} opacity={0.75 * glow}>
          {blobs.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r * 1.25} fill="#00e676" />
          ))}
        </g>
        {/* liquid body */}
        <g filter={`url(#${id}g)`}>
          {blobs.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={`url(#${id}f)`} />
          ))}
        </g>
      </svg>
    </div>
  );
};
