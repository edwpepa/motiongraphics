"""Synthesised sound design for the launch film. Every cue kind maps to a function returning a
stereo (2, n) clip; mix.py places them from tools/launch/cues.json."""
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
import compose as C  # noqa: E402

SR = C.SR
rng = np.random.default_rng(11)


def T(dur):
    return np.arange(int(dur * SR)) / SR


def st(x, pan=0.0):
    return x if x.ndim == 2 else C.stereo(x, pan)


def verb(x, wet=0.35, ir=None):
    x = st(x)
    r = C.reverb(x, ir if ir is not None else C.IR_HALL)
    out = np.zeros((2, max(x.shape[1], r.shape[1])))
    out[:, : x.shape[1]] += x
    out[:, : r.shape[1]] += r * wet
    return out


def norm(x, peak=0.9):
    return x * (peak / (np.max(np.abs(x)) + 1e-9))


def noise(dur):
    return rng.standard_normal(int(dur * SR))


# ------------------------------------------------------------------ building blocks

def sweep_tone(f0, f1, dur, tau=None, shape=2.0):
    t = T(dur)
    fq = f0 * (f1 / f0) ** ((t / dur) ** (1 / shape))
    y = np.sin(2 * np.pi * np.cumsum(fq) / SR)
    e = np.exp(-t / tau) if tau else np.sin(np.pi * t / dur) ** 1.2
    return y * e * np.clip(t / 0.003, 0, 1)


def impact(sub=1.0, bright=1.0, dur=1.6):
    t = T(dur)
    fq = 38 + 90 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.exp(-t / 0.5) * sub
    snap = C.filt(noise(dur), "bandpass", (1200, 9000), 2) * np.exp(-t / 0.03) * 0.6 * bright
    air = C.filt(noise(dur), "highpass", 5000, 2) * np.exp(-t / 0.4) * 0.15 * bright
    return verb(norm(body + snap + air), 0.25)


# ------------------------------------------------------------------ cue kinds

def bloom():
    t = T(2.4)
    pad = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((110, 164.8, 220, 329.6))) * 0.25
    pad *= (np.clip(t / 1.2, 0, 1) ** 2) * np.exp(-np.maximum(0, t - 1.2) / 0.5)
    sw = C.reverse_swell(1.4)
    out = st(norm(pad) * 0.6)
    out[:, : len(sw)] += st(C.filt(sw, "lowpass", 3000)) * 0.4
    return verb(out, 0.5)


def air():
    return C.whoosh(1.3, 180, 2400, 0.55, (-0.5, 0.5), air=0.8, low=0.3) * 0.7


def wipe():
    return C.whoosh(0.7, 140, 3200, 0.7, (0.4, -0.4), air=1.0, low=0.6)


def drip():
    t = T(0.25)
    fq = 520 + 1500 * (1 - np.exp(-t / 0.018))
    y = np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.exp(-t / 0.05) * np.clip(t / 0.001, 0, 1)
    splash = C.filt(noise(0.25), "bandpass", (2500, 8000), 2) * np.exp(-t / 0.012) * 0.25
    return verb(norm(y + splash) * 0.8, 0.45, C.IR_ROOM)


def splash():
    dur = 0.9
    t = T(dur)
    body = C.filt(noise(dur), "bandpass", (400, 3500), 2) * np.exp(-t / 0.07)
    hiss = C.filt(noise(dur), "highpass", 3000, 2) * np.exp(-t / 0.15) * 0.35
    y = body + hiss
    for _ in range(9):
        at = rng.uniform(0.02, 0.45)
        f0 = rng.uniform(500, 1400)
        n = int(0.06 * SR)
        tt = np.arange(n) / SR
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.8 * tt / 0.06)) / SR) * np.exp(-tt / 0.02) * rng.uniform(0.2, 0.5)
        i0 = int(at * SR)
        y[i0 : i0 + n] += b[: len(y) - i0]
    return verb(norm(y) * 0.8, 0.35, C.IR_ROOM)


def roller():
    t = T(0.42)
    n = C.filt(noise(0.42), "bandpass", (250, 2600), 2)
    stick = 0.6 + 0.4 * np.sin(2 * np.pi * 38 * t) * np.sin(2 * np.pi * 7 * t)
    e = np.sin(np.pi * t / 0.42) ** 1.6
    return C.stereo_sweep(norm(n * stick * e) * 0.7, -0.6, 0.6)


