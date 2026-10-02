"""
Builds the soundtrack for the HandlyExplainer composition:
  * an original score (synthesised here, 110 BPM): soft minor-ish intro under the "problem",
    a lift with drums when the app appears, a breakdown + riser, and an impact on the logo
  * sound effects synced to the on-screen animation (whooshes, calendar flips, UI pops,
    typing, taps, success chimes, radar pings, glitch cut, logo hit)
  * the provided ElevenLabs voiceover, with the music side-chain ducked under it
  * a simple master (loudness to ~-14 LUFS, peak limited)

Event times mirror src/explainer/timing.ts and the scene files (frames at 30 fps).

usage: python3 tools/audio/compose.py  (writes public/audio/explainer-mix.mp3)
"""

import math
import os
import subprocess
import tempfile

import numpy as np
import pyloudnorm as pyln
import scipy.io.wavfile as wavfile
from scipy import signal

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SR = 44100
FPS = 30
DUR = 870 / FPS
N = int(DUR * SR)
VO_OFFSET = 0.4

rng = np.random.default_rng(7)


def f(sec):
    """Voiceover seconds → frame (same rounding as JS Math.round)."""
    return math.floor((sec + VO_OFFSET) * FPS + 0.5)


def fr(frame):
    return frame / FPS


# ----------------------------------------------------------------------------- dsp helpers

def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def stereo(x, pan=0.0):
    """Equal-power pan, pan in [-1, 1]."""
    a = (pan + 1) * math.pi / 4
    return np.stack([x * math.cos(a), x * math.sin(a)])


def stereo_sweep(x, pan_from, pan_to):
    p = np.linspace(pan_from, pan_to, len(x))
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


def place(bus, x, at_sec, gain=1.0):
    """Mix a stereo (2, n) or mono (n,) clip into a stereo bus at time `at_sec`."""
    if x.ndim == 1:
        x = stereo(x)
    i = int(round(at_sec * SR))
    if i < 0:
        x = x[:, -i:]
        i = 0
    n = min(x.shape[1], bus.shape[1] - i)
    if n > 0:
        bus[:, i:i + n] += x[:, :n] * gain


def sos(kind, fc, order=2, q=None):
    if kind == "bandpass":
        lo, hi = fc
        return signal.butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")
    return signal.butter(order, fc, btype=kind, fs=SR, output="sos")


def filt(x, kind, fc, order=2):
    return signal.sosfilt(sos(kind, fc, order), x, axis=-1)


def swept(x, kind, fcs, block=256, order=2):
    """Time-varying Butterworth filter; fcs gives the cutoff (or (lo, hi)) per block."""
    out = np.zeros_like(x)
    zi = None
    nb = int(math.ceil(len(x) / block))
    for b in range(nb):
        fc = fcs[min(b, len(fcs) - 1)]
        s = sos(kind, fc, order)
        if zi is None or zi.shape[0] != s.shape[0]:
            zi = np.zeros((s.shape[0], 2))
        seg = x[b * block:(b + 1) * block]
        y, zi = signal.sosfilt(s, seg, zi=zi)
        out[b * block:(b + 1) * block] = y
    return out


def env_ad(n, attack, decay_tau):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(0, t - attack) / decay_tau)


def env_asr(n, attack, release):
    t = np.arange(n) / SR
    dur = n / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    r = np.clip((dur - t) / max(release, 1e-4), 0, 1)
    return np.minimum(a, r) ** 1.4


def make_ir(seconds=2.4, tau=0.55, seed=3, damp=5200):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = []
    for ch in range(2):
        noise = r.standard_normal(n) * np.exp(-t / tau)
        noise = filt(noise, "lowpass", damp, 1)
        noise[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir.append(noise / np.sqrt(np.sum(noise ** 2)))
    return np.stack(ir)


IR_HALL = make_ir(2.6, 0.62)
IR_ROOM = make_ir(1.0, 0.22, seed=5, damp=7000)


def reverb(x, ir=IR_HALL):
    if x.ndim == 1:
        x = stereo(x)
    out = np.stack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])
    return out


