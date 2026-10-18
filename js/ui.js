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

function drawArrow(x, y, dir, size) {
  const s = size;
  if (dir === DIR.UP) triangle(x - s, y + s * 0.6, x + s, y + s * 0.6, x, y - s * 0.8);
  else triangle(x - s, y - s * 0.6, x + s, y - s * 0.6, x, y + s * 0.8);
}

function drawPassenger(p, x, y, r, selected) {
  if (selected) {
    noFill();
    stroke(COLORS.select);
    strokeWeight(3);
    circle(x, y, r * 2 + 8);
  }
  stroke(0, 70);
  strokeWeight(1);
  fill(p.color);
  circle(x, y, r * 2);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(r);
  textStyle(BOLD);
  text(p.id, x, y + 1);
  textStyle(NORMAL);
  addHit({ x, y, r: r + 4 }, () => selectPassenger(p.id));
}