def brush():
    t = T(0.95)
    n = C.swept(noise(0.95), "bandpass", [(300 + 600 * k, 2200 + 2600 * k) for k in np.linspace(0, 1, int(math.ceil(len(t) / 256)))])
    crackle = (rng.random(len(t)) > 0.996) * rng.standard_normal(len(t)) * 3
    crackle = C.filt(crackle, "highpass", 2500)
    e = np.clip(t / 0.05, 0, 1) * np.exp(-np.maximum(0, t - 0.55) / 0.15)
    thump = np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.06) * 0.6
    return C.stereo_sweep(norm(n * e + crackle * e * 0.5 + thump) * 0.8, -0.8, 0.7)


def thud():
    t = T(0.6)
    y = np.sin(2 * np.pi * (48 + 60 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.18)
    return verb(norm(y + C.filt(noise(0.6), "lowpass", 900) * np.exp(-t / 0.02) * 0.3) * 0.9, 0.3)


def pop():
    return st(norm(C.pop_sfx(1100, 560, 0.12)) * 0.8)


def morph():
    t = T(0.3)
    fq = 260 + 520 * (t / 0.3) ** 0.6 + 40 * np.sin(2 * np.pi * 18 * t)
    y = np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.sin(np.pi * t / 0.3) ** 0.8
    sw = C.whoosh(0.3, 600, 4000, 0.5, (-0.3, 0.3), air=0.4)
    return st(norm(y) * 0.7) + sw[:, : len(t)] * 0.5


def glitch():
    return st(norm(C.glitch(0.3)) * 0.6)


def suck():
    x = C.filt(C.reverse_swell(0.7), "highpass", 800)
    return st(norm(x) * 0.8)


def late():
    t = T(0.25)
    y = np.sin(2 * np.pi * 150 * t) * np.exp(-t / 0.05)
    y += C.filt(noise(0.25), "bandpass", (900, 2500)) * np.exp(-t / 0.008) * 0.4
    return st(norm(y) * 0.7)


def hope():
    t = T(0.9)
    y = sweep_tone(420, 880, 0.9) + 0.4 * sweep_tone(630, 1320, 0.9)
    return verb(norm(y) * 0.5, 0.5)


def fail():
    t = T(0.7)
    fq = 520 * (0.5 ** (t / 0.7)) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
    y = np.sin(2 * np.pi * np.cumsum(fq) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(fq * 1.5) / SR)
    y *= np.clip(t / 0.02, 0, 1) * np.exp(-t / 0.35)
    return verb(norm(y) * 0.5, 0.4)


def whoosh():
    return C.whoosh(0.45, 300, 4200, 0.6, (0.6, -0.6), air=1.0, low=0.2)


def key():
    return st(norm(C.key_click()) * 0.6)


def nope():
    out = np.zeros(int(0.5 * SR))
    for i, f in enumerate((392, 311)):
        t = T(0.16)
        y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.06) * np.clip(t / 0.003, 0, 1)
        i0 = int(i * 0.13 * SR)
        out[i0 : i0 + len(y)] += y
    return verb(norm(out) * 0.5, 0.3, C.IR_ROOM)


def cut():
    t = T(0.45)
    k = C.kick()[: len(t)]
    t = t[: len(k)]
    snap = C.filt(noise(len(t) / SR), "bandpass", (1500, 8000), 2)[: len(t)] * np.exp(-t / 0.02) * 0.5
    sw = C.whoosh(0.18, 1500, 7000, 0.85, (-0.2, 0.2), air=0.7)
    out = st(norm(k * 0.8 + snap) * 0.8)
    pre = np.zeros((2, out.shape[1] + sw.shape[1]))
    pre[:, : sw.shape[1]] += sw * 0.5
    pre[:, sw.shape[1] - int(0.01 * SR) :][:, : out.shape[1]] += out
    return pre, -sw.shape[1] / SR + 0.01


def search():
    return verb(st(norm(C.sonar(1560)) * 0.5), 0.3)


