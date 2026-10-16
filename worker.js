// ============================================================
//  Web Worker: тяжёлые вычисления маски
// ============================================================

self.onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === 'buildMask') {
    try {
      const result = buildMaskInWorker(payload);
      self.postMessage(
        { type: 'mask', payload: result },
        [result.mask.buffer]
      );
    } catch (err) {
      self.postMessage({ type: 'error', payload: String(err && err.message || err) });
    }
  }
};

// ------------------------------------------------------------
//  Основная функция: строит маску фона
// ------------------------------------------------------------
function buildMaskInWorker(p) {
  const {
    imageData,
    width, height,
    mode,               // 'lum' | 'color' | 'region'
    thresholdLum,       // 0..255
    colorSamples,       // [{r,g,b}]
    thresholdDist,      // 1..150
    invert,
    sourcePoints,       // [{x,y}]
    autoSeeds,          // [{x,y}] — предвычисленные в главном потоке
    useSmooth,
    smoothIter,
    morphOpen,
    morphClose,
    regionTolerance     // 0..255 для регионального роста
  } = p;

  const w = width, h = height;
  const N = w * h;
  const data = imageData.data;

  // Лум-канал
  const lum = new Float32Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    if (data[j + 3] < 20) { lum[i] = 255; continue; }
    lum[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }

  // Кэш порогов
  const dist2 = thresholdDist * thresholdDist * 3;
  const colorMode = (mode === 'color' && colorSamples && colorSamples.length > 0);

  function isPixelBg(idx) {
    let matched;
    if (mode === 'lum') {
      matched = lum[idx] >= thresholdLum;
    } else if (mode === 'color') {
      if (!colorMode) return invert;
      matched = false;
      const j = idx * 4;
      const r = data[j], g = data[j + 1], b = data[j + 2];
      for (let k = 0; k < colorSamples.length; k++) {
        const s = colorSamples[k];
        const dr = r - s.r, dg = g - s.g, db = b - s.b;
        if (dr * dr + dg * dg + db * db <= dist2) { matched = true; break; }
      }
    } else {
      // region — обрабатывается отдельно, здесь fallback на lum
      matched = lum[idx] >= thresholdLum;
    }
    return invert ? !matched : matched;
  }

  // ------------------------------------------------------------
  //  Основной BFS
  // ------------------------------------------------------------
  const mask = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (mask[idx] || !isPixelBg(idx)) return;
    mask[idx] = 1;
    queue[tail++] = idx;
  };

  if (sourcePoints && sourcePoints.length > 0) {
    for (const pt of sourcePoints) push(pt.x, pt.y);
  } else if (autoSeeds && autoSeeds.length > 0) {
    for (const pt of autoSeeds) push(pt.x, pt.y);
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w, y = (idx / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  // ------------------------------------------------------------
  //  Региональный рост (опционально, поверх BFS)
  // ------------------------------------------------------------
  if (mode === 'region' && sourcePoints && sourcePoints.length > 0) {
    regionGrow(mask, data, w, h, sourcePoints, regionTolerance);
  }

  // ------------------------------------------------------------
  //  Морфология
  // ------------------------------------------------------------
  if (morphOpen > 0) {
    for (let i = 0; i < morphOpen; i++) erode(mask, w, h);
    for (let i = 0; i < morphOpen; i++) dilate(mask, w, h);
  }
  if (morphClose > 0) {
    for (let i = 0; i < morphClose; i++) dilate(mask, w, h);
    for (let i = 0; i < morphClose; i++) erode(mask, w, h);
  }

  // ------------------------------------------------------------
  //  Сглаживание
  // ------------------------------------------------------------
  if (useSmooth) {
    for (let i = 0; i < smoothIter; i++) smoothOnce(mask, w, h);
  }

  // ------------------------------------------------------------
  //  Подсчёт фона
  // ------------------------------------------------------------
  let bgCount = 0;
  for (let i = 0; i < N; i++) if (mask[i]) bgCount++;

  return { mask, bgCount, width: w, height: h };
}

// ============================================================
//  Региональный рост: BFS от точек, критерий — похожесть на соседа
// ============================================================
function regionGrow(mask, data, w, h, seeds, tolerance) {
  const N = w * h;
  const queue = new Int32Array(N);
  let head = 0, tail = 0;
  const visited = new Uint8Array(N);

  const pushSeed = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    mask[idx] = 1;
    queue[tail++] = idx;
  };

  for (const s of seeds) pushSeed(s.x, s.y);

  const tol2 = tolerance * tolerance * 3;

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w, y = (idx / w) | 0;
    const j = idx * 4;
    const r0 = data[j], g0 = data[j + 1], b0 = data[j + 2];

    const tryNeighbor = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const nidx = ny * w + nx;
      if (visited[nidx]) return;
      visited[nidx] = 1;
      const nj = nidx * 4;
      const dr = data[nj] - r0, dg = data[nj + 1] - g0, db = data[nj + 2] - b0;
      if (dr * dr + dg * dg + db * db <= tol2) {
        mask[nidx] = 1;
        queue[tail++] = nidx;
      }
    };

    tryNeighbor(x + 1, y);
    tryNeighbor(x - 1, y);
    tryNeighbor(x, y + 1);
    tryNeighbor(x, y - 1);
  }
}

// ============================================================
//  Морфология
// ============================================================
function erode(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (!copy[idx]) continue;
      // Если хотя бы один 4-сосед не фон — гасим
      if (!copy[idx - 1] || !copy[idx + 1] || !copy[idx - w] || !copy[idx + w]) {
        mask[idx] = 0;
      }
    }
  }
}

function dilate(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (copy[idx]) continue;
      if (copy[idx - 1] || copy[idx + 1] || copy[idx - w] || copy[idx + w]) {
        mask[idx] = 1;
      }
    }
  }
}

// ============================================================
//  Сглаживание (3×3, пороги 7/1)
// ============================================================
function smoothOnce(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      let bgCount = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          bgCount += copy[idx + dy * w + dx];
        }
      }
      if (bgCount >= 7) mask[idx] = 1;
      else if (bgCount <= 1) mask[idx] = 0;
    }
  }
}
