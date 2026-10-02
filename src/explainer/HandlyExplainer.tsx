import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { MorphShapes } from "./components/MorphShapes";
import { Stage } from "./components/Stage";
import { useExplainerFonts } from "./fonts";
import { clamp01 } from "./lib/anim";
import { S1Hook } from "./scenes/S1Hook";
import { S2Calendar } from "./scenes/S2Calendar";
import { S3Chores } from "./scenes/S3Chores";
import { S4Post } from "./scenes/S4Post";
import { S5Radar } from "./scenes/S5Radar";
import { S6Choose } from "./scenes/S6Choose";
import { S7NoFees } from "./scenes/S7NoFees";
import { S8Words } from "./scenes/S8Words";
import { S9Logo } from "./scenes/S9Logo";
import { DURATION_IN_FRAMES, MUSIC_LIFT_FRAME } from "./timing";
import { useLayout } from "./layout";
import { ease } from "./lib/anim";

/** White set for the problem half; a black iris opens from the charging orb and lands on the drop. */
const irisR = (frame: number, W: number, H: number) =>
  (Math.hypot(W, H) / 2 + 40) * ease.inCubic(clamp01((frame - (MUSIC_LIFT_FRAME - 16)) / 16));

const WhiteSet: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  if (frame > MUSIC_LIFT_FRAME) return null;
  const R = irisR(frame, L.W, L.H);
  const mask = R > 0 ? `radial-gradient(circle at 50% 50%, transparent ${R}px, #000 ${R + 3}px)` : undefined;
  // daylight mirror of the dark Stage: soft mint light from above, two slow caustic glows, a faint dot field, paper grain
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask, overflow: "hidden", background: "#f6f7f6" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${L.vertical ? "95% 50%" : "60% 75%"} at 50% -10%, #ffffff 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0) 80%)`,
        }}
      />
      <MorphShapes tone="light" />
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(16,40,28,0.10) 1.4px, transparent 1.6px)",
          backgroundSize: "34px 34px",
          backgroundPosition: `${(frame * 0.15) % 34}px ${(frame * 0.25) % 34}px`,
          WebkitMaskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, rgba(0,0,0,0) 30%, #000 100%)",
          maskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, rgba(0,0,0,0) 30%, #000 100%)",
          opacity: 0.8,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(20,40,30,0.05) 100%)" }} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("images/grain.png")})`,
          backgroundSize: "512px 512px",
          opacity: 0.08,
          mixBlendMode: "multiply",
        }}
      />
    </AbsoluteFill>
  );
};

/** Keeps the dark world (the phone flying in) inside the iris until it has fully opened. */
const InsideIris: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  if (frame >= MUSIC_LIFT_FRAME) return <>{children}</>;
  const R = irisR(frame, L.W, L.H);
  const mask = `radial-gradient(circle at 50% 50%, #000 ${R}px, transparent ${R + 3}px)`;
  return <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>{children}</AbsoluteFill>;
};

/** Mounts a scene only inside its window. Scenes read the absolute frame, so every beat is authored in VO frames. */
const Window: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  return frame >= from && frame < to ? <>{children}</> : null;
};

export const HandlyExplainer: React.FC = () => {
  useExplainerFonts();
  const frame = useCurrentFrame();
  // the top light is dim during the problem, opens up on the drop
  const light = 0.55 + 0.45 * clamp01((frame - MUSIC_LIFT_FRAME + 4) / 10) - 0.2 * clamp01((frame - 790) / 10);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Stage light={light} />
      <WhiteSet />
      <Window from={0} to={124}>
        <S1Hook />
      </Window>
      <Window from={116} to={182}>
        <S2Calendar />
      </Window>
      <Window from={168} to={352}>
        <S3Chores />
      </Window>
      <Window from={328} to={452}>
        <InsideIris>
          <S4Post />
        </InsideIris>
      </Window>
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

      {/* voiceover + score + synced sfx, mixed by tools/audio/compose.py */}
      <Audio src={staticFile("audio/explainer-mix.mp3")} />
    </AbsoluteFill>
  );
};
