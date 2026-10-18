// Средний интервал между новыми пассажирами автопотока, с.
// Один лифт перевозит примерно человека в 10 с: на «часто» очередь растёт — так и задумано.
const TRAFFIC_RATES = { low: 20, mid: 12, high: 6 };

const traffic = { enabled: false, rate: 'mid', timer: 0 };

const stats = { trips: 0, waitSum: 0, waitCount: 0, rideSum: 0 };

function updateTraffic(dt) {
  if (!traffic.enabled) return;
  traffic.timer -= dt;
  if (traffic.timer > 0) return;
  // Пуассоновский поток: интервалы между пассажирами распределены экспоненциально
  traffic.timer = -Math.log(1 - Math.random()) * TRAFFIC_RATES[traffic.rate];
  if (passengers.filter(p => p.auto).length < CFG.MAX_AUTO) spawnAutoPassenger();
}

// Поездки как в жилом доме: чаще всего с 1 этажа наверх или сверху на 1 этаж
function randomTrip() {
  const upper = () => 1 + Math.floor(Math.random() * (CFG.FLOORS - 1));
  const roll = Math.random();
  if (roll < 0.4) return { from: 0, to: upper() };
  if (roll < 0.8) return { from: upper(), to: 0 };
  const from = upper();
  let to = upper();
  while (to === from) to = upper();
  return { from, to };
}

function resetStats() {
  stats.trips = 0;
  stats.waitSum = 0;
  stats.waitCount = 0;
  stats.rideSum = 0;
}

function recordWait(seconds) {
  stats.waitSum += seconds;
  stats.waitCount++;
}

function recordRide(seconds) {
  stats.rideSum += seconds;
  stats.trips++;
}

function formatAverage(sum, count) {
  return count ? `${(sum / count).toFixed(1)} с` : '—';
}
