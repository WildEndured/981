// ============================================================
//  Маска фона · BBox · Сетка пропорций
//  Главная логика. Разбит на секции:
//   1. DOM
//   2. Состояние
//   3. Стиль
//   4. Утилиты
//   5. Worker + fallback
//   6. Загрузка изображения
//   7. Авто-семена
//   8. Fallback-расчёт маски (копия worker.js)
//   9. Пересчёт маски
//  10. Отрисовка оверлея
//  11. UI (info, списки)
//  12. Zoom / Pan
//  13. Клик по canvas
//  14. Режимы, курсор
//  15. Слайдеры сетки/линий
//  16. Экспорт
//  17. Init
// ============================================================

// ============================================================
//  0. ГЛОБАЛЬНЫЙ ПЕРЕХВАТ ОШИБОК
// ============================================================
const errBanner = document.getElementById('errBanner');
function showError(msg) {
  console.error('[main]', msg);
  errBanner.textContent = '⚠ ' + msg;
  errBanner.classList.add('visible');
}
window.addEventListener('error', (e) => {
  showError('JS error: ' + (e.message || e.error));
});

// ============================================================
//  1. DOM
// ============================================================
const $ = (id) => document.getElementById(id);

const fileInput = $('file');
const baseCanvas = $('base');
const overlay = $('overlay');
const stageEl = $('stage');
const stageWrap = $('stageWrap');
const progressOverlay = $('progressOverlay');

const bgLumEl = $('bgLum');
const bgLumVal = $('bgLumVal');
const bgDistEl = $('bgDist');
const bgDistVal = $('bgDistVal');
const regionTolEl = $('regionTol');
const regionTolVal = $('regionTolVal');
const invertEl = $('invert');
const useSmoothEl = $('useSmooth');
const smoothIterEl = $('smoothIter');
const smoothIterVal = $('smoothIterVal');
const morphOpenEl = $('morphOpen');
const morphOpenVal = $('morphOpenVal');
const morphCloseEl = $('morphClose');
const morphCloseVal = $('morphCloseVal');

const horizShiftEl = $('horizShift');
const horizShiftVal = $('horizShiftVal');
const vertShiftEl = $('vertShift');
const vertShiftVal = $('vertShiftVal');
const showHorizEl = $('showHoriz');
const showVertEl = $('showVert');
const searchLinesResetBtn = $('searchLinesResetBtn');

const gridStepEl = $('gridStep');
const gridStepVal = $('gridStepVal');
const showGridEl = $('showGrid');
const gridResetBtn = $('gridResetBtn');

const autoThresholdBtn = $('autoThresholdBtn');
const pickBgColorBtn = $('pickBgColorBtn');
const addPointBtn = $('addPointBtn');
const clearPointsBtn = $('clearPointsBtn');
const toggleImageBtn = $('toggleImageBtn');
const exportMaskBtn = $('exportMaskBtn');
const exportCutBtn = $('exportCutBtn');

const lumSliderRow = $('lumSliderRow');
const colorSliderRow = $('colorSliderRow');
const regionSliderRow = $('regionSliderRow');
const modeSeg = $('modeSeg');

const infoSize = $('infoSize');
const infoMode = $('infoMode');
const infoZoom = $('infoZoom');
const infoBgPct = $('infoBgPct');
const infoCharPct = $('infoCharPct');
const infoBBox = $('infoBBox');
const infoWH = $('infoWH');
const infoFill = $('infoFill');
const infoHoriz = $('infoHoriz');
const infoVert = $('infoVert');
const infoGrid = $('infoGrid');
const infoPointsCount = $('infoPointsCount');
const pointList = $('pointList');
const samplesList = $('samplesList');

const zoomInBtn = $('zoomInBtn');
const zoomOutBtn = $('zoomOutBtn');
const zoomFitBtn = $('zoomFitBtn');
const zoomResetBtn = $('zoomResetBtn');

const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
const overlayCtx = overlay.getContext('2d');

// ============================================================
//  2. СОСТОЯНИЕ
// ============================================================
let imgWidth = 0, imgHeight = 0;
let lum = null, isBg = null, imgDataRef = null, histogram = null;
let selectedPointIndex = -1;
let mode = 'lum';
let colorSamples = [];
let bgColorMode = false, addPointMode = false;
let sourcePoints = [];
let hideImage = false;
let bgCount = 0;

let charBBox = null;
let searchHorizLine = null;
let vertAxis = null;
let gridLines = [];

let horizShiftPercent = 0;
let vertShiftPercent = 0;
let gridStepPercent = 13;

let showHoriz = true;
let showVert = true;
let showGrid = true;

let zoom = 1, panX = 0, panY = 0;
let fitZoom = 1;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let dragStartPanX = 0, dragStartPanY = 0;

let worker = null;
let workerBusy = false;
let pendingBuild = false;

