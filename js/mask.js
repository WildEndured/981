// ============================================================
//  mask.js · загрузка изображения, авто-порог, авто-семена,
//            пересчёт маски, fallback в главном потоке
// ============================================================

// ---------- Загрузка ----------
fileInput.addEventListener('change', e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  errBanner.classList.remove('visible');

  const img = new Image();
  img.onload = () => {
    try {
      imgWidth = img.naturalWidth;
      imgHeight = img.naturalHeight;

      [baseCanvas, overlay].forEach(c => { c.width = imgWidth; c.height = imgHeight; });
      baseCtx.clearRect(0, 0, imgWidth, imgHeight);
      baseCtx.drawImage(img, 0, 0);

      imgDataRef = baseCtx.getImageData(0, 0, imgWidth, imgHeight);
      computeLuminance(imgDataRef);
      computeHistogram();
      sourcePoints = [];
      selectedPointIndex = -1;
      colorSamples = [];
      charBBox = null;
      searchHorizLine = null;
      vertAxis = null;
      gridLines = [];
      propLines = [];
      findHeadStatus.textContent = '';
      invalidateSeeds();
      autoPickThreshold();
      renderSamplesList();

      requestAnimationFrame(() => {
        fitToView();
        rebuildAll();
      });
    } catch (err) {
      showError('Ошибка обработки: ' + (err.message || err));
    }
  };
  img.onerror = () => showError('Не удалось загрузить изображение');
  img.src = URL.createObjectURL(file);
});

function computeLuminance(data) {
  const d = data.data;
  const N = imgWidth * imgHeight;
  lum = new Float32Array(N);
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    if (d[p + 3] < 20) { lum[i] = 255; continue; }
    lum[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
  }
}

function computeHistogram() {
  histogram = new Uint32Array(256);
  const N = imgWidth * imgHeight;
  for (let i = 0; i < N; i++) {
    const v = Math.max(0, Math.min(255, Math.round(lum[i])));
    histogram[v]++;
  }
}

// ---------- Авто-порог ----------
function otsuThreshold(hist, N) {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, maxVar = 0, best = 0;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = N - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > maxVar) { maxVar = varBetween; best = t; }
  }
  return best;
}

function autoPickThreshold() {
  if (!histogram) return;
  const N = imgWidth * imgHeight;
  const t = otsuThreshold(histogram, N);
  bgLumEl.value = t;
  bgLumVal.textContent = t;
  invalidateSeeds();
}

// ---------- Авто-семена ----------
function isPixelBgMain(idx) {
  if (mode === 'lum' || mode === 'region') {
    const matched = lum[idx] >= +bgLumEl.value;
    return invertEl.checked ? !matched : matched;
  }
  if (colorSamples.length === 0) return invertEl.checked;
  const p = idx * 4;
  const d = imgDataRef.data;
  const r = d[p], g = d[p + 1], b = d[p + 2];
  const t = +bgDistEl.value;
  const t2 = t * t * 3;
  for (const s of colorSamples) {
    const dr = r - s.r, dg = g - s.g, db = b - s.b;
    if (dr * dr + dg * dg + db * db <= t2) return !invertEl.checked;
  }
  return invertEl.checked;
}

function findIsolatedBgSeeds(minSize = 30) {
  const w = imgWidth, h = imgHeight;
  const N = w * h;
  const visited = new Uint8Array(N);
  const seeds = [];
  const queue = new Int32Array(N);
  const region = [];

  for (let start = 0; start < N; start++) {
    if (visited[start]) continue;
    if (!isPixelBgMain(start)) { visited[start] = 1; continue; }

    let head = 0, tail = 0;
    queue[tail++] = start;
    visited[start] = 1;
    region.length = 0;
    let touchesBorder = false;

    while (head < tail) {
      const cur = queue[head++];
      region.push(cur);
      const cx = cur % w;
      const cy = (cur / w) | 0;
      if (cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1) touchesBorder = true;

      if (cx > 0)     { const n = cur - 1; if (!visited[n] && isPixelBgMain(n)) { visited[n] = 1; queue[tail++] = n; } }
      if (cx < w - 1) { const n = cur + 1; if (!visited[n] && isPixelBgMain(n)) { visited[n] = 1; queue[tail++] = n; } }
      if (cy > 0)     { const n = cur - w; if (!visited[n] && isPixelBgMain(n)) { visited[n] = 1; queue[tail++] = n; } }
      if (cy < h - 1) { const n = cur + w; if (!visited[n] && isPixelBgMain(n)) { visited[n] = 1; queue[tail++] = n; } }
    }

    if (!touchesBorder && region.length >= minSize) {
      const centerIdx = region[Math.floor(region.length / 2)];
      seeds.push({ x: centerIdx % w, y: (centerIdx / w) | 0 });
    }
  }
  return seeds;
}

function getAutoSeeds() {
  if (_seedsCache) return _seedsCache;
  _seedsCache = findIsolatedBgSeeds(30);
  return _seedsCache;
}