def ring():
    t = T(0.9)
    y = (np.sin(2 * np.pi * 1020 * t) + np.sin(2 * np.pi * 1300 * t)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 22 * t)))
    gate = ((t < 0.32) | ((t > 0.45) & (t < 0.77))).astype(float)
    y *= gate * C.filt(gate, "lowpass", 60, 1)
    return verb(norm(C.filt(y, "bandpass", (600, 3500))) * 0.4, 0.2, C.IR_ROOM)


def tick():
    return st(norm(C.tick(2600)) * 0.6)


def fall():
    m = rng.uniform(80, 92)
    return verb(st(norm(C.bell(m, 0.6, ratio=2.0, index=0.6, tau=0.15)) * 0.4, rng.uniform(-0.5, 0.5)), 0.3)


def bell():
    a = C.bell(84, 3.2, ratio=3.51, index=1.4, tau=1.5)
    b = C.bell(96, 2.4, ratio=2.0, index=0.8, tau=0.9) * 0.35
    y = a.copy()
    y[: len(b)] += b
    return verb(norm(y) * 0.8, 0.8)


def shimmer():
    out = np.zeros(int(2.2 * SR))
    for i, m in enumerate((67, 70, 74, 79, 82)):
        b = C.bell(m, 1.6, ratio=1.0, index=0.25, tau=0.7) * (0.9 - 0.1 * i)
        i0 = int(i * 0.045 * SR)
        out[i0 : i0 + len(b)] += b[: len(out) - i0]
    return verb(norm(out) * 0.5, 0.7)


def boom808(dur=2.6):
    t = T(dur)
    f = 30 + 70 * np.exp(-t / 0.08)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    return np.tanh(y * 2.2)


def drop():
    out = impact(1.0, 1.2, 2.2)
    b = st(boom808()) * 0.9
    o2 = np.zeros((2, max(out.shape[1], b.shape[1])))
    o2[:, : out.shape[1]] += out
    o2[:, : b.shape[1]] += b
    out = o2
    cr = C.reverb(C.crash(2.8)) * 0.5
    o = np.zeros((2, max(out.shape[1], cr.shape[1])))
    o[:, : out.shape[1]] += out
    o[:, : cr.shape[1]] += cr
    return norm(o)


def slam():
    t = T(0.35)
    sw = C.whoosh(0.16, 2000, 9000, 0.9, (0.5, -0.5), air=1.0)
    hit = C.filt(noise(0.35), "bandpass", (800, 6000), 2) * np.exp(-t / 0.025) * 0.7
    hit += np.sin(2 * np.pi * (70 + 80 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.09)
    out = np.zeros((2, sw.shape[1] + len(t)))
    out[:, : sw.shape[1]] += sw * 0.6
    out[:, sw.shape[1] - int(0.005 * SR) :][:, : len(t)] += st(norm(hit) * 0.8)
    return out, -sw.shape[1] / SR + 0.005


def zoom():
    return C.whoosh(0.32, 400, 9000, 0.9, (-0.4, 0.4), air=1.0) * 0.8


def tap():
    return st(norm(C.tap()) * 0.6)


def success():
    return verb(st(norm(C.chime([67, 74, 79, 82], gap=0.07, tau=0.5)) * 0.6), 0.4)


def notif():
    return verb(st(norm(C.chime([79, 86], gap=0.09, tau=0.35)) * 0.5, 0.2), 0.3)


def select():
    return st(norm(C.tap()) * 0.5) + np.pad(st(norm(C.pop_sfx(1400, 800, 0.1)) * 0.4), ((0, 0), (0, int(0.12 * SR) - int(0.1 * SR))))


def expand():
    return C.whoosh(0.5, 300, 3000, 0.55, (-0.3, 0.3), air=0.7, low=0.2) * 0.7


def bubble():
    return st(norm(C.pop_sfx(1500, 820, 0.09)) * 0.6, rng.uniform(-0.3, 0.3))


def sent():
    sw = C.whoosh(0.2, 1500, 6000, 0.6, (-0.3, 0.5), air=0.6) * 0.5
    p = st(norm(C.pop_sfx(1800, 1100, 0.08)) * 0.5)
    out = np.zeros((2, max(sw.shape[1], p.shape[1])))
    out[:, : sw.shape[1]] += sw
    out[:, : p.shape[1]] += p
    return out


def lock():
    out = np.zeros(int(0.4 * SR))
    for i, d in enumerate((0.0, 0.07)):
        t = T(0.05)
        c = C.filt(noise(0.05), "bandpass", (2000, 7000), 2) * np.exp(-t / 0.004)
        c += np.sin(2 * np.pi * (900 if i else 600) * t) * np.exp(-t / 0.01) * 0.5
        i0 = int(d * SR)
        out[i0 : i0 + len(c)] += c
    t = T(0.4)
    out += np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.08) * 0.4
    return verb(st(norm(out) * 0.6), 0.25, C.IR_ROOM)


