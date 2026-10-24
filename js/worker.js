// ============================================================
//  js/worker.js · запуск Web Worker (файл в папке js)
// ============================================================

function initWorker() {
  if (worker) return true;
  try {
    worker = new Worker('worker.js?v=7'); // путь к корневому воркеру
  } catch (err) {
    worker = null;
    showError('Worker не создан. Fallback в главном потоке.');
    return false;
  }
  
  worker.onmessage = (e) => {
    const { type, payload } = e.data;
    if (type === 'mask') {
      isBg = new Uint8Array(payload.mask);
      bgCount = payload.bgCount;
      charBBox = payload.bbox || null;
      propLines = payload.propLines || []; // Убрали gridInfo
      
      drawOverlay();
      updateInfo();
      workerBusy = false;
      hideProgress();
      if (pendingBuild) { pendingBuild = false; rebuildAll(); }
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
