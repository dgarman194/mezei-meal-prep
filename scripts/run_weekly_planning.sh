#!/usr/bin/env bash
set -euo pipefail

if (( $# < 2 )); then
  echo "Usage: $0 <intake.json> <output_dir>" >&2
  exit 1
fi

INTAKE="$1"
OUT_DIR="$2"

mkdir -p "$OUT_DIR"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

PLAN_MD="$OUT_DIR/weekly-plan.md"
PLAN_JSON="$OUT_DIR/weekly-plan.json"
VALIDATION_TXT="$OUT_DIR/validation.txt"

python3 "$SCRIPT_DIR/generate_plan.py" \
  --intake "$INTAKE" \
  --out "$PLAN_MD" \
  --json-out "$PLAN_JSON"

set +e
python3 "$SCRIPT_DIR/validate_plan.py" --plan-json "$PLAN_JSON" > "$VALIDATION_TXT" 2>&1
RC=$?
set -e

if (( RC == 0 )); then
  echo "VALIDATION: PASS"
else
  echo "VALIDATION: FAIL (see $VALIDATION_TXT)"
fi

echo "OUTPUT_DIR: $OUT_DIR"
echo "PLAN_MD: $PLAN_MD"
echo "PLAN_JSON: $PLAN_JSON"
echo "VALIDATION_TXT: $VALIDATION_TXT"
exit $RC
