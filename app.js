'use strict';

// ============ Утилиты ============
const $ = (id) => document.getElementById(id);

const dropzone   = $('dropzone');
const fileInput  = $('fileInput');
const canvas     = $('canvas');
const ctx        = canvas.getContext('2d', { willReadFrequently: true });
const analyzeBtn = $('analyzeBtn');
const results    = $('results');
const loading    = $('loading');
const canvasWrap = $('canvasWrap');
const legend     = $('legend');
const toggleLinesBtn = $('toggleLinesBtn');
const sliderRow  = $('sliderRow');
const thresholdSlider = $('thresholdSlider');
const thresholdVal = $('thresholdVal');

let currentImage = null;     // HTMLImageElement
let baseCanvas   = null;     // чистая копия изображения (без оверлея)
let lastData     = null;     // результаты последнего анализа
let showLines    = true;
let sliderTimer  = null;

// ============ Загрузка файла ============
function handleFile(file) {
  if (!file) return;
  if (!file.type || !file.type.startsWith('image/')) {
    alert('Это не изображение: ' + (file.type || 'неизвестный тип'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => alert('Не удалось прочитать файл');
  reader.onload = (ev) => {
    const img = new Image();
    img.onerror = () => alert('Не удалось декодировать изображение');
    img.onload = () => {
      currentImage = img;

      // Ограничим размер для скорости
      const MAX = 900;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width  * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      canvas.width  = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      // Сохраняем чистую копию
      baseCanvas = document.createElement('canvas');
      baseCanvas.width = w;
      baseCanvas.height = h;
      baseCanvas.getContext('2d').drawImage(canvas, 0, 0);

      canvasWrap.classList.add('visible');
      analyzeBtn.disabled = false;
      results.style.display = 'none';
      legend.style.display = 'none';
      sliderRow.classList.remove('visible');
      toggleLinesBtn.style.display = 'none';
      lastData = null;
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// События загрузки
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length) {
    handleFile(e.target.files[0]);
  }
});

// ============ Кнопка «Анализировать» ============
analyzeBtn.addEventListener('click', async () => {
  if (!currentImage) return;
  loading.style.display = 'block';
  results.style.display = 'none';
  analyzeBtn.disabled = true;

  await new Promise(r => setTimeout(r, 30));

  try {
    // Восстанавливаем чистую копию, чтобы не накладывать оверлей на предыдущий
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseCanvas, 0, 0);

    lastData = analyzeImage(currentImage);
    showLines = true;
    toggleLinesBtn.textContent = 'Скрыть линии';
    toggleLinesBtn.style.display = 'inline-block';
    sliderRow.classList.add('visible');
    legend.style.display = 'flex';

    redraw();
    renderResults(lastData);
  } catch (err) {
    console.error(err);
    alert('Ошибка анализа: ' + err.message);
  } finally {
    loading.style.display = 'none';
    analyzeBtn.disabled = false;
  }
});

// ============ Перерисовка ============
function redraw() {
  if (!baseCanvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseCanvas, 0, 0);
  if (!showLines || !lastData) return;

  const MIN_VOTES = Number(thresholdSlider.value) || 0;
  const filteredSegments = (lastData.segments || []).filter(s => s.votes >= MIN_VOTES);

  drawPerspectiveOverlay({
    ...lastData,
    segments: filteredSegments
  });
}

toggleLinesBtn.addEventListener('click', () => {
  showLines = !showLines;
  toggleLinesBtn.textContent = showLines ? 'Скрыть линии' : 'Показать линии';
  redraw();
});

thresholdSlider.addEventListener('input', (e) => {
  thresholdVal.textContent = e.target.value;
  if (sliderTimer) clearTimeout(sliderTimer);
  sliderTimer = setTimeout(redraw, 120);
});

// ============ Анализ ============
function analyzeImage(img) {
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const pixels = imgData.data;

  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    gray[p] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }

  const edges = detectEdges(gray, w, h);
  const lineInfo = analyzeLines(edges, w, h);
  const colorGradient = analyzeColorGradient(pixels, w, h);
  const sharpnessGradient = analyzeSharpnessGradient(gray, w, h);

  const verdict = classify({
    lineCount: lineInfo.lineCount,
    angleCoherence: lineInfo.angleCoherence,
    verticalConvergence: lineInfo.verticalConvergence,
    colorGradient,
    sharpnessGradient
  });

  return {
    verdict,
    lineCount: lineInfo.lineCount,
    angleCoherence: lineInfo.angleCoherence,
    verticalConvergence: lineInfo.verticalConvergence,
    dominantAngle: lineInfo.dominantAngle,
    vanishingPoint: lineInfo.vanishingPoint,
    horizonY: lineInfo.horizonY,
    segments: lineInfo.segments,
    colorGradient,
    sharpnessGradient,
    w, h
  };
}

// ============ Sobel ============
function detectEdges(gray, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -gray[i-w-1] - 2*gray[i-1] - gray[i+w-1]
               +  gray[i-w+1] + 2*gray[i+1] + gray[i+w+1];
      const gy = -gray[i-w-1] - 2*gray[i-w] - gray[i-w+1]
               +  gray[i+w-1] + 2*gray[i+w] + gray[i+w+1];
      out[i] = Math.sqrt(gx*gx + gy*gy);
    }
  }
  return out;
}

