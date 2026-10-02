import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { textWidth } from "../components/AppleText";
import { IconTile } from "../components/Icons";
import { INK, KineticText, SHADOW } from "../components/KineticText";
import { ACCENT_LIGHT, PhraseSeq } from "../components/Phrase";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease, lerp } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, FONT } from "../theme";
import { f, VO } from "../timing";

/**
 * Problem half, SaaS-explainer style on a clean light set:
 *   kinetic phrases → one smooth camera move onto a single piece of UI: a reminder that keeps getting
 *   snoozed (a tap on "Amână" on every syllable of "pe care o tot amâni?", the snoozed copies piling up
 *   behind it) → the reminder morphs into a "Treburi amânate" list whose rows arrive as they are said,
 *   the camera gliding row to row → the card collapses to the centre, where the handly logo takes over.
 */

const LEAD = 3;
const hw = (i: number) => f(VO.hook[i][1]) - LEAD;
const TAPS = VO.postponeSyllables.map((s) => f(s) - 1);
const WHEN = ["Azi, 18:00", "Mâine", "Joi", "Weekendul ăsta", "Săptămâna viitoare", "Luna viitoare", "Cândva…"];
const CHORES = [
  { icon: "droplet", tile: "blue", words: [["Robinet", 5.55], ["care", 5.95], ["curge", 6.2]] as [string, number][], days: 14 },
  { icon: "hammer", tile: "indigo", words: [["Dulap", 7.13], ["de", 7.5], ["montat", 7.62]] as [string, number][], days: 31 },
  { icon: "roller", tile: "orange", words: [["Perete", 8.65], ["de", 9.05], ["zugrăvit", 9.18]] as [string, number][], days: 92 },
] as const;
const arrive = (i: number) => f(VO.chores[i]) - LEAD;
const END = f(VO.choresEnd);
const PAN = f(VO.hookEnd) - 8;
const LIST0 = f(VO.postponeEnd) + 1;

const INK_C = "#0c1511";
const SOFT = "rgba(12,21,17,0.45)";

/** quiet light set: soft white bloom, faint grid that drifts a little with the camera */
const LightSet: React.FC<{ shift: number }> = ({ shift }) => {
  const L = useLayout();
  const cell = L.vertical ? 90 : 96;
  const grid = "rgba(16,40,28,0.05)";
  const mask = `radial-gradient(ellipse ${L.vertical ? "95% 60%" : "70% 85%"} at 50% 50%, #000 30%, transparent 100%)`;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 42%, #ffffff 0%, #f4f6f5 62%, #eceeed 100%)" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${grid} 1.5px, transparent 1.5px), linear-gradient(90deg, ${grid} 1.5px, transparent 1.5px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${(L.W / 2 - shift) % cell}px ${(L.H / 2) % cell}px`,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
    </AbsoluteFill>
  );
};

/** iOS-style touch indicator that lands, presses and lifts at `at` */
const Touch: React.FC<{ frame: number; at: number; x: number; y: number }> = ({ frame, at, x, y }) => {
  const t = frame - at;
  if (t < -5 || t > 8) return null;
  const inA = ease.outCubic(clamp01((t + 5) / 4));
  const outA = 1 - ease.inCubic(clamp01((t - 3) / 5));
  const press = t >= 0 && t < 4 ? 1 - 0.16 * Math.sin((t / 4) * Math.PI) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 34,
        top: y - 34,
        width: 68,
        height: 68,
        borderRadius: "50%",
        background: "rgba(12,21,17,0.16)",
        border: "2.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 8px 20px rgba(12,21,17,0.15)",
        opacity: inA * outA,
        transform: `scale(${(0.8 + 0.2 * inA) * press})`,
      }}
    />
  );
};

