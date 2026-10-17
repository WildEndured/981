// ============================================================
//  Web Worker: Маска фона + Brush + Despeckle
// ============================================================

let _imageData = null;

self.onmessage = (e) => {
  const { type, payload } = e.data;
  if (type === 'setImage') {
    _imageData = payload.imageData;
    return;
  }
  if (type === 'buildMask') {
    try {
      const result = buildMaskInWorker(payload);
      self.postMessage({ type: 'mask', payload: result });
    } catch (err) {
      console.error('[worker] error:', err);
      self.postMessage({ type: 'error', payload: String(err && err.message || err) });
    }
  }
};

function buildMaskInWorker(p) {
  const {
    width, height, mode, thresholdLum, colorSamples, thresholdDist, invert,
    sourcePoints, useSmooth, smoothIter, morphOpen, morphClose, regionTolerance,
    useHysteresis, lowLum, useAdaptive, adaptiveRadius, despeckleSize, softEdge, brushData
  } = p;

  const w = width, h = height, N = w * h;
  if (!_imageData) throw new Error('imageData not set');

  const data = _imageData.data;

  // 1. Luminance
  const lum = new Float32Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    if (data[j + 3] < 20) { lum[i] = 255; continue; }
    lum[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }

  // 2. Адаптивный порог
  let adaptive = null;
  if (useAdaptive && (mode === 'lum' || mode === 'region')) {
    adaptive = boxBlurLum(lum, w, h, adaptiveRadius || 15);
  }

  // 3. Кэш isPixelBg + Hysteresis
  const dist2 = thresholdDist * thresholdDist * 3;
  const colorMode = (mode === 'color' && colorSamples && colorSamples.length > 0);
  const bgCache = new Uint8Array(N);
  let strongMask = null;
  const lumHi = thresholdLum;
  const lumLo = useHysteresis ? (lowLum ?? (thresholdLum - 20)) : thresholdLum;

  if (useHysteresis && (mode === 'lum' || mode === 'region')) strongMask = new Uint8Array(N);

  for (let i = 0; i < N; i++) {
    if (mode === 'lum' || mode === 'region') {
      const hi = adaptive ? (adaptive[i] + (lumHi - 128)) : lumHi;
      const lo = adaptive ? (adaptive[i] + (lumLo - 128)) : lumLo;
      let isStrong = lum[i] >= hi;
      let isWeak = lum[i] >= lo;
      if (invert) { isStrong = !isStrong; isWeak = !isWeak; }
      bgCache[i] = isWeak ? 1 : 0;
      if (strongMask) strongMask[i] = isStrong ? 1 : 0;
    } else {
      if (!colorMode) { bgCache[i] = invert ? 1 : 0; continue; }
      let matched = false;
      const j = i * 4;
      const r = data[j], g = data[j + 1], b = data[j + 2];
      for (let k = 0; k < colorSamples.length; k++) {
        const s = colorSamples[k];
        const dr = r - s.r, dg = g - s.g, db = b - s.b;
        if (dr * dr + dg * dg + db * db <= dist2) { matched = true; break; }
      }
      if (invert) matched = !matched;
      bgCache[i] = matched ? 1 : 0;
    }
  }

  // 4. Применяем данные Кисти (если есть)
  const finalMask = new Uint8Array(N);
  if (brushData) {
    for (let i = 0; i < N; i++) {
      const brushVal = brushData[i * 4]; // Красный канал
      if (brushVal === 255) { finalMask[i] = 0; continue; } // Принудительно персонаж
      if (brushVal === 0 && brushData[i*4+3] > 0) { finalMask[i] = 1; continue; } // Принудительный фон
      // Если кисти нет, ставим исходное значение
      finalMask[i] = bgCache[i]; 
    }
  } else {
    finalMask.set(bgCache);
  }

  // 5. BFS от краев (только для тех, кто не тронут кистью)
  const mask = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (mask[idx]) return;
    if (!finalMask[idx]) return;
    // Hysteresis проверка
    if (strongMask && !strongMask[idx] && (!brushData || brushData[idx*4] !== 0)) return; 
    
    mask[idx] = 1; queue[tail++] = idx;
  };

  if (sourcePoints && sourcePoints.length > 0) {
    for (const pt of sourcePoints) push(pt.x, pt.y);
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w, y = (idx / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  // 6. Hysteresis: расширение
  if (strongMask) {
    const addQueue = new Int32Array(N);
    let ah = 0, at = 0;
    for (let i = 0; i < N; i++) if (mask[i]) addQueue[at++] = i;
    while (ah < at) {
      const idx = addQueue[ah++];
      const x = idx % w, y = (idx / w) | 0;
      const tryExpand = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const n = ny * w + nx;
        if (mask[n] || !finalMask[n]) return;
        mask[n] = 1; addQueue[at++] = n;
      };
      tryExpand(x - 1, y); tryExpand(x + 1, y); tryExpand(x, y - 1); tryExpand(x, y + 1);
    }
  }

  // 7. Применяем кисть поверх BFS (чтобы закрасить изнутри)
  if (brushData) {
    for (let i = 0; i < N; i++) {
      const bv = brushData[i * 4];
      if (bv === 255) mask[i] = 0;
      if (bv === 0 && brushData[i*4+3] > 0) mask[i] = 1;
    }
  }

  // 8. Despeckle (Удаление мусора)
  if (despeckleSize > 0) despeckle(mask, w, h, despeckleSize);

  // 9. Region
  if (mode === 'region' && sourcePoints && sourcePoints.length > 0) {
    regionFill(mask, data, w, h, sourcePoints, regionTolerance, invert);
  }

  // 10. Морфология
  if (morphOpen > 0) { for (let i = 0; i < morphOpen; i++) erode(mask, w, h); for (let i = 0; i < morphOpen; i++) dilate(mask, w, h); }
  if (morphClose > 0) { for (let i = 0; i < morphClose; i++) dilate(mask, w, h); for (let i = 0; i < morphClose; i++) erode(mask, w, h); }

  // 11. Сглаживание
  if (useSmooth) for (let i = 0; i < smoothIter; i++) smoothOnce(mask, w, h);

  let bgCount = 0; for (let i = 0; i < N; i++) if (mask[i]) bgCount++;

  let alpha = null;
  if (softEdge > 0) alpha = softAlpha(mask, w, h, softEdge);

  return { mask, bgCount, width: w, height: h, alpha };
}

// ============================================================
//  Despeckle (Поиск связных компонент)
// ============================================================
function despeckle(mask, w, h, minSize) {
  const N = w * h;
  const visited = new Uint8Array(N);
  const queue = new Int32Array(N);

  for (let i = 0; i < N; i++) {
    if (visited[i] || !mask[i]) continue;
    let head = 0, tail = 0;
    queue[tail++] = i;
    visited[i] = 1;
    const region = [i];

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % w, y = (idx / w) | 0;
      const check = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const n = ny * w + nx;
        if (!visited[n] && mask[n]) { visited[n] = 1; queue[tail++] = n; region.push(n); }
      };
      check(x + 1, y); check(x - 1, y); check(x, y + 1); check(x, y - 1);
    }
    // Если островок меньше minSize — удаляем (инвертируем)
    if (region.length < minSize) {
      for (const r of region) mask[r] = 0;
    }
  }
  
  // То же самое для дырок внутри персонажа (мусор фона внутри)
  // (опционально, но полезно)
}

// ============================================================
//  Хелперы (boxBlurLum, regionFill, erode, dilate, smooth, softAlpha)
// ============================================================
// ... (остальные хелперы из предыдущего сообщения остаются без изменений)
