import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { INK_DARK, KineticText, SHADOW_DARK } from "../components/KineticText";
import { Orb } from "../components/Orb";
import { clamp01, ease, keys, lerp, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, C, FONT } from "../theme";
import { StoreBadge } from "../components/StoreBadge";
import { CTA_FRAME, DURATION_IN_FRAMES, LOGO_HIT_FRAME } from "../timing";
import { LOGO_START } from "./S8Words";

// Three drops of light gather and melt into one orb; on the hit the orb blooms and resolves into
// the green handly logo. Nothing from the previous shot is carried in — the frame is clean.
export const S9Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const size = V ? 760 : 700;
  const c = size / 2;

  const gather = ease.inOutCubic(clamp01((frame - LOGO_START - 4) / (LOGO_HIT_FRAME - LOGO_START - 4)));
  const spread = (1 - gather) * size * 0.34;
  const r = size * (0.07 + 0.05 * gather);
  const blobs = [
    { x: c - spread, y: c + spread * 0.4, r },
    { x: c + spread, y: c + spread * 0.3, r: r * 0.92 },
    { x: c, y: c - spread * 0.85, r: r * 0.85 },
  ];
  const orbIn = ease.outCubic(clamp01((frame - LOGO_START - 4) / 8));
  const bloom = ease.outCubic(clamp01((frame - LOGO_HIT_FRAME + 1) / 8));
  const orbOut = clamp01((frame - LOGO_HIT_FRAME) / 7);
  const flash = clamp01((frame - LOGO_HIT_FRAME + 2) / 3) * (1 - clamp01((frame - LOGO_HIT_FRAME - 2) / 10));

  const logo = pop(frame, LOGO_HIT_FRAME, 12, 150);
  const LOGO = V ? 300 : 280;
  const rise = keys(frame, [
    [LOGO_HIT_FRAME + 14, 0],
    [LOGO_HIT_FRAME + 32, 1],
  ], ease.inOutCubic);
  const lift = (V ? -140 : -110) * rise;
  const wordAt = LOGO_HIT_FRAME + 22;
  const tagline = clamp01((frame - (LOGO_HIT_FRAME + 38)) / 12);
  // end card: logo + wordmark step up, tagline gives way to "Descarcă acum" and the two store badges
  const cta = ease.inOutCubic(clamp01((frame - CTA_FRAME) / 18));
  const tagOut = ease.inCubic(clamp01((frame - CTA_FRAME) / 8));
  const logoY = lift + (V ? -170 : -150) * cta;
  const logoS = 1 - 0.3 * cta;
  const wordY = (V ? -200 : -215) * cta;
  const wordS = 1 - 0.3 * cta;
  const ctaAt = CTA_FRAME + 10;
  const badgeAt = [CTA_FRAME + 16, CTA_FRAME + 21];
  const BH = V ? 136 : 104;
  const outro = 1 - ease.inCubic(clamp01((frame - (DURATION_IN_FRAMES - 16)) / 16));

  return (
    <AbsoluteFill style={{ opacity: outro }}>
      {frame < LOGO_HIT_FRAME + 8 && (
        <div
          style={{
            position: "absolute",
            left: L.cx - c,
            top: L.cy - c,
            width: size,
            height: size,
            opacity: orbIn * (1 - orbOut),
            transform: `scale(${(0.7 + 0.3 * orbIn) * (1 + 0.9 * bloom)})`,
            filter: orbOut > 0 ? `blur(${orbOut * 24}px)` : undefined,
          }}
        >
          <Orb blobs={blobs} size={size} glow={0.8 + 0.6 * gather} />
        </div>
      )}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(200,255,225,0.9) 0%, rgba(0,220,110,0.5) 25%, rgba(0,0,0,0) 60%)", opacity: flash }} />

      {frame >= LOGO_HIT_FRAME && (
        <Img
          src={staticFile("images/logo.webp")}
          style={{
            position: "absolute",
            left: L.cx - LOGO / 2,
            top: L.cy - LOGO / 2,
            width: LOGO,
            height: LOGO,
            opacity: clamp01(logo * 1.6),
            filter: `drop-shadow(0 0 ${lerp(80, 36, clamp01((frame - LOGO_HIT_FRAME) / 20))}px rgba(0,230,118,0.5))${logo < 0.98 ? ` blur(${(1 - Math.min(1, logo)) * 10}px)` : ""}`,
            transform: `translateY(${logoY}px) scale(${logo * (1 - 0.18 * rise) * logoS})`,
          }}
        />
      )}

      {frame >= wordAt && (
        <div style={{ position: "absolute", left: 0, right: 0, top: L.cy + (V ? 80 : 90), display: "flex", flexDirection: "column", alignItems: "center", gap: V ? 30 : 22, transform: `translateY(${wordY}px) scale(${wordS})`, transformOrigin: "50% 0%" }}>
          <KineticText words={[{ text: "handly.ro", at: wordAt }]} fontSize={V ? 136 : 120} ink={INK_DARK} tint={INK_DARK} shadow={SHADOW_DARK} style={{ letterSpacing: "-0.045em" }} />
          <div
            style={{
              fontFamily: FONT,
              fontWeight: BOLD,
              fontSize: V ? 46 : 40,
              color: C.nightInkSoft,
              opacity: tagline * (1 - tagOut),
              transform: `translateY(${(1 - ease.outCubic(tagline)) * 16 - 20 * tagOut}px)`,
              filter: tagline < 1 || tagOut > 0 ? `blur(${(1 - tagline) * 6 + tagOut * 10}px)` : undefined,
            }}
          >
            Postezi. Se rezolvă!
          </div>
        </div>
      )}

      {frame >= ctaAt - 2 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: L.cy + (V ? 140 : 60), display: "flex", flexDirection: "column", alignItems: "center", gap: V ? 64 : 50 }}>
          <KineticText words={[{ text: "Descarcă", at: ctaAt }, { text: "acum", at: ctaAt + 3 }]} fontSize={V ? 84 : 68} ink={INK_DARK} tint={INK_DARK} shadow={SHADOW_DARK} style={{ letterSpacing: "-0.04em" }} />
          <div style={{ display: "flex", gap: V ? 26 : 30 }}>
            {(["apple", "google"] as const).map((st, i) => {
              const p = pop(frame, badgeAt[i], 13, 170);
              if (p <= 0.001) return null;
              return (
                <div key={st} style={{ opacity: clamp01(p * 2), transform: `translateY(${(1 - p) * 60}px) scale(${0.85 + 0.15 * p})`, filter: p < 0.9 ? `blur(${(1 - Math.min(1, p)) * 10}px)` : undefined }}>
                  <StoreBadge store={st} h={BH} shine={clamp01((frame - badgeAt[i] - 14) / 20)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
