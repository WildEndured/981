// ============================================================
//  utils.js · вспомогательные функции
// ============================================================

function debounce(fn, ms = 80) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function updateCursor() {
  if (typeof isDragging !== 'undefined' && isDragging) return;
  if (!stageWrap) return;
  
  if (typeof addPointMode !== 'undefined' && addPointMode) {
    stageWrap.style.cursor = 'copy';
  } else if (typeof bgColorMode !== 'undefined' && bgColorMode) {
    stageWrap.style.cursor = 'crosshair';
  } else {
    stageWrap.style.cursor = 'grab';
  }
}