// ============ Хаф + точка схода ============
function analyzeLines(edges, w, h) {
  const THRESHOLD = 70;
  const edgePoints = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (edges[y * w + x] > THRESHOLD) edgePoints.push({ x, y, v: edges[y*w+x] });
    }
  }

  let segments = [], angleCoherence = 0, dominantAngle = 0;
  let vanishingPoint = null, horizonY = null, convergence = 0;

  if (edgePoints.length > 40) {
    const hough = houghTransform(edgePoints, w, h, 180, 200);

    segments = hough.best.slice(0, 14).map(l => ({
      angle: l.angle,
      theta: l.theta,
      rho: l.rho,
      votes: l.votes,
      vertical: (l.angle > 60 && l.angle < 120),
      horizontal: (l.angle < 20 || l.angle > 160)
    }));

    let maxBin = 0, maxVal = 0;
    for (let i = 0; i < hough.angleHist.length; i++) {
      if (hough.angleHist[i] > maxVal) { maxVal = hough.angleHist[i]; maxBin = i; }
    }
    dominantAngle = maxBin;
    const totalVotes = hough.angleHist.reduce((a, b) => a + b, 0) || 1;
    angleCoherence = Math.min(1, hough.angleHist[maxBin] / totalVotes);

    vanishingPoint = findVanishingPoint(segments, w, h);
    if (vanishingPoint) {
      horizonY = vanishingPoint.y;
      convergence = vanishingPoint.convergence;
    }
  }

  return {
    lineCount: edgePoints.length,
    dominantAngle,
    angleCoherence,
    verticalConvergence: convergence,
    vanishingPoint,
    horizonY,
    segments
  };
}

