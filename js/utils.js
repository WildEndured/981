// ============================================================
//  init.js · финальный запуск
// ============================================================

try {
  initWorker();
  smoothIterEl.disabled = !useSmoothEl.checked;
  updateCursor();
  bindStyleControls();
  setStyleUIFromState();
  
  // Инициализация панели линий пропорций
  initProportionsUI(); 
  
  console.log('[main] init OK');
} catch (e) {
  showError('Init error: ' + (e.message || e));
}
