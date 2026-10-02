import React from "react";
import { AbsoluteFill } from "remotion";
import { useLayout } from "../layout";

/** Fine square grid, centred on the frame and fading out towards the edges. */
export const Grid: React.FC<{ color: string; cell?: number; fade?: string }> = ({ color, cell, fade }) => {
  const L = useLayout();
  const c = cell ?? (L.vertical ? 90 : 96);
  const mask = fade ?? `radial-gradient(ellipse ${L.vertical ? "95% 60%" : "70% 85%"} at 50% 50%, #000 25%, rgba(0,0,0,0.35) 70%, transparent 100%)`;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${color} 1.5px, transparent 1.5px), linear-gradient(90deg, ${color} 1.5px, transparent 1.5px)`,
        backgroundSize: `${c}px ${c}px`,
        backgroundPosition: `${(L.W / 2) % c}px ${(L.H / 2) % c}px`,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
};
