import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { textWidth } from "../components/AppleText";
import { HeroOrb } from "../components/HeroOrb";
import { INK, KineticText, SHADOW } from "../components/KineticText";
import { Particles } from "../components/Particles";
import { ACCENT_LIGHT, PhraseSeq } from "../components/Phrase";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease, lerp, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, FONT } from "../theme";
import { f, MUSIC_LIFT_FRAME, VO } from "../timing";

/**
 * Problem half on a clean white set (slow white-green gradient + quiet grid):
 *   big kinetic phrases (same animation as "Postezi.") → a paper planner rises in and its pages keep
 *   flipping to the next day on every syllable of "pe care o tot amâni?" → it flips to a page per
 *   chore while the camera leans in on the line being written → the planner slips away, the green
 *   orb appears and pulls every particle in, charges, and bursts into the dark half on the drop.
 */

const LEAD = 3;
const hw = (i: number) => f(VO.hook[i][1]) - LEAD;
const DROP = MUSIC_LIFT_FRAME;
const HOPS = VO.postponeSyllables.map((s) => f(s) - 1);
const CHORES = [
  { words: [["Robinet", 5.55], ["care", 5.95], ["curge", 6.2]] as [string, number][], days: 14, day: "Joi", date: 24, month: "Octombrie" },
  { words: [["Dulap", 7.13], ["de", 7.5], ["montat", 7.62]] as [string, number][], days: 31, day: "Luni", date: 10, month: "Noiembrie" },
  { words: [["Perete", 8.65], ["de", 9.05], ["zugrăvit", 9.18]] as [string, number][], days: 92, day: "Vineri", date: 23, month: "Ianuarie" },
];
const arrive = (i: number) => f(VO.chores[i]) - LEAD;
const END = f(VO.choresEnd);
const FLY = END + 4;
const PLAN_IN = f(VO.hookEnd) - 6;
const FD = 9; // page-flip duration
const DAYS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

type Page = { day: string; date: number; month: string; chore?: number };
const PAGES: Page[] = [
  ...Array.from({ length: HOPS.length + 1 }, (_, i) => ({ day: DAYS[(i + 1) % 7], date: 14 + i, month: "Octombrie" })),
  ...CHORES.map((c, i) => ({ day: c.day, date: c.date, month: c.month, chore: i })),
];
const FLIPS = [...HOPS, ...CHORES.map((_, i) => arrive(i) - 7)];

