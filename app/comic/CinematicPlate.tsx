import {useId, type CSSProperties, type SyntheticEvent} from 'react';
import {motionCuts} from '../comic-motion-plates';

export const frameSize: Record<string, [number, number]> = {
  street: [1024, 379], crash: [564, 603], roof: [563, 558], leap: [1024, 707],
};

const decoded = new Map<string, Promise<boolean>>();
export function warmPlate(src?: string): Promise<boolean> {
  if (!src) return Promise.resolve(false);
  const known = decoded.get(src);
  if (known) return known;
  const promise = new Promise<boolean>(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!image.naturalWidth) { resolve(false); return; }
      if (!image.decode) { resolve(true); return; }
      image.decode().then(() => resolve(true), () => resolve(false));
    };
    image.onerror = () => resolve(false);
    image.src = src;
  });
  decoded.set(src, promise);
  return promise;
}
export const warmCut = (id: string) => warmPlate(motionCuts[id]?.back);

function RegisteredInk({id, src}: {id: string; src: string}) {
  const uid = useId().replace(/:/g, '');
  const c = motionCuts[id];
  if (!c) return null;
  const region = `gc-region-${uid}`;
  const outside = `gc-outside-${uid}`;
  return <svg aria-hidden="true" className="gc-registered" viewBox={`0 0 ${c.width} ${c.height}`}>
    <defs>
      <clipPath id={region} clipPathUnits="userSpaceOnUse"><path d={c.path}/></clipPath>
      <mask id={outside} maskUnits="userSpaceOnUse" x="0" y="0" width={c.width} height={c.height} style={{maskType:'luminance'}}>
        <rect width={c.width} height={c.height} fill="white"/><path d={c.path} fill="black"/>
      </mask>
    </defs>
    <g className="gc-background-ink">
      <image href={c.back} width={c.width} height={c.height} clipPath={`url(#${region})`}/>
      <image href={src} width={c.width} height={c.height} mask={`url(#${outside})`}/>
    </g>
    <g className="gc-subject"><g className="gc-subject-rest">
      <image href={src} width={c.width} height={c.height} clipPath={`url(#${region})`}/>
    </g></g>
  </svg>;
}

const rain = Array.from({length: 25}, (_, i) => ({
  '--x': `${(i * 37 + 7) % 106}%`, '--y': `${(i * 29 + 9) % 108 - 19}%`,
  '--speed': `${.52 + (i % 6) * .11}s`, '--delay': `-${(i % 11) * .19}s`,
  '--length': `${15 + (i * 11) % 45}px`, '--strength': `${.15 + (i % 5) * .085}`,
}) as CSSProperties);
const splinters = [
  [-100,-56,-35],[-66,-89,40],[-33,-95,80],[15,-71,-40],[40,-48,95],[64,-27,130],
  [-84,8,-70],[-69,37,125],[-93,55,45],[-45,75,-35],[-14,60,85],[18,51,-15],[33,31,120],
];

export function Atmosphere({id}: {id: string}) {
  return <div className={`gc-air gc-air--${id}`} aria-hidden="true">
    <div className="gc-air-light"/>
    <div className="gc-rain-depth">{rain.map((style, i) => <i key={i} style={style}/>)}</div>
  </div>;
}

function Foreground({id}: {id: string}) {
  if (id === 'crash') return <div className="gc-shatter" aria-hidden="true">
    <i className="gc-impact-ring"/>
    {splinters.map(([x,y,angle],i)=><b key={i} style={{
      '--dx':x/100,'--dy':y/100,'--spin':`${angle}deg`,'--lag':`${866+(i%4)*21}ms`,
      '--fragment': ['#fa6040','#ffbf63','#9c3331','#d4b59a'][i%4],
    } as CSSProperties}/>)}
  </div>;
  if (id === 'roof') return <span className="gc-sword-light" aria-hidden="true"/>;
  if (id === 'street') return <><span className="gc-lantern-light" aria-hidden="true"/><span className="gc-water-light" aria-hidden="true"/><span className="gc-storm-rim" aria-hidden="true"/></>;
  return <div className="gc-travel-lines" aria-hidden="true">{[0,1,2,3,4,5].map(i=><i key={i} style={{'--line':i} as CSSProperties}/>)}</div>;
}

