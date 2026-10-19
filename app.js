// ============ Утилиты ============
const $ = (id) => document.getElementById(id);

const dropzone = $('dropzone');
const fileInput = $('fileInput');
const preview = $('preview');
const canvas = $('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const analyzeBtn = $('analyzeBtn');
const results = $('results');
const loading = $('loading');

let currentImage = null;

// ============ Загрузка файла ============
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) loadFile(e.target.files[0]);
});

function loadFile(file) {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      preview.src = ev.target.result;
      preview.style.display = 'block';
      analyzeBtn.disabled = false;
      results.style.display = 'none';
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ============ Анализ ============
analyzeBtn.addEventListener('click', async () => {
  if (!currentImage) return;
  loading.style.display = 'block';
  results.style.display = 'none';
  analyzeBtn.disabled = true;

  await new Promise(r => setTimeout(r, 50)); // даём браузеру отрисовать loading

  try {
    const data = analyzeImage(currentImage);
    renderResults(data);
  } catch (err) {
    alert('Ошибка анализа: ' + err.message);
  } finally {
    loading.style.display = 'none';
    analyzeBtn.disabled = false;
  }
});

function analyzeImage(img) {
  // Ограничиваем размер для скорости
  const MAX = 700;
  const scale = Math.min(1, MAX / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const pixels = imgData.data;

  // 1. Градации серого
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    gray[p] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }

  // 2. Детекция краёв (Sobel) и ориентация градиента
  const edges = detectEdges(gray, w, h);
  const { lineCount, dominantAngle, angleCoherence, verticalConvergence, vanishingPoint } = analyzeLines(edges, w, h);

  // 3. Анализ цветовых градиентов (воздушная перспектива)
  const colorGradient = analyzeColorGradient(pixels, w, h);

  // 4. Глубина резкости (размытие к фону = воздушная/атмосферная перспектива)
  const sharpnessGradient = analyzeSharpnessGradient(gray, w, h);

  // 5. Классификация
  const verdict = classify({
    lineCount, angleCoherence, verticalConvergence,
    colorGradient, sharpnessGradient
  });

  return {
    verdict,
    lineCount,
    angleCoherence,
    verticalConvergence,
    colorGradient,
    sharpnessGradient,
    vanishingPoint,
    dominantAngle,
    dimensions: { w, h }
  };
}

// ============ Sobel ============
function detectEdges(gray, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] +
        gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
      const gy =
        -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] +
        gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
      out[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return out;
}

