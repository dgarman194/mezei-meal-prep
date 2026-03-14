#!/usr/bin/env python3
import argparse
import json
from collections import defaultdict
from pathlib import Path

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

MEAL_CATALOG = [
    {
        "name": "Lentil Spinach Curry Bowls",
        "type": "vegetarian",
        "ingredients": ["lentils", "spinach", "onion", "garlic", "coconut milk", "tomato"],
        "kcal": 430,
        "protein_g": 24,
        "prep": "batch",
        "flavor_tags": ["curry", "warm", "savory"],
        "taste_upgrade": "Bloom curry powder + cumin in oil, finish with lemon and cilantro.",
    },
    {
        "name": "Chickpea Greek Salad Boxes",
        "type": "vegetarian",
        "ingredients": ["chickpeas", "cucumber", "tomato", "feta", "olive oil", "lemon"],
        "kcal": 390,
        "protein_g": 19,
        "prep": "batch",
        "flavor_tags": ["mediterranean", "bright", "fresh"],
        "taste_upgrade": "Salt cucumbers first, then toss with lemon zest + oregano vinaigrette.",
    },
    {
        "name": "Tofu Veggie Stir-Fry + Brown Rice",
        "type": "vegetarian",
        "ingredients": ["tofu", "broccoli", "bell pepper", "brown rice", "soy sauce", "garlic"],
        "kcal": 470,
        "protein_g": 30,
        "prep": "batch",
        "flavor_tags": ["soy-ginger", "umami", "savory"],
        "taste_upgrade": "Pan-sear tofu hard, then glaze with soy-ginger-garlic and chili crisp.",
    },
    {
        "name": "Shrimp Zucchini Skillet with Quinoa",
        "type": "shrimp",
        "ingredients": ["shrimp", "zucchini", "quinoa", "garlic", "lemon", "olive oil"],
        "kcal": 410,
        "protein_g": 33,
        "prep": "quick",
        "flavor_tags": ["lemon-herb", "bright", "quick"],
        "taste_upgrade": "Marinate shrimp 10 min with lemon, paprika, garlic, then finish with parsley.",
    },
    {
        "name": "Greek Yogurt Overnight Oats",
        "type": "vegetarian",
        "ingredients": ["greek yogurt", "oats", "chia seeds", "berries"],
        "kcal": 340,
        "protein_g": 22,
        "prep": "batch",
        "flavor_tags": ["sweet", "creamy", "fresh"],
        "taste_upgrade": "Use pinch of salt + cinnamon + vanilla; add toasted nuts at serving time.",
    },
    {
        "name": "Egg White Veggie Muffins + Fruit",
        "type": "vegetarian",
        "ingredients": ["egg whites", "spinach", "bell pepper", "onion"],
        "kcal": 280,
        "protein_g": 23,
        "prep": "batch",
        "flavor_tags": ["savory", "light", "quick"],
        "taste_upgrade": "Sauté veggies first and add feta/chili flakes for stronger flavor.",
    },
    {
        "name": "Black Bean Taco Bowls",
        "type": "vegetarian",
        "ingredients": ["black beans", "brown rice", "corn", "salsa", "avocado", "lime"],
        "kcal": 460,
        "protein_g": 20,
        "prep": "batch",
        "flavor_tags": ["tex-mex", "smoky", "savory"],
        "taste_upgrade": "Toast spices, add chipotle-lime yogurt sauce, finish with pickled onions.",
    },
    {
        "name": "Cottage Cheese Power Snack Plate",
        "type": "vegetarian",
        "ingredients": ["cottage cheese", "carrot", "cucumber", "hummus"],
        "kcal": 260,
        "protein_g": 21,
        "prep": "quick",
        "flavor_tags": ["fresh", "salty", "crunchy"],
        "taste_upgrade": "Season cottage cheese with za'atar + olive oil; add crunchy roasted chickpeas.",
    },
]

FORBIDDEN_MEAT_WORDS = [
    "chicken", "beef", "pork", "bacon", "turkey", "ham", "sausage", "salmon", "tuna", "cod"
]


def normalize(text):
    return str(text).strip().lower()


