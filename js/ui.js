// Кликабельные области пересобираются каждый кадр во время отрисовки
let hits = [];

function addHit(shape, onClick) {
  hits.push({ ...shape, onClick });
}

function hitTest(h, x, y) {
  if (h.r !== undefined) return dist(x, y, h.x, h.y) <= h.r;
  return x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h;
}

function hitAt(x, y) {
  for (let i = hits.length - 1; i >= 0; i--) {
    if (hitTest(hits[i], x, y)) return hits[i];
  }
  return null;
}

// Тень/свечение через canvas API: p5 сам такого не умеет
function shadow(color, blur, offsetY = 0) {
  drawingContext.shadowColor = color;
  drawingContext.shadowBlur = blur;
  drawingContext.shadowOffsetY = offsetY;
}

function noShadow() {
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;
}

function drawArrow(x, y, dir, size) {
  const s = size;
  if (dir === DIR.UP) triangle(x - s, y + s * 0.6, x + s, y + s * 0.6, x, y - s * 0.8);
  else triangle(x - s, y - s * 0.6, x + s, y - s * 0.6, x, y + s * 0.8);
}

function drawPassenger(p, x, y, r, selected) {
  shadow(COLORS.shadow, 4, 1);
  stroke(255);
  strokeWeight(r > 9 ? 2 : 1.5);
  fill(p.color);
  circle(x, y, r * 2);
  noShadow();

  if (selected) {
    noFill();
    stroke(COLORS.select);
    strokeWeight(2.5);
    circle(x, y, r * 2 + 7);
  }

  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(r * 1.05);
  textStyle(BOLD);
  text(p.initial, x, y + 1);
  textStyle(NORMAL);
  addHit({ x, y, r: r + 4, tooltip: p.name }, () => selectPassenger(p.id));
}

// Подпись с именем над кружком под курсором
function drawTooltip(h) {
  if (!h || !h.tooltip) return;
  textSize(12);
  textStyle(BOLD);
  const w = textWidth(h.tooltip) + 16;
  const x = constrain(h.x - w / 2, 4, width - w - 4);
  const y = h.y - h.r - 28;
  noStroke();
  shadow(COLORS.shadow, 8, 2);
  fill(COLORS.panel);
  rect(x, y, w, 22, 6);
  noShadow();
  fill(COLORS.panelText);
  textAlign(CENTER, CENTER);
  text(h.tooltip, x + w / 2, y + 11);
  textStyle(NORMAL);
}