function houghTransform(points, w, h, nTheta = 180, nRho = 200) {
  const diag = Math.hypot(w, h);
  const rhoMin = -diag, rhoMax = diag;
  const rhoStep = (rhoMax - rhoMin) / nRho;
  const thetaStep = Math.PI / nTheta;

  const acc = new Float32Array(nTheta * nRho);
  const cosT = new Float32Array(nTheta);
  const sinT = new Float32Array(nTheta);
  for (let t = 0; t < nTheta; t++) {
    const th = t * thetaStep;
    cosT[t] = Math.cos(th);
    sinT[t] = Math.sin(th);
  }

  for (const pt of points) {
    for (let t = 0; t < nTheta; t++) {
      const rho = pt.x * cosT[t] + pt.y * sinT[t];
      const rIdx = Math.round((rho - rhoMin) / rhoStep);
      if (rIdx >= 0 && rIdx < nRho) acc[t * nRho + rIdx] += pt.v;
    }
  }

  const found = [];
  for (let t = 0; t < nTheta; t++) {
    for (let r = 1; r < nRho - 1; r++) {
      const v = acc[t * nRho + r];
      if (v < 500) continue;
      let isMax = true;
      for (let dt = -2; dt <= 2 && isMax; dt++) {
        for (let dr = -2; dr <= 2; dr++) {
          if (dt === 0 && dr === 0) continue;
          const tt = (t + dt + nTheta) % nTheta;
          const rr = r + dr;
          if (rr < 0 || rr >= nRho) continue;
          if (acc[tt * nRho + rr] > v) { isMax = false; break; }
        }
      }
      if (isMax) {
        found.push({
          angle: t * thetaStep * 180 / Math.PI,
          theta: t * thetaStep,
          rho: rhoMin + (r + 0.5) * rhoStep,
          votes: v
        });
      }
    }
  }
  found.sort((a, b) => b.votes - a.votes);

  const angleHist = new Float32Array(nTheta);
  for (const l of found) {
    const idx = Math.round(l.angle / (180 / nTheta)) % nTheta;
    angleHist[idx] += l.votes;
  }

  return { best: found, angleHist };
}

function findVanishingPoint(segments, w, h) {
  const lines = segments.filter(s => s.votes > 1000).slice(0, 10);
  if (lines.length < 2) return null;

  const intersections = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const da = Math.abs(lines[i].angle - lines[j].angle);
      if (da < 10 || da > 170) continue;
      const p = intersectLines(lines[i], lines[j]);
      if (p && p.x > -w && p.x < 2*w && p.y > -h && p.y < 2*h) intersections.push(p);
    }
  }
  if (intersections.length < 2) return null;

  const xs = intersections.map(p => p.x).sort((a, b) => a - b);
  const ys = intersections.map(p => p.y).sort((a, b) => a - b);
  const medX = xs[Math.floor(xs.length / 2)];
  const medY = ys[Math.floor(ys.length / 2)];

  const near = intersections.filter(p =>
    Math.hypot(p.x - medX, p.y - medY) < Math.max(w, h) * 0.3
  ).length;
  const convergence = near / intersections.length;

  return { x: medX, y: medY, convergence };
}

function intersectLines(l1, l2) {
  const c1 = Math.cos(l1.theta), s1 = Math.sin(l1.theta);
  const c2 = Math.cos(l2.theta), s2 = Math.sin(l2.theta);
  const det = c1 * s2 - c2 * s1;
  if (Math.abs(det) < 1e-6) return null;
  const x = (l1.rho * s2 - l2.rho * s1) / det;
  const y = (l2.rho * c1 - l1.rho * c2) / det;
  return { x, y };
}

