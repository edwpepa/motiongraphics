// Sound-design cue sheet, derived from the same scene boundaries as the picture.
// Exported as JSON by tools/launch/cues.mjs and played by tools/launch/mix.py.
import * as S from "./scenes";
import * as I from "./introTimes";
import { BEATS, BREAK, BRIDGE, DROP, END_HIT, F, FINAL, QUIET, w } from "./timeline";

export type Cue = { f: number; k: string; g?: number };
const D0 = F(DROP);
const bt = (k: number) => Math.round(D0 + k * BEATS);
const beatAt = (frame: number) => Math.floor((frame - D0 + 0.5) / BEATS);
const BEAT_PRE = 0.4812 * 30;

const beatsBetween = (a: number, b: number) => {
  const out: number[] = [];
  for (let k = beatAt(a); bt(k) < b; k++) if (bt(k) >= a) out.push(bt(k));
  return out;
};

export const cues = (): Cue[] => {
  const c: Cue[] = [];
  const add = (f: number, k: string, g = 1) => c.push({ f: Math.round(f), k, g });

  // ---------------------------------------------------------------- act I: the new opening
  add(2, "air", 0.6);
  add(I.iw("probleme", 6) - 4, "select", 0.7);
  add(I.S1_END - 12, "suck", 0.7);
  add(I.S1_END, "bloom", 0.7);
  add(I.iw("iarba", 0) - 7, "whoosh", 0.7);
  add(I.iw("dulap", 0) - 7, "whoosh", 0.7);
  add(I.iw("priza", 1), "glitch", 0.35);
  for (let i = 0; i < 8; i++) add(I.iw("dulap", 2) + i * 3, "tick", 0.5);
  add(I.iw("dulap", 6) + 4, "zoom", 0.6);
  add(I.S2_END, "wipe", 0.7);
  [I.iw("timpul", 3), I.iw("sculele", 0), I.iw("nervii", 0)].forEach((f) => {
    add(f - 6, "pop", 0.7);
    add(f + 14, "nope", 0.35);
  });
  add(I.S3_END, "whoosh", 0.6);
  [I.S3_END + 2, I.iw("amani", 1) - 2, I.iw("amani", 2) + 3].forEach((f, i) => {
    add(f, "notif", 0.8);
    if (i < 2) add(f + 10, "tap", 0.6);
  });
  add(I.S4_END, "wipe", 0.6);
  add(I.iw("singur", 2) - 6, "suck", 0.8);
  add(I.S5_END, "whoosh");
  for (let i = 0; i < 10; i++) add(w("lumea", 3) + i * ((w("lumea", 7) - w("lumea", 3)) / 10), "key", 0.7);
  add(w("lumea", 10) - 2, "nope");
  add(I.S6_END, "whoosh");
  add(w("obositor", 4) - 8, "search", 0.7);
  add(w("obositor", 6) - 7, "whoosh", 0.6);
  add(w("obositor", 6) - 2, "ring", 0.8);
  add(w("obositor", 8) - 7, "whoosh", 0.6);
  [4, 11, 18, 25].forEach((d, i) => add(w("obositor", 8) - 7 + d, i % 2 ? "bubble" : "sent", 0.7));
  add(I.S7_END, "whoosh");
  for (let i = 0; i < 5; i++) add(w("rogi", 8) + i * 4, "fall", 0.6);
  add(w("rogi", 11) - 2, "glitch", 0.9);
  add(S.A10_END - 6, "calm", 1);
  add(D0 - 60, "roll");
  add(S.A10_END + 2, "pop", 0.5);
  add(w("aici", 2) - 4, "shimmer");

  // ---------------------------------------------------------------- act II
  add(D0, "drop");
  beatsBetween(D0 + 3, S.B1_END - 8).forEach((f) => add(f, "slam"));
  add(S.B1_END - 8, "zoom");
  add(S.B1_END, "whoosh");
  const TYPE = S.B1_END + 10;
  for (let i = 0; i < 9; i++) add(TYPE + i * 2, "key", 0.7);
  add(TYPE + 24, "tap");
  add(TYPE + 32, "pop", 0.6);
  add(TYPE + 44, "tap");
  add(S.B1_END + 66, "tap");
  add(S.B1_END + 78, "success");
  add(S.B2_END, "whoosh");
  for (let i = 0; i < 3; i++) add(w("taskeri", 1) - 4 + i * 5, "pop");
  for (let i = 0; i < 3; i++) add(w("taskeri", 6) - 4 + i * 5, "notif", 0.8);
  add(S.B3_END, "whoosh");
  add(w("alegi", 3), "select");
  add(w("alegi", 5) - 10, "expand");
  const s2 = w("alegi", 5) - 4;
  [10, 24, 38].forEach((d, i) => add(s2 + d, i === 1 ? "sent" : "bubble"));
  const s3 = w("alegi", 11) - 4;
  add(s3, "morph");
  add(s3 + 10, "lock");
  add(S.B4_END, "whoosh");
  add(w("cash", 3) - 6, "dissolve");
  add(S.B5_END, "whoosh");
  for (let i = 0; i < 3; i++) add(S.B5_END + 10 + i * 20, "step");
  add(w("urmaresti", 8) - 2, "success");
  add(S.B6_END, "cut");
  add(w("fara2", 0) - 3, "cut");
  add(w("fara2", 1) - 2, "release");
  const k0 = Math.ceil((S.B7_END - D0) / BEATS);
  for (let i = 0; i < S.MONTAGE_SHAPES; i++) add(bt(k0 + i), "morphhit", 0.8);
  beatsBetween(bt(k0 + S.MONTAGE_SHAPES), BRIDGE).forEach((f) => add(f, "slam"));

  // ---------------------------------------------------------------- act III
  add(BRIDGE, "whoosh");
  add(S.C1_END - 16, "select");
  add(w("daca", 4) - 2, "sparkle");
  [0, 2, 3, 4, 5].forEach((i) => add(w("skills", i) - 3, "cut"));
  add(S.C3_END, "whoosh");
  add(w("cont", 2) - 8, "whoosh", 0.7);
  add(w("cont", 4) - 2, "pop");
  for (let i = 0; i < 3; i++) add(w("cont", 5) + i * 4, "bubble", 0.6);
  add(w("cont", 8) - 6, "expand");
  for (let i = 0; i < 11; i++) add(w("cont", 11) - 6 + i * 3, "coin", 0.6);
  add(w("cont", 11) + 30, "cash");
  add(S.C4_END, "cut");
  [0, 2, 3, 5].forEach((j) => add(w("program", 2) + j * 3, "click", 0.8));
  add(w("taskurile", 2) - 4, "tick");
  [0, 2].forEach((j) => add(w("taskurile", 2) + 4 + j * 5, "pop", 0.7));
  add(w("muncesti", 2) - 4, "tick");
  add(w("muncesti", 2) + 2, "zip");
  add(S.C5_END, "whoosh", 1);
  add(BREAK - 12, "suck");
  add(w("handly", 0) - 4, "shimmer");
  add(FINAL, "drop");
  beatsBetween(FINAL + 3, S.SPLIT).forEach((f) => add(f, "slam"));
  add(S.SPLIT, "whoosh");
  add(w("bani", 0) - 8, "whoosh");
  add(S.C8_END, "whoosh");
  for (let k = 0; k < 2; k++) add(w("cta", 1) - 4 + k * 4, "pop");
  beatsBetween(S.C9_END, END_HIT - 2).forEach((f) => add(f, "slam", 0.85));
  add(END_HIT, "end");
  return c.sort((a, b) => a.f - b.f);
};

/** music automation points (seconds) */
import { pEnd, pStart } from "./timeline";
export const marks = () => ({
  preFadeFrom: (S.A10_END - 4) / 30 - 2.9,
  preFadeTo: (S.A10_END - 4) / 30 - 0.15,
  contFrom: pStart("cont") / 30 - 0.4,
  contTo: pEnd("cont") / 30 + 0.6,
  quiet: QUIET / 30,
  bridge: BRIDGE / 30,
  suspense: S.C5_END / 30,
  brk: BREAK / 30,
  final: FINAL / 30,
});
