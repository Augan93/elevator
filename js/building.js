function drawBuilding(elevator, passengers, selectedId) {
  const { FLOORS, FLOOR_H, BUILDING_X, BUILDING_W, SHAFT_X, SHAFT_W, TOP } = CFG;

  noStroke();
  fill(COLORS.wall);
  rect(BUILDING_X, TOP, BUILDING_W, FLOORS * FLOOR_H, 6);
  fill(COLORS.shaft);
  rect(SHAFT_X, TOP, SHAFT_W, FLOORS * FLOOR_H);

  for (let f = 0; f < FLOORS; f++) {
    const top = floorTopY(f);

    if (f > 0) {
      stroke(COLORS.slab);
      strokeWeight(2);
      line(BUILDING_X, top + FLOOR_H, BUILDING_X + BUILDING_W, top + FLOOR_H);
    }

    noStroke();
    fill(COLORS.muted);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(f + 1, BUILDING_X + 24, top + FLOOR_H / 2);

    drawHallButtons(f, top, elevator);
    drawFloorPassengers(f, top, passengers, selectedId);
  }

  drawCabin(elevator, passengers, selectedId);
}

function drawHallButtons(f, top, elevator) {
  const x = CFG.HALL_BTN_X;
  const buttons = [];
  if (f < CFG.FLOORS - 1) buttons.push({ dir: DIR.UP, y: top + CFG.FLOOR_H * 0.3 });
  if (f > 0) buttons.push({ dir: DIR.DOWN, y: top + CFG.FLOOR_H * 0.7 });

  for (const b of buttons) {
    const lit = elevator.hallCalls[b.dir].has(f);
    stroke(COLORS.btnBorder);
    strokeWeight(1.5);
    fill(lit ? COLORS.lit : COLORS.btn);
    circle(x, b.y, 22);
    noStroke();
    fill(lit ? COLORS.litText : COLORS.text);
    drawArrow(x, b.y, b.dir, 5);
    addHit({ x, y: b.y, r: 12 }, () => onHallButton(f, b.dir));
  }
}

function drawFloorPassengers(f, top, passengers, selectedId) {
  const here = passengers.filter(p => p.state !== P_STATE.RIDING && p.floor === f);
  const y = top + CFG.FLOOR_H / 2 + 4;

  here.forEach((p, i) => {
    const x = CFG.WAIT_X + i * 34;
    drawPassenger(p, x, y, 12, p.id === selectedId);
    if (p.state === P_STATE.WAITING) {
      noStroke();
      fill(COLORS.lit);
      drawArrow(x + 13, y - 15, p.dir, 4);
    }
  });
}

function drawCabin(elevator, passengers, selectedId) {
  const x = CFG.SHAFT_X + 4;
  const w = CFG.SHAFT_W - 8;
  const h = CFG.FLOOR_H - 6;
  const top = floorTopY(elevator.pos) + 3;

  stroke(COLORS.cabinBorder);
  strokeWeight(2);
  fill(COLORS.cabin);
  rect(x, top, w, h, 3);

  passengers
    .filter(p => p.state === P_STATE.RIDING)
    .forEach((p, i) => {
      const cx = x + 10 + (i % 4) * 19;
      const cy = top + 14 + Math.floor(i / 4) * 21;
      drawPassenger(p, cx, cy, 8, p.id === selectedId);
    });

  // Двери разъезжаются в стороны, полупрозрачные — чтобы было видно, кто внутри
  const half = (w / 2) * (1 - elevator.door);
  noStroke();
  fill(COLORS.door);
  rect(x, top, half, h);
  rect(x + w - half, top, half, h);
}
