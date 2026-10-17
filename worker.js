// ============================================================
//  Воркер: Классический захват фона (Градиент + HSV)
// ============================================================

self.onmessage = (e) => {
  const { type, payload } = e.data;
  if (type === 'build') {
    try {
      const result = buildMask(payload);
      self.postMessage({ type: 'mask', payload: result });
    } catch (err) {
      self.postMessage({ type: 'error', payload: err.message });
    }
  }
};

function buildMask(p) {
  const { imageData, width, height, mode, thresholdLum, thresholdSat, gradTolerance, pickColor, useSmooth, smoothIter } = p;
  const w = width, h = height, N = w * h;
  const data = imageData.data;

  // 1. Конвертируем в массивы Lum и HSV (Saturation)
  const lum = new Float32Array(N);
  const sat = new Float32Array(N);
  
  for (let i = 0; i < N; i++) {
    const r = data[i*4]/255, g = data[i*4+1]/255, b = data[i*4+2]/255;
    lum[i] = 0.299*r*255 + 0.587*g*255 + 0.114*b*255;
    
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    sat[i] = max === 0 ? 0 : ((max - min) / max) * 255;
  }

  // 2. Функция проверки, является ли пиксель фоном
  const isPixelBg = (idx) => {
    if (mode === 'lum') {
      return lum[idx] >= thresholdLum;
    } else {
      // По цвету (HSV)
      if (pickColor) {
        // Если выбрана пипетка — проверяем близость по насыщенности
        return Math.abs(sat[idx] - thresholdSat) < 40; // Допуск 40
      }
      // Просто отсекаем насыщенные пиксели (фон обычно серый/белый)
      return sat[idx] <= thresholdSat;
    }
  };

  // 3. BFS С УЧЕТОМ ГРАДИЕНТА
  const mask = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;
  let bgCount = 0;

  // Стартовые точки (по краям + авто-семена)
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (mask[idx] || !isPixelBg(idx)) return;
    mask[idx] = 1; queue[tail++] = idx; bgCount++;
  };

  // Запускаем от краев картинки
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  // Запускаем поиск изолированных островов (Авто-семена)
  const seeds = findIsolatedSeeds(isPixelBg, w, h, N);
  for (const s of seeds) push(s.x, s.y);

  // 4. Основной цикл BFS с градиентом
  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w, y = (idx / w) | 0;
    const currLum = lum[idx];
    const currSat = sat[idx];

    const tryNeighbor = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const nidx = ny * w + nx;
      if (mask[nidx]) return;
      
      // Проверка на градиент: сосед должен быть похож на текущий пиксель
      const dLum = Math.abs(lum[nidx] - currLum);
      const dSat = Math.abs(sat[nidx] - currSat);
      
      if (dLum <= gradTolerance && dSat <= gradTolerance) {
         // Если сосед близок по градиенту и подходит под общий критерий фона
         if (isPixelBg(nidx)) {
             mask[nidx] = 1; queue[tail++] = nidx; bgCount++;
         }
      }
    };

    tryNeighbor(x+1, y); tryNeighbor(x-1, y);
    tryNeighbor(x, y+1); tryNeighbor(x, y-1);
  }

  // 5. Сглаживание (Морфология)
  if (useSmooth) {
    for (let it = 0; it < smoothIter; it++) smoothMask(mask, w, h);
  }

  // Пересчитываем bgCount после сглаживания
  bgCount = 0; for(let i=0; i<N; i++) if(mask[i]) bgCount++;

  return { mask, bgCount };
}

// Поиск островов (как в v3, но упрощенный)
function findIsolatedSeeds(isPixelBg, w, h, N) {
  const visited = new Uint8Array(N);
  const seeds = [];
  for (let i = 0; i < N; i++) {
    if (visited[i] || !isPixelBg(i)) continue;
    // Простой локальный BFS для проверки размера острова
    const q = [i]; visited[i] = 1; let count = 0; let touchBorder = false;
    let head = 0;
    while(head < q.length) {
      const curr = q[head++]; count++;
      const cx = curr % w, cy = (curr / w) | 0;
      if (cx===0 || cy===0 || cx===w-1 || cy===h-1) touchBorder = true;
      
      const check = (nx, ny) => {
        if (nx<0||ny<0||nx>=w||ny>=h) return;
        const ni = ny*w+nx;
        if(!visited[ni] && isPixelBg(ni)) { visited[ni]=1; q.push(ni); }
      };
      check(cx+1,cy); check(cx-1,cy); check(cx,cy+1); check(cx,cy-1);
    }
    if (!touchBorder && count > 50) seeds.push({ x: i % w, y: (i / w) | 0 });
  }
  return seeds;
}

function smoothMask(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const idx = y * w + x;
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx||dy) count += copy[idx + dy * w + dx];
    }
    if (count >= 7) mask[idx] = 1;
    else if (count <= 1) mask[idx] = 0;
  }
}
