const STATE_LABELS = {
  [STATE.IDLE]: 'стоит',
  [STATE.MOVING]: 'едет',
  [STATE.OPENING]: 'двери открываются',
  [STATE.OPEN]: 'двери открыты',
  [STATE.CLOSING]: 'двери закрываются',
};

// Вид изнутри кабины: табло, кнопки этажей (2 столбца), двери; справа — пассажиры и подсказка
function drawPanel(elevator, passengers, selectedId, hintText) {
  const x0 = CFG.PANEL_X;
  const top = CFG.TOP;

  noStroke();
  fill(COLORS.panel);
  rect(x0, top, CFG.PANEL_W, CFG.FLOORS * CFG.FLOOR_H, 8);

  fill(COLORS.panelText);
  textAlign(LEFT, CENTER);
  textSize(15);
  textStyle(BOLD);
  text('Внутри кабины', x0 + 20, top + 22);
  text('Пассажиры', x0 + 220, top + 22);
  textStyle(NORMAL);

  drawDisplay(elevator, x0 + 20, top + 42);
  drawFloorButtons(elevator, x0, top + 170);
  drawDoorButtons(x0 + 20, top + 545);
  drawPassengerList(passengers, selectedId, x0 + 210, top + 42);
  drawHint(hintText, x0 + 220, top + 345);
}

function drawDisplay(elevator, x, y) {
  fill(COLORS.display);
  rect(x, y, 170, 70, 6);

  fill(COLORS.displayText);
  if (elevator.dir !== DIR.NONE) drawArrow(x + 32, y + 35, elevator.dir, 10);
  textAlign(CENTER, CENTER);
  textSize(40);
  textStyle(BOLD);
  text(elevator.displayFloor + 1, x + 105, y + 37);
  textStyle(NORMAL);

  fill(COLORS.muted);
  textSize(13);
  text(STATE_LABELS[elevator.state], x + 85, y + 88);
}

function drawFloorButtons(elevator, x0, y0) {
  for (let f = 0; f < CFG.FLOORS; f++) {
    const row = Math.floor(f / 2);
    const col = f % 2;
    const x = x0 + 65 + col * 90;
    const y = y0 + (CFG.FLOORS / 2 - 1 - row) * 60 + 26;
    const lit = elevator.carCalls.has(f);

    stroke(lit ? COLORS.lit : COLORS.btnBorder);
    strokeWeight(2);
    fill(lit ? COLORS.lit : COLORS.btn);
    circle(x, y, 50);
    noStroke();
    fill(lit ? COLORS.litText : COLORS.text);
    textAlign(CENTER, CENTER);
    textSize(18);
    text(f + 1, x, y + 1);
    addHit({ x, y, r: 25 }, () => onCabinButton(f));
  }
}

function drawDoorButtons(x, y) {
  const buttons = [
    { label: '◀ ▶', onClick: () => elevator.openDoors() },
    { label: '▶ ◀', onClick: () => elevator.closeDoors() },
  ];
  buttons.forEach((b, i) => {
    const bx = x + i * 90;
    stroke(COLORS.btnBorder);
    strokeWeight(1.5);
    fill(COLORS.btn);
    rect(bx, y, 80, 38, 19);
    noStroke();
    fill(COLORS.text);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(b.label, bx + 40, y + 19);
    addHit({ x: bx, y, w: 80, h: 38 }, b.onClick);
  });
}

function drawPassengerList(passengers, selectedId, x, y) {
  passengers.forEach((p, i) => {
    const ry = y + i * 34;
    const selected = p.id === selectedId;
    if (selected) {
      noStroke();
      fill(255, 255, 255, 30);
      rect(x, ry, 200, 30, 6);
    }
    drawPassenger(p, x + 20, ry + 15, 10, selected);
    noStroke();
    fill(COLORS.panelText);
    textAlign(LEFT, CENTER);
    textSize(13);
    text(p.describe(), x + 42, ry + 15);
    addHit({ x, y: ry, w: 200, h: 30 }, () => selectPassenger(p.id));
  });
}

function drawHint(hintText, x, y) {
  stroke(COLORS.muted);
  strokeWeight(1);
  line(x, y - 10, x + 190, y - 10);
  noStroke();
  fill(COLORS.panelText);
  textAlign(LEFT, TOP);
  textSize(13);
  textLeading(19);
  text(hintText, x, y, 190, 200);
}
