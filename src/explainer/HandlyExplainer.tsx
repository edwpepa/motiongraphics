import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Stage } from "./components/Stage";
import { useExplainerFonts } from "./fonts";
import { clamp01, ease, lerp } from "./lib/anim";
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

/** Mounts a scene only inside its window. Scenes read the (local) frame, so every beat is authored in VO frames. */
const Window: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  return frame >= from && frame < to ? <>{children}</> : null;
};

const LOGO_POP = MUSIC_LIFT_FRAME - 12; // the handly logo appears as the notebook collapses
const EXPAND = 16; // frames for the logo window to swallow the frame

/** size (px) of the logo window `t` frames into the burst */
const logoWindow = (t: number, base: number) => base * Math.pow(55, ease.inCubic(clamp01(t / EXPAND)));

/**
 * The white world (white set + the problem scenes). On the drop it is cut by a logo-shaped window
 * that rushes towards the camera, so the dark scene is already playing inside the logo as it grows.
 */
const LightWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const local = frame - PRE_ROLL;
  const t = local - BURST;
  if (t >= EXPAND) return null;
  const S = t >= 0 ? logoWindow(t, (L.vertical ? 260 : 230) * 0.82) : 0;
  const logo = staticFile("images/logo.webp");
  const mask: React.CSSProperties =
    S > 0
      ? {
          WebkitMaskImage: `url(${logo}), linear-gradient(#000, #000)`,
          maskImage: `url(${logo}), linear-gradient(#000, #000)`,
          WebkitMaskSize: `${S}px ${S}px, 100% 100%`,
          maskSize: `${S}px ${S}px, 100% 100%`,
          WebkitMaskPosition: `${L.cx - S / 2}px ${L.cy - S / 2}px, 0 0`,
          maskPosition: `${L.cx - S / 2}px ${L.cy - S / 2}px, 0 0`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }
      : {};
  // the logo itself stays solid green while it rushes at the camera, then clears to the window
  const solid = t >= 0 ? 1 - ease.inOutCubic(clamp01((t / EXPAND - 0.45) / 0.4)) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#030504", ...mask, opacity: t >= 0 ? 1 - ease.inOutCubic(clamp01((t / EXPAND - 0.62) / 0.3)) : 1 }}>
        <Sequence from={PRE_ROLL} durationInFrames={MUSIC_LIFT_FRAME + 10} layout="none">
          <Problem />
        </Sequence>
      </AbsoluteFill>
      {solid > 0 && <Img src={logo} style={{ position: "absolute", left: L.cx - S / 2, top: L.cy - S / 2, width: S, height: S, opacity: solid }} />}
    </AbsoluteFill>
  );
};

/** The drop becomes the handly logo for a beat, right before it opens up into the next scene. */
const LogoPop: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const local = frame - PRE_ROLL;
  if (local < LOGO_POP || local >= BURST) return null;
  const s = L.vertical ? 260 : 230;
  const p = ease.outBack(clamp01((local - LOGO_POP) / 12));
  // a gentle breath, then it gathers itself in right before it opens up
  const breathe = 1 + 0.03 * Math.sin((local - LOGO_POP) / 4);
  const gather = 1 - 0.18 * ease.inCubic(clamp01((local - (BURST - 7)) / 7));
  return (
    <Img
      src={staticFile("images/logo.webp")}
      style={{ position: "absolute", left: L.cx - s / 2, top: L.cy - s / 2, width: s, height: s, transform: `scale(${(0.4 + 0.6 * p) * breathe * gather})`, opacity: clamp01((local - LOGO_POP) / 4) }}
    />
  );
};

/**
 * Cold open: a point of light with a soft anamorphic flare drifts in on a slow, mystical curve, then
 * traces the handly heart with its trail; the heart glows for a beat and dissolves as the words begin.
 */
const IntroLight: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  if (frame > PRE_ROLL + 10) return null;
  const S = L.vertical ? 15 : 13;
  const heart = (u: number) => {
    const t = u * Math.PI * 2;
    return { x: 16 * Math.pow(Math.sin(t), 3) * S, y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * S - 30 };
  };
  // drift in from the lower left, then trace the heart from its top notch
  const drift = ease.inOutCubic(clamp01(frame / 12));
  const trace = ease.inOutCubic(clamp01((frame - 10) / 22));
  const start = heart(0);
  let dot = trace > 0 ? heart(trace) : { x: lerp(-L.W * 0.32, start.x, drift) + Math.sin(frame / 3) * 20 * (1 - drift), y: lerp(L.H * 0.22, start.y, drift) };
  const glow = ease.outCubic(clamp01((frame - 30) / 6));
  const fade = ease.inOutCubic(clamp01((frame - (PRE_ROLL - 6)) / 12));
  const appear = ease.outCubic(clamp01(frame / 6));
  const N = 140;
  const path = Array.from({ length: Math.max(2, Math.floor(trace * N) + 1) }, (_, i) => {
    const p = heart(Math.min(trace, i / N));
    return `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");
  if (trace >= 1) dot = heart(1);
  return (
    <AbsoluteFill style={{ opacity: 1 - fade }}>
      <svg width={L.W} height={L.H} viewBox={`${-L.cx} ${-L.cy} ${L.W} ${L.H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* soft bloom when the heart closes */}
        <circle cx={0} cy={-30} r={260 + 60 * glow} fill="url(#il-bloom)" opacity={0.6 * glow} />
        <defs>
          <radialGradient id="il-bloom">
            <stop offset="0%" stopColor="#00e676" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
          </radialGradient>
        </defs>
        {trace > 0 && (
          <>
            <path d={path} fill="none" stroke="#00e676" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={0.35 + 0.3 * glow} style={{ filter: "blur(10px)" }} />
            <path d={path} fill="none" stroke="#c9ffe0" strokeWidth={3 + 1.5 * glow} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {/* the point of light + anamorphic streak */}
        <g transform={`translate(${dot.x} ${dot.y})`} opacity={appear * (1 - glow * 0.6)}>
          <ellipse rx={150} ry={3} fill="rgba(200,255,225,0.55)" style={{ filter: "blur(2px)" }} />
          <circle r={28} fill="rgba(0,230,118,0.35)" style={{ filter: "blur(10px)" }} />
          <circle r={7} fill="#ffffff" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Small green handly mark in the top-left corner for the whole film; it steps aside for the end logo. */
const CornerLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const local = frame - PRE_ROLL;
  const inT = ease.outCubic(clamp01((frame - PRE_ROLL) / 14));
  const outT = ease.inOutCubic(clamp01((local - (LOGO_START - 10)) / 10));
  const a = inT * (1 - outT);
  if (a <= 0) return null;
  const dark = true;
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
      <Img src={staticFile("images/logo.webp")} style={{ width: s, height: s }} />
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
      <IntroLight />
      <LogoPop />
      <CornerLogo />

      {/* voiceover + score + synced sfx (with the cold open in front), mixed by tools/audio/compose.py */}
      <Audio src={staticFile("audio/explainer-mix.mp3")} />
    </AbsoluteFill>
  );
};


