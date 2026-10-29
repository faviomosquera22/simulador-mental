'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Audio starts in the button's user gesture; the same elements are reused across moments. */
export function useSoundscape(caseId: string, phase: string, paused: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [includeVoice, setIncludeVoice] = useState(true);
  const [volume, setVolume] = useState(.55);
  const [error, setError] = useState('');
  const ambience = useRef<HTMLAudioElement | null>(null);
  const voice = useRef<HTMLAudioElement | null>(null);
  const requested = useRef(false);
  const live = useRef({ caseId, phase, paused, volume, includeVoice });
  const narrating = useRef(false);
  useEffect(() => { live.current = { caseId, phase, paused, volume, includeVoice }; }, [caseId, phase, paused, volume, includeVoice]);

  const applyVolume = useCallback(() => {
    if (ambience.current) ambience.current.volume = live.current.volume * (narrating.current ? .38 : 1);
    if (voice.current) voice.current.volume = Math.min(1, live.current.volume * 1.25);
  }, []);
  const stop = useCallback(() => {
    requested.current = false;
    ambience.current?.pause(); voice.current?.pause();
    if (ambience.current) ambience.current.currentTime = 0;
    if (voice.current) voice.current.currentTime = 0;
    narrating.current = false; setEnabled(false); setPlaying(false); setVoicePlaying(false);
  }, []);
  const handleFailure = useCallback((reason: unknown) => {
    if (!requested.current || (reason instanceof DOMException && reason.name === 'AbortError')) return;
    setError('No se pudo reproducir el audio. Pulsa Activar sonido para volver a intentarlo.');
    stop();
  }, [stop]);
  const getAmbience = useCallback(() => {
    if (!ambience.current) {
      const element = new Audio(); element.preload = 'auto'; element.loop = true;
      element.dataset.brainAudio = 'ambience';
      element.onplaying = () => { if (requested.current) setPlaying(true); };
      element.onpause = () => setPlaying(false);
      element.onwaiting = () => setPlaying(false);
      element.onerror = () => handleFailure(element.error);
      ambience.current = element;
    }
    return ambience.current;
  }, [handleFailure]);
  const playVoice = useCallback((restart = false) => {
    if (!live.current.includeVoice || !requested.current || live.current.paused) return;
    if (!voice.current) {
      const element = new Audio(); element.preload = 'auto'; element.dataset.brainAudio = 'voice';
      element.onplaying = () => { narrating.current = true; setVoicePlaying(true); applyVolume(); };
      const finish = () => { narrating.current = false; setVoicePlaying(false); applyVolume(); };
      element.onended = finish; element.onpause = finish;
      element.onerror = () => { finish(); setError('La voz no está disponible; el ambiente continúa.'); };
      voice.current = element;
    }
    const element = voice.current;
    const url = `/brain-explorer/audio/${live.current.caseId}-${live.current.phase}-voice.wav`;
    const changed = !element.src.endsWith(url);
    if (changed) element.src = url;
    if (restart) element.currentTime = 0;
    if (!changed && element.ended && !restart) return;
    applyVolume();
    void element.play().catch(reason => { if (reason?.name !== 'AbortError') { narrating.current = false; setVoicePlaying(false); applyVolume(); setError('El ambiente está disponible. Pulsa Repetir voz para escuchar al personaje.'); } });
  }, [applyVolume]);
  const play = useCallback((restart = false) => {
    if (!requested.current || live.current.paused) return;
    const element = getAmbience();
    const url = `/brain-explorer/audio/${live.current.caseId}-${live.current.phase}.wav`;
    if (!element.src.endsWith(url)) element.src = url;
    if (restart) element.currentTime = 0;
    applyVolume();
    // This is called synchronously by toggle() on first activation, including on mobile.
    void element.play().catch(handleFailure);
    playVoice(restart);
  }, [applyVolume, getAmbience, handleFailure, playVoice]);
  const toggle = useCallback(() => {
    setError('');
    if (requested.current) { stop(); return; }
    requested.current = true; setEnabled(true); play(true);
  }, [play, stop]);

  useEffect(() => {
    if (!requested.current) return;
    if (paused) { ambience.current?.pause(); voice.current?.pause(); }
    else play();
  }, [caseId, phase, paused, play]);
  useEffect(() => { applyVolume(); }, [volume, applyVolume]);
  useEffect(() => {
    if (!requested.current) return;
    if (includeVoice) playVoice(true);
    else { voice.current?.pause(); narrating.current = false; setVoicePlaying(false); applyVolume(); }
  }, [includeVoice, playVoice, applyVolume]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) stop(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') stop(); };
    document.addEventListener('visibilitychange', hidden); window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('visibilitychange', hidden); window.removeEventListener('keydown', escape);
      for (const element of [ambience.current, voice.current]) if (element) { element.onplaying = null; element.onpause = null; element.onended = null; element.onerror = null; element.onwaiting = null; element.pause(); element.removeAttribute('src'); element.load(); }
    };
  }, [stop]);
  return { enabled, playing, voicePlaying, toggle, stop, volume, setVolume, includeVoice, setIncludeVoice, repeatVoice: () => { setError(''); playVoice(true); }, error };
}
