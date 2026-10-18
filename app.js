import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort.webgpu.min.js';

const MODEL_URL = './models/model.onnx';
const INPUT_SIZE = 640; // Стандартный размер для YOLO
const CONF_THRESHOLD = 0.5;
const IOU_THRESHOLD = 0.45;

const statusEl = document.getElementById('status');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let session;

// 1. Инициализация модели
async function init() {
  try {
    statusEl.textContent = 'Загрузка нейросети (может занять 10-20 сек)...';
    // Пытаемся использовать WebGPU, если не выйдет - откатываемся на WASM (CPU)
    session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['webgpu', 'wasm'],
    });
    statusEl.textContent = 'Модель готова! Выберите картинку.';
  } catch (e) {
    statusEl.textContent = 'Ошибка загрузки модели: ' + e.message;
    console.error(e);
  }
}

// 2. Препроцессинг (сжатие картинки до 640x640)
function preprocess(img) {
  const scale = Math.min(INPUT_SIZE / img.width, INPUT_SIZE / img.height);
  const nw = Math.round(img.width * scale);
  const nh = Math.round(img.height * scale);
  const padX = (INPUT_SIZE - nw) / 2;
  const padY = (INPUT_SIZE - nh) / 2;

  const off = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
  const octx = off.getContext('2d');
  octx.fillStyle = '#727272'; // Заливка фона (letterbox)
  octx.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
  octx.drawImage(img, padX, padY, nw, nh);

  const { data } = octx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const tensorData = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  
  // NCHW формат (отдельно R, G, B слои)
  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    tensorData[i]                        = data[i * 4]     / 255; // R
    tensorData[i + INPUT_SIZE * INPUT_SIZE]     = data[i * 4 + 1] / 255; // G
    tensorData[i + 2 * INPUT_SIZE * INPUT_SIZE] = data[i * 4 + 2] / 255; // B
  }
  
  return {
    tensor: new ort.Tensor('float32', tensorData, [1, 3, INPUT_SIZE, INPUT_SIZE]),
    scale, padX, padY,
  };
}

// 3. NMS (подавление пересечений)
function iou(a, b) {
  const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return inter / union;
}

function nms(boxes, scores, iouThreshold) {
  const idx = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]);
  const keep = [];
  while (idx.length) {
    const i = idx.shift();
    keep.push(i);
    for (let k = idx.length - 1; k >= 0; k--) {
      if (iou(boxes[i], boxes[idx[k]]) > iouThreshold) idx.splice(k, 1);
    }
  }
  return keep;
}

// 4. Постпроцессинг (разбор результатов YOLOv8)
function postprocess(out, meta) {
  const data = out.data;
  const numAnchors = out.dims[2]; // Для YOLOv8 обычно 8400
  const numClasses = out.dims[1] - 4; // 84 - 4 = 80 классов (или 5 - 4 = 1 для аниме)
  
  const boxes = [], scores = [];

  // YOLOv8 выдает тензор [1, 84, 8400], где 8400 - это предсказания
  // Нам нужно итерироваться по 8400
  for (let i = 0; i < numAnchors; i++) {
    let maxScore = 0;
    let classId = -1;

    // Ищем класс с максимальной вероятностью
    for (let c = 0; c < numClasses; c++) {
      const score = data[(4 + c) * numAnchors + i];
      if (score > maxScore) {
        maxScore = score;
        classId = c;
      }
    }

    if (maxScore < CONF_THRESHOLD) continue;

    // Координаты в формате cx, cy, w, h (центр, ширина, высота)
    const cx = data[0 * numAnchors + i];
    const cy = data[1 * numAnchors + i];
    const w  = data[2 * numAnchors + i];
    const h  = data[3 * numAnchors + i];

    const x = cx - w / 2;
    const y = cy - h / 2;

    // Возвращаем к оригинальному размеру картинки
    const ox = (x - meta.padX) / meta.scale;
    const oy = (y - meta.padY) / meta.scale;
    const ow = w / meta.scale;
    const oh = h / meta.scale;

    boxes.push({ x: ox, y: oy, w: ow, h: oh });
    scores.push(maxScore);
  }

  const keep = nms(boxes, scores, IOU_THRESHOLD);
  return keep.map(i => boxes[i]);
}

// 5. Запуск детекции
async function detect(file) {
  if (!session) return;
  statusEl.textContent = 'Обработка изображения...';
  
  const img = await createImageBitmap(file);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const meta = preprocess(img);
  
  // Запускаем нейросеть
  const feeds = { [session.inputNames[0]]: meta.tensor };
  const results = await session.run(feeds);
  const out = results[session.outputNames[0]];

  // Отрисовываем боксы
  const boxes = postprocess(out, meta);
  
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = Math.max(2, img.width / 300);
  ctx.font = `${Math.max(14, img.width / 40)}px sans-serif`;
  ctx.fillStyle = '#00ff88';

  for (const b of boxes) {
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillText('Face', b.x, b.y - 5);
  }
  
  statusEl.textContent = `Готово! Найдено лиц: ${boxes.length}`;
}

// Слушатель выбора файла
document.getElementById('file').addEventListener('change', (e) => {
  if (e.target.files[0]) detect(e.target.files[0]);
});

// Запуск
init();
