// ============================================================
//  grid.js · сетка (шаг %), пресеты, поиск головы,
//            анатомические линии пропорций, поисковые линии
// ============================================================

function updatePresetActive() {
  presetsRow.querySelectorAll('.preset').forEach(btn => {
    const heads = +btn.dataset.heads;
    btn.classList.toggle('active', Math.abs(heads - activePresetHeads) < 0.01);
  });
}

function updateGridSummary() {
  if (!gridInfo) return;
  const al = gridAlign === 'centered' ? 'по центру головы' : 'от макушки';
  gridSummary.textContent = `${gridInfo.stepPercent}% · ${gridInfo.headCount.toFixed(2)} голов · ${gridInfo.lines} линий · ${al}`;
}

function applyGridStep(step, opts = {}) {
  if (!opts.fromPreset) activePresetHeads = null;

  const rounded = Math.max(1, Math.min(50, Math.round(step)));
  gridStepPercent = rounded;

  gridStepEl.value = String(rounded);
  gridStepVal.textContent = rounded + '%';

  const heads = 100 / rounded;
  if (heads >= 2 && heads <= 20) headCountEl.value = heads.toFixed(2);
  headCountVal.textContent = heads.toFixed(2);

  updatePresetActive();
  if (lum && opts.rebuild !== false) rebuildAll();
}

gridStepEl.addEventListener('input', () => {
  applyGridStep(+gridStepEl.value, { rebuild: false });
  if (lum) rebuildAllDebounced();
});

presetsRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.preset');
  if (!btn) return;
  const heads = +btn.dataset.heads;
  activePresetHeads = heads;
  applyGridStep(100 / heads, { fromPreset: true });
});

headCountEl.addEventListener('input', () => {
  const h = +headCountEl.value;
  if (h > 0) applyGridStep(100 / h, { rebuild: false });
  if (lum) rebuildAllDebounced();
});

gridResetBtn.addEventListener('click', () => {
  activePresetHeads = 7.5;
  applyGridStep(13, { fromPreset: true });
});

gridAlignRadios.forEach(r => {
  r.addEventListener('change', () => {
    gridAlign = r.value;
    updateGridSummary();
    if (lum) rebuildAll();
  });
});

// ---------- Поиск головы ----------
findHeadBtn.addEventListener('click', () => {
  if (!lum) { findHeadStatus.textContent = 'Сначала изображение'; findHeadStatus.style.color = '#ff9090'; return; }
  if (!charBBox) { findHeadStatus.textContent = 'Нет bbox'; findHeadStatus.style.color = '#ff9090'; return; }

  findHeadStatus.textContent = 'Поиск…';
  findHeadStatus.style.color = '';

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
      findHeadStatus.textContent = `✓ ${res.headCount.toFixed(2)} голов → шаг ${Math.round(100 / res.headCount)}%`;
      findHeadStatus.style.color = '#7bd88f';
    } else {
      findHeadStatus.textContent = '✗ ' + (res.reason || 'нет шеи');
      findHeadStatus.style.color = '#ff9090';
    }
  }
});

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

showGridEl.addEventListener('change', () => { showGrid = showGridEl.checked; drawOverlay(); });

// ---------- Анатомические линии ----------
showPropLinesEl.addEventListener('change', () => {
  showPropLines = showPropLinesEl.checked;
  if (lum) rebuildAll();
});

propPresetsRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.preset');
  if (!btn) return;
  propPresetHeadCount = +btn.dataset.prop;
  propPresetsRow.querySelectorAll('.preset').forEach(b =>
    b.classList.toggle('active', b === btn));
  if (lum) rebuildAll();
});

propResetBtn.addEventListener('click', () => {
  propPresetHeadCount = 7.5;
  propPresetsRow.querySelectorAll('.preset').forEach(b =>
    b.classList.toggle('active', Math.abs(+b.dataset.prop - 7.5) < 0.01));
  if (lum) rebuildAll();
});

['crown', 'chin', 'shoulders', 'pubic', 'knees'].forEach(id => {
  const el = $(`prop${id.charAt(0).toUpperCase() + id.slice(1)}`);
  if (!el) return;
  el.addEventListener('change', () => {
    propEnabled[id] = el.checked;
    drawOverlay();
  });
});

// ---------- Поисковые линии ----------
horizShiftEl.addEventListener('input', () => {
  horizShiftPercent = +horizShiftEl.value;
  horizShiftVal.textContent = horizShiftPercent + '%';
  if (lum) rebuildAllDebounced();
});
vertShiftEl.addEventListener('input', () => {
  vertShiftPercent = +vertShiftEl.value;
  vertShiftVal.textContent = vertShiftPercent + '%';
  if (lum) rebuildAllDebounced();
});
showHorizEl.addEventListener('change', () => { showHoriz = showHorizEl.checked; drawOverlay(); });
showVertEl.addEventListener('change', () => { showVert = showVertEl.checked; drawOverlay(); });

searchLinesResetBtn.addEventListener('click', () => {
  horizShiftPercent = 0; horizShiftEl.value = 0; horizShiftVal.textContent = '0%';
  vertShiftPercent = 0; vertShiftEl.value = 0; vertShiftVal.textContent = '0%';
  if (lum) rebuildAll();
});