def delay_pingpong(x, time_s, feedback=0.42, taps=5):
    if x.ndim == 1:
        x = stereo(x)
    out = x.copy()
    d = int(time_s * SR)
    g = 1.0
    for k in range(1, taps + 1):
        g *= feedback
        src = x[[1, 0]] if k % 2 else x
        shifted = np.zeros_like(x)
        shifted[:, d * k:] = src[:, : x.shape[1] - d * k]
        out += filt(shifted, "lowpass", 4200, 1) * g
    return out


def saw(freq, n, harmonics=18, phase=0.0):
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k in range(1, harmonics + 1):
        if freq * k > SR / 2 - 1000:
            break
        y += np.sin(2 * np.pi * freq * k * t + phase * k) / k
    return y


# ----------------------------------------------------------------------------- instruments

def pad_chord(notes, dur, attack=0.6, release=1.0, detune_cents=7.0):
    n = int(dur * SR)
    out = np.zeros((2, n))
    for m in notes:
        base = midi(m)
        for ch in range(2):
            v = np.zeros(n)
            for d in (-detune_cents, 0.0, detune_cents):
                cents = d + (2.5 if ch else -2.5)
                v += saw(base * 2 ** (cents / 1200), n, harmonics=14, phase=rng.uniform(0, 6.28))
            out[ch] += v / 3
    out *= env_asr(n, attack, release)
    return out / max(1, len(notes))


def pluck(m, dur=0.9, tau=0.22, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fq = midi(m)
    y = (np.sin(2 * np.pi * fq * t)
         + 0.42 * bright * np.sin(2 * np.pi * 2 * fq * t) * np.exp(-t / (tau * 0.5))
         + 0.18 * bright * np.sin(2 * np.pi * 3 * fq * t) * np.exp(-t / (tau * 0.35))
         + 0.07 * bright * np.sin(2 * np.pi * 4.01 * fq * t) * np.exp(-t / (tau * 0.25)))
    return y * env_ad(n, 0.004, tau)


def bass_note(m, dur, attack=0.012, release=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fq = midi(m)
    y = np.sin(2 * np.pi * fq * t) + 0.22 * np.sin(2 * np.pi * 2 * fq * t) + 0.06 * np.sin(2 * np.pi * 3 * fq * t)
    return y * env_asr(n, attack, release)


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    fq = 46 + 115 * np.exp(-t / 0.032)
    ph = 2 * np.pi * np.cumsum(fq) / SR
    body = np.sin(ph) * np.exp(-t / 0.24)
    click = filt(rng.standard_normal(n) * np.exp(-t / 0.0025), "highpass", 1500) * 0.25
    return (body + click) * 0.95


def clap():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    e = np.zeros(n)
    for k, off in enumerate((0.0, 0.011, 0.022)):
        e += np.exp(-np.maximum(0, t - off) / 0.006) * (t >= off) * (0.8 if k < 2 else 1.0)
    e += 0.55 * np.exp(-np.maximum(0, t - 0.022) / 0.11) * (t >= 0.022)
    y = filt(noise * e, "bandpass", (900, 5200), 2)
    return y * 0.9


def hat(open_=False):
    n = int((0.35 if open_ else 0.09) * SR)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "highpass", 7200, 2) * np.exp(-t / (0.11 if open_ else 0.022))
    return y * 0.5


def shaker():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    e = np.clip(t / 0.02, 0, 1) * np.exp(-t / 0.035)
    return filt(rng.standard_normal(n), "bandpass", (4500, 11000), 2) * e * 0.5


def crash(dur=2.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "highpass", 4200, 2) * np.exp(-t / 0.9)
    metal = sum(np.sin(2 * np.pi * fq * t + rng.uniform(0, 6)) for fq in (3170, 4610, 5890, 7350)) * 0.04 * np.exp(-t / 0.7)
    return (y + metal) * 0.45


def reverse_swell(dur=1.6):
    x = crash(dur)[::-1]
    t = np.arange(len(x)) / SR
    return x * (t / dur) ** 1.5


def riser(dur, f0=280, f1=6500, gain=1.0):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    nb = int(math.ceil(n / 256))
    k = np.linspace(0, 1, nb) ** 1.8
    centers = f0 * (f1 / f0) ** k
    bands = [(max(40, c * 0.75), min(SR / 2 - 500, c * 1.3)) for c in centers]
    y = swept(noise, "bandpass", bands)
    t = np.arange(n) / SR
    tone_f = 180 * (2 ** (3 * (t / dur) ** 1.6))
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * 0.12
    e = (t / dur) ** 2.2
    return (y * 1.2 + tone) * e * gain


def bell(m, dur=2.4, ratio=3.5, index=2.2, tau=1.1):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fc = midi(m)
    I = index * np.exp(-t / 0.35)
    y = np.sin(2 * np.pi * fc * t + I * np.sin(2 * np.pi * fc * ratio * t))
    return y * env_ad(n, 0.002, tau)


def sub_drop(dur=1.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fq = 34 + 40 * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.exp(-t / 0.75) * np.clip(t / 0.004, 0, 1)


# ----------------------------------------------------------------------------- sfx

def whoosh(dur=0.5, f_lo=350, f_hi=3800, peak=0.62, pan=(0.6, -0.6), air=1.0, low=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = t / dur
    noise = rng.standard_normal(n)
    nb = int(math.ceil(n / 256))
    xb = np.linspace(0, 1, nb)
    shape = np.where(xb < peak, xb / peak, 1 - (xb - peak) / (1 - peak))
    centers = f_lo * (f_hi / f_lo) ** shape
    bands = [(max(60, c * 0.55), min(SR / 2 - 500, c * 1.6)) for c in centers]
    y = swept(noise, "bandpass", bands) * air
    if low > 0:
        y += filt(noise, "lowpass", 220, 2) * low
    e = np.where(x < peak, (x / peak) ** 2.2, np.exp(-(x - peak) / (1 - peak) * 4.2))
    y *= e
    return stereo_sweep(y / (np.max(np.abs(y)) + 1e-9), pan[0], pan[1])


def flip():
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "bandpass", (1800, 6500), 2) * np.exp(-t / 0.014)
    thump = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.02) * 0.5
    return y + thump


def tick(fq=2300):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * fq * t) * np.exp(-t / 0.012) + filt(rng.standard_normal(n), "highpass", 3000) * np.exp(-t / 0.002) * 0.4