def dissolve():
    dur = 1.1
    t = T(dur)
    y = np.zeros(len(t))
    for _ in range(140):
        at = rng.random() ** 1.6 * (dur - 0.05)
        g = C.bell(rng.uniform(90, 104), 0.05, ratio=2.0, index=0.4, tau=0.012) * rng.uniform(0.2, 1)
        i0 = int(at * SR)
        y[i0 : i0 + len(g)] += g[: len(y) - i0]
    hiss = C.swept(noise(dur), "bandpass", [(2000 + 4000 * k, 6000 + 8000 * k) for k in np.linspace(0, 1, int(math.ceil(len(t) / 256)))]) * np.sin(np.pi * t / dur) * 0.3
    return C.stereo_sweep(norm(y + hiss) * 0.6, -0.5, 0.8)


def step():
    a = C.tick(1900)
    b = C.pop_sfx(900, 600, 0.08) * 0.5
    y = np.zeros(max(len(a), len(b)))
    y[: len(a)] += a
    y[: len(b)] += b
    return st(norm(y) * 0.6)


def release():
    w = C.whoosh(1.1, 3600, 300, 0.25, (0.3, -0.3), air=0.9, low=0.3) * 0.6
    t = T(1.1)
    pad = (np.sin(2 * np.pi * 220 * t) + np.sin(2 * np.pi * 330 * t)) * np.sin(np.pi * t / 1.1) ** 2 * 0.15
    return verb(w + st(pad), 0.5)


def morphhit():
    m = morph()
    k = st(norm(C.kick()) * 0.5)
    out = np.zeros((2, max(m.shape[1], k.shape[1])))
    out[:, : m.shape[1]] += m
    out[:, : k.shape[1]] += k
    return out


def spin():
    return C.whoosh(0.6, 400, 5000, 0.5, (-1.0, 1.0), air=1.0) * 0.8


def sparkle():
    out = np.zeros(int(1.2 * SR))
    for i, m in enumerate((79, 82, 86)):
        b = C.bell(m, 0.8, ratio=1.0, index=0.3, tau=0.3)
        i0 = int(i * 0.04 * SR)
        out[i0 : i0 + len(b)] += b[: len(out) - i0]
    return verb(st(norm(out) * 0.35), 0.6)


def coin():
    return st(norm(C.tick(3400)) * 0.35, rng.uniform(-0.3, 0.3))


def cash():
    return verb(st(norm(C.chime([79, 82, 86], gap=0.05, tau=0.4)) * 0.5), 0.4)


def click():
    return st(norm(C.key_click() + 0.6 * C.tick(1500)[: int(0.03 * SR)]) * 0.6)


def zip():
    dur = 0.6
    t = T(dur)
    n = C.swept(noise(dur), "bandpass", [(400 + 3000 * k, 1200 + 6000 * k) for k in np.linspace(0, 1, int(math.ceil(len(t) / 256)))])
    teeth = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (40 + 160 * t / dur) * t))
    return C.stereo_sweep(norm(n * teeth * np.sin(np.pi * t / dur)) * 0.5, -0.6, 0.6)


def end():
    return drop()


