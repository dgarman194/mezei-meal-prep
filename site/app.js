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
    max_prep_minutes: 120,
    likes: [],
    dislikes: [],
    notes: '',
  },
  inventory: {
    fridge: [
      { item: 'spinach', qty: '1 bag', expires_in_days: 3 },
      { item: 'greek yogurt', qty: '24 oz', expires_in_days: 6 },
    ],
    pantry: [
      { item: 'lentils', qty: '2 cups dry', expires_in_days: null },
      { item: 'brown rice', qty: '4 cups dry', expires_in_days: null },
    ],
    freezer: [
      { item: 'shrimp', qty: '1 lb', expires_in_days: 30 },
    ],
  },
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_CATALOG = [
  {
    name: 'Lentil Spinach Curry Bowls',
    type: 'vegetarian',
    ingredients: ['lentils', 'spinach', 'onion', 'garlic', 'coconut milk', 'tomato'],
    kcal: 430,
    protein_g: 24,
    prep: 'batch',
    flavor_tags: ['curry', 'warm', 'savory'],
    taste_upgrade: 'Bloom curry powder + cumin in oil, finish with lemon and cilantro.',
  },
  {
    name: 'Chickpea Greek Salad Boxes',
    type: 'vegetarian',
    ingredients: ['chickpeas', 'cucumber', 'tomato', 'feta', 'olive oil', 'lemon'],
    kcal: 390,
    protein_g: 19,
    prep: 'batch',
    flavor_tags: ['mediterranean', 'bright', 'fresh'],
    taste_upgrade: 'Salt cucumbers first, then toss with lemon zest + oregano vinaigrette.',
  },
  {
    name: 'Tofu Veggie Stir-Fry + Brown Rice',
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
    type: 'shrimp',
    ingredients: ['shrimp', 'zucchini', 'quinoa', 'garlic', 'lemon', 'olive oil'],
    kcal: 410,
    protein_g: 33,
    prep: 'quick',
    flavor_tags: ['lemon-herb', 'bright', 'quick'],
    taste_upgrade: 'Marinate shrimp 10 min with lemon, paprika, garlic, then finish with parsley.',
  },
  {
    name: 'Greek Yogurt Overnight Oats',
    type: 'vegetarian',
    ingredients: ['greek yogurt', 'oats', 'chia seeds', 'berries'],
    kcal: 340,
    protein_g: 22,
    prep: 'batch',
    flavor_tags: ['sweet', 'creamy', 'fresh'],
    taste_upgrade: 'Use pinch of salt + cinnamon + vanilla; add toasted nuts at serving time.',
  },
  {
    name: 'Egg White Veggie Muffins + Fruit',
    type: 'vegetarian',
    ingredients: ['egg whites', 'spinach', 'bell pepper', 'onion'],
    kcal: 280,
    protein_g: 23,
    prep: 'batch',
    flavor_tags: ['savory', 'light', 'quick'],
    taste_upgrade: 'Sauté veggies first and add feta/chili flakes for stronger flavor.',
  },
  {
    name: 'Black Bean Taco Bowls',
    type: 'vegetarian',
    ingredients: ['black beans', 'brown rice', 'corn', 'salsa', 'avocado', 'lime'],
    kcal: 460,
    protein_g: 20,
    prep: 'batch',
    flavor_tags: ['tex-mex', 'smoky', 'savory'],
    taste_upgrade: 'Toast spices, add chipotle-lime yogurt sauce, finish with pickled onions.',
  },
  {
    name: 'Cottage Cheese Power Snack Plate',
    type: 'vegetarian',
    ingredients: ['cottage cheese', 'carrot', 'cucumber', 'hummus'],
    kcal: 260,
    protein_g: 21,
    prep: 'quick',
    flavor_tags: ['fresh', 'salty', 'crunchy'],
    taste_upgrade: 'Season cottage cheese with za\'atar + olive oil; add crunchy roasted chickpeas.',
  },
];

const FORBIDDEN = ['chicken', 'beef', 'pork', 'bacon', 'turkey', 'ham', 'sausage', 'salmon', 'tuna', 'cod'];

function normalize(text) {
  return String(text || '').trim().toLowerCase();
}

