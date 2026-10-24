function updateInfo() {
  if (!lum) return;
  const N = imgWidth * imgHeight;
  const charCount = N - bgCount;
  infoSize.textContent = `${imgWidth} × ${imgHeight}`;
  infoMode.textContent = mode === 'lum' ? 'яркость' : mode === 'color' ? 'цвет' : 'регион';
  infoBgPct.textContent = ((bgCount / N) * 100).toFixed(1) + '%';
  infoCharPct.textContent = ((charCount / N) * 100).toFixed(1) + '%';
  infoPointsCount.textContent = `(${sourcePoints.length})`;

  if (charBBox) {
    infoBBox.textContent = `x:${charBBox.x} y:${charBBox.y} w:${charBBox.w} h:${charBBox.h}`;
    infoWH.textContent = `${(charBBox.w / charBBox.h).toFixed(3)} (h/w=${(charBBox.h / charBBox.w).toFixed(3)})`;
    infoFill.textContent = (charBBox.fillRatio * 100).toFixed(1) + '%';
  } else {
    infoBBox.textContent = infoWH.textContent = infoFill.textContent = '—';
  }

  renderPointList();
}
