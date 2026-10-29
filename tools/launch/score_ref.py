"""Original score for the reference-style launch film: arena stomp-rock energy, written for this cut.
125 bpm (the film's beat grid), D minor. Real acoustic drums, percussion and a Steinway from the Versilian
Community Sample Library (CC0, public domain: tools/audio/fetch_vcsl.sh) under synthesized bass, pads and lead.
No borrowed melody, riff or recording.

  verse      piano alone, a heartbeat; then stomp + clap; then stomp-stomp-clap, a filtered bass riff, timpani;
             a build that pulls out under "Handly." and lands on the drop
  chorus     the drop: kick + stomp, snare + a wall of claps on the backbeat, the bass riff, piano hook, braam
  breakdown  warm and slow from "Dar Handly…" (no sudden change), growing back through the tasker part
  build      snare roll, toms, timpani roll, a cymbal swell — the break — the final chorus — one last hit
"""
import json
import math
import os
import re
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
import compose as C  # noqa: E402

SR = C.SR
ROOT = C.ROOT
VC = os.path.join(ROOT, "tools/audio/.vcsl")
rng = np.random.default_rng(7)
TL = json.load(open(os.path.join(ROOT, "src/launch/timeline.json")))
D = TL["drop"]
END = TL["end"]
N = int(END * SR)
BEAT = 0.4799
BAR = 4 * BEAT


def beat(k):
    return D + k * BEAT


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ samples
_cache = {}


def smp(name):
    """a CC0 sample as float stereo (2, n), leading silence trimmed, peak 1"""
    if name not in _cache:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(VC, name + ".flac"), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).T.astype(np.float64)
        a = np.max(np.abs(x), axis=0)
        on = int(np.argmax(a > np.max(a) * 0.02))
        x = x[:, max(0, on - 32):]
        _cache[name] = x / (np.max(np.abs(x)) + 1e-9)
    return _cache[name]


def repitch(x, semis):
    if abs(semis) < 1e-3:
        return x
    r = 2 ** (semis / 12)
    n = int(x.shape[1] / r)
    idx = np.arange(n) * r
    return np.stack([np.interp(idx, np.arange(x.shape[1]), x[c]) for c in range(2)])


def cut(x, dur, fade=0.06):
    n = min(x.shape[1], int(dur * SR))
    y = x[:, :n].copy()
    k = min(n, int(fade * SR))
    if k:
        y[:, -k:] *= np.linspace(1, 0, k)[None, :]
    return y


def rr(names):
    return names[int(rng.integers(len(names)))]


KICKS = [f"BDrumNew_hit_v7_rr{i}_Sum" for i in (1, 2)]
KICKS_SOFT = [f"BDrumNew_hit_v3_rr{i}_Sum" for i in (1, 2)]
SNARES = [f"Snare2_HitSN_v9_rr{i}_Mid" for i in (1, 2)] + [f"Snare3M_HitSN_v5_rr{i}_Mid" for i in (1, 2)]
SNARES_MID = [f"Snare2_HitSN_v5_rr{i}_Mid" for i in (1, 2)]
CLAPS = [f"Clap_rr{i}" for i in range(1, 7)]
STOMPS = [f"HDrumL_Hit_v3_rr{i}_Sum" for i in (1, 2)]
HATS = [f"HiHat_HitC_v2_rr{i}_Mid" for i in (1, 2)] + [f"HiHat_Close_rr{i}_Mid" for i in (1, 2)]
TOMH = [f"TomH_HitS_v4_rr{i}_Mid" for i in (1, 2)]
TOML = [f"TomL_HitS_v4_rr{i}_Mid" for i in (1, 2)]

# the piano: whole-tone sampled, the nearest note re-pitched (never more than a semitone)
PC = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
PIANO = {3: {}, 4: {}}
for fn in os.listdir(VC) if os.path.isdir(VC) else []:
    mm = re.match(r"JHPiano_Sus_Close_([A-G]#?)(\d)_vl(\d)_rr1\.flac", fn)
    if mm:
        PIANO[int(mm.group(3))][12 * (int(mm.group(2)) + 1) + PC[mm.group(1)]] = fn[:-5]


