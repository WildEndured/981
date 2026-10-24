// ============================================================
//  proportions.js · логика, UI и генератор пресетов пропорций
// ============================================================

const LS_KEY = 'bbox_prop_presets_v4'; // v4 из-за новой логики масштабирования

// Базовые коэффициенты (в головах) для женской фигуры
// ВАЖНО: мы задаём анатомически правильные точки для всего диапазона.
function generateFemalePreset(headCount) {
  const N = headCount || 5;

  // Вычисляем проценты в зависимости от роста.
  // Голова = 1/N * 100%.
  // Подбородок = 1 голова.
  // Плечи = 1.2 головы (чуть ниже подбородка).
  // Грудь = 1.8 головы.
  // Талия (пупок) = 2.5 головы (для 5 голов это 50%, для 7.5 это 33%).
  // Лобок = 3 головы (для 5 это 60%, для 7.5 это 40%).
  // Колени: рассчитываем как середину между лобком и стопами.
  // Стопы = N голов (100%).
  
  // Если N = 5:
  // - Лобок = 3/5 = 60%
  // - Стопы = 100%
  // - Колени = 60 + (100-60)/2 = 80%
  //
  // Если N = 7.5:
  // - Лобок = 3/7.5 = 40% (как на скрине!)
  // - Стопы = 100%
  // - Колени = 40 + (100-40)/2 = 70%

  const headPct = 100 / N; // Размер одной головы в процентах
  
  const pubicHeads = 3.0; // Лобок всегда на уровне 3 голов (анатомический стандарт)
  const pubicPercent = (pubicHeads / N) * 100;
  const kneePercent = pubicPercent + (100 - pubicPercent) * 0.5;

  const lines = [
    { id: 'crown',    label: 'Макушка',               percent: 0,                              width: 1.0, color: '#ff7ad9' },
    { id: 'eyes',     label: 'Линия глаз',            percent: headPct * 0.5,                  width: 0.3, color: '#ff7ad9' },
    { id: 'chin',     label: 'Подбородок',            percent: headPct * 1.0,                  width: 1.0, color: '#ff7ad9' },
    { id: 'neck',     label: 'Основание шеи',         percent: headPct * 1.2,                  width: 0.5, color: '#50b4ff' },
    { id: 'nipples',  label: 'Соски',                 percent: headPct * 1.8,                  width: 0.6, color: '#50b4ff' },
    { id: 'chest',    label: 'Низ грудной клетки',    percent: headPct * 2.1,                  width: 1.0, color: '#50b4ff' },
    { id: 'waist',    label: 'Талия (пупок)',         percent: headPct * 2.5,                  width: 0.8, color: '#50b4ff' },
    { id: 'pubic',    label: 'Лобок / Низ таза',      percent: pubicPercent,                   width: 1.0, color: '#50b4ff' },
    { id: 'knees',    label: 'Колени (середина)',     percent: kneePercent,                    width: 1.0, color: '#c080ff' },
    { id: 'feet',     label: 'Стопы',                 percent: 100,                            width: 1.0, color: '#c080ff' }
  ];

  // Округляем проценты для красоты
  lines.forEach(l => l.percent = +l.percent.toFixed(1));

  return {
    id: 'female-' + N + '-' + Date.now(),
    name: `Женская фигура · ${N} голов`,
    lines: lines
  };
}

const DEFAULT_PRESETS = [
  generateFemalePreset(5),
  generateFemalePreset(7.5),
  {
    id: 'classic-7.5',
    name: '7.5 голов · базовая сетка',
    lines: [
      { id: 'crown', label: 'Макушка', percent: 0, enabled: true, width: 1.0 },
      { id: 'chin', label: 'Подбородок', percent: 13, enabled: true, width: 1.0 },
      { id: 'shoulders', label: 'Плечи', percent: 16, enabled: true, width: 1.0 },
      { id: 'pubic', label: 'Лобок', percent: 43, enabled: true, width: 1.0 },
      { id: 'knees', label: 'Колени', percent: 64, enabled: true, width: 1.0 }
    ]
  }
];

