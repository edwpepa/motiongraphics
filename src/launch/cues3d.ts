// Sound-design cue sheet for the 3D launch ad (HandlyLaunch3D), from the same frames as the picture.
// Exported by `ENTRY=src/launch/cues3d.ts OUT=cues3d.json node tools/launch/cues.mjs`, played by tools/launch/mix.py.
import * as S from "./scenes";
import * as I from "./introTimes";
import { BEATS, BREAK, BRIDGE, DROP, END_HIT, F, FINAL, QUIET, pEnd, pStart, w } from "./timeline";
import { iWords } from "./introTimes";

export type Cue = { f: number; k: string; g?: number };
const D0 = F(DROP);
const bt = (k: number) => Math.round(D0 + k * BEATS);
const beatAt = (frame: number) => Math.floor((frame - D0 + 0.5) / BEATS);
const beatsBetween = (a: number, b: number) => {
  const out: number[] = [];
  for (let k = beatAt(a); bt(k) < b; k++) if (bt(k) >= a) out.push(bt(k));
  return out;
};

export const cues = (): Cue[] => {
  const c: Cue[] = [];
  const add = (f: number, k: string, g = 1) => c.push({ f: Math.round(f), k, g });
  const spinAt = (f: number, g = 0.8) => {
    add(f, "whoosh", g * 0.8);
    add(f + 6, "spin", g);
  };

  // ---------------------------------------------------------------- act I
  add(2, "air", 0.6);
  const P = iWords("probleme");
  const arrive = P[3][1] - 8;
  spinAt(arrive, 0.7);
  for (let i = 0; i < 5; i++) add(arrive + 16 + i * 9, "notif", 0.4);
  [46, 54, 62].forEach((d) => add(arrive + d, "pop", 0.7));
  add(I.S1_END, "whoosh", 0.5);
  [I.iw("priza", 0), I.iw("iarba", 0), I.iw("dulap", 0)].forEach((f) => add(f - 4, "expand", 0.7));
  for (let i = 0; i < 8; i++) add(I.iw("dulap", 4) + i * 3, "tick", 0.45);
  add(I.S2_END - 16, "suck", 0.5);
  const c2 = I.iw("sculele", 0) - 13, c3 = I.iw("nervii", 0) - 13;
  [I.S2_END - 2, c2, c3].forEach((f) => spinAt(f, 0.8));
  [I.S2_END + 30, c2 + 26, c3 + 30].forEach((f) => add(f, "pop", 0.75));
  add(c3 + 34, "nope", 0.3);
  add(I.S3_END - 2, "notif", 0.8);
  [I.iw("amani", 0) - 3, I.iw("amani", 1) - 2, I.iw("amani", 2) + 3].forEach((f) => add(f, "tap", 0.7));
  add(I.S4_END, "whoosh", 0.45);
  add(I.S5_END, "whoosh", 0.6);
  add(I.S5_END + 6, "pop", 0.7);
  for (let i = 0; i < 10; i++) add(w("lumea", 2) + i * ((w("lumea", 7) + 4 - w("lumea", 2)) / 10), "key", 0.65);
  add(w("lumea", 7) + 6, "nope", 0.8);
  add(w("lumea", 7) + 14, "pop", 0.6);
  add(I.S6_END, "whoosh", 0.9);
  add(I.S6_END + 4, "zoom", 0.5);
  add(w("obositor", 4) - 4, "search", 0.6);
  add(w("obositor", 6) - 3, "ring", 0.7);
  add(w("obositor", 8) - 4, "sent", 0.6);
  add(I.S7_END, "whoosh", 0.6);
  add(I.S7_END + 22, "sent", 0.6);
  add(w("rogi", 5) - 8, "pop", 0.8);
  add(w("rogi", 5) + 4, "cash", 0.7);
  add(w("rogi", 8) + 2, "sent", 0.5);
  add(w("rogi", 8) + 16, "sent", 0.4);
  add(w("rogi", 11) - 2, "glitch", 0.9);
  add(w("rogi", 11) + 6, "nope", 0.6);
  add(S.A10_END - 6, "calm", 1);
  add(D0 - 60, "roll");
  add(S.A10_END + 9, "tap", 0.8);
  add(S.A10_END + 11, "suck", 0.6);
  add(w("aici", 2) - 4, "shimmer");

  // ---------------------------------------------------------------- act II
  add(D0, "drop");
  add(D0, "splash", 0.8);
  beatsBetween(D0 + 3, S.B1_END - 8).forEach((f, i) => add(f, i % 2 ? "slam" : "splash", 0.4));
  add(S.B1_END - 8, "zoom");
  spinAt(S.B1_END, 0.8);
  const TYPE = S.B1_END + 10;
  for (let i = 0; i < 11; i++) add(TYPE + i * 2, "key", 0.65);
  add(TYPE + 2, "pop", 0.7);
  add(w("postezi", 7) - 4, "tap");
  add(w("postezi", 9) - 2, "success");
  add(w("postezi", 9) + 2, "sparkle", 0.6);
  add(S.B2_END, "whoosh", 0.6);
  [w("taskeri", 1) - 2, w("taskeri", 4) - 4, w("taskeri", 6) - 4].forEach((f) => {
    add(f, "pop", 0.85);
    add(f + 2, "notif", 0.45);
  });
  add(S.B3_END, "whoosh", 0.6);
  add(S.B3_END + 8, "pop", 0.7);
  add(w("alegi", 4) - 2, "tap");
  const s2 = w("alegi", 5) - 5, s3 = w("alegi", 11) - 5;
  spinAt(s2 - 9);
  [4, 20, 36].forEach((d, i) => add(s2 + d + 2, i === 1 ? "sent" : "bubble", 0.7));
  spinAt(s3 - 9);
  add(s3 + 2, "pop", 0.7);
  add(w("alegi", 12) - 2, "tap");
  add(w("alegi", 12) + 2, "morph", 0.8);
  add(w("alegi", 12) + 8, "lock", 0.7);
  add(w("alegi", 12) + 10, "sparkle", 0.6);
  add(S.B4_END, "whoosh", 0.5);
  add(w("cash", 3) - 4, "dissolve", 0.8);
  add(S.B5_END, "whoosh", 0.6);
  add(S.B5_END + 10, "pop", 0.7);
  for (let i = 0; i < 3; i++) add(S.B5_END + 14 + i * 20, "step", 0.7);
  add(w("urmaresti", 8) - 2, "success");
  add(w("urmaresti", 8) + 2, "sparkle", 0.6);
  add(S.B6_END, "cut", 0.6);
  add(w("fara2", 0) - 6, "cut", 0.5);
  add(w("fara2", 1) - 2, "release");
  add(S.B7_END - 10, "splash", 0.8);
  const k0 = Math.ceil((S.B7_END - D0) / BEATS);
  for (let i = 0; i < S.MONTAGE_SHAPES; i++) add(bt(k0 + i), "morphhit", 0.7);
  beatsBetween(bt(k0 + S.MONTAGE_SHAPES), BRIDGE - 10).forEach((f, i) => add(f, i % 2 ? "slam" : "splash", 0.35));

  // ---------------------------------------------------------------- act III (the bridge is soft: no hits, only air)
  add(BRIDGE + 4, "air", 0.45);
  add(S.C1_END - 46, "pop", 0.7);
  add(S.C1_END - 20, "select");
  add(S.C1_END - 18, "sparkle", 0.6);
  add(w("daca", 4) - 2, "sparkle", 0.7);
  spinAt(S.C2_END - 2, 0.6);
  [0, 2, 3, 4, 5].forEach((i) => add(w("skills", i), "pop", 0.8));
  add(w("cont", 4) - 2, "pop", 0.7);
  add(w("cont", 7) - 2, "success", 0.6);
  spinAt(w("cont", 8) - 15, 0.8);
  for (let i = 0; i < 11; i++) add(w("cont", 11) - 4 + i * 3, "coin", 0.55);
  add(w("cont", 17), "cash", 0.8);
  spinAt(S.C4_END - 6, 0.8);
  [0, 2, 3, 5].forEach((j) => add(w("program", 2) + j * 3, "click", 0.7));
  spinAt(w("taskurile", 0) - 9, 0.8);
  add(w("taskurile", 2) - 2, "tap");
  add(w("taskurile", 2) + 4, "pop", 0.7);
  spinAt(w("muncesti", 0) - 9, 0.8);
  add(w("muncesti", 2) + 2, "zip");
  add(S.C5_END, "whoosh", 1);
  add(BREAK - 12, "suck");
  add(w("handly", 0) - 4, "shimmer");
  add(FINAL, "drop");
  add(FINAL, "splash", 0.8);
  beatsBetween(FINAL + 3, S.SPLIT - 10).forEach((f, i) => add(f, i % 2 ? "slam" : "splash", 0.4));
  add(S.SPLIT - 10, "zoom");
  add(S.SPLIT, "whoosh");
  add(w("bani", 0) - 8, "whoosh");
  add(S.C8_END, "whoosh");
  for (let k = 0; k < 2; k++) add(w("cta", 1) - 4 + k * 4, "pop");
  add(S.C9_END + 6, "sparkle", 0.7);
  add(END_HIT - 10, "whoosh", 0.6);
  add(END_HIT, "end");
  add(END_HIT, "splash", 0.5);
  add(END_HIT + 22, "sparkle", 0.5);
  return c.sort((a, b) => a.f - b.f);
};

/** music automation points (seconds) */
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