def piano(m, vel=4, dur=None):
    bank = PIANO[vel]
    k = min(bank, key=lambda q: abs(q - m))
    x = repitch(smp(bank[k]), m - k)
    if dur is not None:
        x = cut(x, dur + 0.35, 0.35)
    return x


def chord(notes, vel=4, dur=None, spread=0.012):
    n = max(1, len(notes))
    parts = [piano(m, vel, dur) for m in notes]
    L = max(p.shape[1] for p in parts) + int(spread * n * SR)
    out = np.zeros((2, L))
    for i, p in enumerate(parts):
        d = int(i * spread * SR * rng.uniform(0.3, 1.0))
        out[:, d:d + p.shape[1]] += p
    return out / n ** 0.6


# ------------------------------------------------------------------ synths
def fsaw(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    ph = (np.cumsum(f) / SR + phase) % 1.0
    return 2 * ph - 1


def adsr(n, a, d, s, r):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    return e * np.clip((dur - t) / max(r, 1e-4), 0, 1)


def sub_kick(g=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t / 0.028)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.26)
    return C.stereo(np.tanh(y * 1.6) * g)


def growl(m, dur, cutoff=1300, drive=2.6):
    """the bass: two detuned saws and a sub, driven, filtered"""
    n = int((dur + 0.02) * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    y = fsaw(f * 0.997, n, rng.random()) + fsaw(f * 1.003, n, rng.random())
    y = C.filt(np.tanh(y * drive), "lowpass", cutoff, 2)
    sub = np.sin(2 * np.pi * f * t) * 0.9
    return (y * 0.45 + sub) * adsr(n, 0.004, 0.2, 0.8, 0.025)


def pad(notes, dur, attack=0.6, release=1.2, cutoff=1800, voices=5, detune=12.0):
    n = int((dur + release) * SR)
    out = np.zeros((2, n))
    for m in notes:
        for v in range(voices):
            cents = (v / (voices - 1) - 0.5) * 2 * detune
            out += C.stereo(fsaw(mtof(m) * 2 ** (cents / 1200), n, rng.random()), (v / (voices - 1)) * 1.4 - 0.7)
    out = np.stack([C.filt(out[c], "lowpass", cutoff, 2) for c in range(2)])
    return out * adsr(n, attack, 1.2, 0.85, release)[None, :] / (len(notes) * voices) * 2.2


def lead(m, dur):
    """a bright saw lead for the hook, doubled an octave down, with a breath of vibrato"""
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) / 0.2, 0, 1)
    y = sum(fsaw(mtof(m) * vib * 2 ** (c / 1200), n, rng.random()) for c in (-9, 0, 9)) + 0.6 * fsaw(mtof(m - 12) * vib, n)
    y = C.filt(y, "lowpass", 4200, 2)
    return y * adsr(n, 0.01, 0.4, 0.7, 0.2) * 0.3


