// ============================================================
//  DOM ССЫЛКИ
// ============================================================
const fileInput = document.getElementById('file');
const baseCanvas = document.getElementById('base');
const overlay = document.getElementById('overlay');
const stageEl = document.getElementById('stage');
const bgLumEl = document.getElementById('bgLum');
const bgLumVal = document.getElementById('bgLumVal');
const bgDistEl = document.getElementById('bgDist');
const bgDistVal = document.getElementById('bgDistVal');
const invertEl = document.getElementById('invert');
const useWindowsEl = document.getElementById('useWindows');
const useHolesEl = document.getElementById('useHoles');
const useSmoothEl = document.getElementById('useSmooth');
const useTableEl = document.getElementById('useTable');
const useTailsFilterEl = document.getElementById('useTailsFilter');
const maxHoleEl = document.getElementById('maxHole');
const maxHoleVal = document.getElementById('maxHoleVal');
const minWinEl = document.getElementById('minWin');
const minWinVal = document.getElementById('minWinVal');
const smoothIterEl = document.getElementById('smoothIter');
const smoothIterVal = document.getElementById('smoothIterVal');
const coreThreshEl = document.getElementById('coreThresh');
const coreThreshVal = document.getElementById('coreThreshVal');
const paletteCountEl = document.getElementById('paletteCount');
const paletteCountVal = document.getElementById('paletteCountVal');

const showHistoEl = document.getElementById('showHisto');
const showPropsEl = document.getElementById('showProps');
const showPerspEl = document.getElementById('showPersp');
const showLinkEl = document.getElementById('showLink');
const showSymmEl = document.getElementById('showSymm');
const showJointsEl = document.getElementById('showJoints');
const showPaletteEl = document.getElementById('showPalette');
const showSamplesEl = document.getElementById('showSamples');
const showInfoEl = document.getElementById('showInfo');
const showCorrectedEl = document.getElementById('showCorrected');

const addPointBtn = document.getElementById('addPointBtn');
const clearPointsBtn = document.getElementById('clearPointsBtn');
const autoThresholdBtn = document.getElementById('autoThresholdBtn');
const pickBgColorBtn = document.getElementById('pickBgColorBtn');
const editFractionsBtn = document.getElementById('editFractionsBtn');
const editJointsBtn = document.getElementById('editJointsBtn');
const manualVPBtn = document.getElementById('manualVPBtn');
const resetVPBtn = document.getElementById('resetVPBtn');
const clearVPBtn = document.getElementById('clearVPBtn');
const resyncBtn = document.getElementById('resyncBtn');

const presetAnimeBtn = document.getElementById('presetAnime');
const presetStylizedBtn = document.getElementById('presetStylized');
const presetRealismBtn = document.getElementById('presetRealism');
const presetChibiBtn = document.getElementById('presetChibi');

const modeLumBtn = document.getElementById('modeLum');
const modeColorBtn = document.getElementById('modeColor');
const lumSliderRow = document.getElementById('lumSliderRow');
const colorSliderRow = document.getElementById('colorSliderRow');
const hintText = document.getElementById('hintText');

const menuToggle = document.getElementById('menuToggle');
const drawer = document.getElementById('drawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerClose = document.getElementById('drawerClose');

const bottomFile = document.getElementById('bottomFile');
const bottomReset = document.getElementById('bottomReset');
const bottomToggleOverlay = document.getElementById('bottomToggleOverlay');
const bottomHide = document.getElementById('bottomHide');
const bottomMenu = document.getElementById('bottomMenu');

const fullscreenBtn = document.getElementById('fullscreenBtn');

const propHeight = document.getElementById('propHeight');
const propWidth = document.getElementById('propWidth');
const propAspect = document.getElementById('propAspect');
const propFill = document.getElementById('propFill');
const propHeads = document.getElementById('propHeads');
const propStyle = document.getElementById('propStyle');
const propOffsetX = document.getElementById('propOffsetX');
const propOffsetY = document.getElementById('propOffsetY');
const propCx = document.getElementById('propCx');
const propCy = document.getElementById('propCy');
const propFractions = document.getElementById('propFractions');
const propsSummary = document.getElementById('propsSummary');
const autoInfo = document.getElementById('autoInfo');

const perspIcon = document.getElementById('perspIcon');
const perspMain = document.getElementById('perspMain');
const perspSub = document.getElementById('perspSub');
const perspTopW = document.getElementById('perspTopW');
const perspMidW = document.getElementById('perspMidW');
const perspBotW = document.getElementById('perspBotW');
const perspTopBot = document.getElementById('perspTopBot');
const perspVerdict = document.getElementById('perspVerdict');
const perspShoulder = document.getElementById('perspShoulder');
const perspPelvis = document.getElementById('perspPelvis');
const perspDiff = document.getElementById('perspDiff');
const perspContourAngle = document.getElementById('perspContourAngle');
const perspEdgeSlope = document.getElementById('perspEdgeSlope');
const perspVanishing = document.getElementById('perspVanishing');
const perspVPDist = document.getElementById('perspVPDist');
const perspConfidence = document.getElementById('perspConfidence');
const perspTilt = document.getElementById('perspTilt');
const perspSummary = document.getElementById('perspSummary');

const linkMeasured = document.getElementById('linkMeasured');
const linkCorrected = document.getElementById('linkCorrected');
const linkAspect = document.getElementById('linkAspect');
const linkFactor = document.getElementById('linkFactor');
const linkMethodUsed = document.getElementById('linkMethodUsed');
const linkTopFix = document.getElementById('linkTopFix');
const linkBotFix = document.getElementById('linkBotFix');
const linkVPInFrame = document.getElementById('linkVPInFrame');
const linkTableBody = document.getElementById('linkTableBody');
const linkSummary = document.getElementById('linkSummary');

const symmVerdict = document.getElementById('symmVerdict');
const symmScore = document.getElementById('symmScore');
const symmBar = document.getElementById('symmBar');
const symmTop = document.getElementById('symmTop');
const symmTopBar = document.getElementById('symmTopBar');
const symmMid = document.getElementById('symmMid');
const symmMidBar = document.getElementById('symmMidBar');
const symmBot = document.getElementById('symmBot');
const symmBotBar = document.getElementById('symmBotBar');
const symmSummary = document.getElementById('symmSummary');

const jointList = document.getElementById('jointList');
const jointsSummary = document.getElementById('jointsSummary');

const paletteGrid = document.getElementById('paletteGrid');
const paletteSummary = document.getElementById('paletteSummary');

const samplesList = document.getElementById('samplesList');
const samplesSummary = document.getElementById('samplesSummary');

const infoSize = document.getElementById('infoSize');
const infoModeMode = document.getElementById('infoModeMode');
const infoBgPct = document.getElementById('infoBgPct');
const infoCharPct = document.getElementById('infoCharPct');
const infoHoles = document.getElementById('infoHoles');
const infoWindows = document.getElementById('infoWindows');
const infoPointsCount = document.getElementById('infoPointsCount');
const pointList = document.getElementById('pointList');
const infoSummary = document.getElementById('infoSummary');

const histoCanvas = document.getElementById('histoCanvas');
const histoValley = document.getElementById('histoValley');
const histoSummary = document.getElementById('histoSummary');
const histoCtx = histoCanvas.getContext('2d');

const histoPanel = document.getElementById('histoPanel');
const propsPanel = document.getElementById('propsPanel');
const perspPanel = document.getElementById('perspPanel');
const linkPanel = document.getElementById('linkPanel');
const symmPanel = document.getElementById('symmPanel');
const jointsPanel = document.getElementById('jointsPanel');
const palettePanel = document.getElementById('palettePanel');
const samplesPanel = document.getElementById('samplesPanel');
const infoPanel = document.getElementById('infoPanel');

const baseCtx = baseCanvas.getContext('2d');
const overlayCtx = overlay.getContext('2d');

// ============================================================
//  СОСТОЯНИЕ
// ============================================================
let imgWidth = 0, imgHeight = 0;
let lum = null, isBg = null, imgDataRef = null, histogram = null;
let selectedPointIndex = -1;
let mode = 'lum';
let colorSamples = [];
let bgColorMode = false, addPointMode = false;
let sourcePoints = [];
let holesFilledCount = 0, windowsFoundCount = 0;
let charBBox = null;
let figStyle = '—';
let currentPreset = 'anime';

let symmetryResult = null;
let paletteResult = null;
let contourResult = null;
let linkResult = null;
let manualVP = null;
let manualVPMode = false;

// ТАБЛИЦЫ ПРОПОРЦИЙ
const PROP_TABLES = {
  chibi:    { neck: 0.22, shoulder: 0.28, chest: 0.42, pelvis: 0.56, knee: 0.76, ankle: 0.95 },
  anime:    { neck: 0.13, shoulder: 0.20, chest: 0.33, pelvis: 0.48, knee: 0.70, ankle: 0.95 },
  stylized: { neck: 0.14, shoulder: 0.19, chest: 0.33, pelvis: 0.50, knee: 0.71, ankle: 0.94 },
  realism:  { neck: 0.13, shoulder: 0.18, chest: 0.32, pelvis: 0.50, knee: 0.72, ankle: 0.95 },
};

const DEFAULT_FRACTIONS = [
  { id: 'top',     name: 'Макушка', value: 0.00, color: '#8b93a1', joint: false },
  { id: 'neck',    name: 'Шея', value: 0.13, color: '#ff00ff', joint: true },
  { id: 'shoulder',name: 'Плечи', value: 0.20, color: '#ffaa00', joint: true },
  { id: 'chest',   name: 'Талия', value: 0.33, color: '#ffcc00', joint: false },
  { id: 'pelvis',  name: 'Бёдра', value: 0.48, color: '#ffaa00', joint: true },
  { id: 'knee',    name: 'Колени', value: 0.70, color: '#ffcc00', joint: true },
  { id: 'ankle',   name: 'Лодыжки', value: 0.95, color: '#ffcc00', joint: true },
];
let fractions = DEFAULT_FRACTIONS.map(f => ({ ...f }));
let autoNeckValue = 0.13;

let editFractionsMode = false;
let editJointsMode = false;
let dragging = null;

// ============================================================
//  МЕНЮ
// ============================================================
function openDrawer() {
  drawer.classList.add('open');
  drawerBackdrop.classList.add('open');
  menuToggle.classList.add('open');
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawerBackdrop.classList.remove('open');
  menuToggle.classList.remove('open');
}
menuToggle.addEventListener('click', () => {
  drawer.classList.contains('open') ? closeDrawer() : openDrawer();
});
drawerClose.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);
bottomMenu.addEventListener('click', openDrawer);