def split_csv_words(text):
    if not text:
        return []
    if isinstance(text, list):
        return [normalize(x) for x in text if normalize(x)]
    parts = [p.strip() for p in str(text).replace("\n", ",").split(",")]
    return [normalize(p) for p in parts if p]


def build_inventory_index(intake):
    idx = {}
    perishable = {}
    inventory = intake.get("inventory", {})
    for section in ["fridge", "pantry", "freezer"]:
        for row in inventory.get(section, []):
            item = normalize(row.get("item", ""))
            if not item:
                continue
            idx[item] = row.get("qty", "")
            exp = row.get("expires_in_days")
            if isinstance(exp, int):
                perishable[item] = exp
    return idx, perishable


def meal_score(meal, inv_idx, perish_idx, dislikes, likes, shrimp_ok):
    if meal["type"] == "shrimp" and not shrimp_ok:
        return -10_000

    name_l = normalize(meal["name"])
    for d in dislikes:
        if d and d in name_l:
            return -1_000

    matched = 0
    perish_bonus = 0
    missing = 0
    for ing in meal["ingredients"]:
        ing_n = normalize(ing)
        if ing_n in inv_idx:
            matched += 1
            exp = perish_idx.get(ing_n)
            if exp is not None and exp <= 4:
                perish_bonus += (5 - exp)
        else:
            missing += 1

    like_bonus = 0
    meal_text = " ".join([meal["name"]] + meal.get("ingredients", []) + meal.get("flavor_tags", []))
    meal_text_n = normalize(meal_text)
    for liked in likes:
        if liked and liked in meal_text_n:
            like_bonus += 2

    base = matched * 3 + perish_bonus * 2 - missing
    protein_bonus = meal.get("protein_g", 0) // 8
    return base + protein_bonus + like_bonus


def choose_meals(intake, inv_idx, perish_idx):
    prefs = intake.get("preferences", {})
    shrimp_ok = bool(prefs.get("shrimp_ok", True))
    dislikes = split_csv_words(prefs.get("dislikes", []))
    likes = split_csv_words(prefs.get("likes", []))

    scored = []
    for meal in MEAL_CATALOG:
        score = meal_score(meal, inv_idx, perish_idx, dislikes, likes, shrimp_ok)
        if score > -500:
            scored.append((score, meal))

    scored.sort(key=lambda x: (x[0], x[1].get("protein_g", 0)), reverse=True)

    selected = []
    shrimp_count = 0
    for _, meal in scored:
        if meal["type"] == "shrimp":
            if not shrimp_ok or shrimp_count >= 2:
                continue
            shrimp_count += 1
        selected.append(meal)
        if len(selected) >= 5:
            break

    if len(selected) < 4:
        # fallback to highest-protein vegetarian options
        fallbacks = sorted(
            [m for m in MEAL_CATALOG if m["type"] == "vegetarian"],
            key=lambda m: m.get("protein_g", 0),
            reverse=True,
        )
        names = {m["name"] for m in selected}
        for meal in fallbacks:
            if meal["name"] not in names:
                selected.append(meal)
                if len(selected) >= 4:
                    break

    return selected


def build_schedule(selected_meals, intake):
    if not selected_meals:
        return []

    prefs = intake.get("preferences", {})
    max_shrimp_slots = int(prefs.get("max_shrimp_slots", 3))
    shrimp_meal_names = {m["name"] for m in selected_meals if m.get("type") == "shrimp"}
    non_shrimp_meals = [m for m in selected_meals if m.get("type") != "shrimp"] or selected_meals

    lunches = []
    dinners = []
    shrimp_slots = 0

    for i in range(7):
        lunch = selected_meals[i % len(selected_meals)]
        dinner = selected_meals[(i + 2) % len(selected_meals)]

        if lunch["name"] in shrimp_meal_names and shrimp_slots >= max_shrimp_slots:
            lunch = non_shrimp_meals[i % len(non_shrimp_meals)]
        if lunch["name"] in shrimp_meal_names:
            shrimp_slots += 1

        if dinner["name"] in shrimp_meal_names and shrimp_slots >= max_shrimp_slots:
            dinner = non_shrimp_meals[(i + 2) % len(non_shrimp_meals)]
        if dinner["name"] in shrimp_meal_names:
            shrimp_slots += 1

        lunches.append(lunch["name"])
        dinners.append(dinner["name"])

    schedule = []
    for d, l, dn in zip(DAYS, lunches, dinners):
        schedule.append({"day": d, "lunch": l, "dinner": dn})
    return schedule


