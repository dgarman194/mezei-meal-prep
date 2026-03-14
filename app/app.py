#!/usr/bin/env python3
import json
import sys
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from flask import Flask, abort, render_template, request, send_file

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.generate_plan import generate_weekly_plan, render_markdown
from scripts.validate_plan import format_validation_report, validate
TMP_RUNS_DIR = PROJECT_ROOT / "tmp" / "web-runs"
INTAKE_TEMPLATE_PATH = PROJECT_ROOT / "templates" / "intake-template.json"

app = Flask(__name__, template_folder="templates", static_folder="static")


def load_default_intake():
    if INTAKE_TEMPLATE_PATH.exists():
        return json.loads(INTAKE_TEMPLATE_PATH.read_text())
    return {
        "week_of": datetime.now().strftime("%Y-%m-%d"),
        "goals": {
            "daily_calorie_target": 1600,
            "daily_protein_target_g": 95,
            "meals_per_day": 3,
        },
        "preferences": {
            "vegetarian": True,
            "shrimp_ok": True,
            "max_prep_minutes": 120,
            "likes": [],
            "dislikes": [],
            "notes": "",
        },
        "inventory": {"fridge": [], "pantry": [], "freezer": []},
    }


def parse_int(value, default=None):
    try:
        if value is None or str(value).strip() == "":
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_list_text(value):
    if not value:
        return []
    parts = [x.strip() for x in str(value).replace("\n", ",").split(",")]
    return [x for x in parts if x]


def parse_inventory_section(prefix):
    items = request.form.getlist(f"{prefix}_item")
    qtys = request.form.getlist(f"{prefix}_qty")
    expires = request.form.getlist(f"{prefix}_expires")

    rows = []
    max_len = max(len(items), len(qtys), len(expires), 0)
    for i in range(max_len):
        item = items[i].strip() if i < len(items) else ""
        qty = qtys[i].strip() if i < len(qtys) else ""
        exp_raw = expires[i].strip() if i < len(expires) else ""
        exp = parse_int(exp_raw, default=None)

        if not item:
            continue

        rows.append(
            {
                "item": item,
                "qty": qty or "",
                "expires_in_days": exp,
            }
        )
    return rows


def build_intake_from_form():
    week_of = request.form.get("week_of", "").strip() or datetime.now().strftime("%Y-%m-%d")

    intake = {
        "week_of": week_of,
        "goals": {
            "daily_calorie_target": parse_int(request.form.get("daily_calorie_target"), 1600),
            "daily_protein_target_g": parse_int(request.form.get("daily_protein_target_g"), 95),
            "meals_per_day": parse_int(request.form.get("meals_per_day"), 3),
        },
        "preferences": {
            "vegetarian": True,
            "shrimp_ok": bool(request.form.get("shrimp_ok")),
            "max_prep_minutes": parse_int(request.form.get("max_prep_minutes"), 120),
            "likes": parse_list_text(request.form.get("likes")),
            "dislikes": parse_list_text(request.form.get("dislikes")),
            "notes": request.form.get("notes", "").strip(),
        },
        "inventory": {
            "fridge": parse_inventory_section("fridge"),
            "pantry": parse_inventory_section("pantry"),
            "freezer": parse_inventory_section("freezer"),
        },
    }

    return intake


def save_run_artifacts(intake, plan, validation_report):
    TMP_RUNS_DIR.mkdir(parents=True, exist_ok=True)
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + uuid4().hex[:6]
    run_dir = TMP_RUNS_DIR / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    intake_path = run_dir / "intake.json"
    plan_json_path = run_dir / "weekly-plan.json"
    plan_md_path = run_dir / "weekly-plan.md"
    validation_path = run_dir / "validation.txt"

    intake_path.write_text(json.dumps(intake, indent=2))
    plan_json_path.write_text(json.dumps(plan, indent=2))
    plan_md_path.write_text(render_markdown(intake, plan))
    validation_path.write_text(validation_report)

    return run_id


@app.get("/")
def index():
    intake = load_default_intake()
    return render_template(
        "index.html",
        intake=intake,
        intake_json=json.dumps(intake),
        result=None,
        run_id=None,
    )


@app.post("/generate")
def generate():
    intake = build_intake_from_form()
    plan = generate_weekly_plan(intake)
    errors, warnings = validate(plan)
    validation_report = format_validation_report("weekly-plan.json", errors, warnings)
    run_id = save_run_artifacts(intake, plan, validation_report)

    result = {
        "plan": plan,
        "errors": errors,
        "warnings": warnings,
        "validation_report": validation_report,
    }

    return render_template(
        "index.html",
        intake=intake,
        intake_json=json.dumps(intake),
        result=result,
        run_id=run_id,
    )


@app.get("/download/<run_id>/<filename>")
def download(run_id, filename):
    allowed = {"intake.json", "weekly-plan.json", "weekly-plan.md", "validation.txt"}
    if filename not in allowed:
        abort(404)

    run_dir = TMP_RUNS_DIR / run_id
    target = run_dir / filename

    if not target.exists() or not target.is_file():
        abort(404)

    return send_file(target, as_attachment=True)


@app.get("/health")
def health():
    return {"ok": True}


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)