// ---------- Пересчёт ----------
function rebuildAll() {
  if (!lum || !imgDataRef) return;
  if (!worker) initWorker();
  if (workerBusy) { pendingBuild = true; return; }

  workerBusy = true;
  showProgress();

  let autoSeeds = [];
  if (sourcePoints.length === 0) autoSeeds = getAutoSeeds();

  const payload = {
    imageData: { data: new Uint8ClampedArray(imgDataRef.data), width: imgWidth, height: imgHeight },
    width: imgWidth, height: imgHeight,
    mode,
    thresholdLum: +bgLumEl.value,
    colorSamples: colorSamples.slice(),
    thresholdDist: +bgDistEl.value,
    invert: invertEl.checked,
    sourcePoints: sourcePoints.slice(),
    autoSeeds,
    useSmooth: useSmoothEl.checked,
    smoothIter: +smoothIterEl.value,
    morphOpen: +morphOpenEl.value,
    morphClose: +morphCloseEl.value,
    regionTolerance: +regionTolEl.value,
    horizShiftPercent, vertShiftPercent,
    gridStepPercent, gridAlign,
    propPresetHeadCount, propVisible: showPropLines
  };

  if (worker) {
    worker.postMessage({ type: 'buildMask', payload });
  } else {
    setTimeout(() => {
      try {
        const r = buildMaskMainThread(payload);
        isBg = r.mask;
        bgCount = r.bgCount;
        charBBox = r.bbox;
        searchHorizLine = r.searchHorizLine;
        vertAxis = r.vertAxis;
        gridLines = r.gridLines;
        gridInfo = r.gridInfo;
        propLines = r.propLines || [];
        drawOverlay();
        updateInfo();
      } catch (e) { showError('Fallback: ' + (e.message || e)); }
      finally {
        workerBusy = false;
        hideProgress();
        if (pendingBuild) { pendingBuild = false; rebuildAll(); }
      }
    }, 0);
  }
}

const rebuildAllDebounced = debounce(rebuildAll, 80);

// ---------- Fallback-расчёт ----------
function buildMaskMainThread(p) {
  const {
    imageData, width, height, mode, thresholdLum, colorSamples, thresholdDist,
    invert, sourcePoints, autoSeeds, useSmooth, smoothIter, morphOpen, morphClose,
    regionTolerance, horizShiftPercent, vertShiftPercent,
    gridStepPercent, gridAlign, propPresetHeadCount, propVisible
  } = p;

  const w = width, h = height, N = w * h;
  const data = imageData.data;

  const lml = new Float32Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    if (data[j + 3] < 20) { lml[i] = 255; continue; }
    lml[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }

  const dist2 = thresholdDist * thresholdDist * 3;
  const colorMode = (mode === 'color' && colorSamples && colorSamples.length > 0);

  function isPixelBg(idx) {
    let matched;
    if (mode === 'lum') matched = lml[idx] >= thresholdLum;
    else if (mode === 'color') {
      if (!colorMode) return invert;
      matched = false;
      const j = idx * 4;
      const r = data[j], g = data[j + 1], b = data[j + 2];
      for (let k = 0; k < colorSamples.length; k++) {
        const s = colorSamples[k];
        const dr = r - s.r, dg = g - s.g, db = b - s.b;
        if (dr * dr + dg * dg + db * db <= dist2) { matched = true; break; }
      }
    } else matched = lml[idx] >= thresholdLum;
    return invert ? !matched : matched;
  }

  const mask = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (mask[idx] || !isPixelBg(idx)) return;
    mask[idx] = 1;
    queue[tail++] = idx;
  };

  if (sourcePoints && sourcePoints.length > 0) for (const pt of sourcePoints) push(pt.x, pt.y);
  else if (autoSeeds && autoSeeds.length > 0) for (const pt of autoSeeds) push(pt.x, pt.y);
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w, y = (idx / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  if (morphOpen > 0) {
    for (let i = 0; i < morphOpen; i++) maskErode(mask, w, h);
    for (let i = 0; i < morphOpen; i++) maskDilate(mask, w, h);
  }
  if (morphClose > 0) {
    for (let i = 0; i < morphClose; i++) maskDilate(mask, w, h);
    for (let i = 0; i < morphClose; i++) maskErode(mask, w, h);
  }
  if (useSmooth) for (let i = 0; i < smoothIter; i++) maskSmooth(mask, w, h);

  let bgCount = 0;
  for (let i = 0; i < N; i++) if (mask[i]) bgCount++;

  const bbox = computeBBox(mask, w, h, 200);
  let searchHorizLine = null, vertAxis = null, gridLines = [], gridInfo = null, propLines = null;

  if (bbox) {
    const shiftVal = vertShiftPercent || 0;
    let axisX = Math.round(bbox.x + bbox.w * (0.5 + shiftVal / 100));
    axisX = Math.max(bbox.x, Math.min(bbox.x + bbox.w - 1, axisX));
    vertAxis = { x: axisX, xNorm: (axisX - bbox.x) / bbox.w, shiftPercent: shiftVal };

    const hs = horizShiftPercent || 0;
    const hy = Math.round(bbox.h * (0.5 + hs / 100));
    searchHorizLine = {
      y: bbox.y + Math.max(0, Math.min(bbox.h - 1, hy)),
      yNorm: 0.5 + hs / 100,
      shiftPercent: hs
    };

    const step = Math.max(1, Math.round(gridStepPercent || 13));
    const offset = (gridAlign === 'centered') ? step / 2 : 0;
    for (let i = 1; ; i++) {
      const pPct = i * step - offset;
      if (pPct >= 100) break;
      if (pPct <= 0.01) continue;
      gridLines.push({
        y: bbox.y + Math.round(bbox.h * pPct / 100),
        yNorm: pPct / 100,
        percent: pPct
      });
    }
    gridInfo = {
      stepPercent: step,
      headCount: 100 / step,
      headPx: Math.round((bbox.h / (100 / step)) * 10) / 10,
      lines: gridLines.length,
      align: gridAlign
    };

    if (propVisible) {
      propLines = buildProportionLinesLocal(bbox, propPresetHeadCount || 7.5);
    }
  }

  return { mask, bgCount, width: w, height: h, bbox, searchHorizLine, vertAxis, gridLines, gridInfo, propLines };
}