// ============ Анализ линий и сходимости ============
function analyzeLines(edges, w, h) {
  const THRESHOLD = 90;
  const points = [];

  // Собираем сильные краевые точки
  for (let y = 2; y < h - 2; y += 2) {
    for (let x = 2; x < w - 2; x += 2) {
      const v = edges[y * w + x];
      if (v > THRESHOLD) points.push({ x, y, v });
    }
  }

  if (points.length < 30) {
    return { lineCount: 0, dominantAngle: 0, angleCoherence: 0, verticalConvergence: 0, vanishingPoint: null };
  }

  // Гистограмма ориентаций через Хофа (упрощённый)
  const ANGLE_BINS = 36; // по 5°
  const angleHist = new Float32Array(ANGLE_BINS);
  const gradientMap = new Float32Array(w * h);

  // Пересчитываем ориентации для точек
  for (const pt of points) {
    const x = pt.x, y = pt.y;
    const i = y * w + x;
    const gx = edges[i + 1] - edges[i - 1] || 0;
    const gy = edges[i + w] - edges[i - w] || 0;
    const angle = (Math.atan2(gy, gx) * 180 / Math.PI + 180) % 180;
    const bin = Math.floor(angle / (180 / ANGLE_BINS)) % ANGLE_BINS;
    angleHist[bin] += pt.v;
    gradientMap[i] = angle;
  }

  // Доминирующее направление
  let maxBin = 0, maxVal = 0;
  for (let i = 0; i < ANGLE_BINS; i++) {
    if (angleHist[i] > maxVal) { maxVal = angleHist[i]; maxBin = i; }
  }
  const dominantAngle = (maxBin + 0.5) * (180 / ANGLE_BINS);

  // Когерентность (насколько линии параллельны)
  const total = angleHist.reduce((a, b) => a + b, 0) || 1;
  let coherence = 0;
  for (let i = 0; i < ANGLE_BINS; i++) {
    // соседние бины тоже считаем близкими
    const a = angleHist[i] / total;
    const b = angleHist[(i + 1) % ANGLE_BINS] / total;
    const c = angleHist[(i - 1 + ANGLE_BINS) % ANGLE_BINS] / total;
    coherence += Math.max(a, b, c) * (i === maxBin ? 1 : 0.3);
  }
  coherence = Math.min(1, coherence);

  // Вертикальная сходимость: линии в верхней части должны сходиться
  // Ищем пересечение пар линий, близких к вертикали
  let convergenceScore = 0;
  const verticalLines = [];
  for (const pt of points) {
    const i = pt.y * w + pt.x;
    const ang = gradientMap[i];
    // угол, близкий к 90° (вертикаль) или 0° (горизонталь)
    if (ang > 60 && ang < 120) {
      verticalLines.push({ x: pt.x, y: pt.y, angle: ang, v: pt.v });
    }
  }

  if (verticalLines.length > 20) {
    // Оцениваем: линии в верхней половине сходятся к точке?
    const top = verticalLines.filter(p => p.y < h / 2);
    const bottom = verticalLines.filter(p => p.y >= h / 2);
    if (top.length > 5 && bottom.length > 5) {
      // Средний x вверху и внизу
      const avgTopX = top.reduce((a, p) => a + p.x, 0) / top.length;
      const avgBotX = bottom.reduce((a, p) => a + p.x, 0) / bottom.length;
      const spreadTop = stdDev(top.map(p => p.x));
      const spreadBot = stdDev(bottom.map(p => p.x));
      // Если вверху разброс меньше — линии сходятся вверх (классическая перспектива)
      if (spreadBot > 0) {
        convergenceScore = Math.max(0, (spreadBot - spreadTop) / spreadBot);
      }
    }
  }

  return {
    lineCount: points.length,
    dominantAngle,
    angleCoherence: coherence,
    verticalConvergence: Math.min(1, convergenceScore),
    vanishingPoint: convergenceScore > 0.2 ? { x: w / 2, y: h * 0.3 } : null
  };
}

function stdDev(arr) {
  if (!arr.length) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
}

// ============ Цветовой градиент (воздушная перспектива) ============
function analyzeColorGradient(pixels, w, h) {
  // Разбиваем на 3 горизонтальные полосы: верх / середина / низ
  const zones = [
    { name: 'top', y0: 0, y1: Math.floor(h / 3) },
    { name: 'mid', y0: Math.floor(h / 3), y1: Math.floor(2 * h / 3) },
    { name: 'bot', y0: Math.floor(2 * h / 3), y1: h }
  ];

  const stats = zones.map(z => {
    let r = 0, g = 0, b = 0, count = 0;
    let sat = 0, lum = 0;
    for (let y = z.y0; y < z.y1; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const i = (y * w + x) * 4;
        r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2];
        const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
        const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
        sat += (max - min) / 255;
        lum += (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;
        count++;
      }
    }
    return {
      r: r / count, g: g / count, b: b / count,
      sat: sat / count, lum: lum / count
    };
  });

  // Воздушная перспектива: дальние объекты (обычно верх) — менее насыщенные,
  // более светлые/голубоватые, менее контрастные
  const top = stats[0], bot = stats[2];
  const satDiff = top.sat - bot.sat;      // обычно отрицательна (вверху менее насыщенно)
  const lumDiff = top.lum - bot.lum;      // обычно положительна (вверху светлее)
  const blueShift = (top.b - top.r) - (bot.b - bot.r); // вверху больше синего

  // Нормализуем в 0..1 (насколько выражена воздушная перспектива)
  const score =
    Math.max(0, -satDiff) * 2 +      // уменьшение насыщенности вверху
    Math.max(0, lumDiff) * 1.5 +     // посветление вверху
    Math.max(0, blueShift / 255) * 2;

  return {
    score: Math.min(1, score),
    topSat: top.sat,
    botSat: bot.sat,
    topLum: top.lum,
    botLum: bot.lum
  };
}

