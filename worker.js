// ============================================================
//  Web Worker: маска фона (Исправленный Hysteresis + Adaptive)
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
      self.postMessage({
        type: 'mask',
        payload: {
          mask: result.mask,
          bgCount: result.bgCount,
          width: result.width,
          height: result.height,
          alpha: result.alpha
        }
      });
    } catch (err) {
      console.error('[worker] error:', err);
      self.postMessage({ type: 'error', payload: String(err && err.message || err) });
    }
  }
};

function buildMaskInWorker(p) {
  const {
    width, height,
    mode,
    thresholdLum,
    colorSamples,
    thresholdDist,
    invert,
    sourcePoints,
    autoSeeds,
    useSmooth,
    smoothIter,
    morphOpen,
    morphClose,
    regionTolerance,
    useHysteresis,
    lowLum,
    useAdaptive,
    adaptiveRadius,
    softEdge
  } = p;

  const w = width, h = height, N = w * h;

  if (!_imageData) throw new Error('imageData not set in worker');
  const data = _imageData.data;

  // --- 1. Luminance ---
  const lum = new Float32Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    if (data[j + 3] < 20) { lum[i] = 255; continue; }
    lum[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }

  // --- 2. Адаптивный порог (Box Blur) ---
  let adaptive = null;
  if (useAdaptive && (mode === 'lum' || mode === 'region')) {
    adaptive = boxBlurLum(lum, w, h, adaptiveRadius || 15);
  }

  // --- 3. Кэш isPixelBg + Hysteresis ---
  const dist2 = thresholdDist * thresholdDist * 3;
  const colorMode = (mode === 'color' && colorSamples && colorSamples.length > 0);
  
  const bgCache = new Uint8Array(N);
  let strongMask = null;
  
  const lumHi = thresholdLum;
  const lumLo = useHysteresis ? (lowLum ?? (thresholdLum - 20)) : thresholdLum;

  if (useHysteresis && (mode === 'lum' || mode === 'region')) {
    strongMask = new Uint8Array(N);
  }

  for (let i = 0; i < N; i++) {
    if (mode === 'lum' || mode === 'region') {
      // Учитываем адаптивный порог
      const hi = adaptive ? (adaptive[i] + (lumHi - 128)) : lumHi;
      const lo = adaptive ? (adaptive[i] + (lumLo - 128)) : lumLo;
      
      // Сначала определяем "сильный" и "слабый" фон БЕЗ учета инверсии
      let isStrong = lum[i] >= hi;
      let isWeak = lum[i] >= lo;
      
      // Применяем инверсию, если нужно
      if (invert) {
        isStrong = !isStrong;
        isWeak = !isWeak;
      }

      bgCache[i] = isWeak ? 1 : 0;
      if (strongMask) strongMask[i] = isStrong ? 1 : 0;
      
    } else {
      // Цветовой режим
      if (!colorMode) { 
        bgCache[i] = invert ? 1 : 0; 
        continue; 
      }
      let matched = false;
      const j = i * 4;
      const r = data[j], g = data[j + 1], b = data[j + 2];
      for (let k = 0; k < colorSamples.length; k++) {
        const s = colorSamples[k];
        const dr = r - s.r, dg = g - s.g, db = b - s.b;
        if (dr * dr + dg * dg + db * db <= dist2) { matched = true; break; }
      }
      // Применяем инверсию к цвету
      if (invert) matched = !matched;
      bgCache[i] = matched ? 1 : 0;
    }
  }

  // --- 4. BFS от краёв + seed-точек ---
  const mask = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (mask[idx]) return;
    if (!bgCache[idx]) return;
    // Если включен hysteresis, на первом этапе заливаем ТОЛЬКО сильные пиксели
    if (strongMask && !strongMask[idx]) return; 
    
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

  // --- 5. Hysteresis: расширяем сильные в слабые ---
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
        if (mask[n]) return;
        if (!bgCache[n]) return; // слабый фон
        mask[n] = 1;
        addQueue[at++] = n;
      };
      
      tryExpand(x - 1, y); tryExpand(x + 1, y); 
      tryExpand(x, y - 1); tryExpand(x, y + 1);
    }
  }

  // --- 6. region-режим ---
  if (mode === 'region' && sourcePoints && sourcePoints.length > 0) {
    regionFill(mask, data, w, h, sourcePoints, regionTolerance, invert);
  }

  // --- 7. Морфология ---
  if (morphOpen > 0) {
    for (let i = 0; i < morphOpen; i++) erode(mask, w, h);
    for (let i = 0; i < morphOpen; i++) dilate(mask, w, h);
  }
  if (morphClose > 0) {
    for (let i = 0; i < morphClose; i++) dilate(mask, w, h);
    for (let i = 0; i < morphClose; i++) erode(mask, w, h);
  }

  // --- 8. Сглаживание ---
  if (useSmooth) {
    for (let i = 0; i < smoothIter; i++) smoothOnce(mask, w, h);
  }

  let bgCount = 0;
  for (let i = 0; i < N; i++) if (mask[i]) bgCount++;

  // --- 9. Мягкая альфа ---
  let alpha = null;
  if (softEdge > 0) {
    alpha = softAlpha(mask, w, h, softEdge);
  }

  return { mask, bgCount, width: w, height: h, alpha };
}

