// ============================================================
//  utils.js · debounce, курсор
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
