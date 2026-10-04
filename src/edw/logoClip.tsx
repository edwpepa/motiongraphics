import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import { CanvasScene, H, W, clamp01, flare, glow, mulberry, useT } from "./kit";
import { Shot, shotAt } from "./logo3d";

/**
 * Plays a pre-rendered 3D logo clip and finishes it like film: highlights bloom, the far half of the
 * macro shots falls out of focus, flashes on the cuts and a few motes of dust in the light.
 */
export const LogoClip: React.FC<{ src: string; frames: [number, number]; shots: Shot[]; hit: number; fade: [number, number, number, number] }> = ({ src, frames, shots, hit, fade }) => {
  const t = useT();
  const [a0, a1, b0, b1] = fade;
  const o = clamp01((t - a0) / Math.max(0.01, a1 - a0)) * (1 - clamp01((t - b0) / (b1 - b0)));
  const s = shotAt(shots, t);
  const dof = s.dof ?? 0;
  const url = staticFile(src);
  const cuts = shots.slice(1).map((x) => x.from);
  const layer: React.CSSProperties = { position: "absolute", inset: 0, width: W, height: H };
  return (
    <Sequence from={frames[0]} durationInFrames={frames[1] - frames[0] + 1} layout="none">
      <AbsoluteFill style={{ opacity: o }}>
        <OffthreadVideo src={url} muted style={layer} />
        {dof > 0 && (
          <OffthreadVideo
            src={url}
            muted
            style={{ ...layer, filter: "blur(9px)", opacity: dof, WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 22%, transparent 58%, transparent 88%, black 100%)", maskImage: "linear-gradient(to bottom, black 0%, black 22%, transparent 58%, transparent 88%, black 100%)" }}
          />
        )}
        <OffthreadVideo src={url} muted style={{ ...layer, filter: "blur(22px) brightness(1.7) contrast(1.8)", mixBlendMode: "screen", opacity: 0.38 }} />
        <CanvasScene
          style={{ mixBlendMode: "screen" }}
          draw={(ctx, T) => {
            ctx.globalCompositeOperation = "lighter";
            for (const c of cuts) {
              const k = T >= c ? Math.exp(-(T - c) / (c === hit ? 0.5 : 0.16)) : 0;
              if (k > 0.01) flare(ctx, W / 2, H / 2, k * (c === hit ? 0.85 : 0.3), c === hit ? 1700 : 900, c === hit ? 110 : 40);
            }
            // god rays: shafts of light cutting down through the haze over the edge shots
            const sh = shotAt(shots, T);
            const ra = (sh.dof ?? 0) * clamp01((T - sh.from) / 0.25) * clamp01((sh.to - T) / 0.2) + (sh.dof ? 0 : 0.35 * clamp01((T - sh.from) / 0.8));
            if (ra > 0.01) {
              const idx = shots.indexOf(sh);
              const sx = idx % 2 ? W * 0.85 : W * 0.15, sy = -260;
              const q = mulberry(11 + idx);
              for (let i = 0; i < 11; i++) {
                const base = (idx % 2 ? -1 : 1) * (0.2 + q() * 0.75) + Math.sin(T * 0.4 + i) * 0.03;
                const ang = Math.PI / 2 - base;
                const len = 1500 + q() * 600, wid = 30 + q() * 140;
                const fl = 0.55 + 0.45 * Math.sin(T * (0.6 + q()) + i * 2.1);
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(ang - Math.PI / 2);
                const g = ctx.createLinearGradient(0, 0, 0, len);
                const al = 0.07 * ra * fl;
                g.addColorStop(0, `rgba(235,240,255,${al * 1.6})`);
                g.addColorStop(0.5, `rgba(235,240,255,${al})`);
                g.addColorStop(1, "rgba(235,240,255,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(-wid * 0.15, 0);
                ctx.lineTo(wid * 0.15, 0);
                ctx.lineTo(wid, len);
                ctx.lineTo(-wid, len);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
              }
              glow(ctx, sx, 0, 700, 0.12 * ra);
            }
            const r = mulberry(5);
            for (let i = 0; i < 70; i++) {
              const x = (r() * W + T * (r() - 0.5) * 50 + W) % W, y = (r() * H - T * 14 * r() + H * 4) % H;
              glow(ctx, x, y, 2 + 3.5 * r(), 0.16 * (0.5 + 0.5 * Math.sin(T * 2 + i)));
            }
          }}
        />
      </AbsoluteFill>
    </Sequence>
  );
};
