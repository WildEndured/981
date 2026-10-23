// ============================================================
//  zoom.js · масштаб и панорама
// ============================================================

function applyTransform() {
  stageEl.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  infoZoom.textContent = Math.round(zoom * 100) + '%';
  drawOverlay();
}

function fitToView() {
  if (!imgWidth) return;
  const ww = stageWrap.clientWidth, wh = stageWrap.clientHeight;
  fitZoom = Math.min(ww / imgWidth, wh / imgHeight) * 0.98;
  zoom = fitZoom;
  panX = (ww - imgWidth * zoom) / 2;
  panY = (wh - imgHeight * zoom) / 2;
  applyTransform();
}

function resetZoom() {
  zoom = 1;
  panX = (stageWrap.clientWidth - imgWidth) / 2;
  panY = (stageWrap.clientHeight - imgHeight) / 2;
  applyTransform();
}

function zoomAt(factor, cx, cy) {
  const rect = stageWrap.getBoundingClientRect();
  const mx = cx - rect.left, my = cy - rect.top;
  const nz = Math.max(0.05, Math.min(20, zoom * factor));
  const k = nz / zoom;
  panX = mx - k * (mx - panX);
  panY = my - k * (my - panY);
  zoom = nz;
  applyTransform();
}

zoomInBtn.addEventListener('click', () => {
  const r = stageWrap.getBoundingClientRect();
  zoomAt(1.25, r.left + stageWrap.clientWidth / 2, r.top + stageWrap.clientHeight / 2);
});
zoomOutBtn.addEventListener('click', () => {
  const r = stageWrap.getBoundingClientRect();
  zoomAt(1 / 1.25, r.left + stageWrap.clientWidth / 2, r.top + stageWrap.clientHeight / 2);
});
zoomFitBtn.addEventListener('click', fitToView);
zoomResetBtn.addEventListener('click', resetZoom);

stageWrap.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
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

// ---------- Touch ----------
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
    const nz = Math.max(0.05, Math.min(20, touchStartZoom * factor));
    const mx = (a.clientX + b.clientX) / 2;
    const my = (a.clientY + b.clientY) / 2;
    const rect = stageWrap.getBoundingClientRect();
    const lx = mx - rect.left, ly = my - rect.top;
    const k = nz / zoom;
    panX = lx - k * (lx - panX);
    panY = ly - k * (ly - panY);
    zoom = nz;
    applyTransform();
  }
}, { passive: true });

stageWrap.addEventListener('touchend', () => { touchMode = null; }, { passive: true });
