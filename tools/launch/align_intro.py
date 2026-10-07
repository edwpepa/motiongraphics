"""Word onsets for the new launch intro voiceover (public/audio/launch-vo-intro2.mp3): spoken runs come from pauses;
runs holding several phrases are split at the deepest energy dip near the syllable-proportional boundary; inside a
phrase words are spread by syllables and snapped to dips. Writes src/launch/intro-words.json."""
import json, os, re, subprocess, tempfile
import numpy as np
from scipy.io import wavfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
# (run start, run end, [(key, text), ...]) — runs measured with silencedetect at -42 dB
RUNS = [
    (0.11, 3.03, [("probleme", "Probleme prin casă care îți dau bătăi de cap?")]),
    (3.95, 8.53, [("priza", "O priză stricată,"), ("iarba", "iarba netunsă,"), ("dulap", "dulapul care stă nemontat de o lună.")]),
    (8.88, 12.87, [("timpul", "Și tu n-ai nici timpul,"), ("sculele", "nici sculele,"), ("nervii", "nici nervii pentru toate astea.")]),
    (13.34, 14.45, [("amani", "Și tot amâni...")]),
    (14.88, 15.75, [("speri", "Și speri că,")]),
    (15.90, 16.49, [("cumva", "cumva,")]),
    (16.70, 17.80, [("singur", "se rezolvă singur.")]),
]
VOW = "aeiouăâîy"


def syll(w):
    w = re.sub(r"[^a-zăâîșț]", "", w.lower())
    g = re.findall(f"[{VOW}]+", w)
    return max(1.0, sum(1 if len(x) < 3 else 2 for x in g))


def main():
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "v.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "public/audio/launch-vo-intro2.mp3"), "-ac", "1", "-ar", "16000", wav], check=True)
        sr, x = wavfile.read(wav)
    x = x.astype(float) / 32768
    hop = sr // 100
    db = 20 * np.log10(np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)]) + 1e-9)
    dip = lambda t, r: (lambda lo, hi: (lo + int(np.argmin(db[lo:hi]))) / 100)(int((t - r) * 100), int((t + r) * 100))  # noqa: E731
    out = {}
    for a, b, phrases in RUNS:
        sy = [sum(syll(w) for w in t.split()) for _, t in phrases]
        bounds, acc = [a], 0
        for s in sy[:-1]:
            acc += s
            bounds.append(dip(a + (b - a) * acc / sum(sy), 0.25))
        bounds.append(b)
        for (key, text), p0, p1 in zip(phrases, bounds[:-1], bounds[1:]):
            ws = text.split()
            w8 = [syll(w) for w in ws]
            t, res = p0, []
            for i, w in enumerate(ws):
                on = t if i == 0 else dip(t, 0.08) + 0.02
                res.append([w, round(on, 2)])
                t += (p1 - p0) * w8[i] / sum(w8)
            out[key] = {"start": round(p0, 2), "end": round(p1, 2), "text": text, "words": res}
    json.dump(out, open(os.path.join(ROOT, "src/launch/intro-words.json"), "w"), ensure_ascii=False, indent=1)
    for k, v in out.items():
        print(k, " ".join(f"{w}@{s}" for w, s in v["words"]))


if __name__ == "__main__":
    main()