// ============================================================
//  Хелперы
// ============================================================
function boxBlurLum(src, w, h, radius) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const r = Math.max(1, radius | 0);
  const inv = 1 / (2 * r + 1);

  // По горизонтали
  for (let y = 0; y < h; y++) {
    let sum = 0;
    const row = y * w;
    for (let x = -r; x <= r; x++) {
      const xx = x < 0 ? 0 : (x >= w ? w - 1 : x);
      sum += src[row + xx];
    }
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum * inv;
      const xAdd = x + r + 1;
      const xSub = x - r;
      sum += src[row + (xAdd >= w ? w - 1 : xAdd)] - src[row + (xSub < 0 ? 0 : xSub)];
    }
  }
  // По вертикали
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) {
      const yy = y < 0 ? 0 : (y >= h ? h - 1 : y);
      sum += tmp[yy * w + x];
    }
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum * inv;
      const yAdd = y + r + 1;
      const ySub = y - r;
      sum += tmp[(yAdd >= h ? h - 1 : yAdd) * w + x] - tmp[(ySub < 0 ? 0 : ySub) * w + x];
    }
  }
  return out;
}

function regionFill(mask, data, w, h, seeds, tolerance, invert) {
  const N = w * h;
  const queue = new Int32Array(N);
  let head = 0, tail = 0;
  const visited = new Uint8Array(N);
  const tol2 = tolerance * tolerance * 3;

  const pushSeed = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    if (invert) {
      queue[tail++] = idx;
    } else {
      mask[idx] = 1;
      queue[tail++] = idx;
    }
  };
  for (const s of seeds) pushSeed(s.x, s.y);

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w, y = (idx / w) | 0;
    const j = idx * 4;
    const r0 = data[j], g0 = data[j + 1], b0 = data[j + 2];
    const tryN = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const nidx = ny * w + nx;
      if (visited[nidx]) return;
      visited[nidx] = 1;
      const nj = nidx * 4;
      const dr = data[nj] - r0, dg = data[nj + 1] - g0, db = data[nj + 2] - b0;
      if (dr * dr + dg * dg + db * db <= tol2) {
        if (!invert) mask[nidx] = 1;
        queue[tail++] = nidx;
      }
    };
    tryN(x + 1, y); tryN(x - 1, y); tryN(x, y + 1); tryN(x, y - 1);
  }
}

function erode(mask, w, h) {
  const copy = mask.slice();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!copy[idx]) continue;
      const l = x > 0 ? copy[idx - 1] : 1;
      const r = x < w - 1 ? copy[idx + 1] : 1;
      const u = y > 0 ? copy[idx - w] : 1;
      const d = y < h - 1 ? copy[idx + w] : 1;
      if (!l || !r || !u || !d) mask[idx] = 0;
    }
  }
}

function dilate(mask, w, h) {
  const copy = mask.slice();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (copy[idx]) continue;
      const l = x > 0 ? copy[idx - 1] : 1;
      const r = x < w - 1 ? copy[idx + 1] : 1;
      const u = y > 0 ? copy[idx - w] : 1;
      const d = y < h - 1 ? copy[idx + w] : 1;
      if (l || r || u || d) mask[idx] = 1;
    }
  }
}

function smoothOnce(mask, w, h) {
  const copy = mask.slice();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      let bg = 0, tot = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          bg += copy[ny * w + nx];
          tot++;
        }
      }
      if (bg >= tot - 1) mask[idx] = 1;
      else if (bg <= 1) mask[idx] = 0;
    }
  }
}

function softAlpha(mask, w, h, radius) {
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = mask[i] ? 1 : 0;

  const tmp = new Float32Array(w * h);
  const r = Math.max(1, radius | 0);
  const inv = 1 / (2 * r + 1);

  for (let y = 0; y < h; y++) {
    let sum = 0;
    const row = y * w;
    for (let x = -r; x <= r; x++) {
      const xx = x < 0 ? 0 : (x >= w ? w - 1 : x);
      sum += a[row + xx];
    }
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum * inv;
      const xAdd = x + r + 1;
      const xSub = x - r;
      sum += a[row + (xAdd >= w ? w - 1 : xAdd)] - a[row + (xSub < 0 ? 0 : xSub)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) {
      const yy = y < 0 ? 0 : (y >= h ? h - 1 : y);
      sum += tmp[yy * w + x];
    }
    for (let y = 0; y < h; y++) {
      a[y * w + x] = sum * inv;
      const yAdd = y + r + 1;
      const ySub = y - r;
      sum += tmp[(yAdd >= h ? h - 1 : yAdd) * w + x] - tmp[(ySub < 0 ? 0 : ySub) * w + x];
    }
  }

  const out = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) {
    out[i] = Math.round((1 - a[i]) * 255);
  }
  return out;
        }