let _seedsCache = null;
function invalidateSeeds() { _seedsCache = null; }

// ============================================================
//  3. СТИЛЬ
// ============================================================
const styleDefaults = {
  grid:  { color: '#ffdc00', width: 2.5, alpha: 0.95, dashed: true, dashLen: 10, dashGap: 6, outline: true, showLabels: true },
  horiz: { color: '#50b4ff', width: 3,   alpha: 1,    dashed: true, dashLen: 6,  dashGap: 4, outline: false },
  vert:  { color: '#c080ff', width: 3,   alpha: 1,    dashed: true, dashLen: 6,  dashGap: 4, outline: false },
  bbox:  { color: '#00e0ff', width: 2,   alpha: 1,    showCorners: true }
};
const style = JSON.parse(JSON.stringify(styleDefaults));

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function syncStyleFromUI() {
  try {
    const g = (id) => document.getElementById(id);
    if (g('gridColor')) style.grid.color = g('gridColor').value;
    if (g('gridWidth')) style.grid.width = +g('gridWidth').value;
    if (g('gridAlpha')) style.grid.alpha = +g('gridAlpha').value;
    if (g('gridDashed')) style.grid.dashed = g('gridDashed').checked;
    if (g('gridDashLen')) style.grid.dashLen = +g('gridDashLen').value;
    if (g('gridDashGap')) style.grid.dashGap = +g('gridDashGap').value;
    if (g('gridOutline')) style.grid.outline = g('gridOutline').checked;
    if (g('gridShowLabels')) style.grid.showLabels = g('gridShowLabels').checked;

    if (g('horizColor')) style.horiz.color = g('horizColor').value;
    if (g('horizWidth')) style.horiz.width = +g('horizWidth').value;
    if (g('horizAlpha')) style.horiz.alpha = +g('horizAlpha').value;
    if (g('horizDashed')) style.horiz.dashed = g('horizDashed').checked;
    if (g('horizDashLen')) style.horiz.dashLen = +g('horizDashLen').value;
    if (g('horizDashGap')) style.horiz.dashGap = +g('horizDashGap').value;
    if (g('horizOutline')) style.horiz.outline = g('horizOutline').checked;

    if (g('vertColor')) style.vert.color = g('vertColor').value;
    if (g('vertWidth')) style.vert.width = +g('vertWidth').value;
    if (g('vertAlpha')) style.vert.alpha = +g('vertAlpha').value;
    if (g('vertDashed')) style.vert.dashed = g('vertDashed').checked;
    if (g('vertDashLen')) style.vert.dashLen = +g('vertDashLen').value;
    if (g('vertDashGap')) style.vert.dashGap = +g('vertDashGap').value;
    if (g('vertOutline')) style.vert.outline = g('vertOutline').checked;

    if (g('bboxColor')) style.bbox.color = g('bboxColor').value;
    if (g('bboxWidth')) style.bbox.width = +g('bboxWidth').value;
    if (g('bboxAlpha')) style.bbox.alpha = +g('bboxAlpha').value;
    if (g('bboxShowCorners')) style.bbox.showCorners = g('bboxShowCorners').checked;

    const sw = (id, color) => { const el = g(id); if (el) el.style.background = color; };
    sw('gridColorSwatch', style.grid.color);
    sw('horizColorSwatch', style.horiz.color);
    sw('vertColorSwatch', style.vert.color);
    sw('bboxColorSwatch', style.bbox.color);

    drawOverlay();
  } catch (e) {
    showError('syncStyleFromUI: ' + (e.message || e));
  }
}

function bindStyleControls() {
  const labelMap = {
    gridWidth: ['gridWidthVal', v => v],
    gridAlpha: ['gridAlphaVal', v => (+v).toFixed(2)],
    gridDashLen: ['gridDashLenVal', v => v],
    gridDashGap: ['gridDashGapVal', v => v],
    horizWidth: ['horizWidthVal', v => v],
    horizAlpha: ['horizAlphaVal', v => (+v).toFixed(2)],
    horizDashLen: ['horizDashLenVal', v => v],
    horizDashGap: ['horizDashGapVal', v => v],
    vertWidth: ['vertWidthVal', v => v],
    vertAlpha: ['vertAlphaVal', v => (+v).toFixed(2)],
    vertDashLen: ['vertDashLenVal', v => v],
    vertDashGap: ['vertDashGapVal', v => v],
    bboxWidth: ['bboxWidthVal', v => v],
    bboxAlpha: ['bboxAlphaVal', v => (+v).toFixed(2)]
  };
  Object.keys(labelMap).forEach(id => {
    const el = $('' + id);
    if (!el) return;
    const [labelId, fmt] = labelMap[id];
    const lbl = $(labelId);
    if (!lbl) return;
    lbl.textContent = fmt(el.value);
    el.addEventListener('input', () => {
      lbl.textContent = fmt(el.value);
      syncStyleFromUI();
    });
  });

  const ids = [
    'gridColor','gridDashed','gridOutline','gridShowLabels',
    'horizColor','horizDashed','horizOutline',
    'vertColor','vertDashed','vertOutline',
    'bboxColor','bboxShowCorners'
  ];
  ids.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', syncStyleFromUI);
    el.addEventListener('change', syncStyleFromUI);
  });
}