def calm(dur):
    """A calm, warm charge into the drop: a soft chord swelling up as its filter opens,
    a gentle pulse that quickens, air rising on top — then the drop takes over."""
    t = T(dur)
    x = t / dur
    y = np.zeros(len(t))
    for m, g in ((43, 0.9), (55, 0.6), (62, 0.45), (67, 0.35), (70, 0.25)):
        f = C.midi(m)
        y += g * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t + 0.5))
    nb = int(math.ceil(len(t) / 256))
    y = C.swept(y, "lowpass", 300 + 3500 * np.linspace(0, 1, nb) ** 2.2)
    rate = 2.08 * (1 + 3 * x ** 2)
    pulse = 0.65 + 0.35 * np.cos(2 * np.pi * np.cumsum(rate) / SR)
    y *= pulse * (0.15 + 0.85 * x ** 1.8)
    air = C.swept(noise(dur), "bandpass", [(800 + 5000 * k ** 2, 2400 + 9000 * k ** 2) for k in np.linspace(0, 1, nb)]) * x ** 3 * 0.25
    out = norm(y + air) * 0.8
    out[-int(0.02 * SR) :] *= np.linspace(1, 0, int(0.02 * SR))
    return C.stereo_sweep(out, -0.15, 0.15)


def glide(dur):
    """A smooth airy whoosh that swells with the arrow's run and settles as it lands."""
    t = T(dur)
    x = t / dur
    shape = np.sin(np.pi * np.clip(x, 0, 1)) ** 1.4
    nb = int(math.ceil(len(t) / 256))
    xb = np.linspace(0, 1, nb)
    centers = 300 + 2600 * np.sin(np.pi * xb) ** 1.5
    n = C.swept(noise(dur), "bandpass", [(c * 0.6, c * 1.5) for c in centers])
    tone = np.sin(2 * np.pi * np.cumsum(110 + 110 * np.sin(np.pi * x) ** 2) / SR) * 0.25
    y = (norm(n) * 0.7 + tone) * shape
    return C.stereo_sweep(norm(y) * 0.6, -0.7, 0.2)


def ignite():
    """The ring powering on: a warm, deep swell (no click), with a soft airy shimmer on top."""
    t = T(2.0)
    f = 55 + 30 * np.exp(-t / 0.25)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(t / 0.03, 0, 1) * np.exp(-t / 0.7)
    warm = sum(np.sin(2 * np.pi * C.midi(m) * t) for m in (43, 50, 55)) * np.clip(t / 0.08, 0, 1) * np.exp(-t / 0.6) * 0.25
    air = C.filt(noise(2.0), "bandpass", (2500, 7000), 2) * np.clip(t / 0.05, 0, 1) * np.exp(-t / 0.35) * 0.12
    return verb(norm(body + warm + air) * 0.8, 0.45)


def beep():
    """A soft hospital-monitor beep: a pure tone with a rounded envelope."""
    t = T(0.22)
    e = np.clip(t / 0.006, 0, 1) * np.clip((0.12 - t) / 0.02, 0, 1)
    y = (np.sin(2 * np.pi * 988 * t) + 0.15 * np.sin(2 * np.pi * 1976 * t)) * e
    return verb(st(norm(y) * 0.4), 0.25, C.IR_ROOM)


def flatline():
    """No pulse: one long steady monitor tone that slowly fades."""
    t = T(2.2)
    e = np.clip(t / 0.01, 0, 1) * np.where(t < 1.1, 1.0, np.exp(-(t - 1.1) / 0.45))
    y = (np.sin(2 * np.pi * 988 * t) + 0.15 * np.sin(2 * np.pi * 1976 * t)) * e
    return verb(st(norm(y) * 0.35), 0.25, C.IR_ROOM)