type Props = {
  id: string; src: string; description: string; loaded: boolean; layered: boolean; moving: boolean;
  onLoad: (event: SyntheticEvent<HTMLImageElement>) => void; onError: () => void;
};
export function CinematicPlate({id,src,description,loaded,layered,moving,onLoad,onError}: Props) {
  const [w,h] = frameSize[id];
  const style = {'--plate-ratio': w / h, '--plate-pixels': `url(${JSON.stringify(src)})`} as CSSProperties;
  return <div className="gc-illustration" data-plate={id} data-ink-motion={moving ? 'once' : 'still'}
    data-layered={moving && layered} style={style}>
    <div className="gc-lens">
      <img className="gc-inked-plate" src={src} alt={description} decoding="async" draggable={false}
        data-plate-id={id} data-art-loaded={loaded} onLoad={onLoad} onError={onError}/>
      {moving && layered && <RegisteredInk id={id} src={src}/>}
      {moving && <div className="gc-ink-light"><Foreground id={id}/></div>}
    </div>
  </div>;
}

// These areas contain just the original inked sound and the blade's printed gleam.
// Their positions on the master fall below the two widescreen close-ups.
const detailMarks = {
  crash: {
    width:564, height:603, viewBox:'9 382 338 217',
    path:'M10 539 Q22 500 48 471 Q72 444 91 437 L111 432 L110 447 Q132 430 153 427 L167 434 L165 451 L178 436 L201 420 L204 422 L202 446 Q225 419 247 416 L251 422 L263 412 L270 408 L266 429 L274 419 L279 406 L294 395 L303 391 L299 414 L310 403 L318 398 L327 401 L342 397 L345 401 L332 417 L310 462 L305 466 L304 477 L296 491 L287 498 L279 493 L273 506 L263 511 L258 506 L248 524 L236 530 L240 515 L231 524 L222 533 L216 538 L208 533 L196 546 L191 537 L182 546 L174 552 L165 535 L156 540 L143 556 L137 553 L130 538 L123 540 L113 546 L103 565 L93 559 L88 553 L82 570 L75 571 L61 582 L42 597 L38 588 L29 590 L30 577 L21 568 L21 548 L14 545 Z',
  },
  roof: {
    width:563, height:558, viewBox:'403 384 160 139',
    path:'M439 472 L441 461 L455 444 L446 445 L449 431 L461 416 L473 417 L480 414 L484 419 L489 410 L500 409 L502 415 L512 398 L522 396 L521 405 L532 395 L540 396 L548 389 L554 392 L561 388 L563 393 L552 421 L550 431 L546 438 L539 439 L535 437 L527 445 L517 450 L512 447 L504 454 L497 453 L488 459 L480 458 L475 463 L465 464 L461 463 Z M404 502 L440 493 L416 473 L444 487 L445 469 L451 485 L560 453 L560 458 L458 493 L518 493 L458 497 L477 515 L450 500 L431 522 L444 497 Z',
  },
};

function WidescreenMark({id,src}: {id:'crash'|'roof';src:string}) {
  const key = `gc-letter-${useId().replace(/:/g,'')}`;
  const mark = detailMarks[id];
  return <svg aria-hidden="true" focusable="false" className={`gc-wide-mark gc-wide-mark--${id}`} viewBox={mark.viewBox}>
    <defs><clipPath id={key} clipPathUnits="userSpaceOnUse"><path d={mark.path}/></clipPath></defs>
    <image href={src} width={mark.width} height={mark.height} clipPath={`url(#${key})`}/>
  </svg>;
}

// All camera insets take their type from the approved raster; the native source
// lettering is outside the corresponding camera gate or masked in that shot.
export function MobileLettering({id,src}: {id: string; src: string}) {
  if (id === 'crash' || id === 'roof') return <WidescreenMark id={id} src={src}/>;
  if (id !== 'street' && id !== 'leap') return null;
  return <div className={`gc-native-letter gc-native-letter--${id}`} aria-hidden="true" style={{backgroundImage:`url(${JSON.stringify(src)})`}}/>;
}