function setStyleUIFromState() {
  try {
    const setVal = (id, v) => { const el = $(id); if (el) el.value = v; };
    const setChk = (id, v) => { const el = $(id); if (el) el.checked = v; };
    const setTxt = (id, v) => { const el = $(id); if (el) el.textContent = v; };

    setVal('gridColor', style.grid.color);
    setVal('gridWidth', style.grid.width);
    setVal('gridAlpha', style.grid.alpha);
    setChk('gridDashed', style.grid.dashed);
    setVal('gridDashLen', style.grid.dashLen);
    setVal('gridDashGap', style.grid.dashGap);
    setChk('gridOutline', style.grid.outline);
    setChk('gridShowLabels', style.grid.showLabels);

    setVal('horizColor', style.horiz.color);
    setVal('horizWidth', style.horiz.width);
    setVal('horizAlpha', style.horiz.alpha);
    setChk('horizDashed', style.horiz.dashed);
    setVal('horizDashLen', style.horiz.dashLen);
    setVal('horizDashGap', style.horiz.dashGap);
    setChk('horizOutline', style.horiz.outline);

    setVal('vertColor', style.vert.color);
    setVal('vertWidth', style.vert.width);
    setVal('vertAlpha', style.vert.alpha);
    setChk('vertDashed', style.vert.dashed);
    setVal('vertDashLen', style.vert.dashLen);
    setVal('vertDashGap', style.vert.dashGap);
    setChk('vertOutline', style.vert.outline);

    setVal('bboxColor', style.bbox.color);
    setVal('bboxWidth', style.bbox.width);
    setVal('bboxAlpha', style.bbox.alpha);
    setChk('bboxShowCorners', style.bbox.showCorners);

    setTxt('gridWidthVal', style.grid.width);
    setTxt('gridAlphaVal', style.grid.alpha.toFixed(2));
    setTxt('gridDashLenVal', style.grid.dashLen);
    setTxt('gridDashGapVal', style.grid.dashGap);
    setTxt('horizWidthVal', style.horiz.width);
    setTxt('horizAlphaVal', style.horiz.alpha.toFixed(2));
    setTxt('horizDashLenVal', style.horiz.dashLen);
    setTxt('horizDashGapVal', style.horiz.dashGap);
    setTxt('vertWidthVal', style.vert.width);
    setTxt('vertAlphaVal', style.vert.alpha.toFixed(2));
    setTxt('vertDashLenVal', style.vert.dashLen);
    setTxt('vertDashGapVal', style.vert.dashGap);
    setTxt('bboxWidthVal', style.bbox.width);
    setTxt('bboxAlphaVal', style.bbox.alpha.toFixed(2));

    const sw = (id, color) => { const el = $(id); if (el) el.style.background = color; };
    sw('gridColorSwatch', style.grid.color);
    sw('horizColorSwatch', style.horiz.color);
    sw('vertColorSwatch', style.vert.color);
    sw('bboxColorSwatch', style.bbox.color);
  } catch (e) {
    showError('setStyleUIFromState: ' + (e.message || e));
  }
}

$('styleResetBtn').addEventListener('click', () => {
  Object.assign(style, JSON.parse(JSON.stringify(styleDefaults)));
  setStyleUIFromState();
  drawOverlay();
});

// ============================================================
//  4. УТИЛИТЫ
// ============================================================
function debounce(fn, ms = 80) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function updateCursor() {
  if (isDragging) return;
  if (addPointMode) stageWrap.style.cursor = 'copy';
  else if (bgColorMode) stageWrap.style.cursor = 'crosshair';
  else stageWrap.style.cursor = 'grab';
}

// ============================================================
//  5. WEB WORKER + FALLBACK
// ============================================================
function initWorker() {
  if (worker) return true;
  try {
    worker = new Worker('worker.js?v=' + Date.now());
  } catch (err) {
    console.warn('[main] Worker creation failed, using main-thread fallback:', err);
    worker = null;
    showError('Worker не создан (file:// или нет worker.js). Используется резервный расчёт в главном потоке.');
    return false;
  }
  worker.onmessage = (e) => {
    const { type, payload } = e.data;
    if (type === 'mask') {
      isBg = payload.mask instanceof Uint8Array ? payload.mask : new Uint8Array(payload.mask);
      bgCount = payload.bgCount;
      charBBox = payload.bbox || null;
      searchHorizLine = payload.searchHorizLine || null;
      vertAxis = payload.vertAxis || null;
      gridLines = payload.gridLines || [];
      drawOverlay();
      updateInfo();
      workerBusy = false;
      hideProgress();
      if (pendingBuild) { pendingBuild = false; rebuildAll(); }
    } else if (type === 'error') {
      console.error('[main] worker error:', payload);
      workerBusy = false;
      hideProgress();
      showError('Worker error: ' + payload);
    }
  };
  worker.onerror = (err) => {
    console.error('[main] worker onerror:', err);
    workerBusy = false;
    hideProgress();
    worker = null;
    showError('Worker error: ' + (err.message || 'unknown'));
  };
  console.log('[main] worker initialized');
  return true;
}

