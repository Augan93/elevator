const P_STATE = {
  IDLE: 'idle',         // стоит на этаже
  WAITING: 'waiting',   // вызвал лифт и ждёт
  BOARDING: 'boarding', // идёт в кабину
  RIDING: 'riding',     // в кабине
  EXITING: 'exiting',   // выходит из кабины на этаж
  GONE: 'gone',         // пассажир автопотока доехал и исчезает
};

// Русские и казахские имена вперемешку
const NAMES = [
  'Анна', 'Борис', 'Вера', 'Глеб', 'Егор', 'Иван', 'Катя', 'Лев',
  'Маша', 'Никита', 'Оля', 'Паша', 'Света', 'Фёдор', 'Юля', 'Яна',
  'Айгерим', 'Алмас', 'Арман', 'Әсем', 'Бауыржан', 'Гульнара', 'Дамир', 'Динара',
  'Ерлан', 'Жанар', 'Канат', 'Мадина', 'Нурлан', 'Сауле', 'Талгат', 'Ұлжан', 'Шынар',
];

// n случайных имён с разными первыми буквами — чтобы буквы в кружках не повторялись
function pickNames(n) {
  const pool = [...NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const initials = new Set();
  const names = [];
  for (const name of pool) {
    if (names.length === n) break;
    if (initials.has(name[0])) continue;
    initials.add(name[0]);
    names.push(name);
  }
  return names;
}

class Passenger {
  constructor(id, name, floor, color, auto = false) {
    this.id = id;
    this.name = name;
    this.floor = floor;
    this.color = color;
    this.auto = auto;         // пассажир автопотока: сам вызывает лифт и жмёт этаж
    this.state = P_STATE.IDLE;
    this.dir = DIR.NONE;      // куда хочет ехать (для вызова с этажа)
    this.target = null;       // этаж, нажатый в кабине
    this.plannedTarget = null; // куда собирается ехать пассажир автопотока

    this.callTime = 0;        // когда вызвал лифт — для статистики
    this.boardTime = 0;       // когда вошёл в кабину

    // Положение на экране
    this.x = null;
    this.y = null;
    this.r = CFG.FLOOR_R;
    this.alpha = auto ? 0 : 1;
  }

  get initial() {
    return this.name[0];
  }

  get inCabin() {
    return this.state === P_STATE.RIDING || this.state === P_STATE.BOARDING;
  }

  get walking() {
    return this.state === P_STATE.BOARDING || this.state === P_STATE.EXITING;
  }

  describe() {
    switch (this.state) {
      case P_STATE.WAITING:
        return `этаж ${this.floor + 1}, ждёт ${this.dir === DIR.UP ? '▲' : '▼'}`;
      case P_STATE.BOARDING:
        return 'входит в кабину';
      case P_STATE.RIDING:
        return `в кабине → ${this.target === null ? '?' : this.target + 1}`;
      case P_STATE.EXITING:
        return `выходит на ${this.floor + 1} этаже`;
      default:
        return `этаж ${this.floor + 1}`;
    }
  }

  // Двигаем кружок к его месту: входящие и выходящие идут шагом, остальные плавно подстраиваются.
  // Возвращает true, когда пассажир дошёл до кабины или до места на этаже.
  moveTo(home, r, dt) {
    if (this.x === null) {
      this.x = home.x;
      this.y = home.y;
      this.r = r;
    }
    this.r += (r - this.r) * Math.min(1, dt * 6);
    this.alpha = this.state === P_STATE.GONE
      ? Math.max(0, this.alpha - dt * 1.5)
      : Math.min(1, this.alpha + dt * 3);

    if (this.state === P_STATE.RIDING) {
      this.x = home.x;
      this.y = home.y;
      return false;
    }

    if (this.walking) {
      const dx = home.x - this.x;
      const dy = home.y - this.y;
      const d = Math.hypot(dx, dy);
      const step = CFG.WALK_SPEED * dt;
      if (d <= step) {
        this.x = home.x;
        this.y = home.y;
        return true;
      }
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      return false;
    }

    const k = Math.min(1, dt * 8);
    this.x += (home.x - this.x) * k;
    this.y += (home.y - this.y) * k;
    return false;
  }
}
