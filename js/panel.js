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
  const top = CFG.TOP - 12;
  const h = CFG.FLOORS * CFG.FLOOR_H + 20;

  noStroke();
  shadow(COLORS.shadow, 16, 4);
  fill(COLORS.panel);
  rect(x0, top, CFG.PANEL_W, h, 14);
  noShadow();

  stroke(COLORS.panelBtnBorder);
  strokeWeight(1);
  line(x0 + 210, top + 20, x0 + 210, top + h - 20);

  drawSectionTitle('Внутри кабины', x0 + 20, top + 24);
  drawSectionTitle('Пассажиры', x0 + 226, top + 24);

  drawDisplay(elevator, x0 + 20, top + 44);
  drawFloorButtons(elevator, x0, top + 162);
  drawDoorButtons(x0 + 20, top + 540);
  drawPassengerList(passengers, selectedId, x0 + 226, top + 44);
  drawHint(hintText, x0 + 226, top + 44 + passengers.length * 38 + 10);
}

function drawSectionTitle(label, x, y) {
  noStroke();
  fill(COLORS.panelMuted);
  textAlign(LEFT, CENTER);
  textSize(11);
  textStyle(BOLD);
  text(label.toUpperCase(), x, y);
  textStyle(NORMAL);
}

function drawDisplay(elevator, x, y) {
  noStroke();
  fill(COLORS.display);
  rect(x, y, 170, 72, 10);

  shadow(COLORS.displayGlow, 12);
  fill(COLORS.displayText);
  if (elevator.dir !== DIR.NONE) drawArrow(x + 34, y + 36, elevator.dir, 10);
  textAlign(CENTER, CENTER);
  textSize(42);
  textStyle(BOLD);
  text(elevator.displayFloor + 1, x + 108, y + 38);
  textStyle(NORMAL);
  noShadow();

  fill(COLORS.panelMuted);
  textSize(12);
  text(STATE_LABELS[elevator.state], x + 85, y + 90);
}

function drawFloorButtons(elevator, x0, y0) {
  for (let f = 0; f < CFG.FLOORS; f++) {
    const row = Math.floor(f / 2);
    const col = f % 2;
    const x = x0 + 62 + col * 86;
    const y = y0 + (CFG.FLOORS / 2 - 1 - row) * 60 + 26;
    const lit = elevator.carCalls.has(f);

    if (lit) shadow(COLORS.litGlow, 14);
    stroke(lit ? COLORS.panelLit : COLORS.panelBtnBorder);
    strokeWeight(2);
    fill(COLORS.panelBtn);
    circle(x, y, 50);
    noShadow();

    noStroke();
    fill(lit ? COLORS.panelLit : COLORS.panelText);
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    text(f + 1, x, y + 1);
    textStyle(NORMAL);
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
    stroke(COLORS.panelBtnBorder);
    strokeWeight(2);
    fill(COLORS.panelBtn);
    rect(bx, y, 80, 40, 20);
    noStroke();
    fill(COLORS.panelText);
    textAlign(CENTER, CENTER);
    textSize(13);
    text(b.label, bx + 40, y + 20);
    addHit({ x: bx, y, w: 80, h: 40 }, b.onClick);
  });

  noStroke();
  fill(COLORS.panelMuted);
  textAlign(CENTER, CENTER);
  textSize(11);
  text('открыть', x + 40, y + 54);
  text('закрыть', x + 130, y + 54);
}

function drawPassengerList(passengers, selectedId, x, y) {
  const w = 184;
  passengers.forEach((p, i) => {
    const ry = y + i * 38;
    const selected = p.id === selectedId;

    if (selected) {
      stroke(COLORS.select);
      strokeWeight(1.5);
    } else {
      noStroke();
    }
    fill(selected ? COLORS.panelBtn : COLORS.panelCard);
    rect(x, ry, w, 32, 8);

    drawPassenger(p, x + 18, ry + 16, 10, false);
    noStroke();
    fill(COLORS.panelText);
    textAlign(LEFT, CENTER);
    textSize(12.5);
    text(p.describe(), x + 36, ry + 16);
    addHit({ x, y: ry, w, h: 32 }, () => selectPassenger(p.id));
  });
}

function drawHint(hintText, x, y) {
  const w = 184;
  const h = 150;
  noStroke();
  fill(COLORS.panelCard);
  rect(x, y, w, h, 8);
  drawSectionTitle('Подсказка', x + 12, y + 16);
  fill(COLORS.panelText);
  textAlign(LEFT, TOP);
  textSize(13);
  textLeading(19);
  text(hintText, x + 12, y + 30, w - 24, h - 40);
}
