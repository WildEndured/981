// ============================================================
//  js/worker.js · запуск Web Worker (main-thread)
// ============================================================

function initWorker() {
  if (worker) return true;
  if (workerFailed) return false;

  try {
    // ВАЖНО: файл воркера должен лежать в папке js/ и называться worker-body.js
    worker = new Worker('js/worker-body.js?v=17');
  } catch (err) {
    worker = null;
    workerFailed = true;
    showError('Worker не создан. Fallback в главном потоке.');
    return false;
  }

  worker.onmessage = (e) => {
    const { type, payload } = e.data;
    if (type === 'mask') {
      isBg = payload.mask instanceof Uint8Array ? payload.mask : new Uint8Array(payload.mask);
      bgCount = payload.bgCount;
      charBBox = payload.bbox || null;
      propLines = payload.propLines || [];

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
    console.error('[worker error]', {
      message: err.message,
      filename: err.filename,
      lineno: err.lineno,
      colno: err.colno,
      error: err.error
    });
    workerBusy = false;
    hideProgress();
    worker = null;
    workerFailed = true;
    showError('Worker error: ' + (err.message || 'unknown') + '. Дальше — fallback.');
  };
  return true;
}

function showProgress() { if (progressOverlay) progressOverlay.classList.add('visible'); }
function hideProgress() { if (progressOverlay) progressOverlay.classList.remove('visible'); }
