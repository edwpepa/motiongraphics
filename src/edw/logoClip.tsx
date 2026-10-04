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
