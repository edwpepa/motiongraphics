import TL from "./timeline.json";
import IW from "./intro-words.json";
import { pStart, w } from "./timeline";

// timing of the new opening (no React here: the cue sheet imports it too)
const IO = (TL as unknown as { intro: { at: number } }).intro.at;
type Ph = { start: number; end: number; text: string; words: [string, number][] };
const I = IW as unknown as Record<string, Ph>;
/** frame of word i of an intro phrase */
export const iw = (key: string, i = 0) => Math.round((IO + I[key].words[Math.min(i, I[key].words.length - 1)][1]) * 30);
export const iEnd = (key: string) => Math.round((IO + I[key].end) * 30);
/** [word, frame][] of an intro phrase, with a slight lead so a word lands on its syllable */
export const iWords = (key: string, lead = 3): [string, number][] => I[key].words.map(([t, v]) => [t, Math.round((IO + v) * 30) - lead]);

export const S1_END = iw("priza", 0) - 9;
export const S2_END = iw("timpul", 0) - 8;
export const S3_END = iw("amani", 0) - 9;
export const S4_END = iw("speri", 0) - 8;
export const S5_END = pStart("lumea") - 10;
export const S6_END = pStart("obositor") - 6;
export const S7_END = w("rogi", 0) - 6;