def build_shopping_list(selected_meals, inv_idx):
    missing = defaultdict(set)

    category_guess = {
        "spinach": "Produce", "onion": "Produce", "garlic": "Produce", "tomato": "Produce",
        "cucumber": "Produce", "broccoli": "Produce", "bell pepper": "Produce", "zucchini": "Produce",
        "lemon": "Produce", "berries": "Produce", "corn": "Produce", "avocado": "Produce", "lime": "Produce",
        "cilantro": "Produce", "parsley": "Produce", "pickled onions": "Produce",
        "tofu": "Protein", "egg whites": "Protein", "shrimp": "Protein", "feta": "Protein", "cottage cheese": "Protein",
        "greek yogurt": "Protein",
        "lentils": "Pantry", "chickpeas": "Pantry", "brown rice": "Pantry", "quinoa": "Pantry", "black beans": "Pantry",
        "oats": "Pantry", "chia seeds": "Pantry", "soy sauce": "Pantry", "olive oil": "Pantry", "coconut milk": "Pantry",
        "salsa": "Pantry", "hummus": "Pantry", "curry powder": "Pantry", "chipotle": "Pantry",
    }

    for meal in selected_meals:
        for ing in meal["ingredients"]:
            i = normalize(ing)
            if i not in inv_idx:
                cat = category_guess.get(i, "Misc")
                missing[cat].add(ing)

    return {k: sorted(v) for k, v in sorted(missing.items())}


def use_up_first(perish_idx):
    ranked = sorted(perish_idx.items(), key=lambda kv: kv[1])
    return [{"item": item, "expires_in_days": days} for item, days in ranked[:8]]


def macro_summary(intake, selected_meals, schedule):
    goals = intake.get("goals", {})
    calorie_target = int(goals.get("daily_calorie_target", 1600))
    protein_target = int(goals.get("daily_protein_target_g", 95))

    meal_by_name = {m["name"]: m for m in selected_meals}

    cals = []
    proteins = []
    breakfast_kcal = 330
    breakfast_protein = 20
    snack_kcal = 250
    snack_protein = 20

    for day in schedule:
        l = meal_by_name[day["lunch"]]
        d = meal_by_name[day["dinner"]]
        cals.append(breakfast_kcal + snack_kcal + l["kcal"] + d["kcal"])
        proteins.append(breakfast_protein + snack_protein + l["protein_g"] + d["protein_g"])

    avg_cal = round(sum(cals) / len(cals), 1) if cals else 0
    avg_pro = round(sum(proteins) / len(proteins), 1) if proteins else 0

    return {
        "target_calories": calorie_target,
        "target_protein_g": protein_target,
        "estimated_avg_daily_calories": avg_cal,
        "estimated_avg_daily_protein_g": avg_pro,
        "calorie_delta": round(avg_cal - calorie_target, 1),
        "protein_delta_g": round(avg_pro - protein_target, 1),
    }


def prep_steps(selected_meals):
    steps = [
        "Cook base grains/legumes first (rice, quinoa, lentils, beans).",
        "Chop and roast/sauté all vegetables in one batch (leave crunchy salad veg raw).",
        "Mix two bold sauces (example: lemon-herb yogurt + chipotle-lime) for variety.",
        "Cook proteins (tofu/egg whites/shrimp) and portion by meal.",
        "Prep daily protein snacks (yogurt/cottage-cheese cups, hummus + veg) to close macro gaps.",
        "Assemble grab-and-go containers for Mon-Wed; freeze Thu-Sun portions as needed.",
    ]
    quick = [m["name"] for m in selected_meals if m.get("prep") == "quick"]
    if quick:
        steps.append(f"Reserve quick rescue meals for busiest days: {', '.join(quick[:2])}.")
    return steps