// ПОКАЗ ПАНЕЛЕЙ
function applyPanelVisibility() {
  histoPanel.style.display = showHistoEl.checked ? '' : 'none';
  propsPanel.style.display = showPropsEl.checked ? '' : 'none';
  perspPanel.style.display = showPerspEl.checked ? '' : 'none';
  linkPanel.style.display = showLinkEl.checked ? '' : 'none';
  symmPanel.style.display = showSymmEl.checked ? '' : 'none';
  jointsPanel.style.display = showJointsEl.checked ? '' : 'none';
  palettePanel.style.display = showPaletteEl.checked ? '' : 'none';
  samplesPanel.style.display = showSamplesEl.checked ? '' : 'none';
  infoPanel.style.display = showInfoEl.checked ? '' : 'none';
  if (showHistoEl.checked) drawHistogram();
}
[showHistoEl, showPropsEl, showPerspEl, showLinkEl, showSymmEl, showJointsEl, showPaletteEl, showSamplesEl, showInfoEl]
  .forEach(el => el.addEventListener('change', applyPanelVisibility));

// СВОРАЧИВАНИЕ
document.querySelectorAll('.panel-header[data-toggle]').forEach(header => {
  header.addEventListener('click', () => header.parentElement.classList.toggle('open'));
});

// FULLSCREEN
let isFullscreen = false;
fullscreenBtn.addEventListener('click', () => {
  isFullscreen = !isFullscreen;
  stageEl.classList.toggle('fullscreen', isFullscreen);
  fullscreenBtn.textContent = isFullscreen ? '✕' : '⛶';
  document.body.style.overflow = isFullscreen ? 'hidden' : '';
});
bottomFile.addEventListener('click', () => fileInput.click());
bottomReset.addEventListener('click', () => {
  isFullscreen = false;
  stageEl.classList.remove('fullscreen');
  fullscreenBtn.textContent = '⛶';
  document.body.style.overflow = '';
});
bottomToggleOverlay.addEventListener('click', () => {
  const willHide = !stageEl.classList.contains('hide');
  stageEl.classList.toggle('hide', willHide);
  bottomHide.classList.toggle('active', willHide);
});
bottomHide.addEventListener('click', () => {
  const willHide = !stageEl.classList.contains('hide');
  stageEl.classList.toggle('hide', willHide);
  bottomHide.classList.toggle('active', willHide);
});

// ============================================================
//  ЗАГРУЗКА ИЗОБРАЖЕНИЯ
// ============================================================
fileInput.addEventListener('change', e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    imgWidth = img.naturalWidth;
    imgHeight = img.naturalHeight;
    [baseCanvas, overlay].forEach(c => { c.width = imgWidth; c.height = imgHeight; });
    baseCtx.drawImage(img, 0, 0);
    imgDataRef = baseCtx.getImageData(0, 0, imgWidth, imgHeight);
    computeLuminance(imgDataRef);
    computeHistogram();
    sourcePoints = [];
    selectedPointIndex = -1;
    colorSamples = [];
    applyPreset(currentPreset);
    manualVP = null;
    if (mode === 'lum') autoPickThreshold();
    rebuildAll();
  };
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

function autoPickThreshold() {
  if (!histogram) return;
  const N = imgWidth * imgHeight;
  const minCount = Math.max(1, Math.floor(N * 0.003));
  const smooth = new Uint32Array(256);
  for (let v = 0; v < 256; v++) {
    let s = 0;
    for (let k = -2; k <= 2; k++) {
      const vv = v + k;
      if (vv >= 0 && vv < 256) s += histogram[vv];
    }
    smooth[v] = s;
  }
  let bestBin = -1, bestCount = 0;
  for (let v = 255; v >= 0; v--) {
    if (smooth[v] >= minCount && smooth[v] > bestCount) { bestCount = smooth[v]; bestBin = v; }
  }
  if (bestBin < 0) bestBin = 248;
  const threshold = Math.max(0, Math.min(255, bestBin - 4));
  bgLumEl.value = threshold;
  bgLumVal.textContent = threshold;
}

function isPixelBg(idx) {
  if (mode === 'lum') {
    const L = lum[idx];
    const t = +bgLumEl.value;
    const inv = invertEl.checked;
    return inv ? (L <= t) : (L >= t);
  }
  if (colorSamples.length === 0) return false;
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

// ============================================================
//  МАСКА ФОНА
// ============================================================
function buildMask() {
  const w = imgWidth, h = imgHeight;
  const N = w * h;
  isBg = new Uint8Array(N);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (isBg[idx] || !isPixelBg(idx)) return;
    isBg[idx] = 1; queue.push(idx);
  };
  if (sourcePoints.length > 0) {
    for (const p of sourcePoints) push(p.x, p.y);
  } else {
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  }
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % w, y = (idx / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  holesFilledCount = 0;
  if (useHolesEl.checked) {
    const maxHole = +maxHoleEl.value;
    if (maxHole > 0) {
      const visited = new Uint8Array(N);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (visited[idx] || !isBg[idx]) continue;
        const pixels = [idx]; const localSeen = new Uint8Array(N); localSeen[idx] = 1;
        let touchesFrame = false, hh = 0;
        while (hh < pixels.length) {
          const ci = pixels[hh++];
          const cx = ci % w, cy = (ci / w) | 0;
          if (cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1) touchesFrame = true;
          const nb = [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]];
          for (const [nx, ny] of nb) {
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const ni = ny * w + nx;
            if (localSeen[ni] || !isBg[ni]) continue;
            localSeen[ni] = 1; pixels.push(ni);
          }
        }
        for (const pp of pixels) visited[pp] = 1;
        if (!touchesFrame && pixels.length <= maxHole) {
          for (const pp of pixels) isBg[pp] = 0;
          holesFilledCount += pixels.length;
        }
      }
    }
  }

  windowsFoundCount = 0;
  if (useWindowsEl.checked) {
    const minWin = +minWinEl.value;
    const visited = new Uint8Array(N);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx] || isBg[idx] || !isPixelBg(idx)) continue;
      const pixels = [idx]; const localSeen = new Uint8Array(N); localSeen[idx] = 1;
      let touchesBg = false, hh = 0;
      while (hh < pixels.length) {
        const ci = pixels[hh++];
        const cx = ci % w, cy = (ci / w) | 0;
        const nb = [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]];
        for (const [nx, ny] of nb) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (isBg[ni]) { touchesBg = true; continue; }
          if (localSeen[ni] || !isPixelBg(ni)) continue;
          localSeen[ni] = 1; pixels.push(ni);
        }
      }
      for (const pp of pixels) visited[pp] = 1;
      if (!touchesBg && pixels.length >= minWin) {
        for (const pp of pixels) isBg[pp] = 1;
        windowsFoundCount += pixels.length;
      }
    }
  }

  if (useSmoothEl.checked) {
    const iterations = +smoothIterEl.value;
    for (let it = 0; it < iterations; it++) smoothOnce(isBg, w, h);
  }
}

function smoothOnce(isBg, w, h) {
  const copy = isBg.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const idx = y * w + x;
    let bgCount = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      bgCount += copy[idx + dy * w + dx];
    }
    if (bgCount >= 7) isBg[idx] = 1;
    else if (bgCount <= 1) isBg[idx] = 0;
  }
}

// ============================================================
//  BBOX ПО ПЛОТНОСТИ
// ============================================================
function computeBBox() {
  const w = imgWidth, h = imgHeight;
  let minX = w, minY = h, maxX = -1, maxY = -1, charCount = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!isBg[y * w + x]) {
      charCount++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) { charBBox = null; return; }

  if (useTailsFilterEl.checked && maxX > minX && maxY > minY) {
    const colCounts = new Int32Array(w);
    const rowCounts = new Int32Array(h);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      if (!isBg[y * w + x]) { colCounts[x]++; rowCounts[y]++; }
    }
    const nzCols = [];
    for (let x = minX; x <= maxX; x++) if (colCounts[x] > 0) nzCols.push(colCounts[x]);
    nzCols.sort((a, b) => a - b);
    const medCol = nzCols[nzCols.length >> 1] || 1;
    const nzRows = [];
    for (let y = minY; y <= maxY; y++) if (rowCounts[y] > 0) nzRows.push(rowCounts[y]);
    nzRows.sort((a, b) => a - b);
    const medRow = nzRows[nzRows.length >> 1] || 1;
    const colThresh = medCol * (coreThreshEl.value / 100);
    const rowThresh = medRow * (coreThreshEl.value / 100);
    let mX = w, mY = h, MX = -1, MY = -1, cCount = 0;
    for (let y = minY; y <= maxY; y++) {
      if (rowCounts[y] < rowThresh) continue;
      for (let x = minX; x <= maxX; x++) {
        if (colCounts[x] < colThresh) continue;
        if (!isBg[y * w + x]) {
          cCount++;
          if (x < mX) mX = x;
          if (y < mY) mY = y;
          if (x > MX) MX = x;
          if (y > MY) MY = y;
        }
      }
    }
    if (MX > mX && MY > mY && (MX - mX) > 30 && (MY - mY) > 30) {
      minX = mX; minY = mY; maxX = MX; maxY = MY;
    }
  }

  charBBox = { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1, charCount };
}

