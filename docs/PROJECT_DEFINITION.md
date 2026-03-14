# Project Definition — Mezei Weekly Meal-Prep Planner

## Problem Statement
Each Sunday, Mezei knows what ingredients she already has in her fridge/pantry/freezer, but turning that into a **good, realistic, weight-loss-friendly weekly plan** is inconsistent and time-consuming.

This project creates a repeatable system that converts weekly inventory into:
1. a structured weekly meal plan,
2. prep-day batch tasks,
3. shopping additions,
4. use-up guidance to reduce waste.

## Primary User
- Mezei (single primary user)

## Dietary Profile
- Vegetarian baseline
- Shrimp allowed
- No other mandatory exclusions yet (captured each week in intake)

## Success Criteria
A successful weekly run should produce a plan that:
- Uses existing ingredients first (especially perishables)
- Meets calorie/protein intent for weight loss
- Is prep-feasible in a single Sunday block
- Includes a concise shopping list for missing ingredients
- Includes practical leftovers/use-up strategy

## Constraints
- Weekly planning cadence: Sunday
- Input quality varies (free-text or rough quantities)
- Need to support "good enough" output even with incomplete inventory details
- Plan must avoid non-vegetarian proteins except shrimp
- Must be understandable without technical knowledge

## Inputs
Minimum required:
- Week start date
- Inventory lists (fridge/pantry/freezer)
- Approximate quantities (rough OK)
- Perishability (or expiry estimate) when known
- Preferences/dislikes for the week
- Prep time budget

Optional:
- Target calories/day
- Target protein/day
- Number of meals/snacks per day
- Budget sensitivity

## Required Outputs
1. **Weekly Plan**
   - 7-day lunch/dinner schedule (and optional breakfast/snack pattern)
   - Estimated calories/protein per main meal
2. **Sunday Prep Plan**
   - Batch steps ordered by efficiency
   - What to cook now vs later in week
3. **Shopping List**
   - Missing ingredients grouped by category
4. **Use-Up Guide**
   - Ingredients to consume first
   - Substitution/fallback suggestions
5. **Validation Summary**
   - Diet compliance, variety, prep feasibility, macro sanity checks

## Non-Goals (MVP)
- Full nutrition-label precision
- Automated grocery ordering
- Dynamic price optimization
- Multi-user profiles
