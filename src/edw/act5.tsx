import React from "react";
import { AbsoluteFill } from "remotion";
import { BrainCam, drawBrain } from "./act1";
import { beam, fog } from "./act3";
import { CanvasScene, FONT, H, Logo, V3, W, clamp01, ease, flare, glow, lerp, rng01, useT, w } from "./kit";

const ideaAt = (T: number): V3 => [0.55 * Math.sin(T * 2.3), 0.3 * Math.sin(T * 3.1 + 1) + 0.1, 0.38 * Math.sin(T * 1.7 + 2)];

/** 56.7 – 59.95 s: "If you've got an idea you can't get out of your head, write to us." */
export const IdeaScene: React.FC<{ from: number; to: number }> = ({ from, to }) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const shoot = rng01(T, w("write", 0) - 0.05, to, ease.inCubic);
      const cam: BrainCam = {
        ry: -0.4 + 0.18 * t,
        rx: 0.12,
        scale: lerp(300, 360, t / 3.2),
        cx: W / 2,
        cy: H / 2 - 20,
        dist: 4,
        alpha: rng01(t, 0, 0.6, ease.outCubic) * (1 - shoot) * 0.85,
        rate: 0.5,
        spark: 0,
      };
      const pr = drawBrain(ctx, T, cam);
      ctx.globalCompositeOperation = "lighter";
      const live = rng01(t, 0.3, 0.9);
      // the idea racing around inside, leaving a trail
      for (let k = 24; k >= 0; k--) {
        const p = pr(ideaAt(T - k * 0.025));
        glow(ctx, p.x, p.y, (16 - k * 0.5) * p.k, live * (1 - k / 25) * 0.6 * (1 - shoot));
      }
      const p = pr(ideaAt(T));
      const x = lerp(p.x, W / 2, shoot), y = lerp(p.y, H / 2, shoot);
      glow(ctx, x, y, 60 * p.k, live * 0.5);
      glow(ctx, x, y, 14 * p.k, live);
      if (shoot > 0) flare(ctx, x, y, shoot, 600 + 1400 * shoot, 40 + 500 * shoot * shoot);
      ctx.globalCompositeOperation = "source-over";
    }}
  />
);

const MSG = "I have an idea I can't get out of my head.";

