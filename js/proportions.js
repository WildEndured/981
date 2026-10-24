// ============================================================
//  proportions.js · логика, UI и генератор пресетов пропорций
// ============================================================

const LS_KEY = 'bbox_prop_presets_v8';

function generateEmptyPreset(headCount) {
  const N = headCount || 5;
  const headPct = 100 / N; // Размер 1 головы в %
  const partPct = headPct / 5; // Размер 1/5 головы в %

  const lines = [
    { id: 'crown', label: 'Макушка (0%)', percent: 0, width: 1.0, enabled: true }
  ];

  // Шаг 2: Делим первую голову на 5 частей
  for (let i = 1; i <= 5; i++) {
    const p = partPct * i;
    let label = '';
    let isCircle = false;

    if (i === 3) {
      label = 'Низ черепа (3/5)';
      isCircle = true; // Метка для отрисовки круга
    } else if (i === 4) {
      label = 'Челюсть (4/5)';
    } else if (i === 5) {
      label = 'Шея (5/5)';
    } else {
      label = `Голова ${i}/5`;
    }

    lines.push({
      id: 'head-part-' + i,
      label: label,
      percent: p,
      width: 1.0,
      enabled: true,
      isCircle: isCircle
    });
  }

  // Добавляем линии для остальных голов (просто деления)
  for (let i = 2; i <= N; i++) {
    lines.push({
      id: 'head-' + i,
      label: `Голова ${i} (${(i * headPct).toFixed(1)}%)`,
      percent: i * headPct,
      width: 1.0,
      enabled: true
    });
  }

  return {
    id: 'grid-' + N + '-' + Date.now(),
    name: `Сетка · ${N} голов`,
    lines: lines
  };
}

const DEFAULT_PRESETS = [ generateEmptyPreset(5) ];

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
      if (typeof lum !== 'undefined' && lum) rebuildAll();
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
      if (typeof lum !== 'undefined' && lum) rebuildAll();
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
      if (typeof lum !== 'undefined' && lum) rebuildAllDebounced();
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
      if (typeof lum !== 'undefined' && lum) rebuildAllDebounced();
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
      if (typeof lum !== 'undefined' && lum) rebuildAll();
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
      id: newId,
      name: name.trim() || 'Без названия',
      lines: current ? JSON.parse(JSON.stringify(current.lines)) : []
    });
    activePropPresetId = newId;
    savePropPresets();
    renderPropPresetSelect();
    renderPropLinesList();
    if (typeof lum !== 'undefined' && lum) rebuildAll();
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
    if (typeof lum !== 'undefined' && lum) rebuildAll();
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
    if (typeof lum !== 'undefined' && lum) rebuildAll();
  });
}

if (genPresetBtn) {
  genPresetBtn.addEventListener('click', () => {
    const N = parseFloat(headCountGenInput.value);
    if (isNaN(N) || N < 2 || N > 12) {
      alert('Введите количество голов от 2 до 12');
      return;
    }
    const newPreset = generateEmptyPreset(N);
    propPresets.push(newPreset);
    activePropPresetId = newPreset.id;
    savePropPresets();
    renderPropPresetSelect();
    renderPropLinesList();
    if (typeof lum !== 'undefined' && lum) rebuildAll();
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
