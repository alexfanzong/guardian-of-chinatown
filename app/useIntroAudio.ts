import {useCallback, useEffect, useRef, useState} from 'react';
import score from './comic/street-score.mp3?inline';

const shotSeconds = 3;
type PlayingSource = {source: AudioBufferSourceNode; gain: GainNode};

function fadeOut(player: PlayingSource | null, duration = .045) {
  if (!player) return;
  const t = player.gain.context.currentTime;
  player.gain.gain.cancelScheduledValues(t);
  player.gain.gain.setValueAtTime(player.gain.gain.value, t);
  player.gain.gain.linearRampToValueAtTime(0, t + duration);
  try { player.source.stop(t + duration); } catch { /* The shot may already have ended. */ }
}

export function useIntroAudio(page: number, playing: boolean, leaving: boolean, onSoundChoice?: (enabled: boolean) => void) {
  const [soundOn, setSoundOn] = useState(false);
  const enabled = useRef(false);
  const context = useRef<AudioContext | null>(null);
  const buffer = useRef<Promise<AudioBuffer> | null>(null);
  const current = useRef<PlayingSource | null>(null);
  const position = useRef({page: -1, elapsed: 0});
  const notify = useRef(onSoundChoice);
  notify.current = onSoundChoice;

  const toggleSound = useCallback(() => {
    if (enabled.current) {
      enabled.current = false;
      fadeOut(current.current);
      current.current = null;
      setSoundOn(false);
      notify.current?.(false);
      return;
    }
    const Audio = window.AudioContext || (window as Window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!Audio) return;
    try {
      const ctx = context.current ?? new Audio();
      context.current = ctx;
      enabled.current = true;
      // Unlock output in the click handler, before waiting for local MP3 decode.
      const unlocking = ctx.resume();
      if (!buffer.current) buffer.current = fetch(score)
        .then(response => response.arrayBuffer()).then(data => ctx.decodeAudioData(data));
      Promise.all([unlocking, buffer.current]).catch(() => {
        if (context.current !== ctx) return;
        buffer.current = null;
        enabled.current = false;
        setSoundOn(false);
        notify.current?.(false);
      });
      position.current = {page: -1, elapsed: 0};
      setSoundOn(true);
      notify.current?.(true);
    } catch {
      enabled.current = false;
      setSoundOn(false);
    }
  }, []);

  useEffect(() => {
    const ctx = context.current;
    if (position.current.page !== page) position.current = {page, elapsed: 0};
    if (!soundOn || !ctx || !playing || leaving || !buffer.current) return;
    const clock = position.current;
    const start = performance.now();
    let valid = true;
    let active: PlayingSource | null = null;
    buffer.current.then(data => {
      if (!valid || !enabled.current || document.hidden) return;
      const offset = page * shotSeconds + clock.elapsed + (performance.now() - start) / 1000;
      const end = page === 3 ? data.duration : (page + 1) * shotSeconds;
      if (offset >= end) return;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = data;
      source.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(.87, ctx.currentTime + .025);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (current.current?.source === source) current.current = null;
      };
      active = {source, gain};
      current.current = active;
      source.start(0, offset, end - offset);
    }).catch(() => {});
    return () => {
      valid = false;
      clock.elapsed += (performance.now() - start) / 1000;
      if (current.current === active) {
        fadeOut(active);
        current.current = null;
      }
    };
  }, [page, playing, leaving, soundOn]);

  useEffect(() => () => {
    enabled.current = false;
    fadeOut(current.current);
    const ctx = context.current;
    context.current = null;
    if (ctx) void ctx.close().catch(() => {});
  }, []);

  return {soundOn, toggleSound};
}
