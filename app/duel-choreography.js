// Coordinates are relative to one fighter's cell. Ground is a position on the street; y can lift a body above it.
const pose = (art, x = 0, y = 0, angle = 0, flip = false) => ({ art, x, y, angle, flip, scale: 1, ground: 0 });
const heroIdle = pose('hero-idle');
const bossIdle = pose('boss-idle');
function rearLane(art, x, lift, angle = 0, scale = .76) {
  const ground = -8;
  return { ...pose(art, x, ground - lift, angle), ground, scale };
}
const crouch = rearLane('boss-crouch', 9, 0, 2, .83);
const flight = rearLane('boss-air', -7, 23, -4);

function between(start, end, fraction) {
  const mix = key => start[key] + (end[key] - start[key]) * fraction;
  return { ...pose(end.art, mix('x'), mix('y'), mix('angle'), end.flip), ground: mix('ground'), scale: mix('scale') };
}

// The illustrated body can change independently of its path, e.g. landing from a leap.
function travel(start, end, { drive, land, frames, still = end } = {}) {
  const drawings = frames ?? [end, end, end, end];
  return {
    points: [start, drive ?? between(start, end, 0.78), land ?? end, end],
    arts: drawings.map(frame => frame.art),
    flips: drawings.map(frame => frame.flip),
    still
  };
}
const hold = shape => travel(shape, shape);
const beats = ['windup', 'contact', 'reaction', 'recovery'];

const attacks = {
  jab: [
    pose('hero-idle', -4, 1, -4), pose('hero-jab', 37, 0, 3),
    pose('hero-jab', 26, 0, 0), heroIdle
  ],
  uppercut: [
    pose('hero-wind', -7, 5, -8), pose('hero-hook', 48, -2, 5),
    pose('hero-hook', 30, -3, 0), pose('hero-wind', 0, 0, -1)
  ],
  'mind-break': [
    pose('hero-wind', -10, 7, -12), pose('hero-rise', 54, 2, 3),
    pose('hero-rise', 50, -13, 6), pose('hero-hook', 0, 0, -2)
  ]
};

function oneSidedGuard(side) {
  return side === 'L'
    ? pose('boss-guard', -3, 1, -9)
    : pose('boss-guard-right', 3, 1, 9);
}

function contactPose(last, guard) {
  if (last.correct) {
    if (last.guarded) return last.side === 'R' ? pose('boss-cross', 0, -9, -6) : guard;
    return last.side === 'R' ? pose('boss-cross', -2, -13, -7) : pose('boss-cross', -2, 1, -4);
  }
  if (last.burst) return pose('boss-hurt', -2, -23, -8);
  if (last.guarded) return guard;
  return last.side === 'R' ? pose('boss-hurt', -4, -9, -7) : pose('boss-hurt', 2);
}

function exchange(last, index) {
  const move = last.burst ? 'mind-break' : last.side === 'L' ? 'jab' : 'uppercut';
  const lockedSide = last.guarded ? last.prediction : null;
  const guard = lockedSide ? oneSidedGuard(lockedSide) : bossIdle;
  const blocked = !!last.correct;
  const counter = last.guarded ? pose('boss-palm', -47, -1, -6) : pose('boss-counter', -43, 0, -5);
  const knockedBack = last.burst ? pose('boss-hurt', 22, -34, 16)
    : move === 'uppercut' ? pose('boss-hurt', 14, -9, 10) : pose('boss-hurt', 11, -3, 7);
  const bosses = [
    guard, contactPose(last, guard), blocked ? counter : knockedBack,
    last.burst ? pose('boss-crouch', 4, 2, 1) : bossIdle
  ];
  const heroes = [...attacks[move]];
  if (blocked) {
    if (last.side === 'R') heroes[1] = pose('hero-hook', 39, 8, 4);
    else if (lockedSide) heroes[1] = pose('hero-jab', 11, 0, 3);
    heroes[2] = pose('hero-hurt', -13, -2, -7);
  }

  let hero = travel(index ? heroes[index - 1] : heroIdle, heroes[index]);
  let boss = travel(index ? bosses[index - 1] : guard, bosses[index]);
  if (index === 3 && last.burst) {
    const catchStep = pose('hero-wind', 5, 1);
    hero = travel(heroes[2], heroIdle, {
      drive: pose('hero-hook', 23, -3), land: catchStep,
      frames: [heroes[3], heroes[3], catchStep, heroIdle], still: heroes[3]
    });
    boss = travel(bosses[2], bossIdle, {
      drive: pose('boss-hurt', 16, -14, 11), land: bosses[3],
      frames: [bosses[2], bosses[2], bosses[3], bossIdle], still: bosses[3]
    });
  }
  return {
    move, beat: beats[index], side: last.side, result: blocked ? 'block' : 'hit',
    guard: index === 0 || (index === 1 && !last.burst) ? lockedSide : null, hero, boss,
    duration: [125, 100, last.burst ? 205 : 160, last.burst ? 340 : 155][index],
    impact: index === 1 ? (blocked ? 'block' : last.burst ? 'break' : 'hit')
      : index === 2 && blocked ? 'counter' : null
  };
}

