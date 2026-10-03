"""Clean the EDW logo outline (a pixel trace, so every edge is a little staircase) into smooth vector
contours that hold up in extreme 3D close-ups: corners stay razor sharp, straight edges become truly
straight, curves become smooth. Writes src/edw/logo-shapes.json and public/images/edw-logo-clean.svg."""
import json, math, os, re
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "public/images/edw-logo.svg")
STEP = 1.5  # resample spacing (px)
CORNER_DEG = 38  # turning angle over the probe window that marks a corner
PROBE = 9.0  # px either side used to measure the turn


def parse(d):
    out = []
    for sub in d.split("M")[1:]:
        nums = [float(v) for v in re.findall(r"-?\d+\.?\d*", sub)]
        pts = np.array(nums).reshape(-1, 2)
        if np.allclose(pts[0], pts[-1]):
            pts = pts[:-1]
        out.append(pts)
    return out


def resample(pts, step):
    closed = np.vstack([pts, pts[:1]])
    seg = np.linalg.norm(np.diff(closed, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    L = cum[-1]
    n = max(8, int(L / step))
    s = np.linspace(0, L, n, endpoint=False)
    x = np.interp(s, cum, closed[:, 0])
    y = np.interp(s, cum, closed[:, 1])
    return np.stack([x, y], 1), L / n


def corners(p, ds):
    n = len(p)
    k = max(2, int(round(PROBE / ds)))
    idx = np.arange(n)
    a = p[(idx - k) % n]
    b = p[(idx + k) % n]
    v1 = p - a
    v2 = b - p
    ang = np.degrees(np.abs(np.arctan2(v1[:, 0] * v2[:, 1] - v1[:, 1] * v2[:, 0], (v1 * v2).sum(1))))
    # keep local maxima above the threshold, one per corner
    cand = [i for i in range(n) if ang[i] >= CORNER_DEG and ang[i] >= ang[(i - 1) % n] and ang[i] >= ang[(i + 1) % n]]
    keep = []
    for i in cand:
        if keep and (i - keep[-1]) < 2 * k:
            if ang[i] > ang[keep[-1]]:
                keep[-1] = i
            continue
        keep.append(i)
    if len(keep) > 1 and (keep[0] + n - keep[-1]) < 2 * k:
        if ang[keep[-1]] > ang[keep[0]]:
            keep[0] = keep[-1]
        keep.pop()
    return keep


def smooth_run(run, sigma):
    """Gaussian-smooth an open polyline with its two endpoints pinned."""
    if len(run) < 5:
        return run
    out = run.copy()
    r = int(3 * sigma)
    w = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    for i in range(1, len(run) - 1):
        lo, hi = max(0, i - r), min(len(run), i + r + 1)
        # shrink the window symmetrically near the pinned ends so corners never drift
        m = min(i - lo, hi - 1 - i)
        lo, hi = i - m, i + m + 1
        ww = w[r - m: r + m + 1]
        out[i] = (run[lo:hi] * ww[:, None]).sum(0) / ww.sum()
    return out


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    ab = b - a
    nrm = np.hypot(*ab)
    if nrm < 1e-6:  # a closed run: measure from the shared endpoint
        d = np.hypot(pts[:, 0] - a[0], pts[:, 1] - a[1])
    else:
        d = np.abs(ab[0] * (pts[:, 1] - a[1]) - ab[1] * (pts[:, 0] - a[0])) / nrm
    i = int(np.argmax(d))
    if d[i] > eps:
        return np.vstack([rdp(pts[: i + 1], eps)[:-1], rdp(pts[i:], eps)])
    return np.vstack([a, b])


def clean(poly):
    p, ds = resample(poly, STEP)
    cs = corners(p, ds)
    n = len(p)
    if not cs:
        # a closed curve without corners: smooth it as a loop
        q = np.vstack([p[-12:], p, p[:12]])
        q = smooth_run(q, 4.0)[12:-12]
        return rdp(np.vstack([q, q[:1]]), 0.12)[:-1]
    out = []
    for j, c in enumerate(cs):
        e = cs[(j + 1) % len(cs)]
        steps = (e - c) % n or n
        run = p[[(c + t) % n for t in range(steps + 1)]]
        a, b = run[0], run[-1]
        ab = b - a
        L = np.hypot(*ab)
        dev = np.abs(ab[0] * (run[:, 1] - a[1]) - ab[1] * (run[:, 0] - a[0])) / L if L > 1e-6 else np.full(len(run), 99.0)
        if dev.max() < 2.6:  # meant to be straight: make it truly straight
            out.append(np.vstack([a]))
            continue
        sm = smooth_run(run, 3.2)
        out.append(rdp(sm, 0.12)[:-1])
    return np.vstack(out)


def area(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)


def main():
    s = open(SRC).read()
    groups = dict(re.findall(r'<g id="([^"]+)"[^>]*>\s*<path d="([^"]+)"', s))
    res = {}
    svg_paths = []
    for gid, d in groups.items():
        polys = [clean(p) for p in parse(d)]
        res[gid] = [[[round(x, 2), round(y, 2)] for x, y in p] for p in polys]
        dd = " ".join("M " + " L ".join(f"{x:.2f},{y:.2f}" for x, y in p) + " Z" for p in polys)
        svg_paths.append(f'  <path id="{gid}" fill="#FFFFFF" fill-rule="evenodd" d="{dd}"/>')
        print(gid, [len(p) for p in polys], [round(area(p)) for p in polys])
    json.dump({"width": 1854, "height": 686, **res}, open(os.path.join(ROOT, "src/edw/logo-shapes.json"), "w"))
    open(os.path.join(ROOT, "public/images/edw-logo-clean.svg"), "w").write(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1854 686" width="1854" height="686">\n' + "\n".join(svg_paths) + "\n</svg>\n"
    )


if __name__ == "__main__":
    main()