function showProgress() { progressOverlay.classList.add('visible'); }
function hideProgress() { progressOverlay.classList.remove('visible'); }

// ============================================================
//  6. ЗАГРУЗКА ИЗОБРАЖЕНИЯ
// ============================================================
fileInput.addEventListener('change', e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  errBanner.classList.remove('visible');

  const img = new Image();
  img.onload = () => {
    try {
      imgWidth = img.naturalWidth;
      imgHeight = img.naturalHeight;
      console.log('[main] image loaded', imgWidth, imgHeight);

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
      invalidateSeeds();
      autoPickThreshold();
      renderSamplesList();

      requestAnimationFrame(() => {
        fitToView();
        rebuildAll();
      });
    } catch (err) {
      showError('Ошибка обработки изображения: ' + (err.message || err));
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

// ============================================================
//  7. АВТО-ПОРОГ И АВТО-СЕМЕНА
// ============================================================
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

// ============================================================
//  8. FALLBACK: расчёт маски в главном потоке
// ============================================================
function buildMaskMainThread(p) {
  const {
    imageData, width, height, mode, thresholdLum, colorSamples, thresholdDist,
    invert, sourcePoints, autoSeeds, useSmooth, smoothIter, morphOpen, morphClose,
    regionTolerance, horizShiftPercent, vertShiftPercent, gridStepPercent
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
    if (mode === 'lum') {
      matched = lml[idx] >= thresholdLum;
    } else if (mode === 'color') {
      if (!colorMode) return invert;
      matched = false;
      const j = idx * 4;
      const r = data[j], g = data[j + 1], b = data[j + 2];
      for (let k = 0; k < colorSamples.length; k++) {
        const s = colorSamples[k];
        const dr = r - s.r, dg = g - s.g, db = b - s.b;
        if (dr * dr + dg * dg + db * db <= dist2) { matched = true; break; }
      }
    } else {
      matched = lml[idx] >= thresholdLum;
    }
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

  if (sourcePoints && sourcePoints.length > 0) {
    for (const pt of sourcePoints) push(pt.x, pt.y);
  } else if (autoSeeds && autoSeeds.length > 0) {
    for (const pt of autoSeeds) push(pt.x, pt.y);
  }
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
  if (useSmooth) {
    for (let i = 0; i < smoothIter; i++) maskSmooth(mask, w, h);
  }

  let bgCount = 0;
  for (let i = 0; i < N; i++) if (mask[i]) bgCount++;

  const bbox = computeBBox(mask, w, h, 200);
  let searchHorizLine = null, vertAxis = null, gridLines = [];

  if (bbox) {
    const shiftVal = vertShiftPercent || 0;
    const shift = shiftVal / 100;
    let axisX = Math.round(bbox.x + bbox.w * (0.5 + shift));
    axisX = Math.max(bbox.x, Math.min(bbox.x + bbox.w - 1, axisX));
    vertAxis = { x: axisX, xNorm: (axisX - bbox.x) / bbox.w, shiftPercent: shiftVal };

    const hs = horizShiftPercent || 0;
    const hy = Math.round(bbox.h * (0.5 + hs / 100));
    searchHorizLine = {
      y: bbox.y + Math.max(0, Math.min(bbox.h - 1, hy)),
      yNorm: 0.5 + hs / 100,
      shiftPercent: hs
    };

    const step = gridStepPercent || 13;
    for (let p2 = step; p2 < 100; p2 += step) {
      const gy = Math.round(bbox.h * (p2 / 100));
      gridLines.push({ y: bbox.y + gy, yNorm: p2 / 100, percent: p2 });
    }
  }

  return { mask, bgCount, width: w, height: h, bbox, searchHorizLine, vertAxis, gridLines };
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

// ============================================================
//  9. ПЕРЕСЧЁТ МАСКИ
// ============================================================
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
    horizShiftPercent, vertShiftPercent, gridStepPercent
  };

  if (worker) {
    worker.postMessage({ type: 'buildMask', payload });
  } else {
    setTimeout(() => {
      try {
        const result = buildMaskMainThread(payload);
        isBg = result.mask;
        bgCount = result.bgCount;
        charBBox = result.bbox;
        searchHorizLine = result.searchHorizLine;
        vertAxis = result.vertAxis;
        gridLines = result.gridLines;
        drawOverlay();
        updateInfo();
      } catch (e) {
        showError('Fallback error: ' + (e.message || e));
      } finally {
        workerBusy = false;
        hideProgress();
        if (pendingBuild) { pendingBuild = false; rebuildAll(); }
      }
    }, 0);
  }
}

const rebuildAllDebounced = debounce(rebuildAll, 80);

// ============================================================
//  10. ОТРИСОВКА ОВЕРЛЕЯ
// ============================================================
function drawOverlay() {
  const w = imgWidth, h = imgHeight;
  if (!w) return;
  overlayCtx.clearRect(0, 0, w, h);

  if (isBg) {
    const img = overlayCtx.createImageData(w, h);
    const data = img.data;
    for (let i = 0, j = 0; i < w * h; i++, j += 4) {
      if (!isBg[i]) {
        data[j] = 255; data[j+1] = 60; data[j+2] = 60; data[j+3] = 100;
      }
    }
    overlayCtx.putImageData(img, 0, 0);
  }

  if (charBBox) {
    const { x, y, w: bw, h: bh } = charBBox;
    const s = style.bbox;
    const lw = Math.max(1, s.width / zoom);

    overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.lineWidth = lw;
    overlayCtx.setLineDash([8 / zoom, 6 / zoom]);
    overlayCtx.strokeRect(x + 0.5, y + 0.5, bw, bh);
    overlayCtx.setLineDash([]);

    if (s.showCorners) {
      const cs = Math.min(bw, bh) * 0.12;
      overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
      overlayCtx.lineWidth = lw * 2;
      const corners = [
        [x, y, 1, 1], [x + bw, y, -1, 1],
        [x, y + bh, 1, -1], [x + bw, y + bh, -1, -1]
      ];
      for (const [cx, cy, sx, sy] of corners) {
        overlayCtx.beginPath();
        overlayCtx.moveTo(cx + sx * cs, cy);
        overlayCtx.lineTo(cx, cy);
        overlayCtx.lineTo(cx, cy + sy * cs);
        overlayCtx.stroke();
      }
    }

    const fs = Math.max(11, 14 / zoom);
    overlayCtx.font = `${fs}px system-ui, sans-serif`;
    overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.fillText(`bbox ${bw}×${bh}`, x, Math.max(fs, y - 6 / zoom));
  }

  if (charBBox && vertAxis && showVert) {
    const { y: by, h: bh } = charBBox;
    const ax = vertAxis.x;
    const s = style.vert;
    const lw = Math.max(1, s.width / zoom);
    const fs = Math.max(11, 13 / zoom);

    if (s.outline) {
      overlayCtx.strokeStyle = 'rgba(0,0,0,0.8)';
      overlayCtx.lineWidth = lw * 2.5;
      overlayCtx.setLineDash([]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(ax, by); overlayCtx.lineTo(ax, by + bh);
      overlayCtx.stroke();
    }

    overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.lineWidth = lw;
    overlayCtx.setLineDash(s.dashed ? [s.dashLen / zoom, s.dashGap / zoom] : []);
    overlayCtx.beginPath();
    overlayCtx.moveTo(ax, by); overlayCtx.lineTo(ax, by + bh);
    overlayCtx.stroke();
    overlayCtx.setLineDash([]);

    overlayCtx.font = `${fs}px system-ui, sans-serif`;
    overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.fillText(`верт. поиск (${vertShiftPercent}%)`, ax + 6 / zoom, by + fs + 2 / zoom);
  }

  if (charBBox && searchHorizLine && showHoriz) {
    const { x: bx, w: bw } = charBBox;
    const py = searchHorizLine.y;
    const s = style.horiz;
    const lw = Math.max(1, s.width / zoom);
    const fs = Math.max(11, 13 / zoom);

    if (s.outline) {
      overlayCtx.strokeStyle = 'rgba(0,0,0,0.8)';
      overlayCtx.lineWidth = lw * 2.5;
      overlayCtx.setLineDash([]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(bx, py); overlayCtx.lineTo(bx + bw, py);
      overlayCtx.stroke();
    }

    overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.lineWidth = lw;
    overlayCtx.setLineDash(s.dashed ? [s.dashLen / zoom, s.dashGap / zoom] : []);
    overlayCtx.beginPath();
    overlayCtx.moveTo(bx, py); overlayCtx.lineTo(bx + bw, py);
    overlayCtx.stroke();
    overlayCtx.setLineDash([]);

    overlayCtx.font = `${fs}px system-ui, sans-serif`;
    overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.fillText(`гориз. поиск (${horizShiftPercent}%)`, bx + bw + 6 / zoom, py + fs / 3);
  }

  if (charBBox && gridLines && gridLines.length > 0 && showGrid) {
    const { x: bx, w: bw } = charBBox;
    const s = style.grid;
    const lw = Math.max(1, s.width / zoom);
    const fs = Math.max(11, 13 / zoom);

    overlayCtx.font = `bold ${fs}px system-ui, sans-serif`;
    overlayCtx.textBaseline = 'bottom';

    for (const gl of gridLines) {
      if (s.outline) {
        overlayCtx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        overlayCtx.lineWidth = lw * 2.5;
        overlayCtx.setLineDash([]);
        overlayCtx.beginPath();
        overlayCtx.moveTo(bx, gl.y); overlayCtx.lineTo(bx + bw, gl.y);
        overlayCtx.stroke();
      }

      overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
      overlayCtx.lineWidth = lw;
      overlayCtx.setLineDash(s.dashed ? [s.dashLen / zoom, s.dashGap / zoom] : []);
      overlayCtx.beginPath();
      overlayCtx.moveTo(bx, gl.y); overlayCtx.lineTo(bx + bw, gl.y);
      overlayCtx.stroke();

      if (s.showLabels) {
        const label = `${gl.percent}%`;
        const tx = bx + bw - 4 / zoom;
        const ty = gl.y - 4 / zoom;
        overlayCtx.textAlign = 'right';
        overlayCtx.lineWidth = 3 / zoom;
        overlayCtx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        overlayCtx.setLineDash([]);
        overlayCtx.strokeText(label, tx, ty);
        overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
        overlayCtx.fillText(label, tx, ty);
      }
    }
    overlayCtx.setLineDash([]);
    overlayCtx.textAlign = 'start';
    overlayCtx.textBaseline = 'alphabetic';
  }

  sourcePoints.forEach((p, i) => {
    const isSelected = i === selectedPointIndex;
    overlayCtx.beginPath();
    overlayCtx.arc(p.x, p.y, isSelected ? 10 : 8, 0, Math.PI * 2);
    overlayCtx.fillStyle = isSelected ? '#ff5050' : '#ffcc00';
    overlayCtx.fill();
    overlayCtx.lineWidth = 2;
    overlayCtx.strokeStyle = '#000';
    overlayCtx.stroke();
  });
}

// ============================================================
//  11. UI
// ============================================================
function updateInfo() {
  if (!lum) return;
  const N = imgWidth * imgHeight;
  const charCount = N - bgCount;
  infoSize.textContent = `${imgWidth} × ${imgHeight}`;
  infoMode.textContent = mode === 'lum' ? 'яркость' : mode === 'color' ? 'цвет' : 'регион';
  infoBgPct.textContent = ((bgCount / N) * 100).toFixed(1) + '%';
  infoCharPct.textContent = ((charCount / N) * 100).toFixed(1) + '%';
  infoPointsCount.textContent = `(${sourcePoints.length})`;

  if (charBBox) {
    infoBBox.textContent = `x:${charBBox.x} y:${charBBox.y} w:${charBBox.w} h:${charBBox.h}`;
    infoWH.textContent = `${(charBBox.w / charBBox.h).toFixed(3)} (h/w=${(charBBox.h / charBBox.w).toFixed(3)})`;
    infoFill.textContent = (charBBox.fillRatio * 100).toFixed(1) + '%';
  } else {
    infoBBox.textContent = infoWH.textContent = infoFill.textContent = '—';
  }

  infoHoriz.textContent = (charBBox && searchHorizLine)
    ? `y:${searchHorizLine.y} (norm ${(searchHorizLine.yNorm * 100).toFixed(1)}%, сдвиг ${horizShiftPercent}%)`
    : '—';
  infoVert.textContent = (charBBox && vertAxis)
    ? `x:${vertAxis.x} (norm ${(vertAxis.xNorm * 100).toFixed(1)}%, сдвиг ${vertShiftPercent}%)`
    : '—';
  infoGrid.textContent = (charBBox && gridLines.length > 0)
    ? `${gridStepPercent}% (${gridLines.length} лин.)`
    : '—';

  renderPointList();
}

function renderPointList() {
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
    const dotColor = (i === selectedPointIndex) ? '#ff5050' : '#ffcc00';
    left.innerHTML = `<span class="dot" style="background:${dotColor}"></span><span>#${i + 1}</span><span class="coords">x=${p.x}, y=${p.y}</span>`;
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
  samplesList.innerHTML = '';
  if (colorSamples.length === 0) {
    samplesList.innerHTML = '<span class="sample-empty">Образцы не заданы.</span>';
    return;
  }
  colorSamples.forEach((s, i) => {
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
  });
}

// ============================================================
//  12. ZOOM / PAN
// ============================================================
function applyTransform() {
  stageEl.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  infoZoom.textContent = Math.round(zoom * 100) + '%';
  drawOverlay();
}

function fitToView() {
  if (!imgWidth) return;
  const wrapW = stageWrap.clientWidth;
  const wrapH = stageWrap.clientHeight;
  fitZoom = Math.min(wrapW / imgWidth, wrapH / imgHeight) * 0.98;
  zoom = fitZoom;
  panX = (wrapW - imgWidth * zoom) / 2;
  panY = (wrapH - imgHeight * zoom) / 2;
  applyTransform();
}

function resetZoom() {
  zoom = 1;
  panX = (stageWrap.clientWidth - imgWidth) / 2;
  panY = (stageWrap.clientHeight - imgHeight) / 2;
  applyTransform();
}

function zoomAt(factor, clientX, clientY) {
  const rect = stageWrap.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const newZoom = Math.max(0.05, Math.min(20, zoom * factor));
  const k = newZoom / zoom;
  panX = mx - k * (mx - panX);
  panY = my - k * (my - panY);
  zoom = newZoom;
  applyTransform();
}

zoomInBtn.addEventListener('click', () => {
  const rect = stageWrap.getBoundingClientRect();
  zoomAt(1.25, rect.left + stageWrap.clientWidth / 2, rect.top + stageWrap.clientHeight / 2);
});
zoomOutBtn.addEventListener('click', () => {
  const rect = stageWrap.getBoundingClientRect();
  zoomAt(1 / 1.25, rect.left + stageWrap.clientWidth / 2, rect.top + stageWrap.clientHeight / 2);
});
zoomFitBtn.addEventListener('click', fitToView);
zoomResetBtn.addEventListener('click', resetZoom);

stageWrap.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  zoomAt(factor, e.clientX, e.clientY);
}, { passive: false });

stageWrap.addEventListener('mousedown', (e) => {
  if (e.button === 1 || e.button === 2) {
    e.preventDefault();
    isDragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    dragStartPanX = panX; dragStartPanY = panY;
    stageWrap.classList.add('dragging');
    stageWrap.style.cursor = 'grabbing';
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  panX = dragStartPanX + (e.clientX - dragStartX);
  panY = dragStartPanY + (e.clientY - dragStartY);
  applyTransform();
});

window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  stageWrap.classList.remove('dragging');
  updateCursor();
});

stageWrap.addEventListener('contextmenu', (e) => e.preventDefault());

let touchMode = null, touchStartDist = 0, touchStartZoom = 1;
let touchStartX = 0, touchStartY = 0, touchStartPanX = 0, touchStartPanY = 0;

stageWrap.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchMode = 'pan';
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
    touchStartPanX = panX; touchStartPanY = panY;
  } else if (e.touches.length === 2) {
    touchMode = 'pinch';
    const [a, b] = e.touches;
    touchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    touchStartZoom = zoom;
  }
}, { passive: true });

