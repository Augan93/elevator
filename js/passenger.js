const P_STATE = {
  IDLE: 'idle',       // стоит на этаже
  WAITING: 'waiting', // вызвал лифт и ждёт
  RIDING: 'riding',   // в кабине
};

class Passenger {
  constructor(id, floor, color) {
    this.id = id;
    this.floor = floor;
    this.color = color;
    this.state = P_STATE.IDLE;
    this.dir = DIR.NONE;  // куда хочет ехать (для вызова с этажа)
    this.target = null;   // этаж, нажатый в кабине
  }

  describe() {
    switch (this.state) {
      case P_STATE.WAITING:
        return `этаж ${this.floor + 1}, ждёт ${this.dir === DIR.UP ? '▲' : '▼'}`;
      case P_STATE.RIDING:
        return `в кабине → ${this.target === null ? '?' : this.target + 1}`;
      default:
        return `этаж ${this.floor + 1}`;
    }
  }
}
