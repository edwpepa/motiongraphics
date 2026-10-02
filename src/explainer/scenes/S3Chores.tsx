import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { LiquidGlass } from "../components/Glass";
import { GlyphName, IconTile, TileColor } from "../components/Icons";
import { KineticText } from "../components/KineticText";
import { clamp01, drift, ease, keys, lerp, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, C, FONT } from "../theme";
import { f, VO } from "../timing";

const LEAD = 3;
const CARD_H = 172;
const GAP = 26;

const ITEMS: { icon: GlyphName; tile: TileColor; words: [string, number][]; sub: string; ago: string }[] = [
  { icon: "droplet", tile: "blue", words: [["Robinet", 5.32], ["care", 5.62], ["curge", 5.85]], sub: "Amânat de 2 săptămâni", ago: "2 săpt." },
  { icon: "hammer", tile: "indigo", words: [["Dulap", 7.05], ["de", 7.35], ["montat", 7.45]], sub: "Amânat de o lună", ago: "1 lună" },
  { icon: "roller", tile: "orange", words: [["Perete", 8.7], ["de", 9.05], ["zugrăvit", 9.15]], sub: "Amânat din primăvară", ago: "3 luni" },
];

const arrive = (i: number) => f(VO.chores[i]) - LEAD;

/** One iOS-style notification in liquid glass. */
const Note: React.FC<{ i: number; frame: number; width: number }> = ({ i, frame, width }) => {
  const item = ITEMS[i];
  const sub = clamp01((frame - (f(item.words[2][1]) + 4)) / 8);
  return (
    <LiquidGlass width={width} height={CARD_H} radius={46} strength={60} frost={14}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 34px", gap: 28, fontFamily: FONT, fontWeight: BOLD }}>
        <IconTile name={item.icon} color={item.tile} size={104} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <KineticText words={item.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={48} style={{ alignItems: "flex-start" }} />
          <div style={{ fontSize: 28, color: "rgba(20,40,30,0.55)", opacity: sub, transform: `translateY(${(1 - sub) * 8}px)` }}>{item.sub}</div>
        </div>
        <div style={{ alignSelf: "flex-start", marginTop: 30, fontSize: 24, color: "rgba(20,40,30,0.45)" }}>{item.ago}</div>
      </div>
    </LiquidGlass>
  );
};

// "Un robinet care curge. Un dulap de montat. Un perete de zugrăvit." … [long pause]
export const S3Chores: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const enter = 158;
  const W = V ? 940 : 1000;

  // enter: out of the calendar's focus pull
  const inT = ease.outCubic(clamp01((frame - enter) / 14));

  // the pause builds tension: the stack squeezes together, then the camera punches through it
  const squeeze = ease.inOutCubic(clamp01((frame - (f(VO.choresEnd) + 2)) / 28));
  const punch = ease.inExpo(clamp01((frame - 346) / 14));
  const camScale = keys(frame, [
    [enter, 1.08],
    [f(VO.choresEnd), 1.0],
  ], ease.outCubic) * (1 - 0.1 * squeeze) * (1 + 2.2 * punch);
  const flash = clamp01((frame - 350) / 8) * (1 - clamp01((frame - 362) / 8));

  const count = ITEMS.filter((_, i) => frame >= arrive(i) - 1).length;

  return (
    <AbsoluteFill style={{ opacity: clamp01((frame - enter) / 6) }}>
      <AbsoluteFill
        style={{
          transform: `scale(${(0.86 + 0.14 * inT) * camScale}) rotate(${drift(frame, 0.6, 160)}deg)`,
          filter: inT < 1 || punch > 0 ? `blur(${(1 - inT) * 22 + punch * 30}px)` : undefined,
          opacity: 1 - clamp01((frame - 352) / 8),
        }}
      >
        {ITEMS.map((_, i) => {
          if (frame < arrive(i) - 1) return null;
          const p = pop(frame, arrive(i), 13, 150);
          // newest on top; older ones are pushed down the list as new ones land
          const newer = ITEMS.filter((__, j) => j > i && frame >= arrive(j)).length;
          let slot = 0;
          for (let j = i + 1; j < ITEMS.length; j++) slot += ease.outExpo(clamp01((frame - arrive(j)) / 14));
          const listY = (slot - (count - 1) / 2) * (CARD_H + GAP);
          const stackY = slot * 22 - 20;
          const y = lerp(listY, stackY, squeeze) + drift(frame, 5, 90 + i * 17, i);
          const depth = lerp(1 - 0.03 * newer, 1 - 0.06 * slot, squeeze);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: L.cx - W / 2,
                top: L.cy - CARD_H / 2 + y - (1 - p) * 140,
                transform: `scale(${(0.9 + 0.1 * p) * depth})`,
                opacity: clamp01(p * 2.5) * lerp(1, i === ITEMS.length - 1 ? 1 : 0.85, squeeze),
                filter: p < 0.96 ? `blur(${(1 - Math.min(1, p)) * 10}px)` : undefined,
                zIndex: 10 + i,
              }}
            >
              <Note i={i} frame={frame} width={W} />
            </div>
          );
        })}
        {/* small header above the stack */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: L.cy - ((CARD_H + GAP) * 3) / 2 - (V ? 110 : 90),
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: BOLD,
            fontSize: V ? 40 : 34,
            color: "rgba(20,40,30,0.5)",
            opacity: clamp01((frame - enter - 4) / 10) * (1 - squeeze),
            letterSpacing: "0.02em",
          }}
        >
          De făcut prin casă · {count}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #ffffff 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0) 75%)", opacity: flash }} />
      <AbsoluteFill style={{ background: C.white, opacity: flash * 0.6 }} />
    </AbsoluteFill>
  );
};
