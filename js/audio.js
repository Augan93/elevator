let audioCtx = null;
let soundOn = true;

// Браузер разрешает звук только после действия пользователя — создаём контекст по первому клику
function unlockAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// «Дзинь-дон» по прибытии: два затухающих синусоидальных тона
function playDing() {
  if (!soundOn || !audioCtx || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;
  const tones = [
    { freq: 1318.5, at: 0 },    // ми
    { freq: 1046.5, at: 0.22 }, // до
  ];
  for (const { freq, at } of tones) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(0.2, now + at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 1.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + at);
    osc.stop(now + at + 1.3);
  }
}
