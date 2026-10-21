// ============================================================
//  Web Worker: тяжёлые вычисления маски
//  VERSION: 2025-01-05 · pubic line (-7%) + horiz mid (0%) + chin + shoulders
// ============================================================

console.log('[worker] SCRIPT LOADED v2025-01-05');

self.onmessage = (e) => {
  const { type, payload } = e.data;
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
          bbox: result.bbox,
          widthProfile: result.widthProfile,
          searchHorizLine: result.searchHorizLine,
          vertAxis: result.vertAxis,
          chinLine: result.chinLine,
          shouldersLine: result.shouldersLine,
          pubicLine: result.pubicLine
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
    regionTolerance,
    horizShiftPercent,
    vertShiftPercent,
    chinShiftPercent,
    shouldersShiftPercent,
    pubicShiftPercent
  } = p;

  const w = width, h = height;
  const N = w * h;
  const data = imageData.data;

  const lum = new Float32Array(N);
  for (let i = 0, j = 0; j < N * 4; i++, j += 4) {
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

  const bbox = computeCharacterBBox(mask, w, h, { minComponentSize: 200 });
  let widthProfile = null;
  let searchHorizLine = null;
  let vertAxis = null;
  let chinLine = null;
  let shouldersLine = null;
  let pubicLine = null;

  if (bbox) {
    widthProfile = computeWidthProfile(mask, w, h, bbox);
    vertAxis = computeVertAxis(bbox, vertShiftPercent);

    // 1. Горизонтальная поисковая линия (по центру, 0%)
    const horizShift = (typeof horizShiftPercent !== 'undefined') ? horizShiftPercent : 0;
    const horizY = Math.round(bbox.h * (0.5 + horizShift / 100));
    searchHorizLine = {
      y: bbox.y + Math.max(0, Math.min(bbox.h - 1, horizY)),
      yNorm: 0.5 + horizShift / 100,
      shiftPercent: horizShift
    };

    // 2. Линия подбородка (13%)
    const chinShift = (typeof chinShiftPercent !== 'undefined') ? chinShiftPercent : 13;
    const chinY = Math.round(bbox.h * (chinShift / 100));
    chinLine = {
      y: bbox.y + chinY,
      yNorm: chinShift / 100,
      shiftPercent: chinShift
    };

    // 3. Линия плеч (16%)
    const shouldersShift = (typeof shouldersShiftPercent !== 'undefined') ? shouldersShiftPercent : 16;
    const shouldersY = Math.round(bbox.h * (shouldersShift / 100));
    shouldersLine = {
      y: bbox.y + shouldersY,
      yNorm: shouldersShift / 100,
      shiftPercent: shouldersShift
    };

    // 4. Линия лобка (-7%)
    const pubicShift = (typeof pubicShiftPercent !== 'undefined') ? pubicShiftPercent : -7;
    const pubicY = Math.round(bbox.h * (0.5 + pubicShift / 100));
    pubicLine = {
      y: bbox.y + Math.max(0, Math.min(bbox.h - 1, pubicY)),
      yNorm: 0.5 + pubicShift / 100,
      shiftPercent: pubicShift
    };
  }

  return {
    mask, bgCount, width: w, height: h,
    bbox, widthProfile, searchHorizLine, vertAxis, chinLine, shouldersLine, pubicLine
  };
}

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

function computeWidthProfile(mask, w, h, bbox) {
  const y0 = bbox.y;
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

function computeVertAxis(bbox, vertShiftPercent) {
  const shiftVal = (vertShiftPercent !== undefined) ? vertShiftPercent : 0;
  const shift = shiftVal / 100;
  let axisX = Math.round(bbox.x + bbox.w * (0.5 + shift));
  axisX = Math.max(bbox.x, Math.min(bbox.x + bbox.w - 1, axisX));
  return {
    x: axisX,
    xNorm: (axisX - bbox.x) / bbox.w,
    shiftPercent: shiftVal
  };
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