// ============================================================
//  ПРЕСЕТЫ ПРОПОРЦИЙ
// ============================================================
function applyPreset(key) {
  currentPreset = key;
  const table = PROP_TABLES[key];
  fractions = DEFAULT_FRACTIONS.map(f => {
    if (f.id === 'top') return { ...f };
    return { ...f, value: table[f.id], manual: false };
  });
  [presetAnimeBtn, presetStylizedBtn, presetRealismBtn, presetChibiBtn]
    .forEach(b => b.classList.remove('active'));
  if (key === 'anime') presetAnimeBtn.classList.add('active');
  else if (key === 'stylized') presetStylizedBtn.classList.add('active');
  else if (key === 'realism') presetRealismBtn.classList.add('active');
  else if (key === 'chibi') presetChibiBtn.classList.add('active');
  const t = PROP_TABLES[key];
  const label =
    key === 'anime' ? 'аниме (5.5 голов)' :
    key === 'stylized' ? 'стилизованный' :
    key === 'realism' ? 'реализм (7.5 голов)' :
    'чиби (4 головы)';
  autoInfo.innerHTML =
    `Таблица: <b>${label}</b><br>` +
    `шея ${(t.neck*100).toFixed(0)}% · плечи ${(t.shoulder*100).toFixed(0)}% · талия ${(t.chest*100).toFixed(0)}% · ` +
    `бёдра ${(t.pelvis*100).toFixed(0)}% · колени ${(t.knee*100).toFixed(0)}% · лодыжки ${(t.ankle*100).toFixed(0)}%`;
}

// ============================================================
//  УТОЧНЕНИЕ ДОЛЕЙ ПО ПРОФИЛЮ ШИРИНЫ
// ============================================================
function refineFractionsFromProfile() {
  if (!charBBox) return;
  const w = imgWidth, h = imgHeight;
  const { minX, minY, width: bw, height: bh } = charBBox;
  const rowWidths = new Int32Array(bh);
  for (let yy = 0; yy < bh; yy++) {
    const y = minY + yy;
    let rowMinX = -1, rowMaxX = -1;
    for (let x = minX; x <= minX + bw - 1; x++) {
      if (!isBg[y * w + x]) { if (rowMinX < 0) rowMinX = x; rowMaxX = x; }
    }
    rowWidths[yy] = rowMinX < 0 ? 0 : (rowMaxX - rowMinX + 1);
  }
  const sm = new Float32Array(bh);
  for (let i = 0; i < bh; i++) {
    let s = 0, c = 0;
    for (let k = -3; k <= 3; k++) {
      const ii = i + k;
      if (ii < 0 || ii >= bh) continue;
      s += rowWidths[ii]; c++;
    }
    sm[i] = s / c;
  }
  const win = Math.max(4, Math.round(bh * 0.02));
  const refineTargets = {
    neck: 'min', shoulder: 'max', chest: 'min',
    pelvis: 'max', knee: 'min', ankle: 'min',
  };
  fractions.forEach(frac => {
    if (frac.manual) return;
    const target = refineTargets[frac.id];
    if (!target) return;
    const centerIdx = Math.round(bh * frac.value);
    const from = Math.max(4, centerIdx - win);
    const to = Math.min(bh - 5, centerIdx + win);
    if (to - from < 4) return;
    let bestI = -1, bestV = target === 'min' ? Infinity : -Infinity;
    for (let i = from; i <= to; i++) {
      const v = sm[i];
      if (target === 'min') {
        if (v > 0 && v < bestV) { bestV = v; bestI = i; }
      } else {
        if (v > bestV) { bestV = v; bestI = i; }
      }
    }
    if (bestI < 0) return;
    let sum = 0, cnt = 0;
    for (let i = from; i <= to; i++) { sum += sm[i]; cnt++; }
    const avg = sum / Math.max(1, cnt);
    const expr = target === 'min' ? (avg - bestV) / avg : (bestV - avg) / avg;
    if (expr > 0.05) {
      const newVal = bestI / bh;
      if (Math.abs(newVal - frac.value) < 0.03) frac.value = newVal;
    }
  });
  fractions.sort((a, b) => a.value - b.value);
}

// ============================================================
//  ОПРЕДЕЛЕНИЕ ТИПА ФИГУРЫ
// ============================================================
function detectFigStyle() {
  if (!charBBox) { figStyle = '—'; propStyle.textContent = '—'; return; }
  const bh = charBBox.height;
  const neckFrac = fractions.find(f => f.id === 'neck');
  const neckVal = neckFrac ? neckFrac.value : 0.13;
  const headPx = Math.max(1, Math.round(bh * neckVal));
  const heads = bh / headPx;
  let label = '';
  if (heads < 4.5) label = 'чиби / мультяшный';
  else if (heads < 6.5) label = 'аниме';
  else if (heads < 7.5) label = 'стилизованный';
  else label = 'реалистичный';
  figStyle = label;
  propStyle.textContent = `${label} (${heads.toFixed(1)} голов)`;
}

// ============================================================
//  ПРОПОРЦИИ
// ============================================================
function updateProportions() {
  if (!charBBox) return;
  const { minX, minY, width: bw, height: bh, charCount } = charBBox;
  const w = imgWidth, h = imgHeight;
  propWidth.textContent = `${bw} px`;
  propHeight.textContent = `${bh} px`;
  propAspect.textContent = (bh / bw).toFixed(3);
  propFill.textContent = `${((charCount / (bw * bh)) * 100).toFixed(1)}%`;
  const neckFrac = fractions.find(f => f.id === 'neck');
  const neckVal = neckFrac ? neckFrac.value : 0.13;
  const headPx = Math.max(1, Math.round(bh * neckVal));
  const heads = bh / headPx;
  propHeads.textContent = `${heads.toFixed(2)} (${headPx} px)`;
  const cx = minX + bw / 2, cy = minY + bh / 2;
  propCx.textContent = `${cx.toFixed(0)} px`;
  propCy.textContent = `${cy.toFixed(0)} px`;
  propOffsetX.textContent = `${((cx - w/2) / w * 100) >= 0 ? '+' : ''}${(((cx - w/2) / w) * 100).toFixed(1)}%`;
  propOffsetY.textContent = `${((cy - h/2) / h * 100) >= 0 ? '+' : ''}${(((cy - h/2) / h) * 100).toFixed(1)}%`;
  const manualCount = fractions.filter(f => f.manual).length;
  propFractions.textContent = manualCount > 0 ? `${manualCount} ручных` : 'по таблице';
  propsSummary.textContent = `${bh}×${bw} · ${heads.toFixed(2)} голов`;
}

