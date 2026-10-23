// ============================================================
//  proportions.js · логика и UI для редактирования линий и пресетов
// ============================================================

const LS_KEY = 'bbox_prop_presets_v1';

// Дефолтные пресеты, если в localStorage пусто
const DEFAULT_PRESETS = [
  {
    id: 'classic-7.5',
    name: '7.5 голов · классика',
    lines: [
      { id: 'crown', label: 'Макушка', percent: 0, enabled: true },
      { id: 'chin', label: 'Подбородок', percent: 13, enabled: true },
      { id: 'shoulders', label: 'Плечи', percent: 16, enabled: true },
      { id: 'pubic', label: 'Лобок', percent: 43, enabled: true },
      { id: 'knees', label: 'Колени', percent: 64, enabled: true }
    ]
  },
  {
    id: 'reality-7',
    name: '7 голов · реализм',
    lines: [
      { id: 'crown', label: 'Макушка', percent: 0, enabled: true },
      { id: 'chin', label: 'Подбородок', percent: 14, enabled: true },
      { id: 'shoulders', label: 'Плечи', percent: 17, enabled: true },
      { id: 'pubic', label: 'Лобок', percent: 46, enabled: true },
      { id: 'knees', label: 'Колени', percent: 68, enabled: true }
    ]
  },
  {
    id: 'anime-6',
    name: '6 голов · аниме',
    lines: [
      { id: 'crown', label: 'Макушка', percent: 0, enabled: true },
      { id: 'chin', label: 'Подбородок', percent: 16, enabled: true },
      { id: 'shoulders', label: 'Плечи', percent: 20, enabled: true },
      { id: 'pubic', label: 'Лобок', percent: 53, enabled: true },
      { id: 'knees', label: 'Колени', percent: 80, enabled: true }
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

  // Если активный пресет удалён — включаем первый
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
    row.className = 'prop-line-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = 'auto 1fr 70px auto auto';
    row.style.gap = '8px';
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
      if (lum) rebuildAll(); // на всякий случай пересчитаем подписи
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

    // Суффикс %
    const pctLabel = document.createElement('span');
    pctLabel.textContent = '%';
    pctLabel.style.fontSize = '12px';
    pctLabel.style.color = '#8b93a1';

    // Кнопка удалить
    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'btn-small';
    delBtn.style.color = '#ff6060';
    delBtn.style.borderColor = '#ff6060';
    delBtn.style.padding = '2px 8px';
    delBtn.style.minWidth = '0';
    delBtn.style.height = '28px';
    delBtn.title = 'Удалить линию';
    delBtn.addEventListener('click', () => {
      preset.lines.splice(idx, 1);
      savePropPresets();
      renderPropLinesList();
      if (lum) rebuildAll();
    });

    row.appendChild(chk);
    row.appendChild(labelInput);
    row.appendChild(pctInput);
    row.appendChild(pctLabel);
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
      enabled: true
    });
    savePropPresets();
    renderPropLinesList();
    if (lum) rebuildAll();
  });
}

// ============================================================
//  Вычисление Y-координат линий по активному пресету
// ============================================================

function computeActivePropLines(bbox) {
  if (!bbox) return [];
  const preset = getActivePropPreset();
  if (!preset) return [];

  return preset.lines.map(line => {
    const y = bbox.y + Math.round(bbox.h * (line.percent / 100));
    return {
      id: line.id,
      label: line.label,
      percent: line.percent,
      y,
      enabled: line.enabled !== false
    };
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
