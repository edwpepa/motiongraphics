#!/usr/bin/env bash
# Fetches the few CC0 (public domain) instrument samples the launch score plays, from the Versilian Community
# Sample Library (https://github.com/sgossner/VCSL), and stores them trimmed as FLAC in tools/audio/.vcsl/.
# Usage: tools/audio/fetch_vcsl.sh            (or VCSL_REPO=<existing checkout> to skip the download)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/.vcsl"
LIST="$HERE/vcsl-files.txt"
REPO="${VCSL_REPO:-}"
if [ -z "$REPO" ]; then
  TMP="$(mktemp -d)"
  git clone --filter=blob:none --no-checkout --depth 1 https://github.com/sgossner/VCSL "$TMP/repo"
  (cd "$TMP/repo" && tr '\n' '\0' < "$LIST" | xargs -0 git checkout HEAD --)
  REPO="$TMP/repo"
fi
mkdir -p "$OUT"
while IFS= read -r f; do
  name="$(basename "$f" .wav)"
  case "$f" in
    *Piano*) trim=(-t 7 -af "afade=t=out:st=6:d=1") ;;
    *) trim=(-t 9) ;;
  esac
  ffmpeg -nostdin -v error -y -i "$REPO/$f" "${trim[@]}" -ar 44100 -sample_fmt s16 "$OUT/$name.flac"
done < "$LIST"
echo "$(ls "$OUT" | wc -l) samples in $OUT"
