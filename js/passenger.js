const P_STATE = {
  IDLE: 'idle',       // стоит на этаже
  WAITING: 'waiting', // вызвал лифт и ждёт
  RIDING: 'riding',   // в кабине
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
  constructor(id, name, floor, color) {
    this.id = id;
    this.name = name;
    this.floor = floor;
    this.color = color;
    this.state = P_STATE.IDLE;
    this.dir = DIR.NONE;  // куда хочет ехать (для вызова с этажа)
    this.target = null;   // этаж, нажатый в кабине
  }

  get initial() {
    return this.name[0];
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
