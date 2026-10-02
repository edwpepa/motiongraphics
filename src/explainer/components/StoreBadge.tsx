import React from "react";
import { BOLD, FONT } from "../theme";

// Glyphs from Simple Icons (CC0), drawn in white so the end card stays one colour.
const APPLE =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";
const PLAY =
  "M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z";

/** Black store badge (App Store / Google Play) with a hairline rim and a glass shine that sweeps once. */
export const StoreBadge: React.FC<{ store: "apple" | "google"; h: number; shine: number }> = ({ store, h, shine }) => {
  const apple = store === "apple";
  return (
    <div
      style={{
        position: "relative",
        height: h,
        display: "flex",
        alignItems: "center",
        gap: h * 0.16,
        padding: `0 ${h * 0.34}px 0 ${h * 0.24}px`,
        borderRadius: h * 0.24,
        background: "linear-gradient(180deg, #161a18 0%, #050606 100%)",
        boxShadow: `0 ${h * 0.25}px ${h * 0.6}px rgba(0,0,0,0.55), inset 0 0 0 ${Math.max(1.5, h * 0.016)}px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.25)`,
        overflow: "hidden",
        fontFamily: FONT,
        fontWeight: BOLD,
        color: "#fff",
      }}
    >
      <svg viewBox="0 0 24 24" width={h * 0.5} height={h * 0.5} style={{ flex: "none", marginTop: apple ? -h * 0.04 : 0 }}>
        <path d={apple ? APPLE : PLAY} fill="#fff" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: h * 0.05 }}>
        <div style={{ fontSize: h * 0.17, opacity: 0.85, letterSpacing: apple ? "0" : "0.06em" }}>{apple ? "Descarcă din" : "DISPONIBIL PE"}</div>
        <div style={{ fontSize: h * 0.34, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{apple ? "App Store" : "Google Play"}</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${-60 + 220 * shine}%`,
          width: "45%",
          background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)",
          opacity: shine > 0 && shine < 1 ? 1 : 0,
        }}
      />
    </div>
  );
};
