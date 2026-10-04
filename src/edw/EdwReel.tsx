import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { CAPTION_MUTE } from "./EdwEnterprise";
import { FONT, Logo, VO, clamp01, ease, hash, lerp, useT, w } from "./kit";
import { FIN, MID_END, R, REVEAL } from "./logoShots";

export const RW = 1080;
export const RH = 1920;

/**
 * The 9:16 cut: the clean 16:9 film (rendered with reel layout, no bars, no captions) re-framed by a virtual
 * camera that keeps whatever matters in the middle of the phone — slow pans between subjects, a pull-back
 * whenever the logo appears so it fits whole, big captions below, the mark small at the top.
 */
type Key = [number, number, number]; // time, focus x in the 16:9 frame, zoom (1 = the 16:9 height fills 1350 px)
const S0 = 1.25;
const KEYS: Key[] = [
  [0, 990, S0],
  [6.5, 990, S0],
  [6.6, 960, S0],
  [21.0, 960, S0],
  [21.1, 960, 1.15],
  [w("history", 0) - 0.2, 960, 1.15],
  [w("history", 4), 900, 0.95],
  [29.35, 900, 0.95],
  [29.4, 960, S0],
  [R - 0.05, 960, S0],
  [R + 0.25, 960, 0.54],
  [R + 1.0, 960, 0.6],
  [MID_END, 960, 0.6],
  [MID_END + 0.05, 960, 1.1],
  [36.7, 960, 1.1],
  [36.75, 560, S0],
  [w("specialists", 2) - 0.35, 560, S0],
  [w("specialists", 2) + 0.35, 1390, S0],
  [39.75, 1390, S0],
  [39.8, 960, 1.05],
  [42.4, 960, 1.05],
  [42.45, 960, 1.0],
  [46.55, 960, 1.0],
  [46.6, 960, 1.15],
  [51.2, 960, 1.15],
  [51.25, 420, S0],
  [w("apps", 2) + 0.2, 420, S0],
  [w("apps", 4) + 0.1, 940, S0],
  [w("apps", 6) + 0.2, 940, S0],
  [w("apps", 8) - 0.1, 1480, S0],
  [w("apps", 10) - 0.1, 1480, S0],
  [w("apps", 12) + 0.3, 960, 0.62],
  [56.65, 960, 0.62],
  [56.7, 960, S0],
  [60.0, 960, S0],
  [60.15, 960, 1.12],
  [FIN - 0.05, 960, 1.12],
  [FIN, 960, S0],
  [REVEAL - 0.05, 960, S0],
  [REVEAL + 0.4, 960, 0.6],
  [70, 960, 0.6],
];
// cuts happen instantly (keys 0.05 s apart), moves within a scene glide with an ease
function cam(t: number) {
  if (t <= KEYS[0][0]) return { fx: KEYS[0][1], s: KEYS[0][2] };
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, x1, s1] = KEYS[i];
    const [t0, x0, s0] = KEYS[i - 1];
    if (t <= t1) {
      const u = ease.inOut(clamp01((t - t0) / Math.max(1e-3, t1 - t0)));
      return { fx: lerp(x0, x1, u), s: lerp(s0, s1, u) };
    }
  }
  const k = KEYS[KEYS.length - 1];
  return { fx: k[1], s: k[2] };
}

const ReelFrame: React.FC = () => {
  const t = useT();
  const { fx, s } = cam(t);
  const vh = 1080 * s, vw = 1920 * s;
  const cy = 880;
  // keep the crop inside the picture
  const left = Math.min(0, Math.max(RW - vw, RW / 2 - fx * s));
  const top = cy - vh / 2;
  const fadeTop = Math.max(0, top), fadeBot = Math.min(RH, top + vh);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", left, top, width: vw, height: vh }}>
        <OffthreadVideo src={staticFile("video/edw-clean.mp4")} muted style={{ width: vw, height: vh }} />
      </div>
      {/* soft cinematic edges above and below the picture */}
      <div style={{ position: "absolute", left: 0, right: 0, top: fadeTop - 1, height: 160, background: "linear-gradient(#000, rgba(0,0,0,0))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: fadeBot - 159, height: 160, background: "linear-gradient(rgba(0,0,0,0), #000)" }} />
    </AbsoluteFill>
  );
};

/** captions for the phone: bigger, wrapped, centred under the picture */
const ReelCaptions: React.FC = () => {
  const t = useT();
  const order = Object.keys(VO);
  const quiet = CAPTION_MUTE.reduce((m, [a, b]) => Math.max(m, clamp01((t - a) / 0.15) * clamp01((b - t) / 0.2)), 0);
  let cur: string | null = null;
  for (let i = 0; i < order.length; i++) {
    const p = VO[order[i]];
    const next = order[i + 1] ? VO[order[i + 1]].start : 99;
    if (t >= p.start - 0.12 && t < Math.min(next - 0.12, p.end + 0.7)) cur = order[i];
  }
  if (!cur || cur === "edw" || cur === "yours" || quiet >= 1) return null;
  const p = VO[cur];
  const next = order[order.indexOf(cur) + 1];
  const outAt = Math.min(next ? VO[next].start - 0.12 : 99, p.end + 0.7);
  const o = clamp01((t - (p.start - 0.12)) / 0.15) * clamp01((outAt - t) / 0.15) * (1 - quiet);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1580, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 50, lineHeight: 1.28, letterSpacing: "0.005em", color: "#f2f2f2", textAlign: "center", textShadow: "0 2px 18px rgba(0,0,0,0.9)" }}>
        {p.words.map(([word, at], i) => {
          const a = clamp01((t - at + 0.06) / 0.16);
          return (
            <span key={i} style={{ opacity: 0.25 + 0.75 * a, filter: `blur(${(1 - a) * 3}px)`, display: "inline-block", marginRight: 14 }}>
              {i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** the mark, small and centred at the top (hidden while the logo itself is on screen) */
const ReelMark: React.FC = () => {
  const t = useT();
  const o = clamp01((t - 1.2) / 1.2) * (1 - clamp01((t - 28.9) / 0.5)) + clamp01((t - (w("roof", 0) + 0.5)) / 0.8) * (1 - clamp01((t - (FIN - 1.0)) / 0.7));
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: RW / 2 - 85, top: 150, opacity: o }}>
      <Logo width={170} white />
    </div>
  );
};

/** grain + vignette for the tall frame */
const ReelGrade: React.FC = () => {
  const t = useT();
  const k = Math.floor(t * 15);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 46%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill
        style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", backgroundPosition: `${Math.floor(hash(k) * 512)}px ${Math.floor(hash(k + 7.3) * 512)}px`, opacity: 0.06, mixBlendMode: "screen" }}
      />
    </AbsoluteFill>
  );
};

export const EdwReel: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  useExplainerFonts();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ReelFrame />
      <ReelGrade />
      <ReelMark />
      <ReelCaptions />
      {audio && (
        <Sequence>
          <Audio src={staticFile("audio/edw-mix.mp3")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