def fallback_swaps():
    return [
        "No spinach -> use kale or romaine in bowls/salads.",
        "No quinoa -> use brown rice or farro.",
        "No shrimp -> use tofu or extra chickpeas.",
        "No greek yogurt -> use cottage cheese or skyr.",
        "No bell pepper -> use zucchini or broccoli.",
        "Low flavor? Add acid (lemon/lime/vinegar), salt, and chili before adding extra oil.",
    ]


def build_flavor_playbook(selected_meals):
    finishers = [
        "Acid: lemon/lime juice or red wine vinegar at the end",
        "Heat: chili flakes, chili crisp, or jalapeño",
        "Herb: cilantro/parsley/dill for freshness",
        "Crunch: toasted nuts/seeds or crispy chickpeas",
        "Creamy contrast: yogurt sauce, feta, tahini, or hummus drizzle",
    ]

    meal_upgrades = []
    unique_tags = set()
    for meal in selected_meals:
        unique_tags.update(meal.get("flavor_tags", []))
        meal_upgrades.append(
            {
                "meal": meal["name"],
                "flavor_tags": meal.get("flavor_tags", []),
                "taste_upgrade": meal.get("taste_upgrade", "Season aggressively and finish with acid + herbs."),
            }
        )

    sauce_rotation = [
        {
            "name": "Lemon-Herb Yogurt Sauce",
            "works_with": ["bowls", "salads", "shrimp", "eggs"],
            "formula": "Greek yogurt + lemon juice/zest + garlic + salt + dill/parsley",
        },
        {
            "name": "Chipotle-Lime Sauce",
            "works_with": ["taco bowls", "tofu", "roasted veggies"],
            "formula": "Greek yogurt or light mayo + chipotle + lime + cumin + pinch honey",
        },
    ]

    return {
        "weekly_sauce_rotation": sauce_rotation,
        "finishers": finishers,
        "meal_upgrades": meal_upgrades,
        "flavor_variety_score": len(unique_tags),
    }


def validation_hints(selected_meals, macro, flavor_playbook):
    hints = []
    if len(selected_meals) < 4:
        hints.append("Low meal variety (<4 core meals).")
    if macro["estimated_avg_daily_protein_g"] < macro["target_protein_g"] - 15:
        hints.append("Protein may be low; add yogurt/cottage cheese/tofu/shrimp booster.")
    if macro["estimated_avg_daily_calories"] > macro["target_calories"] + 200:
        hints.append("Calories may be high; reduce oils and starch portions.")
    if flavor_playbook.get("flavor_variety_score", 0) < 3:
        hints.append("Flavor variety looks narrow; rotate at least 2 sauces + 2 finishers.")
    if not hints:
        hints.append("No major flags from heuristic checks.")
    return hints


def detect_forbidden_terms(selected_meals):
    bad = []
    for meal in selected_meals:
        text = " ".join([meal["name"]] + meal.get("ingredients", []))
        t = normalize(text)
        for word in FORBIDDEN_MEAT_WORDS:
            if word in t:
                bad.append(f"{meal['name']} contains forbidden term '{word}'")
    return bad


