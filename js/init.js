// ============================================================
//  init.js · финальный запуск
// ============================================================

try {
  console.log('[init] start');
  
  try {
    initWorker();
  } catch (e) {
    showError('initWorker: ' + (e.message || e));
  }

  if (typeof smoothIterEl !== 'undefined' && smoothIterEl && typeof useSmoothEl !== 'undefined' && useSmoothEl) {
    smoothIterEl.disabled = !useSmoothEl.checked;
  }

  try {
    bindStyleControls();
    setStyleUIFromState();
  } catch (e) {
    showError('Style init: ' + (e.message || e));
  }

  try {
    initProportionsUI();
  } catch (e) {
    showError('Proportions init: ' + (e.message || e));
  }

  console.log('[main] init OK');
} catch (e) {
  showError('Init error: ' + (e.message || e));
}
