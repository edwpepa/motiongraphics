import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { NightBackground, WaveBackground } from "../components/Backgrounds";
import { KineticText } from "../components/KineticText";
import { clamp01, ease, keys, lerp, pop } from "../lib/anim";
import { C, FONT } from "../theme";
import { DURATION_IN_FRAMES, LOGO_HIT_FRAME } from "../timing";
import { LOGO_START, S8Words } from "./S8Words";

const ICON = 300;

// The whole light frame collapses into an app icon, which turns into the handly logo (reference ending).
export const S9Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const shrinkDur = LOGO_HIT_FRAME - LOGO_START;
  const t = ease.inOutExpo(clamp01((frame - LOGO_START) / shrinkDur));
  const tPrev = ease.inOutExpo(clamp01((frame - 1 - LOGO_START) / shrinkDur));
  const speed = Math.abs(t - tPrev);

  const w = lerp(1920, ICON, t);
  const h = lerp(1080, ICON, t);
  const radius = lerp(0, ICON * 0.24, t);
  const inner = lerp(1, 0.42, t);

  const wipe = ease.inOutCubic(clamp01((frame - (LOGO_HIT_FRAME - 7)) / 9));
  const logo = pop(frame, LOGO_HIT_FRAME - 1, 12, 150);
  const settle = 1 + 0.07 * Math.sin(clamp01((frame - LOGO_HIT_FRAME) / 9) * Math.PI);

  const rise = keys(frame, [
    [LOGO_HIT_FRAME + 12, 0],
    [LOGO_HIT_FRAME + 30, 1],
  ], ease.inOutCubic);
  const wordAt = LOGO_HIT_FRAME + 20;
  const tagline = clamp01((frame - (LOGO_HIT_FRAME + 36)) / 12);
  const glow = clamp01((frame - LOGO_HIT_FRAME) / 18);
  const outro = 1 - ease.inCubic(clamp01((frame - (DURATION_IN_FRAMES - 16)) / 16));

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: outro }}>
        <NightBackground cx={0.47} cy={0.5} scale={1.1} intensity={0.3 * glow} />
        <AbsoluteFill
          style={{
            background: "radial-gradient(circle at 50% 42%, rgba(220,255,236,0.16) 0%, rgba(0,191,99,0.08) 18%, rgba(0,0,0,0) 42%)",
            opacity: glow,
          }}
        />

        {/* icon / shrinking frame */}
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 540,
            width: w,
            height: h,
            borderRadius: radius,
            overflow: "hidden",
            transform: `translate(-50%, -50%) translateY(${-118 * rise}px) scale(${settle * (1 - 0.12 * rise)})`,
            filter: speed > 0.004 ? `blur(${Math.min(14, speed * 160)}px)` : undefined,
            boxShadow: t > 0.5 ? `0 30px 80px rgba(0,0,0,0.5), 0 0 ${90 * glow}px rgba(0,191,99,${0.25 * glow})` : undefined,
          }}
        >
          {wipe < 1 && (
            <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${inner})` }}>
              <WaveBackground />
              <S8Words />
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${wipe * 100}%`, background: C.white }} />
          {frame >= LOGO_HIT_FRAME - 1 && (
            <Img
              src={staticFile("images/logo.webp")}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: ICON * 0.74,
                height: ICON * 0.74,
                transform: `translate(-50%, -50%) scale(${logo})`,
              }}
            />
          )}
        </div>

        {/* wordmark + tagline */}
        {frame >= wordAt && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <KineticText
              words={[
                { text: "handly", at: wordAt, color: C.white, joinNext: true },
                { text: ".ro", at: wordAt + 4, color: C.green },
              ]}
              fontSize={104}
              weight={800}
              tint={C.green}
              style={{ letterSpacing: "-0.04em" }}
            />
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: 40,
                color: C.nightInkSoft,
                opacity: tagline,
                transform: `translateY(${(1 - ease.outCubic(tagline)) * 16}px)`,
                filter: tagline < 1 ? `blur(${(1 - tagline) * 6}px)` : undefined,
              }}
            >
              Postezi. <span style={{ color: C.nightInk }}>Se rezolvă.</span>
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