// ============ Рисование ============
function drawPerspectiveOverlay(data) {
  const { w, h, segments, vanishingPoint, horizonY, verdict } = data;

  // Затемняющая подложка
  ctx.save();
  ctx.fillStyle = 'rgba(10, 15, 25, 0.35)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Линии Хафа
  ctx.save();
  ctx.lineCap = 'round';
  for (const s of segments) {
    const strength = Math.min(1, s.votes / 5000);
    const col = s.vertical ? [125, 211, 252]
              : s.horizontal ? [167, 139, 250]
              : [250, 204, 21];
    ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${0.35 + strength * 0.65})`;
    ctx.lineWidth = 1 + strength * 2.5;
    drawRhoThetaLine(s.rho, s.theta, w, h);
  }
  ctx.restore();

  // Точка схода
  if (vanishingPoint && vanishingPoint.convergence > 0.2) {
    const vp = vanishingPoint;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 90, 120, 0.55)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    for (const s of segments.slice(0, 8)) {
      const mid = nearestPointOnLine(s, w / 2, h / 2);
      if (mid) {
        ctx.beginPath();
        ctx.moveTo(mid.x, mid.y);
        ctx.lineTo(vp.x, vp.y);
        ctx.stroke();
      }
    }
    ctx.restore();

    const cx = Math.max(0, Math.min(w, vp.x));
    const cy = Math.max(0, Math.min(h, vp.y));

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 60, 90, 0.95)';
    ctx.shadowColor = 'rgba(255, 60, 90, 0.9)';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
    ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText('Точка схода', cx + 16, cy - 10);
    ctx.fillText('Точка схода', cx + 16, cy - 10);
    ctx.restore();
  }

  // Горизонт
  if (horizonY !== null && horizonY > 0 && horizonY < h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
    ctx.setLineDash([10, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = '#7dd3fc';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText('Горизонт', 10, horizonY - 8);
    ctx.fillText('Горизонт', 10, horizonY - 8);
    ctx.restore();
  }

  // Плашка с типом
  ctx.save();
  const pad = 10;
  ctx.font = 'bold 15px -apple-system, sans-serif';
  const txt = verdict.type;
  const tw = ctx.measureText(txt).width;
  const bx = 12, by = 12, bw = tw + pad * 2, bh = 32;
  roundRect(ctx, bx, by, bw, bh, 8);
  ctx.fillStyle = 'rgba(15, 20, 30, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#7dd3fc');
  grad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = grad;
  ctx.fillText(txt, bx + pad, by + 22);
  ctx.restore();
}

function drawRhoThetaLine(rho, theta, w, h) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const x0 = rho * c, y0 = rho * s;
  const dx = -s, dy = c;
  const L = Math.max(w, h) * 2;
  ctx.beginPath();
  ctx.moveTo(x0 - dx * L, y0 - dy * L);
  ctx.lineTo(x0 + dx * L, y0 + dy * L);
  ctx.stroke();
}

function nearestPointOnLine(s, px, py) {
  const c = Math.cos(s.theta), sn = Math.sin(s.theta);
  const d = px * c + py * sn - s.rho;
  return { x: px - d * c, y: py - d * sn };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ============ Воздушная перспектива ============
function analyzeColorGradient(pixels, w, h) {
  const zones = [
    { y0: 0, y1: Math.floor(h / 3) },
    { y0: Math.floor(h / 3), y1: Math.floor(2 * h / 3) },
    { y0: Math.floor(2 * h / 3), y1: h }
  ];
  const stats = zones.map(z => {
    let sat = 0, lum = 0, bs = 0, count = 0;
    for (let y = z.y0; y < z.y1; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const i = (y * w + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        sat += (mx - mn) / 255;
        lum += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        bs += (b - r) / 255;
        count++;
      }
    }
    return { sat: sat / count, lum: lum / count, bs: bs / count };
  });
  const top = stats[0], bot = stats[2];
  const score = Math.min(1,
    Math.max(0, bot.sat - top.sat) * 2 +
    Math.max(0, top.lum - bot.lum) * 1.5 +
    Math.max(0, top.bs - bot.bs) * 2
  );
  return { score, topSat: top.sat, botSat: bot.sat, topLum: top.lum, botLum: bot.lum };
}

function analyzeSharpnessGradient(gray, w, h) {
  function variance(x0, y0, x1, y1) {
    let s = 0, s2 = 0, c = 0;
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const v = gray[y * w + x];
        s += v; s2 += v * v; c++;
      }
    }
    if (!c) return 0;
    const m = s / c;
    return Math.sqrt(Math.max(0, s2 / c - m * m));
  }
  const top = variance(0, 0, w, Math.floor(h / 3));
  const bot = variance(0, Math.floor(2 * h / 3), w, h);
  return {
    score: bot > 0 ? Math.min(1, Math.max(0, (bot - top) / bot)) : 0,
    topSharpness: top,
    botSharpness: bot
  };
}

// ============ Классификация ============
function classify(m) {
  const { lineCount, angleCoherence, verticalConvergence, colorGradient, sharpnessGradient } = m;
  const strongLines = lineCount > 200 && angleCoherence > 0.2;
  const convergence = verticalConvergence > 0.35;
  const air = colorGradient.score > 0.3 || sharpnessGradient.score > 0.3;

  if (strongLines && convergence) return {
    type: 'Линейная перспектива',
    confidence: Math.round((0.5 + verticalConvergence * 0.5) * 100),
    desc: 'Обнаружены сходящиеся линии и точка схода — классическая ренессансная перспектива.'
  };
  if (air && !convergence) return {
    type: 'Воздушная перспектива',
    confidence: Math.round((0.4 + colorGradient.score * 0.4 + sharpnessGradient.score * 0.2) * 100),
    desc: 'Глубина передаётся цветом и размытием: дальние планы светлее, бледнее и мягче.'
  };
  if (strongLines && !convergence) return {
    type: 'Параллельная / изометрическая',
    confidence: Math.round((0.4 + angleCoherence * 0.5) * 100),
    desc: 'Много параллельных линий без выраженной точки схода.'
  };
  if (angleCoherence < 0.15 && !air) return {
    type: 'Возможно, обратная перспектива',
    confidence: 45,
    desc: 'Слабая когерентность линий и отсутствие атмосферных градиентов — характерно для иконописи.'
  };
  return {
    type: 'Перспектива не выражена',
    confidence: 60,
    desc: 'Явных признаков линейной или воздушной перспективы не найдено.'
  };
}

// ============ Карточки результатов ============
function renderResults(d) {
  const v = d.verdict;
  results.innerHTML = `
    <div class="card" style="grid-column: 1 / -1;">
      <h3>Вердикт</h3>
      <div class="verdict">${v.type}</div>
      <div class="metric"><span>Уверенность</span><span>${v.confidence}%</span></div>
      <div class="bar"><div style="width:${v.confidence}%"></div></div>
      <p class="desc">${v.desc}</p>
    </div>
    <div class="card">
      <h3>Линейный анализ</h3>
      <div class="metric"><span>Краевых точек</span><span>${d.lineCount}</span></div>
      <div class="metric"><span>Когерентность линий</span><span>${(d.angleCoherence * 100).toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${d.angleCoherence * 100}%"></div></div>
      <div class="metric"><span>Сходимость</span><span>${(d.verticalConvergence * 100).toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${d.verticalConvergence * 100}%"></div></div>
      <div class="metric"><span>Доминирующий угол</span><span>${d.dominantAngle.toFixed(0)}°</span></div>
    </div>
    <div class="card">
      <h3>Воздушная перспектива</h3>
      <div class="metric"><span>Индекс атмосферы</span><span>${(d.colorGradient.score * 100).toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${d.colorGradient.score * 100}%"></div></div>
      <div class="metric"><span>Насыщ. верх/низ</span><span>${d.colorGradient.topSat.toFixed(2)} / ${d.colorGradient.botSat.toFixed(2)}</span></div>
      <div class="metric"><span>Яркость верх/низ</span><span>${d.colorGradient.topLum.toFixed(2)} / ${d.colorGradient.botLum.toFixed(2)}</span></div>
    </div>
    <div class="card">
      <h3>Глубина резкости</h3>
      <div class="metric"><span>Градиент детализации</span><span>${(d.sharpnessGradient.score * 100).toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${d.sharpnessGradient.score * 100}%"></div></div>
      <div class="metric"><span>Детализация верх/низ</span><span>${d.sharpnessGradient.topSharpness.toFixed(1)} / ${d.sharpnessGradient.botSharpness.toFixed(1)}</span></div>
    </div>
  `;
  results.style.display = 'grid';
        }
