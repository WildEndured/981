// ============================================================
//  state.js · DOM-ссылки и глобальное состояние
// ============================================================

const $ = (id) => document.getElementById(id);

// ---------- DOM ----------
const errBanner = $('errBanner');

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

const showGridEl = $('showGrid');
const gridStepEl = $('gridStep');
const gridStepVal = $('gridStepVal');
const headCountEl = $('headCount');
const headCountVal = $('headCountVal');
const presetsRow = $('presetsRow');
const findHeadBtn = $('findHeadBtn');
const findHeadStatus = $('findHeadStatus');
const gridAlignRadios = document.querySelectorAll('input[name="gridAlign"]');
const gridResetBtn = $('gridResetBtn');
const gridSummary = $('gridSummary');

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
const infoHeads = $('infoHeads');
const infoGrid = $('infoGrid');
const infoHeadPx = $('infoHeadPx');
const infoPointsCount = $('infoPointsCount');
const pointList = $('pointList');
const samplesList = $('samplesList');

const zoomInBtn = $('zoomInBtn');
const zoomOutBtn = $('zoomOutBtn');
const zoomFitBtn = $('zoomFitBtn');
const zoomResetBtn = $('zoomResetBtn');

const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
const overlayCtx = overlay.getContext('2d');

// ---------- Состояние ----------
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
let propLines = []; // вычисленные Y-координаты для рендера

let horizShiftPercent = 0;
let vertShiftPercent = 0;

let gridStepPercent = 13;
let activePresetHeads = 7.5;
let gridAlign = 'from-top';
let gridInfo = { stepPercent: 13, headCount: 100 / 13, headPx: 0, lines: 0, align: 'from-top' };

let showHoriz = true;
let showVert = true;
let showGrid = true;

// --- Линии пропорций ---
let showPropLines = true;

// Пресеты линий пропорций (сохраняются в localStorage)
// Структура: { id: string, name: string, lines: Array<{ id, label, percent, enabled }> }
let propPresets = [];
let activePropPresetId = 'classic-7.5';

// Цвета/стили линий пропорций (оставляем дефолт)
const propStyle = {
  color: '#ff7ad9',
  width: 3,
  alpha: 1,
  dashed: true,
  dashLen: 8,
  dashGap: 5,
  showLabels: true,
  outline: true
};

// Zoom / pan
let zoom = 1, panX = 0, panY = 0;
let fitZoom = 1;
let isDragging = false, dragStartX = 0, dragStartY = 0;
let dragStartPanX = 0, dragStartPanY = 0;

// Worker
let worker = null;
let workerBusy = false;
let pendingBuild = false;

let _seedsCache = null;
function invalidateSeeds() { _seedsCache = null; }

// ---------- Ошибки ----------
function showError(msg) {
  console.error('[main]', msg);
  if (errBanner) {
    errBanner.textContent = '⚠ ' + msg;
    errBanner.classList.add('visible');
  }
}
window.addEventListener('error', (e) => showError('JS error: ' + (e.message || e.error)));
