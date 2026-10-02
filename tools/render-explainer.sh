#!/usr/bin/env bash
# Renders the 16:9 explainer to out/handly-explainer.mp4 (extra args go to both remotion renders,
# e.g. --browser-executable=... or --frames=0-89).
#
# Video and audio are rendered separately and muxed by ffmpeg: Remotion's own AAC mux leaves the
# encoder priming in, so the soundtrack lands ~43 ms late in most players; ffmpeg's mux doesn't.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
npx remotion render src/index.ts HandlyExplainer out/.explainer-video.mp4 --muted --jpeg-quality=95 --x264-preset=slow "$@"
npx remotion render src/index.ts HandlyExplainer out/.explainer-audio.wav --codec=wav "$@"
ffmpeg -v error -y -i out/.explainer-video.mp4 -i out/.explainer-audio.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -movflags +faststart out/handly-explainer.mp4
rm -f out/.explainer-video.mp4 out/.explainer-audio.wav
echo "wrote out/handly-explainer.mp4"
