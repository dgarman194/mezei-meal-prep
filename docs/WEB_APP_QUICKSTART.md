# Web App Quickstart (Mezei)

## 1) Start it
```bash
cd ~/.openclaw/workspace/projects/mezei-weekly-meal-prep
./scripts/run_web_app.sh
```
Open `http://127.0.0.1:8080` on phone or laptop (same machine).

## 2) Fill weekly intake
- Set week date
- Confirm calorie/protein targets
- Toggle shrimp allowed yes/no
- Add fridge/pantry/freezer items (qty + expiry days when known)
- Add likes/dislikes for this week

## 3) Generate
Tap **Generate Weekly Plan**.

You immediately get:
- Validation status
- Meal lineup + 7-day schedule
- Prep steps
- Shopping additions
- Flavor upgrade guidance
- Macro summary

## 4) Save outputs
Use download links for:
- `weekly-plan.md`
- `weekly-plan.json`
- `validation.txt`

Saved runs are in `tmp/web-runs/<run-id>/`.

## Weekly rhythm
- Sunday: run planner + prep
- Wednesday: reopen last plan and use the use-up + fallback sections
- Friday: note what tasted great vs repetitive and put into likes/dislikes next week
