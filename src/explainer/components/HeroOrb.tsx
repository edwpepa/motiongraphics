import React from "react";

/**
 * The film's hero: an iridescent glass sphere (white → lime → mint → deep teal) with a slowly
 * turning inner swirl, a crisp rim and a soft bloom. `dim` drains it to a cold grey.
 */
export const HeroOrb: React.FC<{ size: number; frame: number; dim?: number; glow?: number; style?: React.CSSProperties }> = ({ size: s, frame, dim = 0, glow = 1, style }) => {
  const swirl = frame * 2.2;
  return (
    <div style={{ position: "relative", width: s, height: s, ...style }}>
      {/* bloom */}
      <div
        style={{
          position: "absolute",
          inset: -s * 0.9,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(170,255,140,${0.38 * glow * (1 - dim)}) 0%, rgba(40,230,170,${0.16 * glow * (1 - dim)}) 30%, rgba(0,0,0,0) 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          background: "radial-gradient(circle at 34% 30%, #ffffff 0%, #f1ffd8 10%, #c6ff6e 28%, #4fe7a8 52%, #0f9a7e 76%, #064a40 100%)",
          boxShadow: `inset 0 ${-s * 0.06}px ${s * 0.14}px rgba(0,40,30,0.55), inset 0 ${s * 0.03}px ${s * 0.05}px rgba(255,255,255,0.7), 0 0 ${s * 0.35}px rgba(160,255,150,${0.45 * glow * (1 - dim)})`,
          filter: dim > 0 ? `saturate(${1 - 0.9 * dim}) brightness(${1 - 0.35 * dim})` : undefined,
        }}
      >
        {/* iridescent swirl */}
        <div
          style={{
            position: "absolute",
            inset: -s * 0.2,
            background: `conic-gradient(from ${swirl}deg at 55% 60%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.55) 50deg, rgba(200,255,90,0.0) 110deg, rgba(120,255,230,0.5) 190deg, rgba(255,255,255,0) 260deg, rgba(230,255,160,0.45) 320deg, rgba(255,255,255,0) 360deg)`,
            filter: `blur(${s * 0.09}px)`,
            mixBlendMode: "screen",
          }}
        />
        {/* specular */}
        <div style={{ position: "absolute", left: "18%", top: "12%", width: "34%", height: "22%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)", transform: "rotate(-24deg)" }} />
      </div>
    </div>
  );
};

/** Light streaks trailing a fast-moving orb (to its left when moving right). */
export const Trails: React.FC<{ size: number; speed: number; dir?: number }> = ({ size: s, speed, dir = 1 }) => {
  const k = Math.min(1, speed / 60);
  if (k < 0.03) return null;
  const rows = [
    { y: 0, len: 9, w: 0.22, a: 0.95 },
    { y: -0.24, len: 6.5, w: 0.08, a: 0.8 },
    { y: 0.22, len: 7.5, w: 0.1, a: 0.75 },
    { y: -0.4, len: 4, w: 0.05, a: 0.6 },
    { y: 0.38, len: 5, w: 0.05, a: 0.6 },
  ];
  return (
    <>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s / 2 + r.y * s - (r.w * s) / 2,
            [dir > 0 ? "right" : "left"]: s * 0.45,
            width: r.len * s * k,
            height: r.w * s,
            borderRadius: 999,
            background: `linear-gradient(${dir > 0 ? 90 : 270}deg, rgba(60,255,200,0) 0%, rgba(80,255,210,${0.5 * r.a}) 60%, rgba(230,255,250,${r.a}) 100%)`,
            filter: `blur(${s * 0.03}px)`,
            opacity: k,
          }}
        />
      ))}
    </>
  );
};