/** white set: a slow white-green gradient of soft shapes under a simple grid */
const WhiteSet: React.FC<{ frame: number }> = ({ frame }) => {
  const L = useLayout();
  const t = frame / 30;
  const M = Math.max(L.W, L.H);
  const blobs = [
    { x: 0.2 + 0.08 * Math.sin(t / 2.3), y: 0.25 + 0.06 * Math.cos(t / 2.9), r: 0.42, c: "rgba(0,200,110,0.16)" },
    { x: 0.82 + 0.06 * Math.cos(t / 2.1), y: 0.7 + 0.07 * Math.sin(t / 2.5), r: 0.46, c: "rgba(60,220,160,0.14)" },
    { x: 0.6 + 0.07 * Math.sin(t / 3.1 + 1), y: 0.1 + 0.05 * Math.cos(t / 2.2), r: 0.3, c: "rgba(190,255,120,0.14)" },
  ];
  const grid = "rgba(16,40,28,0.06)";
  const cell = L.vertical ? 90 : 96;
  const mask = `radial-gradient(ellipse ${L.vertical ? "95% 60%" : "70% 85%"} at 50% 50%, #000 30%, transparent 100%)`;
  return (
    <AbsoluteFill style={{ background: "#f7f9f8", overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x * L.W - b.r * M, top: b.y * L.H - b.r * M, width: b.r * M * 2, height: b.r * M * 2, borderRadius: "50%", background: `radial-gradient(circle, ${b.c} 0%, rgba(255,255,255,0) 68%)` }} />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${grid} 1.5px, transparent 1.5px), linear-gradient(90deg, ${grid} 1.5px, transparent 1.5px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${(L.W / 2) % cell}px ${(L.H / 2) % cell}px`,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
    </AbsoluteFill>
  );
};

/** one planner page (right-hand side) */
const PageFace: React.FC<{ page: Page; w: number; h: number; frame: number; live: boolean }> = ({ page, w, h, frame, live }) => {
  const c = page.chore !== undefined ? CHORES[page.chore] : null;
  const a = c ? arrive(page.chore!) : 0;
  const count = c ? Math.round(1 + (c.days - 1) * ease.outCubic(clamp01((frame - a - 12) / 22))) : 0;
  const sub = c ? ease.outCubic(clamp01((frame - a - 12) / 10)) : 1;
  const pad = w * 0.11;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, fontWeight: BOLD, color: "#0c1511", overflow: "hidden", borderRadius: "4px 18px 18px 4px", background: "linear-gradient(90deg, #ecefed 0%, #fbfcfb 7%, #ffffff 100%)" }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: pad, right: pad, top: h * 0.42 + i * h * 0.068, height: 2, background: "rgba(16,40,28,0.06)" }} />
      ))}
      <div style={{ position: "absolute", left: pad, top: h * 0.07, fontSize: w * 0.04, letterSpacing: "0.12em", color: "rgba(12,21,17,0.4)" }}>{page.day.toUpperCase()}</div>
      <div style={{ position: "absolute", left: pad - w * 0.01, top: h * 0.1, fontSize: w * 0.26, letterSpacing: "-0.05em", lineHeight: 1 }}>{page.date}</div>
      <div style={{ position: "absolute", left: pad, top: h * 0.3, fontSize: w * 0.05, color: "#00a352", letterSpacing: "-0.01em" }}>{page.month}</div>
      <div style={{ position: "absolute", left: pad, top: h * 0.445, width: w * 0.075, height: w * 0.075, borderRadius: "50%", border: `${Math.max(3, w * 0.007)}px solid rgba(12,21,17,0.25)`, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: pad + w * 0.11, top: h * 0.43 }}>
        {c ? (
          live ? (
            <KineticText words={c.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={w * 0.085} ink={INK} tint={ACCENT_LIGHT} shadow="none" style={{ letterSpacing: "-0.035em", alignItems: "flex-start" }} />
          ) : (
            <div style={{ fontSize: w * 0.085, letterSpacing: "-0.035em", lineHeight: 1.22 }}>{c.words.map(([t]) => t).join(" ")}</div>
          )
        ) : (
          <div style={{ fontSize: w * 0.085, letterSpacing: "-0.035em", lineHeight: 1.22, color: "rgba(12,21,17,0.8)" }}>Treaba aia</div>
        )}
      </div>
      <div style={{ position: "absolute", left: pad + w * 0.11, top: h * 0.43 + w * 0.12, fontSize: w * 0.042, color: "rgba(12,21,17,0.42)", opacity: sub }}>
        {c ? (
          <>
            Amânat de <span style={{ color: "#00a352" }}>{count} zile</span>
          </>
        ) : (
          "Mutat pe mâine"
        )}
      </div>
    </div>
  );
};

/** the left-hand page: blank, with a few faint ruled lines */
const LeftFace: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div style={{ position: "absolute", inset: 0, borderRadius: "18px 4px 4px 18px", background: "linear-gradient(270deg, #e9ecea 0%, #f9faf9 8%, #ffffff 100%)", overflow: "hidden" }}>
    {Array.from({ length: 9 }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: w * 0.11, right: w * 0.11, top: h * 0.42 + i * h * 0.068, height: 2, background: "rgba(16,40,28,0.05)" }} />
    ))}
  </div>
);

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const FS = V ? 112 : 136;

  // ---------------------------------------------------------------- intro: a slow push-in over the phrases
  const push = 1 + 0.06 * ease.inOutCubic(clamp01(frame / 118));
  const casaIn = hw(7);
  const casaOut = f(VO.hookEnd) - 6;
  const casaK = 1 - ease.outExpo(clamp01((frame - (casaIn - 1)) / 12));
  const casaT = clamp01((frame - casaOut) / 7);
  const casaW = textWidth("prin casă", FS, -0.04);

  // ---------------------------------------------------------------- planner
  const PGW = V ? 520 : 560;
  const PGH = V ? 740 : 700;
  const planIn = ease.outExpo(clamp01((frame - PLAN_IN) / 22));
  const planOut = ease.inOutCubic(clamp01((frame - (END + 2)) / 12));
  const flipsDone = FLIPS.filter((s) => frame >= s + FD).length;
  const current = Math.min(PAGES.length - 1, FLIPS.filter((s) => frame >= s).length);

  // camera: whole spread → lean in on the line being written for each chore → back out to flip
  type Cam = { s: number; x: number; y: number };
  const base: Cam = V ? { s: 1.5, x: PGW / 2, y: 0 } : { s: 1, x: 0, y: 0 };
  const lean: Cam = V ? { s: 1.95, x: PGW * 0.5, y: -PGH * 0.02 } : { s: 1.55, x: PGW * 0.46, y: -PGH * 0.02 };
  const camAt = (fr: number): Cam => {
    const c = { ...base };
    CHORES.forEach((_, i) => {
      const a = arrive(i);
      const into = ease.inOutCubic(clamp01((fr - (a + 1)) / 12));
      const back = ease.inOutCubic(clamp01((fr - ((i < 2 ? arrive(i + 1) : END + 2) - 11)) / 9));
      const k = into * (1 - back);
      c.s = lerp(c.s, lean.s, k);
      c.x = lerp(c.x, lean.x, k);
      c.y = lerp(c.y, lean.y, k);
    });
    return c;
  };
  const cam = camAt(frame);
  const camPrev = camAt(frame - 1);
  const camBlur = Math.min(24, Math.hypot(cam.x - camPrev.x, cam.y - camPrev.y) * cam.s * 0.25 + Math.abs(cam.s - camPrev.s) * 120);

  // ---------------------------------------------------------------- the orb pulls everything in, charges and bursts
  const pull = clamp01((frame - (END - 2)) / (DROP - END));
  const charge = ease.inCubic(clamp01((frame - FLY) / (DROP - FLY)));
  const OS = V ? 150 : 140;
  const core = pop(frame, FLY, 12, 140) * (1 + 0.45 * charge + 0.07 * Math.sin(frame / 1.8) * charge) * (1 - 0.35 * ease.inCubic(clamp01((frame - (DROP - 6)) / 6)));
  const gone = clamp01((frame - (DROP + 1)) / 6);

  return (
    <AbsoluteFill style={gone > 0 ? { opacity: 1 - gone } : undefined}>
      <WhiteSet frame={frame} />
      <Particles frame={frame} pull={pull} opacity={0.35 + 0.5 * pull} />

      {/* intro phrases */}
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
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
              {/* … as three dots hopping in a wave */}
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

      {/* "pe care o tot amâni?" above the planner */}
      <PhraseSeq
        light
        fontSize={V ? 84 : 78}
        y={V ? -720 : -430}
        phrases={[{ words: VO.postpone.map(([text, sec]) => ({ text, at: f(sec) - LEAD, color: text.startsWith("amâni") ? ACCENT_LIGHT : undefined })), out: arrive(0) - 12 }]}
      />

      {/* the planner */}
      {planIn > 0 && planOut < 1 && (
        <DirBlur x={camBlur} style={{ position: "absolute", inset: 0, opacity: 1 - planOut, filter: planOut > 0 ? `blur(${planOut * 20}px)` : undefined }}>
          <div
            style={{
              position: "absolute",
              left: L.cx,
              top: L.cy + (V ? 90 : 70),
              perspective: 2600,
              transform: `translateY(${(1 - planIn) * L.H * 0.7}px) scale(${(0.9 + 0.1 * planIn) * (1 - 0.3 * planOut)})`,
            }}
          >
            <div style={{ transformStyle: "preserve-3d", transform: `scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px) rotateX(${lerp(38, 12, planIn) * (1 - 0.6 * clamp01((cam.s - base.s) / (lean.s - base.s)))}deg)` }}>
              {/* cover + page-block edges */}
              <div style={{ position: "absolute", left: -PGW - 26, top: -PGH / 2 - 22, width: PGW * 2 + 52, height: PGH + 44, borderRadius: 26, background: "linear-gradient(180deg, #13734a 0%, #0a4f32 100%)", boxShadow: "0 50px 90px rgba(10,50,30,0.28), 0 12px 24px rgba(10,50,30,0.16), inset 0 1px 0 rgba(255,255,255,0.18)" }} />
              {[3, 2, 1].map((k) => (
                <div key={k} style={{ position: "absolute", left: -PGW - 6 + k * 2, top: -PGH / 2 - 6 + k * 2, width: PGW * 2 + 12 - k * 4, height: PGH + 12 - k * 2, borderRadius: 18, background: k % 2 ? "#e7ebe9" : "#f4f6f5" }} />
              ))}
              {/* left page */}
              <div style={{ position: "absolute", left: -PGW, top: -PGH / 2, width: PGW, height: PGH }}>
                <LeftFace w={PGW} h={PGH} />
              </div>
              {/* right page underneath = the page being flipped to */}
              <div style={{ position: "absolute", left: 0, top: -PGH / 2, width: PGW, height: PGH }}>
                <PageFace page={PAGES[current]} w={PGW} h={PGH} frame={frame} live={PAGES[current].chore !== undefined} />
                {FLIPS.map((s, j) => {
                  const p = clamp01((frame - s) / FD);
                  if (p <= 0 || p >= 1) return null;
                  return <div key={j} style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(10,40,25,${0.22 * Math.sin(Math.PI * p)}) 0%, rgba(10,40,25,0) 60%)` }} />;
                })}
              </div>
              {/* leaves turning over the spine */}
              {FLIPS.map((s, j) => {
                const p = ease.inOutCubic(clamp01((frame - s) / FD));
                if (p <= 0 || p >= 1 || j >= flipsDone + 3) return null;
                return (
                  <div key={j} style={{ position: "absolute", left: 0, top: -PGH / 2, width: PGW, height: PGH, transformOrigin: "0% 50%", transformStyle: "preserve-3d", transform: `rotateY(${-180 * p}deg)` }}>
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
                      <PageFace page={PAGES[j]} w={PGW} h={PGH} frame={frame} live={false} />
                      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(10,40,25,${0.18 * p}) 0%, rgba(255,255,255,0) 100%)` }} />
                    </div>
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <LeftFace w={PGW} h={PGH} />
                      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(270deg, rgba(10,40,25,${0.18 * (1 - p)}) 0%, rgba(255,255,255,0) 100%)` }} />
                    </div>
                  </div>
                );
              })}
              {/* spine shadow */}
              <div style={{ position: "absolute", left: -22, top: -PGH / 2, width: 44, height: PGH, background: "linear-gradient(90deg, rgba(10,40,25,0) 0%, rgba(10,40,25,0.16) 50%, rgba(10,40,25,0) 100%)" }} />
            </div>
          </div>
        </DirBlur>
      )}

      {/* the orb */}
      {frame >= FLY && (
        <div style={{ position: "absolute", left: L.cx - OS / 2, top: L.cy - OS / 2, transform: `scale(${core})` }}>
          <HeroOrb size={OS} frame={frame} glow={1 + 1.2 * charge} />
        </div>
      )}
    </AbsoluteFill>
  );
};
