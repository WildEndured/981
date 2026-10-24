// ============================================================
//  proportions.js · логика и UI для редактирования линий и пресетов
// ============================================================

const LS_KEY = 'bbox_prop_presets_v2'; // v2 из-за нового формата

// Дефолтные пресеты
const DEFAULT_PRESETS = [
  {
    id: 'female-5',
    name: 'Женская фигура · 5 голов',
    lines: [
      { id: 'crown', label: 'Макушка (0%)', percent: 0, enabled: true, width: 1.0, color: '#ff7ad9' },
      { id: 'head-top', label: 'Верх черепа (3/5 головы)', percent: 12, enabled: true, width: 1.0, color: '#ff7ad9' },
      { id: 'eyes', label: 'Линия глаз (центр головы)', percent: 10, enabled: true, width: 0.3, color: '#ff7ad9' },
      { id: 'chin', label: 'Подбородок (низ головы)', percent: 20, enabled: true, width: 1.0, color: '#ff7ad9' },
      { id: 'neck', label: 'Основание шеи', percent: 24, enabled: true, width: 0.5, color: '#50b4ff' },
      { id: 'chest', label: 'Грудная клетка (низ)', percent: 40, enabled: true, width: 1.0, color: '#50b4ff' },
      { id: 'nipples', label: 'Соски', percent: 36, enabled: true, width: 0.6, color: '#50b4ff' },
      { id: 'waist', label: 'Талия (U-форма)', percent: 50, enabled: true, width: 0.8, color: '#50b4ff' },
      { id: 'pubic', label: 'Лобок / Низ таза', percent: 60, enabled: true, width: 1.0, color: '#50b4ff' },
      { id: 'knees', label: 'Колени (середина)', percent: 75, enabled: true, width: 1.0, color: '#c080ff' },
      { id: 'feet', label: 'Стопы', percent: 100, enabled: true, width: 1.0, color: '#c080ff' }
    ]
  },
  {
    id: 'classic-7.5',
    name: '7.5 голов · классика',
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
//  DOM элементы (панель пропорций)
// ============================================================
const propSection = document.getElementById('propSection');
const showPropLinesEl = document.getElementById('showPropLines');
const propPresetSelect = document.getElementById('propPresetSelect');
const propPresetAddBtn = document.getElementById('propPresetAddBtn');
const propPresetRenameBtn = document.getElementById('propPresetRenameBtn');
const propPresetDelBtn = document.getElementById('propPresetDelBtn');
const propLinesList = document.getElementById('propLinesList');
const addPropLineBtn = document.getElementById('addPropLineBtn');

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

    // Checkbox
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = line.enabled !== false;
    chk.addEventListener('change', () => {
      line.enabled = chk.checked;
      savePropPresets();
      if (lum) rebuildAll();
    });

    // Label
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

    // Percent
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

    // Ширина (новая фича)
    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.min = 0.1;
    widthInput.max = 1;
    widthInput.step = 0.1;
    widthInput.value = line.width || 1.0;
    widthInput.title = 'Ширина линии (1 = вся, 0.5 = половина)';
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

    // Кнопка удалить
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

// ============================================================
//  Инициализация
// ============================================================
function initProportionsUI() {
  loadPropPresets();
  renderPropPresetSelect();
  renderPropLinesList();
  if (showPropLinesEl) showPropLinesEl.checked = showPropLines;
}