function loadPropPresets() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      propPresets = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
      savePropPresets();
    } else {
      propPresets = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('loadPropPresets fail', e);
    propPresets = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
  }

  if (!propPresets.find(p => p.id === activePropPresetId)) {
    activePropPresetId = propPresets.length ? propPresets[0].id : null;
  }
}

function savePropPresets() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(propPresets));
  } catch (e) {
    console.warn('savePropPresets fail', e);
  }
}

function getActivePropPreset() {
  return propPresets.find(p => p.id === activePropPresetId) || propPresets[0] || null;
}

// ============================================================
//  DOM элементы
// ============================================================
const propSection = document.getElementById('propSection');
const showPropLinesEl = document.getElementById('showPropLines');
const propPresetSelect = document.getElementById('propPresetSelect');
const propPresetAddBtn = document.getElementById('propPresetAddBtn');
const propPresetRenameBtn = document.getElementById('propPresetRenameBtn');
const propPresetDelBtn = document.getElementById('propPresetDelBtn');
const propLinesList = document.getElementById('propLinesList');
const addPropLineBtn = document.getElementById('addPropLineBtn');

// Элементы генератора
const headCountGenInput = document.getElementById('headCountGen');
const genPresetBtn = document.getElementById('genPresetBtn');

// ============================================================
//  Отрисовка UI
// ============================================================

function renderPropPresetSelect() {
  if (!propPresetSelect) return;
  propPresetSelect.innerHTML = '';
  propPresets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === activePropPresetId) opt.selected = true;
    propPresetSelect.appendChild(opt);
  });
}

