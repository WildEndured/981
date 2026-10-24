// ============================================================
//  style.js · стиль линий пропорций и BBox
// ============================================================

const styleDefaults = {
  prop: { color: '#ff7ad9', width: 3, alpha: 1, dashed: true, dashLen: 8, dashGap: 5, outline: true, showLabels: true },
  bbox: { color: '#00e0ff', width: 2, alpha: 1, showCorners: true }
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
    if (g('propColor')) style.prop.color = g('propColor').value;
    if (g('propWidth')) style.prop.width = +g('propWidth').value;
    if (g('propAlpha')) style.prop.alpha = +g('propAlpha').value;
    if (g('propDashed')) style.prop.dashed = g('propDashed').checked;
    if (g('propDashLen')) style.prop.dashLen = +g('propDashLen').value;
    if (g('propDashGap')) style.prop.dashGap = +g('propDashGap').value;
    if (g('propOutline')) style.prop.outline = g('propOutline').checked;
    if (g('propShowLabels')) style.prop.showLabels = g('propShowLabels').checked;

    if (g('bboxColor')) style.bbox.color = g('bboxColor').value;
    if (g('bboxWidth')) style.bbox.width = +g('bboxWidth').value;
    if (g('bboxAlpha')) style.bbox.alpha = +g('bboxAlpha').value;
    if (g('bboxShowCorners')) style.bbox.showCorners = g('bboxShowCorners').checked;

    const sw = (id, color) => { const el = g(id); if (el) el.style.background = color; };
    sw('propColorSwatch', style.prop.color);
    sw('bboxColorSwatch', style.bbox.color);

    drawOverlay();
  } catch (e) { showError('syncStyleFromUI: ' + (e.message || e)); }
}

function bindStyleControls() {
  const labelMap = {
    propWidth: ['propWidthVal', v => v],
    propAlpha: ['propAlphaVal', v => (+v).toFixed(2)],
    propDashLen: ['propDashLenVal', v => v],
    propDashGap: ['propDashGapVal', v => v],
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

  ['propColor','propDashed','propOutline','propShowLabels',
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

  setVal('propColor', style.prop.color);
  setVal('propWidth', style.prop.width);
  setVal('propAlpha', style.prop.alpha);
  setChk('propDashed', style.prop.dashed);
  setVal('propDashLen', style.prop.dashLen);
  setVal('propDashGap', style.prop.dashGap);
  setChk('propOutline', style.prop.outline);
  setChk('propShowLabels', style.prop.showLabels);

  setVal('bboxColor', style.bbox.color);
  setVal('bboxWidth', style.bbox.width);
  setVal('bboxAlpha', style.bbox.alpha);
  setChk('bboxShowCorners', style.bbox.showCorners);

  setTxt('propWidthVal', style.prop.width);
  setTxt('propAlphaVal', style.prop.alpha.toFixed(2));
  setTxt('propDashLenVal', style.prop.dashLen);
  setTxt('propDashGapVal', style.prop.dashGap);
  setTxt('bboxWidthVal', style.bbox.width);
  setTxt('bboxAlphaVal', style.bbox.alpha.toFixed(2));

  const sw = (id, color) => { const el = $(id); if (el) el.style.background = color; };
  sw('propColorSwatch', style.prop.color);
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
