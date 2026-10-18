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
 * Этажи нумеруются с 0. Кто входит и выходит, решает внешний колбэк onServe.
 */
class Elevator {
  constructor(floors, onServe) {
    this.floors = floors;
    this.onServe = onServe; // (floor, dir) => true, если кто-то вошёл или вышел

    this.floor = 0;         // текущий (или последний пройденный) этаж
    this.pos = 0;           // плавная позиция кабины, в этажах
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

  callFromHall(floor, dir) {
    this.hallCalls[dir].add(floor);
  }

  cancelHall(floor, dir) {
    this.hallCalls[dir].delete(floor);
  }

  pressCar(floor) {
    this.carCalls.add(floor);
  }

  cancelCar(floor) {
    this.carCalls.delete(floor);
  }

  openDoors() {
    if (this.state === STATE.OPEN) this.holdTimer = CFG.DOOR_HOLD;
    else if (this.state === STATE.CLOSING || this.state === STATE.IDLE) this.state = STATE.OPENING;
  }

  closeDoors() {
    if (this.state === STATE.OPEN) this.holdTimer = 0;
  }

  requestFloors() {
    return [...this.carCalls, ...this.hallCalls[DIR.UP], ...this.hallCalls[DIR.DOWN]];
  }

  hasRequestsAhead(dir) {
    return dir !== DIR.NONE && this.requestFloors().some(f => (f - this.floor) * dir > 0);
  }

  // Правило остановки LOOK
  shouldStopHere() {
    const f = this.floor;
    if (this.carCalls.has(f)) return true;
    if (this.dir === DIR.NONE) return this.hallCalls[DIR.UP].has(f) || this.hallCalls[DIR.DOWN].has(f);
    if (this.hallCalls[this.dir].has(f)) return true;
    // Крайний вызов: дальше ехать некуда, забираем тех, кто ждёт в обратную сторону
    return !this.hasRequestsAhead(this.dir) && this.hallCalls[-this.dir].has(f);
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
      this.state = STATE.OPENING;
      return;
    }
    if (this.hasRequestsAhead(this.dir)) {
      this.state = STATE.MOVING;
      return;
    }
    if (this.hasRequestsAhead(-this.dir)) {
      this.dir = -this.dir;
      this.state = STATE.MOVING;
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
    this.state = STATE.MOVING;
  }

  move(dt) {
    const next = this.floor + this.dir;
    this.pos += this.dir * CFG.SPEED * dt;
    if ((this.pos - next) * this.dir < 0) return;

    this.pos = next;
    this.floor = next;
    if (this.shouldStopHere()) this.state = STATE.OPENING;
    else if (!this.hasRequestsAhead(this.dir)) this.state = STATE.IDLE;
  }

  // Двери открыты: снимаем вызовы этого этажа и сажаем/высаживаем пассажиров
  serve() {
    const f = this.floor;
    this.carCalls.delete(f);

    if (this.dir === DIR.NONE) {
      if (this.hallCalls[DIR.UP].has(f)) this.dir = DIR.UP;
      else if (this.hallCalls[DIR.DOWN].has(f)) this.dir = DIR.DOWN;
    } else if (
      !this.hallCalls[this.dir].has(f) &&
      !this.hasRequestsAhead(this.dir) &&
      this.hallCalls[-this.dir].has(f)
    ) {
      this.dir = -this.dir;
    }

    if (this.dir !== DIR.NONE) this.hallCalls[this.dir].delete(f);

    if (this.onServe(f, this.dir)) this.holdTimer = CFG.DOOR_HOLD;
  }
}
