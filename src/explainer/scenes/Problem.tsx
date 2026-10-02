import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { AppleLine, AWord, GREEN_D, textWidth, wordCenter } from "../components/AppleText";
import { LiquidGlass } from "../components/Glass";
import { HeroOrb, Trails } from "../components/HeroOrb";
import { GlyphName, IconTile, TileColor } from "../components/Icons";
import { Particles } from "../components/Particles";
import { PhraseSeq } from "../components/Phrase";
import { clamp01, ease, lerp, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, FONT } from "../theme";
import { f, MUSIC_LIFT_FRAME, VO } from "../timing";

/**
 * Problem half, in the Humain reference's language: a deep teal set with a slow light beam and
 * floating particles; an iridescent glass orb streaks in on light trails and lives *inside* the
 * sentences — it sits between words, leads a "thinking" glass pill, then winds down into a loading
 * spinner that never finishes ("amâni"). The chores arrive as dark glass task cards stacking up in
 * depth. In the pause every particle is pulled into the orb, which charges and bursts on the drop.
 */

const LEAD = 3;
const hw = (i: number) => f(VO.hook[i][1]) - LEAD;
const pw = (i: number) => f(VO.postpone[i][1]) - LEAD;
const DROP = MUSIC_LIFT_FRAME;

const CHORES: { icon: GlyphName; tile: TileColor; title: string; words: [string, number][]; days: number }[] = [
  { icon: "droplet", tile: "blue", title: "Robinet care curge", words: [["Un", 5.41], ["robinet", 5.55], ["care", 5.95], ["curge.", 6.2]], days: 14 },
  { icon: "hammer", tile: "indigo", title: "Dulap de montat", words: [["Un", 7.01], ["dulap", 7.13], ["de", 7.5], ["montat.", 7.62]], days: 31 },
  { icon: "roller", tile: "orange", title: "Perete de zugrăvit", words: [["Un", 8.52], ["perete", 8.65], ["de", 9.05], ["zugrăvit.", 9.18]], days: 92 },
];
const arrive = (i: number) => f(VO.chores[i]) - LEAD;
const END = f(VO.choresEnd);
const FLY = END + 2;