function pounceRecovery(pounce) {
  const { side, outcome } = pounce;
  const right = side === 'R';
  const dodge = { ...pose('hero-evade', right ? 18 : -24, 9, right ? 1 : -3, !right), ground: 8, scale: 1.02 };
  const early = outcome === 'early';
  const evaded = outcome === 'evaded';
  const hit = early ? pose('hero-hurt', right ? -5 : -16, 3, -10) : pose('hero-hurt', -12, 1, -6);
  const miss = rearLane('boss-air', -27, 29, -3, .74);
  const catches = rearLane('boss-air', -25, 0, -3);
  const thrust = rearLane('boss-palm', -47, -4, -1, .78);
  const skid = rearLane('boss-crouch', -3, 0, 3, .78);

  const hero = evaded
    ? travel(heroIdle, heroIdle, {
      drive: dodge, land: dodge, frames: [dodge, dodge, dodge, heroIdle], still: dodge
    })
    : travel(heroIdle, heroIdle, {
      drive: early ? dodge : hit, land: hit,
      frames: [early ? dodge : heroIdle, early ? dodge : hit, hit, heroIdle], still: hit
    });
  // An early step happens while the monster is still crouched. Its feet leave the
  // back lane before it moves towards the space the heroine has just vacated.
  const boss = early
    ? travel(crouch, bossIdle, { drive: crouch, land: thrust, frames: [crouch, flight, thrust, bossIdle], still: thrust })
    : travel(flight, bossIdle, {
      drive: evaded ? miss : catches, land: evaded ? skid : thrust, frames: [flight, flight, evaded ? skid : thrust, bossIdle],
      still: evaded ? miss : thrust
    });
  return { move: 'pounce', beat: 'recovery', side, result: outcome, impact: evaded ? null : 'pounce', hero, boss, duration: 570 };
}

function pounceShot(phase, pounce) {
  const beat = phase.slice('pounce-'.length);
  if (beat === 'recovery' && pounce?.outcome) return pounceRecovery(pounce);
  if (beat === 'open') {
    // Feet leave the ground on the same frame in which a dodge starts counting.
    const takeoff = rearLane('boss-air', 10, 11, -2, .79);
    const apex = rearLane('boss-air', 1, 29, -5, .75);
    return {
      move: 'pounce', beat, eye: 'open', duration: 230, hero: hold(heroIdle),
      boss: travel(takeoff, flight, { drive: apex, land: rearLane('boss-air', -4, 26, -5) })
    };
  }
  return {
    move: 'pounce', beat, eye: 'closed', duration: 180, hero: hold(heroIdle),
    boss: beat === 'held' ? hold(crouch) : travel(bossIdle, crouch)
  };
}

/** A time-free description of the picture. The reducer and input handlers own all combat decisions. */
export function duelShot(match, stage = 0) {
  const phase = match?.phase === 'paused' ? match.resumePhase : match?.phase;
  if (phase === 'resolving' && match.last) {
    return exchange(match.last, Math.max(0, Math.min(3, Math.trunc(stage) || 0)));
  }
  if (phase?.startsWith('pounce-')) return pounceShot(phase, match.pounce);
  if (phase === 'ready' && match.encounter === 'guard' && match.pending?.prediction) {
    const guard = match.pending.prediction;
    return {
      move: 'guard', beat: 'ready', guard, duration: 150,
      hero: hold(heroIdle), boss: travel(bossIdle, oneSidedGuard(guard))
    };
  }
  if (phase === 'finished') {
    const won = match.winner === 'player';
    return {
      move: won ? 'victory' : 'defeat', beat: 'finished', duration: 0,
      hero: hold(won ? heroIdle : pose('hero-hurt', -6, 0, -6)),
      boss: hold(won ? pose('boss-hurt', 2, -2, 6) : bossIdle)
    };
  }
  return {
    move: 'rest', beat: phase ?? 'intro', duration: 0,
    hero: hold(heroIdle), boss: hold(bossIdle)
  };
}
