let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playMatchFound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Add a low-pass filter to make the sawtooth sound warm and modern
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 1.0);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime); // Start at A3
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.0); // Sweep up to A5

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

let humOsc = null;
let humGain = null;
let lfoOsc = null;

export function startWatchHum() {
  try {
    const ctx = getAudioContext();
    if (humOsc) return; // Already running

    humOsc = ctx.createOscillator();
    humGain = ctx.createGain();
    lfoOsc = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    humOsc.type = "sine";
    humOsc.frequency.setValueAtTime(85, ctx.currentTime); // Low 85Hz bass hum

    lfoOsc.frequency.setValueAtTime(1.5, ctx.currentTime); // 1.5Hz pulsation
    lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);

    lfoOsc.connect(lfoGain);
    lfoGain.connect(humGain.gain);

    humOsc.connect(humGain);
    humGain.connect(ctx.destination);

    humGain.gain.setValueAtTime(0.08, ctx.currentTime); // Low level background hum

    lfoOsc.start();
    humOsc.start();
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function stopWatchHum() {
  try {
    if (humOsc) {
      humOsc.stop();
      humOsc.disconnect();
      humOsc = null;
    }
    if (lfoOsc) {
      lfoOsc.stop();
      lfoOsc.disconnect();
      lfoOsc = null;
    }
    if (humGain) {
      humGain.disconnect();
      humGain = null;
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playClockTick(isFast = false) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(isFast ? 1000 : 700, ctx.currentTime);
    
    gain.gain.setValueAtTime(isFast ? 0.2 : 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playCorrect() {
  try {
    const ctx = getAudioContext();
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playIncorrect() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playGlitch() {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playWhoosh() {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 0.7;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(100, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.3);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.7);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.75);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playVictory() {
  try {
    const ctx = getAudioContext();
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.4);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.45);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playDefeat() {
  try {
    const ctx = getAudioContext();
    const notes = [146.83, 174.61, 220.00]; // D3, F3, A3 (D Minor triad)
    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq * 0.85, ctx.currentTime + 1.4);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, ctx.currentTime);

      osc.disconnect();
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

/**
 * Countdown beep — distinct pitch for each second.
 * count=3 → high beep, count=2 → mid beep, count=1 → low beep, count=0 → GO fanfare
 */
export function playCountdownBeep(count) {
  try {
    const ctx = getAudioContext();

    if (count === 0) {
      // Gentle, soft "GO" notification chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.12); // Sweep up to C6
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      return;
    }

    // Soft, short C5 beeps instead of piercing high pitches
    const freq = 440; // A4 (soft hum)

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.04, ctx.currentTime); // Soft volume (0.04 instead of 0.18)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); // Short duration

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

let bgMusicInterval = null;
let bgMusicNodes = [];
let isMusicPlaying = false;
let bgGainNode = null;
let activeProfileIdx = 0;
const baseMusicVolume = 0.22; // Louder, clear study focus volume as requested

export const MUSIC_PROFILES = [
  { id: "lofi", name: "Lofi Study", desc: "Warm ambient pads and focus bells" },
  { id: "cyber", name: "Cyber Horizon", desc: "Retro minor synthwave chords" },
  { id: "zen", name: "Zen Garden", desc: "Peaceful sine drones and healing chimes" },
  { id: "space", name: "Nebula Drone", desc: "Deep space low-frequency hum" },
  { id: "pixel", name: "Retro Pixel", desc: "8-bit chiptune square synths" },
  { id: "techno", name: "Chronos Focus", desc: "Calm procedural pulse beats" },
  { id: "phonk", name: "Phonk Drift", desc: "Heavy distorted bass and hype cowbells" },
  { id: "metal", name: "Industrial Metal", desc: "Crushing drums and distorted power chords" },
  { id: "rock", name: "Arena Rock", desc: "Stomp-clap beat and driving lead solo" }
];

const PROFILE_CONFIGS = {
  0: { // Lofi Study (A minor)
    chords: [
      [110.00, 220.00, 261.63, 329.63, 392.00], // Am7
      [87.31, 174.61, 220.00, 261.63, 329.63], // Fmaj7
      [65.41, 130.81, 196.00, 261.63, 329.63], // Cmaj7
      [82.41, 164.81, 196.00, 246.94, 293.66]  // Em7
    ],
    arpNotes: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00],
    oscType: "triangle",
    cutoff: 350,
    interval: 6000,
    arpChance: 0.4,
    arpType: "sine",
    gainMult: 1.0
  },
  1: { // Cyber Horizon (D minor synthwave)
    chords: [
      [73.42, 146.83, 174.61, 220.00, 261.63], // Dm7
      [58.27, 116.54, 174.61, 220.00, 293.66], // Bbmaj7
      [65.41, 130.81, 196.00, 233.08, 329.63], // C7
      [110.00, 220.00, 246.94, 293.66, 392.00] // Am7
    ],
    arpNotes: [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00, 523.25, 587.33],
    oscType: "sawtooth",
    cutoff: 280,
    interval: 5000,
    arpChance: 0.45,
    arpType: "triangle",
    gainMult: 0.75 // Sawtooth is louder
  },
  2: { // Zen Garden (G major chimes)
    chords: [
      [65.41, 130.81, 196.00, 261.63, 329.63], // Cmaj7
      [98.00, 196.00, 293.66, 392.00, 440.00], // Gsus4
      [87.31, 174.61, 220.00, 261.63, 329.63], // Fmaj7
      [98.00, 146.83, 220.00, 293.66, 392.00]  // G6
    ],
    arpNotes: [392.00, 440.00, 493.88, 587.33, 659.25, 783.99, 880.00, 987.77, 1174.66, 1318.51],
    oscType: "sine",
    cutoff: 400,
    interval: 8000,
    arpChance: 0.35,
    arpType: "sine",
    gainMult: 1.4 // Sine pads need higher gain
  },
  3: { // Nebula Drone (Deep Space lowpass)
    chords: [
      [82.41, 123.47, 164.81, 196.00, 293.66], // Em9
      [65.41, 130.81, 196.00, 246.94, 329.63], // Cmaj9
      [110.00, 165.00, 220.00, 261.63, 392.00], // Am9
      [61.74, 123.47, 185.00, 220.00, 311.13]  // B7b9
    ],
    arpNotes: [82.41, 110.00, 123.47, 146.83, 164.81, 196.00, 220.00, 246.94, 293.66, 329.63],
    oscType: "triangle",
    cutoff: 170, // low cutoff
    interval: 7000,
    arpChance: 0.2, // sparse
    arpType: "sine",
    gainMult: 1.2
  },
  4: { // Retro Pixel (8-bit square synths)
    chords: [
      [130.81, 164.81, 196.00], // C
      [98.00, 146.83, 196.00],  // G
      [110.00, 130.81, 164.81], // Am
      [87.31, 130.81, 174.61]  // F
    ],
    arpNotes: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00],
    oscType: "triangle",
    cutoff: 800,
    interval: 4000,
    arpChance: 0.55,
    arpType: "square",
    gainMult: 0.45 // keep gain low for square wave
  },
  5: { // Chronos Focus (Ambient techno pulsing beats)
    chords: [
      [92.50, 185.00, 220.00, 277.18, 329.63], // F#m7
      [73.42, 146.83, 220.00, 277.18, 369.99], // Dmaj7
      [123.47, 246.94, 293.66, 369.99, 440.00], // Bm7
      [69.30, 138.59, 207.65, 246.94, 329.63]  // C#m7
    ],
    arpNotes: [185.00, 220.00, 246.94, 277.18, 329.63, 369.99, 440.00, 493.88, 554.37, 659.25, 739.99],
    oscType: "triangle",
    cutoff: 280,
    interval: 5000,
    arpChance: 0.4,
    arpType: "sine",
    gainMult: 1.0
  }
};

function makeDistortionCurve(amount) {
  const k = typeof amount === "number" ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function playSynthKick(ctx, time, outputNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(outputNode);
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
  
  gain.gain.setValueAtTime(0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  
  osc.start(time);
  osc.stop(time + 0.18);
  
  bgMusicNodes.push(osc);
}

function playSynthSnare(ctx, time, outputNode) {
  const bufferSize = ctx.sampleRate * 0.18;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(1000, time);
  noiseFilter.Q.setValueAtTime(1.5, time);
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(outputNode);
  
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
  
  oscGain.gain.setValueAtTime(0.15, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  
  osc.connect(oscGain);
  oscGain.connect(outputNode);
  
  noiseSource.start(time);
  noiseSource.stop(time + 0.2);
  osc.start(time);
  osc.stop(time + 0.12);
  
  bgMusicNodes.push(noiseSource);
  bgMusicNodes.push(osc);
}

function playSynthHihat(ctx, time, outputNode, isOpen = false) {
  const bufferSize = ctx.sampleRate * (isOpen ? 0.3 : 0.05);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(8000, time);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.05, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + (isOpen ? 0.28 : 0.04));
  
  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(outputNode);
  
  noiseSource.start(time);
  noiseSource.stop(time + (isOpen ? 0.35 : 0.08));
  
  bgMusicNodes.push(noiseSource);
}

function playSynthCowbell(ctx, time, freq, outputNode) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc1.type = "square";
  osc2.type = "square";
  
  osc1.frequency.setValueAtTime(freq, time);
  osc2.frequency.setValueAtTime(freq * 1.48, time);
  
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1200, time);
  filter.Q.setValueAtTime(2.5, time);
  
  gain.gain.setValueAtTime(0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(outputNode);
  
  osc1.start(time);
  osc1.stop(time + 0.2);
  osc2.start(time);
  osc2.stop(time + 0.2);
  
  bgMusicNodes.push(osc1);
  bgMusicNodes.push(osc2);
}

function playDistortedGuitar(ctx, time, freq1, freq2, duration, outputNode) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc1.type = "sawtooth";
  osc2.type = "sawtooth";
  
  osc1.frequency.setValueAtTime(freq1, time);
  osc2.frequency.setValueAtTime(freq2, time);
  
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, time);
  filter.Q.setValueAtTime(1.5, time);
  
  const distNode = ctx.createWaveShaper();
  distNode.curve = makeDistortionCurve(60);
  distNode.oversample = "4x";
  
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
  gain.gain.setValueAtTime(0.12, time + duration - 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(distNode);
  distNode.connect(gain);
  gain.connect(outputNode);
  
  osc1.start(time);
  osc1.stop(time + duration + 0.05);
  osc2.start(time);
  osc2.stop(time + duration + 0.05);
  
  bgMusicNodes.push(osc1);
  bgMusicNodes.push(osc2);
}

function playSoaringLead(ctx, time, freq, duration, outputNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq, time);
  
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.frequency.setValueAtTime(5.8, time);
  vibratoGain.gain.setValueAtTime(freq * 0.012, time);
  
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1300, time);
  filter.Q.setValueAtTime(1, time);
  
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.07, time + 0.04);
  gain.gain.setValueAtTime(0.07, time + duration - 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  
  const delay = ctx.createDelay();
  const feedback = ctx.createGain();
  delay.delayTime.setValueAtTime(0.32, time);
  feedback.gain.setValueAtTime(0.3, time);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(outputNode);
  
  gain.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(outputNode);
  
  vibrato.start(time);
  vibrato.stop(time + duration + 0.1);
  osc.start(time);
  osc.stop(time + duration + 0.1);
  
  bgMusicNodes.push(osc);
  bgMusicNodes.push(vibrato);
}

export function startBackgroundMusic(profileIdx = 0) {
  try {
    const ctx = getAudioContext();
    
    // If music is already playing but the profile has changed, stop and restart
    if (isMusicPlaying) {
      if (activeProfileIdx === profileIdx) return;
      stopBackgroundMusic();
    }
    
    isMusicPlaying = true;
    activeProfileIdx = profileIdx;
    
    // For rock / phonk profiles (6, 7, 8)
    if (profileIdx >= 6) {
      // Create master gain control
      bgGainNode = ctx.createGain();
      bgGainNode.gain.setValueAtTime(baseMusicVolume * 0.9, ctx.currentTime); // keep it loud and clear but avoid clipping
      bgGainNode.connect(ctx.destination);
      
      const playRockStep = (time) => {
        if (!isMusicPlaying) return;
        
        if (profileIdx === 6) {
          // --- PHONK DRIFT (BPM 125, 16 steps of 240ms, total loop = 3840ms) ---
          const stepSize = 0.24;
          
          // Drums
          const kickSteps = [0, 4, 8, 11, 12];
          kickSteps.forEach(s => playSynthKick(ctx, time + s * stepSize, bgGainNode));
          
          const snareSteps = [4, 12];
          snareSteps.forEach(s => playSynthSnare(ctx, time + s * stepSize, bgGainNode));
          
          for (let s = 0; s < 16; s += 2) {
            playSynthHihat(ctx, time + s * stepSize, bgGainNode, s % 4 === 2);
          }
          
          // Bassline (distorted saw bass)
          const bassFreqs = [41.2, 49.0, 55.0, 41.2];
          for (let s = 0; s < 16; s++) {
            if ([0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14].includes(s)) {
              const freq = bassFreqs[Math.floor(s / 4)];
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(freq, time + s * stepSize);
              
              if (s === 11 || s === 15) {
                osc.frequency.exponentialRampToValueAtTime(freq * 1.5, time + s * stepSize + 0.15);
              }
              
              gain.gain.setValueAtTime(0.001, time + s * stepSize);
              gain.gain.linearRampToValueAtTime(0.12, time + s * stepSize + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, time + s * stepSize + 0.2);
              
              const filter = ctx.createBiquadFilter();
              filter.type = "lowpass";
              filter.frequency.setValueAtTime(250, time + s * stepSize);
              
              osc.connect(filter);
              filter.connect(gain);
              gain.connect(bgGainNode);
              
              osc.start(time + s * stepSize);
              osc.stop(time + s * stepSize + 0.22);
              bgMusicNodes.push(osc);
            }
          }
          
          // Cowbell melody
          const cowbellNotes = [
            { step: 0, freq: 659.25 },
            { step: 3, freq: 783.99 },
            { step: 5, freq: 659.25 },
            { step: 8, freq: 880.00 },
            { step: 10, freq: 783.99 },
            { step: 11, freq: 659.25 },
            { step: 14, freq: 587.33 }
          ];
          cowbellNotes.forEach(n => {
            playSynthCowbell(ctx, time + n.step * stepSize, n.freq, bgGainNode);
          });
          
        } else if (profileIdx === 7) {
          // --- INDUSTRIAL METAL (BPM 135, 16 steps of 222.22ms, total loop = 3555.5ms) ---
          const stepSize = 0.2222;
          
          // Drums
          for (let s = 0; s < 16; s += 2) {
            playSynthKick(ctx, time + s * stepSize, bgGainNode);
          }
          
          const snareSteps = [4, 12];
          snareSteps.forEach(s => playSynthSnare(ctx, time + s * stepSize, bgGainNode));
          
          for (let s = 1; s < 16; s += 2) {
            if (s !== 4 && s !== 12) {
              playSynthHihat(ctx, time + s * stepSize, bgGainNode, false);
            }
          }
          
          // Heavy distorted guitar riffs
          const guitarRiff = [
            { step: 0, root: 73.42, fifth: 110.00, len: 1.5 },
            { step: 2, root: 73.42, fifth: 110.00, len: 0.8 },
            { step: 3, root: 73.42, fifth: 110.00, len: 0.8 },
            { step: 4, root: 87.31, fifth: 130.81, len: 1.8 },
            { step: 6, root: 87.31, fifth: 130.81, len: 0.8 },
            { step: 7, root: 87.31, fifth: 130.81, len: 0.8 },
            { step: 8, root: 98.00, fifth: 146.83, len: 1.8 },
            { step: 10, root: 98.00, fifth: 146.83, len: 0.8 },
            { step: 11, root: 98.00, fifth: 146.83, len: 0.8 },
            { step: 12, root: 73.42, fifth: 110.00, len: 1.8 },
            { step: 14, root: 65.41, fifth: 98.00, len: 0.8 },
            { step: 15, root: 69.30, fifth: 103.83, len: 0.8 }
          ];
          guitarRiff.forEach(g => {
            playDistortedGuitar(ctx, time + g.step * stepSize, g.root, g.fifth, g.len * stepSize, bgGainNode);
          });
          
        } else if (profileIdx === 8) {
          // --- ARENA ROCK (BPM 110, 16 steps of 272.73ms, total loop = 4363.6ms) ---
          const stepSize = 0.2727;
          
          // Drums
          const kickSteps = [0, 1, 4, 5, 8, 9, 12, 13];
          kickSteps.forEach(s => playSynthKick(ctx, time + s * stepSize, bgGainNode));
          
          const snareSteps = [2, 6, 10, 14];
          snareSteps.forEach(s => playSynthSnare(ctx, time + s * stepSize, bgGainNode));
          
          const openHats = [3, 7, 11, 15];
          openHats.forEach(s => playSynthHihat(ctx, time + s * stepSize, bgGainNode, true));
          
          // Bassline (Driving 8th notes)
          const bassFreqs = [82.41, 98.00, 110.00, 82.41];
          for (let s = 0; s < 16; s++) {
            const freq = bassFreqs[Math.floor(s / 4)];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, time + s * stepSize);
            
            gain.gain.setValueAtTime(0.001, time + s * stepSize);
            gain.gain.linearRampToValueAtTime(0.12, time + s * stepSize + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + s * stepSize + stepSize * 0.9);
            
            osc.connect(gain);
            gain.connect(bgGainNode);
            osc.start(time + s * stepSize);
            osc.stop(time + s * stepSize + stepSize);
            bgMusicNodes.push(osc);
          }
          
          // Soaring Lead Solo
          const soloNotes = [
            { step: 0, freq: 329.63, len: 1.8 },
            { step: 2, freq: 392.00, len: 1.8 },
            { step: 4, freq: 440.00, len: 2.8 },
            { step: 7, freq: 493.88, len: 0.8 },
            { step: 8, freq: 440.00, len: 1.8 },
            { step: 10, freq: 392.00, len: 1.8 },
            { step: 12, freq: 329.63, len: 3.5 }
          ];
          soloNotes.forEach(n => {
            playSoaringLead(ctx, time + n.step * stepSize, n.freq, n.len * stepSize, bgGainNode);
          });
        }
      };
      
      const bufferTime = 0.15;
      playRockStep(ctx.currentTime + bufferTime);
      
      const loopInterval = profileIdx === 6 ? 3840 : (profileIdx === 7 ? 3555 : 4363);
      
      bgMusicInterval = setInterval(() => {
        if (isMusicPlaying) {
          playRockStep(ctx.currentTime + bufferTime);
        }
        if (bgMusicNodes.length > 80) {
          bgMusicNodes = bgMusicNodes.slice(-25);
        }
      }, loopInterval);
      
      return;
    }

    const cfg = PROFILE_CONFIGS[profileIdx] || PROFILE_CONFIGS[0];
    
    // Create master gain control for the ambient background loop
    bgGainNode = ctx.createGain();
    bgGainNode.gain.setValueAtTime(baseMusicVolume * cfg.gainMult, ctx.currentTime);
    bgGainNode.connect(ctx.destination);
    
    let currentChordIdx = 0;
    
    const playChordStep = (time) => {
      if (!isMusicPlaying) return;
      
      const chord = cfg.chords[currentChordIdx];
      currentChordIdx = (currentChordIdx + 1) % cfg.chords.length;
      
      // Warm low-pass filter
      const chordFilter = ctx.createBiquadFilter();
      chordFilter.type = "lowpass";
      chordFilter.frequency.setValueAtTime(cfg.cutoff, time);
      chordFilter.Q.setValueAtTime(1, time);
      chordFilter.connect(bgGainNode);

      // Play soft synthesized pads
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = cfg.oscType;
        osc.frequency.setValueAtTime(freq, time);
        
        const detuneAmt = (Math.random() - 0.5) * 12; // +/- 6 cents
        osc.detune.setValueAtTime(detuneAmt, time);

        // Slow attack and release envelopes proportional to interval length
        const transitionSec = (cfg.interval / 1000) / 3;
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.12 / chord.length, time + transitionSec);
        gain.gain.setValueAtTime(0.12 / chord.length, time + (cfg.interval / 1000) - transitionSec);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (cfg.interval / 1000) + 0.5);
        
        osc.connect(gain);
        gain.connect(chordFilter);
        
        osc.start(time);
        osc.stop(time + (cfg.interval / 1000) + 0.8);
        
        bgMusicNodes.push(osc);
      });

      // Ambient chimes / clicks / pulses scheduler
      const steps = 8;
      const stepDuration = (cfg.interval / 1000) / steps;
      for (let s = 0; s < steps; s++) {
        if (Math.random() < cfg.arpChance) {
          const arpTime = time + s * stepDuration;
          const noteFreq = cfg.arpNotes[Math.floor(Math.random() * cfg.arpNotes.length)];
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const delay = ctx.createDelay();
          const feedback = ctx.createGain();
          
          osc.type = cfg.arpType;
          osc.frequency.setValueAtTime(noteFreq, arpTime);
          
          gain.gain.setValueAtTime(0.001, arpTime);
          gain.gain.linearRampToValueAtTime(0.025, arpTime + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, arpTime + 1.5);
          
          // Delay loop parameters
          delay.delayTime.setValueAtTime(0.35, arpTime);
          feedback.gain.setValueAtTime(0.28, arpTime);
          
          osc.connect(gain);
          gain.connect(bgGainNode);
          
          // Feedback Loop
          gain.connect(delay);
          delay.connect(feedback);
          feedback.connect(delay);
          delay.connect(bgGainNode);
          
          osc.start(arpTime);
          osc.stop(arpTime + 2.5);
          
          bgMusicNodes.push(osc);
        }
      }
    };
    
    const bufferTime = 0.15;
    playChordStep(ctx.currentTime + bufferTime);
    
    bgMusicInterval = setInterval(() => {
      if (isMusicPlaying) {
        playChordStep(ctx.currentTime + bufferTime);
      }
      if (bgMusicNodes.length > 80) {
        bgMusicNodes = bgMusicNodes.slice(-25);
      }
    }, cfg.interval);

  } catch (e) {
    console.error("BG Music error:", e);
  }
}

export function stopBackgroundMusic() {
  try {
    isMusicPlaying = false;
    if (bgMusicInterval) {
      clearInterval(bgMusicInterval);
      bgMusicInterval = null;
    }
    bgMusicNodes.forEach((node) => {
      try {
        node.stop();
      } catch (err) {}
    });
    bgMusicNodes = [];
    if (bgGainNode) {
      bgGainNode.disconnect();
      bgGainNode = null;
    }
  } catch (e) {
    console.error("Stop BG Music error:", e);
  }
}

export function playLevelUp() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C5, E5, G5, C6, E6, G6, C7
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.35);

      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.4);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playError() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.setValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio error:", e);
  }
}



