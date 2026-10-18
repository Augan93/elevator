const DIR = { UP: 1, NONE: 0, DOWN: -1 };

const STATE = {
  IDLE: 'idle',
  MOVING: 'moving',
  OPENING: 'opening',
  OPEN: 'open',
  CLOSING: 'closing',
};

/**
 * Один лифт с собирающим управлением по алгоритму LOOK (разновидность SCAN):
 *  - едет в текущем направлении, пока впереди есть вызовы;
 *  - по пути останавливается на этаже, если туда нажали в кабине
 *    или на этаже ждут в ту же сторону;
 *  - когда впереди вызовов нет — разворачивается (или встаёт, если вызовов нет вообще).
 *
 * Кабина разгоняется и тормозит с постоянным ускорением, поэтому этаж остановки
 * выбирается заранее: вызовы ближе тормозного пути лифт проезжает.
 * Полная кабина не реагирует на вызовы с этажей, пока кто-нибудь не выйдет.
 *
 * Этажи нумеруются с 0. Кто входит и выходит, решает контроллер через hooks.onServe.
 */
class Elevator {
  constructor(floors, hooks) {
    this.floors = floors;
    this.hooks = hooks;     // { onServe(floor, dir) → { busy, leftBehind }, onArrive(floor) }

    this.capacity = CFG.CAPACITY;
    this.load = 0;          // сколько человек в кабине — ведёт контроллер
    this.overload = false;  // на этой остановке кому-то не хватило места
    this.dirLocked = false; // на этой остановке уже забрали попутчиков — не разворачиваемся

    this.floor = 0;         // этаж последней остановки
    this.pos = 0;           // плавная позиция кабины, в этажах
    this.speed = 0;         // этажей в секунду, всегда ≥ 0 — направление в dir
    this.stopTarget = null; // этаж, на котором кабина остановится
    this.dir = DIR.NONE;
    this.state = STATE.IDLE;
    this.door = 0;          // 0 — закрыты, 1 — открыты
    this.holdTimer = 0;

    this.carCalls = new Set();
    this.hallCalls = { [DIR.UP]: new Set(), [DIR.DOWN]: new Set() };
  }

  get displayFloor() {
    return Math.round(this.pos);
  }

  get full() {
    return this.load >= this.capacity;
  }

  get brakingDistance() {
    return (this.speed * this.speed) / (2 * CFG.ACCEL);
  }

  callFromHall(floor, dir) {
    this.hallCalls[dir].add(floor);
  }

  cancelHall(floor, dir) {
    this.hallCalls[dir].delete(floor);
  }

  pressCar(floor) {
    this.carCalls.add(floor);
  }

  openDoors() {
    if (this.state === STATE.OPEN) this.holdTimer = CFG.DOOR_HOLD;
    else if (this.state === STATE.CLOSING || this.state === STATE.IDLE) this.state = STATE.OPENING;
  }

  closeDoors() {
    if (this.state === STATE.OPEN) this.holdTimer = 0;
  }

  requestFloors() {
    // Полная кабина везёт тех, кто внутри, и не отвлекается на вызовы с этажей
    if (this.full) return [...this.carCalls];
    return [...this.carCalls, ...this.hallCalls[DIR.UP], ...this.hallCalls[DIR.DOWN]];
  }

  hasRequestsBeyond(pos, dir) {
    return dir !== DIR.NONE && this.requestFloors().some(f => (f - pos) * dir > 0);
  }

  hasRequestsAhead(dir) {
    return this.hasRequestsBeyond(this.pos, dir);
  }

  // Правило остановки LOOK для этажа f при движении в направлении dir
  shouldStopAt(f, dir) {
    if (this.carCalls.has(f)) return true;
    if (this.full) return false;
    if (dir === DIR.NONE) return this.hallCalls[DIR.UP].has(f) || this.hallCalls[DIR.DOWN].has(f);
    if (this.hallCalls[dir].has(f)) return true;
    // Крайний вызов: дальше ехать некуда, забираем тех, кто ждёт в обратную сторону
    return !this.hasRequestsBeyond(f, dir) && this.hallCalls[-dir].has(f);
  }

  shouldStopHere() {
    return this.shouldStopAt(this.floor, this.dir);
  }

