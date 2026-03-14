import json
import unittest
from pathlib import Path

from scripts.generate_plan import generate_weekly_plan
from scripts.validate_plan import validate


class PlannerSmokeTest(unittest.TestCase):
    def test_generate_and_validate_example(self):
        root = Path(__file__).resolve().parents[1]
        intake = json.loads((root / "examples" / "example-intake.json").read_text())

        plan = generate_weekly_plan(intake)

        self.assertIn("selected_meals", plan)
        self.assertEqual(len(plan["schedule"]), 7)
        self.assertIn("flavor_playbook", plan)

        errors, _warnings = validate(plan)
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
