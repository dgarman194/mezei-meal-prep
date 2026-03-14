# Weekly Workflow (Sunday)

## 0) Prep Time Target
Total weekly planning time target: **20-35 minutes**

## 1) Inventory Intake (5-10 min)
Recommended: use the local web app (`./scripts/run_web_app.sh`) and fill:
- Fridge items + rough quantities + expires_in_days
- Pantry/freezer staples
- Current week preferences (likes/dislikes, shrimp yes/no, prep time)
- Weight-loss targets (calories/protein)

CLI fallback: `templates/intake-template.json`

### Intake Tips
- Rough estimates are okay (`"half bag"`, `"1 can"`, `"~12 oz"`)
- If expiry unknown, leave as blank/null
- Include "already cooked" leftovers explicitly

## 2) Plan Generation (1-2 min)
### Web app (recommended)
- Tap **Generate Weekly Plan**
- Download `weekly-plan.md`, `weekly-plan.json`, `validation.txt`

### CLI fallback
```bash
./scripts/run_weekly_planning.sh <intake.json> <output_dir>
```

## 3) Human Review & Adjust (8-12 min)
Quickly inspect:
- Is variety acceptable?
- Any disliked meals this week?
- Is shrimp frequency okay?
- Are prep steps realistic for Sunday time?
- Does shopping list feel minimal but sufficient?

If needed, edit intake preferences and rerun.

## 4) Prep Block Execution (60-120 min)
Follow plan sections:
1. Cook grains/legumes first
2. Roast/chop vegetables
3. Prepare sauces/dressings
4. Cook protein components (tofu/tempeh/shrimp/eggs if used)
5. Assemble storage containers

## 5) Midweek Use-Up Check (Wed, 5 min)
- Re-open `weekly-plan.md`
- Confirm perishables were used as planned
- Use flex meals and substitutions to prevent waste

## 6) End-of-Week Feedback Capture (Fri/Sat, 3 min)
Update next intake notes:
- Meals she liked/disliked
- Which meals were too repetitive
- What spoiled / what ran out early
- Any energy/hunger issues

This improves next Sunday’s run quality.