function parseListText(value) {
  if (!value) return [];
  return String(value).replace(/\n/g, ',').split(',').map(s => s.trim()).filter(Boolean);
}

function parseIntSafe(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
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
  remove.addEventListener('click', () => wrapper.remove());

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

function mealScore(meal, invIdx, perishIdx, dislikes, likes, shrimpOk) {
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
  const mealText = normalize([meal.name, ...meal.ingredients, ...(meal.flavor_tags || [])].join(' '));
  likes.forEach((liked) => {
    const l = normalize(liked);
    if (l && mealText.includes(l)) likeBonus += 2;
  });
  const base = matched * 3 + perishBonus * 2 - missing;
  const proteinBonus = Math.floor((meal.protein_g || 0) / 8);
  return base + proteinBonus + likeBonus;
}

function chooseMeals(intake, invIdx, perishIdx) {
  const prefs = intake.preferences || {};
  const shrimpOk = !!prefs.shrimp_ok;
  const dislikes = prefs.dislikes || [];
  const likes = prefs.likes || [];
  const scored = [];
  MEAL_CATALOG.forEach((meal) => {
    const score = mealScore(meal, invIdx, perishIdx, dislikes, likes, shrimpOk);
    if (score > -500) scored.push({ score, meal });
  });
  scored.sort((a, b) => (b.score - a.score) || ((b.meal.protein_g || 0) - (a.meal.protein_g || 0)));
  const selected = [];
  let shrimpCount = 0;
  scored.forEach(({ meal }) => {
    if (selected.length >= 5) return;
    if (meal.type === 'shrimp') {
      if (!shrimpOk || shrimpCount >= 2) return;
      shrimpCount += 1;
    }
    selected.push(meal);
  });
  if (selected.length < 4) {
    const names = new Set(selected.map((m) => m.name));
    MEAL_CATALOG.filter((m) => m.type === 'vegetarian')
      .sort((a, b) => (b.protein_g || 0) - (a.protein_g || 0))
      .forEach((meal) => {
        if (selected.length >= 4) return;
        if (!names.has(meal.name)) {
          selected.push(meal);
          names.add(meal.name);
        }
      });
  }
  return selected;
}

function buildSchedule(selectedMeals) {
  if (!selectedMeals.length) return [];
  const shrimpMealNames = new Set(selectedMeals.filter((m) => m.type === 'shrimp').map((m) => m.name));
  const nonShrimpMeals = selectedMeals.filter((m) => m.type !== 'shrimp');
  let shrimpSlots = 0;
  return DAYS.map((day, i) => {
    let lunch = selectedMeals[i % selectedMeals.length];
    let dinner = selectedMeals[(i + 2) % selectedMeals.length];
    if (shrimpMealNames.has(lunch.name) && shrimpSlots >= 3 && nonShrimpMeals.length) lunch = nonShrimpMeals[i % nonShrimpMeals.length];
    if (shrimpMealNames.has(lunch.name)) shrimpSlots += 1;
    if (shrimpMealNames.has(dinner.name) && shrimpSlots >= 3 && nonShrimpMeals.length) dinner = nonShrimpMeals[(i + 2) % nonShrimpMeals.length];
    if (shrimpMealNames.has(dinner.name)) shrimpSlots += 1;
    return { day, lunch: lunch.name, dinner: dinner.name };
  });
}

function buildShoppingList(selectedMeals, invIdx) {
  const missing = {};
  const categoryGuess = {
    spinach: 'Produce', onion: 'Produce', garlic: 'Produce', tomato: 'Produce', cucumber: 'Produce',
    broccoli: 'Produce', 'bell pepper': 'Produce', zucchini: 'Produce', lemon: 'Produce', berries: 'Produce',
    corn: 'Produce', avocado: 'Produce', lime: 'Produce', cilantro: 'Produce', parsley: 'Produce',
    tofu: 'Protein', 'egg whites': 'Protein', shrimp: 'Protein', feta: 'Protein', 'cottage cheese': 'Protein', 'greek yogurt': 'Protein',
    lentils: 'Pantry', chickpeas: 'Pantry', 'brown rice': 'Pantry', quinoa: 'Pantry', 'black beans': 'Pantry',
    oats: 'Pantry', 'chia seeds': 'Pantry', 'soy sauce': 'Pantry', 'olive oil': 'Pantry', 'coconut milk': 'Pantry', salsa: 'Pantry', hummus: 'Pantry'
  };
  selectedMeals.forEach((meal) => {
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

function buildPrepSteps(selectedMeals) {
  const batchMeals = selectedMeals.filter((m) => m.prep === 'batch');
  const quickMeals = selectedMeals.filter((m) => m.prep !== 'batch');
  const steps = [
    'Cook grains and legumes first so the longest items run in the background.',
    'Chop and roast or sauté vegetables in one batch to save time and dishes.',
    'Mix two sauces for the week so meals taste fresh when reheated.',
    'Cook main proteins and portion them into containers while bases cool.',
  ];
  if (batchMeals.length) {
    steps.push(`Prioritize batch meals first: ${batchMeals.map((m) => m.name).join(', ')}.`);
  }
  if (quickMeals.length) {
    steps.push(`Save quick fresh-cook meals for later in the week: ${quickMeals.map((m) => m.name).join(', ')}.`);
  }
  return steps;
}

function buildFlavorPlaybook(selectedMeals) {
  return {
    weekly_sauce_rotation: [
      { name: 'Lemon-Herb Yogurt', formula: 'Greek yogurt + lemon juice + zest + garlic + salt + dill/parsley' },
      { name: 'Chipotle-Lime', formula: 'Greek yogurt (or light mayo) + chipotle + lime juice + cumin + tiny honey pinch' },
    ],
    meal_upgrades: selectedMeals.map((meal) => ({ meal: meal.name, taste_upgrade: meal.taste_upgrade })),
  };
}

function buildMacroSummary(selectedMeals, intake) {
  if (!selectedMeals.length) {
    return {
      target_calories: intake.goals.daily_calorie_target,
      target_protein_g: intake.goals.daily_protein_target_g,
      estimated_avg_daily_calories: 0,
      estimated_avg_daily_protein_g: 0,
      calorie_delta: -intake.goals.daily_calorie_target,
      protein_delta_g: -intake.goals.daily_protein_target_g,
    };
  }
  const avgCalories = Math.round(selectedMeals.reduce((sum, meal) => sum + meal.kcal, 0) / selectedMeals.length);
  const avgProtein = Math.round(selectedMeals.reduce((sum, meal) => sum + meal.protein_g, 0) / selectedMeals.length);
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
  const meals = plan.selected_meals || [];
  if (meals.length < 4) errors.push('Need at least 4 selected meals.');
  if (new Set(meals.map((m) => m.name)).size < 4) errors.push('Meal variety too low (<4 unique meal names).');
  const shrimpNames = new Set(meals.filter((m) => m.type === 'shrimp').map((m) => m.name));
  const schedule = plan.schedule || [];
  if (schedule.length !== 7) errors.push('Schedule must include 7 days.');
  let shrimpSlots = 0;
  schedule.forEach((row) => {
    if (shrimpNames.has(row.lunch)) shrimpSlots += 1;
    if (shrimpNames.has(row.dinner)) shrimpSlots += 1;
  });
  if (shrimpSlots > 3) warnings.push(`Shrimp slots high (${shrimpSlots}>3).`);
  const textBlob = JSON.stringify(meals).toLowerCase();
  FORBIDDEN.forEach((word) => {
    if (textBlob.includes(word)) errors.push(`Forbidden meat/fish term found: ${word}`);
  });
  if (!plan.prep_steps || plan.prep_steps.length < 4) errors.push('prep_steps missing or too short (<4).');
  const flavor = plan.flavor_playbook || {};
  if (!flavor.meal_upgrades) warnings.push('Flavor playbook missing (meals may feel bland/repetitive).');
  else if (flavor.meal_upgrades.length < meals.length) warnings.push('Not all meals include taste upgrades.');
  const macro = plan.macro_summary || {};
  if (!Object.keys(macro).length) errors.push('macro_summary missing.');
  else {
    if (Math.abs((macro.estimated_avg_daily_calories || 0) - (macro.target_calories || 0)) > 250) {
      warnings.push(`Calories off target by >250 kcal (${macro.estimated_avg_daily_calories} vs ${macro.target_calories}).`);
    }
    if ((macro.estimated_avg_daily_protein_g || 0) < (macro.target_protein_g || 0) - 20) {
      warnings.push(`Protein below target by >20g (${macro.estimated_avg_daily_protein_g} vs ${macro.target_protein_g}).`);
    }
  }
  return { errors, warnings };
}

function generateWeeklyPlan(intake) {
  const { idx, perishable } = buildInventoryIndex(intake);
  const selectedMeals = chooseMeals(intake, idx, perishable);
  return {
    selected_meals: selectedMeals,
    schedule: buildSchedule(selectedMeals),
    prep_steps: buildPrepSteps(selectedMeals),
    shopping_list: buildShoppingList(selectedMeals, idx),
    flavor_playbook: buildFlavorPlaybook(selectedMeals),
    macro_summary: buildMacroSummary(selectedMeals, intake),
  };
}

function renderDownloads(run) {
  const downloads = document.getElementById('downloads');
  downloads.innerHTML = '';
  const files = [
    ['weekly-plan.md', 'Download weekly-plan.md'],
    ['weekly-plan.json', 'Download weekly-plan.json'],
    ['validation.txt', 'Download validation.txt'],
  ];
  files.forEach(([name, label]) => {
    const blob = new Blob([run[name]], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.textContent = label;
    downloads.appendChild(link);
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

  const mealLineup = document.getElementById('meal-lineup');
  mealLineup.innerHTML = '';
  plan.selected_meals.forEach((meal) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${meal.name}</strong> — ${meal.kcal} kcal / ${meal.protein_g}g protein`;
    mealLineup.appendChild(li);
  });

  const schedule = document.getElementById('schedule');
  schedule.innerHTML = '';
  plan.schedule.forEach((day) => {
    const article = document.createElement('article');
    article.innerHTML = `<h4>${day.day}</h4><p><strong>Lunch:</strong> ${day.lunch}</p><p><strong>Dinner:</strong> ${day.dinner}</p>`;
    schedule.appendChild(article);
  });

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
  if (!shoppingEntries.length) {
    shopping.innerHTML = '<p>No additions needed.</p>';
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

  renderDownloads({
    'weekly-plan.md': JSON.stringify({ intake, plan }, null, 2),
    'weekly-plan.json': JSON.stringify(plan, null, 2),
    'validation.txt': validationText,
  });
}

function seedForm(intake) {
  document.querySelector('[name="week_of"]').value = intake.week_of || DEFAULT_INTAKE.week_of;
  document.querySelector('[name="max_prep_minutes"]').value = intake.preferences.max_prep_minutes;
  document.querySelector('[name="daily_calorie_target"]').value = intake.goals.daily_calorie_target;
  document.querySelector('[name="daily_protein_target_g"]').value = intake.goals.daily_protein_target_g;
  document.querySelector('[name="shrimp_ok"]').checked = !!intake.preferences.shrimp_ok;
  document.querySelector('[name="likes"]').value = (intake.preferences.likes || []).join(', ');
  document.querySelector('[name="dislikes"]').value = (intake.preferences.dislikes || []).join(', ');
  document.querySelector('[name="notes"]').value = intake.preferences.notes || '';
  seedSection('fridge', intake.inventory.fridge);
  seedSection('pantry', intake.inventory.pantry);
  seedSection('freezer', intake.inventory.freezer);
}

(function init() {
  seedForm(DEFAULT_INTAKE);
  document.querySelectorAll('[data-add-row]').forEach((btn) => {
    btn.addEventListener('click', () => addRow(btn.dataset.addRow));
  });
  document.querySelectorAll('[data-bulk-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => toggleBulkSection(btn.dataset.bulkToggle));
  });
  document.querySelectorAll('[data-bulk-apply]').forEach((btn) => {
    btn.addEventListener('click', () => importBulkSection(btn.dataset.bulkApply));
  });
  document.getElementById('planner-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const intake = buildIntakeFromForm();
    const plan = generateWeeklyPlan(intake);
    const validation = validatePlan(plan);
    renderResult(intake, plan, validation);
    window.scrollTo({ top: document.getElementById('result-validation').offsetTop - 12, behavior: 'smooth' });
  });
})();