stageWrap.addEventListener('touchmove', (e) => {
  if (touchMode === 'pan' && e.touches.length === 1) {
    panX = touchStartPanX + (e.touches[0].clientX - touchStartX);
    panY = touchStartPanY + (e.touches[0].clientY - touchStartY);
    applyTransform();
  } else if (touchMode === 'pinch' && e.touches.length === 2) {
    const [a, b] = e.touches;
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const factor = dist / touchStartDist;
    const newZoom = Math.max(0.05, Math.min(20, touchStartZoom * factor));
    const mx = (a.clientX + b.clientX) / 2;
    const my = (a.clientY + b.clientY) / 2;
    const rect = stageWrap.getBoundingClientRect();
    const localX = mx - rect.left, localY = my - rect.top;
    const k = newZoom / zoom;
    panX = localX - k * (localX - panX);
    panY = localY - k * (localY - panY);
    zoom = newZoom;
    applyTransform();
  }
}, { passive: true });

stageWrap.addEventListener('touchend', () => { touchMode = null; }, { passive: true });

// ============================================================
//  13. КЛИК ПО CANVAS
// ============================================================
function clientToImage(clientX, clientY) {
  const rect = stageEl.getBoundingClientRect();
  return {
    x: Math.floor((clientX - rect.left) / zoom),
    y: Math.floor((clientY - rect.top) / zoom)
  };
}

