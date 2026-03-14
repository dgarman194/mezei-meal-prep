# MVP Spec — Mezei Weekly Meal-Prep Planner

## Objective
Deliver a weekly repeatable planning system that converts inventory + goals into an actionable meal-prep plan with shopping/use-up guidance.

## MVP Components
1. Mobile-first local web app intake + one-tap generation flow
2. Structured intake format (JSON template; still supported)
3. Deterministic planning engine (Python)
4. Markdown output plan + machine-readable JSON output
5. Validation script for diet + quality gates
6. Sunday runbook/checklist
7. Reusable LLM system prompt for higher-quality generation mode

## Functional Requirements
- FR1: Accept intake through web form (mobile-first) and JSON template
- FR2: Maintain diet compliance (vegetarian + optional shrimp)
- FR3: Prioritize perishable ingredients in meal selection
- FR4: Generate weekly meal schedule for 7 days
- FR5: Generate prep task list and shopping list
- FR6: Estimate rough macros (calories/protein) at meal and daily average level
- FR7: Produce use-up-first list and fallback substitutions
- FR8: Validate output and report pass/fail checks
- FR9: Include quick flavor guidance (sauces + meal-specific taste upgrades)
- FR10: Allow download of markdown/json/validation outputs from web app

## Quality Gates
- QG1: >=4 distinct main meals across the week
- QG2: No forbidden proteins (chicken/beef/pork/fish except shrimp)
- QG3: Shrimp meals <= 3 main-meal slots/week unless explicitly raised
- QG4: Daily average calories in user target +/- 200 kcal
- QG5: Daily average protein >= target - 15g
- QG6: Includes explicit shopping list + prep steps + use-up guidance
- QG7: Includes flavor playbook with at least one meal-specific taste upgrade per selected meal

## Input Schema (MVP)
See `templates/intake-template.json`.

## Output Schema (MVP)
- Human-readable: `weekly-plan.md`
- Structured: `weekly-plan.json`
  - selected_meals
  - schedule
  - shopping_list
  - use_up_first
  - macro_summary
  - validation_hints

## Risks / Limits
- Macro estimates are approximate
- Inventory quantities are user-estimated
- Meal catalog is finite; may feel repetitive without periodic updates

## Post-MVP Roadmap
- Personal taste scoring from past weeks
- Better seasonal variety
- Budget-aware substitutions
- Optional calorie cycling by day type
- Optional grocery API/export integration
