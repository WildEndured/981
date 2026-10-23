// ============================================================
//  init.js · финальный запуск
// ============================================================

try {
  initWorker();
  smoothIterEl.disabled = !useSmoothEl.checked;
  updateCursor();
  bindStyleControls();
  setStyleUIFromState();
  activePresetHeads = 7.5;
  applyGridStep(13, { rebuild: false, fromPreset: true });
  initProportionsUI(); // инициализация панели линий пропорций
  console.log('[main] init OK');
} catch (e) {
  showError('Init error: ' + (e.message || e));
}
