const STORAGE_KEY = 'mezei-meal-prep-draft-v2';
const PLAN_STORAGE_KEY = 'mezei-meal-prep-last-plan-v2';
const DEFAULT_INTAKE = {
  week_of: new Date().toISOString().slice(0, 10),
  goals: {
    daily_calorie_target: 1600,
    daily_protein_target_g: 95,
    meals_per_day: 3,
  },
  preferences: {
    vegetarian: true,
    shrimp_ok: true,
    shopping_mode: 'extras_ok',
    max_prep_minutes: 120,
    likes: [],
    dislikes: [],
    notes: '',
  },
  inventory: {
    fridge: [
      { item: 'spinach', qty: '1 bag', expires_in_days: 3 },
      { item: 'greek yogurt', qty: '24 oz', expires_in_days: 6 },
      { item: 'eggs', qty: '1 dozen', expires_in_days: 7 },
    ],
    pantry: [
      { item: 'lentils', qty: '2 cups dry', expires_in_days: null },
      { item: 'brown rice', qty: '4 cups dry', expires_in_days: null },
      { item: 'oats', qty: '1 container', expires_in_days: null },
    ],
    freezer: [
      { item: 'shrimp', qty: '1 lb', expires_in_days: 30 },
      { item: 'frozen berries', qty: '1 bag', expires_in_days: 30 },
    ],
  },
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_CATALOG = [
  {
    name: 'Greek Yogurt Overnight Oats',
    slot: 'breakfast',
    type: 'vegetarian',
    ingredients: ['greek yogurt', 'oats', 'chia seeds', 'berries'],
    kcal: 340,
    protein_g: 22,
    prep: 'batch',
    flavor_tags: ['sweet', 'creamy', 'fresh'],
    taste_upgrade: 'Use cinnamon, vanilla, a tiny pinch of salt, and toasted nuts right before eating.',
  },
  {
    name: 'Egg White Veggie Muffins + Fruit',
    slot: 'breakfast',
    type: 'vegetarian',
    ingredients: ['egg whites', 'spinach', 'bell pepper', 'onion', 'fruit'],
    kcal: 280,
    protein_g: 23,
    prep: 'batch',
    flavor_tags: ['savory', 'light', 'quick'],
    taste_upgrade: 'Sauté veggies first and add feta or chili flakes for more flavor.',
  },
  {
    name: 'Cottage Cheese Power Snack Plate',
    slot: 'breakfast',
    type: 'vegetarian',
    ingredients: ['cottage cheese', 'carrot', 'cucumber', 'hummus'],
    kcal: 260,
    protein_g: 21,
    prep: 'quick',
    flavor_tags: ['fresh', 'salty', 'crunchy'],
    taste_upgrade: 'Season cottage cheese with za’atar and olive oil; add crunchy roasted chickpeas.',
  },
  {
    name: 'Lentil Spinach Curry Bowls',
    slot: 'lunch',
    type: 'vegetarian',
    ingredients: ['lentils', 'spinach', 'onion', 'garlic', 'coconut milk', 'tomato'],
    kcal: 430,
    protein_g: 24,
    prep: 'batch',
    flavor_tags: ['curry', 'warm', 'savory'],
    taste_upgrade: 'Bloom curry powder + cumin in oil, then finish with lemon and cilantro.',
  },
  {
    name: 'Chickpea Greek Salad Boxes',
    slot: 'lunch',
    type: 'vegetarian',
    ingredients: ['chickpeas', 'cucumber', 'tomato', 'feta', 'olive oil', 'lemon'],
    kcal: 390,
    protein_g: 19,
    prep: 'batch',
    flavor_tags: ['mediterranean', 'bright', 'fresh'],
    taste_upgrade: 'Salt cucumbers first, then toss with lemon zest and oregano vinaigrette.',
  },
  {
    name: 'Black Bean Taco Bowls',
    slot: 'lunch',
    type: 'vegetarian',
    ingredients: ['black beans', 'brown rice', 'corn', 'salsa', 'avocado', 'lime'],
    kcal: 460,
    protein_g: 20,
    prep: 'batch',
    flavor_tags: ['tex-mex', 'smoky', 'savory'],
    taste_upgrade: 'Toast the spices, add chipotle-lime yogurt sauce, and finish with pickled onions.',
  },
  {
    name: 'Tofu Veggie Stir-Fry + Brown Rice',
    slot: 'dinner',
    type: 'vegetarian',
    ingredients: ['tofu', 'broccoli', 'bell pepper', 'brown rice', 'soy sauce', 'garlic'],
    kcal: 470,
    protein_g: 30,
    prep: 'batch',
    flavor_tags: ['soy-ginger', 'umami', 'savory'],
    taste_upgrade: 'Pan-sear tofu hard, then glaze with soy-ginger-garlic and chili crisp.',
  },
  {
    name: 'Shrimp Zucchini Skillet with Quinoa',
    slot: 'dinner',
    type: 'shrimp',
    ingredients: ['shrimp', 'zucchini', 'quinoa', 'garlic', 'lemon', 'olive oil'],
    kcal: 410,
    protein_g: 33,
    prep: 'quick',
    flavor_tags: ['lemon-herb', 'bright', 'quick'],
    taste_upgrade: 'Marinate shrimp for 10 minutes with lemon, paprika, and garlic, then finish with parsley.',
  },
  {
    name: 'Sheet Pan Veggie Feta Bake',
    slot: 'dinner',
    type: 'vegetarian',
    ingredients: ['broccoli', 'bell pepper', 'onion', 'feta', 'olive oil', 'rice'],
    kcal: 420,
    protein_g: 18,
    prep: 'batch',
    flavor_tags: ['roasty', 'savory', 'comfort'],
    taste_upgrade: 'Roast hot so the edges char a little; finish with lemon and chili flakes.',
  },
];

const FORBIDDEN = ['chicken', 'beef', 'pork', 'bacon', 'turkey', 'ham', 'sausage', 'salmon', 'tuna', 'cod'];
let saveTimer = null;
let hasHydrated = false;
let lastSavedAt = null;

function normalize(text) {
  return String(text || '').trim().toLowerCase();
}

function parseListText(value) {
  if (!value) return [];
  return String(value).replace(/\n/g, ',').split(',').map((s) => s.trim()).filter(Boolean);
}

function parseIntSafe(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'meal';
}

function formatSlot(slot) {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

function getSaveStatusEl() {
  return document.getElementById('save-status');
}

function setSaveStatus(message, tone = 'muted') {
  const el = getSaveStatusEl();
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
}

function noteDirty() {
  if (!hasHydrated) return;
  setSaveStatus('Unsaved changes…', 'warn');
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.intake || null;
  } catch {
    return null;
  }
}

function saveDraftNow() {
  try {
    const intake = buildIntakeFromForm();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), intake }));
    lastSavedAt = Date.now();
    setSaveStatus('Saved to this device', 'good');
    return intake;
  } catch {
    setSaveStatus('Could not save draft on this device', 'bad');
    return null;
  }
}

