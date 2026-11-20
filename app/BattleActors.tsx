import type { CSSProperties } from 'react';
import { duelShot } from './duel-choreography.js';
import victorySprite from './victory.png';
import './duel-actors.css';

type Side = 'L' | 'R';
type ActorMatch = {
  id?: string | number;
  phase: string;
  resumePhase?: string | null;
  encounter?: string;
  pending?: { prediction: Side } | null;
  last?: { turn?: number; side: Side; prediction: Side; correct: boolean; guarded?: boolean; burst?: boolean } | null;
  pounce?: { serial: number; side?: Side | null; outcome?: string | null } | null;
  winner?: string | null;
};
type Position = { art: string; x: number; y: number; angle: number; flip: boolean; scale: number; ground: number };
type Track = { points: Position[]; arts: string[]; flips: boolean[]; still: Position };
type Shot = {
  move: string; beat: string; duration: number; hero: Track; boss: Track;
  result?: string | null; side?: string | null; guard?: string | null;
  eye?: string; impact?: string | null;
};

// Four equal cells per row; every cut is bottom-aligned in a 340 × 315 frame.
const cells = [
  'hero-idle', 'hero-wind', 'hero-jab', 'hero-hook',
  'hero-rise', 'hero-evade', 'hero-hurt', 'boss-idle',
  'boss-guard', 'boss-guard-right', 'boss-cross', 'boss-counter',
  'boss-palm', 'boss-crouch', 'boss-air', 'boss-hurt'
];
const tiles = Object.fromEntries(cells.map((name, i) =>
  [name, `${(i % 4) * 100 / 3}% ${Math.floor(i / 4) * 100 / 3}%`]
));

function trackStyle(track: Track, who: 'hero' | 'boss') {
  const vars: Record<string, string> = {};
  const points = [...track.points, track.still];
  const names = ['start', 'drive', 'land', 'end', 'still'];
  for (const [i, p] of points.entries()) {
    const outward = who === 'hero' ? p.x < 0 : p.x > 0;
    const step = `calc(${p.x} * var(${outward ? '--duel-edge-stride' : '--duel-stride'}))`;
    const lift = Math.min(0, p.y - p.ground);
    const shadowScale = p.scale * Math.max(.43, 1 + lift * .016);
    const shadowAlpha = Math.max(.32, 1 + lift * .016);
    const name = names[i];
    vars[`--duel-body-${name}`] = `translate(${step}, ${p.y}%) rotate(${p.angle}deg) scale(${p.scale})`;
    vars[`--duel-shadow-${name}`] = `translate(${step}, ${p.ground}%) scaleX(${shadowScale})`;
    vars[`--duel-alpha-${name}`] = String(shadowAlpha);
    vars[`--duel-tile-${name}`] = tiles[i === 4 ? p.art : track.arts[i]];
    vars[`--duel-facing-${name}`] = (i === 4 ? p.flip : track.flips[i]) ? '-1' : '1';
  }
  return vars as CSSProperties;
}

function GuardSeal({ side }: { side: string }) {
  return <svg className="duel-guard-seal" data-side={side} viewBox="0 0 64 36" focusable="false">
    <path d="M3 18 14 3h45l3 4-3 23-5 3H14Z" fill="#211b31" stroke="#ffe293" strokeWidth="2.8"/>
    <path d="m10 18 10-8v5h8v6h-8v5Z" fill="#ffd66e"/>
    <path d="m30 15 4-5 3 1 2-4 4 1 2-2 5 2 3 2 1 2-1 7-6 5-1 5-11-2 1-5-5-3Z"
      fill="#fff0bf" stroke="#20192b" strokeWidth="1.7" strokeLinejoin="round"/>
    <path d="m36 11 2 5m4-7 2 5m4-5 2 4m-17 3 6 1 2 4" fill="none"
      stroke="#514255" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>;
}

// The third eye itself is part of each drawing. These accents follow the illustrated forehead.
function EyeCue({ open }: { open: boolean }) {
  return <svg className="duel-ink-overlay duel-eye-cue" viewBox="0 0 340 315" focusable="false">
    {open ? <g fill="none" stroke="#fff1a7" strokeWidth="3.5" strokeLinecap="round">
      <path d="m113 117 7 5m19-20 1 9m28 0-6 7m9 21 9 1"/>
      <ellipse cx="145" cy="134" rx="22" ry="19" transform="rotate(-29 145 134)"
        stroke="#ffd75d" strokeWidth="2.1" strokeDasharray="33 11 22 65"/>
    </g> : <path d="M75 140.5h25" fill="none" stroke="#471c52" strokeWidth="2.8" strokeLinecap="round"/>}
  </svg>;
}

