/* ==================================================================
 * app.js — Логика интерфейса, рендеринг SVG
 * ================================================================== */

import { SHAPE_PARAMS, defaultShape, clampShape, buildFigure, rad, len, sub, mirror, norm } from './math.js';

const STORE_KEY = 'anatomy:lance-method:v1';
const SVG_NS = 'http://www.w3.org/2000/svg';

const state = {
  shape: defaultShape(),
  line: 0.012,
  view: { yaw: 0, pitch: 0 },
  display: { hidden: true, labels: true },
};

// --- DOM Элементы ---
const $ = (id) => document.getElementById(id);
const svg = $('canvas');
const stage = $('stage');

const gHidden = document.createElementNS(SVG_NS, 'g');
const gVisible = document.createElementNS(SVG_NS, 'g');
const gLabels = document.createElementNS(SVG_NS, 'g');
svg.appendChild(gHidden);
svg.appendChild(gVisible);
svg.appendChild(gLabels);

const CX = 300, CY = 400; // Центр viewBox 600x800
const BASE_SCALE = 150;   // Масштаб фигуры

// --- Математика проекции ---
function rotate(p) {
  const yaw = rad(state.view.yaw), pitch = rad(state.view.pitch);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  
  const x1 = p[0] * cy - p[1] * sy;
  const y1 = p[0] * sy + p[1] * cy;
  const z1 = p[2];
  
  const x2 = x1;
  const y2 = y1 * cp - z1 * sp;
  const z2 = y1 * sp + z1 * cp;
  
  return [x2, y2, z2];
}

function project(p) {
  const r = rotate(p);
  return { x: CX + r[0] * BASE_SCALE, y: CY - r[2] * BASE_SCALE, depth: r[1] };
}

function isVisible(n) {
  const rn = rotate(n);
  return rn[1] < 0;
}

function lineToPath(pts, closed) {
  if (!pts.length) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) d += `L${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
  if (closed) d += 'Z';
  return d;
}

function splitByVisibility(line, projected) {
  const pts = line.pts;
  const normals = line.normals;
  const result = [];
  if (!pts.length) return result;
  
  let cur = { visible: null, pts2d: [] };
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const n = normals ? normals[i] : norm(p);
    const vis = isVisible(n);
    
    if (cur.visible === null) {
      cur.visible = vis;
      cur.pts2d.push(projected[i]);
    } else if (cur.visible === vis) {
      cur.pts2d.push(projected[i]);
    } else {
      cur.pts2d.push(projected[i]);
      result.push(cur);
      cur = { visible: vis, pts2d: [projected[i]] };
    }
  }
  if (cur.pts2d.length) result.push(cur);
  return result;
}

// --- Рендеринг ---
function render() {
  const fig = buildFigure(state.shape, {});
  gVisible.innerHTML = '';
  gHidden.innerHTML = '';
  gLabels.innerHTML = '';

  const strokeW = state.line * BASE_SCALE;

  for (const l of fig.lines) {
    const projected = l.pts.map((p) => project(p));
    const parts = splitByVisibility(l, projected);
    
    for (const part of parts) {
      if (part.pts2d.length < 2) continue;
      
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', lineToPath(part.pts2d, false));
      path.setAttribute('fill', 'none');
      
      let stroke = 'var(--guide-blue)';
      if (l.color === 'red') stroke = 'var(--guide-red)';
      else if (l.color === 'orange') stroke = 'var(--guide-orange)';
      else if (l.color === 'green') stroke = 'var(--guide-green)';
      
      path.setAttribute('stroke', stroke);
      path.setAttribute('stroke-width', strokeW.toFixed(2));
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      
      if (!part.visible) {
        if (!state.display.hidden) continue;
        path.setAttribute('stroke-opacity', '0.2');
        path.setAttribute('stroke-dasharray', `${(strokeW * 1.5).toFixed(1)} ${(strokeW * 2.5).toFixed(1)}`);
        gHidden.appendChild(path);
      } else {
        gVisible.appendChild(path);
      }
    }
  }
}

// --- UI Логика ---
$('yaw').addEventListener('input', (e) => {
  state.view.yaw = Number(e.target.value);
  $('yaw-out').textContent = state.view.yaw + '°';
  render();
});
$('pitch').addEventListener('input', (e) => {
  state.view.pitch = Number(e.target.value);
  $('pitch-out').textContent = state.view.pitch + '°';
  render();
});

$('reset-view').addEventListener('click', () => {
  state.view.yaw = 0;
  state.view.pitch = 0;
  $('yaw').value = 0; $('pitch').value = 0;
  $('yaw-out').textContent = '0°'; $('pitch-out').textContent = '0°';
  render();
});

const shapeHost = $('shape-sliders');
for (const p of SHAPE_PARAMS) {
  const row = document.createElement('div');
  row.className = 'slider';
  row.innerHTML = `
    <label>${p.label}</label>
    <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${state.shape[p.key]}">
    <output>${state.shape[p.key]}</output>
  `;
  shapeHost.appendChild(row);
  const input = row.querySelector('input');
  const out = row.querySelector('output');
  
  input.addEventListener('input', () => {
    state.shape[p.key] = Number(input.value);
    out.textContent = input.value;
    render();
  });
}

$('toggle-hidden').addEventListener('click', (e) => {
  state.display.hidden = !state.display.hidden;
  e.target.setAttribute('aria-pressed', state.display.hidden);
  render();
});

// Инициализация
render();