function queueDraftSave() {
  noteDirty();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDraftNow();
  }, 250);
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PLAN_STORAGE_KEY);
  lastSavedAt = null;
  setSaveStatus('Draft cleared', 'muted');
}

function makeRow(section, row = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'row';

  const item = document.createElement('input');
  item.name = `${section}_item`;
  item.placeholder = 'item';
  item.value = row.item || '';

  const qty = document.createElement('input');
  qty.name = `${section}_qty`;
  qty.placeholder = 'qty';
  qty.value = row.qty || '';

  const expires = document.createElement('input');
  expires.name = `${section}_expires`;
  expires.type = 'number';
  expires.placeholder = 'exp days';
  expires.min = '0';
  expires.step = '1';
  expires.value = Number.isInteger(row.expires_in_days) ? String(row.expires_in_days) : '';

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'ghost';
  remove.textContent = '✕';
  remove.addEventListener('click', () => {
    wrapper.remove();
    queueDraftSave();
  });

  [item, qty, expires].forEach((input) => {
    input.addEventListener('input', queueDraftSave);
    input.addEventListener('change', queueDraftSave);
  });

  wrapper.append(item, qty, expires, remove);
  return wrapper;
}

function seedSection(sectionName, rows) {
  const container = document.getElementById(`${sectionName}-rows`);
  if (!container) return;
  container.innerHTML = '';
  const source = Array.isArray(rows) ? rows : [];
  if (!source.length) {
    container.appendChild(makeRow(sectionName));
    return;
  }
  source.forEach((row) => container.appendChild(makeRow(sectionName, row)));
}

function addRow(sectionName) {
  const container = document.getElementById(`${sectionName}-rows`);
  if (!container) return;
  container.appendChild(makeRow(sectionName));
  queueDraftSave();
}

function cleanBulkLine(line) {
  return String(line || '')
    .replace(/^\s*(?:[-*•]+|\d+[.)])\s*/, '')
    .replace(/^\s*\[[ xX]?\]\s*/, '')
    .trim();
}

