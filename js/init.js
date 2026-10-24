// ============================================================
//  init.js · финальный запуск
// ============================================================

try {
  initWorker();
  smoothIterEl.disabled = !useSmoothEl.checked;
  
  // updateCursor() убран, так как он не нужен до загрузки картинки
  // и может вызвать ошибку, если utils.js не успел загрузиться.

  bindStyleControls();
  setStyleUIFromState();
  
  // Инициализация панели линий пропорций
  initProportionsUI(); 
  
  console.log('[main] init OK');
} catch (e) {
  showError('Init error: ' + (e.message || e));
}
