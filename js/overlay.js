// ============================================================
//  overlay.js · отрисовка оверлея (маска, bbox, линии, фигуры головы)
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

  // --- BBox ---
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

  // --- Линии пропорций (Сетка голов) ---
  if (charBBox && showPropLines && propLines && propLines.length > 0) {
    const { x: bx, w: bw } = charBBox;
    const s = style.prop;
    const lw = Math.max(1, s.width / zoom);
    const fs = Math.max(12, 14 / zoom);

    overlayCtx.font = `bold ${fs}px system-ui, sans-serif`;
    overlayCtx.textBaseline = 'bottom';
    overlayCtx.setLineDash([]);

    for (const pl of propLines) {
      if (!pl.enabled) continue;

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

  // ============================================================
  //  ФИГУРЫ ГОЛОВЫ (Шаг 2)
  // ============================================================
  if (charBBox && showPropLines) {
    const preset = typeof getActivePropPreset === 'function' ? getActivePropPreset() : null;
    let headCount = 5; 
    
    if (preset && preset.headCount) {
      headCount = preset.headCount;
    } else if (preset && preset.lines.length > 1) {
      const firstHeadLine = preset.lines.find(l => l.id === 'head-1' || l.label.includes('Голова 1'));
      if (firstHeadLine && firstHeadLine.percent > 0) headCount = 100 / firstHeadLine.percent;
    }

    const headH = charBBox.h / headCount; 
    const headY = charBBox.y;
    const cx = charBBox.x + charBBox.w / 2; 

    const hShapes = typeof headShapes !== 'undefined' ? headShapes : { 
      showSkull: true, showJaw: true, showNeck: true, 
      headWidthRatio: 0.8, jawWidthRatio: 0.7, neckWidthRatio: 0.4 
    };
    
    const s = style.prop;
    const lw = Math.max(1, s.width / zoom);
    const headColor = 'rgba(0, 230, 230, 0.8)';
    
    overlayCtx.strokeStyle = headColor;
    overlayCtx.lineWidth = lw * 1.5;
    overlayCtx.setLineDash([]);

    const w = headH * hShapes.headWidthRatio;

    // 1. Череп (1-3 секция = 60% высоты головы)
    if (hShapes.showSkull) {
      const skullH = headH * 0.6; 
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, headY + skullH / 2, w / 2, skullH / 2, 0, 0, Math.PI * 2);
      overlayCtx.stroke();
    }

    // 2. Челюсть (4 секция = 20% высоты, от 60% до 80%)
    if (hShapes.showJaw) {
      const skullH = headH * 0.6;
      const jawH = headH * 0.2; 
      const jawW = w * hShapes.jawWidthRatio;
      
      overlayCtx.beginPath();
      overlayCtx.ellipse(cx, headY + skullH + jawH / 2, jawW / 2, jawH / 2, 0, 0, Math.PI * 2);
      overlayCtx.stroke();
    }

    // 3. Шея (5 секция = 20% высоты, от 80% до 100%)
    if (hShapes.showNeck) {
      const neckH = headH * 0.2; 
      const neckW = w * hShapes.neckWidthRatio;
      
      overlayCtx.beginPath();
      overlayCtx.rect(cx - neckW / 2, headY + headH - neckH, neckW, neckH);
      overlayCtx.stroke();
    }
  }

  // --- Точки-источники ---
  sourcePoints.forEach((p, i) => {
    const sel = i === selectedPointIndex;
    overlayCtx.beginPath();
    overlayCtx.arc(p.x, p.y, sel ? 10 : 8, 0, Math.PI * 2);
    overlayCtx.fillStyle = sel ? '#ff5050' : '#ffcc00';
    overlayCtx.fill();
    overlayCtx.lineWidth = 2;
    overlayCtx.strokeStyle = '#000';
    overlayCtx.stroke();
  });
}
