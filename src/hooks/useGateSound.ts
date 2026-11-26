import { useRef } from 'react';

export function useGateSound(enabled: { current: boolean }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    try {
      if (!ctxRef.current) {
        const C = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!C) return null;
        ctxRef.current = new C();
      }
      if (ctxRef.current!.state === 'suspended') ctxRef.current!.resume();
      return ctxRef.current;
    } catch (e) {
      return null;
    }
  };
  const tone = (c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  };
  const play = (fn: (c: AudioContext) => void) => {
    if (!enabled.current) return;
    const c = getCtx();
    if (c) {
      try {
        fn(c);
      } catch (e) {
        /* sin audio */
      }
    }
  };
  return {
    success: () =>
      play((c) => {
        tone(c, 660, 0, 0.16, 'sine', 0.12);
        tone(c, 880, 0.12, 0.26, 'sine', 0.12);
      }),
    error: () =>
      play((c) => {
        tone(c, 220, 0, 0.18, 'square', 0.07);
        tone(c, 220, 0.26, 0.28, 'square', 0.07);
      }),
    alarm: () =>
      play((c) => {
        for (let i = 0; i < 4; i++) tone(c, i % 2 ? 520 : 780, i * 0.2, 0.18, 'sawtooth', 0.07);
      }),
    unlock: () =>
      play((c) => {
        tone(c, 520, 0, 0.12, 'sine', 0.08);
      }),
  };
}
