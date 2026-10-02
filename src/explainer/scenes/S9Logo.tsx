import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { NightBackground, WaveBackground } from "../components/Backgrounds";
import { KineticText } from "../components/KineticText";
import { clamp01, ease, keys, lerp, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, C, FONT } from "../theme";
import { DURATION_IN_FRAMES, LOGO_HIT_FRAME } from "../timing";
import { LOGO_START, S8Words } from "./S8Words";

// The whole light frame collapses into an icon-sized square that dissolves into the bare white logo
// (reference ending) — no tile, no glow behind it.
export const S9Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const ICON = L.vertical ? 320 : 300;
  const shrinkDur = LOGO_HIT_FRAME - LOGO_START;
  const t = ease.inOutExpo(clamp01((frame - LOGO_START) / shrinkDur));
  const tPrev = ease.inOutExpo(clamp01((frame - 1 - LOGO_START) / shrinkDur));
  const speed = Math.abs(t - tPrev);

  const w = lerp(L.W, ICON, t);
  const h = lerp(L.H, ICON, t);
  const radius = lerp(0, ICON * 0.24, t);
  const inner = lerp(1, 0.42, t);

  // the square melts away as the logo lands in its place
  const melt = ease.inCubic(clamp01((frame - (LOGO_HIT_FRAME - 3)) / 7));
  const logo = pop(frame, LOGO_HIT_FRAME - 2, 12, 150);
  const settle = 1 + 0.06 * Math.sin(clamp01((frame - LOGO_HIT_FRAME) / 9) * Math.PI);

  const rise = keys(frame, [
    [LOGO_HIT_FRAME + 12, 0],
    [LOGO_HIT_FRAME + 30, 1],
  ], ease.inOutCubic);
  const lift = (L.vertical ? -150 : -118) * rise;
  const wordAt = LOGO_HIT_FRAME + 20;
  const tagline = clamp01((frame - (LOGO_HIT_FRAME + 36)) / 12);
  const outro = 1 - ease.inCubic(clamp01((frame - (DURATION_IN_FRAMES - 16)) / 16));

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: outro }}>
        <NightBackground intensity={0} />

        {/* shrinking frame → icon-sized square */}
        {melt < 1 && (
          <div
            style={{
              position: "absolute",
              left: L.cx,
              top: L.cy,
              width: w,
              height: h,
              borderRadius: radius,
              overflow: "hidden",
              opacity: 1 - melt,
              transform: `translate(-50%, -50%) scale(${1 - 0.45 * melt})`,
              filter: speed > 0.004 || melt > 0 ? `blur(${Math.min(14, speed * 160) + 10 * melt}px)` : undefined,
            }}
          >
            <div style={{ position: "absolute", left: "50%", top: "50%", width: L.W, height: L.H, transform: `translate(-50%, -50%) scale(${inner})` }}>
              <WaveBackground />
              <S8Words />
            </div>
          </div>
        )}

        {/* bare white logo */}
        {frame >= LOGO_HIT_FRAME - 2 && (
          <Img
            src={staticFile("images/logo.webp")}
            style={{
              position: "absolute",
              left: L.cx,
              top: L.cy,
              width: ICON * 0.9,
              height: ICON * 0.9,
              filter: `brightness(0) invert(1)${logo < 0.98 ? ` blur(${(1 - Math.min(1, logo)) * 8}px)` : ""}`,
              opacity: clamp01(logo * 1.6),
              transform: `translate(-50%, -50%) translateY(${lift}px) scale(${logo * settle * (1 - 0.14 * rise)})`,
            }}
          />
        )}

        {/* wordmark + tagline, one colour */}
        {frame >= wordAt && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: L.cy + (L.vertical ? 90 : 100),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: L.vertical ? 30 : 22,
            }}
          >
            <KineticText words={[{ text: "handly.ro", at: wordAt }]} fontSize={L.vertical ? 132 : 112} ink={C.white} tint="#ffffff" style={{ letterSpacing: "-0.045em" }} />
            <div
              style={{
                fontFamily: FONT,
                fontWeight: BOLD,
                fontSize: L.vertical ? 46 : 40,
                color: C.nightInkSoft,
                opacity: tagline,
                transform: `translateY(${(1 - ease.outCubic(tagline)) * 16}px)`,
                filter: tagline < 1 ? `blur(${(1 - tagline) * 6}px)` : undefined,
              }}
            >
              Postezi. Se rezolvă.
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
