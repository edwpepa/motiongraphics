import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { StoreBadge } from "../explainer/components/StoreBadge";
import { clamp01, ease } from "../explainer/lib/anim";
import { Bg, BgKind, Logo, P, Wordmark, punch } from "./kit";
import { BEATS, DROP, F } from "./timeline";

const D0 = F(DROP);
export const bt = (k: number) => Math.round(D0 + k * BEATS);
export const beatAt = (frame: number) => Math.floor((frame - D0 + 0.5) / BEATS);

export const SLAM: Array<{ bg: BgKind; logo: "white" | "green"; word: string }> = [
  { bg: "green", logo: "white", word: "#ffffff" },
  { bg: "black", logo: "green", word: "#ffffff" },
  { bg: "white", logo: "green", word: P.ink },
  { bg: "deep", logo: "green", word: "#ffffff" },
];

/**
 * The brand switch: logo + wordmark, the whole set flipping colour on every beat with a punch.
 * `from` is the frame the switching starts at; `offset` picks the first colour.
 */
export const Slam: React.FC<{ from: number; offset?: number; ro?: boolean; badges?: boolean; zoomOutAt?: number; size?: number; hold?: number }> = ({
  from,
  offset = 0,
  ro = false,
  badges = false,
  zoomOutAt,
  size = 1,
  hold,
}) => {
  const frame = useCurrentFrame();
  const k0 = beatAt(from);
  const kNow = hold !== undefined && frame >= hold ? beatAt(hold) : beatAt(frame);
  const i = (((kNow - k0 + offset) % SLAM.length) + SLAM.length) % SLAM.length;
  const s = SLAM[i];
  const zoomOut = zoomOutAt === undefined ? 0 : ease.inExpo(clamp01((frame - zoomOutAt) / 8));
  const sc = punch(frame, Math.max(from, bt(kNow)), 0.1, 9) * (1 + 0.04 * clamp01((frame - from) / 60)) * (1 + 3 * zoomOut) * size;
  return (
    <AbsoluteFill>
      <Bg kind={s.bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 70, transform: `scale(${sc})`, opacity: 1 - zoomOut, filter: zoomOut > 0 ? `blur(${zoomOut * 20}px)` : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: ro ? 36 : 44 }}>
          <Logo size={ro ? 190 : 230} tone={s.logo} />
          <div style={{ transform: "translateY(-12px)" }}>
            <Wordmark size={ro ? 190 : 250} color={s.word} ro={ro} />
          </div>
        </div>
        {badges && (
          <div style={{ display: "flex", gap: 26 }}>
            <StoreBadge store="apple" h={92} shine={clamp01((frame - from - 10) / 20)} />
            <StoreBadge store="google" h={92} shine={clamp01((frame - from - 16) / 20)} />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
