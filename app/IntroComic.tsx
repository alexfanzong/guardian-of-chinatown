import {useCallback, useEffect, useRef, useState, type SyntheticEvent} from 'react';
import {comicPanels, type ComicLanguage} from './comic-art';
import {comicPlates} from './comic-plates';
import {Atmosphere, CinematicPlate, frameSize, MobileLettering, warmCut, warmPlate} from './comic/CinematicPlate';
import {EntranceCels} from './comic/EntranceCels';
import {useIntroAudio} from './useIntroAudio';
import './intro-comic.css';

type Props = {
  onStart: () => void;
  onSoundChoice?: (enabled: boolean) => void;
  lang?: ComicLanguage;
  onLang?: (language: ComicLanguage) => void;
};

const LAST = comicPanels.length - 1;
const PANEL_TIME = 3000;
const EXIT_TIME = 620;
const CUT_TIME = 500;
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersLessMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(MOTION_QUERY).matches);
}

export function IntroComic({onStart, onSoundChoice}: Props) {
  const [page, setPage] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [reduced, setReduced] = useState(prefersLessMotion);
  const [autoChoice, setAutoChoice] = useState<boolean | null>(null);
  const [readingCaption, setReadingCaption] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const [stillPage, setStillPage] = useState(hidden ? 0 : -1);
  const [soundBeat, setSoundBeat] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [imageResult, setImageResult] = useState<{id: string; ok: boolean; layered: boolean} | null>(null);
  const pageRef = useRef(0);
  const exiting = useRef(false);
  const fadeTimer = useRef<number | undefined>(undefined);
  const latestStart = useRef(onStart);

  const panel = comicPanels[page];
  const src = comicPlates[panel.id];
  const final = page === LAST;
  const automatic = autoChoice ?? !reduced;
  const pageName = `Panel ${page + 1} of ${comicPanels.length}`;
  const loaded = Boolean(src && imageResult?.id === panel.id && imageResult.ok);
  const fallback = !src || (imageResult?.id === panel.id && !imageResult.ok);
  const readyToRead = loaded || fallback;
  const showCaption = fallback || readingCaption;
  const rendition = fallback ? 'fallback' : loaded ? 'inked' : 'loading';
  const playInk = loaded && !reduced && automatic && !readingCaption && stillPage !== page;
  const audioPlaying = readyToRead && !readingCaption && !hidden && autoChoice !== false;
  const acceptSoundChoice = useCallback((enabled: boolean) => {
    if (enabled) {
      setPrevious(null);
      if (automatic && !readingCaption && !hidden) setStillPage(-1);
      setSoundBeat(beat => beat + 1);
    }
    onSoundChoice?.(enabled);
  }, [automatic, readingCaption, hidden, onSoundChoice]);
  const {soundOn, toggleSound} = useIntroAudio(page, audioPlaying, leaving, acceptSoundChoice);

  useEffect(() => { latestStart.current = onStart; }, [onStart]);
  useEffect(() => () => window.clearTimeout(fadeTimer.current), []);
  useEffect(() => {
    const query = window.matchMedia?.(MOTION_QUERY);
    if (!query) return;
    const change = () => {
      setReduced(query.matches);
      setAutoChoice(null);
      if (query.matches) setStillPage(pageRef.current);
    };
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const stillWhenHidden = () => {
      setHidden(document.hidden);
      if (document.hidden) setStillPage(pageRef.current);
    };
    document.addEventListener('visibilitychange', stillWhenHidden);
    return () => document.removeEventListener('visibilitychange', stillWhenHidden);
  }, []);

  useEffect(() => {
    if (!readyToRead || final) return;
    const next = comicPanels[page + 1].id;
    void warmPlate(comicPlates[next]);
    void warmCut(next);
  }, [page, final, readyToRead]);

  useEffect(() => {
    if (!readyToRead || previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), reduced ? 0 : CUT_TIME);
    return () => window.clearTimeout(timer);
  }, [page, previous, readyToRead, reduced]);

  function recordImage(ok: boolean, layered = false) {
    if (pageRef.current === page && !exiting.current) setImageResult({id: panel.id, ok, layered});
  }

  async function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const image = e.currentTarget;
    if (!image.naturalWidth || !image.naturalHeight) { recordImage(false); return; }
    const base = typeof image.decode === 'function' ? image.decode().then(() => true, () => false) : Promise.resolve(true);
    const [ok, layered] = await Promise.all([base, reduced ? Promise.resolve(false) : warmCut(panel.id)]);
    recordImage(ok, layered);
  }

  function toggleAuto() {
    if (automatic) setStillPage(page);
    setAutoChoice(!automatic);
  }

  function toggleCaption() {
    if (!readingCaption) setStillPage(page);
    setReadingCaption(!readingCaption);
  }

  const turn = useCallback((from: number) => {
    if (exiting.current || from !== pageRef.current || from >= LAST) return;
    pageRef.current = from + 1;
    setPrevious(reduced ? null : from);
    setReadingCaption(false);
    setPage(from + 1);
  }, [reduced]);

  const enter = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    setLeaving(true);
    if (reduced) latestStart.current();
    else fadeTimer.current = window.setTimeout(() => latestStart.current(), EXIT_TIME);
  }, [reduced]);

  useEffect(() => {
    if (!readyToRead || final || !automatic || readingCaption || leaving) return;
    let timer: number | undefined;
    let remaining = PANEL_TIME;
    let started = 0;
    function updateVisibility() {
      if (document.hidden) {
        if (timer !== undefined) {
          window.clearTimeout(timer);
          remaining = Math.max(0, remaining - (performance.now() - started));
          timer = undefined;
        }
      } else if (timer === undefined) {
        started = performance.now();
        timer = window.setTimeout(() => {
          timer = undefined;
          if (!document.hidden) turn(page);
        }, remaining);
      }
    }
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, [page, soundBeat, readyToRead, automatic, readingCaption, final, leaving, turn]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key !== 'Escape' && e.key !== ' ' && e.key !== 'Enter') return;
      if (e.repeat || exiting.current) { e.preventDefault(); return; }
      if (e.key !== 'Escape' && e.target instanceof Element &&
          e.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape' || final) enter();
      else turn(page);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, final, turn, enter]);

  const lastPanel = previous === null ? null : comicPanels[previous];

  return <main className={`gc-intro${leaving ? ' gc-leaving' : ''}`} lang="en" aria-label="Opening comic"
    data-comic-panel={page + 1} data-comic-rendition={rendition} data-art-loaded={loaded}
    data-caption-open={showCaption} data-motion-level={playInk ? 'cinema' : 'still'} data-exit={leaving ? 'blackout' : 'open'}
    data-sound-enabled={soundOn} data-opening-beat={soundBeat}>
    <div className="gc-sheet">
      <div className="gc-projector">
        {lastPanel && <div aria-hidden="true" className="gc-departing" data-view="cinema" data-scene={lastPanel.id}>
          <div className="gc-camera-field">
            <div className="gc-illustration" data-plate={lastPanel.id}
              style={{aspectRatio: frameSize[lastPanel.id].join(' / ')}}>
              <img className="gc-outgoing-art" src={comicPlates[lastPanel.id]} alt=""/>
            </div>
            <MobileLettering id={lastPanel.id} src={comicPlates[lastPanel.id]}/>
          </div>
        </div>}
        <div key={`${panel.id}-${soundBeat}`} className="gc-current" data-scene={panel.id} data-view={playInk ? 'cinema' : 'still'}
          data-ready={readyToRead} data-cut={Boolean(lastPanel && readyToRead && playInk)}>
          <figure className="gc-frame" aria-label={pageName}>
            <div className="gc-camera-field">
              {fallback ? <div className="gc-fallback" role="img" aria-label={panel.description}><panel.Art/></div> :
                <CinematicPlate id={panel.id} src={src} description={panel.description} loaded={loaded}
                  layered={Boolean(imageResult?.layered && loaded)} moving={playInk}
                  onLoad={onImageLoad} onError={() => recordImage(false)}/>}
              {playInk && <MobileLettering id={panel.id} src={src}/>}
            </div>
            {playInk && <Atmosphere id={panel.id}/>}
            {playInk && (panel.id === 'crash' || panel.id === 'roof') && <EntranceCels scene={panel.id}/>}
            <figcaption id="gc-panel-caption" className={showCaption ? 'gc-caption' : 'gc-reader-only'} aria-live="polite" aria-atomic="true">
              <span className="gc-reader-only">{pageName}. </span>
              {final ? <h1>{panel.caption}</h1> : <p>{panel.caption}</p>}
            </figcaption>
          </figure>
        </div>
        {!final && <button className="gc-turn" type="button" disabled={leaving}
          aria-label="Next panel" onClick={() => turn(page)}/>}
      </div>

      <header className="gc-mast">
        <div className="gc-folio" role="progressbar" aria-label="Comic panel" aria-valuemin={1}
          aria-valuemax={comicPanels.length} aria-valuenow={page + 1} aria-valuetext={pageName}>
          <span aria-hidden="true">{page + 1} <i>/</i> {comicPanels.length}</span>
        </div>
        <div className="gc-tools">
          <button type="button" className="gc-sound" disabled={leaving} aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute opening sound' : 'Play with sound'} onClick={toggleSound}>
            {soundOn ? 'Mute' : page === 0 ? 'Play with sound' : 'Enable sound'}
          </button>
          {!final && <button type="button" className="gc-auto" disabled={leaving}
            aria-label={automatic ? 'Pause automatic panel turns' : 'Resume automatic panel turns'}
            onClick={toggleAuto}>{automatic ? 'Pause' : 'Auto'}</button>}
          <button type="button" className="gc-skip" disabled={leaving} aria-label="Skip opening comic and play"
            onClick={enter}>Skip <span aria-hidden="true">&gt;&gt;</span></button>
        </div>
      </header>

      {final ? <div className="gc-brief">
        <p><kbd>A</kbd>/<kbd>D</kbd> or tap to punch. Hit the open side.
          Third eye open? Dodge with either side.</p>
        <button className="gc-enter" type="button" disabled={leaving} aria-label="Play — enter the street" onClick={enter}>
          Enter the street <span aria-hidden="true">&gt;</span>
        </button>
      </div> : <div className="gc-reader">
        <span>Tap / Space / Enter</span>
        {!fallback && <button type="button" className="gc-caption-toggle" disabled={leaving}
          aria-expanded={readingCaption} aria-controls="gc-panel-caption" onClick={toggleCaption}>
          {readingCaption ? 'Close caption' : 'Read caption'}
        </button>}
      </div>}
    </div>
    <div className="gc-blackout" aria-hidden="true"/>
  </main>;
}
