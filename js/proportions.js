// ============================================================
//  proportions.js · генератор сетки на X частей и пресеты
// ============================================================

const LS_KEY = 'bbox_prop_presets_v9'; // Откат к Шагу 1

function generateEmptyPreset(headCount) {
  const N = headCount || 5;
  const headPercent = 100 / N;
  const lines = [];

  lines.push({ id: 'crown', label: 'Макушка (0%)', percent: 0, width: 1.0, enabled: true });

  for (let i = 1; i <= N; i++) {
    lines.push({
      id: 'head-' + i,
      label: `Линия ${i} (${(i * headPercent).toFixed(1)}%)`,
      percent: i * headPercent,
      width: 1.0,
      enabled: true
    });
  }

  return {
    id: 'grid-' + N + '-' + Date.now(),
    name: `Сетка · ${N} частей`,
    headCount: N,
    lines: lines
  };
}

const DEFAULT_PRESETS = [generateEmptyPreset(5)];

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
    propPresets = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
  }
  if (!propPresets.find(p => p.id === activePropPresetId)) {
    activePropPresetId = propPresets.length ? propPresets[0].id : null;
  }
}

function savePropPresets() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(propPresets)); } catch (e) {}
}

function getActivePropPreset() {
  return propPresets.find(p => p.id === activePropPresetId) || propPresets[0] || null;
}

// DOM
const showPropLinesEl = document.getElementById('showPropLines');
const propPresetSelect = document.getElementById('propPresetSelect');
const propPresetAddBtn = document.getElementById('propPresetAddBtn');
const propPresetRenameBtn = document.getElementById('propPresetRenameBtn');
const propPresetDelBtn = document.getElementById('propPresetDelBtn');
const propLinesList = document.getElementById('propLinesList');
const addPropLineBtn = document.getElementById('addPropLineBtn');
const headCountGenInput = document.getElementById('headCountGen');
const genPresetBtn = document.getElementById('genPresetBtn');

// UI рендер
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
  if (!preset) return;

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
      line.enabled = chk.checked; savePropPresets();
      if (typeof lum !== 'undefined' && lum) rebuildAll();
    });

    const labelInput = document.createElement('input');
    labelInput.type = 'text'; labelInput.value = line.label;
    labelInput.style = 'background:#232830; color:#fff; border:1px solid #333a44; border-radius:6px; padding:4px 8px; font-size:12px; width:100%;';
    labelInput.addEventListener('input', () => {
      line.label = labelInput.value; savePropPresets();
      if (typeof lum !== 'undefined' && lum) rebuildAll();
    });

    const pctInput = document.createElement('input');
    pctInput.type = 'number'; pctInput.value = line.percent; pctInput.step = 0.1;
    pctInput.style = 'background:#232830; color:#fff; border:1px solid #333a44; border-radius:6px; padding:4px 6px; font-size:12px; text-align:center;';
    pctInput.addEventListener('input', () => {
      line.percent = Math.max(0, Math.min(100, +pctInput.value || 0));
      savePropPresets();
      if (typeof lum !== 'undefined' && lum) rebuildAllDebounced();
    });

    const widthInput = document.createElement('input');
    widthInput.type = 'number'; widthInput.value = line.width || 1.0; widthInput.step = 0.1;
    widthInput.style = 'background:#232830; color:#8b93a1; border:1px solid #333a44; border-radius:6px; padding:4px 6px; font-size:12px; text-align:center;';
    widthInput.addEventListener('input', () => {
      line.width = Math.max(0.1, Math.min(1, +widthInput.value || 1));
      savePropPresets();
      if (typeof lum !== 'undefined' && lum) rebuildAllDebounced();
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕'; delBtn.className = 'btn-small';
    delBtn.style = 'color:#ff6060; border-color:#ff6060; padding:2px 6px; min-width:0; height:26px;';
    delBtn.addEventListener('click', () => {
      preset.lines.splice(idx, 1); savePropPresets(); renderPropLinesList();
      if (typeof lum !== 'undefined' && lum) rebuildAll();
    });

    row.append(chk, labelInput, pctInput, widthInput, delBtn);
    propLinesList.appendChild(row);
  });
}

// Events
if (showPropLinesEl) {
  showPropLinesEl.addEventListener('change', () => {
    showPropLines = showPropLinesEl.checked;
    if (typeof lum !== 'undefined' && lum) rebuildAll();
  });
}

if (propPresetSelect) {
  propPresetSelect.addEventListener('change', () => {
    activePropPresetId = propPresetSelect.value;
    renderPropLinesList();
    if (typeof lum !== 'undefined' && lum) rebuildAll();
  });
}

if (propPresetAddBtn) {
  propPresetAddBtn.addEventListener('click', () => {
    const name = prompt('Название нового пресета:', 'Мой пресет');
    if (!name) return;
    const newId = 'preset-' + Date.now();
    const current = getActivePropPreset();
    propPresets.push({
      id: newId, name: name.trim() || 'Без названия',
      lines: current ? JSON.parse(JSON.stringify(current.lines)) : []
    });
    activePropPresetId = newId; savePropPresets();
    renderPropPresetSelect(); renderPropLinesList();
    if (typeof lum !== 'undefined' && lum) rebuildAll();
  });
}

if (propPresetRenameBtn) {
  propPresetRenameBtn.addEventListener('click', () => {
    const preset = getActivePropPreset(); if (!preset) return;
    const name = prompt('Новое название пресета:', preset.name); if (!name) return;
    preset.name = name.trim() || preset.name;
    savePropPresets(); renderPropPresetSelect();
  });
}

if (propPresetDelBtn) {
  propPresetDelBtn.addEventListener('click', () => {
    if (propPresets.length <= 1) return alert('Нельзя удалить последний пресет.');
    const preset = getActivePropPreset(); if (!preset) return;
    if (!confirm(`Удалить пресет "${preset.name}"?`)) return;
    propPresets = propPresets.filter(p => p.id !== preset.id);
    activePropPresetId = propPresets[0].id; savePropPresets();
    renderPropPresetSelect(); renderPropLinesList();
    if (typeof lum !== 'undefined' && lum) rebuildAll();
  });
}

if (addPropLineBtn) {
  addPropLineBtn.addEventListener('click', () => {
    const preset = getActivePropPreset(); if (!preset) return;
    preset.lines.push({ id: 'line-' + Date.now(), label: 'Новая линия', percent: 50, width: 1.0, enabled: true });
    savePropPresets(); renderPropLinesList();
    if (typeof lum !== 'undefined' && lum) rebuildAll();
  });
}

if (genPresetBtn) {
  genPresetBtn.addEventListener('click', () => {
    const N = parseFloat(headCountGenInput.value);
    if (isNaN(N) || N < 2 || N > 12) return alert('Введите количество частей от 2 до 12');
    const newPreset = generateEmptyPreset(N);
    propPresets.push(newPreset); activePropPresetId = newPreset.id;
    savePropPresets(); renderPropPresetSelect(); renderPropLinesList();
    if (typeof lum !== 'undefined' && lum) rebuildAll();
  });
}

function initProportionsUI() {
  loadPropPresets();
  renderPropPresetSelect();
  renderPropLinesList();
  if (showPropLinesEl) showPropLinesEl.checked = showPropLines;
}
