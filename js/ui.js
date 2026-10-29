// ============================================================
//  ui.js · обновление панелей и списков
// ============================================================

function updateInfo() {
  if (!lum) return;
  const N = imgWidth * imgHeight;
  const charCount = N - bgCount;

  if (infoSize) infoSize.textContent = `${imgWidth} × ${imgHeight}`;
  if (infoMode) infoMode.textContent = mode === 'lum' ? 'яркость' : mode === 'color' ? 'цвет' : 'регион';
  if (infoBgPct) infoBgPct.textContent = ((bgCount / N) * 100).toFixed(1) + '%';
  if (infoCharPct) infoCharPct.textContent = ((charCount / N) * 100).toFixed(1) + '%';
  if (infoPointsCount) infoPointsCount.textContent = `(${sourcePoints.length})`;

  if (charBBox) {
    if (infoBBox) infoBBox.textContent = `x:${charBBox.x} y:${charBBox.y} w:${charBBox.w} h:${charBBox.h}`;
    if (infoWH) infoWH.textContent = `${(charBBox.w / charBBox.h).toFixed(3)} (h/w=${(charBBox.h / charBBox.w).toFixed(3)})`;
    if (infoFill) infoFill.textContent = (charBBox.fillRatio * 100).toFixed(1) + '%';
  } else {
    if (infoBBox) infoBBox.textContent = '—';
    if (infoWH) infoWH.textContent = '—';
    if (infoFill) infoFill.textContent = '—';
  }

  renderPointList();
}

function renderPointList() {
  if (!pointList) return;
  if (sourcePoints.length === 0) {
    pointList.innerHTML = '<div class="empty-note">Точки не заданы.</div>';
    return;
  }
  pointList.innerHTML = '';
  sourcePoints.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'point-item' + (i === selectedPointIndex ? ' selected' : '');
    const left = document.createElement('div');
    left.className = 'left';
    const dc = (i === selectedPointIndex) ? '#ff5050' : '#ffcc00';
    left.innerHTML = `<span class="dot" style="background:${dc}"></span><span>#${i + 1}</span><span class="coords">x=${p.x}, y=${p.y}</span>`;
    left.addEventListener('click', () => {
      selectedPointIndex = i;
      drawOverlay();
      renderPointList();
    });
    const btn = document.createElement('button');
    btn.className = 'remove';
    btn.textContent = '✕';
    btn.addEventListener('click', (ev) => { ev.stopPropagation(); removePoint(i); });
    item.appendChild(left);
    item.appendChild(btn);
    pointList.appendChild(item);
  });
}

function renderSamplesList() {
  if (!samplesList) return;
  samplesList.innerHTML = '';
  if (colorSamples.length === 0) {
    samplesList.innerHTML = '<span class="sample-empty">Образцы не заданы.</span>';
    return;
  }
  // CHANGED: обратный цикл, чтобы splice не ломал индексы
  for (let i = colorSamples.length - 1; i >= 0; i--) {
    const s = colorSamples[i];
    const chip = document.createElement('div');
    chip.className = 'sample-chip';
    chip.innerHTML = `
      <span style="display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid #555;background:rgb(${s.r},${s.g},${s.b})"></span>
      <span>rgb(${s.r}, ${s.g}, ${s.b})</span>
      <button class="remove" title="Удалить">✕</button>`;
    chip.querySelector('.remove').addEventListener('click', () => {
      colorSamples.splice(i, 1);
      renderSamplesList();
      invalidateSeeds();
      if (lum) rebuildAll();
    });
    samplesList.appendChild(chip);
  }
}
