// ============================================================
//  worker.js · запуск Web Worker и обработка ответов
// ============================================================

function initWorker() {
  if (worker) return true;
  try {
    worker = new Worker('worker.js?v=' + Date.now());
  } catch (err) {
    worker = null;
    showError('Worker не создан. Fallback в главном потоке.');
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
      gridInfo = payload.gridInfo || gridInfo;
      propLines = payload.propLines || [];
      drawOverlay();
      updateInfo();
      workerBusy = false;
      hideProgress();
      if (pendingBuild) { pendingBuild = false; rebuildAll(); }
    } else if (type === 'headFound') {
      if (payload.ok) {
        activePresetHeads = payload.headCount;
        applyGridStep(100 / payload.headCount, { fromPreset: true });
        findHeadStatus.textContent = `✓ ${payload.headCount.toFixed(2)} голов → шаг ${Math.round(100 / payload.headCount)}% (голова ${payload.headPx}px)`;
        findHeadStatus.style.color = '#7bd88f';
      } else {
        findHeadStatus.textContent = '✗ не удалось (' + (payload.reason || 'нет шеи') + ')';
        findHeadStatus.style.color = '#ff9090';
      }
    } else if (type === 'error') {
      workerBusy = false;
      hideProgress();
      showError('Worker error: ' + payload);
    }
  };
  worker.onerror = (err) => {
    workerBusy = false;
    hideProgress();
    worker = null;
    showError('Worker error: ' + (err.message || 'unknown'));
  };
  return true;
}

function showProgress() { progressOverlay.classList.add('visible'); }
function hideProgress() { progressOverlay.classList.remove('visible'); }
