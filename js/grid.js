// ============================================================
//  grid.js · сетка (шаг %), пресеты, поиск головы,
//            поисковые линии (гориз/верт)
// ============================================================

function updatePresetActive() {
  if (!presetsRow) return;
  presetsRow.querySelectorAll('.preset').forEach(btn => {
    const heads = +btn.dataset.heads;
    btn.classList.toggle('active', Math.abs(heads - activePresetHeads) < 0.01);
  });
}

function updateGridSummary() {
  if (!gridInfo || !gridSummary) return;
  const al = gridAlign === 'centered' ? 'по центру головы' : 'от макушки';
  gridSummary.textContent = `${gridInfo.stepPercent}% · ${gridInfo.headCount.toFixed(2)} голов · ${gridInfo.lines} линий · ${al}`;
}

function applyGridStep(step, opts = {}) {
  if (!opts.fromPreset) activePresetHeads = null;

  const rounded = Math.max(1, Math.min(50, Math.round(step)));
  gridStepPercent = rounded;

  if (gridStepEl) gridStepEl.value = String(rounded);
  if (gridStepVal) gridStepVal.textContent = rounded + '%';

  const heads = 100 / rounded;
  if (headCountEl && heads >= 2 && heads <= 20) headCountEl.value = heads.toFixed(2);
  if (headCountVal) headCountVal.textContent = heads.toFixed(2);

  updatePresetActive();
  if (lum && opts.rebuild !== false) rebuildAll();
}

if (gridStepEl) {
  gridStepEl.addEventListener('input', () => {
    applyGridStep(+gridStepEl.value, { rebuild: false });
    if (lum) rebuildAllDebounced();
  });
}

if (presetsRow) {
  presetsRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset');
    if (!btn) return;
    const heads = +btn.dataset.heads;
    activePresetHeads = heads;
    applyGridStep(100 / heads, { fromPreset: true });
  });
}

if (headCountEl) {
  headCountEl.addEventListener('input', () => {
    const h = +headCountEl.value;
    if (h > 0) applyGridStep(100 / h, { rebuild: false });
    if (lum) rebuildAllDebounced();
  });
}

if (gridResetBtn) {
  gridResetBtn.addEventListener('click', () => {
    activePresetHeads = 7.5;
    applyGridStep(13, { fromPreset: true });
  });
}

if (gridAlignRadios && gridAlignRadios.length) {
  gridAlignRadios.forEach(r => {
    r.addEventListener('change', () => {
      gridAlign = r.value;
      updateGridSummary();
      if (lum) rebuildAll();
    });
  });
}

// ---------- Поиск головы ----------
if (findHeadBtn) {
  findHeadBtn.addEventListener('click', () => {
    if (!lum) { if (findHeadStatus) { findHeadStatus.textContent = 'Сначала изображение'; findHeadStatus.style.color = '#ff9090'; } return; }
    if (!charBBox) { if (findHeadStatus) { findHeadStatus.textContent = 'Нет bbox'; findHeadStatus.style.color = '#ff9090'; } return; }

    if (findHeadStatus) { findHeadStatus.textContent = 'Поиск…'; findHeadStatus.style.color = ''; }

    if (!worker) initWorker();
    if (worker) {
      worker.postMessage({
        type: 'findHead',
        payload: { width: imgWidth, height: imgHeight, mask: isBg ? new Uint8Array(isBg) : null, bbox: charBBox }
      });
    } else {
      const res = findHeadLocal(isBg, imgWidth, imgHeight, charBBox);
      if (res.ok) {
        activePresetHeads = res.headCount;
        applyGridStep(100 / res.headCount, { fromPreset: true });
        if (findHeadStatus) {
          findHeadStatus.textContent = `✓ ${res.headCount.toFixed(2)} голов → шаг ${Math.round(100 / res.headCount)}%`;
          findHeadStatus.style.color = '#7bd88f';
        }
      } else {
        if (findHeadStatus) {
          findHeadStatus.textContent = '✗ ' + (res.reason || 'нет шеи');
          findHeadStatus.style.color = '#ff9090';
        }
      }
    }
  });
}

function findHeadLocal(mask, w, h, bbox) {
  if (!mask || !bbox) return { ok: false, reason: 'нет маски' };
  const bx = bbox.x, by = bbox.y, bw = bbox.w, bh = bbox.h;
  const maxY = Math.min(bh - 1, Math.floor(bh * 0.5));
  const profile = new Float32Array(maxY + 1);
  for (let yy = 0; yy <= maxY; yy++) {
    let c = 0;
    const rowY = by + yy;
    for (let xx = 0; xx < bw; xx++) if (mask[rowY * w + (bx + xx)] === 0) c++;
    profile[yy] = c;
  }
  const sm = new Float32Array(profile.length);
  const k = 3;
  for (let i = 0; i < profile.length; i++) {
    let s = 0, n = 0;
    for (let d = -k; d <= k; d++) {
      const j = i + d;
      if (j < 0 || j >= profile.length) continue;
      s += profile[j]; n++;
    }
    sm[i] = s / n;
  }
  const lo = Math.floor(bh * 0.15), hi = Math.min(sm.length - 1, Math.floor(bh * 0.45));
  let maxW = 0;
  for (let i = 0; i <= hi; i++) if (sm[i] > maxW) maxW = sm[i];
  if (maxW < 1) return { ok: false, reason: 'пусто' };
  let bestY = -1, bestVal = Infinity;
  for (let i = lo; i <= hi; i++) if (sm[i] < bestVal) { bestVal = sm[i]; bestY = i; }
  if (bestY < 0 || bestVal > 0.7 * maxW) return { ok: false, reason: 'нет сужения' };
  const headH = bestY;
  if (headH < bh * 0.08) return { ok: false, reason: 'мала' };
  const N = bh / headH;
  if (N < 2.5 || N > 10) return { ok: false, reason: 'N=' + N.toFixed(1) };
  return { ok: true, headCount: Math.round(N * 100) / 100, headPx: Math.round(headH) };
}

if (showGridEl) {
  showGridEl.addEventListener('change', () => { showGrid = showGridEl.checked; drawOverlay(); });
}

// ---------- Поисковые линии ----------
if (horizShiftEl) {
  horizShiftEl.addEventListener('input', () => {
    horizShiftPercent = +horizShiftEl.value;
    if (horizShiftVal) horizShiftVal.textContent = horizShiftPercent + '%';
    if (lum) rebuildAllDebounced();
  });
}
if (vertShiftEl) {
  vertShiftEl.addEventListener('input', () => {
    vertShiftPercent = +vertShiftEl.value;
    if (vertShiftVal) vertShiftVal.textContent = vertShiftPercent + '%';
    if (lum) rebuildAllDebounced();
  });
}
if (showHorizEl) {
  showHorizEl.addEventListener('change', () => { showHoriz = showHorizEl.checked; drawOverlay(); });
}
if (showVertEl) {
  showVertEl.addEventListener('change', () => { showVert = showVertEl.checked; drawOverlay(); });
}

if (searchLinesResetBtn) {
  searchLinesResetBtn.addEventListener('click', () => {
    horizShiftPercent = 0;
    if (horizShiftEl) horizShiftEl.value = 0;
    if (horizShiftVal) horizShiftVal.textContent = '0%';
    vertShiftPercent = 0;
    if (vertShiftEl) vertShiftEl.value = 0;
    if (vertShiftVal) vertShiftVal.textContent = '0%';
    if (lum) rebuildAll();
  });
}
