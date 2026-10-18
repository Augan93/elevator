let elevator;
let passengers = [];
let selectedId = null;
let message = null; // { text, until }
let simTime = 0;    // время симуляции, с — для статистики
let nextId = 1;

function setup() {
  createCanvas(CFG.W, CFG.H).parent('app');
  textFont('system-ui');

  const autoInput = document.getElementById('auto');
  const rateInput = document.getElementById('rate');
  const soundInput = document.getElementById('sound');
  traffic.enabled = autoInput.checked;
  traffic.rate = rateInput.value;
  soundOn = soundInput.checked;

  document.getElementById('reset').addEventListener('click', resetSimulation);
  autoInput.addEventListener('change', () => {
    traffic.enabled = autoInput.checked;
    traffic.timer = 0;
  });
  rateInput.addEventListener('change', () => {
    traffic.rate = rateInput.value;
    traffic.timer = 0;
  });
  soundInput.addEventListener('change', () => {
    soundOn = soundInput.checked;
  });
  document.addEventListener('pointerdown', unlockAudio);

  resetSimulation();
}

function resetSimulation() {
  const input = document.getElementById('count');
  const n = constrain(parseInt(input.value, 10) || 1, 1, CFG.MAX_PASSENGERS);
  input.value = n;

  elevator = new Elevator(CFG.FLOORS, { onServe: serveFloor, onArrive: playDing });
  nextId = 1;
  passengers = pickNames(n).map(
    (name, i) => new Passenger(nextId++, name, Math.floor(random(CFG.FLOORS)), PASSENGER_COLORS[i])
  );
  selectedId = passengers[0].id;
  message = null;
  traffic.timer = 0;
  resetStats();
}

function draw() {
  const dt = Math.min(deltaTime / 1000, 0.1);
  simTime += dt;

  updateTraffic(dt);
  elevator.load = passengers.filter(p => p.inCabin).length;
  elevator.update(dt);
  updatePassengers(dt);

  hits = [];
  background(COLORS.bg);
  drawBuilding(elevator, passengers, selectedId);
  drawPanel(elevator, passengers, selectedId, currentHint(), stats);

  const hovered = hitAt(mouseX, mouseY);
  drawTooltip(hovered);
  cursor(hovered && hovered.onClick ? HAND : ARROW);
}

function mousePressed() {
  const h = hitAt(mouseX, mouseY);
  if (h && h.onClick) h.onClick();
}

// --- Перемещение пассажиров ---

function updatePassengers(dt) {
  const cabin = passengers.filter(p => p.inCabin);
  const byFloor = new Map();
  for (const p of passengers) {
    if (p.inCabin) continue;
    if (!byFloor.has(p.floor)) byFloor.set(p.floor, []);
    byFloor.get(p.floor).push(p);
  }

  for (const p of passengers) {
    let arrived;
    if (p.inCabin) {
      arrived = p.moveTo(cabinSlot(cabin.indexOf(p), elevator.pos), CFG.CABIN_R, dt);
    } else {
      const here = byFloor.get(p.floor);
      arrived = p.moveTo(floorSlot(p.floor, here.indexOf(p), here.length), CFG.FLOOR_R, dt);
    }
    if (arrived) finishWalk(p);
  }

  passengers = passengers.filter(p => !(p.state === P_STATE.GONE && p.alpha === 0));
}