  update(dt) {
    switch (this.state) {
      case STATE.IDLE:
        this.decide();
        break;

      case STATE.MOVING:
        this.move(dt);
        break;

      case STATE.OPENING:
        this.door = Math.min(1, this.door + dt / CFG.DOOR_TIME);
        if (this.door === 1) {
          this.state = STATE.OPEN;
          this.holdTimer = CFG.DOOR_HOLD;
        }
        break;

      case STATE.OPEN:
        this.serve();
        this.holdTimer -= dt;
        if (this.holdTimer <= 0) this.state = STATE.CLOSING;
        break;

      case STATE.CLOSING:
        if (this.shouldStopHere()) {
          this.state = STATE.OPENING;
          this.dirLocked = false;
          break;
        }
        this.door = Math.max(0, this.door - dt / CFG.DOOR_TIME);
        if (this.door === 0) this.state = STATE.IDLE;
        break;
    }
  }

  // Кабина стоит с закрытыми дверями: выбираем, что делать дальше
  decide() {
    if (this.shouldStopHere()) {
      this.arrive();
      return;
    }
    if (this.hasRequestsAhead(this.dir)) {
      this.startMoving();
      return;
    }
    if (this.hasRequestsAhead(-this.dir)) {
      this.dir = -this.dir;
      this.startMoving();
      return;
    }

    const floors = this.requestFloors();
    if (floors.length === 0) {
      this.dir = DIR.NONE;
      return;
    }
    // Лифт свободен: едем к ближайшему вызову
    const f = this.floor;
    const nearest = floors.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));
    this.dir = Math.sign(nearest - f);
    this.startMoving();
  }

  startMoving() {
    this.state = STATE.MOVING;
    this.speed = 0;
    this.stopTarget = null;
    this.overload = false;
  }

  // Остановка на этаже: «дзинь» и двери открываются
  arrive() {
    this.state = STATE.OPENING;
    this.overload = false;
    this.dirLocked = false;
    this.hooks.onArrive(this.floor);
  }

  move(dt) {
    this.stopTarget = this.chooseStopTarget();
    const dist = (this.stopTarget - this.pos) * this.dir;

    // Разгоняемся до максимальной скорости, но не быстрее, чем успеем затормозить к этажу
    const brakeSpeed = Math.sqrt(2 * CFG.ACCEL * Math.max(dist, 0));
    this.speed = Math.min(
      this.speed + CFG.ACCEL * dt,
      CFG.MAX_SPEED,
      Math.max(brakeSpeed, CFG.MIN_SPEED)
    );

    const step = this.speed * dt;
    if (step < dist) {
      this.pos += this.dir * step;
      return;
    }

    this.pos = this.floor = this.stopTarget;
    this.speed = 0;
    this.stopTarget = null;
    if (this.shouldStopHere()) this.arrive();
    else this.state = STATE.IDLE; // вызов отменили, пока ехали
  }

  // Первый этаж впереди, где надо остановиться и до которого ещё успеваем затормозить
  chooseStopTarget() {
    const reach = Math.max(this.brakingDistance - 0.02, 0.001);
    const first = this.dir > 0 ? Math.ceil(this.pos + reach) : Math.floor(this.pos - reach);

    let candidate = null;
    for (let f = first; f >= 0 && f < this.floors; f += this.dir) {
      if (this.shouldStopAt(f, this.dir)) {
        candidate = f;
        break;
      }
    }

    const current = this.stopTarget;
    const currentValid = current !== null && this.shouldStopAt(current, this.dir);
    if (candidate !== null && (!currentValid || (candidate - current) * this.dir < 0)) return candidate;
    if (current !== null) return current;
    // Впереди ничего нет — тормозим на ближайшем этаже
    return constrain(first, 0, this.floors - 1);
  }

  // Двери открыты: снимаем вызовы этого этажа и сажаем/высаживаем пассажиров
  serve() {
    const f = this.floor;
    this.carCalls.delete(f);

    if (this.dir === DIR.NONE) {
      if (this.hallCalls[DIR.UP].has(f)) this.dir = DIR.UP;
      else if (this.hallCalls[DIR.DOWN].has(f)) this.dir = DIR.DOWN;
    } else if (
      !this.dirLocked &&
      !this.full &&
      !this.hallCalls[this.dir].has(f) &&
      !this.hasRequestsAhead(this.dir) &&
      this.hallCalls[-this.dir].has(f)
    ) {
      this.dir = -this.dir;
    }

    if (this.dir !== DIR.NONE && this.hallCalls[this.dir].has(f)) {
      this.hallCalls[this.dir].delete(f);
      // Попутчики ещё идут в кабину и не нажали этаж — на этой остановке не разворачиваемся
      this.dirLocked = true;
    }

    const { busy, leftBehind } = this.hooks.onServe(f, this.dir);
    if (leftBehind) {
      // Не всем хватило места: вызов остаётся гореть до следующего рейса
      this.hallCalls[this.dir].add(f);
      this.overload = true;
    }
    if (busy) this.holdTimer = CFG.DOOR_HOLD;
  }
}