// ============================================================
//  ПЕРСПЕКТИВА
// ============================================================
function computePerspective() {
  if (!charBBox) {
    perspMain.textContent = '—';
    perspSub.textContent = 'персонаж не определён';
    perspIcon.textContent = '○';
    contourResult = null;
    perspSummary.textContent = '—';
    return;
  }
  const w = imgWidth, h = imgHeight;
  const { minX, minY, maxX, maxY, width: bw, height: bh } = charBBox;
  const thirdH = Math.floor(bh / 3);
  const widths = [[], [], []];
  const rowEdges = [];
  for (let yy = 0; yy < bh; yy++) {
    const y = minY + yy;
    let rowMinX = -1, rowMaxX = -1;
    for (let x = minX; x <= maxX; x++) {
      if (!isBg[y * w + x]) { if (rowMinX < 0) rowMinX = x; rowMaxX = x; }
    }
    const ww = rowMinX < 0 ? 0 : (rowMaxX - rowMinX + 1);
    rowEdges.push({ y, lx: rowMinX, rx: rowMaxX, width: ww });
    if (yy < thirdH) widths[0].push(ww);
    else if (yy < thirdH * 2) widths[1].push(ww);
    else widths[2].push(ww);
  }
  const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const topW = avg(widths[0]), midW = avg(widths[1]), botW = avg(widths[2]);
  perspTopW.textContent = `${topW.toFixed(1)} px`;
  perspMidW.textContent = `${midW.toFixed(1)} px`;
  perspBotW.textContent = `${botW.toFixed(1)} px`;
  const ratio = botW > 0 ? topW / botW : 0;
  perspTopBot.textContent = ratio.toFixed(3);
  let vVerdict = '';
  if (ratio > 1.15) vVerdict = 'ракурс снизу';
  else if (ratio < 0.87) vVerdict = 'ракурс сверху';
  else vVerdict = 'фронтально';
  perspVerdict.textContent = vVerdict;

  let leftSlopes = [], rightSlopes = [];
  for (let i = 1; i < rowEdges.length; i++) {
    const a = rowEdges[i - 1], b = rowEdges[i];
    if (a.lx < 0 || b.lx < 0 || a.rx < 0 || b.rx < 0) continue;
    const dy = b.y - a.y;
    if (dy === 0) continue;
    const dlx = b.lx - a.lx, drx = b.rx - a.rx;
    if (Math.abs(dlx) > 6 || Math.abs(drx) > 6) continue;
    leftSlopes.push(dlx / dy);
    rightSlopes.push(drx / dy);
  }
  const median = arr => {
    if (!arr.length) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    return s[s.length >> 1];
  };
  const leftSlope = median(leftSlopes);
  const rightSlope = median(rightSlopes);
  const avgAngleDeg = (Math.atan(Math.abs(leftSlope)) + Math.atan(Math.abs(rightSlope))) / 2 * 180 / Math.PI;
  perspContourAngle.textContent = `${avgAngleDeg.toFixed(2)}°`;
  perspEdgeSlope.textContent = `L: ${leftSlope.toFixed(3)}, R: ${rightSlope.toFixed(3)}`;

  let vanishing = null;
  let isManual = false;
  if (manualVP) {
    vanishing = { x: manualVP.x, y: manualVP.y, insideImage: true, confidence: 1, manual: true };
    isManual = true;
  } else {
    vanishing = findVanishingPoint(rowEdges);
    if (vanishing) vanishing.manual = false;
  }
  if (vanishing) {
    const inside = vanishing.x >= 0 && vanishing.x < w && vanishing.y >= 0 && vanishing.y < h;
    vanishing.insideImage = inside;
    const distX = Math.max(0, Math.max(-vanishing.x, vanishing.x - w));
    const distY = Math.max(0, Math.max(-vanishing.y, vanishing.y - h));
    const dist = Math.sqrt(distX * distX + distY * distY);
    perspVanishing.textContent = `x=${vanishing.x.toFixed(0)}, y=${vanishing.y.toFixed(0)}`
      + (inside ? ' (в кадре)' : ' (вне)') + (isManual ? ' · ручная' : '');
    perspVPDist.textContent = inside ? '0' : `${dist.toFixed(0)} px от края`;
    perspConfidence.textContent = isManual ? '100% (ручная)' : `${(vanishing.confidence * 100).toFixed(0)}%`;
  } else {
    perspVanishing.textContent = '—';
    perspVPDist.textContent = '—';
    perspConfidence.textContent = 'не найдена';
  }
  contourResult = { leftSlope, rightSlope, avgAngleDeg, vanishing, ratio, vVerdict };

  const shFrac = fractions.find(f => f.id === 'shoulder');
  const plFrac = fractions.find(f => f.id === 'pelvis');
  const shoulderY = minY + Math.round(bh * (shFrac ? shFrac.value : 0.20));
  const pelvisY = minY + Math.round(bh * (plFrac ? plFrac.value : 0.48));
  const edgeAt = (y) => {
    let lx = -1, rx = -1;
    for (let x = minX; x <= maxX; x++) {
      if (!isBg[y * w + x]) { if (lx < 0) lx = x; rx = x; }
    }
    return { lx, rx };
  };
  const avgCenterAround = (y) => {
    let sx = 0, n = 0;
    for (let dy = -4; dy <= 4; dy++) {
      const e = edgeAt(y + dy);
      if (e.lx < 0) continue;
      sx += (e.lx + e.rx) / 2;
      n++;
    }
    return n ? sx / n : 0;
  };
  const shOffset = avgCenterAround(shoulderY) - (minX + bw / 2);
  const plOffset = avgCenterAround(pelvisY) - (minX + bw / 2);
  perspShoulder.textContent = `${shOffset >= 0 ? '+' : ''}${shOffset.toFixed(1)} px`;
  perspPelvis.textContent = `${plOffset >= 0 ? '+' : ''}${plOffset.toFixed(1)} px`;
  const diff = shOffset - plOffset;
  perspDiff.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} px`;
  let tiltVerdict = '';
  if (Math.abs(diff) < 4) tiltVerdict = 'вертикально';
  else if (diff > 0) tiltVerdict = 'наклон вправо';
  else tiltVerdict = 'наклон влево';
  perspTilt.textContent = tiltVerdict;

  let main = '', icon = '○';
  if (vVerdict.includes('снизу')) { main = 'Ракурс снизу'; icon = '▲'; }
  else if (vVerdict.includes('сверху')) { main = 'Ракурс сверху'; icon = '▼'; }
  else { main = 'Фронтально'; icon = '○'; }
  if (tiltVerdict.includes('вправо')) main += ' · вправо';
  else if (tiltVerdict.includes('влево')) main += ' · влево';
  perspMain.textContent = main;
  perspIcon.textContent = icon;
  let sub = `верх/низ = ${ratio.toFixed(2)} · контур ${avgAngleDeg.toFixed(1)}°`;
  if (vanishing) sub += ` · ТС ${isManual ? 'ручная' : (vanishing.confidence * 100).toFixed(0) + '%'}`;
  perspSub.textContent = sub;
  perspSummary.textContent = vVerdict;
}

function findVanishingPoint(rowEdges) {
  const valid = rowEdges.filter(e => e.lx >= 0 && e.rx >= 0);
  if (valid.length < 20) return null;
  const linReg = (points) => {
    const n = points.length;
    let sy = 0, sx = 0, syy = 0, sxy = 0;
    for (const p of points) {
      sy += p.y; sx += p.x;
      syy += p.y * p.y; sxy += p.y * p.x;
    }
    const denom = n * syy - sy * sy;
    if (Math.abs(denom) < 1e-6) return null;
    const a = (n * sxy - sy * sx) / denom;
    const b = (sx - a * sy) / n;
    return { a, b };
  };
  const L = linReg(valid.map(e => ({ y: e.y, x: e.lx })));
  const R = linReg(valid.map(e => ({ y: e.y, x: e.rx })));
  if (!L || !R) return null;
  const dA = L.a - R.a;
  if (Math.abs(dA) < 0.001) return null;
  const vy = (R.b - L.b) / dA;
  const vx = L.a * vy + L.b;
  const insideImage = (vx >= 0 && vx < imgWidth && vy >= 0 && vy < imgHeight);
  const angleL = Math.abs(L.a), angleR = Math.abs(R.a);
  const tiltScore = Math.min(1, (angleL + angleR) / 1.2);
  let distScore = 1;
  if (!insideImage) {
    const dx = Math.max(0, Math.max(-vx, vx - imgWidth));
    const dy = Math.max(0, Math.max(-vy, vy - imgHeight));
    const dist = Math.sqrt(dx * dx + dy * dy);
    distScore = Math.max(0, 1 - dist / (imgWidth + imgHeight));
  }
  return { x: vx, y: vy, insideImage, confidence: Math.max(0, Math.min(1, tiltScore * distScore)), L, R };
}

// ============================================================
//  СВЯЗЬ ПРОПОРЦИЙ И ПЕРСПЕКТИВЫ
// ============================================================
function computeLink() {
  if (!charBBox || !contourResult) {
    linkMeasured.textContent = '—';
    linkCorrected.textContent = '—';
    linkTableBody.innerHTML = '';
    linkResult = null;
    linkSummary.textContent = '—';
    return;
  }
  const bh = charBBox.height;
  const ratio = contourResult.ratio || 1;
  const vanishing = contourResult.vanishing;
  const hasVP = vanishing && (vanishing.manual || vanishing.confidence > 0.25);
  const neckFrac = fractions.find(f => f.id === 'neck');
  const neckVal = neckFrac ? neckFrac.value : 0.13;
  const headPx = Math.max(1, Math.round(bh * neckVal));
  const measuredHeads = bh / headPx;
  const factor = ratio;
  let correctedHeads, methodUsed, topFix, botFix;
  if (hasVP) {
    const cx = charBBox.minX + charBBox.width / 2;
    const cy = charBBox.minY + charBBox.height / 2;
    const vpDist = Math.sqrt((vanishing.x - cx) ** 2 + (vanishing.y - cy) ** 2);
    const refDist = Math.max(bh, vpDist);
    const perspK = Math.max(0.6, Math.min(1.6, refDist / Math.max(1, vpDist)));
    correctedHeads = measuredHeads / Math.sqrt(perspK);
    methodUsed = `по ТС (k=${perspK.toFixed(2)})`;
    topFix = (1 / Math.sqrt(perspK)).toFixed(3);
    botFix = Math.sqrt(perspK).toFixed(3);
  } else {
    correctedHeads = measuredHeads / Math.sqrt(factor);
    methodUsed = `линейная (k=${factor.toFixed(2)})`;
    topFix = (1 / Math.sqrt(factor)).toFixed(3);
    botFix = Math.sqrt(factor).toFixed(3);
  }
  const tF = parseFloat(topFix), bF = parseFloat(botFix);
  const correctedFractions = fractions.map(frac => {
    const t = frac.value;
    const k = tF * (1 - t) + bF * t;
    return { ...frac, correctedRaw: t / k };
  });
  const maxRaw = Math.max(...correctedFractions.map(f => f.correctedRaw));
  const normScale = maxRaw > 0 ? 0.95 / maxRaw : 1;
  correctedFractions.forEach(f => {
    f.correctedValue = Math.max(0, Math.min(0.98, f.correctedRaw * normScale));
  });
  correctedFractions.sort((a, b) => a.correctedValue - b.correctedValue);
  for (let i = 1; i < correctedFractions.length; i++) {
    if (correctedFractions[i].correctedValue <= correctedFractions[i-1].correctedValue) {
      correctedFractions[i].correctedValue = correctedFractions[i-1].correctedValue + 0.005;
    }
  }
  linkResult = { measuredHeads, correctedHeads, factor, methodUsed, topFix, botFix, hasVP, correctedFractions };
  linkMeasured.textContent = measuredHeads.toFixed(2);
  linkCorrected.textContent = correctedHeads.toFixed(2);
  linkAspect.textContent = contourResult.vVerdict;
  linkFactor.textContent = factor.toFixed(3);
  linkMethodUsed.textContent = methodUsed;
  linkTopFix.textContent = topFix;
  linkBotFix.textContent = botFix;
  linkVPInFrame.textContent = hasVP ? 'да' : 'нет';
  linkSummary.textContent = `${measuredHeads.toFixed(2)} → ${correctedHeads.toFixed(2)}`;
  linkTableBody.innerHTML = '';
  for (const f of correctedFractions) {
    const tr = document.createElement('tr');
    const delta = (f.correctedValue - f.value) * 100;
    const sign = delta >= 0 ? '+' : '';
    tr.innerHTML = `
      <td>${f.name}</td>
      <td class="num">${(f.value * 100).toFixed(1)}%</td>
      <td class="num fixed">${(f.correctedValue * 100).toFixed(1)}%</td>
      <td class="num">${sign}${delta.toFixed(1)}</td>`;
    linkTableBody.appendChild(tr);
  }
}

// ============================================================
//  СИММЕТРИЯ
// ============================================================
function computeSymmetry() {
  if (!charBBox) { symmetryResult = null; symmSummary.textContent = '—'; return; }
  const w = imgWidth, h = imgHeight;
  const { minX, minY, width: bw, height: bh } = charBBox;
  const cx = minX + bw / 2;
  const shFrac = fractions.find(f => f.id === 'shoulder');
  const plFrac = fractions.find(f => f.id === 'pelvis');
  const shVal = shFrac ? shFrac.value : 0.20;
  const plVal = plFrac ? plFrac.value : 0.48;
  const rowData = [];
  for (let yy = 0; yy < bh; yy++) {
    const y = minY + yy;
    let leftCount = 0, rightCount = 0;
    for (let x = minX; x <= minX + bw - 1; x++) {
      if (!isBg[y * w + x]) {
        if (x < cx) leftCount++;
        else rightCount++;
      }
    }
    let rowSymm;
    if (leftCount === 0 && rightCount === 0) rowSymm = 1;
    else if (leftCount === 0 || rightCount === 0) rowSymm = 0;
    else rowSymm = Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount);
    rowData.push({ y: yy, leftCount, rightCount, rowSymm });
  }
  const nonEmpty = rowData.filter(r => r.leftCount > 0 || r.rightCount > 0);
  const totalSymm = nonEmpty.length ? nonEmpty.reduce((s, r) => s + r.rowSymm, 0) / nonEmpty.length : 0;
  const zone = (a, b) => {
    const slice = rowData.filter(r => r.y >= a && r.y < b && (r.leftCount > 0 || r.rightCount > 0));
    return slice.length ? slice.reduce((s, r) => s + r.rowSymm, 0) / slice.length : 0;
  };
  const topEnd = Math.floor(bh * shVal);
  const midEnd = Math.floor(bh * plVal);
  const zTop = zone(0, topEnd), zMid = zone(topEnd, midEnd), zBot = zone(midEnd, bh);
  symmetryResult = { total: totalSymm, top: zTop, mid: zMid, bot: zBot };
  const pct = v => (v * 100).toFixed(1) + '%';
  symmScore.textContent = pct(totalSymm);
  const cls = totalSymm > 0.9 ? 'good' : totalSymm > 0.75 ? '' : totalSymm > 0.6 ? 'warn' : 'bad';
  symmBar.className = 'scale-fill ' + cls;
  symmBar.style.width = (totalSymm * 100) + '%';
  symmTop.textContent = pct(zTop); symmMid.textContent = pct(zMid); symmBot.textContent = pct(zBot);
  const clsT = zTop > 0.9 ? 'good' : zTop > 0.75 ? '' : zTop > 0.6 ? 'warn' : 'bad';
  const clsM = zMid > 0.9 ? 'good' : zMid > 0.75 ? '' : zMid > 0.6 ? 'warn' : 'bad';
  const clsB = zBot > 0.9 ? 'good' : zBot > 0.75 ? '' : zBot > 0.6 ? 'warn' : 'bad';
  symmTopBar.className = 'scale-fill ' + clsT; symmTopBar.style.width = (zTop * 100) + '%';
  symmMidBar.className = 'scale-fill ' + clsM; symmMidBar.style.width = (zMid * 100) + '%';
  symmBotBar.className = 'scale-fill ' + clsB; symmBotBar.style.width = (zBot * 100) + '%';
  let verdict = '';
  if (totalSymm > 0.95) verdict = 'идеальная';
  else if (totalSymm > 0.85) verdict = 'почти симметрично';
  else if (totalSymm > 0.7) verdict = 'лёгкая асимметрия';
  else if (totalSymm > 0.55) verdict = 'заметная асимметрия';
  else verdict = 'сильная асимметрия';
  symmVerdict.textContent = verdict;
  symmSummary.textContent = pct(totalSymm);
}

// ============================================================
//  СУСТАВЫ
// ============================================================
function computeJoints() {
  if (!charBBox) { jointsListRender([]); jointsSummary.textContent = '—'; return; }
  const w = imgWidth, h = imgHeight;
  const { minX, minY, width: bw, height: bh } = charBBox;
  const joints = fractions.filter(f => f.joint).map(f => {
    const y = minY + Math.round(bh * f.value);
    let xMin = -1, xMax = -1;
    if (y >= 0 && y < h) {
      for (let x = minX; x <= minX + bw - 1; x++) {
        if (!isBg[y * w + x]) { if (xMin < 0) xMin = x; xMax = x; }
      }
    }
    const cx = xMin >= 0 ? (xMin + xMax) / 2 : minX + bw / 2;
    return {
      id: f.id, name: f.name, x: cx, yImg: y,
      pctHeight: (f.value * 100).toFixed(1),
      manual: !!f.manual,
    };
  });
  jointsListRender(joints);
}

function jointsListRender(arr) {
  jointList.innerHTML = '';
  jointsSummary.textContent = `${arr.length} (= долей)`;
  if (arr.length === 0) {
    jointList.innerHTML = '<div class="joint-item"><span class="name">Нет долей-суставов</span><span class="coords">—</span></div>';
    return;
  }
  arr.forEach((j, i) => {
    const el = document.createElement('div');
    el.className = 'joint-item';
    const mark = j.manual ? ' ✎' : '';
    el.innerHTML = `<span class="name">${i+1}. ${j.name}${mark}</span>`
      + `<span class="coords">${j.pctHeight}% · x=${j.x.toFixed(0)}</span>`;
    jointList.appendChild(el);
  });
}

// ============================================================
//  ПАЛИТРА
// ============================================================
function computePalette() {
  if (!charBBox) { paletteResult = null; paletteGrid.innerHTML = ''; paletteSummary.textContent = '—'; return; }
  const w = imgWidth, h = imgHeight;
  const { minX, minY, width: bw, height: bh } = charBBox;
  const d = imgDataRef.data;
  const count = +paletteCountEl.value;
  const SHIFT = 3;
  const buckets = new Map();
  let total = 0;
  for (let y = minY; y < minY + bh; y++) {
    for (let x = minX; x < minX + bw; x++) {
      const idx = y * w + x;
      if (isBg[idx]) continue;
      const p = idx * 4;
      if (d[p + 3] < 20) continue;
      const r = d[p], g = d[p + 1], b = d[p + 2];
      const key = ((r >> SHIFT) << 10) | ((g >> SHIFT) << 5) | (b >> SHIFT);
      let e = buckets.get(key);
      if (!e) { e = { n: 0, r: 0, g: 0, b: 0 }; buckets.set(key, e); }
      e.n++; e.r += r; e.g += g; e.b += b;
      total++;
    }
  }
  const arr = [];
  for (const e of buckets.values()) {
    arr.push({ r: Math.round(e.r / e.n), g: Math.round(e.g / e.n), b: Math.round(e.b / e.n), n: e.n });
  }
  arr.sort((a, b) => b.n - a.n);
  const top = arr.slice(0, count);
  paletteResult = { colors: top, total };
  renderPalette(top, total);
  paletteSummary.textContent = `${top.length} цветов`;
}

function renderPalette(colors, total) {
  paletteGrid.innerHTML = '';
  if (colors.length === 0) {
    paletteGrid.innerHTML = '<div style="color:#8b93a1;font-size:12px;">Цвета не найдены.</div>';
    return;
  }
  colors.forEach(c => {
    const pct = (c.n / total * 100).toFixed(1);
    const hex = rgbToHex(c.r, c.g, c.b);
    const chip = document.createElement('div');
    chip.className = 'palette-chip';
    chip.innerHTML = `
      <div class="color-block" style="background:rgb(${c.r},${c.g},${c.b})"></div>
      <div class="info-block">
        <div class="hex">${hex}</div>
        <div class="pct">${pct}%</div>
      </div>`;
    chip.addEventListener('click', () => {
      navigator.clipboard.writeText(hex).catch(() => {});
      chip.style.borderColor = '#40d080';
      setTimeout(() => chip.style.borderColor = '', 400);
    });
    paletteGrid.appendChild(chip);
  });
}

function rgbToHex(r, g, b) {
  const h = v => v.toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

// ============================================================
//  ОТРИСОВКА
// ============================================================
function drawOverlay() {
  const w = imgWidth, h = imgHeight;
  if (!w) return;
  overlayCtx.clearRect(0, 0, w, h);
  const img = overlayCtx.createImageData(w, h);
  const data = img.data;
  for (let i = 0, j = 0; i < w * h; i++, j += 4) {
    if (!isBg[i]) {
      data[j] = 255; data[j+1] = 60; data[j+2] = 60; data[j+3] = 100;
    }
  }
  overlayCtx.putImageData(img, 0, 0);

  if (charBBox) {
    overlayCtx.strokeStyle = 'rgba(0, 200, 255, 0.9)';
    overlayCtx.lineWidth = Math.max(2, Math.round(imgWidth / 400));
    overlayCtx.setLineDash([10, 6]);
    overlayCtx.strokeRect(charBBox.minX, charBBox.minY, charBBox.width, charBBox.height);
    overlayCtx.setLineDash([]);

    for (const frac of fractions) {
      const y = charBBox.minY + Math.round(charBBox.height * frac.value);
      if (y < 0 || y >= imgHeight) continue;
      overlayCtx.strokeStyle = frac.color;
      overlayCtx.globalAlpha = frac.joint ? 1 : 0.55;
      overlayCtx.lineWidth = frac.joint
        ? Math.max(3, Math.round(imgWidth / 500))
        : Math.max(1, Math.round(imgWidth / 800));
      overlayCtx.beginPath();
      overlayCtx.moveTo(charBBox.minX, y);
      overlayCtx.lineTo(charBBox.maxX + 1, y);
      overlayCtx.stroke();
      overlayCtx.globalAlpha = 1;
      if (frac.joint || editFractionsMode) {
        const fs = Math.max(11, Math.round(imgWidth / 70));
        overlayCtx.font = `bold ${fs}px system-ui`;
        const mark = frac.manual ? ' ✎' : '';
        const label = frac.name + mark;
        const tw = overlayCtx.measureText(label).width;
        overlayCtx.fillStyle = 'rgba(0,0,0,0.7)';
        overlayCtx.fillRect(charBBox.maxX + 6, y - fs, tw + 8, fs + 4);
        overlayCtx.fillStyle = frac.color;
        overlayCtx.fillText(label, charBBox.maxX + 10, y - 2);
      }
    }

    if (showCorrectedEl.checked && linkResult) {
      overlayCtx.strokeStyle = 'rgba(185, 255, 128, 0.9)';
      overlayCtx.setLineDash([6, 5]);
      overlayCtx.lineWidth = Math.max(1.5, Math.round(imgWidth / 700));
      for (const f of linkResult.correctedFractions) {
        const y = charBBox.minY + Math.round(charBBox.height * f.correctedValue);
        if (y < 0 || y >= imgHeight) continue;
        overlayCtx.beginPath();
        overlayCtx.moveTo(charBBox.minX - 20, y);
        overlayCtx.lineTo(charBBox.maxX + 20, y);
        overlayCtx.stroke();
      }
      overlayCtx.setLineDash([]);
    }

    if (showSymmEl.checked && symmetryResult) {
      const cx = charBBox.minX + charBBox.width / 2;
      overlayCtx.strokeStyle = 'rgba(185, 255, 128, 0.85)';
      overlayCtx.lineWidth = Math.max(2, Math.round(imgWidth / 500));
      overlayCtx.setLineDash([8, 6]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(cx, charBBox.minY);
      overlayCtx.lineTo(cx, charBBox.maxY + 1);
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);
    }
  }

  if (showJointsEl.checked) {
    const w2 = imgWidth, h2 = imgHeight;
    const minX = charBBox ? charBBox.minX : 0;
    const minY = charBBox ? charBBox.minY : 0;
    const bw = charBBox ? charBBox.width : w2;
    const bh = charBBox ? charBBox.height : h2;
    fractions.filter(f => f.joint).forEach(f => {
      const y = minY + Math.round(bh * f.value);
      let xMin = -1, xMax = -1;
      if (y >= 0 && y < h2) {
        for (let x = minX; x <= minX + bw - 1; x++) {
          if (!isBg[y * w2 + x]) { if (xMin < 0) xMin = x; xMax = x; }
        }
      }
      const cx = xMin >= 0 ? (xMin + xMax) / 2 : minX + bw / 2;
      overlayCtx.beginPath();
      overlayCtx.arc(cx, y, 8, 0, Math.PI * 2);
      overlayCtx.fillStyle = f.manual ? '#ffcc00' : '#ff60ff';
      overlayCtx.fill();
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeStyle = '#000';
      overlayCtx.stroke();
      if (editJointsMode || f.manual) {
        const fs = Math.max(10, Math.round(imgWidth / 90));
        overlayCtx.font = `bold ${fs}px system-ui`;
        const label = f.name + (f.manual ? ' ✎' : '');
        const tw = overlayCtx.measureText(label).width;
        overlayCtx.fillStyle = 'rgba(0,0,0,0.7)';
        overlayCtx.fillRect(cx + 12, y - fs, tw + 8, fs + 4);
        overlayCtx.fillStyle = f.manual ? '#ffcc00' : '#ff80ff';
        overlayCtx.fillText(label, cx + 16, y - 2);
      }
    });
  }

  if (contourResult && contourResult.vanishing && showPerspEl.checked) {
    const v = contourResult.vanishing;
    const isManual = v.manual === true;
    if (charBBox) {
      const corners = [
        { x: charBBox.minX, y: charBBox.minY },
        { x: charBBox.maxX, y: charBBox.minY },
        { x: charBBox.minX, y: charBBox.maxY },
        { x: charBBox.maxX, y: charBBox.maxY },
      ];
      overlayCtx.strokeStyle = isManual ? 'rgba(120, 255, 120, 0.85)' : 'rgba(255, 120, 255, 0.7)';
      overlayCtx.lineWidth = 1.5;
      overlayCtx.setLineDash([6, 4]);
      for (const c of corners) {
        overlayCtx.beginPath();
        overlayCtx.moveTo(c.x, c.y);
        overlayCtx.lineTo(v.x, v.y);
        overlayCtx.stroke();
      }
      overlayCtx.setLineDash([]);
    }
    if (v.insideImage) {
      overlayCtx.beginPath();
      overlayCtx.arc(v.x, v.y, 9, 0, Math.PI * 2);
      overlayCtx.fillStyle = isManual ? '#60ff60' : '#ff60ff';
      overlayCtx.fill();
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeStyle = '#000';
      overlayCtx.stroke();
    } else {
      drawVanishingArrow(v);
    }
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

function drawVanishingArrow(v) {
  const w = imgWidth, h = imgHeight;
  const clampX = Math.max(0, Math.min(w, v.x));
  const clampY = Math.max(0, Math.min(h, v.y));
  const distL = clampX, distR = w - clampX, distT = clampY, distB = h - clampY;
  const minDist = Math.min(distL, distR, distT, distB);
  let ex = clampX, ey = clampY, nx = 0, ny = 0;
  if (minDist === distL) { ex = 0; ey = Math.max(20, Math.min(h - 20, v.y)); nx = -1; ny = 0; }
  else if (minDist === distR) { ex = w; ey = Math.max(20, Math.min(h - 20, v.y)); nx = 1; ny = 0; }
  else if (minDist === distT) { ex = Math.max(20, Math.min(w - 20, v.x)); ey = 0; nx = 0; ny = -1; }
  else { ex = Math.max(20, Math.min(w - 20, v.x)); ey = h; nx = 0; ny = 1; }

  const arrowLen = Math.max(20, Math.round(imgWidth / 25));
  const arrowWidth = Math.max(8, Math.round(imgWidth / 60));
  const tipX = ex + nx * arrowLen * 0.7;
  const tipY = ey + ny * arrowLen * 0.7;
  const baseX = ex - nx * arrowLen * 0.3;
  const baseY = ey - ny * arrowLen * 0.3;

  overlayCtx.fillStyle = 'rgba(255, 100, 255, 0.9)';
  overlayCtx.strokeStyle = 'rgba(0,0,0,0.9)';
  overlayCtx.lineWidth = 2;
  overlayCtx.beginPath();
  overlayCtx.moveTo(tipX, tipY);
  overlayCtx.lineTo(baseX - ny * arrowWidth, baseY + nx * arrowWidth);
  overlayCtx.lineTo(baseX + ny * arrowWidth, baseY - nx * arrowWidth);
  overlayCtx.closePath();
  overlayCtx.fill();
  overlayCtx.stroke();

  const dist = Math.sqrt((v.x - w/2) ** 2 + (v.y - h/2) ** 2);
  let distLabel;
  if (dist > 50000) distLabel = 'ТС очень далеко →';
  else distLabel = `ТС ${dist.toFixed(0)} px →`;
  const fs = Math.max(12, Math.round(imgWidth / 60));
  overlayCtx.font = `bold ${fs}px system-ui`;
  const tw = overlayCtx.measureText(distLabel).width;
  const pad = 6;
  let lx = ex - tw / 2 - nx * 20;
  let ly = ey - fs - 8 - ny * 20;
  if (lx < 4) lx = 4;
  if (lx + tw + pad * 2 > w - 4) lx = w - tw - pad * 2 - 4;
  if (ly - fs - pad < 4) ly = ey + ny * 20 + fs + 8 + pad;
  overlayCtx.fillStyle = 'rgba(0,0,0,0.8)';
  overlayCtx.fillRect(lx - pad, ly - fs - pad, tw + pad * 2, fs + pad * 2);
  overlayCtx.fillStyle = '#ff80ff';
  overlayCtx.fillText(distLabel, lx, ly - 1);
}

function drawHistogram() {
  if (!histogram) return;
  const rect = histoCanvas.getBoundingClientRect();
  if (rect.width === 0) return;
  const dpr = window.devicePixelRatio || 1;
  histoCanvas.width = Math.max(100, Math.round(rect.width * dpr));
  histoCanvas.height = Math.max(60, Math.round(rect.height * dpr));
  histoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width, H = rect.height;
  histoCtx.clearRect(0, 0, W, H);
  let maxCount = 0;
  for (let v = 1; v < 255; v++) if (histogram[v] > maxCount) maxCount = histogram[v];
  if (maxCount === 0) maxCount = 1;
  const barW = W / 256;
  histoCtx.fillStyle = '#3a4450';
  for (let v = 0; v < 256; v++) {
    const hh = (histogram[v] / maxCount) * (H - 4);
    histoCtx.fillRect(v * barW, H - hh, Math.max(1, barW), hh);
  }
  if (mode === 'lum') {
    const threshold = +bgLumEl.value;
    const inv = invertEl.checked;
    histoCtx.fillStyle = 'rgba(64, 160, 255, 0.45)';
    if (!inv) {
      for (let v = threshold; v < 256; v++) {
        const hh = (histogram[v] / maxCount) * (H - 4);
        histoCtx.fillRect(v * barW, H - hh, Math.max(1, barW), hh);
      }
    } else {
      for (let v = 0; v <= threshold; v++) {
        const hh = (histogram[v] / maxCount) * (H - 4);
        histoCtx.fillRect(v * barW, H - hh, Math.max(1, barW), hh);
      }
    }
    const px = threshold * barW;
    histoCtx.strokeStyle = '#ffcc00'; histoCtx.lineWidth = 2;
    histoCtx.beginPath(); histoCtx.moveTo(px, 0); histoCtx.lineTo(px, H); histoCtx.stroke();
  }
  histoCtx.fillStyle = '#8b93a1'; histoCtx.font = '10px system-ui';
  histoCtx.textAlign = 'left'; histoCtx.fillText('0', 4, H - 4);
  histoCtx.textAlign = 'right'; histoCtx.fillText('255', W - 4, H - 4);
  const sm = new Float32Array(256);
  for (let v = 0; v < 256; v++) {
    let s = 0;
    for (let k = -3; k <= 3; k++) {
      const vv = v + k;
      if (vv >= 0 && vv < 256) s += histogram[vv];
    }
    sm[v] = s;
  }
  let valleyV = -1, valleyScore = Infinity;
  for (let v = 50; v <= 250; v++) if (sm[v] < valleyScore) { valleyScore = sm[v]; valleyV = v; }
  histoValley.textContent = valleyV >= 0 ? `${valleyV}` : '—';
  histoSummary.textContent = mode === 'lum' ? `порог ${bgLumEl.value}` : `${colorSamples.length} цв.`;
}

function renderSamplesList() {
  samplesSummary.textContent = `(${colorSamples.length})`;
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
      colorSamples.splice(i, 1); renderSamplesList();
      if (lum) rebuildAll();
    });
    samplesList.appendChild(chip);
  });
}

function updateInfo() {
  if (!lum) return;
  const N = imgWidth * imgHeight;
  let bg = 0, char_ = 0;
  for (let i = 0; i < N; i++) { if (isBg[i]) bg++; else char_++; }
  infoSize.textContent = `${imgWidth} × ${imgHeight}`;
  infoModeMode.textContent = mode === 'lum' ? 'яркость' : 'цвет';
  infoBgPct.textContent = ((bg / N) * 100).toFixed(1) + '%';
  infoCharPct.textContent = ((char_ / N) * 100).toFixed(1) + '%';
  infoHoles.textContent = holesFilledCount.toLocaleString('ru-RU') + ' px';
  infoWindows.textContent = windowsFoundCount.toLocaleString('ru-RU') + ' px';
  infoPointsCount.textContent = `(${sourcePoints.length})`;
  infoSummary.textContent = `${imgWidth}×${imgHeight}`;
  if (sourcePoints.length === 0) {
    pointList.innerHTML = '<div style="color:#8b93a1;font-size:12px;padding:4px 0;">Точки не заданы.</div>';
  } else {
    pointList.innerHTML = '';
    sourcePoints.forEach((p, i) => {
      const item = document.createElement('div');
      item.className = 'point-item' + (i === selectedPointIndex ? ' selected' : '');
      const left = document.createElement('div');
      left.className = 'left';
      const dotColor = (i === selectedPointIndex) ? '#ff5050' : '#ffcc00';
      left.innerHTML = `<span class="dot" style="background:${dotColor}"></span><span>#${i + 1}</span><span class="coords">x=${p.x}, y=${p.y}</span>`;
      left.addEventListener('click', () => { selectedPointIndex = i; drawOverlay(); updateInfo(); });
      const btn = document.createElement('button');
      btn.className = 'remove'; btn.textContent = '✕';
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); removePoint(i); });
      item.appendChild(left); item.appendChild(btn);
      pointList.appendChild(item);
    });
  }
}