function renderPropLinesList() {
  if (!propLinesList) return;
  propLinesList.innerHTML = '';

  const preset = getActivePropPreset();
  if (!preset) {
    propLinesList.innerHTML = '<div class="empty-note">Нет активного пресета</div>';
    return;
  }

  preset.lines.forEach((line, idx) => {
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = 'auto 1fr 60px auto auto';
    row.style.gap = '6px';
    row.style.alignItems = 'center';
    row.style.background = '#101216';
    row.style.border = '1px solid var(--border, #2b2f37)';
    row.style.borderRadius = '8px';
    row.style.padding = '6px 8px';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = line.enabled !== false;
    chk.addEventListener('change', () => {
      line.enabled = chk.checked;
      savePropPresets();
      if (lum) rebuildAll();
    });

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = line.label;
    labelInput.style.background = '#232830';
    labelInput.style.color = '#fff';
    labelInput.style.border = '1px solid #333a44';
    labelInput.style.borderRadius = '6px';
    labelInput.style.padding = '4px 8px';
    labelInput.style.fontSize = '12px';
    labelInput.style.width = '100%';
    labelInput.addEventListener('input', () => {
      line.label = labelInput.value;
      savePropPresets();
      if (lum) rebuildAll();
    });

    const pctInput = document.createElement('input');
    pctInput.type = 'number';
    pctInput.min = 0;
    pctInput.max = 100;
    pctInput.step = 0.1;
    pctInput.value = line.percent;
    pctInput.style.background = '#232830';
    pctInput.style.color = '#fff';
    pctInput.style.border = '1px solid #333a44';
    pctInput.style.borderRadius = '6px';
    pctInput.style.padding = '4px 6px';
    pctInput.style.fontSize = '12px';
    pctInput.style.textAlign = 'center';
    pctInput.addEventListener('input', () => {
      const v = Math.max(0, Math.min(100, +pctInput.value || 0));
      line.percent = v;
      savePropPresets();
      if (lum) rebuildAllDebounced();
    });

    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.min = 0.1;
    widthInput.max = 1;
    widthInput.step = 0.1;
    widthInput.value = line.width || 1.0;
    widthInput.title = 'Ширина (1 = вся, 0.5 = половина)';
    widthInput.style.background = '#232830';
    widthInput.style.color = '#8b93a1';
    widthInput.style.border = '1px solid #333a44';
    widthInput.style.borderRadius = '6px';
    widthInput.style.padding = '4px 6px';
    widthInput.style.fontSize = '12px';
    widthInput.style.textAlign = 'center';
    widthInput.addEventListener('input', () => {
      const v = Math.max(0.1, Math.min(1, +widthInput.value || 1));
      line.width = v;
      savePropPresets();
      if (lum) rebuildAllDebounced();
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'btn-small';
    delBtn.style.color = '#ff6060';
    delBtn.style.borderColor = '#ff6060';
    delBtn.style.padding = '2px 6px';
    delBtn.style.minWidth = '0';
    delBtn.style.height = '26px';
    delBtn.addEventListener('click', () => {
      preset.lines.splice(idx, 1);
      savePropPresets();
      renderPropLinesList();
      if (lum) rebuildAll();
    });

    row.appendChild(chk);
    row.appendChild(labelInput);
    row.appendChild(pctInput);
    row.appendChild(widthInput);
    row.appendChild(delBtn);
    propLinesList.appendChild(row);
  });
}

// ============================================================
//  События UI
// ============================================================

if (showPropLinesEl) {
  showPropLinesEl.addEventListener('change', () => {
    showPropLines = showPropLinesEl.checked;
    if (lum) rebuildAll();
  });
}

if (propPresetSelect) {
  propPresetSelect.addEventListener('change', () => {
    activePropPresetId = propPresetSelect.value;
    renderPropLinesList();
    if (lum) rebuildAll();
  });
}

if (propPresetAddBtn) {
  propPresetAddBtn.addEventListener('click', () => {
    const name = prompt('Название нового пресета:', 'Мой пресет');
    if (!name) return;
    const newId = 'preset-' + Date.now();
    const current = getActivePropPreset();
    propPresets.push({
      id: newId,
      name: name.trim() || 'Без названия',
      lines: current ? JSON.parse(JSON.stringify(current.lines)) : []
    });
    activePropPresetId = newId;
    savePropPresets();
    renderPropPresetSelect();
    renderPropLinesList();
    if (lum) rebuildAll();
  });
}

if (propPresetRenameBtn) {
  propPresetRenameBtn.addEventListener('click', () => {
    const preset = getActivePropPreset();
    if (!preset) return;
    const name = prompt('Новое название пресета:', preset.name);
    if (!name) return;
    preset.name = name.trim() || preset.name;
    savePropPresets();
    renderPropPresetSelect();
  });
}

if (propPresetDelBtn) {
  propPresetDelBtn.addEventListener('click', () => {
    if (propPresets.length <= 1) {
      alert('Нельзя удалить последний пресет.');
      return;
    }
    const preset = getActivePropPreset();
    if (!preset) return;
    if (!confirm(`Удалить пресет "${preset.name}"?`)) return;
    propPresets = propPresets.filter(p => p.id !== preset.id);
    activePropPresetId = propPresets[0].id;
    savePropPresets();
    renderPropPresetSelect();
    renderPropLinesList();
    if (lum) rebuildAll();
  });
}

if (addPropLineBtn) {
  addPropLineBtn.addEventListener('click', () => {
    const preset = getActivePropPreset();
    if (!preset) return;
    preset.lines.push({
      id: 'line-' + Date.now(),
      label: 'Новая линия',
      percent: 50,
      width: 1.0,
      enabled: true
    });
    savePropPresets();
    renderPropLinesList();
    if (lum) rebuildAll();
  });
}

// Кнопка генератора
if (genPresetBtn) {
  genPresetBtn.addEventListener('click', () => {
    const N = parseFloat(headCountGenInput.value);
    if (isNaN(N) || N < 2 || N > 12) {
      alert('Введите количество голов от 2 до 12');
      return;
    }
    const newPreset = generateFemalePreset(N);
    propPresets.push(newPreset);
    activePropPresetId = newPreset.id;
    savePropPresets();
    renderPropPresetSelect();
    renderPropLinesList();
    if (lum) rebuildAll();
  });
}

// ============================================================
//  Инициализация
// ============================================================
function initProportionsUI() {
  loadPropPresets();
  renderPropPresetSelect();
  renderPropLinesList();
  if (showPropLinesEl) showPropLinesEl.checked = showPropLines;
      }
