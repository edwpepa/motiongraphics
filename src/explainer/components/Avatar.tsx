import React from "react";
import { Img, staticFile } from "remotion";
import { C } from "../theme";
import { mixColor } from "../lib/anim";

export const PEOPLE = {
  andrei: "images/people/andrei.webp",
  mihai: "images/people/mihai.webp",
  radu: "images/people/radu.webp",
  tu: "images/people/tu.webp",
} as const;

export type Person = keyof typeof PEOPLE;

/** Round profile photo; without a photo it falls back to the iOS contact placeholder. `lit` adds the green ring + glow. */
export const Avatar: React.FC<{ person?: Person; size: number; lit?: number; ring?: string; dark?: boolean }> = ({
  person,
  size,
  lit = 0,
  ring,
  dark = true,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      overflow: "hidden",
      position: "relative",
      flexShrink: 0,
      border: `${Math.max(2, size * 0.035)}px solid ${ring ?? mixColor(dark ? "#3a4440" : "#ffffff", C.green, lit)}`,
      boxShadow: `0 0 ${size * 0.45 * lit}px rgba(0,191,99,${0.55 * lit}), 0 ${size * 0.1}px ${size * 0.28}px rgba(0,0,0,${dark ? 0.45 : 0.15})`,
      background: "linear-gradient(180deg, #a9aeb6 0%, #7f858e 100%)",
    }}
  >
    {person ? (
      <Img src={staticFile(PEOPLE[person])} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    ) : (
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ display: "block" }}>
        <circle cx={50} cy={40} r={17} fill="rgba(255,255,255,0.92)" />
        <path d="M16 96 C 18 70, 34 61, 50 61 C 66 61, 82 70, 84 96 Z" fill="rgba(255,255,255,0.92)" />
      </svg>
    )}
  </div>
);