def render_markdown(intake, plan):
    lines = []
    lines.append(f"# Weekly Meal Prep Plan — Week of {intake.get('week_of', 'Unknown')}")
    lines.append("")

    lines.append("## Plan Summary")
    lines.extend([
        "- Prioritize perishables first, then pantry staples.",
        "- Use 4-5 repeatable high-protein meals for consistency and low prep friction.",
        "- Keep at least one quick meal option for busy days.",
        "- Shop only missing ingredients to reduce spend and waste.",
    ])
    lines.append("")

    lines.append("## Meal Lineup")
    for m in plan["selected_meals"]:
        lines.append(f"- **{m['name']}** — ~{m['kcal']} kcal, ~{m['protein_g']}g protein/serving")
    lines.append("")

    lines.append("## 7-Day Schedule")
    for row in plan["schedule"]:
        lines.append(f"- **{row['day']}**: Lunch — {row['lunch']} | Dinner — {row['dinner']}")
    lines.append("")

    lines.append("## Sunday Prep Steps")
    for i, step in enumerate(plan["prep_steps"], start=1):
        lines.append(f"{i}. {step}")
    lines.append("")

    lines.append("## Shopping Additions")
    if plan["shopping_list"]:
        for category, items in plan["shopping_list"].items():
            lines.append(f"### {category}")
            for it in items:
                lines.append(f"- {it}")
            lines.append("")
    else:
        lines.append("- No major additions needed.")
        lines.append("")

    lines.append("## Use-Up First Guide")
    if plan["use_up_first"]:
        for item in plan["use_up_first"]:
            lines.append(f"- {item['item']} (expires in ~{item['expires_in_days']} days)")
    else:
        lines.append("- No perishability data provided.")
    lines.append("")

    lines.append("## Make It Taste Great (Quick Flavor Plan)")
    flavor = plan["flavor_playbook"]
    lines.append("### Sauce Rotation")
    for sauce in flavor.get("weekly_sauce_rotation", []):
        lines.append(f"- **{sauce['name']}**: {sauce['formula']}")
    lines.append("")
    lines.append("### Meal Upgrades")
    for item in flavor.get("meal_upgrades", []):
        tags = ", ".join(item.get("flavor_tags", []))
        lines.append(f"- **{item['meal']}** ({tags}): {item['taste_upgrade']}")
    lines.append("")
    lines.append("### Finishers")
    for finisher in flavor.get("finishers", []):
        lines.append(f"- {finisher}")
    lines.append("")

    lines.append("## Fallback Swaps")
    for s in plan["fallback_swaps"]:
        lines.append(f"- {s}")
    lines.append("")

    macro = plan["macro_summary"]
    lines.append("## Macro Sanity Check")
    lines.append(f"- Target: {macro['target_calories']} kcal/day, {macro['target_protein_g']}g protein/day")
    lines.append(
        f"- Estimated: {macro['estimated_avg_daily_calories']} kcal/day, {macro['estimated_avg_daily_protein_g']}g protein/day"
    )
    lines.append(f"- Delta: {macro['calorie_delta']} kcal, {macro['protein_delta_g']}g protein")
    lines.append("")

    lines.append("## Validation Flags")
    for h in plan["validation_hints"]:
        lines.append(f"- {h}")

    return "\n".join(lines) + "\n"


def generate_weekly_plan(intake):
    inv_idx, perish_idx = build_inventory_index(intake)

    selected = choose_meals(intake, inv_idx, perish_idx)
    schedule = build_schedule(selected, intake)
    shopping = build_shopping_list(selected, inv_idx)
    up_first = use_up_first(perish_idx)
    macro = macro_summary(intake, selected, schedule)
    prep = prep_steps(selected)
    swaps = fallback_swaps()
    flavor_playbook = build_flavor_playbook(selected)
    hints = validation_hints(selected, macro, flavor_playbook)
    forbidden = detect_forbidden_terms(selected)
    if forbidden:
        hints.extend(forbidden)

    return {
        "week_of": intake.get("week_of"),
        "selected_meals": selected,
        "schedule": schedule,
        "shopping_list": shopping,
        "use_up_first": up_first,
        "prep_steps": prep,
        "fallback_swaps": swaps,
        "flavor_playbook": flavor_playbook,
        "macro_summary": macro,
        "validation_hints": hints,
    }


def main():
    ap = argparse.ArgumentParser(description="Generate weekly meal-prep plan from intake JSON.")
    ap.add_argument("--intake", required=True, help="Path to intake JSON")
    ap.add_argument("--out", required=True, help="Path to output markdown plan")
    ap.add_argument("--json-out", required=False, help="Path to output plan JSON (optional)")
    args = ap.parse_args()

    intake_path = Path(args.intake)
    out_path = Path(args.out)
    json_out_path = Path(args.json_out) if args.json_out else out_path.with_suffix(".json")

    intake = json.loads(intake_path.read_text())
    plan = generate_weekly_plan(intake)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    json_out_path.parent.mkdir(parents=True, exist_ok=True)

    out_path.write_text(render_markdown(intake, plan))
    json_out_path.write_text(json.dumps(plan, indent=2))

    print(f"WROTE_MARKDOWN: {out_path}")
    print(f"WROTE_JSON: {json_out_path}")


if __name__ == "__main__":
    main()
