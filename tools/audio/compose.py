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
DUR = 1000 / FPS
N = int(DUR * SR)
VO_OFFSET = 0.4
PRE = 45 / 30  # cold open prepended to the final mix (matches the video's PRE_ROLL)

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


def page_flip():
    """A paper leaf turning: a short airy swish whose band sweeps up, with a soft papery tick at the end."""
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    body = filt(noise, "bandpass", (1200, 6000), 2)
    env = np.sin(np.pi * np.clip(t / 0.2, 0, 1)) ** 1.5
    tick_ = filt(rng.standard_normal(n), "highpass", 3500) * np.exp(-np.clip(t - 0.17, 0, None) / 0.006) * (t > 0.17) * 0.8
    return body * env * 0.8 + tick_


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

BPM = 124
BEAT = 60 / BPM
BAR = 4 * BEAT
LIFT = 336 / FPS  # drop on "Postează"
HIT = LIFT + 8 * BAR  # logo lands (frame ~800)


def bar_t(k):
    return LIFT + k * BAR


CHORDS = {
    "Am": (45, [57, 60, 64, 69]),
    "Am9": (45, [57, 60, 64, 67, 71]),
    "F": (41, [53, 57, 60, 65]),
    "Fmaj7": (41, [53, 57, 60, 64]),
    "C": (48, [55, 60, 64, 67]),
    "G": (43, [55, 59, 62, 67]),
    "Gsus": (43, [55, 60, 62, 67]),
}

INTRO = ["Am9", "Fmaj7", "Am9", "Fmaj7", "Gsus"]  # bars -5 .. -1 (ambient, the problem)
MAIN = ["Am", "F", "C", "G", "Am", "F", "C", "G"]  # bars 0 .. 7 (the energetic half)


def supersaw(notes, dur, detune=14.0, voices=5, attack=0.004, release=0.12):
    n = int(dur * SR)
    out = np.zeros((2, n))
    for m in notes:
        base = midi(m)
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune
            pan = (v / (voices - 1)) * 2 - 1
            y = saw(base * 2 ** (cents / 1200), n, harmonics=24, phase=rng.uniform(0, 6.28))
            out += stereo(y, pan * 0.8)
    out *= env_asr(n, attack, release)
    return out / (len(notes) * voices) * 2.2


