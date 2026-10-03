"""Original score for the launch film (no samples, no borrowed melody): a stomp-clap anthem in
G minor at 125 bpm, written directly on the film's timeline.

  pre     dark pulse under the story (fades out before "Aici intervine Handly")
  drop    chorus A: stomps, claps, driving distorted bass, the hook, a choir in the second half
  bridge  breakdown (mix.py puts it "in a box")
  final   chorus B from the final drop to the last hit, then one big chord ringing out
"""
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
import compose as C  # noqa: E402

SR = C.SR
ROOT = C.ROOT
rng = np.random.default_rng(23)
TL = json.load(open(os.path.join(ROOT, "src/launch/timeline.json")))
D = TL["drop"]
END = TL["end"]
N = int(END * SR)
BEAT = 0.4799
BAR = 4 * BEAT
FINAL = D + TL["finalR"]
END_HIT = D + TL["endHitR"]
BRIDGE = D + TL["bridgeR"]


def bar(k):
    return D + k * BAR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ oscillators / instruments

def fsaw(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    ph = (np.cumsum(f) / SR + phase) % 1.0
    return 2 * ph - 1


def adsr(n, a, d, s, r):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return e * rel


def lead(m, dur):
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.15) / 0.2, 0, 1)
    f = mtof(m) * vib
    y = fsaw(f * 1.004, n, rng.random()) + fsaw(f * 0.996, n, rng.random()) + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 0.5) / SR))
    y = C.filt(y, "lowpass", 3200, 2)
    bright = C.filt(y, "highpass", 1500, 1) * np.exp(-t / 0.08)
    env = adsr(n, 0.005, 0.18, 0.55, 0.18) * (t < dur + 0.25)
    return (y + bright * 0.8) * env * 0.35


def choir(notes, dur, attack=0.35):
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        for v, pan in enumerate((-0.6, 0.0, 0.6)):
            vib = 1 + 0.006 * np.sin(2 * np.pi * (4.8 + 0.4 * v) * t + v)
            x = fsaw(mtof(m) * (1 + (v - 1) * 0.004) * vib, n, rng.random())
            out += C.stereo(x, pan)
    # "oh" formants
    y = np.stack([C.filt(out[c], "bandpass", (380, 560), 2) * 1.0 + C.filt(out[c], "bandpass", (720, 960), 2) * 0.55 + C.filt(out[c], "bandpass", (2400, 2900), 2) * 0.12 for c in range(2)])
    env = adsr(n, attack, 0.6, 0.85, 0.5)
    return y * env[None, :] / (len(notes) * 3) * 4


def dbass(m, dur):
    n = int((dur + 0.03) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    y = fsaw(f, n) + 0.6 * fsaw(f * 1.006, n, 0.3)
    y = C.filt(y, "lowpass", 900, 2)
    y = np.tanh(y * 2.4) * 0.6 + np.sin(2 * np.pi * f * t) * 0.7
    return y * adsr(n, 0.004, 0.12, 0.8, 0.03)


def pad(notes, dur, attack=0.8, release=1.2, cutoff=2400):
    n = int((dur + release) * SR)
    out = np.zeros((2, n))
    for m in notes:
        for pan, det in ((-0.7, -0.006), (0.0, 0.0), (0.7, 0.006)):
            out += C.stereo(fsaw(mtof(m) * (1 + det), n, rng.random()), pan)
    out = np.stack([C.filt(out[c], "lowpass", cutoff, 2) for c in range(2)])
    return out * adsr(n, attack, 1.0, 0.9, release)[None, :] / (len(notes) * 3) * 2


def pluck(m, dur=0.5, tau=0.16):
    return C.pluck(m, dur, tau=tau, bright=1.1)


def stomp():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (52 + 70 * np.exp(-t / 0.04)) * t) * np.exp(-t / 0.22)
    thud = C.filt(rng.standard_normal(n), "lowpass", 420, 2) * np.exp(-t / 0.05) * 0.9
    wood = C.filt(rng.standard_normal(n), "bandpass", (900, 2600), 2) * np.exp(-t / 0.012) * 0.35
    return np.tanh((body + thud + wood) * 1.4)


