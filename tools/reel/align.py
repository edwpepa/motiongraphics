"""Place the voiceover of the EDW reel from the two ElevenLabs takes with cinematic pauses, and estimate word onsets
(phrase spans measured from silence gaps; inside a phrase words are spread by syllables, snapped to energy dips).
Writes public/audio/reel-vo.wav (gitignored) and src/reel/vo-words.json (absolute times on the film timeline)."""
import json, os, re, subprocess, tempfile
import numpy as np
from scipy.io import wavfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SR = 44100
END = 74.5
# (source file, src from, src to, placed at)
PIECES = [
    ("reel-vo.mp3", 0.0, 71.0, 0.5),
]
# key, piece, src start, src end, text
PHRASES = [
    ("person", 0, 0.13, 3.90, "Every person on this planet is different in ways we barely notice,"),
    ("laugh", 0, 4.23, 8.32, "from the way they eat and laugh to the way they think and act around other people."),
    ("genes", 0, 9.16, 10.62, "Some of it is in our genes,"),
    ("parents", 0, 10.90, 13.94, "but most of it comes from our parents, our education,"),
    ("place", 0, 14.19, 15.32, "the place we grew up in,"),
    ("idea", 0, 15.56, 19.11, "and every idea we ever heard or came up with on our own."),
    ("imagine", 0, 19.69, 23.30, "Now imagine running that same process on artificial minds!"),
    ("world", 0, 23.70, 27.77, "A simulated world where every individual is an AI that grows up,"),
    ("forms", 0, 28.05, 29.23, "forms its own ideas,"),
    ("matures", 0, 29.46, 31.90, "and matures based on the environment it's raised in,"),
    ("alike", 0, 32.13, 34.81, "with no two of them thinking exactly alike."),
    ("changes", 0, 35.68, 37.84, "And here's the part that changes everything:"),
    ("faster", 0, 38.34, 41.39, "that world would run exponentially faster than ours,"),
    ("days", 0, 41.66, 45.30, "so what took us thousands of years could happen in a matter of days."),
    ("lead", 0, 45.82, 46.69, "Where would that lead?"),
    ("rockets", 0, 47.22, 50.31, "Would they build rockets and try to conquer other planets like we did?"),
    ("god", 0, 50.74, 52.24, "Would they start believing in a god?"),
    ("invent", 0, 52.68, 56.60, "Or would they invent things that benefit them in ways we haven't even thought of yet?"),
    ("greater", 0, 57.06, 60.91, "They could easily create things twenty times greater than anything we've built,"),
    ("today", 0, 61.25, 64.15, "maybe even things we could start using in our own world today."),
    ("peak", 0, 64.70, 67.12, "So what would the peak of their civilization look like?"),
    ("comments", 0, 67.62, 69.14, "Tell me in the comments what you think,"),
    ("bet", 0, 69.74, 70.78, "I'm curious what you'd bet on."),
]
SYL = {"artificial": 4, "individual": 5, "exponentially": 5, "civilization": 5, "environment": 4, "education,": 4, "simulated": 4, "everything:": 3, "every": 2, "ever": 2, "idea": 3, "ideas,": 3, "rockets": 2, "believing": 3, "thousands": 2, "twenty": 2, "comments": 2, "curious": 3, "planet": 2, "planets": 2, "different": 3, "barely": 2, "genes,": 1, "parents,": 2, "matures": 2, "imagine": 3, "process": 2, "minds!": 1, "ai": 2, "anything": 3, "easily": 3, "benefit": 3, "conquer": 2, "edw": 4, "technically": 4, "seriously": 4, "remotely": 3, "percentage": 3, "website": 2, "section,": 2, "everyone": 3, "problems": 2, "enterprise,": 3, "everyone": 3, "nobody": 3, "people": 2, "specialists,": 4, "technicians": 3,
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
    wavfile.write(os.path.join(ROOT, "public/audio/reel-vo.wav"), SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))

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
    json.dump(res, open(os.path.join(ROOT, "src/reel/vo-words.json"), "w"), indent=1)
    for k, v in res.items():
        print(k, " ".join(f"{w}@{s}" for w, s in v["words"]))


if __name__ == "__main__":
    main()
