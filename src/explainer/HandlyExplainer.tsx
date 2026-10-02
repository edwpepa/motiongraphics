import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BurstRing, burstRadius, LightBackdrop } from "./components/LightWorld";
import { Stage } from "./components/Stage";
import { useExplainerFonts } from "./fonts";
import { clamp01, ease } from "./lib/anim";
import { Problem } from "./scenes/Problem";
import { S4Post } from "./scenes/S4Post";
import { S5Radar } from "./scenes/S5Radar";
import { S6Choose } from "./scenes/S6Choose";
import { S7NoFees } from "./scenes/S7NoFees";
import { LOGO_START } from "./scenes/S8Words";
import { S8Words } from "./scenes/S8Words";
import { S9Logo } from "./scenes/S9Logo";
import { BOLD, FONT } from "./theme";
import { DURATION_IN_FRAMES, f, MUSIC_LIFT_FRAME, PRE_ROLL, VO } from "./timing";
import { useLayout } from "./layout";

// Everything authored against the voiceover lives in "local" frames; the cold open shifts it by PRE_ROLL.
const BURST = MUSIC_LIFT_FRAME - 3; // local frame the orb bursts open
const PULL_FROM = f(VO.choresEnd) - 2;
const PULL_TO = MUSIC_LIFT_FRAME - 4;

/** Mounts a scene only inside its window. Scenes read the (local) frame, so every beat is authored in VO frames. */
const Window: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  return frame >= from && frame < to ? <>{children}</> : null;
};

/** The white world (spheres, grid, cold-open radar, the problem scenes), cut open by the burst. */
const LightWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const local = frame - PRE_ROLL;
  const t = local - BURST;
  if (t > 16) return null;
  const R = t >= 0 ? burstRadius(t, L.W, L.H) : 0;
  const mask = R > 0 ? `radial-gradient(circle at 50% 50%, transparent ${R}px, #000 ${R + 1.5}px)` : undefined;
  return (
    <AbsoluteFill style={mask ? { WebkitMaskImage: mask, maskImage: mask } : undefined}>
      <LightBackdrop frame={frame} frames={PRE_ROLL + MUSIC_LIFT_FRAME + 20} pull={clamp01((local - PULL_FROM) / (PULL_TO - PULL_FROM))} />
      <Sequence from={PRE_ROLL} durationInFrames={MUSIC_LIFT_FRAME + 10} layout="none">
        <Problem />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Small green handly mark in the top-left corner for the whole film; it steps aside for the end logo. */
const CornerLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const local = frame - PRE_ROLL;
  const inT = ease.outCubic(clamp01((frame - 6) / 14));
  const outT = ease.inOutCubic(clamp01((local - (LOGO_START - 10)) / 10));
  const a = inT * (1 - outT);
  if (a <= 0) return null;
  const dark = local >= MUSIC_LIFT_FRAME - 1;
  const s = L.vertical ? 50 : 44;
  return (
    <div
      style={{
        position: "absolute",
        left: L.vertical ? 64 : 60,
        top: L.vertical ? 96 : 52,
        display: "flex",
        alignItems: "center",
        gap: s * 0.28,
        opacity: a,
        transform: `translateY(${(1 - inT) * -10}px)`,
        filter: outT > 0 ? `blur(${outT * 8}px)` : undefined,
      }}
    >
      <Img src={staticFile("images/logo.webp")} style={{ width: s, height: s, filter: dark ? "drop-shadow(0 0 12px rgba(0,230,118,0.35))" : undefined }} />
      <div style={{ fontFamily: FONT, fontWeight: BOLD, fontSize: s * 0.66, lineHeight: 1, letterSpacing: "-0.035em", color: dark ? "#2be38a" : "#00a352", transform: `translateY(${-s * 0.06}px)` }}>handly.ro</div>
    </div>
  );
};

/** The dark set behind everything (its light opens up on the drop). */
const StageLayer: React.FC = () => {
  const frame = useCurrentFrame() - PRE_ROLL;
  const light = 0.55 + 0.45 * clamp01((frame - MUSIC_LIFT_FRAME + 4) / 10) - 0.2 * clamp01((frame - 790) / 10);
  return <Stage light={light} />;
};

export const HandlyExplainer: React.FC = () => {
  const fontsReady = useExplainerFonts();
  if (!fontsReady) return <AbsoluteFill style={{ background: "#000" }} />;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <StageLayer />
      <Sequence from={PRE_ROLL} durationInFrames={DURATION_IN_FRAMES} layout="none">
        <Window from={MUSIC_LIFT_FRAME - 4} to={452}>
          <S4Post />
        </Window>
      </Sequence>
      <LightWorld />
      <Sequence from={PRE_ROLL} durationInFrames={DURATION_IN_FRAMES} layout="none">
        <BurstAt />
        <Window from={436} to={526}>
          <S5Radar />
        </Window>
        <Window from={508} to={630}>
          <S6Choose />
        </Window>
        <Window from={616} to={716}>
          <S7NoFees />
        </Window>
        <Window from={706} to={800}>
          <S8Words />
        </Window>
        <Window from={784} to={DURATION_IN_FRAMES}>
          <S9Logo />
        </Window>
      </Sequence>
      <CornerLogo />

      {/* voiceover + score + synced sfx (with the cold open in front), mixed by tools/audio/compose.py */}
      <Audio src={staticFile("audio/explainer-mix.mp3")} />
    </AbsoluteFill>
  );
};

const BurstAt: React.FC = () => {
  const frame = useCurrentFrame();
  return <BurstRing t={frame - BURST} />;
};