def bigclap():
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    c = C.clap()[:n]
    c = np.pad(c, (0, n - len(c)))
    snare = C.filt(rng.standard_normal(n), "bandpass", (180, 1400), 2) * np.exp(-t / 0.08) * 0.7
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.4
    return c + snare + tone


def hard_kick():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 45 + 160 * np.exp(-t / 0.025)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28)
    click = C.filt(rng.standard_normal(n), "bandpass", (2000, 8000), 2) * np.exp(-t / 0.003) * 0.5
    return np.tanh((body * 1.3 + click) * 1.8) * 0.9


def hey():
    """A crowd shouting "hey!": a few detuned voices through 'e' formants, short and punchy."""
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for v in range(6):
        f0 = 190 * (1 + (rng.random() - 0.5) * 0.12) * (1 - 0.15 * t / 0.45)
        src = fsaw(f0, n, rng.random()) + 0.3 * rng.standard_normal(n)
        d = int(rng.uniform(0, 0.02) * SR)
        y[d:] += src[: n - d]
    form = C.filt(y, "bandpass", (480, 760), 2) + 0.8 * C.filt(y, "bandpass", (1700, 2300), 2) + 0.3 * C.filt(y, "bandpass", (2600, 3200), 2)
    env = np.clip(t / 0.01, 0, 1) * np.exp(-t / 0.12)
    return np.tanh(form * env * 3) * 0.8


def tom(m):
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    f = mtof(m) * (1 + 0.6 * np.exp(-t / 0.03))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25) + C.filt(rng.standard_normal(n), "lowpass", 1500) * np.exp(-t / 0.02) * 0.4


# ------------------------------------------------------------------ harmony + hook (original)

PROG = [("Gm", 43, [55, 58, 62, 67]), ("Eb", 39, [55, 58, 63, 67]), ("Bb", 46, [53, 58, 62, 65]), ("F", 41, [53, 57, 60, 65])]
PRE = [("Gm9", 43, [55, 58, 62, 69]), ("Ebmaj7", 39, [55, 58, 62, 63]), ("Cm9", 36, [55, 58, 62, 63]), ("D7sus", 38, [55, 57, 60, 62])]
# 4-bar hook, (beat, midi, length in beats)
HOOK = [
    [(0, 74, 0.5), (0.5, 74, 0.5), (1, 77, 0.5), (1.5, 74, 0.5), (2, 72, 0.75), (2.75, 70, 0.25), (3, 72, 1)],
    [(0, 70, 0.5), (0.5, 70, 0.5), (1, 72, 0.5), (1.5, 70, 0.5), (2, 67, 1.5)],
    [(0, 74, 0.5), (0.5, 74, 0.5), (1, 77, 0.5), (1.5, 79, 0.5), (2, 77, 0.75), (2.75, 74, 0.25), (3, 72, 1)],
    [(0, 72, 0.5), (0.5, 74, 0.5), (1, 72, 0.5), (1.5, 69, 0.5), (2, 69, 1.75)],
]