function StrikeTrail({ move }: { move: string }) {
  return <svg className="duel-ink-overlay duel-trail" viewBox="0 0 340 315" fill="none"
    strokeLinecap="round" focusable="false">
    {move === 'jab' ? <g stroke="#fff4c5">
      <path d="m151 151 97 1" strokeWidth="3.8"/><path d="m178 160 52 1" strokeWidth="2.2"/>
    </g> : <g stroke={move === 'mind-break' ? '#ffca58' : '#ffeab0'}>
      <path d={move === 'mind-break' ? 'M149 291Q278 230 290 49' : 'M198 222Q271 180 286 88'} strokeWidth="4.6"/>
      <path d={move === 'mind-break' ? 'M193 275Q279 213 297 102' : 'M231 208Q283 160 290 115'} strokeWidth="2.3"/>
    </g>}
  </svg>;
}

function ContactMark({ kind, art }: { kind: string; art: string }) {
  const fists: Record<string, string> = {
    'hero-jab':'300 158', 'hero-hook':'286 75', 'hero-rise':'274 31',
    'boss-palm':'37 149', 'boss-counter':'40 169'
  };
  return <svg className="duel-ink-overlay duel-contact" data-ink={kind} viewBox="0 0 340 315" focusable="false">
    <g transform={`translate(${fists[art]})`} fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="m-12-12-7-9m18 7 1-13m12 18 8-7m-7 20 10 4m-20 4 4 10" strokeWidth="3.9"/>
      <path d="m-9-7 7 3 6-8 1 8 8 3-9 3-3 7-2-8Z" fill="#fff4c3" strokeWidth="1.2"/>
    </g>
  </svg>;
}

function Fighter({ who, track, shot, victory }: {
  who: 'hero' | 'boss'; track: Track; shot: Shot; victory: boolean;
}) {
  const isHero = who === 'hero';
  const impactActor = shot.impact === 'counter' || shot.impact === 'pounce' ? 'boss' : 'hero';
  return <div className={`fighter ${who}-fighter duel-fighter`} style={trackStyle(track, who)} data-pose={track.still.art}>
    <div className="duel-ground-track"><div className="ground-shadow"/></div>
    <div className="duel-body-track">
      <div className="duel-drawing">
        {isHero && shot.beat === 'contact' && <StrikeTrail move={shot.move}/>}
        {isHero && victory
          ? <img className="victory-sprite" src={victorySprite} alt="" draggable={false}/>
          : <div className="sprite duel-ink"/>}
        {shot.impact && who === impactActor && <ContactMark kind={shot.impact} art={track.still.art}/>}
        {!isHero && shot.guard && <GuardSeal side={shot.guard}/>}
        {!isHero && shot.eye && <EyeCue open={shot.eye === 'open'}/>}
      </div>
    </div>
  </div>;
}

export function BattleActors({ match, stage = 0, celebrating = false, reduced = false }: {
  match: ActorMatch | null; stage?: number; celebrating?: boolean; reduced?: boolean;
}) {
  const shot: Shot = duelShot(match, stage);
  // Pause and language changes retain the same mounted animation, including its current frame.
  const beatKey = [match?.id, match?.last?.turn, match?.pounce?.serial, shot.move, shot.beat, shot.result].join('/');
  return <div className="duel-actors" aria-hidden="true" data-move={shot.move} data-beat={shot.beat}
    data-result={shot.result} data-side={shot.side} data-guard-side={shot.guard ?? undefined}
    data-eye={shot.eye} data-paused={match?.phase === 'paused' || undefined}
    data-celebrating={celebrating || undefined} data-reduced={reduced || undefined}
    style={{ '--duel-duration': `${shot.duration}ms` } as CSSProperties}>
    <Fighter key={beatKey + '/hero'} who="hero" track={shot.hero} shot={shot} victory={shot.move === 'victory'}/>
    <Fighter key={beatKey + '/boss'} who="boss" track={shot.boss} shot={shot} victory={false}/>
  </div>;
}
