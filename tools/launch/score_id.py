"""Original score for the launch film in an arena / stomp-rock style (no samples, no borrowed melody),
125 bpm, G minor, written straight onto the film's timeline.

  verse    the story: a low piano figure, a deep pulse, then "stomp stomp clap" growing under the voice
  chorus   half-time arena drums (kick, a huge snare + clap + stomp stack in a big room), gritty bass
           locked to the kick, fuzz power chords, piano stabs, a gang "oh-oh" chant on the hook, "hey!"
  ending   the first chorus lands on one big hit, its tail melts into a warm piano + pad breakdown
           (no filtered box, nothing sudden) that slowly grows back through the tasker section
  build    toms accelerating, a snare roll, the chant rising; the break; the final chorus; one last hit
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
rng = np.random.default_rng(31)
TL = json.load(open(os.path.join(ROOT, "src/launch/timeline.json")))
D = TL["drop"]
END = TL["end"]
N = int(END * SR)
BEAT = 0.4799
BAR = 4 * BEAT
FINAL = D + TL["finalR"]
END_HIT = D + TL["endHitR"]
BRIDGE = D + TL["bridgeR"]


def beat(k):
    return D + k * BEAT


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


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


# ------------------------------------------------------------------ instruments

def piano(m, dur, vel=1.0):
    """additive piano: slightly stretched partials, each dying faster than the one below, a hammer knock"""
    n = int((dur + 1.4) * SR)
    t = np.arange(n) / SR
    f0 = mtof(m)
    y = np.zeros(n)
    tau = 1.6 * (60 / max(m, 30)) ** 0.8
    for k in range(1, 10):
        fk = k * f0 * math.sqrt(1 + 0.00035 * k * k)
        if fk > 9000:
            break
        y += np.sin(2 * np.pi * fk * t + rng.random() * 6) * (1 / k ** 1.25) * np.exp(-t / (tau / k ** 0.55))
    hammer = C.filt(rng.standard_normal(n), "bandpass", (1800, 5200), 2) * np.exp(-t / 0.008) * 0.25
    damp = np.clip((dur + 0.25 - t) / 0.25, 0, 1) ** 2
    return (y * (0.35 + 0.65 * vel) + hammer * vel) * damp * np.clip(t / 0.002, 0, 1) * 0.5


def chord_piano(notes, dur, vel=1.0):
    out = np.zeros((2, int((dur + 1.4) * SR)))
    for m in notes:
        out += C.stereo(piano(m, dur, vel), (m - 60) / 30)
    return out / max(1, len(notes)) * 1.6


def fuzz(root, dur, gain=1.0):
    """a distorted power chord, double-tracked left and right like two guitars"""
    n = int((dur + 0.12) * SR)
    out = np.zeros((2, n))
    for pan, det in ((-0.75, -0.004), (0.75, 0.0045)):
        x = sum(fsaw(mtof(m) * (1 + det), n, rng.random()) for m in (root, root + 7, root + 12))
        x = np.tanh(x * 3.2)
        x = C.filt(C.filt(x, "lowpass", 2600, 2), "highpass", 110, 2)
        out += C.stereo(x, pan)
    return out * adsr(n, 0.004, 0.25, 0.75, 0.08)[None, :] * 0.32 * gain


def dist_bass(m, dur):
    n = int((dur + 0.03) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    y = fsaw(f, n) + 0.7 * fsaw(f * 1.005, n, 0.37)
    y = np.tanh(C.filt(y, "lowpass", 1400, 2) * 3.0) * 0.55 + np.sin(2 * np.pi * f * t) * 0.6
    return y * adsr(n, 0.003, 0.18, 0.75, 0.03)


def chant(notes, dur, vowel="oh", attack=0.03, voices=7):
    """a gang of voices: detuned, breathy, through vowel formants"""
    F = {"oh": [(420, 600, 1.0), (760, 960, 0.6), (2500, 2900, 0.12)], "ah": [(650, 900, 1.0), (1050, 1350, 0.55), (2500, 2900, 0.12)], "ey": [(420, 640, 0.9), (1750, 2250, 0.65), (2550, 3050, 0.25)]}[vowel]
    n = int((dur + 0.5) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        for v in range(voices):
            vib = 1 + 0.007 * np.sin(2 * np.pi * (4.6 + 0.5 * rng.random()) * t + v) * np.clip((t - 0.12) / 0.2, 0, 1)
            x = fsaw(mtof(m) * (1 + (rng.random() - 0.5) * 0.018) * vib, n, rng.random()) + 0.18 * rng.standard_normal(n)
            d = int(rng.uniform(0, 0.025) * SR)
            x = np.concatenate([np.zeros(d), x[: n - d]])
            out += C.stereo(x, (v / (voices - 1)) * 1.6 - 0.8)
    y = np.stack([sum(C.filt(out[c], "bandpass", (lo, hi), 2) * g for lo, hi, g in F) for c in range(2)])
    env = adsr(n, attack, 0.5, 0.85, 0.35)
    return y * env[None, :] / (len(notes) * voices) * 5.0


def pad(notes, dur, attack=1.0, release=1.6, cutoff=2200):
    n = int((dur + release) * SR)
    out = np.zeros((2, n))
    for m in notes:
        for pan, det in ((-0.7, -0.005), (0.0, 0.0), (0.7, 0.005)):
            out += C.stereo(fsaw(mtof(m) * (1 + det), n, rng.random()), pan)
    out = np.stack([C.filt(out[c], "lowpass", cutoff, 2) for c in range(2)])
    return out * adsr(n, attack, 1.0, 0.9, release)[None, :] / (len(notes) * 3) * 2


def kick():
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    f = 42 + 150 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.32)
    beater = C.filt(rng.standard_normal(n), "bandpass", (1800, 6000), 2) * np.exp(-t / 0.004) * 0.45
    return np.tanh((body * 1.4 + beater) * 1.7) * 0.9


def stomp():
    n = int(0.8 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (48 + 60 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.3)
    thud = C.filt(rng.standard_normal(n), "lowpass", 380, 2) * np.exp(-t / 0.07)
    boards = C.filt(rng.standard_normal(n), "bandpass", (500, 1800), 2) * np.exp(-t / 0.03) * 0.5
    return np.tanh((body + thud + boards) * 1.5)


def snare_stack():
    """the arena backbeat: snare, a wall of claps and a stomp, all at once"""
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    snare = C.filt(rng.standard_normal(n), "bandpass", (150, 6000), 2) * np.exp(-t / 0.14) * 0.9
    tone = np.sin(2 * np.pi * (185 + 40 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.08) * 0.6
    claps = np.zeros(n)
    for _ in range(5):
        c = C.clap()
        d = int(rng.uniform(0, 0.018) * SR)
        m = min(n - d, len(c))
        claps[d : d + m] += c[:m] * rng.uniform(0.6, 1.0)
    s = np.pad(stomp(), (0, n))[:n] * 0.5
    return np.tanh((snare + tone + claps * 0.55 + s) * 1.3)


def tom(m, decay=0.32):
    n = int(0.8 * SR)
    t = np.arange(n) / SR
    f = mtof(m) * (1 + 0.5 * np.exp(-t / 0.035))
    skin = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)
    hit = C.filt(rng.standard_normal(n), "lowpass", 2200) * np.exp(-t / 0.015) * 0.5
    return np.tanh((skin + hit) * 1.6) * 0.85


def hey():
    n = int(0.5 * SR)
    y = chant([57], 0.18, vowel="ey", attack=0.006, voices=9)
    y = y[:, :n] if y.shape[1] >= n else np.pad(y, ((0, 0), (0, n - y.shape[1])))
    t = np.arange(n) / SR
    return np.tanh(y * np.exp(-t / 0.13)[None, :] * 3.0) * 0.8


# ------------------------------------------------------------------ harmony + hook (original)
PROG = [(43, [55, 58, 62]), (39, [55, 58, 63]), (46, [53, 58, 62]), (41, [53, 57, 60])]  # Gm Eb Bb F
HOOK = [
    [(0, 62, 0.5), (0.5, 62, 0.5), (1, 65, 1.0), (2, 62, 0.5), (2.5, 60, 0.5), (3, 58, 1.0)],
    [(0, 58, 0.5), (0.5, 58, 0.5), (1, 60, 1.0), (2, 58, 0.5), (2.5, 55, 1.5)],
    [(0, 62, 0.5), (0.5, 62, 0.5), (1, 65, 1.0), (2, 67, 0.5), (2.5, 65, 0.5), (3, 62, 1.0)],
    [(0, 60, 0.5), (0.5, 62, 0.5), (1, 60, 1.0), (2, 57, 2.0)],
]
ARP = [0, 2, 1, 2, 0, 2, 1, 2]


def build(marks=None):
    B = {k: np.zeros((2, N)) for k in ("drums", "room", "bass", "keys", "fuzz", "pad", "chant", "fx")}
    chain = np.ones(N)
    K, S, ST = kick(), snare_stack(), stomp()
    HEY = hey()
    SUS = marks["suspense"] if marks else 91.7
    BRK = marks["brk"] if marks else 97.03

    def place(bus, x, at, g=1.0, pan=0.0):
        if at < 0 or at >= END:
            return
        C.place(B[bus], x if x.ndim == 2 else C.stereo(x, pan), at, g)

    def duck(at, depth=0.7, tau=0.12):
        i = int(at * SR)
        if i >= N or i < 0:
            return
        dip = 1 - depth * np.exp(-np.arange(int(0.4 * SR)) / SR / tau)
        j = min(N, i + len(dip))
        chain[i:j] = np.minimum(chain[i:j], dip[: j - i])

    def drum(x, at, g=1.0, room=0.0, pan=0.0):
        place("drums", x, at, g, pan)
        if room:
            place("room", x, at, g * room, pan)

    # ---------------------------------------------------------- verse: the story
    place("fx", C.reverse_swell(2.2), 0.0, 0.22)
    nb0 = int(math.floor(D / BAR))
    for k in range(-nb0, 0):
        t0 = D + k * BAR
        if t0 < 0.3:
            continue
        root, tones = PROG[(k + 100) % 4]
        x = (k + nb0) / nb0  # 0 → 1 across the verse
        # low piano figure in eighths, the bass note under it
        for e in range(8):
            m = tones[ARP[e]] - 12 + (12 if e in (3, 7) and x > 0.5 else 0)
            place("keys", chord_piano([m], BEAT / 2 * 0.9, 0.55 + 0.25 * x), t0 + e * BEAT / 2, 0.42 + 0.2 * x)
        place("bass", dist_bass(root, BAR * 0.95) * 0.5, t0, 0.35 + 0.25 * x)
        place("pad", pad([root + 12, tones[0], tones[1]], BAR, attack=0.8, release=0.8, cutoff=900 + 900 * x), t0, 0.35)
        # stomp ... then stomp stomp clap
        drum(ST, t0, 0.45 + 0.35 * x, 0.25)
        duck(t0, 0.35)
        if x > 0.25:
            drum(ST, t0 + BEAT, 0.4 + 0.35 * x, 0.25)
            drum(S, t0 + 2 * BEAT, 0.25 + 0.4 * x, 0.5)
        if x > 0.55:
            drum(ST, t0 + 2.5 * BEAT, 0.25 + 0.3 * x, 0.2)
            for s in range(8):
                drum(C.shaker(), t0 + s * BEAT / 2, 0.06 + 0.04 * (s % 2), pan=0.3)
        if x > 0.55 and (k % 4) == 3:
            for j, m in enumerate((50, 47, 43, 40)):
                drum(tom(m), t0 + (3 + j / 4) * BEAT, 0.35 + 0.2 * x, 0.35)
        if x > 0.6:
            place("chant", chant([tones[0], tones[1] + 12], BAR * 0.95, attack=0.4), t0, 0.12 + 0.15 * x)

    # ---------------------------------------------------------- the chorus
    def chorus(b0, bars, bigger=1.0, hit_at=None):
        for bar_i in range(bars):
            t0 = beat(b0 + bar_i * 4)
            if hit_at is not None and t0 >= hit_at - 0.01:
                break
            root, tones = PROG[bar_i % 4]
            phrase_end = bar_i % 4 == 3
            # half-time arena drums
            for e in (0, 3, 4):
                drum(K, t0 + e * BEAT / 2, 1.0 if e != 3 else 0.75)
                duck(t0 + e * BEAT / 2, 0.75)
            drum(ST, t0, 0.7, 0.35)
            drum(ST, t0 + 2 * BEAT, 0.6, 0.35)
            for e in (2, 6):
                if phrase_end and e == 6:
                    continue
                drum(S, t0 + e * BEAT / 2, 1.0 * bigger, 0.75)
            for s in range(8):
                drum(C.hat(open_=(s % 4 == 2)), t0 + s * BEAT / 2, 0.08 if s % 2 else 0.05, pan=0.3)
            if bar_i % 2 == 1 and not phrase_end:
                place("chant", HEY, t0 + 3.5 * BEAT, 0.55 * bigger)
            if phrase_end:
                for j, m in enumerate((52, 50, 47, 45, 43, 40, 38, 36)):
                    drum(tom(m), t0 + (2 + j / 4) * BEAT, 0.55 + 0.05 * j, 0.45)
            if bar_i % 4 == 0:
                place("fx", C.crash(2.8), t0, 0.42 * bigger)
            # bass locked to the kick, an octave push before the backbeat
            for e, L, oc in ((0, 1.4, 0), (3, 0.45, 0), (4, 1.4, 0), (7, 0.45, 12)):
                place("bass", dist_bass(root + oc, L * BEAT * 0.95), t0 + e * BEAT / 2, 0.75)
            # fuzz power chords, piano stabs
            place("fuzz", fuzz(root + 12, BAR * 0.96, bigger), t0, 0.6)
            for e in (0, 3, 4, 7):
                place("keys", chord_piano([n + 12 for n in tones], BEAT * 0.35, 0.9), t0 + e * BEAT / 2, 0.28)
            # the gang chant carries the hook
            for b, m, L in HOOK[bar_i % 4]:
                place("chant", chant([m, m - 12], L * BEAT * 0.95, vowel="oh"), t0 + b * BEAT, 0.62 * bigger)
            place("pad", pad([n + 12 for n in tones], BAR, attack=0.05, release=0.3, cutoff=3800), t0, 0.32 * bigger)

    k_hit = int(round((BRIDGE - D) / BEAT)) - 1  # the last beat before the bridge (lands just ahead of the cut)
    hit = beat(k_hit)
    chorus(0, 40, 1.0, hit_at=hit)
    # the one-bar run-up into the hit: toms, a riser
    for j in range(8):
        drum(tom((52, 50, 48, 47, 45, 43, 41, 40)[j]), hit - BEAT * 2 + j * BEAT / 4, 0.6 + 0.05 * j, 0.5)
    place("fx", C.riser(BEAT * 2, 600, 9000), hit - BEAT * 2, 0.3)
    # the hit — and its tail turns into the breakdown
    drum(K, hit, 1.1)
    drum(ST, hit, 1.0, 0.8)
    drum(S, hit, 1.0, 1.2)
    place("fx", C.crash(4.2), hit, 0.6)
    place("chant", chant([55, 62, 67], 1.6, vowel="oh", attack=0.01), hit, 0.6)
    place("bass", dist_bass(31, 1.4), hit, 0.8)
    place("fuzz", fuzz(43, 1.2), hit, 0.6)

    # ---------------------------------------------------------- breakdown: warm, slow, nothing sudden
    t = hit + BEAT
    place("pad", pad([43, 50, 55, 58, 62], SUS - t + 0.5, attack=2.0, release=1.5, cutoff=1700), t - 0.4, 0.8)
    kb0 = int(math.ceil((hit + BEAT * 2 - D) / BAR))
    kb1 = int((SUS - D) / BAR)
    for kb in range(kb0, kb1 + 1):
        t0 = D + kb * BAR
        if t0 >= SUS - 0.05:
            break
        root, tones = PROG[(kb // 2) % 4]
        x = (t0 - hit) / max(1e-3, SUS - hit)
        # piano: single notes first, then the figure in eighths
        if x < 0.2:
            for e in (0, 3, 6):
                place("keys", chord_piano([tones[ARP[e]]], BEAT * 0.9, 0.5), t0 + e * BEAT / 2, 0.45)
        else:
            for e in range(8):
                place("keys", chord_piano([tones[ARP[e]]], BEAT / 2 * 0.9, 0.55 + 0.3 * x), t0 + e * BEAT / 2, 0.42)
        place("bass", dist_bass(root, BAR * 0.95) * 0.45, t0, 0.3 + 0.3 * x)
        if x > 0.25:
            drum(ST, t0, 0.35 + 0.4 * x, 0.3)
            duck(t0, 0.3)
        if x > 0.45:
            drum(ST, t0 + BEAT, 0.3 + 0.4 * x, 0.3)
            drum(S, t0 + 2 * BEAT, 0.2 + 0.5 * x, 0.6)
        if x > 0.75:
            drum(K, t0 + 2.5 * BEAT, 0.4 + 0.3 * x)
            place("chant", chant([tones[0], tones[1] + 12], BAR * 0.95, attack=0.35), t0, 0.18 + 0.2 * x)

    # ---------------------------------------------------------- the build: toms accelerating, the chant rising
    kb = int(math.ceil((SUS - D) / BEAT - 1e-6))
    ke = int((BRK - D) / BEAT)
    nbt = max(1, ke - kb)
    for j in range(nbt):
        tb = D + (kb + j) * BEAT
        x = j / nbt
        div = 1 if x < 0.3 else 2 if x < 0.6 else 4
        for q in range(div):
            drum(tom(45 if q % 2 == 0 else 40), tb + q * BEAT / div, 0.5 + 0.45 * x, 0.4)
            drum(K, tb + q * BEAT / div, 0.4 + 0.5 * x)
            duck(tb + q * BEAT / div, 0.55, 0.08)
        sd = 2 if x < 0.5 else 4
        for q in range(sd):
            drum(S, tb + q * BEAT / sd, 0.12 + 0.5 * x, 0.3)
        place("bass", dist_bass(31 + (12 if x > 0.75 else 0), BEAT * 0.9), tb, 0.5 + 0.3 * x)
    span = BRK - (D + kb * BEAT)
    place("fx", C.riser(span, 220, 13000), D + kb * BEAT, 0.6)
    for i, m in enumerate((55, 58, 62, 65, 67)):
        place("chant", chant([m, m + 7], span / 5 * 1.05, vowel="ah", attack=0.25), D + kb * BEAT + i * span / 5, 0.25 + 0.08 * i)

    # ---------------------------------------------------------- final chorus to the last hit
    kf = int(round((FINAL - D) / BEAT))
    nbar = int((END_HIT - FINAL) / BAR)
    chorus(kf, nbar, 1.18)
    t_roll = FINAL + nbar * BAR
    steps = int((END_HIT - t_roll) / (BEAT / 4))
    for j in range(steps):
        drum(tom((52, 48, 45, 40)[j % 4]), t_roll + j * BEAT / 4, 0.45 + 0.5 * j / max(1, steps), 0.4)
    place("fx", C.riser(END_HIT - t_roll, 400, 12000), t_roll, 0.55)
    place("fx", C.crash(3.0), FINAL, 0.55)
    ring = END - END_HIT
    drum(K, END_HIT, 1.2)
    drum(ST, END_HIT, 1.2, 1.0)
    drum(S, END_HIT, 1.0, 1.4)
    place("fx", C.crash(4.0), END_HIT, 0.7)
    place("fuzz", fuzz(43, ring - 0.8, 1.1), END_HIT, 0.7)
    place("chant", chant([55, 58, 62, 67], ring - 0.8, vowel="oh", attack=0.02), END_HIT, 0.8)
    place("pad", pad([43, 55, 58, 62, 67], ring - 0.6, attack=0.01, release=1.5, cutoff=4200), END_HIT, 0.7)
    place("bass", dist_bass(31, ring - 0.4), END_HIT, 0.8)

    # ---------------------------------------------------------- mixdown
    for k in ("bass", "pad", "fuzz", "keys", "chant"):
        B[k] *= chain[None, :] ** (1.0 if k == "bass" else 0.55)
    room = C.reverb(B["room"], C.IR_HALL)[:, :N]
    wet = C.reverb(B["keys"] * 0.45 + B["chant"] * 0.6 + B["pad"] * 0.35 + B["fx"] * 0.4 + B["fuzz"] * 0.12, C.IR_HALL)[:, :N]
    drums = np.tanh((B["drums"] + room * 0.55) * 1.25) / 1.25
    mix = drums * 1.0 + B["bass"] * 0.62 + B["fuzz"] * 0.55 + B["keys"] * 0.55 + B["pad"] * 0.45 + B["chant"] * 0.6 + B["fx"] * 0.45 + wet * 0.3
    mix = np.stack([C.filt(mix[c], "highpass", 32, 2) for c in range(2)])
    mix = np.tanh(mix * 1.1) / 1.1
    return mix


if __name__ == "__main__":
    import scipy.io.wavfile as wavfile

    m = build()
    m /= np.max(np.abs(m)) + 1e-9
    wavfile.write(os.path.join(sys.argv[1] if len(sys.argv) > 1 else ".", "score_id.wav"), SR, (m.T * 32767 * 0.9).astype(np.int16))
