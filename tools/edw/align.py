"""Assemble the EDW voiceover from the two ElevenLabs takes with cinematic pauses, and estimate word onsets
(phrase spans measured from silence gaps; inside a phrase words are spread by syllables, snapped to energy dips).
Writes public/audio/edw-vo.wav (gitignored) and src/edw/vo-words.json (absolute times on the film timeline)."""
import json, os, re, subprocess, tempfile
import numpy as np
from scipy.io import wavfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SR = 44100
END = 70.0
# (source file, src from, src to, placed at)
PIECES = [
    ("edw-vo1.mp3", 0.0, 12.30, 1.40),
    ("edw-vo2.mp3", 0.0, 15.40, 14.00),
    ("edw-vo2.mp3", 16.20, 40.40, 31.60),
    ("edw-vo3.mp3", 0.0, 8.83, 56.84),  # the radio take of the closing lines
]
# key, piece, src start, src end, text
PHRASES = [
    ("born", 0, 0.16, 2.73, "Some people are born with something in their head"),
    ("rest", 0, 2.96, 4.41, "that never lets them rest."),
    ("teaches", 0, 5.24, 6.66, "Nobody teaches it to them"),
    ("away", 0, 6.94, 8.49, "and nobody can take it away,"),
    ("spark", 0, 9.11, 12.00, "it's a spark they carry from the very beginning."),
    ("comfort", 1, 0.14, 2.17, "While everyone else looks for comfort,"),
    ("calm", 1, 2.44, 4.19, "they stay calm and keep working,"),
    ("going", 1, 4.67, 6.46, "because they already know where they're going."),
    ("applause", 1, 7.17, 8.89, "They don't need applause along the way,"),
    ("finished", 1, 9.30, 11.39, "they only need to see the thing finished,"),
    ("history", 1, 11.78, 15.12, "and that is how the biggest things in history ended up being built."),
    ("edw", 2, 16.41, 17.66, "At EDW ENTERPRISE,"),
    ("roof", 2, 17.80, 20.97, "we decided to bring those people together under one roof."),
    ("specialists", 2, 21.45, 24.11, "Software specialists, hardware specialists,"),
    ("technicians", 2, 24.40, 26.68, "technicians who can make almost anything work,"),
    ("dare", 2, 27.14, 30.73, "all of them with ideas that most companies wouldn't even dare to try."),
    ("room", 2, 31.28, 33.58, "When you put minds like that in the same room,"),
    ("build", 2, 33.91, 35.60, "there's very little they can't build,"),
    ("apps", 2, 35.94, 40.15, "from mobile apps and web platforms to custom hardware made for your project."),
    ("idea", 3, 0.15, 2.92, "If you've got an idea you can't get out of your head,"),
    ("write", 3, 3.02, 3.71, "write to us."),
    ("best", 3, 4.10, 6.86, "We build the best applications and software out there,"),
    ("yours", 3, 7.13, 8.82, "and we'd love to build yours."),
]
SYL = {"edw": 5, "enterprise,": 3, "everyone": 3, "nobody": 3, "people": 2, "specialists,": 4, "technicians": 3,
       "applications": 4, "companies": 3, "platforms": 2, "hardware": 2, "software": 2, "history": 3, "custom": 2}


def syll(w):
    lw = w.lower().strip(".,")
    if lw in SYL or lw + "," in SYL:
        return SYL.get(lw, SYL.get(lw + ","))
    lw = re.sub(r"[^a-z]", "", lw)
    n = len(re.findall(r"[aeiouy]+", lw))
    if lw.endswith("e") and not lw.endswith("le") and n > 1:
        n -= 1
    return max(1, n)


def load(path):
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "x.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), wav], check=True)
        _, x = wavfile.read(wav)
    return x.astype(np.float64) / 32768


def main():
    src = {f: load(os.path.join(ROOT, "public/audio", f)) for f in {p[0] for p in PIECES}}
    out = np.zeros(int(END * SR))
    for f, a, b, at in PIECES:
        seg = src[f][int(a * SR):int(b * SR)].copy()
        fl = int(0.02 * SR)
        seg[:fl] *= np.linspace(0, 1, fl)
        seg[-fl:] *= np.linspace(1, 0, fl)
        i = int(at * SR)
        out[i:i + len(seg)] += seg
    wavfile.write(os.path.join(ROOT, "public/audio/edw-vo.wav"), SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))

    hop = SR // 100
    e = np.array([np.sqrt(np.mean(out[i:i + hop] ** 2)) for i in range(0, len(out) - hop, hop)])
    db = 20 * np.log10(e + 1e-9)
    res = {}
    for key, p, sa, sb, text in PHRASES:
        shift = PIECES[p][3] - PIECES[p][1]
        a, b = sa + shift, sb + shift
        words = text.split()
        ws = [syll(w) for w in words]
        tot = sum(ws)
        t = a
        wl = []
        for i, w in enumerate(words):
            on = t
            if i > 0:
                lo, hi = int((on - 0.08) * 100), int((on + 0.08) * 100)
                lo = max(lo, int(a * 100) + 1)
                s = db[lo:hi]
                if len(s):
                    on = (lo + int(np.argmin(s))) / 100 + 0.02
            wl.append([w, round(on, 2)])
            t += (b - a) * ws[i] / tot
        res[key] = {"start": round(a, 2), "end": round(b, 2), "text": text, "words": wl}
    json.dump(res, open(os.path.join(ROOT, "src/edw/vo-words.json"), "w"), indent=1)
    for k, v in res.items():
        print(k, " ".join(f"{w}@{s}" for w, s in v["words"]))


if __name__ == "__main__":
    main()