stageWrap.addEventListener('click', (e) => {
  if (!lum) return;
  if (isDragging) return;

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
    pickBgColorBtn.classList.remove('active');
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

function removePoint(index) {
  sourcePoints.splice(index, 1);
  if (selectedPointIndex === index) selectedPointIndex = -1;
  else if (selectedPointIndex > index) selectedPointIndex--;
  invalidateSeeds();
  rebuildAll();
}

// ============================================================
//  14. РЕЖИМЫ, КУРСОР
// ============================================================
function setMode(newMode) {
  mode = newMode;
  modeSeg.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === newMode);
  });
  lumSliderRow.style.display = (newMode === 'lum') ? '' : 'none';
  colorSliderRow.style.display = (newMode === 'color') ? '' : 'none';
  regionSliderRow.style.display = (newMode === 'region') ? '' : 'none';
  invalidateSeeds();
}

modeSeg.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-mode]');
  if (!btn) return;
  setMode(btn.dataset.mode);
  if (lum) rebuildAll();
});

autoThresholdBtn.addEventListener('click', () => {
  if (!histogram) return;
  autoPickThreshold();
  if (mode === 'lum' || mode === 'region') rebuildAll();
});

addPointBtn.addEventListener('click', () => {
  addPointMode = !addPointMode;
  if (addPointMode) { bgColorMode = false; pickBgColorBtn.classList.remove('active'); }
  addPointBtn.classList.toggle('active', addPointMode);
  updateCursor();
});

