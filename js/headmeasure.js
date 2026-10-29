// ============================================================
//  headmeasure.js · гибридное определение роста в головах
// ============================================================

// --- Профиль ширины/площади по строкам ---
function buildRowProfile(mask, w, h, bbox) {
  const rows = [];
  const y0 = bbox.y, y1 = bbox.y + bbox.h;
  for (let y = y0; y < y1; y++) {
    let minX = w, maxX = -1, count = 0;
    const base = y * w;
    for (let x = bbox.x; x < bbox.x + bbox.w; x++) {
      if (mask[base + x] === 0) { // не-фон = персонаж
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    rows.push({
      y,
      width: maxX >= 0 ? maxX - minX + 1 : 0,
      area: count
    });
  }
  return rows;
}

// --- Поиск шеи: локальный минимум ширины выше плеч ---
function findNeckY(rows) {
  if (rows.length < 10) return null;

  const w = rows.map(r => r.width);
  const sm = [];
  const k = 2;
  for (let i = 0; i < w.length; i++) {
    let s = 0, n = 0;
    for (let d = -k; d <= k; d++) {
      const j = i + d;
      if (j >= 0 && j < w.length) { s += w[j]; n++; }
    }
    sm.push(s / n);
  }

  let shouldersIdx = 0, maxW = 0;
  const from = Math.floor(sm.length * 0.15);
  for (let i = from; i < sm.length; i++) {
    if (sm[i] > maxW) { maxW = sm[i]; shouldersIdx = i; }
  }
  if (maxW < 5) return null;

  const topLimit = Math.max(1, Math.floor(shouldersIdx * 0.3));
  let neckIdx = -1, minW = Infinity;
  for (let i = topLimit; i < shouldersIdx - 1; i++) {
    if (sm[i] < sm[i - 1] && sm[i] < sm[i + 1] && sm[i] < minW) {
      minW = sm[i];
      neckIdx = i;
    }
  }

  if (neckIdx < 0 || minW > maxW * 0.75) return null;
  return rows[neckIdx].y;
}

// --- Основная эвристика ---
function estimateHeadCount(mask, bbox, w, h) {
  if (!bbox || bbox.h < 10) return null;
  const rows = buildRowProfile(mask, w, h, bbox);
  const neckY = findNeckY(rows);
  if (neckY == null) return null;

  const headHeight = neckY - bbox.y;
  if (headHeight < 5) return null;

  const N = bbox.h / headHeight;
  if (N < 2 || N > 12) return null;

  return {
    N: Math.round(N * 10) / 10,
    headHeight,
    neckY,
    confidence: 'medium'
  };
}

// --- Замер по 2 точкам ---
function headCountFromPoints(crown, chin) {
  if (!charBBox) return null;
  const dy = chin.y - crown.y;
  if (dy <= 0) return null;
  const N = charBBox.h / dy;
  if (N < 2 || N > 12) return null;
  return { N: Math.round(N * 10) / 10, headHeight: dy };
}

// --- Применить N: пересобрать сетку ---
function applyHeadCount(N, source) {
  const newPreset = generateEmptyPreset(N);
  newPreset.name = `Сетка · ${N} голов (${source})`;
  propPresets.push(newPreset);
  activePropPresetId = newPreset.id;
  savePropPresets();
  renderPropPresetSelect();
  renderPropLinesList();
  if (typeof lum !== 'undefined' && lum) rebuildAll();
  return newPreset;
}

// --- Инициализация кнопок ---
(function initHeadMeasureUI() {
  const autoHeadBtn = document.getElementById('autoHeadBtn');
  const measureHeadBtn = document.getElementById('measureHeadBtn');
  const headCountGenInput = document.getElementById('headCountGen');

  if (autoHeadBtn) {
    autoHeadBtn.addEventListener('click', () => {
      if (!isBg || !charBBox) {
        showError('Сначала загрузите изображение и дождитесь маски');
        return;
      }
      const r = estimateHeadCount(isBg, charBBox, imgWidth, imgHeight);
      if (!r) {
        showError('Не удалось оценить голову. Используйте «🎯 Замер головы».');
        return;
      }
      applyHeadCount(r.N, 'авто');
      if (headCountGenInput) headCountGenInput.value = r.N;
    });
  }

  if (measureHeadBtn) {
    measureHeadBtn.addEventListener('click', () => {
      measureHeadMode = !measureHeadMode;
      measureCrown = null;
      measureChin = null;
      if (measureHeadMode) {
        addPointMode = false;
        bgColorMode = false;
        if (addPointBtn) addPointBtn.classList.remove('active');
        if (pickBgColorBtn) pickBgColorBtn.classList.remove('active');
      }
      measureHeadBtn.classList.toggle('active', measureHeadMode);
      updateCursor();
      drawOverlay();
    });
  }
})();