def heart():
    out = np.zeros(int(0.5 * SR))
    for d, g in ((0.0, 1.0), (0.17, 0.7)):
        t = T(0.3)
        y = np.sin(2 * np.pi * (48 + 30 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.09) * g
        i0 = int(d * SR)
        out[i0 : i0 + len(y)] += y
    return st(norm(np.tanh(out * 1.6)) * 0.9)


def roll(dur):
    """Snare roll into the first drop: eighths to thirty-seconds, rising, with a sweep — and a
    breath of silence right before the hit."""
    gap = 0.22
    body = dur - gap
    out = np.zeros(int(dur * SR))
    tt = 0.0
    while tt < body:
        k = tt / body
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        sn = C.filt(rng.standard_normal(n), "bandpass", (300 + 900 * k, 5000 + 3000 * k), 2) * np.exp(-t / 0.05)
        sn += np.sin(2 * np.pi * (180 + 160 * k) * t) * np.exp(-t / 0.03) * 0.5
        i0 = int(tt * SR)
        out[i0 : i0 + n] += sn[: len(out) - i0] * (0.25 + 0.75 * k ** 1.5)
        tt += 0.24 * (1 - k) ** 1.4 + 0.03
    r = C.riser(body, 300, 11000)
    out[: len(r)] += r * 0.8
    out[int(body * SR) :] = 0
    return C.stereo_sweep(norm(out) * 0.9, -0.2, 0.2)


def shepard(dur, up=True):
    """An endlessly rising tone (Shepard): octave-spaced sines gliding up under a fixed bell curve."""
    t = T(dur)
    y = np.zeros(len(t))
    rate = 0.18
    for o in range(7):
        pos = (o / 7 + rate * t) % 1.0
        f = 55 * 2 ** (pos * 7)
        amp = np.exp(-((pos - 0.5) ** 2) / 0.045)
        ph = 2 * np.pi * np.cumsum(f) / SR
        y += np.sin(ph) * amp
    return y


def charge(dur):
    """Power building up until the break: a rising hum with a quickening pulse, ticks that
    accelerate, and a riser on top for the last seconds. Cuts dead at the end."""
    t = T(dur)
    x = t / dur
    f = 55 * (4 ** (x ** 1.6))
    ph = 2 * np.pi * np.cumsum(f) / SR
    hum = sum(np.sin(ph * h) / h for h in range(1, 7))
    hum = C.filt(hum, "lowpass", 2400)
    trem_rate = 3 + 22 * x ** 2
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(trem_rate) / SR)
    hum *= trem * (0.15 + 0.85 * x ** 1.5)
    ticks = np.zeros(len(t))
    tt = 0.0
    while tt < dur - 0.02:
        k = tt / dur
        g = C.tick(1400 + 2200 * k) * (0.25 + 0.75 * k)
        i0 = int(tt * SR)
        ticks[i0 : i0 + len(g)] += g[: len(ticks) - i0]
        tt += 0.5 * (1 - k) ** 1.8 + 0.035
    rise = np.zeros(len(t))
    rl = min(3.2, dur)
    r = C.riser(rl, 300, 9000)
    rise[-len(r) :] += r
    sh = shepard(dur) * (0.3 + 0.7 * x)
    trem = sum(np.sin(2 * np.pi * C.midi(m) * t + m) for m in (67, 70, 74, 79)) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * (0.2 + 0.8 * x ** 2)
    trem = C.filt(trem, "lowpass", 3000)
    y = norm(hum) * 0.35 + norm(sh) * 0.55 + norm(trem) * 0.3 + ticks * 0.35 + norm(rise) * 0.55
    y[-int(0.01 * SR) :] *= np.linspace(1, 0, int(0.01 * SR))
    return C.stereo_sweep(y, -0.2, 0.2) + st(C.filt(y, "lowpass", 200)) * 0.0


KINDS = {k: v for k, v in globals().items() if callable(v) and k not in ("T", "st", "verb", "norm", "noise", "sweep_tone", "impact", "charge", "calm", "roll", "shepard", "boom808", "glide")}

GAIN = {
    "bloom": 0.6, "air": 0.5, "wipe": 0.6, "drip": 0.22, "splash": 0.32, "roller": 0.5, "brush": 0.6, "thud": 0.7, "pop": 0.45,
    "morph": 0.5, "glitch": 0.35, "suck": 0.5, "late": 0.5, "hope": 0.45, "fail": 0.45, "whoosh": 0.5, "key": 0.35,
    "nope": 0.45, "cut": 0.75, "search": 0.4, "ring": 0.35, "tick": 0.35, "fall": 0.35, "bell": 0.42, "shimmer": 0.5,
    "drop": 1.0, "slam": 0.55, "zoom": 0.5, "tap": 0.45, "success": 0.5, "notif": 0.45, "select": 0.45, "expand": 0.45,
    "bubble": 0.4, "sent": 0.4, "lock": 0.5, "dissolve": 0.55, "step": 0.4, "release": 0.5, "morphhit": 0.55,
    "spin": 0.5, "sparkle": 0.4, "coin": 0.3, "cash": 0.45, "click": 0.4, "zip": 0.4, "end": 1.0, "charge": 0.6, "calm": 0.6, "heart": 0.45, "roll": 0.8, "glide": 0.55, "ignite": 0.7, "flatline": 0.28, "beep": 0.3,
}