/** teal set: graded gradient, a slow diagonal light beam, vignette, grain */
const TealSet: React.FC<{ frame: number; boost: number }> = ({ frame, boost }) => {
  const L = useLayout();
  const sweep = Math.sin(frame / 70) * 0.06;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #04241f 0%, #021512 45%, #010807 100%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse ${L.vertical ? "90% 45%" : "60% 70%"} at ${18 + sweep * 100}% 0%, rgba(20,140,120,0.45) 0%, rgba(10,90,75,0.15) 40%, rgba(0,0,0,0) 70%)` }} />
      <div
        style={{
          position: "absolute",
          left: L.W * (0.05 + sweep),
          top: -L.H * 0.5,
          width: L.W * 0.32,
          height: L.H * 2,
          transform: "rotate(-32deg)",
          background: `linear-gradient(90deg, rgba(120,255,220,0) 0%, rgba(120,255,220,${0.07 + 0.08 * boost}) 50%, rgba(120,255,220,0) 100%)`,
          filter: "blur(40px)",
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(150,255,170,${0.18 * boost}) 0%, rgba(0,0,0,0) 45%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", opacity: 0.07, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

/** a thin arc that keeps spinning and never completes */
const Spinner: React.FC<{ size: number; frame: number; opacity: number }> = ({ size: s, frame, opacity }) => (
  <svg width={s} height={s} viewBox="0 0 100 100" style={{ position: "absolute", left: -s / 2, top: -s / 2, opacity, transform: `rotate(${frame * 9}deg)` }}>
    <defs>
      <linearGradient id="spin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c8ff5a" />
        <stop offset="100%" stopColor="#2ee6a8" stopOpacity={0} />
      </linearGradient>
    </defs>
    <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={9} />
    <circle cx={50} cy={50} r={40} fill="none" stroke="url(#spin)" strokeWidth={9} strokeLinecap="round" strokeDasharray={`${150 + 40 * Math.sin(frame / 8)} 400`} />
  </svg>
);

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const FS = V ? 64 : 66;
  const OS = Math.round(FS * 1.05);
  const DOTS = FS * 0.75;

  // ---------------------------------------------------------------- sentences with the orb inside
  const P: { words: AWord[]; orb: number; out: number; pill?: boolean }[] = [
    { words: [{ text: "", at: 6, slot: OS }, ...[0, 1, 2].map((i) => ({ text: VO.hook[i][0], at: hw(i) }))], orb: 0, out: hw(3) - 5 },
    { words: [...[3, 4, 5].map((i) => ({ text: VO.hook[i][0], at: hw(i) })), { text: "", at: hw(6) - 5, slot: OS }, { text: VO.hook[6][0], at: hw(6), color: GREEN_D }], orb: 3, out: hw(7) - 6 },
    { words: [{ text: "", at: hw(7) - 4, slot: OS }, { text: "prin", at: hw(7), color: GREEN_D }, { text: "casă", at: hw(8), color: GREEN_D }, { text: "", at: hw(8) + 6, slot: DOTS }], orb: 0, out: f(VO.hookEnd) - 4, pill: true },
    { words: [...VO.postpone.map(([text], i) => ({ text, at: pw(i) })), { text: "", at: pw(4) + 4, slot: OS }], orb: 5, out: arrive(0) - 8 },
  ];
  const starts = P.map((p) => p.words.find((w) => w.slot === undefined)!.at - 2);

  // where the orb is: its slot in the current sentence, gliding to the next sentence's slot
  const slotX = (k: number, fr: number) => wordCenter(P[k].words, P[k].orb, FS, fr);
  const MOVES = [P[1].words[3].at - 3, P[2].words[0].at - 4, P[3].words[5].at - 6];
  const orbXAt = (fr: number) => {
    // fly in from off-screen left
    const fin = ease.outExpo(clamp01((fr - 2) / 16));
    let x = lerp(-L.W / 2 - 300, slotX(0, fr), fin);
    MOVES.forEach((m, j) => {
      const e = ease.inOutCubic(clamp01((fr - m) / 10));
      if (e > 0) x = lerp(x, slotX(j + 1, fr), e);
    });
    return x;
  };
  const orbX = orbXAt(frame);
  const speed = Math.abs(orbX - orbXAt(frame - 1));
  const toSpinner = ease.inOutCubic(clamp01((frame - (pw(4) + 6)) / 10));
  const orbGone = ease.inCubic(clamp01((frame - (arrive(0) - 10)) / 8));
  const orbScale = (0.4 + 0.6 * pop(frame, 2, 13, 150)) * (1 - 0.6 * toSpinner) * (1 - orbGone);

  // ---------------------------------------------------------------- pill behind "prin casă …"
  const p3 = P[2];
  const pillIn = ease.outExpo(clamp01((frame - (p3.words[1].at - 3)) / 14));
  const pillOut = ease.inOutCubic(clamp01((frame - p3.out) / 8));
  const prinL = wordCenter(p3.words, 1, FS, frame) - textWidth("prin", FS, -0.03) / 2;
  const dotsR = wordCenter(p3.words, 3, FS, frame) + DOTS / 2;
  const pillH = Math.round(FS * 1.75);
  const pillW = Math.max(pillH, Math.round((dotsR - prinL + FS * 0.9) * pillIn));
  const pillX = prinL - FS * 0.45;

  // ---------------------------------------------------------------- chores: dark glass cards in depth
  const CW = V ? 880 : 760;
  const CH = V ? 210 : 196;
  const textY = V ? -300 : -190;
  const cardY = V ? 70 : 60;
  const cards = CHORES.map((c, i) => {
    const a = arrive(i);
    if (frame < a - 6) return null;
    const inT = ease.outExpo(clamp01((frame - (a - 6)) / 16));
    // every later chore pushes this one one step back into the haze
    let depth = 0;
    for (let j = i + 1; j < CHORES.length; j++) depth += ease.inOutCubic(clamp01((frame - (arrive(j) - 8)) / 14));
    const away = ease.inOutCubic(clamp01((frame - (END - 2 + i * 2)) / 14));
    const side = i % 2 ? 1 : -1;
    const scale = (1.12 - 0.12 * inT) * Math.pow(0.78, depth) * (1 - 0.2 * away);
    const x = side * depth * (V ? 120 : 260);
    const y = (1 - inT) * 90 - depth * (V ? 150 : 95) - away * 60;
    const blur = (1 - inT) * 14 + depth * 4 + away * 14;
    const op = clamp01(inT * 1.4) * (1 - 0.32 * depth) * (1 - away);
    if (op <= 0.01) return null;
    const count = Math.round(1 + (c.days - 1) * ease.outCubic(clamp01((frame - a - 8) / 22)));
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: L.cx - CW / 2 + x,
          top: L.cy + cardY - CH / 2 + y,
          zIndex: 10 - Math.round(depth * 2),
          transform: `scale(${scale})`,
          opacity: op,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        }}
      >
        <LiquidGlass width={CW} height={CH} radius={V ? 48 : 42} tone="dark" strength={60} frost={14} tint={0.07}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: V ? 34 : 30, padding: `0 ${V ? 40 : 34}px`, fontFamily: FONT, fontWeight: BOLD }}>
            <IconTile name={c.icon} color={c.tile} size={CH * 0.56} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: CH * 0.22, color: "#f2fff8", letterSpacing: "-0.025em" }}>{c.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: CH * 0.14, color: "rgba(220,255,240,0.5)" }}>
                <div style={{ position: "relative", width: CH * 0.15, height: CH * 0.15 }}>
                  <div style={{ position: "absolute", left: (CH * 0.15) / 2, top: (CH * 0.15) / 2 }}>
                    <Spinner size={CH * 0.15} frame={frame} opacity={1} />
                  </div>
                </div>
                <span>
                  Amânat de <span style={{ color: "#c8ff5a" }}>{count} zile</span>
                </span>
              </div>
            </div>
          </div>
        </LiquidGlass>
      </div>
    );
  });

  // ---------------------------------------------------------------- pause: everything is pulled into the orb
  const pull = clamp01((frame - (END - 4)) / (DROP - END + 2));
  const charge = ease.inCubic(clamp01((frame - FLY) / (DROP - FLY)));
  const core = pop(frame, FLY, 12, 140) * (1 + 0.5 * charge + 0.06 * Math.sin(frame / 1.8) * charge);

  const gone = clamp01((frame - (DROP + 1)) / 6);
  return (
    <AbsoluteFill style={gone > 0 ? { opacity: 1 - gone } : undefined}>
      <TealSet frame={frame} boost={charge} />
      <Particles frame={frame} pull={pull} opacity={0.85} />

      {/* sentences */}
      {P.map((p, k) => {
        const st = starts[k];
        if (frame < st - 4 || frame > p.out + 10) return null;
        const t = ease.inOutCubic(clamp01((frame - p.out) / 8));
        return (
          <AbsoluteFill key={k} style={{ justifyContent: "center", alignItems: "center", opacity: 1 - t, transform: `translateY(${-t * 20}px)`, filter: t > 0 ? `blur(${t * 12}px)` : undefined }}>
            {p.pill && (
              <div style={{ position: "absolute", left: L.cx + pillX, top: L.cy - pillH / 2, opacity: (1 - pillOut) * clamp01(pillIn * 2) }}>
                <LiquidGlass width={pillW} height={pillH} radius={pillH / 2} tone="dark" strength={50} frost={10} tint={0.08} />
              </div>
            )}
            <AppleLine words={p.words} fontSize={FS} />
            {p.pill && frame >= p.words[3].at && (
              <div style={{ position: "absolute", left: L.cx + wordCenter(p.words, 3, FS, frame) - DOTS / 2, top: L.cy + FS * 0.12, display: "flex", gap: FS * 0.1 }}>
                {[0, 1, 2].map((d) => {
                  const local = frame - p.words[3].at - d * 3;
                  const a = ease.outCubic(clamp01(local / 6));
                  const hop = local > 4 ? Math.max(0, Math.sin(((local - 4) / 16) * Math.PI * 2)) : 0;
                  return <div key={d} style={{ width: FS * 0.13, height: FS * 0.13, borderRadius: "50%", background: "#c8ff5a", boxShadow: "0 0 10px rgba(200,255,90,0.7)", opacity: a, transform: `translateY(${-hop * FS * 0.22}px) scale(${0.3 + 0.7 * a})` }} />;
                })}
              </div>
            )}
          </AbsoluteFill>
        );
      })}

      {/* the orb (and the spinner it winds down into) */}
      {orbScale > 0.01 && (
        <div style={{ position: "absolute", left: L.cx + orbX, top: L.cy }}>
          <div style={{ position: "absolute", left: -OS / 2, top: -OS / 2, width: OS, height: OS }}>
            <Trails size={OS} speed={speed} />
          </div>
          <div style={{ position: "absolute", left: -OS / 2, top: -OS / 2, transform: `scale(${orbScale})` }}>
            <HeroOrb size={OS} frame={frame} dim={toSpinner * 0.7} />
          </div>
          {toSpinner > 0 && <Spinner size={OS * 1.05} frame={frame} opacity={toSpinner * (1 - orbGone)} />}
        </div>
      )}

      {/* chores */}
      <PhraseSeq
        phrases={CHORES.map((c, i) => ({ words: c.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD })), out: i < 2 ? arrive(i + 1) - 4 : END - 2, breaks: V ? [1] : [] }))}
        fontSize={FS}
        y={textY}
      />
      {cards}

      {/* the orb returns and charges as everything is pulled into it */}
      {frame >= FLY && (
        <div style={{ position: "absolute", left: L.cx - OS, top: L.cy - OS, transform: `scale(${core})` }}>
          <HeroOrb size={OS * 2} frame={frame} glow={1 + charge} />
        </div>
      )}
    </AbsoluteFill>
  );
};
