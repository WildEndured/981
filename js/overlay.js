// ============================================================
//  overlay.js · отрисовка оверлея (маска, bbox, линии, сетка)
// ============================================================

function drawOverlay() {
  const w = imgWidth, h = imgHeight;
  if (!w) return;
  overlayCtx.clearRect(0, 0, w, h);

  if (isBg) {
    const img = overlayCtx.createImageData(w, h);
    const data = img.data;
    for (let i = 0, j = 0; i < w * h; i++, j += 4) {
      if (!isBg[i]) {
        data[j] = 255; data[j+1] = 60; data[j+2] = 60; data[j+3] = 100;
      }
    }
    overlayCtx.putImageData(img, 0, 0);
  }

  if (charBBox) {
    const { x, y, w: bw, h: bh } = charBBox;
    const s = style.bbox;
    const lw = Math.max(1, s.width / zoom);

    overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.lineWidth = lw;
    overlayCtx.setLineDash([8 / zoom, 6 / zoom]);
    overlayCtx.strokeRect(x + 0.5, y + 0.5, bw, bh);
    overlayCtx.setLineDash([]);

    if (s.showCorners) {
      const cs = Math.min(bw, bh) * 0.12;
      overlayCtx.lineWidth = lw * 2;
      const corners = [
        [x, y, 1, 1], [x + bw, y, -1, 1],
        [x, y + bh, 1, -1], [x + bw, y + bh, -1, -1]
      ];
      for (const [cx, cy, sx, sy] of corners) {
        overlayCtx.beginPath();
        overlayCtx.moveTo(cx + sx * cs, cy);
        overlayCtx.lineTo(cx, cy);
        overlayCtx.lineTo(cx, cy + sy * cs);
        overlayCtx.stroke();
      }
    }

    const fs = Math.max(11, 14 / zoom);
    overlayCtx.font = `${fs}px system-ui, sans-serif`;
    overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.fillText(`bbox ${bw}×${bh}`, x, Math.max(fs, y - 6 / zoom));
  }

  if (charBBox && vertAxis && showVert) {
    const { y: by, h: bh } = charBBox;
    const ax = vertAxis.x;
    const s = style.vert;
    const lw = Math.max(1, s.width / zoom);
    const fs = Math.max(11, 13 / zoom);

    if (s.outline) {
      overlayCtx.strokeStyle = 'rgba(0,0,0,0.8)';
      overlayCtx.lineWidth = lw * 2.5;
      overlayCtx.setLineDash([]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(ax, by); overlayCtx.lineTo(ax, by + bh);
      overlayCtx.stroke();
    }
    overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.lineWidth = lw;
    overlayCtx.setLineDash(s.dashed ? [s.dashLen / zoom, s.dashGap / zoom] : []);
    overlayCtx.beginPath();
    overlayCtx.moveTo(ax, by); overlayCtx.lineTo(ax, by + bh);
    overlayCtx.stroke();
    overlayCtx.setLineDash([]);

    overlayCtx.font = `${fs}px system-ui, sans-serif`;
    overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.fillText(`верт. поиск (${vertShiftPercent}%)`, ax + 6 / zoom, by + fs + 2 / zoom);
  }

  if (charBBox && searchHorizLine && showHoriz) {
    const { x: bx, w: bw } = charBBox;
    const py = searchHorizLine.y;
    const s = style.horiz;
    const lw = Math.max(1, s.width / zoom);
    const fs = Math.max(11, 13 / zoom);

    if (s.outline) {
      overlayCtx.strokeStyle = 'rgba(0,0,0,0.8)';
      overlayCtx.lineWidth = lw * 2.5;
      overlayCtx.setLineDash([]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(bx, py); overlayCtx.lineTo(bx + bw, py);
      overlayCtx.stroke();
    }
    overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.lineWidth = lw;
    overlayCtx.setLineDash(s.dashed ? [s.dashLen / zoom, s.dashGap / zoom] : []);
    overlayCtx.beginPath();
    overlayCtx.moveTo(bx, py); overlayCtx.lineTo(bx + bw, py);
    overlayCtx.stroke();
    overlayCtx.setLineDash([]);

    overlayCtx.font = `${fs}px system-ui, sans-serif`;
    overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.fillText(`гориз. поиск (${horizShiftPercent}%)`, bx + bw + 6 / zoom, py + fs / 3);
  }

  if (charBBox && gridLines && gridLines.length > 0 && showGrid) {
    const { x: bx, w: bw } = charBBox;
    const s = style.grid;
    const lw = Math.max(1, s.width / zoom);
    const fs = Math.max(11, 13 / zoom);

    overlayCtx.font = `bold ${fs}px system-ui, sans-serif`;
    overlayCtx.textBaseline = 'bottom';

    for (const gl of gridLines) {
      if (s.outline) {
        overlayCtx.strokeStyle = 'rgba(0,0,0,0.75)';
        overlayCtx.lineWidth = lw * 2.5;
        overlayCtx.setLineDash([]);
        overlayCtx.beginPath();
        overlayCtx.moveTo(bx, gl.y); overlayCtx.lineTo(bx + bw, gl.y);
        overlayCtx.stroke();
      }
      overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
      overlayCtx.lineWidth = lw;
      overlayCtx.setLineDash(s.dashed ? [s.dashLen / zoom, s.dashGap / zoom] : []);
      overlayCtx.beginPath();
      overlayCtx.moveTo(bx, gl.y); overlayCtx.lineTo(bx + bw, gl.y);
      overlayCtx.stroke();

      if (s.showLabels) {
        const label = `${gl.percent}%`;
        const tx = bx + bw - 4 / zoom;
        const ty = gl.y - 4 / zoom;
        overlayCtx.textAlign = 'right';
        overlayCtx.lineWidth = 3 / zoom;
        overlayCtx.strokeStyle = 'rgba(0,0,0,0.9)';
        overlayCtx.setLineDash([]);
        overlayCtx.strokeText(label, tx, ty);
        overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
        overlayCtx.fillText(label, tx, ty);
      }
    }
    overlayCtx.setLineDash([]);
    overlayCtx.textAlign = 'start';
    overlayCtx.textBaseline = 'alphabetic';
  }

  // ===== Анатомические линии пропорций =====
if (charBBox && showPropLines && propLines && propLines.length > 0) {
  const { x: bx, w: bw } = charBBox;
  const s = propStyle;
  const lw = Math.max(1, s.width / zoom);
  const fs = Math.max(12, 14 / zoom);

  overlayCtx.font = `bold ${fs}px system-ui, sans-serif`;
  overlayCtx.textBaseline = 'bottom';
  overlayCtx.setLineDash([]);

  for (const pl of propLines) {
    if (!pl.enabled) continue;

    // Вычисляем координаты с учётом ширины линии
    const lineW = pl.width !== undefined ? pl.width : 1.0;
    const startX = bx + (bw * (1 - lineW)) / 2;
    const endX = bx + bw - (bw * (1 - lineW)) / 2;

    if (s.outline) {
      overlayCtx.strokeStyle = 'rgba(0,0,0,0.8)';
      overlayCtx.lineWidth = lw * 2.5;
      overlayCtx.setLineDash([]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(startX, pl.y); 
      overlayCtx.lineTo(endX, pl.y);
      overlayCtx.stroke();
    }

    overlayCtx.strokeStyle = hexToRgba(s.color, s.alpha);
    overlayCtx.lineWidth = lw;
    overlayCtx.setLineDash(s.dashed ? [s.dashLen / zoom, s.dashGap / zoom] : []);
    overlayCtx.beginPath();
    overlayCtx.moveTo(startX, pl.y); 
    overlayCtx.lineTo(endX, pl.y);
    overlayCtx.stroke();
    overlayCtx.setLineDash([]);

    if (s.showLabels) {
      const label = `${pl.label} · ${pl.percent}%`;
      // Текст ставим слева от начала линии
      const tx = startX + 4 / zoom; 
      const ty = pl.y - 4 / zoom;
      
      overlayCtx.textAlign = 'left';
      overlayCtx.lineWidth = 3 / zoom;
      overlayCtx.strokeStyle = 'rgba(0,0,0,0.95)';
      overlayCtx.strokeText(label, tx, ty);
      overlayCtx.fillStyle = hexToRgba(s.color, s.alpha);
      overlayCtx.fillText(label, tx, ty);
    }
  }
  overlayCtx.textAlign = 'start';
  overlayCtx.textBaseline = 'alphabetic';
}