/** a word that rolls in from below when it changes (for the snooze time) */
const Roll: React.FC<{ frame: number; values: string[]; changes: number[]; style?: React.CSSProperties }> = ({ frame, values, changes, style }) => {
  const k = changes.filter((c) => frame >= c).length;
  const p = k ? ease.outCubic(clamp01((frame - changes[k - 1]) / 6)) : 1;
  return (
    <span style={{ position: "relative", display: "inline-block", overflow: "hidden", verticalAlign: "bottom", ...style }}>
      <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 100}%)`, opacity: p }}>{values[Math.min(values.length - 1, k)]}</span>
      {k > 0 && p < 1 && <span style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${-p * 100}%)`, opacity: 1 - p }}>{values[k - 1]}</span>}
    </span>
  );
};

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const FS = V ? 112 : 136;

  // ---------------------------------------------------------------- intro phrases + one camera move onto the UI
  const push = 1 + 0.05 * ease.inOutCubic(clamp01(frame / 118));
  const SPAN = L.W * 1.1;
  const panAt = (fr: number) => ease.inOutCubic(clamp01((fr - PAN) / 16));
  const pan = panAt(frame);
  const panBlur = Math.min(40, Math.abs(pan - panAt(frame - 1)) * SPAN * 0.18);
  const casaIn = hw(7);
  const casaOut = PAN + 30;
  const casaK = 1 - ease.outExpo(clamp01((frame - (casaIn - 1)) / 12));
  const casaT = clamp01((frame - casaOut) / 7);
  const casaW = textWidth("prin casă", FS, -0.04);

  // ---------------------------------------------------------------- the card: reminder → list
  const NW = V ? 900 : 900;
  const NH = V ? 196 : 196;
  const LW = V ? 940 : 1000;
  const LH = V ? 820 : 600;
  const toList = ease.inOutCubic(clamp01((frame - LIST0) / 14));
  const w = lerp(NW, LW, toList);
  const h = lerp(NH, LH, toList);
  const cardY = lerp(V ? 60 : 50, 0, toList);
  const collapse = ease.inOutCubic(clamp01((frame - (END - 2)) / 12));
  const taps = TAPS.filter((t) => frame >= t).length;
  const notifIn = ease.outExpo(clamp01((frame - (PAN + 6)) / 18));

  // list rows + camera gliding row to row
  const rowY = (i: number) => -LH / 2 + (V ? 230 : 180) + i * (V ? 190 : 132);
  type Cam = { s: number; y: number };
  const Z = V ? 1.08 : 1.45;
  const camAt = (fr: number): Cam => {
    const c = { s: 1, y: 0 };
    const moves: [number, number, Cam][] = [
      [arrive(0) - 2, 12, { s: Z, y: rowY(0) }],
      [arrive(1) - 6, 10, { s: Z, y: rowY(1) }],
      [arrive(2) - 6, 10, { s: Z, y: rowY(2) }],
      [END - 10, 12, { s: 1, y: 0 }],
    ];
    for (const [st, d, to] of moves) {
      const e = ease.inOutCubic(clamp01((fr - st) / d));
      c.s = lerp(c.s, to.s, e);
      c.y = lerp(c.y, to.y, e);
    }
    return c;
  };
  const cam = camAt(frame);
  const camBlur = Math.min(24, Math.abs(cam.y - camAt(frame - 1).y) * cam.s * 0.3);

  const amana = { x: NW / 2 - (V ? 120 : 108), y: 0 };

  const notification = (depth: number, label: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: -NW / 2,
        top: -NH / 2,
        width: NW,
        height: NH,
        borderRadius: 38,
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 30px 60px rgba(16,40,28,0.12), 0 6px 16px rgba(16,40,28,0.06), inset 0 0 0 1px rgba(16,40,28,0.05)",
        transform: `translateY(${-depth * (V ? 34 : 30)}px) scale(${1 - depth * 0.06})`,
        opacity: depth === 0 ? 1 : Math.max(0, 1 - depth * 0.25),
        fontFamily: FONT,
        fontWeight: BOLD,
        display: "flex",
        alignItems: "center",
        gap: V ? 28 : 24,
        padding: `0 ${V ? 34 : 30}px`,
        boxSizing: "border-box",
      }}
    >
      <IconTile name="bell" color="green" size={NH * 0.46} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: NH * 0.12, color: SOFT, letterSpacing: "0.06em" }}>
          <span>MEMENTO</span>
          <span style={{ letterSpacing: 0 }}>acum</span>
        </div>
        <div style={{ fontSize: NH * 0.19, color: INK_C, letterSpacing: "-0.02em" }}>Treaba aia de prin casă</div>
        <div style={{ fontSize: NH * 0.13, color: SOFT }}>
          Programat:{" "}
          {depth === 0 ? (
            <Roll frame={frame} values={WHEN} changes={TAPS} style={{ color: "#00a352" }} />
          ) : (
            <span style={{ color: "#00a352" }}>{WHEN[label]}</span>
          )}
        </div>
      </div>
      <div
        style={{
          padding: `${NH * 0.07}px ${NH * 0.14}px`,
          borderRadius: 999,
          background: "#eef2ef",
          fontSize: NH * 0.12,
          color: INK_C,
          transform: `scale(${TAPS.some((t) => frame >= t && frame < t + 4) ? 0.92 : 1})`,
        }}
      >
        Amână
      </div>
    </div>
  );

  const listIn = ease.outCubic(clamp01((frame - (LIST0 + 8)) / 9));
  const list = (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, opacity: listIn, fontFamily: FONT, fontWeight: BOLD }}>
      <div style={{ position: "absolute", left: 48, right: 48, top: V ? 70 : 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: V ? 46 : 40, color: INK_C, letterSpacing: "-0.03em" }}>Treburi amânate</div>
        <div style={{ padding: "6px 16px", borderRadius: 999, background: "#eef2ef", color: SOFT, fontSize: V ? 26 : 22 }}>{CHORES.filter((_, i) => frame >= arrive(i) - 4).length}</div>
      </div>
      <div style={{ position: "absolute", left: 48, right: 48, top: V ? 150 : 120, height: 2, background: "rgba(16,40,28,0.06)" }} />
      {CHORES.map((c, i) => {
        const a = arrive(i);
        const rin = ease.outExpo(clamp01((frame - (a - 4)) / 14));
        if (rin <= 0) return null;
        const y = rowY(i) + h / 2;
        const count = Math.round(1 + (c.days - 1) * ease.outCubic(clamp01((frame - a - 8) / 20)));
        const RH = V ? 150 : 108;
        return (
          <div key={i} style={{ position: "absolute", left: 32, right: 32, top: y - RH / 2, height: RH, borderRadius: 24, background: frame < (i < 2 ? arrive(i + 1) - 4 : END) ? "rgba(0,163,82,0.05)" : "rgba(0,0,0,0)", opacity: rin, transform: `translateY(${(1 - rin) * 40}px)`, display: "flex", alignItems: "center", gap: V ? 28 : 24, padding: "0 18px" }}>
            <IconTile name={c.icon} color={c.tile} size={RH * 0.62} />
            <div style={{ flex: 1 }}>
              <KineticText words={c.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={V ? 50 : 40} ink={INK} tint={ACCENT_LIGHT} shadow="none" style={{ letterSpacing: "-0.03em", alignItems: "flex-start" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: "#f5eeee", color: "#b54a42", fontSize: V ? 26 : 22, opacity: ease.outCubic(clamp01((frame - a - 8) / 8)) }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#e5554b" }} />
              Amânat {count} zile
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill>
      <LightSet shift={pan * SPAN * 0.3} />
      <DirBlur x={panBlur} style={{ position: "absolute", inset: 0 }}>
        {/* intro phrases */}
        {pan < 1 && (
          <AbsoluteFill style={{ transform: `translateX(${-pan * SPAN}px) scale(${push})` }}>
            <PhraseSeq
              light
              fontSize={FS}
              phrases={[
                { words: [0, 1, 2].map((i) => ({ text: VO.hook[i][0], at: hw(i) })), out: hw(3) - 5, breaks: V ? [1] : [] },
                { words: [3, 4, 5].map((i) => ({ text: VO.hook[i][0], at: hw(i) })), out: hw(6) - 5 },
                { words: [{ text: VO.hook[6][0], at: hw(6), color: ACCENT_LIGHT }], out: hw(7) - 6 },
              ]}
            />
            {frame >= casaIn - 1 && casaT < 1 && (
              <AbsoluteFill
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  transform: `scale(${(1 + 0.12 * casaK) * (1 - 0.1 * ease.inCubic(casaT))})`,
                  opacity: 1 - ease.inCubic(casaT),
                  filter: casaT > 0 ? `blur(${20 * casaT}px)` : undefined,
                }}
              >
                <div style={{ position: "relative" }}>
                  <KineticText words={[{ text: "prin", at: casaIn }, { text: "casă", at: hw(8) }]} fontSize={FS} ink={INK} tint={ACCENT_LIGHT} shadow={SHADOW} style={{ letterSpacing: "-0.04em" }} />
                  <div style={{ position: "absolute", left: casaW + FS * 0.08, bottom: FS * 0.26, display: "flex", gap: FS * 0.1 }}>
                    {[0, 1, 2].map((d) => {
                      const local = frame - (hw(8) + 8) - d * 3;
                      const a = ease.outCubic(clamp01(local / 6));
                      const hop = local > 4 ? Math.max(0, Math.sin(((local - 4) / 15) * Math.PI * 2)) : 0;
                      return <div key={d} style={{ width: FS * 0.12, height: FS * 0.12, borderRadius: "50%", background: "linear-gradient(180deg, #34463d, #050a07)", opacity: a, transform: `translateY(${-hop * FS * 0.2}px) scale(${0.3 + 0.7 * a})` }} />;
                    })}
                  </div>
                </div>
              </AbsoluteFill>
            )}
          </AbsoluteFill>
        )}

        {/* the UI, arriving with the camera */}
        {pan > 0 && collapse < 1 && (
          <AbsoluteFill style={{ transform: `translateX(${(1 - pan) * SPAN}px)` }}>
            <PhraseSeq
              light
              fontSize={V ? 84 : 76}
              y={V ? -330 : -250}
              phrases={[{ words: VO.postpone.map(([text, sec]) => ({ text, at: f(sec) - LEAD, color: text.startsWith("amâni") ? ACCENT_LIGHT : undefined })), out: LIST0 - 6 }]}
            />
            <DirBlur y={camBlur} style={{ position: "absolute", inset: 0, opacity: 1 - collapse, filter: collapse > 0 ? `blur(${collapse * 14}px)` : undefined }}>
              <div style={{ position: "absolute", left: L.cx, top: L.cy + cardY, transform: `scale(${cam.s * (1 - 0.85 * collapse) * (0.92 + 0.08 * notifIn)}) translateY(${-cam.y}px)`, opacity: notifIn }}>
                {/* snoozed copies stacking up behind */}
                {toList < 1 &&
                  Array.from({ length: Math.min(4, taps) }, (_, k) => {
                    const depth = Math.min(4, taps) - k;
                    const settle = ease.outCubic(clamp01((frame - TAPS[taps - depth]) / 7));
                    return <div key={k} style={{ opacity: 1 - toList }}>{notification(depth - 1 + settle, taps - depth, `b${k}`)}</div>;
                  })}
                {/* the card itself: a reminder that morphs into the list */}
                <div
                  style={{
                    position: "absolute",
                    left: -w / 2,
                    top: -h / 2,
                    width: w,
                    height: h,
                    borderRadius: lerp(38, 40, toList),
                    background: "rgba(255,255,255,0.97)",
                    boxShadow: "0 40px 80px rgba(16,40,28,0.12), 0 8px 20px rgba(16,40,28,0.06), inset 0 0 0 1px rgba(16,40,28,0.05)",
                  }}
                />
                {toList < 1 && <div style={{ opacity: 1 - ease.inCubic(clamp01((frame - LIST0) / 6)) }}>{notification(0, 0, "front")}</div>}
                {toList > 0 && list}
                {toList < 1 && TAPS.map((t, k) => <Touch key={k} frame={frame} at={t} x={amana.x} y={amana.y} />)}
              </div>
            </DirBlur>
          </AbsoluteFill>
        )}
      </DirBlur>
    </AbsoluteFill>
  );
};
