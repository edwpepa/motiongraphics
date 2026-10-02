import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GlyphName, IconTile, TileColor } from "../components/Icons";
import { Orb } from "../components/Orb";
import { PhraseSeq } from "../components/Phrase";
import { clamp01, drift, ease, lerp, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, FONT } from "../theme";
import { f, MUSIC_LIFT_FRAME, VO } from "../timing";

const LEAD = 3;
const ITEMS: { icon: GlyphName; tile: TileColor; title: string; words: [string, number][]; days: number; unit: string }[] = [
  { icon: "droplet", tile: "blue", title: "Robinet care curge", words: [["Un", 5.41], ["robinet", 5.55], ["care", 5.95], ["curge.", 6.2]], days: 14, unit: "zile" },
  { icon: "hammer", tile: "indigo", title: "Dulap de montat", words: [["Un", 7.01], ["dulap", 7.13], ["de", 7.5], ["montat.", 7.62]], days: 31, unit: "zile" },
  { icon: "roller", tile: "orange", title: "Perete de zugrăvit", words: [["Un", 8.52], ["perete", 8.65], ["de", 9.05], ["zugrăvit.", 9.18]], days: 92, unit: "zile" },
];
const arrive = (i: number) => f(VO.chores[i]) - LEAD;
const END = f(VO.choresEnd);
const DROP = MUSIC_LIFT_FRAME;

const Widget: React.FC<{ i: number; frame: number; w: number; h: number }> = ({ i, frame, w, h }) => {
  const it = ITEMS[i];
  const count = Math.round(1 + (it.days - 1) * ease.outCubic(clamp01((frame - arrive(i) - 6) / 22)));
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: 52,
        background: "linear-gradient(180deg, #ffffff 0%, #f6f7f8 100%)",
        boxShadow: "0 30px 70px rgba(16,30,22,0.14), 0 6px 18px rgba(16,30,22,0.06), inset 0 1px 0 rgba(255,255,255,1)",
        border: "1px solid rgba(16,30,22,0.06)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 36, padding: "0 44px", fontFamily: FONT, fontWeight: BOLD }}>
        <IconTile name={it.icon} color={it.tile} size={h * 0.52} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: h * 0.21, color: "#101613", letterSpacing: "-0.025em" }}>{it.title}</div>
          <div style={{ fontSize: h * 0.13, color: "rgba(16,22,19,0.45)" }}>
            Amânat de <span style={{ color: "#00a856" }}>{count} {it.unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// "Un robinet care curge. Un dulap de montat. Un perete de zugrăvit." … [long pause] → drop
export const S3Chores: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const w = V ? 900 : 860;
  const h = V ? 250 : 240;
  const widgetY = V ? 160 : 120;

  const phrases = ITEMS.map((it, i) => ({
    words: it.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD })),
    out: i < 2 ? arrive(i + 1) - 4 : END + 2,
    breaks: V ? [1] : [],
  }));

  // pause: the last widget folds into three drops of light that melt into one charging orb
  const fold = ease.inOutCubic(clamp01((frame - (END + 2)) / 10));
  const gather = ease.inOutCubic(clamp01((frame - (END + 10)) / 16));
  const charge = clamp01((frame - (END + 10)) / (DROP - END - 10));
  // the orb blooms open and fades as the black iris opens out of it, gone before the phone lands
  const dissolve = ease.inOutCubic(clamp01((frame - (DROP - 15)) / 16));

  const size = 700;
  const cOrb = size / 2;
  const spread = (1 - gather) * 240;
  const pulse = 1 + 0.06 * Math.sin(frame / 2.2) * charge;
  const rr = (34 + 46 * charge) * pulse;
  const blobs = [
    { x: cOrb - spread, y: cOrb, r: rr },
    { x: cOrb, y: cOrb, r: rr },
    { x: cOrb + spread, y: cOrb, r: rr },
  ];

  return (
    <AbsoluteFill>
      <PhraseSeq phrases={phrases} fontSize={V ? 108 : 104} y={V ? -330 : -200} light />

      {ITEMS.map((_, i) => {
        const a = arrive(i);
        const next = i < 2 ? arrive(i + 1) : END + 2;
        if (frame < a - 1 || frame > next + 2) return null;
        const p = pop(frame, a, 14, 140);
        const out = i < 2 ? ease.inCubic(clamp01((frame - (next - 7)) / 7)) : fold;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: L.cx - w / 2,
              top: L.cy + widgetY - h / 2 + drift(frame, 5, 80, i),
              transform: `translateY(${(1 - p) * 90 - out * 70}px) scale(${(0.92 + 0.08 * p) * (1 - 0.4 * out)})`,
              opacity: 1 - out,
            }}
          >
            <Widget i={i} frame={frame} w={w} h={h} />
          </div>
        );
      })}

      {frame >= END + 8 && (
        <div
          style={{
            position: "absolute",
            left: L.cx - size / 2,
            top: L.cy - size / 2,
            width: size,
            height: size,
            transform: `scale(${(0.6 + 0.4 * clamp01((frame - END - 8) / 6)) * (1 + 1.4 * dissolve)})`,
            opacity: 1 - dissolve,
            filter: dissolve > 0 ? `blur(${dissolve * 36}px)` : undefined,
          }}
        >
          <Orb blobs={blobs} size={size} glow={0.6 + 0.6 * charge} />
        </div>
      )}
    </AbsoluteFill>
  );
};
