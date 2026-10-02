// Timeline for the 16:9 explainer, driven by the provided ElevenLabs voiceover.
//
// Word onsets are in seconds of the *original* voiceover file and were measured from its
// waveform/spectrogram (silence gaps + energy dips per syllable). `f()` converts them to
// composition frames, including the short lead-in before the voice starts.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Seconds of picture before the voiceover's first sample. */
export const VO_OFFSET = 0.4;

/** Voiceover-file seconds → composition frame. */
export const f = (sec: number) => Math.round((sec + VO_OFFSET) * FPS);

export type TimedWord = [text: string, sec: number];

export const VO = {
  hook: [
    ["Te", 0.1],
    ["tot", 0.3],
    ["gândești", 0.45],
    ["la", 1.0],
    ["treaba", 1.08],
    ["aia", 1.3],
    ["obositoare", 1.65],
    ["prin", 2.55],
    ["casă...", 2.75],
  ] as TimedWord[],
  hookEnd: 3.45,

  // "pe care o tot amâni?" — one calendar hop per syllable
  postponeSyllables: [3.47, 3.6, 3.75, 3.97, 4.13, 4.3],
  postponeEnd: 4.65,

  chores: [5.17, 6.92, 8.57],
  choresEnd: 10.1,

  // [long pause] then the energetic half
  postezi: 11.59,
  taskul: 12.2,
  peHandly: 12.61,
  postEnd: 13.21,
  dureaza: 13.42,
  cateva: 13.95,
  secunde: 14.35,
  secundeEnd: 14.87,

  taskerii: 15.18,
  dinZona: 15.6,
  vad: 16.17,
  vadTaskul: 16.7,
  radarEnd: 17.17,

  tuAlegi: 17.39,
  cuCine: 17.88,
  lucrezi: 18.3,
  laPretul: 18.73,
  stabilit: 18.99,
  chiar: 19.94,
  voiDoi: 20.3,
  doi: 20.5,
  pretEnd: 20.75,

  noFees: [
    ["Fără", 20.95],
    ["tarife", 21.25],
    ["de", 21.65],
    ["firmă.", 21.75],
  ] as TimedWord[],
  noMiddlemen: [
    ["Fără", 22.26],
    ["intermediari.", 22.55],
  ] as TimedWord[],
  noMiddlemenEnd: 23.33,

  handly: 23.62,
  postezi2: 24.36,
  seRezolva: 25.15,
  rezolva: 25.35,
  voEnd: 26.0,
};

// Original score: 112 BPM; the drop lands on "Postează" (frame 360), the logo hit 7 bars later.
export const BPM = 112;
export const MUSIC_LIFT_FRAME = 360;
export const LOGO_HIT_FRAME = 810;

export const DURATION_IN_FRAMES = 915;

// Scene windows (frames, inclusive start / exclusive end incl. transition overlaps)
export const SCENES = {
  hook: [0, 122],
  calendar: [112, 175],
  chores: [158, 372],
  post: [348, 472],
  radar: [452, 548],
  choose: [524, 656],
  noFees: [640, 730],
  words: [712, 796],
  logo: [796, DURATION_IN_FRAMES],
} as const;