pickBgColorBtn.addEventListener('click', () => {
  bgColorMode = !bgColorMode;
  if (bgColorMode) { addPointMode = false; addPointBtn.classList.remove('active'); }
  pickBgColorBtn.classList.toggle('active', bgColorMode);
  updateCursor();
});

clearPointsBtn.addEventListener('click', () => {
  sourcePoints = [];
  selectedPointIndex = -1;
  invalidateSeeds();
  if (lum) rebuildAll();
});

// ============================================================
//  15. СЛАЙДЕРЫ СЕТКИ / ЛИНИЙ
// ============================================================
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

gridStepEl.addEventListener('input', () => {
  gridStepPercent = +gridStepEl.value;
  gridStepVal.textContent = gridStepPercent + '%';
  if (lum) rebuildAllDebounced();
});

showHorizEl.addEventListener('change', () => { showHoriz = showHorizEl.checked; drawOverlay(); });
showVertEl.addEventListener('change', () => { showVert = showVertEl.checked; drawOverlay(); });
showGridEl.addEventListener('change', () => { showGrid = showGridEl.checked; drawOverlay(); });

searchLinesResetBtn.addEventListener('click', () => {
  horizShiftPercent = 0; horizShiftEl.value = 0; horizShiftVal.textContent = '0%';
  vertShiftPercent = 0; vertShiftEl.value = 0; vertShiftVal.textContent = '0%';
  if (lum) rebuildAll();
});

