// ============================================================
//  Web Worker · маска + пользовательские линии пропорций
// ============================================================
console.log('[worker] loaded v-no-grid');

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
          propLines: r.propLines
        }
      });
    } catch (err) {
      self.postMessage({ type: 'error', payload: String(err && err.message || err) });
    }
    return;
  }
};

function buildMaskInWorker(p) {
  const {
    imageData, width, height,
    mode, thresholdLum, colorSamples, thresholdDist, invert,
    sourcePoints, autoSeeds, useSmooth, smoothIter, morphOpen, morphClose,
    regionTolerance, activePropLines
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
  let propLines = [];

  if (bbox) {
    if (Array.isArray(activePropLines) && activePropLines.length > 0) {
      propLines = activePropLines.map(line => ({
        id: line.id,
        label: line.label,
        percent: line.percent,
        y: bbox.y + Math.round(bbox.h * (line.percent / 100)),
        enabled: line.enabled !== false,
        width: line.width
      }));
    }
  }

  return {
    mask, bgCount, width: w, height: h,
    bbox, propLines
  };
}

// ... остальные функции (computeCharacterBBox, regionGrow, erode, dilate, smoothOnce) остаются без изменений