def pop_sfx(f0=950, f1=520, dur=0.11):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fq = f1 + (f0 - f1) * np.exp(-t / 0.018)
    y = np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.exp(-t / 0.045) * np.clip(t / 0.002, 0, 1)
    return y


def key_click():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "bandpass", (2500, 9000), 2) * np.exp(-t / 0.004)
    y += np.sin(2 * np.pi * rng.uniform(260, 340) * t) * np.exp(-t / 0.008) * 0.35
    return y


def tap():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * (150 + 120 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.035)
    y += filt(rng.standard_normal(n), "bandpass", (1500, 5000)) * np.exp(-t / 0.003) * 0.5
    return y


def chime(notes, gap=0.085, tau=0.6):
    out = np.zeros(int((gap * len(notes) + 1.6) * SR))
    for i, m in enumerate(notes):
        b = bell(m, 1.5, ratio=2.0, index=0.9, tau=tau) * (0.8 if i == 0 else 1.0)
        i0 = int(i * gap * SR)
        out[i0:i0 + len(b)] += b[: len(out) - i0]
    return out


def sonar(fq=1180):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * fq * (1 - 0.02 * t) * t) * np.exp(-t / 0.32) * np.clip(t / 0.003, 0, 1)
    y += 0.3 * np.sin(2 * np.pi * fq * 2.01 * t) * np.exp(-t / 0.12)
    return y