function removePoint(index) {
  sourcePoints.splice(index, 1);
  if (selectedPointIndex === index) selectedPointIndex = -1;
  else if (selectedPointIndex > index) selectedPointIndex--;
  rebuildAll();
}

// ============================================================
//  ПЕРЕСЧЁТ
// ============================================================
function rebuildAll() {
  if (!lum) return;
  buildMask();
  computeBBox();
  if (useTableEl.checked) refineFractionsFromProfile();
  detectFigStyle();
  updateProportions();
  computePerspective();
  computeLink();
  computeSymmetry();
  computeJoints();
  computePalette();
  drawOverlay();
  drawHistogram();
  updateInfo();
}

// ============================================================
//  ПРАВКА ДОЛЕЙ
// ============================================================
function clientToImage(clientX, clientY) {
  const rect = baseCanvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (imgWidth / rect.width),
    y: (clientY - rect.top) * (imgHeight / rect.height),
  };
}
function findFractionAtY(y) {
  if (!charBBox) return null;
  let best = null, bestDist = Infinity;
  const thresh = Math.max(12, imgHeight * 0.025);
  for (const frac of fractions) {
    const lineY = charBBox.minY + charBBox.height * frac.value;
    const d = Math.abs(lineY - y);
    if (d < bestDist) { bestDist = d; best = frac; }
  }
  return bestDist <= thresh ? best : null;
}
function findJointAt(x, y) {
  if (!charBBox) return -1;
  const { minX, minY, width: bw, height: bh } = charBBox;
  let best = -1, bestDist = Infinity;
  const thresh = Math.max(20, imgWidth * 0.04);
  fractions.forEach((f, i) => {
    if (!f.joint) return;
    const fy = minY + Math.round(bh * f.value);
    let xMin = -1, xMax = -1;
    if (fy >= 0 && fy < imgHeight) {
      for (let xx = minX; xx <= minX + bw - 1; xx++) {
        if (!isBg[fy * imgWidth + xx]) { if (xMin < 0) xMin = xx; xMax = xx; }
      }
    }
    const cx = xMin >= 0 ? (xMin + xMax) / 2 : minX + bw / 2;
    const d = Math.sqrt((cx - x) ** 2 + (fy - y) ** 2);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return bestDist <= thresh ? best : -1;
}

baseCanvas.addEventListener('mousedown', (e) => {
  if (!charBBox || !lum) return;
  const p = clientToImage(e.clientX, e.clientY);
  if (editJointsMode) {
    const idx = findJointAt(p.x, p.y);
    if (idx >= 0) {
      const frac = fractions[idx];
      dragging = { type: 'fraction', id: frac.id, startY: p.y, startValue: frac.value };
      baseCanvas.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }
  }
  if (editFractionsMode) {
    const frac = findFractionAtY(p.y);
    if (frac) {
      dragging = { type: 'fraction', id: frac.id, startY: p.y, startValue: frac.value };
      baseCanvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }
});

function handleDragMove(p) {
  if (!dragging || !charBBox) return;
  const dy = (p.y - dragging.startY) / charBBox.height;
  let newValue = dragging.startValue + dy;
  const curIdx = fractions.findIndex(f => f.id === dragging.id);
  const above = fractions[curIdx - 1];
  const below = fractions[curIdx + 1];
  const minV = above ? above.value + 0.01 : 0.01;
  const maxV = below ? below.value - 0.01 : 0.99;
  newValue = Math.max(minV, Math.min(maxV, newValue));
  const frac = fractions.find(f => f.id === dragging.id);
  if (frac) { frac.value = newValue; frac.manual = true; }
  updateProportions();
  computePerspective();
  computeLink();
  computeSymmetry();
  computeJoints();
  drawOverlay();
}

window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  handleDragMove(clientToImage(e.clientX, e.clientY));
});
window.addEventListener('mouseup', () => {
  if (dragging) {
    dragging = null;
    if (editJointsMode) baseCanvas.style.cursor = 'grab';
    else if (editFractionsMode) baseCanvas.style.cursor = 'row-resize';
    else if (manualVPMode) baseCanvas.style.cursor = 'cell';
    else baseCanvas.style.cursor = 'crosshair';
  }
});

baseCanvas.addEventListener('mousemove', (e) => {
  if (dragging) return;
  if (!lum) return;
  if (manualVPMode) { baseCanvas.style.cursor = 'cell'; return; }
  if (editJointsMode) {
    const p = clientToImage(e.clientX, e.clientY);
    const idx = findJointAt(p.x, p.y);
    baseCanvas.style.cursor = idx >= 0 ? 'grab' : 'crosshair';
    return;
  }
  if (editFractionsMode && charBBox) {
    const p = clientToImage(e.clientX, e.clientY);
    baseCanvas.style.cursor = findFractionAtY(p.y) ? 'row-resize' : 'crosshair';
    return;
  }
  baseCanvas.style.cursor = 'crosshair';
});

// TOUCH
baseCanvas.addEventListener('touchstart', (e) => {
  if (!charBBox || !lum || e.touches.length !== 1) return;
  const t = e.touches[0];
  const p = clientToImage(t.clientX, t.clientY);
  if (editJointsMode) {
    const idx = findJointAt(p.x, p.y);
    if (idx >= 0) {
      const frac = fractions[idx];
      dragging = { type: 'fraction', id: frac.id, startY: p.y, startValue: frac.value };
      e.preventDefault(); return;
    }
  }
  if (editFractionsMode) {
    const frac = findFractionAtY(p.y);
    if (frac) {
      dragging = { type: 'fraction', id: frac.id, startY: p.y, startValue: frac.value };
      e.preventDefault();
    }
  }
}, { passive: false });
baseCanvas.addEventListener('touchmove', (e) => {
  if (!dragging || e.touches.length !== 1) return;
  const t = e.touches[0];
  handleDragMove(clientToImage(t.clientX, t.clientY));
  e.preventDefault();
}, { passive: false });
baseCanvas.addEventListener('touchend', () => { dragging = null; });

// ============================================================
//  РЕЖИМЫ И КНОПКИ
// ============================================================
function resetOtherModes(except) {
  if (except !== 'fractions') { editFractionsMode = false; editFractionsBtn.classList.remove('active'); }
  if (except !== 'joints') { editJointsMode = false; editJointsBtn.classList.remove('active'); }
  if (except !== 'vp') { manualVPMode = false; manualVPBtn.classList.remove('active'); }
  if (except !== 'bgcolor') { bgColorMode = false; pickBgColorBtn.classList.remove('active'); }
  if (except !== 'point') { addPointMode = false; addPointBtn.classList.remove('active'); }
  stageEl.classList.remove('edit-mode', 'joints-mode', 'vp-mode');
  if (except === 'fractions') stageEl.classList.add('edit-mode');
  if (except === 'joints') stageEl.classList.add('joints-mode');
  if (except === 'vp') stageEl.classList.add('vp-mode');
}

editFractionsBtn.addEventListener('click', () => {
  editFractionsMode = !editFractionsMode;
  if (editFractionsMode) resetOtherModes('fractions');
  else stageEl.classList.remove('edit-mode');
  editFractionsBtn.classList.toggle('active', editFractionsMode);
  if (editFractionsMode) closeDrawer();
  drawOverlay();
});
editJointsBtn.addEventListener('click', () => {
  editJointsMode = !editJointsMode;
  if (editJointsMode) resetOtherModes('joints');
  else stageEl.classList.remove('joints-mode');
  editJointsBtn.classList.toggle('active', editJointsMode);
  if (editJointsMode) closeDrawer();
  drawOverlay();
});
manualVPBtn.addEventListener('click', () => {
  manualVPMode = !manualVPMode;
  if (manualVPMode) resetOtherModes('vp');
  else stageEl.classList.remove('vp-mode');
  manualVPBtn.classList.toggle('active', manualVPMode);
  if (manualVPMode) closeDrawer();
});
pickBgColorBtn.addEventListener('click', () => {
  bgColorMode = !bgColorMode;
  if (bgColorMode) resetOtherModes('bgcolor');
  pickBgColorBtn.classList.toggle('active', bgColorMode);
  if (bgColorMode) closeDrawer();
});
addPointBtn.addEventListener('click', () => {
  addPointMode = !addPointMode;
  if (addPointMode) resetOtherModes('point');
  addPointBtn.classList.toggle('active', addPointMode);
  if (addPointMode) closeDrawer();
});
clearPointsBtn.addEventListener('click', () => {
  sourcePoints = []; selectedPointIndex = -1;
  if (!lum) return; rebuildAll();
});
resyncBtn.addEventListener('click', () => {
  if (!lum) return;
  applyPreset(currentPreset);
  rebuildAll();
});
resetVPBtn.addEventListener('click', () => { manualVP = null; if (lum) rebuildAll(); });
clearVPBtn.addEventListener('click', () => {
  manualVP = null; contourResult = null;
  perspVanishing.textContent = '—';
  perspVPDist.textContent = '—';
  perspConfidence.textContent = '—';
  if (lum) drawOverlay();
});

// ============================================================
//  ПРЕСЕТЫ
// ============================================================
presetAnimeBtn.addEventListener('click', () => { applyPreset('anime'); if (lum) rebuildAll(); });
presetStylizedBtn.addEventListener('click', () => { applyPreset('stylized'); if (lum) rebuildAll(); });
presetRealismBtn.addEventListener('click', () => { applyPreset('realism'); if (lum) rebuildAll(); });
presetChibiBtn.addEventListener('click', () => { applyPreset('chibi'); if (lum) rebuildAll(); });

// ============================================================
//  РЕЖИМЫ ЦВЕТА
// ============================================================
modeLumBtn.addEventListener('click', () => {
  mode = 'lum';
  modeLumBtn.classList.add('active'); modeColorBtn.classList.remove('active');
  lumSliderRow.style.display = ''; colorSliderRow.style.display = 'none';
  if (lum) rebuildAll();
});
modeColorBtn.addEventListener('click', () => {
  mode = 'color';
  modeColorBtn.classList.add('active'); modeLumBtn.classList.remove('active');
  lumSliderRow.style.display = 'none'; colorSliderRow.style.display = '';
  if (lum) rebuildAll();
});

// ============================================================
//  КЛИК ПО КАНВАСУ
// ============================================================
baseCanvas.addEventListener('click', e => {
  if (!lum) return;
  if (editFractionsMode || editJointsMode) return;
  const rect = baseCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) * (imgWidth / rect.width));
  const y = Math.floor((e.clientY - rect.top) * (imgHeight / rect.height));
  if (x < 0 || y < 0 || x >= imgWidth || y >= imgHeight) return;

  if (manualVPMode) { manualVP = { x, y }; rebuildAll(); return; }

  if (bgColorMode) {
    const idx = y * imgWidth + x;
    const dp = idx * 4;
    const d = imgDataRef.data;
    colorSamples.push({ r: d[dp], g: d[dp + 1], b: d[dp + 2] });
    if (mode !== 'color') {
      mode = 'color';
      modeColorBtn.classList.add('active'); modeLumBtn.classList.remove('active');
      lumSliderRow.style.display = 'none'; colorSliderRow.style.display = '';
    }
    renderSamplesList();
    bgColorMode = false; pickBgColorBtn.classList.remove('active');
    rebuildAll(); return;
  }

  if (addPointMode) {
    sourcePoints.push({ x, y });
    selectedPointIndex = sourcePoints.length - 1;
  } else {
    let hit = -1;
    for (let i = sourcePoints.length - 1; i >= 0; i--) {
      const p = sourcePoints[i];
      const dx = p.x - x, dy = p.y - y;
      if (dx * dx + dy * dy < 15 * 15) { hit = i; break; }
    }
    if (hit === -1) selectedPointIndex = -1;
    else if (hit === selectedPointIndex) { sourcePoints.splice(hit, 1); selectedPointIndex = -1; }
    else selectedPointIndex = hit;
  }
  rebuildAll();
});