def build_music():
    pad = np.zeros((2, N))
    plk = np.zeros((2, N))
    bass = np.zeros((2, N))
    drums = np.zeros((2, N))
    stabs = np.zeros((2, N))
    fx = np.zeros((2, N))

    # ---- the problem: dark ambient pad + slow pulses
    place(pad, pad_chord(CHORDS["Am9"][1], bar_t(-5) + 0.3, attack=1.0, release=0.4), 0.0, 0.8)
    for k, name in enumerate(INTRO):
        place(pad, pad_chord(CHORDS[name][1], BAR + 0.5, attack=0.4, release=0.6), bar_t(k - 5), 0.9)
        place(bass, bass_note(CHORDS[name][0], BAR - 0.05, attack=0.3, release=0.4), bar_t(k - 5), 0.45)
        tones = CHORDS[name][1]
        for b, idx in enumerate((0, 2, 1, 3)):
            place(plk, stereo(pluck(tones[idx] + 12, 1.3, tau=0.35, bright=0.5), (-0.35, 0.35)[b % 2]), bar_t(k - 5) + b * BEAT, 0.42 if k < 4 else 0.2)
    for k in (-4, -3):
        for s in range(8):
            place(drums, stereo(shaker(), 0.25 if s % 2 else -0.15), bar_t(k) + s * BEAT / 2, 0.16 + 0.1 * (s % 2))

    # ---- the drop: four-on-the-floor, pumping offbeat bass, supersaw stabs, claps, 16th hats, lead arp
    sidechain = np.ones(N)
    for k, name in enumerate(MAIN):
        t0 = bar_t(k)
        root, tones = CHORDS[name]
        for beat in range(4):
            tb = t0 + beat * BEAT
            place(drums, kick(), tb, 1.0)
            i = int(tb * SR)
            dip = 1 - 0.8 * np.exp(-np.arange(int(0.3 * SR)) / SR / 0.09)
            sidechain[i:i + len(dip)] = np.minimum(sidechain[i:i + len(dip)], dip[: N - i])
            # offbeat bass + stab
            place(bass, bass_note(root, BEAT / 2 - 0.03, attack=0.004, release=0.05), tb + BEAT / 2, 0.95)
            place(bass, bass_note(root + 12, BEAT / 4 - 0.02, attack=0.004, release=0.04), tb + BEAT * 0.75, 0.45)
            place(stabs, supersaw([m + 12 for m in tones], BEAT * 0.42), tb + BEAT / 2, 0.55)
        for beat in (1, 3):
            place(drums, stereo(clap(), 0.0), t0 + beat * BEAT, 0.75)
        for s in range(16):
            place(drums, stereo(hat(open_=(s % 4 == 2)), 0.25 if s % 2 else -0.2), t0 + s * BEAT / 4, (0.32 if s % 4 == 2 else 0.14 + 0.06 * (s % 2)))
        for s, idx in enumerate((0, 1, 2, 3, 2, 1, 2, 3)):
            place(plk, stereo(pluck(tones[idx % len(tones)] + 24, 0.4, tau=0.12, bright=1.2), (-0.5, 0.5)[s % 2]), t0 + s * BEAT / 2, 0.45)
        place(pad, pad_chord([m + 12 for m in tones], BAR + 0.3, attack=0.05, release=0.3), t0, 0.7)
    # last bar before the logo: snare roll + riser on top of the groove
    roll_t = bar_t(7)
    for i in range(24):
        tt = roll_t + BAR * (i / 24) ** 0.9
        place(drums, stereo(clap(), 0.0), tt, 0.1 + 0.4 * (i / 24) ** 1.6)
    place(fx, stereo(riser(BAR, 300, 9000, 1.0), 0.0), bar_t(7), 0.55)

    # ---- the pause before "Postează": reverse swell + big riser, then an explosive drop
    place(fx, reverse_swell(1.8), LIFT - 1.8, 0.85)
    place(fx, stereo(riser(2.2, 200, 10000, 1.0), 0.0), LIFT - 2.2, 0.85)
    place(fx, stereo(sub_drop(2.0), 0.0), LIFT, 1.0)
    place(fx, stereo(crash(), -0.2), LIFT, 0.7)

    # ---- logo hit: big chord, sub, crash, bells, ringing out
    place(pad, pad_chord([48, 55, 60, 64, 67, 72], DUR - HIT, attack=0.01, release=2.0), HIT, 1.6)
    place(stabs, supersaw([60, 64, 67, 72], 1.6, release=1.4), HIT, 0.7)
    place(bass, bass_note(36, DUR - HIT, attack=0.005, release=2.0), HIT, 0.8)
    place(fx, stereo(sub_drop(2.6), 0.0), HIT, 1.0)
    place(fx, stereo(crash(3.2), 0.0), HIT, 0.7)
    for m, g in ((72, 0.3), (76, 0.22), (79, 0.2), (84, 0.15)):
        place(fx, stereo(bell(m, 3.0, ratio=3.5, index=1.6, tau=1.3), 0.0), HIT, g)

    nb = int(math.ceil(N / 256))
    tb_ = np.arange(nb) * 256 / SR
    cut = np.interp(tb_, [0, LIFT - 2.2, LIFT - 0.05, LIFT, HIT, DUR], [650, 900, 5000, 3800, 4500, 2200])
    pad = np.stack([swept(pad[c], "lowpass", cut) for c in range(2)])
    stabs = np.stack([swept(stabs[c], "lowpass", np.interp(tb_, [0, LIFT, HIT - BAR, HIT, DUR], [3000, 3200, 3200, 7000, 2500])) for c in range(2)])

    pad *= sidechain[None, :] ** 0.8
    plk *= sidechain[None, :] ** 0.4
    bass *= sidechain[None, :]
    stabs *= sidechain[None, :] ** 0.6

    wet = reverb(pad * 0.45 + plk * 0.5 + stabs * 0.25 + drums * 0.08 + fx * 0.45, IR_HALL)
    music = pad * 0.5 + plk * 0.38 + bass * 0.62 + drums * 0.62 + stabs * 0.5 + fx * 0.6 + wet * 0.3
    fade = np.clip((DUR - np.arange(N) / SR) / 1.4, 0, 1) ** 1.5
    return music * fade[None, :]


