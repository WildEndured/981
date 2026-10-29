// ============================================================
//  interactions.js · клики по canvas, режимы, экспорт
// ============================================================

function clientToImage(cx, cy) {
  const rect = stageEl.getBoundingClientRect();
  return {
    x: Math.floor((cx - rect.left) / zoom),
    y: Math.floor((cy - rect.top) / zoom)
  };
}

if (stageWrap) {
  stageWrap.addEventListener('click', (e) => {
    if (!lum) return;
    if (hadDrag) { hadDrag = false; return; }

    const { x, y } = clientToImage(e.clientX, e.clientY);
    if (x < 0 || y < 0 || x >= imgWidth || y >= imgHeight) return;

    if (bgColorMode) {
      const idx = y * imgWidth + x;
      const dp = idx * 4;
      const d = imgDataRef.data;
      colorSamples.push({ r: d[dp], g: d[dp + 1], b: d[dp + 2] });
      if (mode !== 'color') setMode('color');
      renderSamplesList();
      invalidateSeeds();
      bgColorMode = false;
      if (pickBgColorBtn) pickBgColorBtn.classList.remove('active');
      updateCursor();
      rebuildAll();
      return;
    }

    if (addPointMode) {
      sourcePoints.push({ x, y });
      selectedPointIndex = sourcePoints.length - 1;
      invalidateSeeds();
    } else {
      let hit = -1;
      const r = 15 / zoom;
      for (let i = sourcePoints.length - 1; i >= 0; i--) {
        const p = sourcePoints[i];
        const dx = p.x - x, dy = p.y - y;
        if (dx * dx + dy * dy < r * r) { hit = i; break; }
      }
      if (hit === -1) selectedPointIndex = -1;
      else if (hit === selectedPointIndex) {
        sourcePoints.splice(hit, 1);
        selectedPointIndex = -1;
        invalidateSeeds();
      } else selectedPointIndex = hit;
    }
    rebuildAll();
  });
}

function removePoint(index) {
  sourcePoints.splice(index, 1);
  if (selectedPointIndex === index) selectedPointIndex = -1;
  else if (selectedPointIndex > index) selectedPointIndex--;
  invalidateSeeds();
  rebuildAll();
}

function setMode(newMode) {
  mode = newMode;
  if (modeSeg) {
    modeSeg.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === newMode);
    });
  }
  if (lumSliderRow) lumSliderRow.style.display = (newMode === 'lum') ? '' : 'none';
  if (colorSliderRow) colorSliderRow.style.display = (newMode === 'color') ? '' : 'none';
  if (regionSliderRow) regionSliderRow.style.display = (newMode === 'region') ? '' : 'none';
  invalidateSeeds();
}

if (modeSeg) {
  modeSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    setMode(btn.dataset.mode);
    if (lum) rebuildAll();
  });
}

if (autoThresholdBtn) {
  autoThresholdBtn.addEventListener('click', () => {
    if (!histogram) return;
    autoPickThreshold();
    if (mode === 'lum' || mode === 'region') rebuildAll();
  });
}

if (addPointBtn) {
  addPointBtn.addEventListener('click', () => {
    addPointMode = !addPointMode;
    if (addPointMode) {
      bgColorMode = false;
      if (pickBgColorBtn) pickBgColorBtn.classList.remove('active');
    }
    addPointBtn.classList.toggle('active', addPointMode);
    updateCursor();
  });
}

if (pickBgColorBtn) {
  pickBgColorBtn.addEventListener('click', () => {
    bgColorMode = !bgColorMode;
    if (bgColorMode) {
      addPointMode = false;
      if (addPointBtn) addPointBtn.classList.remove('active');
    }
    pickBgColorBtn.classList.toggle('active', bgColorMode);
    updateCursor();
  });
}

if (clearPointsBtn) {
  clearPointsBtn.addEventListener('click', () => {
    sourcePoints.length = 0;
    selectedPointIndex = -1;
    invalidateSeeds();
    if (lum) rebuildAll();
  });
}

// ---------- Экспорт ----------
if (toggleImageBtn) {
  toggleImageBtn.addEventListener('click', () => {
    hideImage = !hideImage;
    stageEl.classList.toggle('hide-base', hideImage);
    toggleImageBtn.classList.toggle('active', hideImage);
    toggleImageBtn.textContent = hideImage ? '👁 Показать' : '👁 Маска';
  });
}

function downloadCanvasPNG(canvas, filename) {
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}

if (exportMaskBtn) {
  exportMaskBtn.addEventListener('click', () => {
    if (!isBg) return;
    const w = imgWidth, h = imgHeight;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const out = ctx.createImageData(w, h);
    const d = out.data;
    for (let i = 0, j = 0; i < w * h; i++, j += 4) {
      const v = isBg[i] ? 0 : 255;
      d[j] = v; d[j+1] = v; d[j+2] = v; d[j+3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    downloadCanvasPNG(c, 'mask.png');
  });
}

if (exportCutBtn) {
  exportCutBtn.addEventListener('click', () => {
    if (!isBg || !imgDataRef) return;
    const w = imgWidth, h = imgHeight;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const out = ctx.createImageData(w, h);
    const src = imgDataRef.data;
    const d = out.data;
    for (let i = 0, j = 0; i < w * h; i++, j += 4) {
      d[j] = src[j]; d[j+1] = src[j+1]; d[j+2] = src[j+2];
      d[j+3] = isBg[i] ? 0 : src[j+3];
    }
    ctx.putImageData(out, 0, 0);
    downloadCanvasPNG(c, 'cutout.png');
  });
}

// ---------- Слушатели маски ----------
if (bgLumEl) {
  bgLumEl.addEventListener('input', () => {
    if (bgLumVal) bgLumVal.textContent = bgLumEl.value;
    invalidateSeeds();
    if (mode === 'lum' || mode === 'region') rebuildAllDebounced();
  });
}
if (bgDistEl) {
  bgDistEl.addEventListener('input', () => {
    if (bgDistVal) bgDistVal.textContent = bgDistEl.value;
    invalidateSeeds();
    if (mode === 'color') rebuildAllDebounced();
  });
}
if (regionTolEl) {
  regionTolEl.addEventListener('input', () => {
    if (regionTolVal) regionTolVal.textContent = regionTolEl.value;
    if (mode === 'region') rebuildAllDebounced();
  });
}
if (invertEl) {
  invertEl.addEventListener('change', () => { invalidateSeeds(); if (lum) rebuildAll(); });
}
if (useSmoothEl) {
  useSmoothEl.addEventListener('change', () => {
    if (smoothIterEl) smoothIterEl.disabled = !useSmoothEl.checked;
    if (lum) rebuildAll();
  });
}
if (smoothIterEl) {
  smoothIterEl.addEventListener('input', () => {
    if (smoothIterVal) smoothIterVal.textContent = smoothIterEl.value;
    if (lum && useSmoothEl.checked) rebuildAllDebounced();
  });
}
if (morphOpenEl) {
  morphOpenEl.addEventListener('input', () => {
    if (morphOpenVal) morphOpenVal.textContent = morphOpenEl.value;
    if (lum) rebuildAllDebounced();
  });
}
if (morphCloseEl) {
  morphCloseEl.addEventListener('input', () => {
    if (morphCloseVal) morphCloseVal.textContent = morphCloseEl.value;
    if (lum) rebuildAllDebounced();
  });
}
