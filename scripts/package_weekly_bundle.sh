#!/usr/bin/env bash
set -euo pipefail

if (( $# < 2 )); then
  echo "Usage: $0 <output_dir> <bundle_name.tar.gz>" >&2
  exit 1
fi

OUT_DIR="$1"
BUNDLE="$2"

if [[ ! -d "$OUT_DIR" ]]; then
  echo "Missing output dir: $OUT_DIR" >&2
  exit 1
fi

tar -czf "$BUNDLE" -C "$OUT_DIR" .
echo "BUNDLE_CREATED: $BUNDLE"