def glitch(dur=0.36):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = rng.standard_normal(n)
    hold = 14
    y = np.repeat(y[::hold], hold)[:n]
    gate = (rng.random(n // 600 + 1) > 0.35).repeat(600)[:n]
    tone = np.sign(np.sin(2 * np.pi * (900 - 600 * t / dur) * t)) * 0.4
    y = (y * 0.6 + tone) * gate
    y = filt(y, "bandpass", (300, 7000), 2)
    return y * np.exp(-t / (dur * 0.6)) * np.clip(t / 0.005, 0, 1)


# ----------------------------------------------------------------------------- score

BPM = 110
BEAT = 60 / BPM
BAR = 4 * BEAT
LIFT = 10.0
HIT = LIFT + 7 * BAR  # = frame 758 (logo lands)


def bar_t(k):
    return LIFT + k * BAR


CHORDS = {
    "Am9": (45, [57, 60, 64, 67, 71]),
    "Fmaj7": (41, [53, 57, 60, 64]),
    "Gsus": (43, [55, 60, 62, 67]),
    "G": (43, [55, 59, 62, 67]),
    "Cadd9": (48, [55, 60, 64, 74]),
    "C": (48, [55, 60, 64, 67]),
    "Am7": (45, [57, 60, 64, 67]),
}

INTRO = ["Am9", "Fmaj7", "Am9", "G"]  # bars -4 .. -1
MAIN = ["Cadd9", "G", "Am7", "Fmaj7", "Cadd9", "G"]  # bars 0 .. 5
BREAK = "Fmaj7"  # bar 6


def build_music():
    pad = np.zeros((2, N))
    plk = np.zeros((2, N))
    bass = np.zeros((2, N))
    drums = np.zeros((2, N))
    fx = np.zeros((2, N))

    # pad: swell in on the intro chord, then one chord per bar
    place(pad, pad_chord(CHORDS["Am9"][1], bar_t(-4) + 0.25, attack=0.45, release=0.4), 0.0, 0.9)
    for k, name in enumerate(INTRO):
        place(pad, pad_chord(CHORDS[name][1], BAR + 0.5, attack=0.35, release=0.6), bar_t(k - 4))
    for k, name in enumerate(MAIN):
        place(pad, pad_chord(CHORDS[name][1], BAR + 0.5, attack=0.15, release=0.5), bar_t(k), 1.1)
    place(pad, pad_chord(CHORDS[BREAK][1], BAR + 0.3, attack=0.25, release=0.2), bar_t(6), 1.15)
    place(pad, pad_chord([48, 55, 60, 64, 67, 72], DUR - HIT, attack=0.01, release=2.2), HIT, 1.5)

    # pad filter: muffled under the problem, opens at the lift, sweeps up through the riser
    nb = int(math.ceil(N / 256))
    tb = np.arange(nb) * 256 / SR
    cut = np.interp(tb, [0, LIFT - 0.4, LIFT, bar_t(6), HIT - 0.05, HIT, DUR], [700, 1100, 2600, 2600, 6000, 3400, 2000])
    pad = np.stack([swept(pad[c], "lowpass", cut) for c in range(2)])

    # plucks: sparse in the intro, arpeggiated after the lift
    for k, name in enumerate(INTRO):
        tones = CHORDS[name][1]
        for b, idx in enumerate((0, 2, 1, 3)):
            place(plk, stereo(pluck(tones[idx] + 12, 1.2, tau=0.3, bright=0.6), (-0.3, 0.3)[b % 2]), bar_t(k - 4) + b * BEAT, 0.5)
    pattern = (0, 2, 3, 1, 2, 3, 1, 2)
    for k, name in enumerate(MAIN):
        tones = CHORDS[name][1]
        for s, idx in enumerate(pattern):
            m = tones[idx % len(tones)] + 12
            place(plk, stereo(pluck(m, 0.6, tau=0.17), (-0.45, 0.45)[s % 2]), bar_t(k) + s * BEAT / 2, 0.55 if s % 2 else 0.7)
    plk = delay_pingpong(plk, BEAT * 0.75, feedback=0.38, taps=4)

    # bass
    for k, name in enumerate(INTRO):
        place(bass, bass_note(CHORDS[name][0], BAR - 0.05, attack=0.25, release=0.4), bar_t(k - 4), 0.55)
    for k, name in enumerate(MAIN):
        root = CHORDS[name][0]
        for s in range(8):
            place(bass, bass_note(root + (12 if s in (3, 7) else 0), BEAT / 2 - 0.02), bar_t(k) + s * BEAT / 2, 0.75)
    place(bass, bass_note(CHORDS[BREAK][0], BAR, attack=0.1, release=0.3), bar_t(6), 0.45)
    place(bass, bass_note(36, DUR - HIT, attack=0.005, release=2.0), HIT, 0.7)

    # drums: shaker builds in the intro, half-time groove after the lift
    for k in (-2, -1):
        for s in range(8):
            place(drums, stereo(shaker(), 0.25 if s % 2 else -0.15), bar_t(k) + s * BEAT / 2, 0.22 + 0.12 * (s % 2) + (0.08 if k == -1 else 0))
    sidechain = np.ones(N)
    for k in range(6):
        t0 = bar_t(k)
        for beat in (0, 2):
            place(drums, kick(), t0 + beat * BEAT, 0.9)
            i = int((t0 + beat * BEAT) * SR)
            dip = 1 - 0.55 * np.exp(-np.arange(int(0.25 * SR)) / SR / 0.07)
            sidechain[i:i + len(dip)] = np.minimum(sidechain[i:i + len(dip)], dip[: N - i])
        if k % 2 == 1:
            place(drums, kick(), t0 + 3.5 * BEAT, 0.55)
        for beat in (1, 3):
            place(drums, stereo(clap(), 0.05), t0 + beat * BEAT, 0.55)
        for s in range(8):
            place(drums, stereo(hat(open_=(s == 7 and k % 2 == 1)), 0.3), t0 + s * BEAT / 2, 0.42 if s % 2 else 0.22)
    # snare roll into the hit
    roll_t = bar_t(6) + 2 * BEAT
    n_roll = 16
    for i in range(n_roll):
        tt = roll_t + (2 * BEAT) * (i / n_roll) ** 0.85
        place(drums, stereo(clap(), 0.0), tt, 0.12 + 0.35 * (i / n_roll) ** 1.5)

    # transitions / impacts in the score
    place(fx, reverse_swell(1.4), LIFT - 1.4, 0.55)
    place(fx, stereo(crash(), -0.2), LIFT, 0.35)
    place(fx, stereo(riser(1.9, 300, 5000, 0.6), 0.0), LIFT - 1.9, 0.45)
    place(fx, stereo(riser(BAR, 250, 7500, 1.0), 0.0), bar_t(6), 0.6)
    place(fx, reverse_swell(1.8), HIT - 1.8, 0.7)
    place(fx, stereo(sub_drop(2.6), 0.0), HIT, 0.95)
    place(fx, stereo(crash(3.2), 0.0), HIT, 0.55)
    for m, g in ((72, 0.32), (76, 0.24), (79, 0.22), (84, 0.16)):
        place(fx, stereo(bell(m, 3.2, ratio=3.5, index=1.6, tau=1.4), 0.0), HIT, g)

    pad *= sidechain[None, :] ** 0.6
    plk *= sidechain[None, :] ** 0.4
    bass *= sidechain[None, :]

    wet = reverb(pad * 0.5 + plk * 0.6 + drums * 0.12 + fx * 0.5, IR_HALL)
    music = pad * 0.55 + plk * 0.42 + bass * 0.5 + drums * 0.55 + fx * 0.6 + wet * 0.32
    # gentle tail fade
    fade = np.clip((DUR - np.arange(N) / SR) / 1.4, 0, 1) ** 1.5
    return music * fade[None, :]


# ----------------------------------------------------------------------------- sfx timeline

def build_sfx():
    sfx = np.zeros((2, N))

    # soft air swell into the first word
    place(sfx, whoosh(0.55, 300, 2400, 0.9, (-0.2, 0.2), air=0.7), 0.0, 0.18)
    # S1 → S2: whip left / calendar in from the right
    place(sfx, whoosh(0.5, 300, 4200, 0.6, (0.7, -0.7)), fr(99) - 0.22, 0.5)
    # calendar hops ("pe care o tot amâni?")
    for s in (3.21, 3.33, 3.5, 3.61, 3.76, 3.92):
        place(sfx, stereo(flip(), 0.15), fr(f(s) + 1), 0.32)
    # vertical whip into the task list
    place(sfx, whoosh(0.55, 220, 3000, 0.55, (0.0, 0.0), low=0.5), fr(147) - 0.2, 0.48)
    # chores appear + "for 2 weeks" tags
    for s in (4.83, 6.52, 8.04):
        place(sfx, stereo(pop_sfx(), -0.1), fr(f(s) - 3), 0.28)
    for s in (5.74, 7.08, 8.74):
        place(sfx, stereo(tick(2600), 0.2), fr(f(s) + 7), 0.16)
    # list whips out, phone spins in (into the music lift)
    place(sfx, whoosh(0.7, 250, 5000, 0.5, (0.8, -0.4), low=0.35), fr(287) - 0.12, 0.55)
    # typing "Robinet care curge"
    type_start = f(9.87) + 1
    for i in range(18):
        place(sfx, stereo(key_click(), 0.05), fr(type_start + 16 * (i + 1) / 18), 0.13 + 0.04 * rng.random())
    category = f(10.3) + 9
    press = f(10.66) + 4
    success = press + 10
    place(sfx, stereo(tap(), 0.0), fr(category), 0.28)
    place(sfx, whoosh(0.35, 500, 2500, 0.5, (0.0, 0.0), air=0.6), fr(category) - 0.1, 0.12)
    place(sfx, stereo(tap(), 0.0), fr(press), 0.42)
    place(sfx, chime([88, 95]), fr(success), 0.2)
    for at, pan in ((category + 4, -0.5), (press + 2, 0.5), (success + 5, 0.55), (f(12.05) - 2, -0.55)):
        place(sfx, stereo(pop_sfx(1100, 600), pan), fr(at), 0.2)
    # phone drops away, radar reveal + pings
    place(sfx, whoosh(0.55, 260, 2600, 0.45, (0.0, 0.0), low=0.4), fr(397) - 0.05, 0.4)
    rings = (f(13.32) - 1, f(13.32) + 17, f(14.42) + 1)
    for i, r in enumerate(rings):
        place(sfx, reverb(sonar(1180 if i != 2 else 1320), IR_HALL) * 0.6 + stereo(sonar(1180 if i != 2 else 1320)), fr(r), 0.22 if i == 0 else 0.15)
    # taskers light up as the first ring reaches them
    for k, (x, y) in enumerate(((-520, -215), (430, -255), (-330, 240), (560, 175), (-770, 30), (195, 320))):
        d = math.hypot(x, y)
        tt = (1 - (1 - (d - 40) / 960) ** (1 / 3)) * 50  # inverse of ease-out-cubic ring growth
        place(sfx, stereo(tick(1500 + 160 * k), x / 900), fr(rings[0] + tt), 0.11)
    place(sfx, stereo(pop_sfx(1000, 650), 0.0), fr(f(14.42) - 6), 0.16)
    # radar slides out, tasker cards slide in
    place(sfx, whoosh(0.5, 300, 3600, 0.55, (0.6, -0.6)), fr(474) - 0.08, 0.32)
    for i in range(3):
        place(sfx, whoosh(0.3, 600, 4500, 0.5, (0.8, 0.0), air=0.8), fr(476 + i * 5) - 0.05, 0.14)
    select = f(16.54) - 3
    place(sfx, stereo(tap(), 0.0), fr(select), 0.3)
    place(sfx, chime([84]), fr(select + 2), 0.12)
    split = f(17.02) - 3
    place(sfx, whoosh(0.45, 300, 3800, 0.5, (0.0, 0.0)), fr(split) - 0.05, 0.3)
    place(sfx, whoosh(0.35, 500, 4200, 0.5, (0.8, 0.2)), fr(split + 4), 0.16)
    price = f(17.6)
    place(sfx, stereo(pop_sfx(1200, 700), 0.0), fr(price), 0.28)
    place(sfx, chime([91, 96], gap=0.06, tau=0.4), fr(price + 1), 0.1)
    deal = f(18.45)
    place(sfx, chime([79, 84, 88], gap=0.07, tau=0.7), fr(deal - 1), 0.17)
    # dark → light glitch cut
    place(sfx, stereo(glitch(), 0.0), fr(585), 0.22)
    place(sfx, whoosh(0.35, 400, 5000, 0.6, (0.4, -0.4)), fr(585) - 0.05, 0.22)
    # text swaps
    for at in (f(20.62) - 4, f(22.2) - 4, f(22.97) - 4, f(23.75) - 4):
        place(sfx, whoosh(0.32, 700, 5500, 0.55, (0.15, -0.15), air=0.7), fr(at) - 0.06, 0.12)
    place(sfx, stereo(pop_sfx(900, 600), 0.0), fr(f(23.75)), 0.18)
    # frame collapses into the app icon → hit (score carries the impact)
    place(sfx, whoosh(0.42, 5500, 300, 0.85, (0.0, 0.0), low=0.3), fr(746) - 0.02, 0.38)
    place(sfx, whoosh(0.6, 500, 4000, 0.5, (-0.3, 0.3), air=0.6), fr(778) - 0.1, 0.1)
    return sfx


# ----------------------------------------------------------------------------- mix + master

def load_vo():
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "vo.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "public/audio/voiceover.mp3"), "-ac", "1", "-ar", str(SR), wav], check=True)
        sr, x = wavfile.read(wav)
    x = x.astype(np.float64) / 32768
    out = np.zeros(N)
    i = int(VO_OFFSET * SR)
    n = min(len(x), N - i)
    out[i:i + n] = x[:n]
    return out


def follower(x, attack, release, lookahead=0.06):
    env = np.abs(x)
    env = signal.sosfilt(sos("lowpass", 30, 1), env)
    env = np.maximum(env, 0)
    a = math.exp(-1 / (attack * SR))
    r = math.exp(-1 / (release * SR))
    out = np.zeros_like(env)
    y = 0.0
    # simple attack/release follower, run on a decimated envelope for speed
    dec = 32
    e = env[::dec]
    o = np.zeros_like(e)
    a_d, r_d = a ** dec, r ** dec
    for i, v in enumerate(e):
        y = a_d * y + (1 - a_d) * v if v > y else r_d * y + (1 - r_d) * v
        o[i] = y
    out = np.repeat(o, dec)[: len(env)]
    shift = int(lookahead * SR)
    return np.concatenate([out[shift:], np.zeros(shift)])


def lufs(x):
    meter = pyln.Meter(SR)
    return meter.integrated_loudness(x.T)


def soft_limit(x, ceiling=0.89):
    # transparent-ish peak control: gain computer with fast attack / smooth release
    peak = np.max(np.abs(x), axis=0)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    dec = 64
    g = need[: len(need) // dec * dec].reshape(-1, dec).min(axis=1)
    sm = np.zeros_like(g)
    y = 1.0
    rel = math.exp(-1 / (0.08 * SR / dec))
    for i, v in enumerate(g):
        y = v if v < y else rel * y + (1 - rel) * v
        sm[i] = y
    gain = np.repeat(sm, dec)
    gain = np.concatenate([gain, np.full(x.shape[1] - len(gain), gain[-1] if len(gain) else 1.0)])
    gain = np.minimum(gain, np.concatenate([gain[dec:], np.ones(dec)]))
    return x * gain[None, :]


def main():
    vo = load_vo()
    music = build_music()
    sfx = build_sfx()

    vo_st = stereo(vo, 0.0) * math.sqrt(2)
    # level stems
    vo_st *= 10 ** ((-16.0 - lufs(vo_st)) / 20)
    music *= 10 ** ((-22.0 - lufs(music)) / 20)
    sfx *= 10 ** ((-27.0 - lufs(sfx)) / 20)

    # duck music under the voice (and a touch under the loudest sfx)
    env = follower(vo, 0.02, 0.38)
    env /= np.max(env) + 1e-9
    duck_db = -8.0 * np.clip(env * 4.0, 0, 1)
    music *= (10 ** (duck_db / 20))[None, :]

    # let the score open up once the voice is done (logo hit + end card)
    tt = np.arange(N) / SR
    music *= np.interp(tt, [VO_OFFSET + 24.45, HIT - 0.1], [1.0, 1.55])[None, :]

    mix = vo_st + music + sfx
    mix *= 10 ** ((-14.5 - lufs(mix)) / 20)
    mix = soft_limit(mix, 0.89)
    print(f"stems: vo {lufs(vo_st):.1f} LUFS | music(ducked) {lufs(music):.1f} | sfx {lufs(sfx):.1f} | mix {lufs(mix):.1f} | peak {20 * math.log10(np.max(np.abs(mix))):.2f} dBFS")

    out_dir = os.path.join(ROOT, "public/audio")
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "mix.wav")
        wavfile.write(wav, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(out_dir, "explainer-mix.mp3")], check=True)
        if os.environ.get("STEMS"):
            for name, x in (("vo", vo_st), ("music", music), ("sfx", sfx)):
                p = os.path.join(os.environ["STEMS"], f"{name}.wav")
                wavfile.write(p, SR, (np.clip(x, -1, 1).T * 32767).astype(np.int16))
    print("wrote public/audio/explainer-mix.mp3")


if __name__ == "__main__":
    main()
