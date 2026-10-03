import WORDS from "./vo-words.json";
import type { KWord } from "../explainer/components/KineticText";

export const FPS = 30;
export const OFF = 0.6; // seconds of picture before the voice
export const END = 42.0;
export const TOTAL = Math.round(END * FPS);
/** the music drops right after "Pe Handly." */
export const DROP_S = 17.75;
export const DROP = Math.round(DROP_S * FPS);
export const BEAT = 0.4799;
export const bt = (k: number) => Math.round((DROP_S + k * BEAT) * FPS);

type P = { start: number; end: number; text: string; words: [string, number][] };
const W = WORDS as unknown as Record<string, P>;
export type Key = keyof typeof WORDS;
export const F = (sec: number) => Math.round(sec * FPS);
const out = (v: number) => F(v + OFF);
export const w = (k: Key, i: number) => out(W[k].words[i][1]);
export const pStart = (k: Key) => out(W[k].start);
export const pEnd = (k: Key) => out(W[k].end);
export const kw = (k: Key, opts: { lead?: number; color?: Record<number, [string, string]>; only?: number[]; cap?: boolean } = {}): KWord[] => {
  const lead = opts.lead ?? 3;
  const list = W[k].words.map(([text, v], i) => ({ text, at: out(v) - lead, color: opts.color?.[i], i })).filter((x) => !opts.only || opts.only.includes(x.i));
  const cap = opts.cap ?? (list.length > 0 && list[0].i === 0);
  return list.map(({ text, at, color }, j) => ({ text: j === 0 && cap ? text.charAt(0).toLocaleUpperCase("ro-RO") + text.slice(1) : text, at, color }));
};
