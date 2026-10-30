"""Tighten the word timestamps of the voice-over to the audio itself, so on-screen words land exactly on the voice.
The transcript's word times (whisper, ±0.1–0.3 s, sometimes two words on one instant) are snapped to the real
onsets in the recording: rises of energy in the speech band, found per phrase and assigned in order by dynamic
programming (each word to the onset nearest its estimate, never reordered, at least 70 ms apart).
Writes src/launch/vo-words-aligned.json and src/launch/intro-words-aligned.json (same shape as the originals)."""
import json, os, subprocess, tempfile
import numpy as np
import scipy.io.wavfile as wavfile
from scipy import signal

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
SR = 22050
HOP = 0.005


def load(p):
    with tempfile.TemporaryDirectory() as td:
        o = os.path.join(td, "x.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-ac", "1", "-ar", str(SR), o], check=True)
        _, x = wavfile.read(o)
    return x.astype(float) / 32768


def onsets(x):
    sos = signal.butter(4, [250, 4000], "bandpass", fs=SR, output="sos")
    y = signal.sosfilt(sos, x)
    h, w = int(HOP * SR), int(0.025 * SR)
    n = (len(y) - w) // h
    db = np.array([10 * np.log10(np.mean(y[i * h:i * h + w] ** 2) + 1e-10) for i in range(n)])
    db = signal.medfilt(db, 3)
    floor = np.percentile(db, 20)
    rise = np.zeros(n)
    k = int(0.03 / HOP)
    rise[k:] = db[k:] - db[:-k]
    rise = np.maximum(rise, 0)
    peaks, props = signal.find_peaks(rise, height=5.0, distance=int(0.06 / HOP))
    keep = [p for p in peaks if db[min(n - 1, p + 4)] > floor + 14]
    # report the onset at the start of the rise, not its top
    out = []
    for p in keep:
        q = p
        while q > 0 and db[q - 1] < db[q] - 0.3 and p - q < int(0.05 / HOP):
            q -= 1
        out.append(q * HOP + 0.0125)
    return np.array(out), rise


def assign(pred, cands, window=0.22, miss=0.12, gap=0.07):
    """monotonic DP: word i takes candidate j (or keeps its estimate), increasing, gap ≥ 70 ms"""
    n = len(pred)
    options = []
    for p in pred:
        cs = [c for c in cands if abs(c - p) <= window]
        options.append([(p, miss)] + [(c, abs(c - p)) for c in cs])
    best = [dict() for _ in range(n)]
    for j, (t, c) in enumerate(options[0]):
        best[0][j] = (c, None)
    for i in range(1, n):
        for j, (t, c) in enumerate(options[i]):
            b = None
            for pj, (pc, _) in best[i - 1].items():
                if options[i - 1][pj][0] + gap <= t and (b is None or pc < b[0]):
                    b = (pc, pj)
            if b is not None:
                best[i][j] = (b[0] + c, b[1])
        if not best[i]:  # nothing fits: keep the estimate, chained after the best previous
            pj = min(best[i - 1], key=lambda q: best[i - 1][q][0])
            options[i].append((max(pred[i], options[i - 1][pj][0] + gap), miss))
            best[i][len(options[i]) - 1] = (best[i - 1][pj][0] + miss, pj)
    j = min(best[-1], key=lambda q: best[-1][q][0])
    out = [0.0] * n
    for i in range(n - 1, -1, -1):
        out[i] = options[i][j][0]
        j = best[i][j][1]
    return out


def run(words_json, audio, out_json):
    W = json.load(open(os.path.join(ROOT, words_json)))
    x = load(os.path.join(ROOT, audio))
    cands, _ = onsets(x)
    moved = []
    for k, ph in W.items():
        pred = [v for _, v in ph["words"]]
        if not pred:
            continue
        new = assign(pred, cands)
        new[0] = min(new[0], ph["start"] + 0.12) if new[0] > ph["start"] + 0.12 else new[0]
        ph["words"] = [[t, round(v, 3)] for (t, _), v in zip(ph["words"], new)]
        moved += [abs(a - b) for a, b in zip(pred, new)]
    json.dump(W, open(os.path.join(ROOT, out_json), "w"), ensure_ascii=False, indent=1)
    m = np.array(moved)
    print(f"{out_json}: {len(m)} words, moved median {np.median(m)*1000:.0f} ms, >80 ms: {(m > 0.08).sum()}, max {m.max()*1000:.0f} ms")


if __name__ == "__main__":
    TL = json.load(open(os.path.join(ROOT, "src/launch/timeline.json")))
    run("src/launch/vo-words.json", "public/audio/launch-vo.mp3", "src/launch/vo-words-aligned.json")
    run("src/launch/intro-words.json", "public/audio/" + TL["intro"]["file"], "src/launch/intro-words-aligned.json")
