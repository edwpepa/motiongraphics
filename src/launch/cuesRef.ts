// Sound-design cue sheet for the reference-style launch ad (HandlyLaunchRef), from the same frames as the picture.
// Exported by `ENTRY=src/launch/cuesRef.ts OUT=cuesRef.json node tools/launch/cues.mjs`, played by tools/launch/mix.py.
import { BREAK_F, BUILD, C3_END, CTA, D0, DROP_END, END_FLY, END_HIT, F1_START, FINAL_F, GATA, I, MAP_IN, PHONE_BACK, PHONE_IN, PICK, R2_END, R3_END, R5_END, R6_END, R8_END, STAR, STOP_F, SWOOSH, V, bt, bt2, pEnd, pStart } from "./ref/marks";
import { BEATS, BRIDGE } from "./timeline";

export type Cue = { f: number; k: string; g?: number };

export const cues = (): Cue[] => {
  const c: Cue[] = [];
  const add = (f: number, k: string, g = 1) => c.push({ f: Math.round(f), k, g });
  const slam = (f: number, g = 0.5) => add(f - 2, "air", g);

  // ---------------------------------------------------------------- act I
  slam(I("probleme", 0), 0.6);
  slam(I("probleme", 6), 0.7);
  [I("priza", 1) - 5, I("iarba", 0) - 5, I("dulap", 0) - 5].forEach((f) => { add(f, "whoosh", 0.35); add(f + 4, "expand", 0.5); });
  add(I("dulap", 4), "notif", 0.45);
  for (let i = 0; i < 6; i++) add(I("dulap", 4) + 2 + i * 2.6, "tick", 0.3);
  add(R2_END - 12, "whoosh", 0.3);
  slam(I("timpul", 3), 0.55);
  add(R3_END - 4, "whoosh", 0.45);
  [I("amani", 2) - 1, I("amani", 2) + 13].forEach((f) => add(f, "click", 0.8));
  add(I("amani", 2) + 13, "nope", 0.35);
  slam(I("speri", 0), 0.5);
  slam(I("singur", 0), 0.5);
  add(I("singur", 2) + 6, "sparkle", 0.6);
  add(R5_END - 6, "whoosh", 0.5);
  for (let i = 0; i < 14; i++) add(V("lumea", 4) + i * ((V("lumea", 7) + 10 - V("lumea", 4)) / 14), "key", 0.5);
  add(V("lumea", 10) - 4, "nope", 0.6);
  add(R6_END - 10, "zoom", 0.45);
  slam(V("obositor", 1), 0.55);
  slam(V("obositor", 4), 0.55);
  [0, 1, 2, 3].forEach((i) => add(V("rogi", 0) + i * 9, "notif", 0.4));
  add(V("rogi", 11), "glitch", 0.5);
  slam(V("rogi", 10), 0.5);
  add(R8_END - 10, "whoosh", 0.4);
  // "Aici intervine Handly." over the calm charge, the roll into the drop
  add(pStart("aici") - 6, "calm", 1);
  add(D0 - 60, "roll");
  add(V("aici", 2) - 1, "shimmer", 0.6);

  // ---------------------------------------------------------------- the first drop
  add(D0, "drop");
  for (let k = 1; bt(k) < DROP_END - 8; k++) add(bt(k), "slam", 0.6);
  add(DROP_END - 8, "zoom", 0.5);

  // ---------------------------------------------------------------- act II
  add(PHONE_IN, "whoosh", 0.55);
  for (let i = 0; i < 12; i++) add(V("postezi", 0) + 2 + i * 2, "key", 0.5);
  add(V("postezi", 4) - 2, "expand", 0.5);
  add(V("postezi", 9) - 12, "tap", 0.8);
  add(V("postezi", 9), "success", 0.6);
  add(MAP_IN, "whoosh", 0.5);
  [0, 5, 22, 28, 36].forEach((d) => add(V("taskeri", 0) + d, "pop", 0.55));
  add(V("taskeri", 1), "select", 0.4);
  [0, 5, 10].forEach((d) => add(V("taskeri", 6) - 4 + d, "sent", 0.5));
  add(V("taskeri", 6) + 12, "notif", 0.55);
  add(PICK, "click", 0.8);
  add(PICK + 6, "expand", 0.5);
  add(PICK + 20, "tap", 0.6);
  add(PHONE_BACK, "whoosh", 0.5);
  add(V("alegi", 5), "bubble", 0.6);
  add(V("alegi", 8), "sent", 0.6);
  add(V("alegi", 11) - 4, "expand", 0.45);
  add(V("alegi", 11) + 10, "select", 0.4);
  add(V("alegi", 14), "click", 0.8);
  add(V("alegi", 14) + 4, "lock", 0.5);
  add(V("cash", 0) - 4, "cash", 0.6);
  add(V("cash", 1), "nope", 0.5);
  add(V("cash", 3), "dissolve", 0.7);
  add(V("urmaresti", 0) - 8, "whoosh", 0.4);
  add(V("urmaresti", 2) - 2, "notif", 0.45);
  add(SWOOSH, "whoosh", 0.9);
  for (let i = 0; i < 10; i++) add(SWOOSH + 10 + i * ((GATA - SWOOSH - 12) / 10), "tick", 0.25 + 0.03 * i);
  add(GATA, "success", 0.8);
  add(GATA, "sparkle", 0.6);
  slam(V("fara1", 0), 0.45);
  // the dead stop: nothing (the song cuts, the screen goes black)

  // ---------------------------------------------------------------- act III
  add(V("dar", 1) - 2, "pop", 0.45);
  slam(V("dar", 5), 0.45);
  slam(V("daca", 0), 0.5);
  [0, 2, 3, 4, 5].forEach((wi) => add(V("skills", wi) - 2, "select", 0.55));
  add(C3_END - 12, "whoosh", 0.55);
  for (let i = 0; i < 8; i++) add(V("cont", 0) + i * 3, "key", 0.4);
  add(V("cont", 7), "success", 0.55);
  add(V("cont", 8) - 6, "whoosh", 0.3);
  [V("cont", 11), V("cont", 13), V("cont", 15)].forEach((f) => add(f, "coin", 0.6));
  add(V("program", 2) - 4, "expand", 0.45);
  add(V("program", 2), "select", 0.45);
  add(V("taskurile", 2), "click", 0.8);
  add(V("taskurile", 2) + 3, "success", 0.4);
  add(V("muncesti", 3) - 4, "expand", 0.45);
  add(V("muncesti", 3) + 2, "zip", 0.4);
  add(BREAK_F - 12, "suck");
  add(V("handly", 0) - 4, "shimmer");

  // ---------------------------------------------------------------- the final drop and the close
  add(FINAL_F, "drop");
  for (let k = Math.round((FINAL_F - BRIDGE) / BEATS) + 1; bt2(k) < F1_START - 4; k++) add(bt2(k), "slam", 0.6);
  add(F1_START - 8, "zoom", 0.45);
  slam(V("ajutor", 0), 0.5);
  slam(V("bani", 0), 0.5);
  add(CTA, "whoosh", 0.45);
  add(V("cta", 1) - 1, "click", 0.85);
  add(V("cta", 1) + 2, "success", 0.5);
  add(STAR - 4, "morph", 0.55);
  add(STAR, "sparkle", 0.6);
  add(END_FLY, "whoosh", 0.35);
  add(END_HIT, "end");
  // nothing may sound in the dead stop
  return c.filter((x) => x.f >= 0 && !(x.f >= STOP_F && x.f < BRIDGE)).sort((a, b) => a.f - b.f);
};

export const marks = () => ({
  preFadeFrom: pStart("aici") / 30 - 2.7,
  preFadeTo: pStart("aici") / 30 - 0.1,
  contFrom: pStart("cont") / 30 - 0.4,
  contTo: pEnd("cont") / 30 + 0.6,
  stop: STOP_F / 30,
  bridge: BRIDGE / 30,
  suspense: BUILD / 30,
  brk: BREAK_F / 30,
  final: FINAL_F / 30,
});
