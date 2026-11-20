import assert from 'node:assert/strict';
import { test } from 'node:test';
import { duelShot } from '../app/duel-choreography.js';

const ready = (prediction = 'L', encounter = 'ordinary') => ({
  phase: 'ready', encounter, pending: { prediction }
});
const strike = (side, extra = {}) => ({
  phase: 'resolving', last: { side, prediction: side === 'L' ? 'R' : 'L', ...extra }
});
const pounce = (phase, outcome = null, side = null) => ({
  phase: 'pounce-' + phase, pounce: { serial: 1, outcome, side }
});

test('only a declared one-sided guard exposes the committed hand; it keeps facing the heroine', () => {
  assert.deepEqual(duelShot(ready('L')), duelShot(ready('R')));
  const left = duelShot(ready('L', 'guard'));
  const right = duelShot(ready('R', 'guard'));
  assert.equal(left.guard, 'L');
  assert.equal(right.guard, 'R');
  assert.notEqual(left.boss.still.art, right.boss.still.art);
  assert.ok(left.boss.still.angle < 0 && right.boss.still.angle > 0);
  assert.equal(left.boss.still.flip, right.boss.still.flip);
});

test('jab, uppercut and mind break retain distinct windup and contact in low motion', () => {
  const exchanges = [strike('L'), strike('R'), strike('R', { burst: true })];
  const windups = exchanges.map(m => duelShot(m, 0).hero.still);
  const contacts = exchanges.map(m => duelShot(m, 1).hero.still);
  assert.equal(new Set(windups.map(p => [p.art, p.x, p.y, p.angle].join())).size, 3);
  assert.equal(new Set(contacts.map(p => p.art)).size, 3);
  const beats = [0, 1, 2, 3].map(i => duelShot(exchanges[2], i));
  assert.deepEqual(beats.map(s => s.beat), ['windup', 'contact', 'reaction', 'recovery']);
  assert.ok(beats[2].boss.still.y < -22);
  assert.equal(beats[3].boss.still.art, 'boss-crouch');
});

test('the one-sided block precedes the palm counter, and switching hands reaches the opening', () => {
  const blocked = strike('R', { guarded: true, prediction: 'R', correct: true });
  const hit = strike('L', { guarded: true, prediction: 'R' });
  assert.equal(duelShot(blocked, 1).guard, 'R');
  assert.equal(duelShot(blocked, 2).boss.still.art, 'boss-palm');
  assert.equal(duelShot(blocked, 2).hero.still.art, 'hero-hurt');
  assert.equal(duelShot(hit, 0).guard, 'R');
  assert.equal(duelShot(hit, 2).boss.still.art, 'boss-hurt');
  assert.equal(duelShot(hit, 2).guard, null);
  assert.equal(duelShot(strike('L', { correct: true, prediction: 'L' }), 2).boss.still.art, 'boss-counter');
});

test('the near palm arrests a jab and a raised cross-block catches the right hand with both bodies visible', () => {
  const near = duelShot(strike('L', { guarded: true, prediction: 'L', correct: true }), 1);
  const far = duelShot(strike('R', { guarded: true, prediction: 'R', correct: true }), 1);
  assert.ok(near.hero.still.x < duelShot(strike('L'), 1).hero.still.x / 2);
  assert.equal(far.boss.still.art, 'boss-cross');
  assert.ok(far.boss.still.y < 0);
  assert.ok(far.hero.still.x - far.boss.still.x < 55);
  const launch = duelShot(strike('R', { burst: true }), 1);
  assert.ok(launch.boss.still.y < -12 && launch.boss.still.y > duelShot(strike('R', { burst: true }), 2).boss.still.y);
});

test('the closed crouch and open, off-ground pounce remain legible for a held cue', () => {
  for (const phase of ['intro', 'held', 'wind']) {
    const crouch = duelShot(pounce(phase));
    assert.equal(crouch.boss.still.art, 'boss-crouch');
    assert.equal(crouch.eye, 'closed');
  }
  const open = duelShot(pounce('open'));
  assert.equal(open.boss.still.art, 'boss-air');
  assert.equal(open.eye, 'open');
  assert.ok(open.boss.still.y < -15);
});

test('recovery shows both directions, and visually distinguishes moving early from standing late', () => {
  const left = duelShot(pounce('recovery', 'evaded', 'L'));
  const right = duelShot(pounce('recovery', 'evaded', 'R'));
  assert.equal(left.hero.still.art, 'hero-evade');
  assert.equal(right.hero.still.art, 'hero-evade');
  assert.ok(left.hero.still.x < 0 && right.hero.still.x > 0);
  assert.equal(left.hero.still.flip, true);
  assert.equal(right.hero.still.flip, false, 'on a right step her ponytail trails away from the approaching face');
  const early = duelShot(pounce('recovery', 'early', 'R'));
  const late = duelShot(pounce('recovery', 'late'));
  assert.equal(early.hero.still.art, 'hero-hurt');
  assert.equal(late.hero.still.art, 'hero-hurt');
  assert.equal(early.hero.arts[0], 'hero-evade');
  assert.equal(late.hero.arts[0], 'hero-idle');
  assert.ok(early.boss.points[1].x >= 0, 'the crouched monster holds its back foot until the jumping cel appears');
  assert.ok(right.boss.points[2].x >= -4, 'the landing stays outside the forward sidestep');
  assert.notDeepEqual(early.hero.still, late.hero.still);
});

test('the pounce stays on a smaller, rear plane while a sidestep moves into the foreground', () => {
  for (const [outcome, side] of [['evaded', 'R'], ['evaded', 'L'], ['early', 'R'], ['early', 'L'], ['late', null]]) {
    const shot = duelShot(pounce('recovery', outcome, side));
    for (const i of [1, 2]) {
      assert.ok(shot.boss.points[i].scale < .85);
      assert.ok(shot.boss.points[i].ground < shot.hero.points[i].ground);
      assert.ok(shot.boss.points[i].x >= -47, 'even a landed arm strike keeps the creature short of the heroine’s feet');
    }
    if (outcome === 'evaded') {
      assert.ok(shot.hero.still.y - shot.boss.still.y > 30);
      assert.ok(shot.hero.still.scale >= 1);
      assert.ok(shot.hero.still.x < 30, 'a right dodge must stay short of the approaching creature');
    } else {
      assert.equal(shot.boss.still.art, 'boss-palm');
      assert.equal(shot.impact, 'pounce');
    }
  }
});

test('pausing keeps the exact visual beat; supplies, victory and a pounce KO each own their picture', () => {
  const attack = strike('R', { burst: true });
  assert.deepEqual(duelShot({ ...attack, phase: 'paused', resumePhase: 'resolving' }, 2), duelShot(attack, 2));
  const flight = pounce('open');
  assert.deepEqual(duelShot({ ...flight, phase: 'paused', resumePhase: 'pounce-open' }), duelShot(flight));
  assert.equal(duelShot({ ...attack, phase: 'supply' }).hero.still.art, 'hero-idle');
  assert.equal(duelShot({ ...attack, phase: 'finished', winner: 'player' }).move, 'victory');
  assert.equal(duelShot({ ...flight, phase: 'finished', winner: 'boss' }).hero.still.art, 'hero-hurt');
  assert.equal(duelShot(null).move, 'rest');
});
