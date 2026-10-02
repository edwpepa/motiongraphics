import React, { useId } from "react";

/**
 * Directional (motion) blur: separate horizontal / vertical Gaussian radii via an SVG filter,
 * so whips and fast slides smear along their direction of travel like the reference.
 */
export const DirBlur: React.FC<{
  x?: number;
  y?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x = 0, y = 0, style, children }) => {
  const id = "dirblur" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const active = x > 0.7 || y > 0.7;

  return (
    <>
      {active && (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={id} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`${Math.max(0, x).toFixed(2)} ${Math.max(0, y).toFixed(2)}`} />
            </filter>
          </defs>
        </svg>
      )}
      <div style={{ ...style, filter: active ? `url(#${id})` : style?.filter }}>{children}</div>
    </>
  );
};
