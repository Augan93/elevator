let elevator;
let passengers = [];
let selectedId = null;
let message = null; // { text, until }

function setup() {
  createCanvas(CFG.W, CFG.H).parent('app');
  textFont('system-ui');
  document.getElementById('reset').addEventListener('click', resetSimulation);
  resetSimulation();
}

function resetSimulation() {
  const input = document.getElementById('count');
  const n = constrain(parseInt(input.value, 10) || 1, 1, CFG.MAX_PASSENGERS);
  input.value = n;

  elevator = new Elevator(CFG.FLOORS, serveFloor);
  passengers = [];
  for (let i = 0; i < n; i++) {
    passengers.push(new Passenger(i + 1, Math.floor(random(CFG.FLOORS)), PASSENGER_COLORS[i]));
  }
  selectedId = passengers[0].id;
  message = null;
}

function draw() {
  elevator.update(Math.min(deltaTime / 1000, 0.1));
  for (const p of passengers) {
    if (p.state === P_STATE.RIDING) p.floor = elevator.displayFloor;
  }

  hits = [];
  background(COLORS.bg);
  drawBuilding(elevator, passengers, selectedId);
  drawPanel(elevator, passengers, selectedId, currentHint());

  cursor(hitAt(mouseX, mouseY) ? HAND : ARROW);
}

function mousePressed() {
  const h = hitAt(mouseX, mouseY);
  if (h) h.onClick();
}

// --- Действия пассажиров ---

function selectedPassenger() {
  return passengers.find(p => p.id === selectedId) || null;
}

function selectPassenger(id) {
  selectedId = id;
  message = null;
}

function say(text) {
  message = { text, until: millis() + CFG.MESSAGE_TIME * 1000 };
}

function onHallButton(floor, dir) {
  const p = selectedPassenger();
  if (!p) return say('Сначала выберите пассажира.');
  if (p.state === P_STATE.RIDING) return say(`#${p.id} уже в кабине — выберите этаж на панели.`);
  if (p.floor !== floor) return say(`#${p.id} находится на ${p.floor + 1} этаже — вызывайте лифт оттуда.`);
  if (p.state === P_STATE.WAITING) {
    if (p.dir === dir) return say(`#${p.id} уже вызвал лифт.`);
    releaseHallCall(p); // передумал ехать в другую сторону
  }

  p.state = P_STATE.WAITING;
  p.dir = dir;
  elevator.callFromHall(floor, dir);
  message = null;
}

function onCabinButton(floor) {
  const p = selectedPassenger();
  if (!p || p.state !== P_STATE.RIDING) return say('Выберите пассажира, который находится в кабине.');

  const old = p.target;
  p.target = floor;
  if (old !== null && old !== floor && !passengers.some(q => q.state === P_STATE.RIDING && q.target === old)) {
    elevator.cancelCar(old);
  }
  elevator.pressCar(floor);
  message = null;
}

// Снимаем вызов с этажа, если его больше никто не ждёт
function releaseHallCall(p) {
  const others = passengers.some(
    q => q !== p && q.state === P_STATE.WAITING && q.floor === p.floor && q.dir === p.dir
  );
  if (!others) elevator.cancelHall(p.floor, p.dir);
}

// Колбэк лифта: двери открыты на этаже floor, лифт едет в направлении dir
function serveFloor(floor, dir) {
  let changed = false;
  for (const p of passengers) {
    if (p.state === P_STATE.RIDING && p.target === floor) {
      p.state = P_STATE.IDLE;
      p.floor = floor;
      p.dir = DIR.NONE;
      p.target = null;
      changed = true;
    } else if (p.state === P_STATE.WAITING && p.floor === floor && p.dir === dir && dir !== DIR.NONE) {
      p.state = P_STATE.RIDING;
      p.target = null;
      changed = true;
      if (p.id === selectedId) say(`#${p.id} вошёл в кабину — нажмите нужный этаж на панели.`);
    }
  }
  return changed;
}

function currentHint() {
  if (message && millis() < message.until) return message.text;

  const p = selectedPassenger();
  if (!p) return 'Выберите пассажира: кликните по кружку на этаже или в списке.';
  switch (p.state) {
    case P_STATE.IDLE:
      return `#${p.id} на ${p.floor + 1} этаже. Нажмите ▲ или ▼ на его этаже, чтобы вызвать лифт.`;
    case P_STATE.WAITING:
      return `#${p.id} ждёт лифт на ${p.floor + 1} этаже.`;
    default:
      return p.target === null
        ? `#${p.id} в кабине. Нажмите нужный этаж на панели.`
        : `#${p.id} едет на ${p.target + 1} этаж.`;
  }
}
