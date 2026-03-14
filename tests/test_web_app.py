import re
import unittest

from app.app import app


class WebAppSmokeTest(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_index_loads(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Mezei Meal Prep Planner", res.data)

    def test_generate_flow(self):
        payload = {
            "week_of": "2026-03-09",
            "max_prep_minutes": "120",
            "daily_calorie_target": "1600",
            "daily_protein_target_g": "100",
            "meals_per_day": "3",
            "shrimp_ok": "on",
            "likes": "lemon,curry",
            "dislikes": "",
            "notes": "",
            "fridge_item": ["spinach", "greek yogurt"],
            "fridge_qty": ["1 bag", "24 oz"],
            "fridge_expires": ["3", "6"],
            "pantry_item": ["lentils", "brown rice"],
            "pantry_qty": ["2 cups dry", "4 cups dry"],
            "pantry_expires": ["", ""],
            "freezer_item": ["shrimp"],
            "freezer_qty": ["1 lb"],
            "freezer_expires": ["30"],
        }

        res = self.client.post("/generate", data=payload)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Validation", res.data)
        self.assertIn(b"Download weekly-plan.md", res.data)

        text = res.data.decode("utf-8")
        m = re.search(r"/download/([^/]+)/weekly-plan\.md", text)
        self.assertIsNotNone(m)
        run_id = m.group(1)

        dl = self.client.get(f"/download/{run_id}/weekly-plan.json")
        self.assertEqual(dl.status_code, 200)
        dl.close()


if __name__ == "__main__":
    unittest.main()