function buildProportionLinesLocal(bbox, headCount) {
  const N = (headCount && headCount > 0) ? headCount : 7.5;
  const h = bbox.h;
  const base = 7.5;
  const pubicHeads = 0.43 * base;
  const kneesHeads = 0.64 * base;
  const yOf = (fraction) => bbox.y + Math.round(h * fraction);

  return [
    { id: 'crown',    label: 'Макушка',    percent: 0,                                  y: yOf(0),                   enabled: propEnabled.crown },
    { id: 'chin',     label: 'Подбородок', percent: +(100 / N).toFixed(1),              y: yOf(1 / N),               enabled: propEnabled.chin },
    { id: 'shoulders',label: 'Плечи',      percent: +(1.2 * 100 / N).toFixed(1),        y: yOf(1.2 / N),             enabled: propEnabled.shoulders },
    { id: 'pubic',    label: 'Лобок',      percent: +(pubicHeads * 100 / N).toFixed(1), y: yOf(pubicHeads / N),      enabled: propEnabled.pubic },
    { id: 'knees',    label: 'Колени',     percent: +(kneesHeads * 100 / N).toFixed(1), y: yOf(kneesHeads / N),      enabled: propEnabled.knees }
  ];
}

function maskErode(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (!copy[i]) continue;
    if (!copy[i-1] || !copy[i+1] || !copy[i-w] || !copy[i+w]) mask[i] = 0;
  }
}
function maskDilate(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (copy[i]) continue;
    if (copy[i-1] || copy[i+1] || copy[i-w] || copy[i+w]) mask[i] = 1;
  }
}
function maskSmooth(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    let c = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      c += copy[i + dy * w + dx];
    }
    if (c >= 7) mask[i] = 1; else if (c <= 1) mask[i] = 0;
  }
}
function computeBBox(mask, w, h, minSize) {
  const N = w * h;
  const visited = new Uint8Array(N);
  const queue = new Int32Array(N);
  let best = null, bestSize = 0;
  for (let start = 0; start < N; start++) {
    if (visited[start] || mask[start] === 1) continue;
    let head = 0, tail = 0;
    queue[tail++] = start; visited[start] = 1;
    let minX = w, minY = h, maxX = -1, maxY = -1, size = 0;
    while (head < tail) {
      const cur = queue[head++];
      const cx = cur % w, cy = (cur / w) | 0;
      size++;
      if (cx < minX) minX = cx; if (cy < minY) minY = cy;
      if (cx > maxX) maxX = cx; if (cy > maxY) maxY = cy;
      if (cx > 0)     { const n = cur - 1; if (!visited[n] && mask[n] === 0) { visited[n] = 1; queue[tail++] = n; } }
      if (cx < w - 1) { const n = cur + 1; if (!visited[n] && mask[n] === 0) { visited[n] = 1; queue[tail++] = n; } }
      if (cy > 0)     { const n = cur - w; if (!visited[n] && mask[n] === 0) { visited[n] = 1; queue[tail++] = n; } }
      if (cy < h - 1) { const n = cur + w; if (!visited[n] && mask[n] === 0) { visited[n] = 1; queue[tail++] = n; } }
    }
    if (size >= minSize && size > bestSize) {
      bestSize = size;
      best = { minX, minY, maxX, maxY, size };
    }
  }
  if (!best) return null;
  return {
    x: best.minX, y: best.minY,
    w: best.maxX - best.minX + 1,
    h: best.maxY - best.minY + 1,
    area: best.size,
    fillRatio: best.size / ((best.maxX - best.minX + 1) * (best.maxY - best.minY + 1))
  };
}