/** 59.95 – 63.75 s: the message to EDW gets written and sent */
export const MessageScene: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const T = useT();
  const t = T - from;
  const inA = rng01(t, 0, 0.5, ease.outCubic);
  const typed = Math.floor(rng01(T, from + 0.35, w("best", 6), (x) => x) * MSG.length);
  const cur = rng01(T, w("best", 6) + 0.1, w("best", 8) + 0.1, ease.inOut);
  const click = w("best", 8) + 0.2;
  const press = T > click ? Math.exp(-(T - click) / 0.12) : 0;
  const sent = rng01(T, click + 0.1, to, ease.inCubic);
  const push = lerp(1.0, 1.06, t / 4) * lerp(1, 0.55, sent);
  const btnX = 735, btnY = 330;
  const cx = lerp(1150, btnX + 20, cur), cy = lerp(620, btnY + 18, cur);
  return (
    <AbsoluteFill>
      <CanvasScene
        draw={(ctx, T) => {
          ctx.globalCompositeOperation = "lighter";
          fog(ctx, T, 0.8, H * 0.7);
          glow(ctx, W / 2, H / 2, 700, 0.06);
          if (sent > 0) flare(ctx, W / 2, H / 2 - 20 - 300 * sent, sent, 1600, 300 * sent);
          ctx.globalCompositeOperation = "source-over";
        }}
      />
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: H / 2 - 30,
          width: 900,
          height: 400,
          transform: `translate(-50%, -50%) translateY(${(1 - inA) * 40 - sent * 260}px) scale(${push}) perspective(1600px) rotateX(${(1 - inA) * 12}deg)`,
          opacity: inA * (1 - sent),
          filter: `blur(${sent * 10}px)`,
          borderRadius: 26,
          background: "linear-gradient(180deg, #16171a 0%, #0b0c0e 100%)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
          fontFamily: FONT,
          color: "#eceef2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "22px 30px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: "#3d3f45" }} />
          ))}
          <div style={{ marginLeft: 18, fontWeight: 600, fontSize: 20, color: "#bfc3ca" }}>New message</div>
        </div>
        <div style={{ padding: "22px 34px", fontSize: 22, color: "#8d929b", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          To <span style={{ marginLeft: 16, padding: "6px 14px", borderRadius: 14, background: "rgba(255,255,255,0.09)", color: "#f1f2f5", fontWeight: 600, letterSpacing: "0.04em" }}>EDW ENTERPRISE</span>
        </div>
        <div style={{ padding: "30px 34px", fontSize: 34, fontWeight: 500, letterSpacing: "-0.01em", minHeight: 60 }}>
          {MSG.slice(0, typed)}
          <span style={{ display: "inline-block", width: 3, height: 36, marginLeft: 3, verticalAlign: "-6px", background: "#f1f2f5", opacity: Math.floor(T * 3) % 2 === 0 || typed < MSG.length ? 1 : 0 }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: btnX,
            top: btnY,
            width: 130,
            height: 48,
            transform: `translate(-50%, 0) scale(${1 - 0.08 * press})`,
            borderRadius: 24,
            background: "#f2f3f6",
            color: "#0a0a0b",
            fontWeight: 700,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${30 + 60 * press}px rgba(255,255,255,${0.15 + 0.5 * press})`,
          }}
        >
          Send
        </div>
        {/* the pointer */}
        <svg
          width={34}
          height={44}
          viewBox="0 0 34 44"
          style={{ position: "absolute", left: cx, top: cy, opacity: rng01(T, w("best", 5), w("best", 6) + 0.1) * (1 - sent), transform: `scale(${1 - 0.12 * press})`, transformOrigin: "0 0" }}
        >
          <path d="M2 2 L2 34 L10 26 L16 40 L22 37 L16 24 L28 24 Z" fill="#f4f5f8" stroke="#0a0a0b" strokeWidth={2.5} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/** 63.75 – 70 s: the logo, "We'd love to build yours." */
export const EndScene: React.FC<{ from: number }> = ({ from }) => {
  const T = useT();
  const R = w("yours", 0) - 0.05;
  const reveal = rng01(T, R, R + 0.7, ease.outCubic);
  const sweep = rng01(T, R + 0.2, R + 1.8, ease.inOut);
  const out = rng01(T, 68.9, 69.9, ease.inOut);
  const scale = lerp(1.1, 1.0, ease.outCubic((T - R) / 3)) * lerp(1, 0.97, (T - R) / 6);
  const tag = "We'd love to build yours.";
  const tagAt = w("yours", 1);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <CanvasScene
        draw={(ctx, T) => {
          const t = T - from;
          ctx.globalCompositeOperation = "lighter";
          fog(ctx, T, 0.9 * reveal, H * 0.66);
          for (const s of [-1, 1]) beam(ctx, W / 2 + s * 560, H + 20, s * (0.1 + 0.03 * Math.sin(T * 0.7)), 1500, 0.08, 0.25 * reveal);
          const k = Math.exp(-Math.max(0, T - R) / 0.4);
          if (T >= R - 0.1) flare(ctx, W / 2, H / 2 - 30, clamp01(k + (1 - reveal) * 0.5) * 0.45, 800, 50);
          glow(ctx, W / 2, H / 2 - 30, 500, 0.05 * reveal);
          ctx.globalCompositeOperation = "source-over";
          if (t < 0.15) {
            ctx.fillStyle = `rgba(255,255,255,${(1 - t / 0.15) * 0.2})`;
            ctx.fillRect(0, 0, W, H);
          }
        }}
      />
      <div style={{ position: "absolute", left: W / 2, top: H / 2 - 30, transform: `translate(-50%, -50%) scale(${scale})`, opacity: reveal, filter: `blur(${(1 - reveal) * 10}px)` }}>
        <Logo width={400} sweep={sweep} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 + 95, display: "flex", justifyContent: "center", fontFamily: FONT, fontWeight: 500, fontSize: 26, color: "#cfd2d8", letterSpacing: "0.06em" }}>
        {tag.split("").map((ch, i) => {
          const a = ease.outCubic((T - tagAt - i * 0.03) / 0.5);
          return (
            <span key={i} style={{ opacity: clamp01(a), filter: `blur(${(1 - clamp01(a)) * 10}px)`, whiteSpace: "pre", display: "inline-block", transform: `translateY(${(1 - clamp01(a)) * 10}px)` }}>
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
