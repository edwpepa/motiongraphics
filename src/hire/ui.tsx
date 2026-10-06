import React from "react";
import { FONT, MONO, Logo, clamp01, ease, lerp, useT } from "../edw/kit";
import { CARD, K } from "./stage";
import { w } from "./type";

/** remote ⇄ in person: a pill switch whose knob slides over on "in person" */
export const Toggle: React.FC<{ at: number; out: number; flipAt: number; y?: number }> = ({ at, out, flipAt, y = 770 }) => {
  const t = useT();
  if (t < at || t > out + 0.4) return null;
  const o = ease.outCubic(clamp01((t - at) / 0.35)) * (1 - clamp01((t - out) / 0.35));
  const k = ease.inOut(clamp01((t - flipAt) / 0.35));
  const Wd = 440, Hd = 76;
  return (
    <div style={{ position: "absolute", left: 960 - Wd / 2, top: y - Hd / 2, width: Wd, height: Hd, opacity: o, transform: `scale(${0.94 + 0.06 * o})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: Hd / 2, border: "1.5px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ position: "absolute", top: 6, left: 6 + k * (Wd / 2 - 6), width: Wd / 2 - 6, height: Hd - 12, borderRadius: (Hd - 12) / 2, background: "#f2f3f6" }} />
      {["REMOTE", "IN PERSON"].map((l, i) => {
        const on = i === 0 ? 1 - k : k;
        return (
          <div key={l} style={{ position: "absolute", top: 0, left: i * (Wd / 2), width: Wd / 2, height: Hd, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: "0.12em", color: on > 0.5 ? "#050506" : "rgba(240,242,246,0.75)" }}>
            {l}
          </div>
        );
      })}
    </div>
  );
};

const typed = (t: number, a: number, b: number, s: string) => s.slice(0, Math.floor(clamp01((t - a) / (b - a)) * s.length));

/** the website: nav → HIRING → the form fills itself in → SEND */
export const Browser: React.FC = () => {
  const t = useT();
  const from = K.away - 0.1;
  if (t < from || t > K.rectAt + 0.15) return null;
  const inA = ease.outCubic(clamp01((t - from) / 0.45));
  const outA = 1 - clamp01((t - K.rectAt) / 0.12);
  const click1 = w("hiring", 2);
  const page = ease.inOut(clamp01((t - click1 - 0.05) / 0.5));
  const send = w("there", 0) - 0.05;
  const press = t > send ? Math.exp(-(t - send) / 0.12) : 0;
  const glowSend = clamp01((t - send) / 0.3);
  // pointer path: to HIRING, then to the fields, then to SEND
  const pts: [number, number, number][] = [
    [from + 0.3, 760, 560],
    [click1 - 0.05, 930, 72],
    [w("hiring", 5), 930, 72],
    [w("tell", 0), 520, 330],
    [w("there", 0) - 0.4, 520, 470],
    [send, 905, 540],
  ];
  let px = pts[0][1], py = pts[0][2];
  for (let i = 1; i < pts.length; i++) {
    if (t >= pts[i - 1][0]) {
      const u = ease.inOut(clamp01((t - pts[i - 1][0]) / Math.max(0.01, pts[i][0] - pts[i - 1][0])));
      px = lerp(pts[i - 1][1], pts[i][1], u);
      py = lerp(pts[i - 1][2], pts[i][2], u);
    }
  }
  const pressHiring = t > click1 ? Math.exp(-(t - click1) / 0.12) : 0;
  const field = (label: string, val: string, y: number, active: boolean, tall = false) => (
    <div style={{ position: "absolute", left: 90, right: 90, top: y }}>
      <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.22em", color: "rgba(220,224,230,0.6)", marginBottom: 10 }}>{label}</div>
      <div style={{ height: tall ? 64 : 54, borderRadius: 12, border: `1.5px solid ${active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.14)"}`, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: FONT, fontWeight: 500, fontSize: 22, color: "#eceef2" }}>
        {val}
        {active && <span style={{ display: "inline-block", width: 2, height: 26, marginLeft: 3, background: "#eceef2", opacity: Math.floor(t * 3) % 2 ? 0.2 : 1 }} />}
      </div>
    </div>
  );
  const nameA = w("hiring", 5) - 0.1, nameB = w("hiring", 8) + 0.2;
  const builtA = w("tell", 0), builtB = w("tell", 4) + 0.1;
  const probA = w("tell", 5), probB = w("tell", 9) + 0.1;
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        height: CARD.h,
        borderRadius: 22,
        overflow: "hidden",
        background: "linear-gradient(180deg, #121316 0%, #0a0b0d 100%)",
        border: "1.5px solid rgba(255,255,255,0.12)",
        boxShadow: "0 50px 140px rgba(0,0,0,0.85)",
        opacity: inA * outA,
        transform: `translateY(${(1 - inA) * 40}px) scale(${0.96 + 0.04 * inA})`,
      }}
    >
      {/* chrome */}
      <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: "#3a3c41" }} />
        ))}
        <div style={{ marginLeft: 200, width: 500, height: 30, borderRadius: 15, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Logo width={46} white />
          <span style={{ fontFamily: FONT, fontSize: 14, color: "rgba(230,232,236,0.7)", letterSpacing: "0.04em" }}>{page > 0.5 ? "Hiring" : "Home"}</span>
        </div>
      </div>
      {/* nav */}
      <div style={{ height: 80, display: "flex", alignItems: "center", padding: "0 44px", justifyContent: "space-between" }}>
        <Logo width={110} white />
        <div style={{ display: "flex", gap: 44, fontFamily: FONT, fontWeight: 700, fontSize: 16, letterSpacing: "0.2em" }}>
          {["WORK", "ABOUT", "HIRING"].map((n) => (
            <div key={n} style={{ color: n === "HIRING" ? "#f4f5f7" : "rgba(220,224,230,0.55)", position: "relative", transform: n === "HIRING" ? `scale(${1 - 0.06 * pressHiring})` : undefined }}>
              {n}
              {n === "HIRING" && <div style={{ position: "absolute", left: 0, bottom: -8, height: 2, width: `${100 * ease.outCubic(clamp01((t - click1 + 0.4) / 0.4))}%`, background: "#f4f5f7" }} />}
            </div>
          ))}
        </div>
      </div>
      {/* home hero, sliding away */}
      <div style={{ position: "absolute", left: 90, top: 210 - page * 60, opacity: 1 - page }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, letterSpacing: "-0.04em", color: "#f4f5f7", lineHeight: 1.02 }}>
          We build what
          <br />
          others won't.
        </div>
      </div>
      {/* the hiring section */}
      <div style={{ position: "absolute", inset: 0, top: 132, opacity: page, transform: `translateY(${(1 - page) * 60}px)` }}>
        <div style={{ position: "absolute", left: 90, top: 22, fontFamily: FONT, fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", color: "#f4f5f7" }}>
          Hiring — 3 open spots
        </div>
        {field("NAME", typed(t, nameA, nameB, "Alex Morgan"), 92, t > nameA && t < builtA)}
        {field("WHAT YOU'VE BUILT", typed(t, builtA, builtB, "A real-time engine that runs 2M devices."), 192, t >= builtA && t < probA)}
        {field("PROBLEMS YOU'VE SOLVED", typed(t, probA, probB, "Cut latency 10x on a system nobody could fix."), 292, t >= probA && t < send)}
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 408,
            width: 170,
            height: 54,
            borderRadius: 27,
            background: "#f2f3f6",
            color: "#050506",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: "0.2em",
            transform: `scale(${1 - 0.07 * press})`,
            boxShadow: `0 0 ${30 + 80 * glowSend}px rgba(255,255,255,${0.12 + 0.5 * glowSend})`,
          }}
        >
          SEND
        </div>
      </div>
      {/* pointer */}
      <svg width={30} height={40} viewBox="0 0 34 44" style={{ position: "absolute", left: px, top: py, opacity: clamp01((t - from - 0.3) / 0.3), transform: `scale(${1 - 0.12 * Math.max(press, pressHiring)})`, transformOrigin: "0 0" }}>
        <path d="M2 2 L2 34 L10 26 L16 40 L22 37 L16 24 L28 24 Z" fill="#f4f5f8" stroke="#0a0a0b" strokeWidth={2.5} strokeLinejoin="round" />
      </svg>
      {/* the white-out as it becomes the mark */}
      <div style={{ position: "absolute", inset: 0, background: "#e9ebef", opacity: clamp01((t - (K.rectAt - 0.25)) / 0.25) }} />
    </div>
  );
};