// ============ Градиент резкости ============
function analyzeSharpnessGradient(gray, w, h) {
  // Локальная дисперсия — мера детализации
  function localVariance(x0, y0, x1, y1) {
    let sum = 0, sumSq = 0, count = 0;
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const v = gray[y * w + x];
        sum += v; sumSq += v * v; count++;
      }
    }
    if (!count) return 0;
    const mean = sum / count;
    return Math.sqrt(Math.max(0, sumSq / count - mean * mean));
  }

  const top = localVariance(0, 0, w, Math.floor(h / 3));
  const bot = localVariance(0, Math.floor(2 * h / 3), w, h);

  const score = bot > 0 ? Math.max(0, (bot - top) / bot) : 0;
  return {
    score: Math.min(1, score),
    topSharpness: top,
    botSharpness: bot
  };
}

// ============ Классификация ============
function classify(m) {
  const {
    lineCount, angleCoherence, verticalConvergence,
    colorGradient, sharpnessGradient
  } = m;

  const hasStrongLines = lineCount > 100 && angleCoherence > 0.25;
  const hasConvergence = verticalConvergence > 0.15;
  const hasAirPerspective = colorGradient.score > 0.3 || sharpnessGradient.score > 0.3;

  // Обратная перспектива — линии расходятся (редкий случай, сложно детектировать точно)
  // Определяем по слабой когерентности + высокой насыщенности вверху
  const inverseHint = angleCoherence < 0.15 && colorGradient.score < 0.1;

  if (hasStrongLines && hasConvergence) {
    return {
      type: 'Линейная (прямая) перспектива',
      confidence: Math.round((0.5 + verticalConvergence * 0.5) * 100),
      desc: 'Обнаружены сходящиеся к горизонту линии. Классическая ренессансная перспектива с точкой схода.'
    };
  }
  if (hasAirPerspective && !hasConvergence) {
    return {
      type: 'Воздушная (атмосферная) перспектива',
      confidence: Math.round((0.4 + colorGradient.score * 0.4 + sharpnessGradient.score * 0.2) * 100),
      desc: 'Дальние планы менее насыщены, светлее и размытее. Глубина передаётся цветом и тоном, а не линиями.'
    };
  }
  if (hasStrongLines && !hasConvergence) {
    return {
      type: 'Параллельная / изометрическая перспектива',
      confidence: Math.round((0.4 + angleCoherence * 0.5) * 100),
      desc: 'Много параллельных линий без выраженной точки схода. Характерно для восточного искусства и изометрии.'
    };
  }
  if (inverseHint) {
    return {
      type: 'Возможно, обратная перспектива',
      confidence: 45,
      desc: 'Слабая когерентность линий и отсутствие атмосферных градиентов. Возможна обратная перспектива (иконы, древнерусская живопись).'
    };
  }
  return {
    type: 'Перспектива не выражена',
    confidence: 60,
    desc: 'Изображение не содержит явных признаков линейной или воздушной перспективы (возможно, абстракция, портрет крупным планом или плоское изображение).'
  };
}

// ============ Рендер ============
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
      <div class="metric"><span>Вертикальная сходимость</span><span>${(d.verticalConvergence * 100).toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${d.verticalConvergence * 100}%"></div></div>
      <div class="metric"><span>Доминирующий угол</span><span>${d.dominantAngle.toFixed(0)}°</span></div>
    </div>

    <div class="card">
      <h3>Воздушная перспектива</h3>
      <div class="metric"><span>Индекс атмосферы</span><span>${(d.colorGradient.score * 100).toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${d.colorGradient.score * 100}%"></div></div>
      <div class="metric"><span>Насыщенность верх/низ</span><span>${d.colorGradient.topSat.toFixed(2)} / ${d.colorGradient.botSat.toFixed(2)}</span></div>
      <div class="metric"><span>Яркость верх/низ</span><span>${d.colorGradient.topLum.toFixed(2)} / ${d.colorGradient.botLum.toFixed(2)}</span></div>
    </div>

    <div class="card">
      <h3>Глубина резкости</h3>
      <div class="metric"><span>Градиент детализации</span><span>${(d.sharpnessGradient.score * 100).toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${d.sharpnessGradient.score * 100}%"></div></div>
      <div class="metric"><span>Детализация верх/низ</span><span>${d.sharpnessGradient.topSharpness.toFixed(1)} / ${d.sharpnessGradient.botSharpness.toFixed(1)}</span></div>
      <div class="desc">Чем выше показатель — тем сильнее размытие вдали (атмосферная перспектива).</div>
    </div>
  `;
  results.style.display = 'grid';
}
