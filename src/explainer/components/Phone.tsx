import React from "react";
import { staticFile } from "remotion";

export const PHONE_W = 430;
export const PHONE_H = 884;
const RADIUS = 76;
const BEZEL = 15;
const DEPTH_LAYERS = 9;

/**
 * Modern phone mock built for CSS 3D: a stack of body layers gives it real thickness when it
 * spins, the screen is a normal DOM subtree (children) so the app UI stays crisp.
 */
export const Phone: React.FC<{ children: React.ReactNode; glare?: number }> = ({ children, glare = 0 }) => (
  <div style={{ position: "relative", width: PHONE_W, height: PHONE_H, transformStyle: "preserve-3d" }}>
    {Array.from({ length: DEPTH_LAYERS }, (_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: RADIUS,
          background: i === DEPTH_LAYERS - 1 ? "#0b0d0c" : "#262b29",
          transform: `translateZ(${-(i + 1) * 2.2}px)`,
          boxShadow: i === DEPTH_LAYERS - 1 ? "0 60px 120px rgba(10,30,20,0.35)" : undefined,
        }}
      />
    ))}
    {/* the back: dark glass, camera module, logo (seen when the phone spins) */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: RADIUS,
        transform: `translateZ(${-(DEPTH_LAYERS + 0.5) * 2.2}px) rotateY(180deg)`,
        background: "linear-gradient(160deg, #2b3532 0%, #121715 45%, #0a0d0c 100%)",
        boxShadow: "inset 0 0 0 5px #3a4440",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 34, top: 34, width: 170, height: 170, borderRadius: 48, background: "linear-gradient(160deg, #39433f, #1a201d)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }}>
        {[
          [22, 22],
          [92, 58],
          [22, 94],
        ].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #3a4a6a 0%, #0b0f18 55%, #000 100%)", boxShadow: "0 0 0 6px #262d2a" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 120, height: 120, marginLeft: -60, marginTop: -60, background: `url(${staticFile("images/logo.webp")}) center / contain no-repeat`, opacity: 0.9 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0) 60%)" }} />
    </div>
    {/* titanium frame */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: RADIUS,
        background: "linear-gradient(150deg, #5d6662 0%, #2a2f2d 18%, #151816 50%, #2c3230 82%, #6b7571 100%)",
        padding: 5,
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: RADIUS - 5, background: "#050606", padding: BEZEL - 5 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: RADIUS - BEZEL,
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          {children}
          {/* dynamic island */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              width: 122,
              height: 36,
              marginLeft: -61,
              borderRadius: 20,
              background: "#000",
            }}
          />
          {/* moving glass reflection */}
          <div
            style={{
              position: "absolute",
              inset: -200,
              background: `linear-gradient(115deg, rgba(255,255,255,0) ${30 + glare * 30}%, rgba(255,255,255,0.22) ${38 + glare * 30}%, rgba(255,255,255,0) ${46 + glare * 30}%)`,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
    {/* side buttons */}
    <div style={{ position: "absolute", left: -4, top: 190, width: 5, height: 64, borderRadius: 3, background: "#3a403d" }} />
    <div style={{ position: "absolute", left: -4, top: 274, width: 5, height: 64, borderRadius: 3, background: "#3a403d" }} />
    <div style={{ position: "absolute", right: -4, top: 236, width: 5, height: 104, borderRadius: 3, background: "#3a403d" }} />
  </div>
);
