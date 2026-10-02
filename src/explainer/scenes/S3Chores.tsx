import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Glyph, GlyphName, IconTile, TileColor } from "../components/Icons";
import { KineticText } from "../components/KineticText";
import { Pill } from "../components/Pill";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { C } from "../theme";
import { f, VO } from "../timing";

const LEAD = 3;

const ITEMS: { icon: GlyphName; tile: TileColor; words: [string, number][]; tag: string }[] = [
  { icon: "droplet", tile: "blue", words: [["Robinet", 4.95], ["care", 5.4], ["curge", 5.74]], tag: "de 2 săptămâni" },
  { icon: "hammer", tile: "indigo", words: [["Dulap", 6.62], ["de", 6.98], ["montat", 7.08]], tag: "de o lună" },
  { icon: "roller", tile: "orange", words: [["Perete", 8.24], ["de", 8.62], ["zugrăvit", 8.74]], tag: "din primăvară" },
];

const Item: React.FC<{ index: number; frame: number; y: number; vertical: boolean }> = ({ index, frame, y, vertical }) => {
  const item = ITEMS[index];
  const start = f(VO.chores[index]) - LEAD;
  const box = pop(frame, start);
  const lastWord = f(item.words[item.words.length - 1][1]);
  const tag = pop(frame, lastWord + 7, 12, 150);
  const fs = vertical ? 66 : 60;

  const tagPill = (
    <div style={{ transform: `scale(${tag})`, transformOrigin: "0% 50%", opacity: clamp01(tag * 2) }}>
      <Pill
        icon={<Glyph name="clock" size={vertical ? 30 : 28} color={C.inkSoft} weight={2.4} />}
        label={item.tag}
        size={vertical ? 30 : 28}
        style={{ background: "rgba(255,255,255,0.78)", boxShadow: "0 6px 18px rgba(20,24,22,0.08)", color: C.inkSoft }}
      />
    </div>
  );

  return (
    <div style={{ position: "absolute", left: 0, top: y, display: "flex", alignItems: vertical ? "flex-start" : "center", gap: 28, height: vertical ? undefined : 84 }}>
      <div style={{ width: 54, height: 54, marginTop: vertical ? 13 : 0, borderRadius: "50%", border: "3.5px solid #b3bbb6", transform: `scale(${box})`, flexShrink: 0 }} />
      <IconTile name={item.icon} color={item.tile} size={vertical ? 80 : 74} style={{ transform: `scale(${box}) rotate(${(1 - box) * -20}deg)` }} />
      {vertical ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
          <KineticText words={item.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={fs} />
          {tagPill}
        </div>
      ) : (
        <>
          <KineticText words={item.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={fs} />
          <div style={{ marginLeft: 6 }}>{tagPill}</div>
        </>
      )}
    </div>
  );
};

// "Un robinet care curge. Un dulap de montat. Un perete de zugrăvit."
export const S3Chores: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const enter = 147;
  const exitStart = 291;

  const ROW_Y0 = L.vertical ? 140 : 120;
  const ROW_GAP = L.vertical ? 210 : 128;
  const rowY = (i: number) => ROW_Y0 + i * ROW_GAP;
  const focus = (i: number) => rowY(i) + (L.vertical ? 70 : 40);

  // camera: close on each chore as it's named, then pull back to the whole pile-up
  const camY = keys(frame, [
    [enter, focus(0)],
    [f(VO.chores[1]) - 8, focus(0)],
    [f(VO.chores[1]) + 4, focus(1)],
    [f(VO.chores[2]) - 8, focus(1)],
    [f(VO.chores[2]) + 4, focus(2)],
    [f(VO.chores[2]) + 19, focus(2)],
    [exitStart - 2, L.vertical ? 330 : 250],
  ], ease.inOutCubic);
  const camX = keys(frame, [
    [enter, L.vertical ? 420 : 380],
    [f(VO.chores[2]) + 19, L.vertical ? 440 : 430],
    [exitStart - 2, L.vertical ? 445 : 490],
  ], ease.inOutCubic);
  const scale = keys(frame, [
    [enter, L.vertical ? 1.15 : 1.42],
    [f(VO.chores[2]) + 19, L.vertical ? 1.13 : 1.36],
    [exitStart - 2, L.vertical ? 1.08 : 1.0],
  ], ease.inOutCubic);

  // enter: emerges out of a soft focus pull as the calendar dissolves (premium zoom-through)
  const inT = ease.outCubic(clamp01((frame - enter) / 13));
  const inScale = 0.84 + 0.16 * inT;
  const inBlur = (1 - inT) * 22;

  const exitX = -L.W * 1.05 * ease.inExpo(clamp01((frame - exitStart) / 10));
  const exitXPrev = -L.W * 1.05 * ease.inExpo(clamp01((frame - 1 - exitStart) / 10));

  return (
    <AbsoluteFill style={{ opacity: clamp01((frame - enter) / 6) }}>
      <DirBlur
        x={Math.abs(exitX - exitXPrev) * 0.4}
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${exitX}px) scale(${inScale})`,
          filter: inBlur > 0.3 ? `blur(${inBlur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `scale(${scale}) translate(${-camX + drift(frame, 4, 170)}px, ${-camY + drift(frame, 3, 210, 1)}px)`,
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <KineticText
              words={[{ text: "De", at: enter + 2 }, { text: "făcut", at: enter + 4 }, { text: "prin", at: enter + 6 }, { text: "casă", at: enter + 8 }]}
              fontSize={L.vertical ? 50 : 44}
            />
            {ITEMS.map((_, i) => (frame >= f(VO.chores[i]) - LEAD - 1 ? <Item key={i} index={i} frame={frame} y={rowY(i)} vertical={L.vertical} /> : null))}
          </div>
        </div>
      </DirBlur>
    </AbsoluteFill>
  );
};
