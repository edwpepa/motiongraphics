#!/usr/bin/env bash
# Pre-render the 3D logo shots once (composition EdwLogoFilm) to public/video/, so the full film renders fast.
# Re-run only when src/edw/logo3d.tsx or src/edw/logoShots.ts change.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p public/video
read MID0 MID1 END0 END1 < <(node -e '
const W=require("./src/edw/vo-words.json");const w=(k,i=0)=>W[k].words[i][1];
const MID_END=w("roof",0)+0.45, FIN=w("yours",0)-0.05;
console.log(Math.floor(29.4*30), Math.ceil(MID_END*30), Math.floor(FIN*30), 70*30-1)')
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
for part in mid end; do
  if [ $part = mid ]; then F="$MID0-$MID1"; else F="$END0-$END1"; fi
  npx remotion render src/index.ts EdwLogoFilm public/video/edw-logo-$part.mp4 --frames=$F --concurrency=4 --timeout=400000 \
    --gl=angle --browser-executable=$B --crf=10 --log=error
done
ls -la public/video/
