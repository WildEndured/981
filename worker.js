// ============================================================
//  Web Worker · шаг сетки в целых процентах
// ============================================================
console.log('[worker] loaded');

self.onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === 'buildMask') {
    try {
      const r = buildMaskInWorker(payload);
      self.postMessage({
        type: 'mask',
        payload: {
          mask: r.mask, bgCount: r.bgCount,
          width: r.width, height: r.height,
          bbox: r.bbox,
          searchHorizLine: r.searchHorizLine,
          vertAxis: r.vertAxis,
          gridLines: r.gridLines,
          gridInfo: r.gridInfo
        }
      });
    } catch (err) {
      self.postMessage({ type: 'error', payload: String(err && err.message || err) });
    }
    return;
  }

  if (type === 'findHead') {
    try {
      const r = findHead(payload.mask, payload.width, payload.height, payload.bbox);
      self.postMessage({ type: 'headFound', payload: r });
    } catch (err) {
      self.postMessage({ type: 'headFound', payload: { ok: false, reason: String(err && err.message || err) } });
    }
    return;
  }
};

function buildMaskInWorker(p) {
  const {
    imageData, width, height,
    mode, thresholdLum, colorSamples, thresholdDist, invert,
    sourcePoints, autoSeeds, useSmooth, smoothIter, morphOpen, morphClose,
    regionTolerance, horizShiftPercent, vertShiftPercent,
    gridStepPercent, gridAlign
  } = p;

  const w = width, h = height, N = w * h;
  const data = imageData.data;

  const lum = new Float32Array(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    if (data[j + 3] < 20) { lum[i] = 255; continue; }
    lum[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }

  const dist2 = thresholdDist * thresholdDist * 3;
  const colorMode = (mode === 'color' && colorSamples && colorSamples.length > 0);

  function isPixelBg(idx) {
    let matched;
    if (mode === 'lum') matched = lum[idx] >= thresholdLum;
    else if (mode === 'color') {
      if (!colorMode) return invert;
      matched = false;
      const j = idx * 4;
      const r = data[j], g = data[j + 1], b = data[j + 2];
      for (let k = 0; k < colorSamples.length; k++) {
        const s = colorSamples[k];
        const dr = r - s.r, dg = g - s.g, db = b - s.b;
        if (dr * dr + dg * dg + db * db <= dist2) { matched = true; break; }
      }
    } else matched = lum[idx] >= thresholdLum;
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
  let searchHorizLine = null;
  let vertAxis = null;
  let gridLines = [];
  let gridInfo = null;

  if (bbox) {
    vertAxis = computeVertAxis(bbox, vertShiftPercent);

    const hs = (typeof horizShiftPercent !== 'undefined') ? horizShiftPercent : 0;
    const hy = Math.round(bbox.h * (0.5 + hs / 100));
    searchHorizLine = {
      y: bbox.y + Math.max(0, Math.min(bbox.h - 1, hy)),
      yNorm: 0.5 + hs / 100,
      shiftPercent: hs
    };

    const r = buildGridLines(bbox, gridStepPercent || 13, gridAlign || 'from-top');
    gridLines = r.lines;
    gridInfo = r.info;
  }

  return {
    mask, bgCount, width: w, height: h,
    bbox, searchHorizLine, vertAxis, gridLines, gridInfo
  };
}

// Шаг в целых процентах
function buildGridLines(bbox, stepPercent, align) {
  const step = Math.max(1, Math.round(stepPercent));
  const offset = (align === 'centered') ? step / 2 : 0;
  const lines = [];
  const headCount = 100 / step;
  const headPx = bbox.h / headCount;

  for (let i = 1; ; i++) {
    const p = i * step - offset;
    if (p >= 100) break;
    if (p <= 0.01) continue;
    lines.push({
      y: bbox.y + Math.round(bbox.h * p / 100),
      yNorm: p / 100,
      percent: p
    });
  }

  return {
    lines,
    info: {
      stepPercent: step,
      headCount,
      headPx: Math.round(headPx * 10) / 10,
      lines: lines.length,
      align
    }
  };
}

function findHead(mask, w, h, bbox) {
  if (!mask || !bbox) return { ok: false, reason: 'нет маски' };
  const bx = bbox.x, by = bbox.y, bw = bbox.w, bh = bbox.h;
  const maxY = Math.min(bh - 1, Math.floor(bh * 0.5));
  const profile = new Float32Array(maxY + 1);

  for (let yy = 0; yy <= maxY; yy++) {
    const rowY = by + yy;
    let c = 0;
    for (let xx = 0; xx < bw; xx++) {
      const idx = rowY * w + (bx + xx);
      if (mask[idx] === 0) c++;
    }
    profile[yy] = c;
  }

  const sm = new Float32Array(profile.length);
  const k = 3;
  for (let i = 0; i < profile.length; i++) {
    let s = 0, n = 0;
    for (let d = -k; d <= k; d++) {
      const j = i + d;
      if (j < 0 || j >= profile.length) continue;
      s += profile[j]; n++;
    }
    sm[i] = s / n;
  }

  const lo = Math.floor(bh * 0.15);
  const hi = Math.min(sm.length - 1, Math.floor(bh * 0.45));
  let maxW = 0;
  for (let i = 0; i <= hi; i++) if (sm[i] > maxW) maxW = sm[i];
  if (maxW < 1) return { ok: false, reason: 'пустой верх' };

  let bestY = -1, bestVal = Infinity;
  for (let i = lo; i <= hi; i++) {
    if (sm[i] < bestVal) { bestVal = sm[i]; bestY = i; }
  }
  if (bestY < 0 || bestVal > 0.7 * maxW) return { ok: false, reason: 'нет сужения' };

  const headHeight = bestY;
  if (headHeight < bh * 0.08) return { ok: false, reason: 'голова слишком мала' };
  const N = bh / headHeight;
  if (N < 2.5 || N > 10) return { ok: false, reason: 'нереалистичный рост ' + N.toFixed(1) };

  return { ok: true, headCount: Math.round(N * 100) / 100, headPx: Math.round(headHeight) };
}

function computeCharacterBBox(mask, w, h, opts = {}) {
  const minSize = opts.minComponentSize ?? 100;
  const N = w * h;
  const visited = new Uint8Array(N);
  const queue = new Int32Array(N);
  let best = null, bestSize = 0;

  for (let start = 0; start < N; start++) {
    if (visited[start] || mask[start] === 1) continue;
    let head = 0, tail = 0;
    queue[tail++] = start; visited[start] = 1;
    let minX = w, minY = h, maxX = -1, maxY = -1, size = 0;

    while (head < tail) {
      const cur = queue[head++];
      const cx = cur % w, cy = (cur / w) | 0;
      size++;
      if (cx < minX) minX = cx; if (cy < minY) minY = cy;
      if (cx > maxX) maxX = cx; if (cy > maxY) maxY = cy;
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
    x: best.minX, y: best.minY,
    w: best.maxX - best.minX + 1,
    h: best.maxY - best.minY + 1,
    area: best.size,
    fillRatio: best.size / ((best.maxX - best.minX + 1) * (best.maxY - best.minY + 1))
  };
}

function computeVertAxis(bbox, vertShiftPercent) {
  const shiftVal = (vertShiftPercent !== undefined) ? vertShiftPercent : 0;
  const shift = shiftVal / 100;
  let axisX = Math.round(bbox.x + bbox.w * (0.5 + shift));
  axisX = Math.max(bbox.x, Math.min(bbox.x + bbox.w - 1, axisX));
  return { x: axisX, xNorm: (axisX - bbox.x) / bbox.w, shiftPercent: shiftVal };
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

    tryNeighbor(x + 1, y); tryNeighbor(x - 1, y);
    tryNeighbor(x, y + 1); tryNeighbor(x, y - 1);
  }
}

function erode(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const idx = y * w + x;
    if (!copy[idx]) continue;
    if (!copy[idx - 1] || !copy[idx + 1] || !copy[idx - w] || !copy[idx + w]) mask[idx] = 0;
  }
}

function dilate(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const idx = y * w + x;
    if (copy[idx]) continue;
    if (copy[idx - 1] || copy[idx + 1] || copy[idx - w] || copy[idx + w]) mask[idx] = 1;
  }
}

function smoothOnce(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const idx = y * w + x;
    let bgCount = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      bgCount += copy[idx + dy * w + dx];
    }
    if (bgCount >= 7) mask[idx] = 1;
    else if (bgCount <= 1) mask[idx] = 0;
  }
}
