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
    ["tot", 0.22],
    ["gândești", 0.36],
    ["la", 0.9],
    ["treaba", 0.99],
    ["aia", 1.2],
    ["obositoare", 1.45],
    ["prin", 2.1],
    ["casă...", 2.34],
  ] as TimedWord[],
  hookEnd: 2.92,

  // "pe care o tot amâni?" — one calendar hop per syllable
  postponeSyllables: [3.21, 3.33, 3.5, 3.61, 3.76, 3.92],
  postponeEnd: 4.15,

  chores: [4.83, 6.52, 8.04],
  choresEnd: 9.3,

  postezi: 9.87,
  taskul: 10.3,
  peHandly: 10.66,
  postEnd: 11.28,
  dureaza: 11.48,
  cateva: 12.05,
  secunde: 12.42,
  secundeEnd: 12.92,

  taskerii: 13.32,
  dinZona: 13.75,
  vad: 14.42,
  vadTaskul: 14.86,
  radarEnd: 15.38,

  tuAlegi: 15.63,
  cuCine: 16.06,
  lucrezi: 16.54,
  laPretul: 17.02,
  stabilit: 17.6,
  chiar: 18.1,
  voiDoi: 18.45,
  doi: 18.7,
  pretEnd: 18.95,

  noFees: [
    ["Fără", 19.38],
    ["tarife", 19.69],
    ["de", 20.12],
    ["firmă.", 20.18],
  ] as TimedWord[],
  noMiddlemen: [
    ["Fără", 20.62],
    ["intermediari.", 20.98],
  ] as TimedWord[],
  noMiddlemenEnd: 21.65,

  handly: 22.2,
  postezi2: 22.97,
  seRezolva: 23.75,
  voEnd: 24.39,
};

// Original score: 110 BPM, the "solution" lift lands on frame 300 and the logo hit 7 bars later.
export const BPM = 110;
export const MUSIC_LIFT_FRAME = 300;
export const LOGO_HIT_FRAME = 758;

export const DURATION_IN_FRAMES = 870;

// Scene windows (frames, inclusive start / exclusive end incl. transition overlaps)
export const SCENES = {
  hook: [0, 108],
  calendar: [98, 160],
  chores: [146, 304],
  post: [286, 418],
  radar: [398, 490],
  choose: [466, 600],
  noFees: [584, 690],
  words: [668, 746],
  logo: [746, DURATION_IN_FRAMES],
} as const;