function parseBulkItems(rawText) {
  return String(rawText || '')
    .split(/\n|,/) 
    .map(cleanBulkLine)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalize(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function importBulkSection(sectionName) {
  const textarea = document.getElementById(`${sectionName}-bulk-input`);
  const replaceToggle = document.getElementById(`${sectionName}-bulk-replace`);
  const container = document.getElementById(`${sectionName}-rows`);
  if (!textarea || !container) return [];

  const parsed = uniqueItems(parseBulkItems(textarea.value));
  if (!parsed.length) return [];

  const existing = replaceToggle?.checked ? [] : buildInventorySection(sectionName).map((row) => row.item);
  const merged = uniqueItems([...existing, ...parsed]);
  container.innerHTML = '';
  merged.forEach((item) => container.appendChild(makeRow(sectionName, { item, qty: '', expires_in_days: null })));
  if (!merged.length) container.appendChild(makeRow(sectionName));

  textarea.value = '';
  if (replaceToggle) replaceToggle.checked = false;
  document.getElementById(`${sectionName}-bulk-wrap`)?.classList.add('hidden');
  queueDraftSave();
  return merged;
}

function toggleBulkSection(sectionName) {
  document.getElementById(`${sectionName}-bulk-wrap`)?.classList.toggle('hidden');
}

function buildInventorySection(prefix) {
  const items = Array.from(document.querySelectorAll(`[name="${prefix}_item"]`));
  const qtys = Array.from(document.querySelectorAll(`[name="${prefix}_qty"]`));
  const expires = Array.from(document.querySelectorAll(`[name="${prefix}_expires"]`));
  const maxLen = Math.max(items.length, qtys.length, expires.length, 0);
  const rows = [];
  for (let i = 0; i < maxLen; i += 1) {
    const item = (items[i]?.value || '').trim();
    const qty = (qtys[i]?.value || '').trim();
    const exp = parseIntSafe(expires[i]?.value, null);
    if (!item) continue;
    rows.push({ item, qty, expires_in_days: exp });
  }
  return rows;
}

function buildIntakeFromForm() {
  const form = document.getElementById('planner-form');
  const fd = new FormData(form);
  return {
    week_of: fd.get('week_of') || new Date().toISOString().slice(0, 10),
    goals: {
      daily_calorie_target: parseIntSafe(fd.get('daily_calorie_target'), 1600),
      daily_protein_target_g: parseIntSafe(fd.get('daily_protein_target_g'), 95),
      meals_per_day: 3,
    },
    preferences: {
      vegetarian: true,
      shrimp_ok: fd.get('shrimp_ok') === 'on',
      shopping_mode: fd.get('shopping_mode') || 'extras_ok',
      max_prep_minutes: parseIntSafe(fd.get('max_prep_minutes'), 120),
      likes: parseListText(fd.get('likes')),
      dislikes: parseListText(fd.get('dislikes')),
      notes: String(fd.get('notes') || '').trim(),
    },
    inventory: {
      fridge: buildInventorySection('fridge'),
      pantry: buildInventorySection('pantry'),
      freezer: buildInventorySection('freezer'),
    },
  };
}

function buildInventoryIndex(intake) {
  const idx = {};
  const perishable = {};
  ['fridge', 'pantry', 'freezer'].forEach((section) => {
    (intake.inventory?.[section] || []).forEach((row) => {
      const item = normalize(row.item);
      if (!item) return;
      idx[item] = row.qty || '';
      if (Number.isInteger(row.expires_in_days)) perishable[item] = row.expires_in_days;
    });
  });
  return { idx, perishable };
}

function mealScore(meal, invIdx, perishIdx, dislikes, likes, shrimpOk, shoppingMode = 'extras_ok') {
  if (meal.type === 'shrimp' && !shrimpOk) return -10000;
  const nameL = normalize(meal.name);
  for (const d of dislikes) {
    if (d && nameL.includes(normalize(d))) return -1000;
  }
  let matched = 0;
  let perishBonus = 0;
  let missing = 0;
  meal.ingredients.forEach((ing) => {
    const ingN = normalize(ing);
    if (Object.prototype.hasOwnProperty.call(invIdx, ingN)) {
      matched += 1;
      const exp = perishIdx[ingN];
      if (Number.isInteger(exp) && exp <= 4) perishBonus += (5 - exp);
    } else {
      missing += 1;
    }
  });
  let likeBonus = 0;
  const mealText = normalize([meal.name, meal.slot, ...meal.ingredients, ...(meal.flavor_tags || [])].join(' '));
  likes.forEach((liked) => {
    const l = normalize(liked);
    if (l && mealText.includes(l)) likeBonus += 2;
  });
  const inventoryCoverage = meal.ingredients.length ? (matched / meal.ingredients.length) : 0;
  const missingPenalty = shoppingMode === 'inventory_only' ? missing * 4 : missing;
  const coverageBonus = shoppingMode === 'inventory_only' ? Math.round(inventoryCoverage * 12) : 0;
  const base = matched * 3 + perishBonus * 2 + coverageBonus - missingPenalty;
  const proteinBonus = Math.floor((meal.protein_g || 0) / 8);
  const slotBonus = meal.slot === 'breakfast' ? 1 : 0;
  return base + proteinBonus + likeBonus + slotBonus;
}

function chooseMealsForSlot(intake, invIdx, perishIdx, slot, desiredCount = 3) {
  const prefs = intake.preferences || {};
  const shrimpOk = !!prefs.shrimp_ok;
  const dislikes = prefs.dislikes || [];
  const likes = prefs.likes || [];
  const shoppingMode = prefs.shopping_mode || 'extras_ok';
  const scored = [];
  MEAL_CATALOG.filter((meal) => meal.slot === slot).forEach((meal) => {
    const score = mealScore(meal, invIdx, perishIdx, dislikes, likes, shrimpOk, shoppingMode);
    const matched = meal.ingredients.filter((ing) => Object.prototype.hasOwnProperty.call(invIdx, normalize(ing))).length;
    const missing = meal.ingredients.length - matched;
    scored.push({ score, matched, missing, meal });
  });
  scored.sort((a, b) => {
    if (shoppingMode === 'inventory_only') {
      return (b.matched - a.matched)
        || (a.missing - b.missing)
        || (b.score - a.score)
        || ((b.meal.protein_g || 0) - (a.meal.protein_g || 0));
    }
    return (b.score - a.score) || ((b.meal.protein_g || 0) - (a.meal.protein_g || 0));
  });
  const selected = [];
  const names = new Set();
  scored.forEach(({ meal }) => {
    if (selected.length >= desiredCount) return;
    if (meal.type === 'shrimp' && !shrimpOk) return;
    if (names.has(meal.name)) return;
    selected.push(meal);
    names.add(meal.name);
  });
  return selected;
}

function chooseMeals(intake, invIdx, perishIdx) {
  const breakfasts = chooseMealsForSlot(intake, invIdx, perishIdx, 'breakfast', 3);
  const lunches = chooseMealsForSlot(intake, invIdx, perishIdx, 'lunch', 3);
  const dinners = chooseMealsForSlot(intake, invIdx, perishIdx, 'dinner', 3);
  return {
    breakfast: breakfasts,
    lunch: lunches,
    dinner: dinners,
    all: [...breakfasts, ...lunches, ...dinners],
  };
}

function rotateChoice(list, index) {
  if (!list.length) return null;
  return list[index % list.length];
}

function buildSchedule(selectedMeals) {
  const breakfastMeals = selectedMeals.breakfast || [];
  const lunchMeals = selectedMeals.lunch || [];
  const dinnerMeals = selectedMeals.dinner || [];
  let shrimpSlots = 0;
  return DAYS.map((day, i) => {
    const breakfast = rotateChoice(breakfastMeals, i);
    const lunch = rotateChoice(lunchMeals, i + 1);
    let dinner = rotateChoice(dinnerMeals, i + 2);
    if (dinner?.type === 'shrimp' && shrimpSlots >= 2) {
      const fallback = dinnerMeals.find((meal) => meal.type !== 'shrimp');
      if (fallback) dinner = fallback;
    }
    if (dinner?.type === 'shrimp') shrimpSlots += 1;
    return {
      day,
      breakfast: breakfast?.name || 'Breakfast TBD',
      lunch: lunch?.name || 'Lunch TBD',
      dinner: dinner?.name || 'Dinner TBD',
    };
  });
}

function buildShoppingList(allMeals, invIdx, shoppingMode = 'extras_ok') {
  if (shoppingMode === 'inventory_only') return {};
  const missing = {};
  const categoryGuess = {
    spinach: 'Produce', onion: 'Produce', garlic: 'Produce', tomato: 'Produce', cucumber: 'Produce',
    broccoli: 'Produce', 'bell pepper': 'Produce', zucchini: 'Produce', lemon: 'Produce', berries: 'Produce',
    corn: 'Produce', avocado: 'Produce', lime: 'Produce', cilantro: 'Produce', parsley: 'Produce', fruit: 'Produce',
    tofu: 'Protein', 'egg whites': 'Protein', shrimp: 'Protein', feta: 'Protein', 'cottage cheese': 'Protein', 'greek yogurt': 'Protein',
    lentils: 'Pantry', chickpeas: 'Pantry', 'brown rice': 'Pantry', quinoa: 'Pantry', 'black beans': 'Pantry', rice: 'Pantry',
    oats: 'Pantry', 'chia seeds': 'Pantry', 'soy sauce': 'Pantry', 'olive oil': 'Pantry', 'coconut milk': 'Pantry', salsa: 'Pantry', hummus: 'Pantry'
  };
  allMeals.forEach((meal) => {
    meal.ingredients.forEach((ing) => {
      const key = normalize(ing);
      if (!Object.prototype.hasOwnProperty.call(invIdx, key)) {
        const cat = categoryGuess[key] || 'Misc';
        if (!missing[cat]) missing[cat] = new Set();
        missing[cat].add(ing);
      }
    });
  });
  return Object.fromEntries(Object.entries(missing).map(([k, v]) => [k, Array.from(v).sort()]));
}

function buildPrepSteps(allMeals) {
  const batchMeals = allMeals.filter((m) => m.prep === 'batch');
  const quickMeals = allMeals.filter((m) => m.prep !== 'batch');
  const steps = [
    'Cook grains, oats, and legumes first so the longest items run in the background.',
    'Prep breakfast pieces early so mornings stay brainless and fast.',
    'Batch-chop and roast or sauté vegetables in one pass to reduce cleanup.',
    'Mix two sauces or flavor boosters so reheated meals still feel good midweek.',
  ];
  if (batchMeals.length) {
    steps.push(`Batch-first meals this week: ${batchMeals.map((m) => m.name).join(', ')}.`);
  }
  if (quickMeals.length) {
    steps.push(`Save fresher quick meals for later in the week: ${quickMeals.map((m) => m.name).join(', ')}.`);
  }
  return steps;
}

function buildFlavorPlaybook(allMeals) {
  return {
    weekly_sauce_rotation: [
      { name: 'Lemon-Herb Yogurt', formula: 'Greek yogurt + lemon juice + zest + garlic + salt + dill/parsley' },
      { name: 'Chipotle-Lime', formula: 'Greek yogurt (or light mayo) + chipotle + lime juice + cumin + tiny honey pinch' },
    ],
    meal_upgrades: allMeals.map((meal) => ({ meal: meal.name, taste_upgrade: meal.taste_upgrade })),
  };
}

function buildMacroSummary(schedule, mealLookup, intake) {
  if (!schedule.length) {
    return {
      target_calories: intake.goals.daily_calorie_target,
      target_protein_g: intake.goals.daily_protein_target_g,
      estimated_avg_daily_calories: 0,
      estimated_avg_daily_protein_g: 0,
      calorie_delta: -intake.goals.daily_calorie_target,
      protein_delta_g: -intake.goals.daily_protein_target_g,
    };
  }
  let totalCalories = 0;
  let totalProtein = 0;
  schedule.forEach((day) => {
    ['breakfast', 'lunch', 'dinner'].forEach((slot) => {
      const meal = mealLookup[day[slot]];
      if (!meal) return;
      totalCalories += meal.kcal || 0;
      totalProtein += meal.protein_g || 0;
    });
  });
  const avgCalories = Math.round(totalCalories / schedule.length);
  const avgProtein = Math.round(totalProtein / schedule.length);
  return {
    target_calories: intake.goals.daily_calorie_target,
    target_protein_g: intake.goals.daily_protein_target_g,
    estimated_avg_daily_calories: avgCalories,
    estimated_avg_daily_protein_g: avgProtein,
    calorie_delta: avgCalories - intake.goals.daily_calorie_target,
    protein_delta_g: avgProtein - intake.goals.daily_protein_target_g,
  };
}

function validatePlan(plan) {
  const errors = [];
  const warnings = [];
  const allMeals = plan.selected_meals?.all || [];
  if (allMeals.length < 6) errors.push('Need enough meal variety across breakfast, lunch, and dinner.');
  const schedule = plan.schedule || [];
  if (schedule.length !== 7) errors.push('Schedule must include 7 days.');
  schedule.forEach((row) => {
    if (!row.breakfast || !row.lunch || !row.dinner) {
      errors.push(`${row.day} is missing breakfast, lunch, or dinner.`);
    }
  });
  const textBlob = JSON.stringify(allMeals).toLowerCase();
  FORBIDDEN.forEach((word) => {
    if (textBlob.includes(word)) errors.push(`Forbidden meat/fish term found: ${word}`);
  });
  if (!plan.prep_steps || plan.prep_steps.length < 4) errors.push('prep_steps missing or too short (<4).');
  const flavor = plan.flavor_playbook || {};
  if (!flavor.meal_upgrades) warnings.push('Flavor playbook missing (meals may feel bland/repetitive).');
  else if (flavor.meal_upgrades.length < allMeals.length) warnings.push('Not all meals include taste upgrades.');
  const macro = plan.macro_summary || {};
  if (!Object.keys(macro).length) errors.push('macro_summary missing.');
  else {
    if (Math.abs((macro.estimated_avg_daily_calories || 0) - (macro.target_calories || 0)) > 350) {
      warnings.push(`Calories off target by >350 kcal (${macro.estimated_avg_daily_calories} vs ${macro.target_calories}).`);
    }
    if ((macro.estimated_avg_daily_protein_g || 0) < (macro.target_protein_g || 0) - 25) {
      warnings.push(`Protein below target by >25g (${macro.estimated_avg_daily_protein_g} vs ${macro.target_protein_g}).`);
    }
  }
  return { errors, warnings };
}

function buildMealLookup(allMeals) {
  return Object.fromEntries(allMeals.map((meal) => [meal.name, meal]));
}

function generateWeeklyPlan(intake) {
  const { idx, perishable } = buildInventoryIndex(intake);
  const selectedMeals = chooseMeals(intake, idx, perishable);
  const mealLookup = buildMealLookup(selectedMeals.all);
  const schedule = buildSchedule(selectedMeals);
  const shoppingMode = intake.preferences?.shopping_mode || 'extras_ok';
  return {
    selected_meals: selectedMeals,
    schedule,
    prep_steps: buildPrepSteps(selectedMeals.all),
    shopping_list: buildShoppingList(selectedMeals.all, idx, shoppingMode),
    flavor_playbook: buildFlavorPlaybook(selectedMeals.all),
    macro_summary: buildMacroSummary(schedule, mealLookup, intake),
  };
}

function formatPlanMarkdown(intake, plan) {
  const mealLookup = buildMealLookup(plan.selected_meals.all || []);
  const lines = [];
  lines.push(`# Mezei Weekly Meal Plan`);
  lines.push(``);
  lines.push(`Week of: ${intake.week_of}`);
  lines.push(`Target: ${plan.macro_summary.target_calories} kcal / ${plan.macro_summary.target_protein_g}g protein`);
  lines.push(`Estimated: ${plan.macro_summary.estimated_avg_daily_calories} kcal / ${plan.macro_summary.estimated_avg_daily_protein_g}g protein`);
  lines.push(``);
  lines.push(`## 7-Day Schedule`);
  plan.schedule.forEach((day) => {
    lines.push(`### ${day.day}`);
    ['breakfast', 'lunch', 'dinner'].forEach((slot) => {
      const meal = mealLookup[day[slot]];
      const ingredients = meal?.ingredients?.join(', ') || 'details unavailable';
      lines.push(`- ${formatSlot(slot)}: ${day[slot]} (${ingredients})`);
    });
    lines.push('');
  });
  lines.push(`## Meal Lineup`);
  (plan.selected_meals.all || []).forEach((meal) => {
    lines.push(`- **${meal.name}** [${formatSlot(meal.slot)}] — ${meal.kcal} kcal / ${meal.protein_g}g protein`);
    lines.push(`  - Ingredients: ${meal.ingredients.join(', ')}`);
    lines.push(`  - Upgrade: ${meal.taste_upgrade}`);
  });
  lines.push('');
  lines.push('## Prep Steps');
  plan.prep_steps.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
  return lines.join('\n');
}

function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatDateForIcs(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function startOfWeekFromDate(dateString) {
  const base = new Date(`${dateString}T12:00:00`);
  const day = base.getDay();
  const diffToMonday = (day + 6) % 7;
  base.setDate(base.getDate() - diffToMonday);
  return base;
}

function buildCalendarFile(intake, plan) {
  const mealLookup = buildMealLookup(plan.selected_meals.all || []);
  const start = startOfWeekFromDate(intake.week_of);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Atlas//Mezei Meal Prep Planner//EN', 'CALSCALE:GREGORIAN'];
  plan.schedule.forEach((day, index) => {
    const eventDate = new Date(start);
    eventDate.setDate(start.getDate() + index);
    ['breakfast', 'lunch', 'dinner'].forEach((slot) => {
      const mealName = day[slot];
      const meal = mealLookup[mealName];
      const description = meal ? `Ingredients: ${meal.ingredients.join(', ')}\\nUpgrade: ${meal.taste_upgrade}` : '';
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${slugify(day.day)}-${slugify(slot)}-${formatDateForIcs(eventDate)}@mezei-meal-prep`);
      lines.push(`DTSTAMP:${formatDateForIcs(new Date())}T120000Z`);
      lines.push(`DTSTART;VALUE=DATE:${formatDateForIcs(eventDate)}`);
      lines.push(`DTEND;VALUE=DATE:${formatDateForIcs(eventDate)}`);
      lines.push(`SUMMARY:${escapeIcsText(`${formatSlot(slot)}: ${mealName}`)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
      lines.push('END:VEVENT');
    });
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function renderDownloads(run) {
  const downloads = document.getElementById('downloads');
  downloads.innerHTML = '';
  const files = [
    ['weekly-plan.md', 'Download weekly-plan.md', 'text/markdown;charset=utf-8'],
    ['weekly-plan.json', 'Download weekly-plan.json', 'application/json;charset=utf-8'],
    ['validation.txt', 'Download validation.txt', 'text/plain;charset=utf-8'],
    ['weekly-plan.ics', 'Download Apple Calendar file (.ics)', 'text/calendar;charset=utf-8'],
  ];
  files.forEach(([name, label, type]) => {
    const blob = new Blob([run[name]], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.textContent = label;
    downloads.appendChild(link);
  });
  document.getElementById('calendar-note')?.classList.remove('hidden');
}

function renderMealCards(plan) {
  const mealLineup = document.getElementById('meal-lineup');
  mealLineup.innerHTML = '';
  (plan.selected_meals.all || []).forEach((meal) => {
    const card = document.createElement('article');
    card.className = 'meal-card';
    const ingredients = meal.ingredients.map((ingredient) => `<li>${ingredient}</li>`).join('');
    card.innerHTML = `
      <div class="meal-card-head">
        <div>
          <h3>${meal.name}</h3>
          <p class="pill-row"><span class="pill">${formatSlot(meal.slot)}</span><span class="pill muted">${meal.kcal} kcal</span><span class="pill muted">${meal.protein_g}g protein</span></p>
        </div>
      </div>
      <div class="meal-card-body">
        <p><strong>What’s in it:</strong></p>
        <ul>${ingredients}</ul>
        <p><strong>Flavor move:</strong> ${meal.taste_upgrade}</p>
      </div>
    `;
    mealLineup.appendChild(card);
  });
}

function renderWeekOverview(plan) {
  const weekOverview = document.getElementById('week-overview');
  if (!weekOverview) return;
  weekOverview.innerHTML = '';
  const meals = plan.selected_meals?.all || [];
  const uniqueIngredients = new Set();
  meals.forEach((meal) => (meal.ingredients || []).forEach((ingredient) => uniqueIngredients.add(ingredient)));
  const summaryRows = [
    ['Avg calories/day', `${plan.macro_summary.estimated_avg_daily_calories}`],
    ['Avg protein/day', `${plan.macro_summary.estimated_avg_daily_protein_g}g`],
    ['Recipes in rotation', `${meals.length}`],
    ['Unique ingredients used', `${uniqueIngredients.size}`],
  ];
  summaryRows.forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'overview-card';
    card.innerHTML = `<span class="overview-label">${label}</span><span class="overview-value">${value}</span>`;
    weekOverview.appendChild(card);
  });
}

function renderSchedule(plan) {
  const schedule = document.getElementById('schedule');
  schedule.innerHTML = '';
  plan.schedule.forEach((day) => {
    const article = document.createElement('article');
    article.className = 'schedule-card';
    article.innerHTML = `
      <h3>${day.day}</h3>
      <div class="schedule-slot"><span class="slot-label">Breakfast</span><span>${day.breakfast}</span></div>
      <div class="schedule-slot"><span class="slot-label">Lunch</span><span>${day.lunch}</span></div>
      <div class="schedule-slot"><span class="slot-label">Dinner</span><span>${day.dinner}</span></div>
    `;
    schedule.appendChild(article);
  });
}

function renderSummaryChips(plan, validation) {
  const wrap = document.getElementById('summary-chips');
  if (!wrap) return;
  wrap.innerHTML = '';
  const chips = [
    validation.errors.length ? `${validation.errors.length} errors` : 'Ready to use',
    validation.warnings.length ? `${validation.warnings.length} warnings` : 'No warnings',
    `${plan.prep_steps.length} prep steps`,
    `${Object.keys(plan.shopping_list || {}).length} shopping sections`,
  ];
  chips.forEach((label) => {
    const chip = document.createElement('span');
    chip.className = 'summary-chip';
    chip.textContent = label;
    wrap.appendChild(chip);
  });
}

function renderResult(intake, plan, validation) {
  const sections = ['result-validation', 'result-meals', 'result-schedule', 'result-prep', 'result-shopping', 'result-flavor', 'result-macros'];
  sections.forEach((id) => document.getElementById(id).classList.remove('hidden'));

  const status = document.getElementById('validation-status');
  status.textContent = validation.errors.length ? `Needs fixes (${validation.errors.length} errors)` : `Pass (${validation.warnings.length} warnings)`;
  status.className = `status ${validation.errors.length ? 'bad' : 'good'}`;

  const errorsEl = document.getElementById('validation-errors');
  errorsEl.innerHTML = '';
  validation.errors.forEach((e) => {
    const li = document.createElement('li');
    li.textContent = e;
    errorsEl.appendChild(li);
  });

  const warningsEl = document.getElementById('validation-warnings');
  warningsEl.innerHTML = '';
  validation.warnings.forEach((w) => {
    const li = document.createElement('li');
    li.textContent = w;
    warningsEl.appendChild(li);
  });

  renderSummaryChips(plan, validation);
  renderMealCards(plan);
  renderWeekOverview(plan);
  renderSchedule(plan);

  const prep = document.getElementById('prep-steps');
  prep.innerHTML = '';
  plan.prep_steps.forEach((step) => {
    const li = document.createElement('li');
    li.textContent = step;
    prep.appendChild(li);
  });

  const shopping = document.getElementById('shopping-list');
  shopping.innerHTML = '';
  const shoppingEntries = Object.entries(plan.shopping_list || {});
  const shoppingMode = intake.preferences?.shopping_mode || 'extras_ok';
  if (!shoppingEntries.length) {
    shopping.innerHTML = shoppingMode === 'inventory_only'
      ? '<p>Inventory-only mode is on — no shopping additions shown.</p>'
      : '<p>No additions needed.</p>';
  } else {
    shoppingEntries.forEach(([category, items]) => {
      const h4 = document.createElement('h4');
      h4.textContent = category;
      const ul = document.createElement('ul');
      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      shopping.append(h4, ul);
    });
  }

  const sauceRotation = document.getElementById('sauce-rotation');
  sauceRotation.innerHTML = '';
  plan.flavor_playbook.weekly_sauce_rotation.forEach((sauce) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${sauce.name}:</strong> ${sauce.formula}`;
    sauceRotation.appendChild(li);
  });

  const mealUpgrades = document.getElementById('meal-upgrades');
  mealUpgrades.innerHTML = '';
  plan.flavor_playbook.meal_upgrades.forEach((row) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${row.meal}:</strong> ${row.taste_upgrade}`;
    mealUpgrades.appendChild(li);
  });

  const macroSummary = document.getElementById('macro-summary');
  macroSummary.innerHTML = '';
  [
    `Target: ${plan.macro_summary.target_calories} kcal / ${plan.macro_summary.target_protein_g}g`,
    `Estimated: ${plan.macro_summary.estimated_avg_daily_calories} kcal / ${plan.macro_summary.estimated_avg_daily_protein_g}g`,
    `Delta: ${plan.macro_summary.calorie_delta} kcal / ${plan.macro_summary.protein_delta_g}g`,
  ].forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    macroSummary.appendChild(li);
  });

  const validationText = [
    'PLAN_VALIDATION_REPORT',
    'file=weekly-plan.json',
    `errors=${validation.errors.length}`,
    `warnings=${validation.warnings.length}`,
    validation.errors.length ? '\nERRORS:' : '',
    ...validation.errors.map((e) => `- ${e}`),
    validation.warnings.length ? '\nWARNINGS:' : '',
    ...validation.warnings.map((w) => `- ${w}`),
  ].filter(Boolean).join('\n') + '\n';

  const downloadPayload = {
    'weekly-plan.md': formatPlanMarkdown(intake, plan),
    'weekly-plan.json': JSON.stringify({ intake, plan }, null, 2),
    'validation.txt': validationText,
    'weekly-plan.ics': buildCalendarFile(intake, plan),
  };
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(downloadPayload));
  renderDownloads(downloadPayload);
}

function seedForm(intake) {
  document.querySelector('[name="week_of"]').value = intake.week_of || DEFAULT_INTAKE.week_of;
  document.querySelector('[name="max_prep_minutes"]').value = intake.preferences.max_prep_minutes;
  document.querySelector('[name="daily_calorie_target"]').value = intake.goals.daily_calorie_target;
  document.querySelector('[name="daily_protein_target_g"]').value = intake.goals.daily_protein_target_g;
  document.querySelector('[name="shrimp_ok"]').checked = !!intake.preferences.shrimp_ok;
  const shoppingMode = intake.preferences.shopping_mode || 'extras_ok';
  const shoppingModeEl = document.querySelector(`[name="shopping_mode"][value="${shoppingMode}"]`);
  if (shoppingModeEl) shoppingModeEl.checked = true;
  document.querySelector('[name="likes"]').value = (intake.preferences.likes || []).join(', ');
  document.querySelector('[name="dislikes"]').value = (intake.preferences.dislikes || []).join(', ');
  document.querySelector('[name="notes"]').value = intake.preferences.notes || '';
  seedSection('fridge', intake.inventory.fridge);
  seedSection('pantry', intake.inventory.pantry);
  seedSection('freezer', intake.inventory.freezer);
}

function attachAutosaveListeners() {
  const form = document.getElementById('planner-form');
  form.querySelectorAll('input, textarea').forEach((input) => {
    input.addEventListener('input', queueDraftSave);
    input.addEventListener('change', queueDraftSave);
  });
}

(function init() {
  const restored = loadDraft() || DEFAULT_INTAKE;
  seedForm(restored);
  attachAutosaveListeners();
  hasHydrated = true;
  setSaveStatus(loadDraft() ? 'Draft restored from this device' : 'Ready — draft will auto-save on this device', 'good');

  document.querySelectorAll('[data-add-row]').forEach((btn) => {
    btn.addEventListener('click', () => addRow(btn.dataset.addRow));
  });
  document.querySelectorAll('[data-bulk-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => toggleBulkSection(btn.dataset.bulkToggle));
  });
  document.querySelectorAll('[data-bulk-apply]').forEach((btn) => {
    btn.addEventListener('click', () => importBulkSection(btn.dataset.bulkApply));
  });

  document.getElementById('restore-defaults').addEventListener('click', () => {
    seedForm(DEFAULT_INTAKE);
    clearDraft();
    queueDraftSave();
  });

  document.getElementById('planner-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const intake = saveDraftNow() || buildIntakeFromForm();
    const plan = generateWeeklyPlan(intake);
    const validation = validatePlan(plan);
    renderResult(intake, plan, validation);
    window.scrollTo({ top: document.getElementById('result-validation').offsetTop - 12, behavior: 'smooth' });
  });
})();
