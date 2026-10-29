import TL from "./timeline.json";
import IW from "./intro-words.json";
import { pStart, w } from "./timeline";

// timing of the new opening (no React here: the cue sheet imports it too)
type Chunk = { vo: [number, number]; at: number };
const INTRO = (TL as unknown as { intro: { at?: number; chunks?: Chunk[] } }).intro;
const TEMPO = (TL as unknown as { tempo?: number }).tempo ?? 1;
type Ph = { start: number; end: number; text: string; words: [string, number][] };
const I = IW as unknown as Record<string, Ph>;
/** intro-file seconds → output seconds (the intro is cut into speech chunks; nearest chunk wins in a cut) */
const out = (v: number) => {
  if (!INTRO.chunks) return (INTRO.at ?? 0) + v;
  let best = INTRO.chunks[0], dist = Infinity;
  for (const c of INTRO.chunks) {
    const d = v < c.vo[0] ? c.vo[0] - v : v > c.vo[1] ? v - c.vo[1] : 0;
    if (d < dist) (best = c), (dist = d);
  }
  return best.at + (Math.min(Math.max(v, best.vo[0]), best.vo[1]) - best.vo[0]) / TEMPO;
};
/** frame of word i of an intro phrase */
export const iw = (key: string, i = 0) => Math.round(out(I[key].words[Math.min(i, I[key].words.length - 1)][1]) * 30);
export const iEnd = (key: string) => Math.round(out(I[key].end) * 30);
/** [word, frame][] of an intro phrase, with a slight lead so a word lands on its syllable */
export const iWords = (key: string, lead = 3): [string, number][] => I[key].words.map(([t, v]) => [t, Math.round(out(v) * 30) - lead]);

export const S1_END = iw("priza", 0) - 9;
export const S2_END = iw("timpul", 0) - 8;
export const S3_END = iw("amani", 0) - 9;
export const S4_END = iw("speri", 0) - 8;
export const S5_END = pStart("lumea") - 10;
export const S6_END = pStart("obositor") - 6;
export const S7_END = w("rogi", 0) - 6;
