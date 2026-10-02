#!/usr/bin/env bash
# Renders both cuts of the explainer (extra args go to every remotion render, e.g.
# --browser-executable=... or --frames=0-89):
#   out/handly-explainer.mp4       1920x1080
#   out/handly-explainer-reel.mp4  1080x1920 (Instagram Reel)
#
# Video and audio are rendered separately and muxed by ffmpeg: Remotion's own AAC mux leaves the
# encoder priming in, so the soundtrack lands ~43 ms late in most players; ffmpeg's mux doesn't.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

render() {
  local comp=$1 out=$2
  shift 2
  npx remotion render src/index.ts "$comp" "out/.$comp-video.mp4" --muted --jpeg-quality=95 --x264-preset=slow --gl=angle "$@"
  npx remotion render src/index.ts "$comp" "out/.$comp-audio.wav" --codec=wav "$@"
  ffmpeg -v error -y -i "out/.$comp-video.mp4" -i "out/.$comp-audio.wav" \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -movflags +faststart "$out"
  rm -f "out/.$comp-video.mp4" "out/.$comp-audio.wav"
  echo "wrote $out"
}

render HandlyExplainer out/handly-explainer.mp4 "$@"
render HandlyExplainerReel out/handly-explainer-reel.mp4 "$@"