def build():
    B = {k: np.zeros((2, N)) for k in ("drums", "bass", "pad", "lead", "choir", "pluck", "fx")}
    chain = np.ones(N)
    stomp_s, clap_s = stomp(), bigclap()

    def place(bus, x, at, g=1.0, pan=0.0):
        C.place(B[bus], x if x.ndim == 2 else C.stereo(x, pan), at, g)

    def duck(at, depth=0.75, tau=0.11):
        i = int(at * SR)
        if i >= N or i < 0:
            return
        dip = 1 - depth * np.exp(-np.arange(int(0.35 * SR)) / SR / tau)
        j = min(N, i + len(dip))
        chain[i:j] = np.minimum(chain[i:j], dip[: j - i])

    # ---------------------------------------------------------- pre: a dark pulse under the story
    place("fx", C.reverse_swell(1.8), 0.0, 0.25)
    for k in range(-20, -1):
        t0 = bar(k)
        if t0 < 0:
            continue
        name, root, tones = PRE[(k + 20) % 4]
        late = k >= -12
        place("pad", pad(tones, BAR, attack=0.9, release=1.0, cutoff=1400 if not late else 1900), t0, 0.55)
        place("bass", C.bass_note(root, BAR - 0.05, attack=0.2, release=0.3), t0, 0.35)
        for s in range(8):
            m = tones[[0, 2, 1, 3, 2, 1, 3, 2][s]] + 12
            place("pluck", pluck(m, 0.6, 0.18), t0 + s * BEAT / 2, 0.16 + 0.08 * late, pan=(-0.4, 0.4)[s % 2])
        place("drums", stomp_s * 0.55, t0, 0.5)
        duck(t0, 0.5)
        if late:
            place("drums", stomp_s * 0.4, t0 + 2.5 * BEAT, 0.4)
            place("drums", bigclap(), t0 + BEAT * 3, 0.22)
            for s in range(8):
                place("drums", C.shaker(), t0 + s * BEAT / 2, 0.08 + 0.05 * (s % 2), pan=0.3)

    # ---------------------------------------------------------- choruses: four on the floor, pumping, huge
    kick_s = hard_kick()
    hey_s = hey()

    def chorus(t_start, bars, choir_from, intensity=1.0):
        for k in range(bars):
            t0 = t_start + k * BAR
            name, root, tones = PROG[k % 4]
            last_of_8 = k % 8 == 7
            # drums: kick on every beat, stomp layered on 1 and 3, claps + snare on 2 and 4
            for b in range(4):
                if last_of_8 and b == 3:
                    continue
                place("drums", kick_s, t0 + b * BEAT, 1.0)
                duck(t0 + b * BEAT, 0.85, 0.12)
            for b in (0, 2):
                place("drums", stomp_s, t0 + b * BEAT, 0.5)
            for b in (1, 3):
                if last_of_8 and b == 3:
                    continue
                place("drums", clap_s, t0 + b * BEAT, 0.9)
            for s in range(8):
                place("drums", C.hat(open_=(s % 2 == 1)), t0 + s * BEAT / 2, 0.22 if s % 2 else 0.1, pan=0.25)
            for s in range(16):
                place("drums", C.hat(), t0 + s * BEAT / 4, 0.05 + 0.04 * (s % 2), pan=-0.25)
            if k % 2 == 1 and not last_of_8:
                place("drums", hey_s, t0 + 3 * BEAT, 0.55)
            if last_of_8:
                # one-beat snare fill into the next phrase
                for j in range(8):
                    place("drums", clap_s, t0 + (3 + j / 8) * BEAT, 0.2 + 0.08 * j)
                place("fx", C.reverse_swell(BEAT * 1.2), t0 + 4 * BEAT - BEAT * 1.2, 0.5)
            if k % 4 == 0:
                place("fx", C.crash(2.6), t0, 0.45)
            # rolling bass: offbeat-pumped sixteenths with an octave kick on the "and"
            for s in range(16):
                m = root + (12 if s % 4 == 2 else 0)
                place("bass", dbass(m, BEAT / 4 - 0.02), t0 + s * BEAT / 4, 0.7 if s % 4 else 0.45)
            # supersaw chords: a long pad plus off-beat stabs
            place("pad", pad([n + 12 for n in tones], BAR, attack=0.01, release=0.2, cutoff=5200), t0, 0.55 * intensity)
            for s in range(4):
                place("pad", pad([n + 24 for n in tones[:3]], BEAT * 0.38, attack=0.003, release=0.08, cutoff=7000), t0 + (s + 0.5) * BEAT, 0.35 * intensity)
            # the hook, doubled an octave up, plus a choir
            for b, m, L in HOOK[k % 4]:
                place("lead", lead(m, L * BEAT * 0.92), t0 + b * BEAT, 0.7)
                place("lead", lead(m + 12, L * BEAT * 0.92), t0 + b * BEAT, 0.28)
            if k >= choir_from:
                place("choir", choir([tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[0] + 24], BAR), t0, 0.8)
        # a white-noise sweep up into each 8-bar phrase end
        for k in range(7, bars, 8):
            place("fx", C.riser(BAR, 500, 12000), t_start + k * BAR, 0.35)

    chorus(bar(0), 16, 4, intensity=1.0)

    # ---------------------------------------------------------- bridge: the breakdown (boxed in the mix)
    for k in range(16, 34):
        t0 = bar(k)
        name, root, tones = PROG[(k // 2) % 4]
        if k % 2 == 0:
            place("pad", pad(tones, 2 * BAR, attack=0.5, release=1.0, cutoff=2000), t0, 0.6)
            place("choir", choir([tones[0] + 12, tones[2] + 12], 2 * BAR, attack=0.8), t0, 0.35)
        place("bass", C.bass_note(root, BAR - 0.05, attack=0.05, release=0.2), t0, 0.45)
        for s in range(8):
            m = tones[[0, 1, 2, 3, 2, 1, 2, 3][s]] + 12
            place("pluck", pluck(m, 0.5, 0.14), t0 + s * BEAT / 2, 0.22, pan=(-0.5, 0.5)[s % 2])
        place("drums", stomp_s, t0, 0.6)
        duck(t0, 0.55)
        if k >= 20:
            place("drums", clap_s, t0 + 2 * BEAT, 0.4)
            for s in range(8):
                place("drums", C.hat(), t0 + s * BEAT / 2, 0.08, pan=0.25)

    # ---------------------------------------------------------- chorus B: the final drop to the last hit
    nb = int((END_HIT - FINAL) / BAR)
    # the beats left before the last hit: a snare roll and a riser, then the hit
    t_roll = FINAL + nb * BAR
    span = END_HIT - t_roll
    steps = int(span / (BEAT / 4))
    for j in range(steps):
        place("drums", bigclap(), t_roll + j * BEAT / 4, 0.25 + 0.55 * j / max(1, steps))
    place("fx", C.riser(span, 400, 12000), t_roll, 0.6)
    chorus(FINAL, nb, 0, intensity=1.15)
    place("fx", C.crash(3.0), FINAL, 0.5)
    # last hit: one big G minor chord ringing out
    tones = [55, 58, 62, 67, 70, 74]
    ring = END - END_HIT
    place("pad", pad(tones, ring - 1.0, attack=0.01, release=1.4, cutoff=4200), END_HIT, 0.9)
    place("choir", choir([67, 70, 74], ring - 1.0, attack=0.05), END_HIT, 0.9)
    place("bass", C.bass_note(31, ring - 0.5, attack=0.005, release=1.6), END_HIT, 0.9)
    place("drums", stomp_s, END_HIT, 1.2)
    place("drums", clap_s, END_HIT, 0.8)
    place("fx", C.crash(4.0), END_HIT, 0.7)

    # ---------------------------------------------------------- mixdown
    for k in ("bass", "pad", "choir", "pluck"):
        B[k] *= chain[None, :] ** (1.0 if k == "bass" else 0.6)
    wet = C.reverb(B["drums"] * 0.18 + B["pad"] * 0.35 + B["lead"] * 0.35 + B["choir"] * 0.6 + B["pluck"] * 0.5 + B["fx"] * 0.4, C.IR_HALL)[:, :N]
    delay = C.delay_pingpong(B["lead"], BEAT * 0.75, feedback=0.32, taps=4)[:, :N]
    mix = B["drums"] * 0.9 + B["bass"] * 0.7 + B["pad"] * 0.55 + B["lead"] * 0.62 + delay * 0.18 + B["choir"] * 0.55 + B["pluck"] * 0.5 + B["fx"] * 0.5 + wet * 0.32
    mix = np.tanh(mix * 1.15) / 1.15  # glue
    return mix


if __name__ == "__main__":
    import scipy.io.wavfile as wavfile

    m = build()
    m /= np.max(np.abs(m)) + 1e-9
    wavfile.write(os.path.join(sys.argv[1] if len(sys.argv) > 1 else ".", "score.wav"), SR, (m.T * 32767 * 0.9).astype(np.int16))
