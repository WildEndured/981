// ============================================================
//  style.js · стиль сетки и линий (цвет, толщина, прозрачность)
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
  } catch (e) { showError('syncStyleFromUI: ' + (e.message || e)); }
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
    const el = $(id);
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

  ['gridColor','gridDashed','gridOutline','gridShowLabels',
   'horizColor','horizDashed','horizOutline',
   'vertColor','vertDashed','vertOutline',
   'bboxColor','bboxShowCorners'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', syncStyleFromUI);
    el.addEventListener('change', syncStyleFromUI);
  });
}

function setStyleUIFromState() {
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
}

const styleResetBtn = $('styleResetBtn');
if (styleResetBtn) {
  styleResetBtn.addEventListener('click', () => {
    Object.assign(style, JSON.parse(JSON.stringify(styleDefaults)));
    setStyleUIFromState();
    drawOverlay();
  });
}