# ----------------------------------------------------------------------------- sfx timeline

def build_sfx():
    sfx = np.zeros((2, N))
    sw = lambda at, g=0.12: place(sfx, whoosh(0.32, 700, 5500, 0.55, (0.15, -0.15), air=0.7), fr(at) - 0.06, g)

    # opening: three drops of light melt into one orb
    place(sfx, whoosh(0.9, 200, 2600, 0.8, (-0.3, 0.3), air=0.6, low=0.3), 0.0, 0.25)
    place(sfx, chime([81, 88], gap=0.12, tau=0.7), fr(16), 0.07)
    for i in (3, 6, 7):
        sw(f(VO_HOOK[i]) - 5, 0.08)
    # day strip + hops ("pe care o tot amâni?")
    place(sfx, whoosh(0.5, 300, 4200, 0.6, (0.7, -0.7)), fr(118) - 0.1, 0.3)
    for s_ in (3.69, 3.8, 4.0, 4.2, 4.37, 4.55):
        place(sfx, stereo(tick(2200), 0.15), fr(f(s_) + 1), 0.22)
    # chores widgets
    for s_ in (5.41, 7.01, 8.52):
        place(sfx, stereo(pop_sfx(1150, 700), -0.1), fr(f(s_) - 3), 0.24)
        place(sfx, whoosh(0.4, 400, 3000, 0.5, (0.0, 0.0), air=0.6), fr(f(s_) - 4), 0.1)
    # pause: drops gather and charge, then the drop
    place(sfx, whoosh(1.1, 5000, 300, 0.9, (0.0, 0.0), low=0.4), fr(336) - 1.1, 0.4)
    place(sfx, whoosh(0.7, 250, 6000, 0.35, (0.8, -0.4), low=0.6), fr(332), 0.55)
    # typing "Robinet care curge"
    type_start = f(10.79) + 1
    for i in range(18):
        place(sfx, stereo(key_click(), 0.05), fr(type_start + 16 * (i + 1) / 18), 0.12 + 0.04 * rng.random())
    category = f(11.36) + 4
    press = f(11.78) + 2
    success = press + 10
    place(sfx, stereo(tap(), 0.0), fr(category), 0.26)
    place(sfx, stereo(tap(), 0.0), fr(press), 0.4)
    place(sfx, chime([88, 95]), fr(success), 0.2)
    for at, pan in ((category + 4, -0.5), (press + 2, 0.5), (success + 5, 0.55), (f(13.17) - 2, -0.55)):
        place(sfx, stereo(pop_sfx(1100, 600), pan), fr(at), 0.18)
    # radar
    place(sfx, whoosh(0.55, 260, 2600, 0.45, (0.0, 0.0), low=0.4), fr(436) - 0.05, 0.35)
    rings = (f(14.42) - 1, f(14.42) + 17, f(15.41) + 1)
    for i, r in enumerate(rings):
        place(sfx, reverb(sonar(1180 if i != 2 else 1320), IR_HALL) * 0.6 + stereo(sonar(1180 if i != 2 else 1320)), fr(r), 0.2 if i == 0 else 0.13)
    for k, (x, y) in enumerate(((-520, -215), (430, -255), (-330, 240), (560, 175), (-770, 30), (195, 320))):
        d = math.hypot(x, y)
        tt = (1 - (1 - (d - 40) / 960) ** (1 / 3)) * 50
        place(sfx, stereo(tick(1500 + 160 * k), x / 900), fr(rings[0] + tt), 0.1)
    # tasker cards
    place(sfx, whoosh(0.5, 300, 3600, 0.55, (0.6, -0.6)), fr(512) - 0.08, 0.3)
    for i in range(3):
        place(sfx, whoosh(0.3, 600, 4500, 0.5, (0.8, 0.0), air=0.8), fr(514 + i * 5) - 0.05, 0.12)
    select = f(17.63) - 3
    place(sfx, stereo(tap(), 0.0), fr(select), 0.28)
    place(sfx, chime([84]), fr(select + 2), 0.12)
    split = f(18.14) - 3
    place(sfx, whoosh(0.45, 300, 3800, 0.5, (0.0, 0.0)), fr(split) - 0.05, 0.28)
    price = f(18.38)
    place(sfx, stereo(pop_sfx(1200, 700), 0.0), fr(price), 0.26)
    place(sfx, chime([79, 84, 88], gap=0.07, tau=0.7), fr(f(19.7) - 1), 0.16)
    # statements + final beats
    for at in (f(20.47) - 3, f(21.75) - 3, f(23.39) - 3, f(24.12) - 3, f(24.88) - 3):
        sw(at, 0.16)
    place(sfx, stereo(pop_sfx(900, 600), 0.0), fr(f(24.88)), 0.18)
    # planner pages turning (postponed day by day, then a page per chore)
    for s_ in (3.69, 3.8, 4.0, 4.2, 4.37, 4.55):
        place(sfx, stereo(page_flip(), 0.2), fr(f(s_) - 1), 0.32)
    for s_ in (5.41, 7.01, 8.52):
        place(sfx, stereo(page_flip(), 0.2), fr(f(s_) - 10), 0.42)
    # drops gather into the logo
    place(sfx, whoosh(0.5, 5500, 300, 0.85, (0.0, 0.0), low=0.3), fr(800) - 0.5, 0.35)
    place(sfx, whoosh(0.6, 500, 4000, 0.5, (-0.3, 0.3), air=0.6), fr(822) - 0.1, 0.1)
    # end card: logo steps up, "Descarcă acum", the two store badges land
    place(sfx, whoosh(0.55, 400, 3800, 0.5, (0.0, 0.0), air=0.7), fr(864) - 0.05, 0.16)
    for at, pan in ((880, -0.3), (893, 0.3)):
        place(sfx, stereo(pop_sfx(1150, 700), pan), fr(at), 0.2)
    place(sfx, chime([84, 91], gap=0.09, tau=0.8), fr(895), 0.12)
    return sfx