// Пассажир дошёл до кабины или вышел на этаж
function finishWalk(p) {
  if (p.state === P_STATE.BOARDING) {
    p.state = P_STATE.RIDING;
    if (p.auto) pressTarget(p, p.plannedTarget);
    else if (p.id === selectedId) say(`${p.name} в кабине — нажмите нужный этаж на панели.`);
  } else if (p.state === P_STATE.EXITING) {
    p.state = p.auto ? P_STATE.GONE : P_STATE.IDLE;
  }
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

function callElevator(p, dir) {
  p.state = P_STATE.WAITING;
  p.dir = dir;
  p.callTime = simTime;
  elevator.callFromHall(p.floor, dir);
}

// Как в настоящем лифте, нажатую кнопку не отменить: если пассажир передумал,
// старая остановка останется, но выйдет он на новом этаже
function pressTarget(p, floor) {
  p.target = floor;
  elevator.pressCar(floor);
}

function spawnAutoPassenger() {
  const { from, to } = randomTrip();
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const p = new Passenger(nextId++, name, from, COLORS.autoPassenger, true);
  p.plannedTarget = to;
  passengers.push(p);
  callElevator(p, Math.sign(to - from));
}

function onHallButton(floor, dir) {
  const p = selectedPassenger();
  if (!p) return say('Сначала выберите пассажира.');
  if (p.inCabin) return say(`${p.name} уже в кабине — выберите этаж на панели.`);
  if (p.state === P_STATE.EXITING) return say(`${p.name} ещё выходит из кабины.`);
  if (p.floor !== floor) return say(`${p.name} сейчас на ${p.floor + 1} этаже — вызывайте лифт оттуда.`);
  if (p.state === P_STATE.WAITING) {
    if (p.dir === dir) return say(`Вызов уже есть — ${p.name} ждёт лифт.`);
    releaseHallCall(p); // пассажир решил ехать в другую сторону
  }

  callElevator(p, dir);
  message = null;
}

function onCabinButton(floor) {
  const p = selectedPassenger();
  if (p && p.state === P_STATE.BOARDING) return say(`${p.name} ещё входит в кабину.`);
  if (!p || p.state !== P_STATE.RIDING) return say('Выберите пассажира, который находится в кабине.');

  pressTarget(p, floor);
  message = null;
}

// Снимаем вызов с этажа, если его больше никто не ждёт
function releaseHallCall(p) {
  const others = passengers.some(
    q => q !== p && q.state === P_STATE.WAITING && q.floor === p.floor && q.dir === p.dir
  );
  if (!others) elevator.cancelHall(p.floor, p.dir);
}

// Колбэк лифта: двери открыты на этаже floor, лифт едет в направлении dir.
// Сначала выходят, потом входят — пока есть место.
function serveFloor(floor, dir) {
  let load = passengers.filter(p => p.inCabin).length;
  let leftBehind = false;

  for (const p of passengers) {
    if (p.state === P_STATE.RIDING && p.target === floor) {
      p.state = P_STATE.EXITING;
      p.floor = floor;
      p.dir = DIR.NONE;
      p.target = null;
      recordRide(simTime - p.boardTime);
      load--;
    }
  }

  for (const p of passengers) {
    if (p.state !== P_STATE.WAITING || p.floor !== floor || p.dir !== dir || dir === DIR.NONE) continue;
    if (load >= elevator.capacity) {
      leftBehind = true;
      if (p.id === selectedId) say(`Кабина заполнена — ${p.name} ждёт следующего рейса.`);
      continue;
    }
    p.state = P_STATE.BOARDING;
    p.target = null;
    p.boardTime = simTime;
    recordWait(simTime - p.callTime);
    load++;
  }

  elevator.load = load;
  // Пока кто-то входит или выходит, двери не закрываются
  return { busy: passengers.some(p => p.walking), leftBehind };
}

function currentHint() {
  if (message && millis() < message.until) return message.text;

  const p = selectedPassenger();
  if (!p) return 'Выберите пассажира: кликните по кружку на этаже или в списке.';
  switch (p.state) {
    case P_STATE.IDLE:
      return `${p.name} на ${p.floor + 1} этаже. Нажмите ▲ или ▼ на этом этаже, чтобы вызвать лифт.`;
    case P_STATE.WAITING:
      return `${p.name} ждёт лифт на ${p.floor + 1} этаже.`;
    case P_STATE.BOARDING:
      return `${p.name} входит в кабину.`;
    case P_STATE.EXITING:
      return `${p.name} выходит на ${p.floor + 1} этаже.`;
    default:
      return p.target === null
        ? `${p.name} в кабине. Нажмите нужный этаж на панели.`
        : `${p.name} едет на ${p.target + 1} этаж.`;
  }
}
