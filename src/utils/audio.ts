import { Ringtone } from '../types';

export const RINGTONES: Ringtone[] = [
  {
    id: 'celestial',
    name: 'Celestial Peace Bells',
    description: 'Chiming bells cascading at high frequencies for a transcendent morning reminder.',
    frequencies: [523.25, 659.25, 783.99, 987.77, 1046.50], // C5, E5, G5, B5, C6
    tempo: 400,
  },
  {
    id: 'dawn',
    name: 'Dawn Sufi Resonance',
    description: 'An evocative warm ambient wind instrument melody, perfect for soothing awakenings.',
    frequencies: [293.66, 349.23, 440.00, 523.25, 587.33], // D4, F4, A4, C5, D5
    tempo: 500,
  },
  {
    id: 'harmony',
    name: 'Sacred Harmony Sweep',
    description: 'A deep relaxing chord sweep with soft frequencies mimicking natural birds and dawn breeze.',
    frequencies: [329.63, 392.00, 493.88, 587.33, 659.25], // E4, G4, B4, D5, E5
    tempo: 600,
  },
  {
    id: 'strict',
    name: 'Strict Digital Alert',
    description: 'High-pitch periodic urgent alert to guarantee you never snooze past your prayer times!',
    frequencies: [880.00, 880.00, 440.00, 880.00], // A5, A5, A4, A5
    tempo: 200,
  }
];

let audioContext: AudioContext | null = null;
let activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
let alarmIntervalId: NodeJS.Timeout | number | null = null;

function getAudioContext() {
  if (!audioContext) {
    // Standard AudioContext initialization, fall back to webkit if needed
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Preview a ringtone once by playing its melody sequence
 */
export async function testRingtone(ringtoneId: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const ringtone = RINGTONES.find(r => r.id === ringtoneId) || RINGTONES[0];
    const { frequencies, tempo } = ringtone;

    // Stop former oscillators if any
    stopAudio();

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Configure oscillator type based on ringtone id
      if (ringtone.id === 'dawn') {
        osc.type = 'triangle';
      } else if (ringtone.id === 'harmony') {
        osc.type = 'sine';
      } else if (ringtone.id === 'strict') {
        osc.type = 'sawtooth';
      } else {
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * tempo) / 1000);

      // Soft envelope
      const startTime = ctx.currentTime + (idx * tempo) / 1000;
      const duration = tempo / 1000;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);

      activeOscillators.push({ osc, gain: gainNode });
    });
  } catch (error) {
    console.error('Failed to play ringtone preview:', error);
  }
}

/**
 * Play a looping alarm melody which simulates an active ringtone
 */
export function startAlarmAudio(ringtoneId: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const ringtone = RINGTONES.find(r => r.id === ringtoneId) || RINGTONES[0];
    const { frequencies, tempo } = ringtone;

    stopAudio();

    const playCycle = () => {
      const cycleCtx = getAudioContext();
      if (!cycleCtx) return;
      
      frequencies.forEach((freq, idx) => {
        const osc = cycleCtx.createOscillator();
        const gainNode = cycleCtx.createGain();

        if (ringtone.id === 'dawn') {
          osc.type = 'triangle';
        } else if (ringtone.id === 'harmony') {
          osc.type = 'sine';
        } else if (ringtone.id === 'strict') {
          osc.type = 'square';
        } else {
          osc.type = 'sine';
        }

        osc.frequency.setValueAtTime(freq, cycleCtx.currentTime + (idx * tempo) / 1000);

        const startTime = cycleCtx.currentTime + (idx * tempo) / 1000;
        const duration = (tempo * 1.5) / 1000;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(cycleCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);

        activeOscillators.push({ osc, gain: gainNode });
      });
    };

    // Play immediately
    playCycle();

    // Loop every length of melody + gap
    const intervalDuration = frequencies.length * tempo + 600;
    alarmIntervalId = setInterval(playCycle, intervalDuration);
  } catch (error) {
    console.error('Failed to play active alarm audio:', error);
  }
}

/**
 * Stop any current audio and clear variables completely
 */
export function stopAudio() {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }

  activeOscillators.forEach(({ osc, gain }) => {
    try {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    } catch (e) {
      // If already stopped
    }
  });
  activeOscillators = [];
}