// ============================================================
//  СЛУШАТЕЛИ КОНТРОЛОВ
// ============================================================
bgLumEl.addEventListener('input', () => { bgLumVal.textContent = bgLumEl.value; if (mode === 'lum') rebuildAll(); });
bgDistEl.addEventListener('input', () => { bgDistVal.textContent = bgDistEl.value; if (mode === 'color') rebuildAll(); });
invertEl.addEventListener('change', () => { if (lum) rebuildAll(); });
useWindowsEl.addEventListener('change', () => { if (lum) rebuildAll(); });
useHolesEl.addEventListener('change', () => { if (lum) rebuildAll(); });
useSmoothEl.addEventListener('change', () => { if (lum) rebuildAll(); });
useTableEl.addEventListener('change', () => { if (lum) rebuildAll(); });
useTailsFilterEl.addEventListener('change', () => { if (lum) rebuildAll(); });
maxHoleEl.addEventListener('input', () => { maxHoleVal.textContent = maxHoleEl.value; if (lum && useHolesEl.checked) rebuildAll(); });
minWinEl.addEventListener('input', () => { minWinVal.textContent = minWinEl.value; if (lum && useWindowsEl.checked) rebuildAll(); });
smoothIterEl.addEventListener('input', () => { smoothIterVal.textContent = smoothIterEl.value; if (lum && useSmoothEl.checked) rebuildAll(); });
coreThreshEl.addEventListener('input', () => {
  coreThreshVal.textContent = coreThreshEl.value;
  if (lum) rebuildAll();
});
paletteCountEl.addEventListener('input', () => { paletteCountVal.textContent = paletteCountEl.value; if (lum) computePalette(); });
showCorrectedEl.addEventListener('change', drawOverlay);
autoThresholdBtn.addEventListener('click', () => {
  if (!histogram) return;
  autoPickThreshold();
  if (mode === 'lum') rebuildAll();
});
histoCanvas.addEventListener('click', (e) => {
  if (!histogram || mode !== 'lum') return;
  const rect = histoCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const v = Math.max(0, Math.min(255, Math.round((x / rect.width) * 255)));
  bgLumEl.value = v; bgLumVal.textContent = v; rebuildAll();
});
window.addEventListener('resize', () => {
  if (showHistoEl.checked && histogram) drawHistogram();
});
