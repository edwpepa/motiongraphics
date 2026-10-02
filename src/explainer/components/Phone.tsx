import React from "react";

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
