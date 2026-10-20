// ============================================================
//  Web Worker: тяжёлые вычисления маски
// ============================================================

self.onmessage = (e) => {
  const { type, payload } = e.data;
  console.log('[worker] received:', type);

  if (type === 'buildMask') {
    try {
      const result = buildMaskInWorker(payload);
      console.log('[worker] done, bgCount =', result.bgCount, 'bbox =', result.bbox, 'pubic =', result.pubicPoint);
      self.postMessage({
        type: 'mask',
        payload: {
          mask: result.mask,
          bgCount: result.bgCount,
          width: result.width,
          height: result.height,
          bbox: result.bbox,
          widthProfile: result.widthProfile,
          pubicPoint: result.pubicPoint
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
    imageData,
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
    regionTolerance
  } = p;

  const w = width, h = height;
  const N = w * h;
  const data = imageData.data;

  console.log('[worker] buildMask:', { w, h, mode, thresholdLum, useSmooth, smoothIter, morphOpen, morphClose });

  // Лум-канал
  const lum = new Float32Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    if (data[j + 3] < 20) { lum[i] = 255; continue; }
    lum[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }

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
      matched = lum[idx] >= thresholdLum;
    }
    return invert ? !matched : matched;
  }

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

  if (mode === 'region' && sourcePoints && sourcePoints.length > 0) {
    regionGrow(mask, data, w, h, sourcePoints, regionTolerance);
  }

  if (morphOpen > 0) {
    for (let i = 0; i < morphOpen; i++) erode(mask, w, h);
    for (let i = 0; i < morphOpen; i++) dilate(mask, w, h);
  }
  if (morphClose > 0) {
    for (let i = 0; i < morphClose; i++) dilate(mask, w, h);
    for (let i = 0; i < morphClose; i++) erode(mask, w, h);
  }

  if (useSmooth) {
    for (let i = 0; i < smoothIter; i++) smoothOnce(mask, w, h);
  }

  let bgCount = 0;
  for (let i = 0; i < N; i++) if (mask[i]) bgCount++;

  // === BBOX + ПРОФИЛЬ ШИРИНЫ + ЛОБОК ===
  const bbox = computeCharacterBBox(mask, w, h, { minComponentSize: 200 });
  let pubicPoint = null;
  let widthProfile = null;

  if (bbox) {
    widthProfile = computeWidthProfile(mask, w, h, bbox);
    pubicPoint = findPubicPoint(mask, w, h, bbox, widthProfile);
  }

  return { mask, bgCount, width: w, height: h, bbox, widthProfile, pubicPoint };
}

/**
 * Возвращает bbox самой большой связной компоненты «персонажа» (mask[i] === 0).
 * Если таких нет — bbox = null.
 */
function computeCharacterBBox(mask, w, h, opts = {}) {
  const minSize = opts.minComponentSize ?? 100;
  const N = w * h;
  const visited = new Uint8Array(N);
  const queue = new Int32Array(N);

  let best = null;
  let bestSize = 0;

  for (let start = 0; start < N; start++) {
    if (visited[start] || mask[start] === 1) continue;

    let head = 0, tail = 0;
    queue[tail++] = start;
    visited[start] = 1;

    let minX = w, minY = h, maxX = -1, maxY = -1, size = 0;

    while (head < tail) {
      const cur = queue[head++];
      const cx = cur % w;
      const cy = (cur / w) | 0;
      size++;
      if (cx < minX) minX = cx;
      if (cy < minY) minY = cy;
      if (cx > maxX) maxX = cx;
      if (cy > maxY) maxY = cy;

      if (cx > 0)     { const n = cur - 1; if (!visited[n] && mask[n] === 0) { visited[n] = 1; queue[tail++] = n; } }
      if (cx < w - 1) { const n = cur + 1; if (!visited[n] && mask[n] === 0) { visited[n] = 1; queue[tail++] = n; } }
      if (cy > 0)     { const n = cur - w; if (!visited[n] && mask[n] === 0) { visited[n] = 1; queue[tail++] = n; } }
      if (cy < h - 1) { const n = cur + w; if (!visited[n] && mask[n] === 0) { visited[n] = 1; queue[tail++] = n; } }
    }

    if (size >= minSize && size > bestSize) {
      bestSize = size;
      best = { minX, minY, maxX, maxY, size };
    }
  }

  if (!best) return null;
  return {
    x: best.minX,
    y: best.minY,
    w: best.maxX - best.minX + 1,
    h: best.maxY - best.minY + 1,
    area: best.size,
    fillRatio: best.size / ((best.maxX - best.minX + 1) * (best.maxY - best.minY + 1))
  };
}

/**
 * Профиль ширины персонажа по строкам внутри bbox.
 */
function computeWidthProfile(mask, w, h, bbox) {
  const y0 = bbox.y;
  const y1 = bbox.y + bbox.h;
  const bh = bbox.h;
  const width = new Int32Array(bh);
  const leftEdge = new Int32Array(bh).fill(-1);
  const rightEdge = new Int32Array(bh).fill(-1);
  const centerGap = new Int32Array(bh);

  for (let yy = 0; yy < bh; yy++) {
    const y = y0 + yy;
    if (y >= h) break;
    const row = y * w;
    let count = 0;
    let lEdge = -1, rEdge = -1;
    let firstChar = -1, lastChar = -1;
    const x0 = Math.max(0, bbox.x);
    const x1 = Math.min(w, bbox.x + bbox.w);
    for (let x = x0; x < x1; x++) {
      if (mask[row + x] === 0) {
        count++;
        if (lEdge === -1) lEdge = x;
        rEdge = x;
        if (firstChar === -1) firstChar = x;
        lastChar = x;
      }
    }
    width[yy] = count;
    leftEdge[yy] = lEdge;
    rightEdge[yy] = rEdge;
    if (firstChar !== -1 && lastChar > firstChar) {
      let gap = 0, maxGap = 0;
      for (let x = firstChar; x <= lastChar; x++) {
        if (mask[row + x] === 1) { gap++; if (gap > maxGap) maxGap = gap; }
        else gap = 0;
      }
      centerGap[yy] = maxGap;
    } else {
      centerGap[yy] = 0;
    }
  }

  return { width, leftEdge, rightEdge, centerGap, y0, bh };
}

/**
 * Поиск «точки лобка» — границы торс/ноги.
 */
function findPubicPoint(mask, w, h, bbox, profile) {
  const bh = profile.bh;
  if (bh < 20) return null;

  const width = profile.width;

  // Сглаживаем профиль (окно ±2)
  const smoothed = new Float32Array(bh);
  const R = 2;
  for (let y = 0; y < bh; y++) {
    let s = 0, c = 0;
    for (let k = -R; k <= R; k++) {
      const yy = y + k;
      if (yy < 0 || yy >= bh) continue;
      s += width[yy]; c++;
    }
    smoothed[y] = c ? s / c : 0;
  }

  const yStart = Math.floor(bh * 0.40);
  const yEnd   = Math.floor(bh * 0.95);

  // Пик ширины (бёдра)
  let hipY = -1, hipW = 0;
  for (let y = yStart + 2; y < yEnd - 2; y++) {
    const v = smoothed[y];
    if (v > smoothed[y - 1] && v >= smoothed[y + 1] && v > hipW) {
      hipW = v; hipY = y;
    }
  }
  if (hipY === -1) {
    for (let y = yStart; y < yEnd; y++) {
      if (smoothed[y] > hipW) { hipW = smoothed[y]; hipY = y; }
    }
  }
  if (hipY === -1) return null;

  // Первая строка ниже бёдер, где ширина стабильно < 60% от пика
  const dropThreshold = hipW * 0.60;
  let pubicY = -1;
  const confirmRows = 4;
  for (let y = hipY + 1; y < yEnd - confirmRows; y++) {
    let ok = true;
    for (let k = 0; k < confirmRows; k++) {
      if (smoothed[y + k] > dropThreshold) { ok = false; break; }
    }
    if (ok) { pubicY = y; break; }
  }
  if (pubicY === -1) {
    pubicY = Math.floor(bh * 0.52);
  }

  // Уточнение по «провалу» между ног
  const gap = profile.centerGap;
  let method = 'width';
  const minGap = Math.max(3, Math.round(bbox.w * 0.015));
  const confirmGap = 3;
  for (let y = Math.max(pubicY, yStart); y < yEnd - confirmGap; y++) {
    let ok = true;
    for (let k = 0; k < confirmGap; k++) {
      if (gap[y + k] < minGap) { ok = false; break; }
    }
    if (ok) {
      const adjust = Math.max(1, Math.round(bh * 0.02));
      pubicY = Math.max(hipY + 1, y - adjust);
      method = 'gap';
      break;
    }
  }

  // X центра фигуры в строке лобка
  const yAbs = bbox.y + pubicY;
  const lE = profile.leftEdge[pubicY];
  const rE = profile.rightEdge[pubicY];
  const pubicX = (lE >= 0 && rE >= 0) ? Math.round((lE + rE) / 2) : Math.round(bbox.x + bbox.w / 2);

  const shouldersY = findShouldersY(smoothed, bh);
  const waistY     = findWaistY(smoothed, bh, shouldersY, hipY);

  return {
    y: yAbs,
    x: pubicX,
    yNorm: pubicY / bh,
    method,
    hipY: bbox.y + hipY,
    hipWidth: Math.round(hipW),
    shouldersY: shouldersY >= 0 ? bbox.y + shouldersY : null,
    waistY: waistY >= 0 ? bbox.y + waistY : null,
    shouldersWidth: shouldersY >= 0 ? Math.round(smoothed[shouldersY]) : null,
    waistWidth: waistY >= 0 ? Math.round(smoothed[waistY]) : null
  };
}

function findShouldersY(smoothed, bh) {
  const yStart = Math.floor(bh * 0.10);
  const yEnd   = Math.floor(bh * 0.35);
  let best = -1, bestW = 0;
  for (let y = yStart + 2; y < yEnd - 2; y++) {
    const v = smoothed[y];
    if (v > smoothed[y - 1] && v >= smoothed[y + 1] && v > bestW) {
      bestW = v; best = y;
    }
  }
  return best;
}

function findWaistY(smoothed, bh, shouldersY, hipY) {
  if (shouldersY < 0 || hipY < 0 || hipY <= shouldersY + 2) return -1;
  let best = -1, bestW = Infinity;
  for (let y = shouldersY + 2; y < hipY - 2; y++) {
    if (smoothed[y] < bestW) { bestW = smoothed[y]; best = y; }
  }
  return best;
}

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

function erode(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (!copy[idx]) continue;
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
