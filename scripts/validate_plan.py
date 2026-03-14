#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

FORBIDDEN = ["chicken", "beef", "pork", "bacon", "turkey", "ham", "sausage", "salmon", "tuna", "cod"]


def fail(msg, errors):
    errors.append(msg)


def warn(msg, warnings):
    warnings.append(msg)


def validate(plan, max_shrimp_slots=3):
    errors = []
    warnings = []

    meals = plan.get("selected_meals", [])
    if len(meals) < 4:
        fail("Need at least 4 selected meals.", errors)

    names = set(m.get("name") for m in meals)
    if len(names) < 4:
        fail("Meal variety too low (<4 unique meal names).", errors)

    shrimp_meal_names = {m["name"] for m in meals if m.get("type") == "shrimp"}

    schedule = plan.get("schedule", [])
    if len(schedule) != 7:
        fail("Schedule must include 7 days.", errors)

    shrimp_slots = 0
    for row in schedule:
        lunch = row.get("lunch", "")
        dinner = row.get("dinner", "")
        if lunch in shrimp_meal_names:
            shrimp_slots += 1
        if dinner in shrimp_meal_names:
            shrimp_slots += 1

    if shrimp_slots > max_shrimp_slots:
        warn(f"Shrimp slots high ({shrimp_slots}>{max_shrimp_slots}).", warnings)

    text_blob = json.dumps(meals).lower()
    for x in FORBIDDEN:
        if x in text_blob:
            fail(f"Forbidden meat/fish term found: {x}", errors)

    shopping = plan.get("shopping_list", {})
    if not isinstance(shopping, dict):
        fail("shopping_list must be an object grouped by category.", errors)

    if "prep_steps" not in plan or len(plan.get("prep_steps", [])) < 4:
        fail("prep_steps missing or too short (<4).", errors)

    flavor = plan.get("flavor_playbook", {})
    if not flavor:
        warn("Flavor playbook missing (meals may feel bland/repetitive).", warnings)
    else:
        upgrades = flavor.get("meal_upgrades", [])
        if len(upgrades) < len(meals):
            warn("Not all meals include taste upgrades.", warnings)

    macro = plan.get("macro_summary", {})
    if not macro:
        fail("macro_summary missing.", errors)
    else:
        target_cal = macro.get("target_calories")
        est_cal = macro.get("estimated_avg_daily_calories")
        target_pro = macro.get("target_protein_g")
        est_pro = macro.get("estimated_avg_daily_protein_g")

        if isinstance(target_cal, (int, float)) and isinstance(est_cal, (int, float)):
            if abs(est_cal - target_cal) > 250:
                warn(f"Calories off target by >250 kcal ({est_cal} vs {target_cal}).", warnings)

        if isinstance(target_pro, (int, float)) and isinstance(est_pro, (int, float)):
            if est_pro < target_pro - 20:
                warn(f"Protein below target by >20g ({est_pro} vs {target_pro}).", warnings)

    return errors, warnings


def format_validation_report(plan_path, errors, warnings):
    lines = [
        "PLAN_VALIDATION_REPORT",
        f"file={plan_path}",
        f"errors={len(errors)}",
        f"warnings={len(warnings)}",
    ]

    if errors:
        lines.append("\nERRORS:")
        for e in errors:
            lines.append(f"- {e}")

    if warnings:
        lines.append("\nWARNINGS:")
        for w in warnings:
            lines.append(f"- {w}")

    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description="Validate generated weekly meal plan JSON.")
    ap.add_argument("--plan-json", required=True, help="Path to weekly-plan.json")
    args = ap.parse_args()

    p = Path(args.plan_json)
    plan = json.loads(p.read_text())

    errors, warnings = validate(plan)

    print(format_validation_report(p, errors, warnings), end="")

    if errors:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
