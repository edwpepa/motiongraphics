"""Assemble the EDW hiring voiceover from the two ElevenLabs takes with cinematic pauses, and estimate word onsets
(phrase spans measured from silence gaps; inside a phrase words are spread by syllables, snapped to energy dips).
Writes public/audio/hire-vo.wav (gitignored) and src/hire/vo-words.json (absolute times on the film timeline)."""
import json, os, re, subprocess, tempfile
import numpy as np
from scipy.io import wavfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SR = 44100
END = 49.0
# (source file, src from, src to, placed at)
PIECES = [
    ("hire-vo1.mp3", 0.0, 15.23, 1.30),
    ("hire-vo2.mp3", 0.0, 15.98, 17.60),
    ("hire-vo2.mp3", 15.98, 25.55, 35.20),
]
# key, piece, src start, src end, text
PHRASES = [
    ("growing", 0, 0.13, 4.17, "EDW Enterprise is growing, and we have three open spots on the team."),
    ("many", 0, 4.70, 6.30, "We're not looking for many people,"),
    ("sharp", 0, 6.56, 12.08, "only for the ones who are seriously sharp technically and who solve problems the way other people breathe,"),
    ("calm", 0, 12.46, 15.22, "calmly and without needing anyone to push them."),
    ("share", 1, 0.07, 3.73, "Everyone who joins gets a percentage of the projects we build together,"),
    ("create", 1, 4.05, 5.29, "so what we create"),
    ("yours", 1, 5.52, 6.50, "is partly yours."),
    ("anywhere", 1, 6.92, 8.87, "You can work from anywhere in the world,"),
    ("remote", 1, 9.09, 10.47, "remotely or in person,"),
    ("rest", 1, 10.76, 11.96, "and we'll figure out the rest,"),
    ("build", 1, 12.26, 14.30, "because we care about what you can build"),
    ("sit", 1, 14.58, 15.79, "and not about where you sit."),
    ("you", 2, 16.24, 17.35, "If that sounds like you,"),
    ("website", 2, 17.61, 18.58, "go to our website,"),
    ("hiring", 2, 18.86, 21.06, "open the hiring section, and fill out the form."),
    ("tell", 2, 21.50, 24.11, "Tell us what you've built and what problems you've solved,"),
    ("there", 2, 24.38, 25.54, "and we'll take it from there."),
]
SYL = {"edw": 4, "technically": 4, "seriously": 4, "remotely": 3, "percentage": 3, "website": 2, "section,": 2, "everyone": 3, "problems": 2, "enterprise,": 3, "everyone": 3, "nobody": 3, "people": 2, "specialists,": 4, "technicians": 3,
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
    wavfile.write(os.path.join(ROOT, "public/audio/hire-vo.wav"), SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))

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
    json.dump(res, open(os.path.join(ROOT, "src/hire/vo-words.json"), "w"), indent=1)
    for k, v in res.items():
        print(k, " ".join(f"{w}@{s}" for w, s in v["words"]))


if __name__ == "__main__":
    main()