VO_HOOK = [0.1, 0.37, 0.52, 1.34, 1.4, 1.6, 1.95, 2.83, 2.95]


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
    tt0 = np.arange(N) / SR
    depth = np.where(tt0 < LIFT, -8.0, -5.0)
    duck_db = depth * np.clip(env * 4.0, 0, 1)
    music *= (10 ** (duck_db / 20))[None, :]

    # let the score open up once the voice is done (logo hit + end card)
    tt = np.arange(N) / SR
    music *= np.interp(tt, [VO_OFFSET + 9.9, VO_OFFSET + 10.2, LIFT - 0.05, LIFT, VO_OFFSET + 25.7, HIT - 0.1], [1.0, 1.8, 1.8, 1.22, 1.22, 1.6])[None, :]

    mix = vo_st + music + sfx
    mix *= 10 ** ((-14.5 - lufs(mix)) / 20)
    mix = soft_limit(mix, 0.89)
    print(f"stems: vo {lufs(vo_st):.1f} LUFS | music(ducked) {lufs(music):.1f} | sfx {lufs(sfx):.1f} | mix {lufs(mix):.1f} | peak {20 * math.log10(np.max(np.abs(mix))):.2f} dBFS")

    # 1.5 s cold open in front of everything: a soft pad and three radar pings (the video adds the same 45 frames)
    pre_n = int(PRE * SR)
    pre = np.zeros((2, pre_n + int(1.2 * SR)))
    place(pre, pad_chord([57, 64, 69, 71, 76], PRE + 1.0, attack=0.5, release=0.9) * 0.6, 0.0, 1.0)
    # a ball drops in and bounces (same frames as BOUNCE_HITS in LightWorld.tsx)
    for k, hit in enumerate((13, 25, 33, 38)):
        g = (1.0, 0.6, 0.38, 0.22)[k]
        t = np.arange(int(0.25 * SR)) / SR
        thud = np.sin(2 * np.pi * (180 - 60 * t / 0.25) * t) * np.exp(-t / 0.06)
        place(pre, stereo(thud), hit / FPS, 0.9 * g)
        place(pre, stereo(pop_sfx(820, 430, 0.1)), hit / FPS, 0.35 * g)
    place(pre, whoosh(0.7, 300, 4200, 0.6, (-0.3, 0.3), air=0.7), PRE - 0.45, 0.25)
    pre *= 10 ** ((-26.0 - lufs(pre)) / 20)
    full = np.zeros((2, pre_n + mix.shape[1]))
    full[:, pre_n:] += mix
    full[:, : pre.shape[1]] += pre
    mix = soft_limit(full, 0.89)

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
