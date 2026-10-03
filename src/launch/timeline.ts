import TL from "./timeline.json";
import WORDS from "./vo-words.json";
import type { KWord } from "../explainer/components/KineticText";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DROP = TL.drop;
export const END = TL.end;
export const TOTAL = Math.round(END * FPS);

/** output seconds → frame */
export const F = (sec: number) => Math.round(sec * FPS);
/** frame of the drop + r seconds */
export const R = (r: number) => F(DROP + r);

/** song beat (post-drop grid, 125 bpm) */
export const BEAT = 0.4799;
export const beatF = (k: number) => F(DROP + k * BEAT);
export const BEATS = BEAT * FPS;

export const BRIDGE = R(TL.bridgeR);
export const BASS_BACK = R(TL.bassBackR);
export const QUIET = R(TL.quietR);
export const BREAK = R(TL.breakR);
export const FINAL = R(TL.finalR);
export const END_HIT = R(TL.endHitR);

type PhraseKey = keyof typeof WORDS;
const W = WORDS as unknown as Record<string, { start: number; end: number; text: string; words: [string, number][] }>;
const POST = TL.post as Record<string, number>;

/** voiceover-file seconds → output seconds for a phrase */
const voToOut = (key: string, v: number) => {
  if (key in POST) return DROP + POST[key] + (v - W[key].start);
  for (const c of TL.pre) if (v >= c.vo[0] - 0.05 && v <= c.vo[1] + 0.05) return c.at + (v - c.vo[0]);
  throw new Error(`no chunk for ${key} @ ${v}`);
};

/** word onset frames of a phrase: [text, frame][] */
export const words = (key: PhraseKey): [string, number][] => W[key].words.map(([t, v]) => [t, F(voToOut(key, v))]);
/** frame where a phrase starts / ends */
export const pStart = (key: PhraseKey) => F(voToOut(key, W[key].start));
export const pEnd = (key: PhraseKey) => F(voToOut(key, W[key].end));
/** frame of the i-th word of a phrase */
export const w = (key: PhraseKey, i: number) => words(key)[i][1];

/** KineticText words for a phrase (optional per-index colours, a lead so letters land on the syllable) */
export const kw = (key: PhraseKey, opts: { lead?: number; color?: Record<number, [string, string]>; only?: number[]; cap?: boolean } = {}): KWord[] => {
  const lead = opts.lead ?? 3;
  const list = words(key)
    .map(([text, at], i) => ({ text, at: at - lead, color: opts.color?.[i], i }))
    .filter((x) => !opts.only || opts.only.includes(x.i))
    .map(({ text, at, color, i }) => ({ text, at, color, i }));
  // every new text scene starts with a capital letter (phrase starts by default, or when asked)
  const cap = opts.cap ?? (list.length > 0 && list[0].i === 0);
  return list.map(({ text, at, color }, j) => ({ text: j === 0 && cap ? text.charAt(0).toLocaleUpperCase("ro-RO") + text.slice(1) : text, at, color }));
};
