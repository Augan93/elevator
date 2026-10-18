function drawBuilding(elevator, passengers, selectedId) {
  const { FLOORS, FLOOR_H, BUILDING_X, BUILDING_W, TOP } = CFG;
  const height = FLOORS * FLOOR_H;

  // Крыша, фасад и фундамент
  noStroke();
  shadow(COLORS.shadow, 16, 4);
  fill(COLORS.facade);
  rect(BUILDING_X, TOP, BUILDING_W, height);
  noShadow();
  fill(COLORS.roof);
  rect(BUILDING_X - 6, TOP - 12, BUILDING_W + 12, 12, 4, 4, 0, 0);
  fill(COLORS.ground);
  rect(BUILDING_X - 6, TOP + height, BUILDING_W + 12, 8, 0, 0, 4, 4);

  for (let f = 0; f < FLOORS; f++) {
    const top = floorTopY(f);

    noStroke();
    fill(f % 2 ? COLORS.facadeAlt : COLORS.facade);
    rect(BUILDING_X, top, BUILDING_W, FLOOR_H);
    if (f > 0) {
      stroke(COLORS.slab);
      strokeWeight(2);
      line(BUILDING_X, top + FLOOR_H, BUILDING_X + BUILDING_W, top + FLOOR_H);
    }

    drawFloorLabel(f, top);
    drawHallButtons(f, top, elevator);
  }

  drawShaft(elevator, passengers, selectedId);

  // Пассажиры на этажах и те, кто входит/выходит, — поверх шахты
  for (const p of passengers) {
    if (p.state !== P_STATE.RIDING) drawPassenger(p, p.id === selectedId);
  }
}

// Где стоит i-й из n пассажиров на этаже f
function floorSlot(f, i, n) {
  const span = CFG.HALL_BTN_X - 40 - CFG.WAIT_X;
  const step = n > 1 ? Math.min(34, span / (n - 1)) : 0;
  return { x: CFG.WAIT_X + i * step, y: floorTopY(f) + CFG.FLOOR_H / 2 };
}

// Место i-го пассажира в кабине, которая сейчас на высоте pos
function cabinSlot(i, pos) {
  return { x: CFG.SHAFT_X + 16 + i * 17.5, y: floorTopY(pos) + CFG.FLOOR_H / 2 };
}

function drawFloorLabel(f, top) {
  const x = CFG.BUILDING_X + 12;
  const y = top + CFG.FLOOR_H / 2;
  noStroke();
  fill(COLORS.labelBg);
  rect(x, y - 12, 32, 24, 12);
  fill(COLORS.label);
  textAlign(CENTER, CENTER);
  textSize(13);
  textStyle(BOLD);
  text(f + 1, x + 16, y + 1);
  textStyle(NORMAL);
}

function drawHallButtons(f, top, elevator) {
  const x = CFG.HALL_BTN_X;

  noStroke();
  fill(COLORS.plate);
  rect(x - 15, top + 6, 30, CFG.FLOOR_H - 12, 15);

  const buttons = [];
  if (f < CFG.FLOORS - 1) buttons.push({ dir: DIR.UP, y: top + CFG.FLOOR_H * 0.32 });
  if (f > 0) buttons.push({ dir: DIR.DOWN, y: top + CFG.FLOOR_H * 0.68 });

  for (const b of buttons) {
    const lit = elevator.hallCalls[b.dir].has(f);
    if (lit) shadow(COLORS.litGlow, 12);
    stroke(lit ? COLORS.lit : COLORS.btnBorder);
    strokeWeight(1.5);
    fill(lit ? COLORS.lit : COLORS.btn);
    circle(x, b.y, 20);
    noShadow();
    noStroke();
    fill(lit ? COLORS.litText : COLORS.icon);
    drawArrow(x, b.y, b.dir, 4.5);
    addHit({ x, y: b.y, r: 12 }, () => onHallButton(f, b.dir));
  }
}

function drawShaft(elevator, passengers, selectedId) {
  const { SHAFT_X, SHAFT_W, TOP, FLOORS, FLOOR_H } = CFG;

  noStroke();
  fill(COLORS.shaft);
  rect(SHAFT_X, TOP, SHAFT_W, FLOORS * FLOOR_H);

  // Направляющие
  stroke(COLORS.rail);
  strokeWeight(2);
  line(SHAFT_X + 3, TOP, SHAFT_X + 3, TOP + FLOORS * FLOOR_H);
  line(SHAFT_X + SHAFT_W - 3, TOP, SHAFT_X + SHAFT_W - 3, TOP + FLOORS * FLOOR_H);

  const top = floorTopY(elevator.pos) + 4;

  // Трос
  stroke(COLORS.cable);
  strokeWeight(1.5);
  line(SHAFT_X + SHAFT_W / 2, TOP, SHAFT_X + SHAFT_W / 2, top);

  drawCabin(elevator, passengers, selectedId, top);
}

function drawCabin(elevator, passengers, selectedId, top) {
  const x = CFG.SHAFT_X + 5;
  const w = CFG.SHAFT_W - 10;
  const h = CFG.FLOOR_H - 8;

  noStroke();
  fill(COLORS.cabinFrame);
  rect(x - 1, top - 1, w + 2, h + 2, 4);
  fill(COLORS.cabinInside);
  rect(x + 2, top + 2, w - 4, h - 4, 2);
  fill(COLORS.cabinLight);
  rect(x + 10, top + 4, w - 20, 3, 2);

  for (const p of passengers) {
    if (p.state === P_STATE.RIDING) drawPassenger(p, p.id === selectedId);
  }

  // Двери разъезжаются в стороны; полупрозрачные — видно, кто внутри
  const half = ((w - 4) / 2) * (1 - elevator.door);
  if (half < 0.5) return;
  noStroke();
  fill(COLORS.door);
  rect(x + 2, top + 2, half, h - 4);
  rect(x + w - 2 - half, top + 2, half, h - 4);
  stroke(COLORS.doorLine);
  strokeWeight(1);
  line(x + 2 + half, top + 2, x + 2 + half, top + h - 2);
  line(x + w - 2 - half, top + 2, x + w - 2 - half, top + h - 2);
}
