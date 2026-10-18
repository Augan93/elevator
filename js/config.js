const CFG = {
  FLOORS: 12,
  MAX_PASSENGERS: 8,

  // Холст и раскладка
  W: 1000,
  H: 740,
  TOP: 30,
  FLOOR_H: 56,
  BUILDING_X: 20,
  BUILDING_W: 500,
  WAIT_X: 75,      // где стоят пассажиры на этаже
  HALL_BTN_X: 360, // кнопки вызова ▲/▼
  SHAFT_X: 410,
  SHAFT_W: 84,
  PANEL_X: 550,
  PANEL_W: 430,

  // Динамика лифта
  SPEED: 1.5,      // этажей в секунду
  DOOR_TIME: 0.6,  // время открытия/закрытия дверей, с
  DOOR_HOLD: 2.5,  // сколько двери стоят открытыми, с
  MESSAGE_TIME: 3, // сколько показывается подсказка, с
};

const COLORS = {
  bg: '#eef1f5',
  wall: '#ffffff',
  slab: '#cbd5e1',
  shaft: '#334155',
  cabin: '#e2e8f0',
  cabinBorder: '#94a3b8',
  door: [100, 116, 139, 215],
  text: '#1f2937',
  muted: '#64748b',
  btn: '#f1f5f9',
  btnBorder: '#94a3b8',
  lit: '#f59e0b',
  litText: '#ffffff',
  select: '#2563eb',
  panel: '#1e293b',
  panelText: '#e2e8f0',
  display: '#0f172a',
  displayText: '#f87171',
};

const PASSENGER_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#a855f7',
  '#f97316', '#0ea5e9', '#d946ef', '#84cc16',
];

// Верхняя граница этажа f (f может быть дробным — для движущейся кабины)
function floorTopY(f) {
  return CFG.TOP + (CFG.FLOORS - 1 - f) * CFG.FLOOR_H;
}