def braam(root, dur):
    """a low brassy swell-hit: saws an octave apart, a filter that opens then closes"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = sum(fsaw(mtof(m) * (1 + 0.003 * i), n, rng.random()) for i, m in enumerate((root - 12, root, root + 7, root + 12)))
    y = np.tanh(y * 1.4)
    lo = C.filt(y, "lowpass", 380, 2)
    hi = C.filt(y, "lowpass", 2400, 2)
    k = np.exp(-t / 0.35)
    return C.stereo((lo * (1 - k) + hi * k) * adsr(n, 0.005, 0.8, 0.5, 0.6) * 0.5)


def reverse(x):
    return x[:, ::-1].copy()


# ------------------------------------------------------------------ harmony + melody (original)
# verse: Dm  Bb  Gm  A      chorus: Dm  Bb  F  C      breakdown (2 bars each): Bb  F  Gm  Dm
VERSE = [(38, [50, 53, 57]), (34, [50, 53, 58]), (31, [50, 55, 58]), (33, [49, 52, 57])]
CHORUS = [(38, [50, 53, 57]), (34, [50, 53, 58]), (41, [48, 53, 57]), (36, [48, 52, 55])]
BREAK_PROG = [(34, [50, 53, 58]), (41, [48, 53, 57]), (31, [50, 55, 58]), (38, [50, 53, 57])]
HOOK = [
    [(0, 69, 0.75), (0.75, 69, 0.75), (1.5, 77, 1.0), (2.5, 76, 0.5), (3, 74, 1.0)],
    [(0, 74, 0.75), (0.75, 74, 0.75), (1.5, 77, 0.5), (2, 79, 1.0), (3, 77, 1.0)],
    [(0, 72, 0.75), (0.75, 72, 0.75), (1.5, 77, 1.0), (2.5, 76, 0.5), (3, 72, 1.0)],
    [(0, 76, 0.75), (0.75, 79, 0.75), (1.5, 76, 1.0), (2.5, 74, 1.5)],
]
# the bass riff, in sixteenths: (step, interval above the root, length in steps)
RIFF = [(0, 0, 2), (3, 0, 2), (6, 12, 1), (8, 0, 2), (10, 0, 1), (11, 7, 2), (14, 10, 2)]


def build(marks=None):
    B = {k: np.zeros((2, N)) for k in ("kick", "drums", "verb", "bass", "keys", "pad", "lead", "fx")}
    chain = np.ones(N)
    marks = marks or {}
    FINAL = D + TL["finalR"]
    END_HIT = D + TL["endHitR"]
    BRIDGE = D + TL["bridgeR"]
    BRK = D + TL["breakR"]
    BUILD = marks.get("suspense", BRK - 4 * BEAT)

    def place(bus, x, at, g=1.0, pan=None):
        if at >= END or g <= 0:
            return
        if x.ndim == 1:
            x = C.stereo(x, pan or 0.0)
        elif pan:
            x = np.stack([x[0] * (1 - max(0, pan)), x[1] * (1 + min(0, pan))])
        if at < 0:
            x = x[:, int(-at * SR):]
            at = 0.0
        C.place(B[bus], x, at, g)

    def duck(at, depth=0.65, tau=0.11):
        i = int(at * SR)
        if i >= N or i < 0:
            return
        dip = 1 - depth * np.exp(-np.arange(int(0.45 * SR)) / SR / tau)
        j = min(N, i + len(dip))
        chain[i:j] = np.minimum(chain[i:j], dip[: j - i])

    def kick(at, g=1.0, soft=False):
        place("kick", smp(rr(KICKS_SOFT if soft else KICKS)), at, 0.9 * g)
        place("kick", sub_kick(), at, 0.75 * g)
        duck(at, 0.7 * min(1, g))

    def stomp(at, g=1.0, pan=0.0):
        place("drums", smp(rr(STOMPS)), at, 0.85 * g, pan)
        place("verb", smp(rr(STOMPS)), at, 0.35 * g)

    def snare(at, g=1.0, claps=1.0, soft=False):
        s = smp(rr(SNARES_MID if soft else SNARES))
        place("drums", s, at, 0.8 * g)
        place("verb", s, at, 0.6 * g)
        for i in range(3 if claps > 0 else 0):
            c = smp(rr(CLAPS))
            d = rng.uniform(0, 0.012)
            place("drums", c, at + d, 0.38 * g * claps, (i - 1) * 0.5)
            place("verb", c, at + d, 0.45 * g * claps)

    def clap(at, g=1.0):
        for i in range(4):
            c = smp(rr(CLAPS))
            d = rng.uniform(0, 0.014)
            place("drums", c, at + d, 0.4 * g, (i - 1.5) * 0.4)
            place("verb", c, at + d, 0.55 * g)

    def hat(at, g=1.0, open_=False):
        place("drums", smp("HiHat_HitO_rr1_Mid") if open_ else cut(smp(rr(HATS)), 0.4), at, 0.25 * g, 0.35)

    def tom(at, high=True, g=1.0):
        t = smp(rr(TOMH if high else TOML))
        place("drums", t, at, 0.7 * g, -0.3 if high else 0.3)
        place("verb", t, at, 0.4 * g)

    def crash(at, g=1.0, which="cymbal_crash1_ff2"):
        place("fx", smp(which), at, 0.5 * g)
        place("verb", smp(which), at, 0.15 * g)

    def timp(at, m, g=1.0):
        # Timpani1 sits near F#2; re-pitch it to the note
        place("drums", repitch(smp("Timpani1_Hit_v4_rr1_Sum"), m - 42), at, 0.9 * g)
        place("verb", repitch(smp("Timpani1_Hit_v4_rr1_Sum"), m - 42), at, 0.5 * g)

    def boom(at, g=1.0):
        place("drums", smp("bassdrum_hit_ff"), at, 1.0 * g)
        place("verb", smp("bassdrum_hit_ff"), at, 0.4 * g)
        place("kick", sub_kick(1.2), at, 0.9 * g)
        duck(at, 0.85, 0.2)

    def riff(t0, root, g=1.0, cutoff=1300, steps=16):
        for st, iv, L in RIFF:
            if st >= steps:
                continue
            place("bass", C.stereo(growl(root + iv, L * BEAT / 4 * 0.92, cutoff)), t0 + st * BEAT / 4, 0.55 * g)

    def hook(t0, bar_i, g=1.0, with_lead=False):
        for b, m, L in HOOK[bar_i % 4]:
            place("keys", chord([m, m - 12], 4, L * BEAT * 0.95, 0.004), t0 + b * BEAT, 0.5 * g)
            if with_lead:
                place("lead", C.stereo(lead(m, L * BEAT * 0.95)), t0 + b * BEAT, 0.5 * g)

    # ========================================================== verse (beats before the drop)
    place("fx", C.reverse_swell(2.0), 0.0, 0.18)
    k_first = int(math.ceil(-D / BEAT))
    for kb in range(int(math.floor(k_first / 4)) * 4, 0, 4):
        t0 = beat(kb)
        bar = kb // 4
        root, tones = VERSE[bar % 4]
        x = (kb - k_first) / (-k_first)  # 0 → 1 across the verse
        part = "A" if kb < -44 else "A2" if kb < -28 else "B" if kb < -12 else "C"
        last_bar = kb == -4
        # piano: quarters → eighths → driving octaves
        if part in ("A", "A2"):
            for q, m in enumerate((root, tones[2], tones[0] + 12, tones[1] + 12)):
                place("keys", piano(m + (0 if q else 12), 3, BEAT * 1.6), t0 + q * BEAT, 0.42 + 0.1 * x)
        elif part == "B":
            for e in range(8):
                m = (tones[0], tones[2], tones[1] + 12, tones[2])[e % 4] + (12 if e >= 4 else 0)
                place("keys", piano(m, 3, BEAT * 0.6), t0 + e * BEAT / 2, 0.42)
            place("keys", chord([root + 12, root + 24], 3, BAR), t0, 0.3)
        else:
            for e in range(8):
                if last_bar and e >= 5:
                    break
                place("keys", chord([root + 24, root + 36], 4, BEAT * 0.45), t0 + e * BEAT / 2, 0.42)
            place("keys", chord(tones, 4, BEAT * 0.4), t0 + 1.5 * BEAT, 0.3)
        place("pad", pad([root + 12] + tones, BAR, attack=0.8 if part != "C" else 0.2, release=0.8, cutoff=700 + 1300 * x), t0, 0.32 + 0.12 * x)
        # rhythm
        if part == "A":
            kick(t0, 0.45, soft=True)
            kick(t0 + 0.75 * BEAT, 0.25, soft=True)
        elif part == "A2":
            stomp(t0, 0.6)
            stomp(t0 + 2 * BEAT, 0.5)
            clap(t0 + 3 * BEAT, 0.35)
            place("bass", C.stereo(growl(root, BAR * 0.95, 380, 1.4)), t0, 0.35)
        elif part == "B":
            for b in (0, 2):
                stomp(t0 + b * BEAT, 0.75)
                stomp(t0 + (b + 0.5) * BEAT, 0.6)
                clap(t0 + (b + 1) * BEAT, 0.55)
            for e in range(8):
                hat(t0 + e * BEAT / 2, 0.5 if e % 2 else 0.8)
            riff(t0, root, 0.5, cutoff=420)
            if bar % 2 == 0:
                timp(t0, root + 12, 0.55)
        else:
            if not last_bar:
                for b in (0, 2):
                    kick(t0 + b * BEAT, 0.8)
                    stomp(t0 + (b + 0.5) * BEAT, 0.7)
                    snare(t0 + (b + 1) * BEAT, 0.7, 0.8)
                for e in range(8):
                    hat(t0 + e * BEAT / 2, 0.6 if e % 2 else 0.9)
                riff(t0, root, 0.6, cutoff=650)
                timp(t0, root + 12, 0.6)
            else:
                # the last bar: everything pulls back under "Handly.", only the swell is left
                kick(t0, 0.8)
                snare(t0 + BEAT, 0.6, 0.6)
                for j in range(4):
                    tom(t0 + 1.5 * BEAT + j * BEAT / 4, j < 2, 0.5 + 0.1 * j)
    # the swell into the drop
    place("fx", C.riser(4 * BEAT, 300, 9000), beat(-8), 0.35)
    cres = smp("susCymb1_cresc_2s")
    place("fx", cres, D - cres.shape[1] / SR + 0.02, 0.5)
    place("fx", reverse(cut(smp("cymbal_crash1_ff2"), 1.6, 0.02)), D - 1.6 + 0.01, 0.35)

    # ========================================================== chorus 1: the drop
    def chorus(k0, k_end, bigger=1.0, hook_bars=(0, 1, 2, 3), lead_on=False, hit_at=None):
        for kb in range(k0, k_end, 4):
            t0 = beat(kb)
            bar_i = (kb - k0) // 4
            if hit_at is not None and t0 >= hit_at - 0.01:
                break
            root, tones = CHORUS[bar_i % 4]
            fill = bar_i % 4 == 3
            for b in (0, 0.75, 2, 2.75):
                kick(t0 + b * BEAT, 1.0 if b in (0, 2) else 0.7)
            stomp(t0, 0.8 * bigger, -0.2)
            stomp(t0 + 2 * BEAT, 0.7 * bigger, 0.2)
            snare(t0 + BEAT, bigger)
            if not fill:
                snare(t0 + 3 * BEAT, bigger)
            else:
                for j in range(4):
                    tom(t0 + (3 + j / 4) * BEAT, j < 2, 0.7 + 0.1 * j)
            for e in range(8):
                hat(t0 + e * BEAT / 2, 1.0 if e % 2 == 0 else 0.6, open_=(e == 7 and not fill))
            for b in (1, 3):
                place("drums", smp("Tamb1_Hit_v2_rr1_Mid"), t0 + b * BEAT, 0.3 * bigger, 0.5)
            if bigger > 1.05:
                for s in range(16):
                    place("drums", cut(smp("Tamb1_Shake_rr1_Mid"), 0.12), t0 + s * BEAT / 4, 0.1 + 0.05 * (s % 2 == 0), -0.4)
            if bar_i % 4 == 0:
                crash(t0, 0.9 * bigger)
            riff(t0, root, 1.0)
            # piano: the chord on 1, stabs on the off-beats
            place("keys", chord([n + 12 for n in tones], 4, BEAT * 1.2), t0, 0.32)
            for e in (3, 7):
                place("keys", chord([n + 12 for n in tones], 3, BEAT * 0.3), t0 + e * BEAT / 2, 0.22)
            if bar_i in hook_bars or lead_on:
                hook(t0, bar_i, 1.0 if bar_i in hook_bars else 0.6, lead_on)
            place("pad", pad([root + 12] + [n + 12 for n in tones], BAR, attack=0.04, release=0.3, cutoff=3200), t0, 0.3 * bigger)

    k_hit = int(round((BRIDGE - D) / BEAT)) - 1
    hit = beat(k_hit)
    boom(D, 1.0)
    timp(D, 38, 1.0)
    crash(D, 1.2, "cymbal_crash1_ff3")
    place("pad", braam(38, 2.6), D, 0.55)
    chorus(0, 200, 1.0, hook_bars=(0, 1, 2, 3, 8, 9), hit_at=hit)
    # the run into the hit, the hit, and its long tail
    for j in range(6):
        tom(hit - 1.5 * BEAT + j * BEAT / 4, j < 3, 0.6 + 0.08 * j)
    place("fx", C.riser(BEAT * 2, 600, 9000), hit - BEAT * 2, 0.25)
    boom(hit, 1.0)
    timp(hit, 38, 0.9)
    snare(hit, 1.0)
    crash(hit, 1.0, "cymbal_crash1_ff3")
    place("keys", chord([26, 38, 50, 57, 62], 4), hit, 0.45)
    place("pad", braam(38, 2.4), hit, 0.4)

    # ========================================================== breakdown: warm, from "Dar Handly…" on
    k_br = k_hit + 1
    k_build = int(math.floor((BUILD - D) / BEAT))
    place("pad", pad([50, 57, 62, 65], (beat(k_build) - beat(k_br)) + 0.5, attack=2.4, release=1.5, cutoff=1400), beat(k_br) - 0.3, 0.55)
    for kb in range(k_br, k_build, 4):
        t0 = beat(kb)
        x = (kb - k_br) / max(1, k_build - k_br)
        root, tones = BREAK_PROG[((kb - k_br) // 8) % 4]
        # piano: a slow figure that fills in
        figure = (0, 2, 1, 2) if x < 0.45 else (0, 2, 1, 2, 0, 2, 1, 2)
        step = BEAT if len(figure) == 4 else BEAT / 2
        for i, q in enumerate(figure):
            m = tones[q] + 12 + (12 if i % 4 == 3 else 0)
            place("keys", piano(m, 3, step * 1.8), t0 + i * step, 0.38 + 0.12 * x)
        if (kb - k_br) % 8 == 0:
            place("keys", piano(root + 12, 3), t0, 0.35)
        place("pad", pad([root + 12] + tones, BAR, attack=0.5, release=0.8, cutoff=900 + 1400 * x), t0, 0.22 + 0.15 * x)
        if x > 0.18:
            kick(t0, 0.35 + 0.35 * x, soft=x < 0.5)
            clap(t0 + 2 * BEAT, 0.25 + 0.35 * x)
            for s in range(8):
                place("drums", cut(smp("Tamb1_Shake_rr2_Mid"), 0.15), t0 + s * BEAT / 2, 0.06 + 0.04 * x, -0.4)
        if x > 0.42:
            place("bass", C.stereo(growl(root, BAR * 0.95, 500 + 500 * x, 1.6)), t0, 0.32 + 0.2 * x)
            stomp(t0 + 0.5 * BEAT, 0.5 * x)
            for e in range(8):
                hat(t0 + e * BEAT / 2, 0.4 + 0.3 * x)
        if x > 0.66:
            kick(t0 + 2 * BEAT, 0.6)
            snare(t0 + BEAT, 0.45 + 0.3 * x, 0.6)
            snare(t0 + 3 * BEAT, 0.45 + 0.3 * x, 0.6)
            riff(t0, root, 0.45, cutoff=500 + 600 * x)

    # ========================================================== build → break → final
    tb = beat(k_build)
    span = BRK - tb
    nsteps = int(span / (BEAT / 4))
    for j in range(nsteps):
        u = j / max(1, nsteps)
        t = tb + j * BEAT / 4
        snare(t, 0.25 + 0.65 * u, 0.0, soft=True)
        if u > 0.5:
            snare(t + BEAT / 8, 0.2 + 0.6 * u, 0.0, soft=True)
        if j % 2 == 0:
            tom(t, j % 4 == 0, 0.4 + 0.5 * u)
            kick(t, 0.4 + 0.5 * u)
    roll = smp("Timpani1_Roll_v5_rr1_Sum")
    place("drums", repitch(cut(roll, span + 0.1), -4), tb, 0.6)
    place("fx", C.riser(span, 250, 12000), tb, 0.55)
    swell = smp("susCymb1_cresc_2s")
    place("fx", swell, BRK - swell.shape[1] / SR + 0.03, 0.55)
    place("bass", C.stereo(growl(38, span, 900, 2.0)), tb, 0.4)
    # the break: silence, one high piano note under "Handly.", and the breath in
    place("keys", piano(74, 3), D + TL["postStart"]["handly"] + 0.02 if "postStart" in TL else BRK + 0.2, 0.32)
    place("fx", reverse(cut(smp("cymbal_crash1_ff3"), 1.3, 0.02)), FINAL - 1.3 + 0.01, 0.5)

    kf = int(round((FINAL - D) / BEAT))
    ke = int(round((END_HIT - D) / BEAT))
    boom(FINAL, 1.1)
    timp(FINAL, 38, 1.0)
    crash(FINAL, 1.3, "cymbal_crash1_ff3")
    place("pad", braam(38, 2.6), FINAL, 0.6)
    chorus(kf, ke - 4, 1.18, hook_bars=(0, 1, 2, 3), lead_on=True)
    # the last bar: a fill all the way into the end hit
    t0 = beat(ke - 4)
    root, tones = CHORUS[3]
    kick(t0, 1.0)
    snare(t0 + BEAT, 1.1)
    riff(t0, root, 1.0, steps=8)
    hook(t0, 3, 1.0, True)
    for j in range(8):
        tom(t0 + 2 * BEAT + j * BEAT / 4, j % 4 < 2, 0.7 + 0.05 * j)
        snare(t0 + 2 * BEAT + j * BEAT / 4, 0.3 + 0.08 * j, 0.0, soft=True)
    place("fx", C.riser(2 * BEAT, 500, 12000), t0 + 2 * BEAT, 0.4)
    # the end
    ring = END - END_HIT
    boom(END_HIT, 1.25)
    timp(END_HIT, 38, 1.1)
    snare(END_HIT, 1.1)
    crash(END_HIT, 1.4, "cymbal_crash1_ff3")
    place("keys", chord([26, 38, 50, 57, 62, 65], 4), END_HIT, 0.55)
    place("pad", braam(38, ring), END_HIT, 0.55)
    place("pad", pad([50, 57, 62, 65, 69], ring - 0.4, attack=0.01, release=1.2, cutoff=3000), END_HIT, 0.4)
    place("bass", C.stereo(growl(26, ring - 0.3, 600)), END_HIT, 0.5)

    # ========================================================== mixdown
    for k in ("bass", "pad", "keys", "lead"):
        B[k] *= chain[None, :] ** (1.0 if k == "bass" else 0.5)
    hall = C.reverb(B["verb"] * 0.8 + B["keys"] * 0.35 + B["lead"] * 0.4 + B["pad"] * 0.25 + B["fx"] * 0.2, C.IR_HALL)[:, :N]
    room = C.reverb(B["drums"] * 0.5, C.IR_ROOM)[:, :N]
    drums = B["kick"] + B["drums"] + room * 0.35
    # drum bus: parallel crush for the arena weight
    crush = np.tanh(drums * 3.0) / 3.0
    drums = drums * 0.8 + crush * 0.9
    mix = drums + B["bass"] * 0.55 + B["keys"] * 0.75 + B["pad"] * 0.42 + B["lead"] * 0.35 + B["fx"] * 0.5 + hall * 0.32
    mix = np.stack([C.filt(mix[c], "highpass", 30, 2) for c in range(2)])
    # glue: a slow RMS compressor, then a soft clip
    env = C.follower(np.mean(np.abs(mix), axis=0), 0.01, 0.25)
    thr = np.percentile(env, 70)
    gain = np.where(env > thr, (thr / (env + 1e-9)) ** 0.35, 1.0)
    mix = mix * gain[None, :]
    mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.6) / np.tanh(1.6)
    return mix


if __name__ == "__main__":
    import scipy.io.wavfile as wavfile

    m = build()
    m /= np.max(np.abs(m)) + 1e-9
    wavfile.write(os.path.join(sys.argv[1] if len(sys.argv) > 1 else ".", "score_ref.wav"), SR, (m.T * 32767 * 0.9).astype(np.int16))
