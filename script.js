const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const wrap = document.getElementById("canvasWrap");
const placeholder = document.getElementById("placeholder");

const fileInput = document.getElementById("fileInput");
const modeBtn = document.getElementById("modeBtn");
const horizonBtn = document.getElementById("horizonBtn");
const clearBtn = document.getElementById("clearBtn");
const showGrid = document.getElementById("showGrid");
const showVP = document.getElementById("showVP");

let img = null;
let scale = 1;
let mode = "lines"; // "lines" | "horizon"
let lines = [];        // [{x1,y1,x2,y2}]
let horizon = null;    // {y}  (в координатах изображения)
let pending = null;    // первая точка текущего отрезка

// === Загрузка изображения ===
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const image = new Image();
    image.onload = () => {
      img = image;
      placeholder.style.display = "none";
      setupCanvas();
      redraw();
    };
    image.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

function setupCanvas() {
  const maxW = wrap.clientWidth - 4;
  const maxH = Math.min(window.innerHeight * 0.6, 700);
  scale = Math.min(maxW / img.width, maxH / img.height, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
}

window.addEventListener("resize", () => {
  if (img) { setupCanvas(); redraw(); }
});

// === Переключение режима ===
modeBtn.addEventListener("click", () => {
  mode = "lines";
  modeBtn.classList.add("active");
  horizonBtn.classList.remove("active");
  pending = null;
});
horizonBtn.addEventListener("click", () => {
  mode = "horizon";
  horizonBtn.classList.add("active");
  modeBtn.classList.remove("active");
  pending = null;
});

clearBtn.addEventListener("click", () => {
  lines = []; horizon = null; pending = null;
  redraw();
});

showGrid.addEventListener("change", redraw);
showVP.addEventListener("change", redraw);

// === Клики по canvas ===
canvas.addEventListener("click", (e) => {
  if (!img) return;
  const rect = canvas.getBoundingClientRect();
  // координаты в системе изображения
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  if (mode === "lines") {
    if (!pending) {
      pending = { x, y };
    } else {
      // не добавляем нулевые отрезки
      if (Math.hypot(pending.x - x, pending.y - y) > 5) {
        lines.push({ x1: pending.x, y1: pending.y, x2: x, y2: y });
      }
      pending = null;
    }
  } else if (mode === "horizon") {
    horizon = { y }; // горизонт горизонтален — задаём по уровню Y
  }
  redraw();
});

// === Отрисовка ===
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!img) return;

  // изображение
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // сетка
  if (showGrid.checked) drawGrid();

  // горизонт
  if (horizon) {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(0, horizon.y * scale);
    ctx.lineTo(canvas.width, horizon.y * scale);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("Горизонт", 8, horizon.y * scale - 6);
  }

  // отрезки
  ctx.strokeStyle = "#34d399";
  ctx.lineWidth = 2;
  lines.forEach(l => {
    ctx.beginPath();
    ctx.moveTo(l.x1 * scale, l.y1 * scale);
    ctx.lineTo(l.x2 * scale, l.y2 * scale);
    ctx.stroke();
  });

  // черновик отрезка
  if (pending) {
    ctx.strokeStyle = "#a78bfa";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pending.x * scale, pending.y * scale);
    ctx.lineTo(pending.x * scale, pending.y * scale);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#a78bfa";
    ctx.beginPath();
    ctx.arc(pending.x * scale, pending.y * scale, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // точки схода
  if (showVP.checked && lines.length >= 2) {
    const vps = computeVanishingPoints(lines);
    vps.forEach((vp, i) => drawVanishingPoint(vp, i));
  }
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  const step = 50;
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

// === Пересечение двух прямых ===
function lineIntersection(l1, l2) {
  const x1 = l1.x1, y1 = l1.y1, x2 = l1.x2, y2 = l1.y2;
  const x3 = l2.x1, y3 = l2.y1, x4 = l2.x2, y4 = l2.y2;
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-9) return null; // параллельны
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const x = x1 + t * (x2 - x1);
  const y = y1 + t * (y2 - y1);
  return { x, y };
}

// === Вычисление точек схода (кластеризация пересечений) ===
function computeVanishingPoints(ls) {
  const intersections = [];
  for (let i = 0; i < ls.length; i++) {
    for (let j = i + 1; j < ls.length; j++) {
      const p = lineIntersection(ls[i], ls[j]);
      if (p) intersections.push(p);
    }
  }
  if (!intersections.length) return [];

  // простая кластеризация: объединяем близкие точки
  const clusters = [];
  const threshold = 40 / scale; // 40 px на экране
  intersections.forEach(p => {
    let found = clusters.find(c => Math.hypot(c.x - p.x, c.y - p.y) < threshold);
    if (found) {
      found.pts.push(p);
      found.x = found.pts.reduce((s, q) => s + q.x, 0) / found.pts.length;
      found.y = found.pts.reduce((s, q) => s + q.y, 0) / found.pts.length;
    } else {
      clusters.push({ x: p.x, y: p.y, pts: [p] });
    }
  });

  // возвращаем самые крупные кластеры (до 3 — типично для 1/2/3-точечной перспективы)
  return clusters
    .sort((a, b) => b.pts.length - a.pts.length)
    .slice(0, 3)
    .map(c => ({ x: c.x, y: c.y, weight: c.pts.length }));
}

// === Отрисовка точки схода ===
function drawVanishingPoint(vp, idx) {
  const px = vp.x * scale;
  const py = vp.y * scale;
  const colors = ["#ef4444", "#3b82f6", "#eab308"];
  const color = colors[idx % colors.length];

  // радиус пропорционален весу (кол-ву пересечений)
  const r = 6 + Math.min(vp.weight, 6);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(`VP${idx + 1}`, px + r + 4, py - r - 4);

  // подпись координат
  ctx.fillStyle = color;
  ctx.font = "11px monospace";
  ctx.fillText(
    `(${vp.x.toFixed(0)}, ${vp.y.toFixed(0)})`,
    px + r + 4, py + 4
  );
}
