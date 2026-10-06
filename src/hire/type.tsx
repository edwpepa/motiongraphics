import React from "react";
import { FONT, MONO, clamp01, ease, hash, useT } from "../edw/kit";
import WORDS from "./vo-words.json";

type Phrase = { start: number; end: number; text: string; words: [string, number][] };
export const VO = WORDS as unknown as Record<string, Phrase>;
/** onset (s) of word i of phrase `key` on the hiring timeline */
export const w = (key: string, i = 0) => VO[key].words[Math.min(i, VO[key].words.length - 1)][1];

/**
 * Big centre line: each word rises out of its own mask, staggered; a chosen word can be boxed (inverted,
 * the box wiping in behind it) or struck through. Leaves by lifting away and fading.
 */
export const Big: React.FC<{
  text: string;
  at: number;
  out: number;
  size?: number;
  y?: number;
  weight?: number;
  box?: number;
  boxAt?: number;
  strike?: number;
  strikeAt?: number;
  dim?: number;
  tracking?: string;
  color?: string;
}> = ({ text, at, out, size = 120, y = 540, weight = 800, box, boxAt, strike, strikeAt, dim, tracking = "-0.035em", color = "#f4f5f7" }) => {
  const t = useT();
  if (t < at - 0.05 || t > out + 0.3) return null;
  const words = text.split(" ");
  const leave = ease.inCubic(clamp01((t - out) / 0.26));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        transform: `translateY(-50%) translateY(${-leave * 40}px)`,
        display: "flex",
        justifyContent: "center",
        flexWrap: "nowrap",
        gap: size * 0.26,
        opacity: 1 - leave,
        filter: `blur(${leave * 10}px)`,
      }}
    >
      {words.map((wd, i) => {
        const u = ease.outExpo(clamp01((t - at - i * 0.07) / 0.7));
        const isBox = box === i;
        const bu = isBox ? ease.outExpo(clamp01((t - (boxAt ?? at + 0.3)) / 0.5)) : 0;
        const su = strike === i || strike === -1 ? ease.inOut(clamp01((t - (strikeAt ?? at + 0.4)) / 0.45)) : 0;
        return (
          <div key={i} style={{ position: "relative", overflow: "hidden", padding: `${size * 0.04}px ${isBox ? size * 0.12 : 0}px`, lineHeight: 1 }}>
            {isBox && <div style={{ position: "absolute", inset: 0, background: "#f4f5f7", transform: `scaleX(${bu})`, transformOrigin: "left" }} />}
            <div
              style={{
                position: "relative",
                fontFamily: FONT,
                fontWeight: weight,
                fontSize: size,
                letterSpacing: tracking,
                color: isBox && bu > 0.5 ? "#050506" : color,
                opacity: dim !== undefined && i !== box ? dim : 1,
                transform: `translateY(${(1 - u) * 110}%)`,
                whiteSpace: "nowrap",
              }}
            >
              {wd}
            </div>
            {su > 0 && <div style={{ position: "absolute", left: 0, top: "52%", height: Math.max(3, size * 0.06), width: `${su * 100}%`, background: "#f4f5f7" }} />}
          </div>
        );
      })}
    </div>
  );
};

/** small mono label in brackets, typed on */
export const Kicker: React.FC<{ text: string; at: number; out: number; y?: number; size?: number; opacity?: number }> = ({ text, at, out, y = 540, size = 20, opacity = 0.75 }) => {
  const t = useT();
  if (t < at || t > out + 0.4) return null;
  const n = Math.floor(clamp01((t - at) / 0.5) * text.length);
  const o = 1 - clamp01((t - out) / 0.35);
  const shown = text
    .split("")
    .map((ch, i) => (i < n ? ch : i < n + 3 && ch !== " " ? "_/#%"[Math.floor(hash(i + Math.floor(t * 20)) * 4)] : " "))
    .join("");
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", opacity: o * opacity }}>
      <div style={{ fontFamily: MONO, fontSize: size, letterSpacing: "0.32em", color: "#e8eaee", whiteSpace: "pre", marginRight: "-0.32em" }}>{shown}</div>
    </div>
  );
};

/** a number that scrambles into place */
export const Decode: React.FC<{ text: string; at: number; out: number; y?: number; size?: number }> = ({ text, at, out, y = 540, size = 160 }) => {
  const t = useT();
  if (t < at || t > out + 0.4) return null;
  const o = clamp01((t - at) / 0.15) * (1 - clamp01((t - out) / 0.35));
  const settled = clamp01((t - at) / 0.9);
  const shown = text
    .split("")
    .map((ch, i) => (i / text.length < settled || !/[0-9A-Z]/.test(ch) ? ch : "0123456789"[Math.floor(hash(i * 7 + Math.floor(t * 24)) * 10)]))
    .join("");
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: "-0.04em", color: "#f4f5f7", fontVariantNumeric: "tabular-nums" }}>{shown}</div>
    </div>
  );
};