gridResetBtn.addEventListener('click', () => {
  gridStepPercent = 13; gridStepEl.value = 13; gridStepVal.textContent = '13%';
  if (lum) rebuildAll();
});

// ============================================================
//  16. ЭКСПОРТ
// ============================================================
toggleImageBtn.addEventListener('click', () => {
  hideImage = !hideImage;
  stageEl.classList.toggle('hide-base', hideImage);
  toggleImageBtn.classList.toggle('active', hideImage);
  toggleImageBtn.textContent = hideImage ? '👁 Показать' : '👁 Маска';
});

function downloadCanvasPNG(canvas, filename) {
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}

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
    d[j+3] = isBg[i] ? 0 : 255;
  }
  ctx.putImageData(out, 0, 0);
  downloadCanvasPNG(c, 'cutout.png');
});

// ============================================================
//  17. СЛУШАТЕЛИ ПАРАМЕТРОВ МАСКИ
// ============================================================
bgLumEl.addEventListener('input', () => {
  bgLumVal.textContent = bgLumEl.value;
  invalidateSeeds();
  if (mode === 'lum' || mode === 'region') rebuildAllDebounced();
});
bgDistEl.addEventListener('input', () => {
  bgDistVal.textContent = bgDistEl.value;
  invalidateSeeds();
  if (mode === 'color') rebuildAllDebounced();
});
regionTolEl.addEventListener('input', () => {
  regionTolVal.textContent = regionTolEl.value;
  if (mode === 'region') rebuildAllDebounced();
});
invertEl.addEventListener('change', () => {
  invalidateSeeds();
  if (lum) rebuildAll();
});
useSmoothEl.addEventListener('change', () => {
  smoothIterEl.disabled = !useSmoothEl.checked;
  if (lum) rebuildAll();
});
smoothIterEl.addEventListener('input', () => {
  smoothIterVal.textContent = smoothIterEl.value;
  if (lum && useSmoothEl.checked) rebuildAllDebounced();
});
morphOpenEl.addEventListener('input', () => {
  morphOpenVal.textContent = morphOpenEl.value;
  if (lum) rebuildAllDebounced();
});
morphCloseEl.addEventListener('input', () => {
  morphCloseVal.textContent = morphCloseEl.value;
  if (lum) rebuildAllDebounced();
});

// ============================================================
//  18. INIT
// ============================================================
try {
  initWorker();
  smoothIterEl.disabled = !useSmoothEl.checked;
  updateCursor();
  bindStyleControls();
  setStyleUIFromState();
  console.log('[main] init OK');
} catch (e) {
  showError('Init error: ' + (e.message || e));
}
