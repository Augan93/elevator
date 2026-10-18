const CFG = {
  FLOORS: 12,
  MAX_PASSENGERS: 8,

  // Холст и раскладка
  W: 1000,
  H: 740,
  TOP: 36,
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
  MAX_SPEED: 1.6,  // этажей в секунду
  ACCEL: 1.2,      // этажей в секунду², разгон и торможение
  MIN_SPEED: 0.08, // скорость «доводки» у самого этажа
  DOOR_TIME: 0.6,  // время открытия/закрытия дверей, с
  DOOR_HOLD: 2.5,  // сколько двери стоят открытыми, с
  CAPACITY: 4,     // вместимость кабины

  // Пассажиры
  FLOOR_R: 12,     // радиус кружка на этаже
  CABIN_R: 7.5,    // радиус кружка в кабине
  WALK_SPEED: 220, // px/с — скорость входа и выхода
  MAX_AUTO: 14,    // максимум пассажиров автопотока одновременно
  MESSAGE_TIME: 3, // сколько показывается подсказка, с
};

const COLORS = {
  bg: '#f8fafc',

  // Здание
  facade: '#ffffff',
  facadeAlt: '#f8fafc',
  roof: '#334155',
  ground: '#94a3b8',
  slab: '#e2e8f0',
  label: '#475569',
  labelBg: '#eef2f7',
  plate: '#e2e8f0',

  // Шахта и кабина
  shaft: '#1e293b',
  rail: '#334155',
  cable: '#64748b',
  cabinFrame: '#64748b',
  cabinInside: '#f1f5f9',
  cabinLight: '#fde68a',
  door: [148, 163, 184, 225],
  doorLine: '#64748b',

  // Кнопки
  btn: '#ffffff',
  btnBorder: '#94a3b8',
  icon: '#334155',
  lit: '#f59e0b',
  litText: '#ffffff',
  litGlow: 'rgba(245, 158, 11, 0.75)',
  select: '#2563eb',
  shadow: 'rgba(15, 23, 42, 0.3)',
  autoPassenger: '#94a3b8',

  // Панель кабины
  panel: '#1e293b',
  panelCard: '#273449',
  panelText: '#e2e8f0',
  panelMuted: '#94a3b8',
  panelBtn: '#334155',
  panelBtnBorder: '#475569',
  panelLit: '#fbbf24',
  display: '#020617',
  displayText: '#f87171',
  displayGlow: 'rgba(248, 113, 113, 0.8)',
};

const PASSENGER_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#a855f7',
  '#f97316', '#0ea5e9', '#d946ef', '#84cc16',
];

// Верхняя граница этажа f (f может быть дробным — для движущейся кабины)
function floorTopY(f) {
  return CFG.TOP + (CFG.FLOORS - 1 - f) * CFG.FLOOR_H;
}
