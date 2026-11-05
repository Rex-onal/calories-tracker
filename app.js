// NutriTrack - Pure Vanilla JavaScript (No backend, localStorage persistence)

(function() {
  'use strict';

  // Storage Keys
  const STORAGE_KEYS = {
    SETTINGS: 'nutritrack_settings',
    LOGS: 'nutritrack_logs'
  };

  // Default Nutrition Targets
  const DEFAULT_SETTINGS = {
    calorieGoal: 2000,
    carbsGoal: 225,
    proteinGoal: 130,
    fatGoal: 65,
    waterGoal: 8 // glasses of 250ml
  };

  // Preset Foods for 1-Click Logging
  const PRESET_FOODS = [
    { name: 'Oatmeal & Berries', meal: 'breakfast', calories: 280, protein: 9, carbs: 52, fat: 4, icon: '🥣' },
    { name: 'Boiled Eggs (2)', meal: 'breakfast', calories: 155, protein: 13, carbs: 1, fat: 11, icon: '🥚' },
    { name: 'Grilled Chicken (150g)', meal: 'lunch', calories: 245, protein: 46, carbs: 0, fat: 5, icon: '🍗' },
    { name: 'Brown Rice (1 cup)', meal: 'lunch', calories: 215, protein: 5, carbs: 45, fat: 2, icon: '🍚' },
    { name: 'Avocado Toast', meal: 'breakfast', calories: 290, protein: 6, carbs: 28, fat: 18, icon: '🥑' },
    { name: 'Salmon Fillet (150g)', meal: 'dinner', calories: 310, protein: 34, carbs: 0, fat: 18, icon: '🐟' },
    { name: 'Greek Salad', meal: 'lunch', calories: 210, protein: 6, carbs: 11, fat: 16, icon: '🥗' },
    { name: 'Whey Protein Shake', meal: 'snacks', calories: 160, protein: 30, carbs: 4, fat: 2, icon: '🥛' },
    { name: 'Banana', meal: 'snacks', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, icon: '🍌' },
    { name: 'Almonds (30g)', meal: 'snacks', calories: 170, protein: 6, carbs: 6, fat: 15, icon: '🥜' }
  ];

  // Ring Circumference calculation for r = 52
  const RING_CIRCUMFERENCE = 2 * Math.PI * 52; // ~326.726

  // State
  let settings = {};
  let logs = {};
  let activeDate = getTodayDateString();

  // DOM Elements
  const elements = {
    // Date
    datePicker: document.getElementById('date-picker'),
    dateDisplayLabel: document.getElementById('date-display-label'),
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    todayBtn: document.getElementById('today-btn'),

    // Summary Card
    calorieProgressCircle: document.getElementById('calorie-progress-circle'),
    caloriesRemainingVal: document.getElementById('calories-remaining-val'),
    caloriesStatusLabel: document.getElementById('calories-status-label'),
    calorieGoalDisplay: document.getElementById('calorie-goal-display'),
    caloriesConsumedDisplay: document.getElementById('calories-consumed-display'),
    caloriesBurnedDisplay: document.getElementById('calories-burned-display'),
    caloriesNetDisplay: document.getElementById('calories-net-display'),

    // Macros
    carbsStatText: document.getElementById('carbs-stat-text'),
    carbsProgressBar: document.getElementById('carbs-progress-bar'),
    carbsPctText: document.getElementById('carbs-pct-text'),
    proteinStatText: document.getElementById('protein-stat-text'),
    proteinProgressBar: document.getElementById('protein-progress-bar'),
    proteinPctText: document.getElementById('protein-pct-text'),
    fatStatText: document.getElementById('fat-stat-text'),
    fatProgressBar: document.getElementById('fat-progress-bar'),
    fatPctText: document.getElementById('fat-pct-text'),

    // Water
    waterCountDisplay: document.getElementById('water-count-display'),
    waterGlassesIcons: document.getElementById('water-glasses-icons'),
    waterPlusBtn: document.getElementById('water-plus-btn'),
    waterMinusBtn: document.getElementById('water-minus-btn'),

    // Quick Add & Form
    toggleFormBtn: document.getElementById('toggle-form-btn'),
    addFoodForm: document.getElementById('add-food-form'),
    cancelFormBtn: document.getElementById('cancel-form-btn'),
    presetChipsList: document.getElementById('preset-chips-list'),
    foodNameInput: document.getElementById('food-name-input'),
    mealTypeSelect: document.getElementById('meal-type-select'),
    caloriesInput: document.getElementById('calories-input'),
    proteinInput: document.getElementById('protein-input'),
    carbsInput: document.getElementById('carbs-input'),
    fatInput: document.getElementById('fat-input'),

    // Exercise Burn
    quickBurnedInput: document.getElementById('quick-burned-input'),
    addBurnedBtn: document.getElementById('add-burned-btn'),

    // Meal Block Lists
    breakfastList: document.getElementById('breakfast-items-list'),
    lunchList: document.getElementById('lunch-items-list'),
    dinnerList: document.getElementById('dinner-items-list'),
    snacksList: document.getElementById('snacks-items-list'),

    // Meal Subtotals
    breakfastSubtotal: document.getElementById('breakfast-calories-subtotal'),
    lunchSubtotal: document.getElementById('lunch-calories-subtotal'),
    dinnerSubtotal: document.getElementById('dinner-calories-subtotal'),
    snacksSubtotal: document.getElementById('snacks-calories-subtotal'),

    // Modals
    openSettingsBtn: document.getElementById('open-settings-btn'),
    closeSettingsBtn: document.getElementById('close-settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsForm: document.getElementById('settings-form'),
    resetDefaultsBtn: document.getElementById('reset-defaults-btn'),
    setCalorieTarget: document.getElementById('set-calorie-target'),
    setCarbsTarget: document.getElementById('set-carbs-target'),
    setProteinTarget: document.getElementById('set-protein-target'),
    setFatTarget: document.getElementById('set-fat-target'),
    setWaterTarget: document.getElementById('set-water-target'),

    openStatsBtn: document.getElementById('open-stats-btn'),
    closeStatsBtn: document.getElementById('close-stats-btn'),
    statsCloseFooterBtn: document.getElementById('stats-close-footer-btn'),
    statsModal: document.getElementById('stats-modal'),
    weeklyStatsSummary: document.getElementById('weekly-stats-summary'),
    weeklyChartBars: document.getElementById('weekly-chart-bars'),

    // Footer actions
    exportDataBtn: document.getElementById('export-data-btn'),
    importDataBtn: document.getElementById('import-data-btn'),
    importFileInput: document.getElementById('import-file-input'),
    clearDayBtn: document.getElementById('clear-day-btn'),

    // Toast
    toast: document.getElementById('toast')
  };

  // --- INITIALIZATION ---
  function init() {
    loadSettings();
    loadLogs();
    seedInitialDataIfEmpty();

    setupDatePicker();
    renderPresetChips();
    bindEvents();
    renderAll();
  }

  // --- DATE HELPERS ---
  function getTodayDateString() {
    const now = new Date();
    return formatDateKey(now);
  }

  function formatDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(keyStr) {
    const parts = keyStr.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function formatDisplayDate(dateKey) {
    const todayStr = getTodayDateString();
    if (dateKey === todayStr) return 'Today';

    const targetDate = parseDateKey(dateKey);
    const today = parseDateKey(todayStr);

    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 1) return 'Tomorrow';

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return targetDate.toLocaleDateString(undefined, options);
  }

  function setupDatePicker() {
    elements.datePicker.value = activeDate;
    updateDateDisplay();
  }

  function updateDateDisplay() {
    elements.datePicker.value = activeDate;
    elements.dateDisplayLabel.textContent = formatDisplayDate(activeDate);
  }

  // --- LOCAL STORAGE HELPERS ---
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved));
      } else {
        settings = Object.assign({}, DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.error('Failed to read settings from localStorage', e);
      settings = Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  function loadLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      logs = saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to read logs from localStorage', e);
      logs = {};
    }
  }

  function saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs to localStorage', e);
    }
  }

  function getDayData(dateKey) {
    if (!logs[dateKey]) {
      logs[dateKey] = {
        foods: [],
        burned: 0,
        water: 0
      };
    }
    return logs[dateKey];
  }

  // Starter sample items for first-time visitors
  function seedInitialDataIfEmpty() {
    const hasAnyLogs = Object.keys(logs).length > 0;
    if (!hasAnyLogs) {
      const today = getTodayDateString();
      logs[today] = {
        foods: [
          {
            id: 'init_1',
            name: 'Oatmeal with Blueberries & Honey',
            meal: 'breakfast',
            calories: 320,
            protein: 10,
            carbs: 58,
            fat: 5,
            timestamp: Date.now() - 3600000 * 4
          },
          {
            id: 'init_2',
            name: 'Grilled Chicken Salad with Olive Oil',
            meal: 'lunch',
            calories: 450,
            protein: 42,
            carbs: 14,
            fat: 22,
            timestamp: Date.now() - 3600000 * 2
          }
        ],
        burned: 150,
        water: 3
      };
      saveLogs();
    }
  }

  // --- RENDER FUNCTIONS ---
  function renderAll() {
    const dayData = getDayData(activeDate);

    // Compute totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const mealTotals = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snacks: 0
    };

    dayData.foods.forEach(item => {
      const cal = Number(item.calories) || 0;
      totalCalories += cal;
      totalProtein += Number(item.protein) || 0;
      totalCarbs += Number(item.carbs) || 0;
      totalFat += Number(item.fat) || 0;

      if (mealTotals[item.meal] !== undefined) {
        mealTotals[item.meal] += cal;
      } else {
        mealTotals.snacks += cal;
      }
    });

    const burned = Number(dayData.burned) || 0;
    const netCalories = Math.max(0, totalCalories - burned);
    const calorieGoal = Number(settings.calorieGoal) || 2000;
    const remainingCalories = calorieGoal - netCalories;

    // 1. Render Summary Card
    elements.calorieGoalDisplay.textContent = `${calorieGoal.toLocaleString()} kcal`;
    elements.caloriesConsumedDisplay.textContent = `${totalCalories.toLocaleString()} kcal`;
    elements.caloriesBurnedDisplay.textContent = `${burned.toLocaleString()} kcal`;
    elements.caloriesNetDisplay.textContent = `${netCalories.toLocaleString()} kcal`;

    if (remainingCalories >= 0) {
      elements.caloriesRemainingVal.textContent = remainingCalories.toLocaleString();
      elements.caloriesRemainingVal.style.color = '#0f172a';
      elements.caloriesStatusLabel.textContent = 'Remaining';
      elements.caloriesStatusLabel.style.color = '#64748b';
      elements.calorieProgressCircle.style.stroke = '#10b981';
    } else {
      elements.caloriesRemainingVal.textContent = Math.abs(remainingCalories).toLocaleString();
      elements.caloriesRemainingVal.style.color = '#ef4444';
      elements.caloriesStatusLabel.textContent = 'Over Target';
      elements.caloriesStatusLabel.style.color = '#ef4444';
      elements.calorieProgressCircle.style.stroke = '#ef4444';
    }

    // Calorie Ring Offset
    const progressRatio = Math.min(1.0, Math.max(0, netCalories / calorieGoal));
    const offset = RING_CIRCUMFERENCE - (progressRatio * RING_CIRCUMFERENCE);
    elements.calorieProgressCircle.style.strokeDashoffset = offset;

    // 2. Render Macronutrients
    renderMacroProgress(
      totalCarbs,
      settings.carbsGoal,
      elements.carbsStatText,
      elements.carbsProgressBar,
      elements.carbsPctText
    );
    renderMacroProgress(
      totalProtein,
      settings.proteinGoal,
      elements.proteinStatText,
      elements.proteinProgressBar,
      elements.proteinPctText
    );
    renderMacroProgress(
      totalFat,
      settings.fatGoal,
      elements.fatStatText,
      elements.fatProgressBar,
      elements.fatPctText
    );

    // 3. Render Water Tracker
    renderWater(dayData.water || 0, settings.waterGoal || 8);

    // 4. Render Meal Subtotals
    elements.breakfastSubtotal.textContent = `${mealTotals.breakfast} kcal`;
    elements.lunchSubtotal.textContent = `${mealTotals.lunch} kcal`;
    elements.dinnerSubtotal.textContent = `${mealTotals.dinner} kcal`;
    elements.snacksSubtotal.textContent = `${mealTotals.snacks} kcal`;

    // 5. Render Meal Items
    renderMealBlock('breakfast', dayData.foods, elements.breakfastList);
    renderMealBlock('lunch', dayData.foods, elements.lunchList);
    renderMealBlock('dinner', dayData.foods, elements.dinnerList);
    renderMealBlock('snacks', dayData.foods, elements.snacksList);
  }

  function renderMacroProgress(current, target, textEl, barEl, pctEl) {
    const curVal = Math.round(current);
    const tarVal = Math.round(target) || 1;
    const pct = Math.round((curVal / tarVal) * 100);

    textEl.textContent = `${curVal}g / ${tarVal}g`;
    barEl.style.width = `${Math.min(100, pct)}%`;
    pctEl.textContent = `${pct}% of target`;

    if (pct > 115) {
      pctEl.style.color = '#ef4444';
    } else {
      pctEl.style.color = '#94a3b8';
    }
  }

  function renderWater(current, target) {
    const glasses = Math.max(0, current);
    const goal = Math.max(1, target);
    const ml = glasses * 250;
    elements.waterCountDisplay.textContent = `${glasses} / ${goal} glasses (${ml} ml)`;

    elements.waterGlassesIcons.innerHTML = '';
    for (let i = 1; i <= Math.max(goal, glasses); i++) {
      const drop = document.createElement('span');
      drop.className = 'water-drop-icon' + (i <= glasses ? ' filled' : '');
      drop.textContent = '💧';
      drop.title = `Glass ${i} (250ml)`;
      drop.addEventListener('click', () => {
        setWater(i === glasses ? i - 1 : i);
      });
      elements.waterGlassesIcons.appendChild(drop);
    }
  }

  function renderMealBlock(mealType, allFoods, containerEl) {
    const items = allFoods.filter(f => f.meal === mealType);
    if (items.length === 0) {
      containerEl.innerHTML = `<div class="empty-meal-state">No foods logged for ${mealType}.</div>`;
      return;
    }

    containerEl.innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'food-item-row';

      const p = item.protein !== undefined && item.protein !== null && item.protein !== '' ? Number(item.protein) : 0;
      const c = item.carbs !== undefined && item.carbs !== null && item.carbs !== '' ? Number(item.carbs) : 0;
      const f = item.fat !== undefined && item.fat !== null && item.fat !== '' ? Number(item.fat) : 0;

      row.innerHTML = `
        <div class="food-item-info">
          <span class="food-item-title">${escapeHtml(item.name)}</span>
          <div class="food-item-macros">
            <span class="food-macro-tag-p">P: ${p}g</span>
            <span class="food-macro-tag-c">C: ${c}g</span>
            <span class="food-macro-tag-f">F: ${f}g</span>
          </div>
        </div>
        <div class="food-item-meta">
          <span class="food-item-calories">${Number(item.calories)} kcal</span>
          <button class="btn-delete-item" title="Delete entry" data-id="${item.id}">&times;</button>
        </div>
      `;

      row.querySelector('.btn-delete-item').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFoodItem(item.id);
      });

      containerEl.appendChild(row);
    });
  }

  function renderPresetChips() {
    elements.presetChipsList.innerHTML = '';
    PRESET_FOODS.forEach(preset => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      chip.innerHTML = `
        <span>${preset.icon}</span>
        <span>${preset.name}</span>
        <span class="preset-chip-kcal">${preset.calories}k</span>
      `;
      chip.title = `Click to quick-add ${preset.name} (${preset.calories} kcal)`;
      chip.addEventListener('click', () => {
        addPresetFood(preset);
      });
      elements.presetChipsList.appendChild(chip);
    });
  }

  // --- ACTIONS ---
  function addPresetFood(preset) {
    const dayData = getDayData(activeDate);
    const newFood = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: preset.name,
      meal: preset.meal,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
      timestamp: Date.now()
    };
    dayData.foods.push(newFood);
    saveLogs();
    renderAll();
    showToast(`Added ${preset.name} (${preset.calories} kcal)`);
  }

  function handleFoodFormSubmit(e) {
    e.preventDefault();

    const name = elements.foodNameInput.value.trim();
    const meal = elements.mealTypeSelect.value;
    const calories = parseFloat(elements.caloriesInput.value);
    const protein = parseFloat(elements.proteinInput.value) || 0;
    const carbs = parseFloat(elements.carbsInput.value) || 0;
    const fat = parseFloat(elements.fatInput.value) || 0;

    if (!name || isNaN(calories) || calories < 0) {
      showToast('Please enter a valid food name and calorie amount');
      return;
    }

    const dayData = getDayData(activeDate);
    const newFood = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name,
      meal: meal,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      timestamp: Date.now()
    };

    dayData.foods.push(newFood);
    saveLogs();
    renderAll();

    // Reset & close form
    elements.addFoodForm.reset();
    elements.addFoodForm.classList.add('hidden');
    elements.toggleFormBtn.innerHTML = '<span>+</span> Add Custom Food';
    showToast(`Logged "${name}" (${calories} kcal)`);
  }

  function deleteFoodItem(itemId) {
    const dayData = getDayData(activeDate);
    const itemIndex = dayData.foods.findIndex(f => f.id === itemId);
    if (itemIndex > -1) {
      const removed = dayData.foods.splice(itemIndex, 1)[0];
      saveLogs();
      renderAll();
      showToast(`Removed "${removed.name}"`);
    }
  }

  function setWater(val) {
    const dayData = getDayData(activeDate);
    dayData.water = Math.max(0, val);
    saveLogs();
    renderAll();
  }

  function handleAddBurned() {
    const burnVal = parseFloat(elements.quickBurnedInput.value);
    if (isNaN(burnVal) || burnVal <= 0) {
      showToast('Enter valid calories burned');
      return;
    }

    const dayData = getDayData(activeDate);
    dayData.burned = (dayData.burned || 0) + Math.round(burnVal);
    saveLogs();
    renderAll();
    elements.quickBurnedInput.value = '';
    showToast(`Logged ${burnVal} kcal burned`);
  }

  function handleDateChange(newDateKey) {
    activeDate = newDateKey;
    updateDateDisplay();
    renderAll();
  }

  function stepDate(daysOffset) {
    const current = parseDateKey(activeDate);
    current.setDate(current.getDate() + daysOffset);
    handleDateChange(formatDateKey(current));
  }

  // Settings & Goals
  function openSettingsModal() {
    elements.setCalorieTarget.value = settings.calorieGoal || 2000;
    elements.setCarbsTarget.value = settings.carbsGoal || 225;
    elements.setProteinTarget.value = settings.proteinGoal || 130;
    elements.setFatTarget.value = settings.fatGoal || 65;
    elements.setWaterTarget.value = settings.waterGoal || 8;
    elements.settingsModal.classList.remove('hidden');
  }

  function closeSettingsModal() {
    elements.settingsModal.classList.add('hidden');
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    settings.calorieGoal = parseInt(elements.setCalorieTarget.value, 10) || 2000;
    settings.carbsGoal = parseInt(elements.setCarbsTarget.value, 10) || 225;
    settings.proteinGoal = parseInt(elements.setProteinTarget.value, 10) || 130;
    settings.fatGoal = parseInt(elements.setFatTarget.value, 10) || 65;
    settings.waterGoal = parseInt(elements.setWaterTarget.value, 10) || 8;

    saveSettings();
    closeSettingsModal();
    renderAll();
    showToast('Nutrition targets updated!');
  }

  function resetDefaultGoals() {
    elements.setCalorieTarget.value = DEFAULT_SETTINGS.calorieGoal;
    elements.setCarbsTarget.value = DEFAULT_SETTINGS.carbsGoal;
    elements.setProteinTarget.value = DEFAULT_SETTINGS.proteinGoal;
    elements.setFatTarget.value = DEFAULT_SETTINGS.fatGoal;
    elements.setWaterTarget.value = DEFAULT_SETTINGS.waterGoal;
  }

  // Weekly Stats Modal
  function openStatsModal() {
    renderWeeklyStats();
    elements.statsModal.classList.remove('hidden');
  }

  function closeStatsModal() {
    elements.statsModal.classList.add('hidden');
  }

  function renderWeeklyStats() {
    const days = [];
    const baseDate = parseDateKey(activeDate);

    // Build last 7 days window ending at activeDate
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      days.push(formatDateKey(d));
    }

    let totalCals = 0;
    let daysWithLogs = 0;
    let maxCals = settings.calorieGoal * 1.25;

    const dayDataList = days.map(dKey => {
      const log = logs[dKey];
      let cals = 0;
      if (log && log.foods) {
        cals = log.foods.reduce((acc, f) => acc + (Number(f.calories) || 0), 0);
      }
      if (cals > 0) {
        totalCals += cals;
        daysWithLogs++;
      }
      if (cals > maxCals) {
        maxCals = cals;
      }
      return { dateKey: dKey, cals: cals };
    });

    const avgCals = daysWithLogs > 0 ? Math.round(totalCals / daysWithLogs) : 0;

    // Render Stats Boxes
    elements.weeklyStatsSummary.innerHTML = `
      <div class="weekly-stat-box">
        <div class="box-num">${totalCals.toLocaleString()}</div>
        <div class="box-desc">7-Day Total</div>
      </div>
      <div class="weekly-stat-box">
        <div class="box-num">${avgCals.toLocaleString()}</div>
        <div class="box-desc">Daily Average</div>
      </div>
      <div class="weekly-stat-box">
        <div class="box-num">${settings.calorieGoal.toLocaleString()}</div>
        <div class="box-desc">Daily Goal</div>
      </div>
    `;

    // Render Bar Chart
    elements.weeklyChartBars.innerHTML = '';
    dayDataList.forEach(item => {
      const dObj = parseDateKey(item.dateKey);
      const dayName = dObj.toLocaleDateString(undefined, { weekday: 'narrow' });
      const heightPct = maxCals > 0 ? Math.min(100, Math.round((item.cals / maxCals) * 100)) : 0;
      const isOver = item.cals > settings.calorieGoal;

      const col = document.createElement('div');
      col.className = 'chart-bar-column';
      col.innerHTML = `
        <span class="chart-bar-val">${item.cals > 0 ? item.cals : '0'}</span>
        <div class="chart-bar-fill-wrap">
          <div class="chart-bar-fill ${isOver ? 'over-target' : ''}" style="height: ${heightPct}%;"></div>
        </div>
        <span class="chart-bar-day">${dayName}</span>
      `;
      col.title = `${item.dateKey}: ${item.cals} kcal`;
      elements.weeklyChartBars.appendChild(col);
    });
  }

  // Export / Import / Clear
  function exportData() {
    const exportObject = {
      settings: settings,
      logs: logs,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const jsonStr = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutritrack_backup_${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported your nutrition data!');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.settings && data.logs) {
          settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
          logs = Object.assign({}, data.logs);
          saveSettings();
          saveLogs();
          renderAll();
          showToast('Data imported successfully!');
        } else {
          showToast('Invalid JSON backup file structure');
        }
      } catch (err) {
        showToast('Error parsing JSON backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function clearCurrentDay() {
    if (confirm(`Are you sure you want to clear all logged food and water for ${formatDisplayDate(activeDate)}?`)) {
      logs[activeDate] = {
        foods: [],
        burned: 0,
        water: 0
      };
      saveLogs();
      renderAll();
      showToast('Cleared logs for this day');
    }
  }

  // Toast UI
  let toastTimeout;
  function showToast(msg) {
    clearTimeout(toastTimeout);
    elements.toast.textContent = msg;
    elements.toast.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
      elements.toast.classList.add('hidden');
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- EVENT BINDINGS ---
  function bindEvents() {
    // Date navigation
    elements.prevDayBtn.addEventListener('click', () => stepDate(-1));
    elements.nextDayBtn.addEventListener('click', () => stepDate(1));
    elements.todayBtn.addEventListener('click', () => handleDateChange(getTodayDateString()));
    elements.datePicker.addEventListener('change', (e) => handleDateChange(e.target.value));

    // Form toggle
    elements.toggleFormBtn.addEventListener('click', () => {
      const isHidden = elements.addFoodForm.classList.contains('hidden');
      if (isHidden) {
        elements.addFoodForm.classList.remove('hidden');
        elements.toggleFormBtn.innerHTML = '<span>&times;</span> Close Form';
        elements.foodNameInput.focus();
      } else {
        elements.addFoodForm.classList.add('hidden');
        elements.toggleFormBtn.innerHTML = '<span>+</span> Add Custom Food';
      }
    });

    elements.cancelFormBtn.addEventListener('click', () => {
      elements.addFoodForm.classList.add('hidden');
      elements.toggleFormBtn.innerHTML = '<span>+</span> Add Custom Food';
    });

    // Form submit
    elements.addFoodForm.addEventListener('submit', handleFoodFormSubmit);

    // Exercise burn
    elements.addBurnedBtn.addEventListener('click', handleAddBurned);
    elements.quickBurnedInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddBurned();
      }
    });

    // Water controls
    elements.waterPlusBtn.addEventListener('click', () => {
      const dayData = getDayData(activeDate);
      setWater((dayData.water || 0) + 1);
    });
    elements.waterMinusBtn.addEventListener('click', () => {
      const dayData = getDayData(activeDate);
      setWater((dayData.water || 0) - 1);
    });

    // Modals
    elements.openSettingsBtn.addEventListener('click', openSettingsModal);
    elements.closeSettingsBtn.addEventListener('click', closeSettingsModal);
    elements.settingsForm.addEventListener('submit', handleSaveSettings);
    elements.resetDefaultsBtn.addEventListener('click', resetDefaultGoals);

    elements.openStatsBtn.addEventListener('click', openStatsModal);
    elements.closeStatsBtn.addEventListener('click', closeStatsModal);
    elements.statsCloseFooterBtn.addEventListener('click', closeStatsModal);

    // Close modals on clicking overlay background
    elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === elements.settingsModal) closeSettingsModal();
    });
    elements.statsModal.addEventListener('click', (e) => {
      if (e.target === elements.statsModal) closeStatsModal();
    });

    // Data Export & Import
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importDataBtn.addEventListener('click', () => elements.importFileInput.click());
    elements.importFileInput.addEventListener('change', handleImportFile);
    elements.clearDayBtn.addEventListener('click', clearCurrentDay);
  }

  // Expose global interface for inline button triggers (e.g. "+ Add" on meal block)
  window.app = {
    openAddForMeal: function(mealType) {
      elements.mealTypeSelect.value = mealType;
      elements.addFoodForm.classList.remove('hidden');
      elements.toggleFormBtn.innerHTML = '<span>&times;</span> Close Form';
      elements.foodNameInput.focus();
      elements.addFoodForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

