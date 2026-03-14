# Mezei Weekly Meal-Prep Planner

A practical weekly planner for Mezei's Sunday workflow.

Now includes a **mobile-first local web app** so Mezei can run planning without editing JSON or shell commands.

## Goal
Given current fridge + pantry inventory each Sunday, generate a weekly plan that:
- tastes good (not bland)
- supports weight loss
- stays within **vegetarian + shrimp okay** constraints
- minimizes food waste by using perishables first

## What's Included
- `app/` — local web app (intake form + one-tap plan generation)
- `docs/PROJECT_DEFINITION.md` — problem statement, constraints, outputs
- `docs/WEEKLY_WORKFLOW.md` — Sunday workflow (intake -> planning -> shopping -> prep)
- `docs/WEB_APP_QUICKSTART.md` — how Mezei uses the web app
- `docs/TASTE_FRAMEWORK.md` — practical framework for consistently tasty meals
- `docs/MEAL_LIBRARY_DIRECTION.md` — direction for expanding meal variety without losing simplicity
- `specs/MVP_SPEC.md` — MVP product spec and acceptance criteria
- `prompts/system_prompt.md` — reusable prompt for weekly LLM-powered planning
- `templates/intake-template.json` — structured weekly intake input
- `templates/output-template.md` — plan output shape
- `scripts/generate_plan.py` — planner engine
- `scripts/validate_plan.py` — plan validation
- `scripts/run_weekly_planning.sh` — CLI run (existing workflow)
- `scripts/run_web_app.sh` — launch web app
- `examples/` — sample intake + generated plan artifacts
- `runbooks/SUNDAY_RUNBOOK.md` — practical checklist

## Quick Start (Web App - Recommended)
```bash
cd ~/.openclaw/workspace/projects/mezei-weekly-meal-prep
./scripts/run_web_app.sh
```
Then open: `http://127.0.0.1:8080`

## Quick Start (CLI)
```bash
cd ~/.openclaw/workspace/projects/mezei-weekly-meal-prep
cp templates/intake-template.json tmp/intake-$(date +%Y-%m-%d).json
# Edit intake file with current inventory

./scripts/run_weekly_planning.sh tmp/intake-YYYY-MM-DD.json tmp/output-YYYY-MM-DD
```

CLI outputs:
- `weekly-plan.md`
- `weekly-plan.json`
- `validation.txt`

## Local Testing
```bash
./scripts/run_tests.sh
```

## Notes
- Planning is deterministic (no external APIs required).
- Flavor quality is improved via built-in taste upgrades + weekly sauce/finisher rotation.
- Validation checks diet constraints and quality gates before prep.
