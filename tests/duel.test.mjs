import test from 'node:test';
import assert from 'node:assert/strict';
import {newMatch, gameReducer} from '../app/game.js';
import {newDuel, duelReducer, duelReport} from '../app/duel.js';

const opposite = side => side === 'L' ? 'R' : 'L';
const fresh = (options = {}) => newDuel(42, 17, options);
const act = (state, type, options) => duelReducer(state, {type, id: state.id, ...options});
const signal = (state, type, now) => act(state, type, {serial: state.pounce.serial, now});

function punch(state, blocked) {
  assert.equal(state.phase, 'ready');
  const turn = state.history.length + 1;
  const side = blocked ? state.pending.prediction : opposite(state.pending.prediction);
  const hit = act(state, 'STRIKE', {side, now: turn * 10000});
  return act(hit, 'FINISH', {turn, now: turn * 10000 + 100});
}

function firstPounce(options = {}) {
  // Leave both fighters alive and the heroine one clean punch away from a burst.
  return [false, true, false, true, false, false].reduce(punch, fresh(options));
}

function practiceWind(state, now = 60200) {
  assert.equal(state.phase, 'pounce-intro');
  const held = act(state, 'STRIKE', {side: 'L', now});
  return act(held, 'RELEASE', {side: 'L', now: now + 10});
}

function open(state, delay = 0) {
  assert.equal(state.phase, 'pounce-wind');
  return signal(state, 'POUNCE_CUE', state.pounce.opensAt + delay);
}

function done(state) {
  assert.equal(state.phase, 'pounce-recovery');
  return signal(state, 'POUNCE_DONE', state.pounce.recoveryEndsAt);
}

function evade(state, side = 'L') {
  const cue = open(state);
  return act(cue, 'STRIKE', {side, now: cue.pounce.opensAt + 1});
}

function takeSupply(state, choice = 'safe', now = state.history.length * 10000 + 150) {
  assert.equal(state.phase, 'supply');
  const supply = act(state, 'SUPPLY', {choice, roll: 0.75, now});
  assert.equal(supply.phase, 'supply-reveal');
  return act(supply, 'CONTINUE_SUPPLY', {now: now + 1});
}

test('the fourth punch shows one locked guard, with ordinary counter and three-feint damage', () => {
  const guard = [true, false, false].reduce(punch, fresh());
  assert.equal(guard.encounter, 'guard');
  assert.equal(guard.combo, 2);
  const prediction = guard.pending.prediction;
  const blocked = punch(guard, true);
  const tricked = punch(guard, false);
  assert.equal(blocked.last.prediction, prediction);
  assert.equal(tricked.last.prediction, prediction);
  assert.equal(blocked.last.guarded, true);
  assert.equal(tricked.last.guarded, true);
  assert.equal(blocked.playerHP, guard.playerHP - 1);
  assert.equal(blocked.bossHP, guard.bossHP);
  assert.equal(tricked.bossHP, guard.bossHP - 2);
  assert.equal(tricked.last.burst, true);
  assert.deepEqual(guard.history.map(row => row.guarded), [false, false, false]);
  assert.equal(tricked.encounter, 'ordinary');
});

test('an eighteen-punch fight spaces guards twelve punches apart without moving six-punch pounces', () => {
  let state = fresh({trained: true});
  for (let turn = 1; turn <= 18; turn++) {
    state = punch(state, turn % 2 === 1);
    if (state.phase === 'supply') state = takeSupply(state);
    if (state.phase === 'pounce-wind') state = done(evade(state));
  }
  assert.deepEqual(state.history.filter(row => row.guarded).map(row => row.turn), [4, 16]);
  assert.deepEqual(state.dodgeHistory.map(row => row.afterTurn), [6, 12, 18]);
  assert.equal(state.playerHP, 5);
  assert.equal(state.bossHP, 3);
});

test('the third guard arrives at punch 28 after a full gourd and four pounces', () => {
  let state = fresh({trained: true});
  for (let turn = 1; turn <= 28; turn++) {
    state = punch(state, turn <= 6 || turn % 2 === 0);
    if (state.phase === 'supply') {
      state = act(state, 'SUPPLY', {choice: 'risky', roll: .25, now: turn * 10000 + 150});
      state = act(state, 'CONTINUE_SUPPLY', {now: turn * 10000 + 151});
    }
    if (state.phase === 'pounce-wind') state = done(evade(state));
  }
  assert.deepEqual(state.history.filter(row => row.guarded).map(row => row.turn), [4, 16, 28]);
  assert.deepEqual(state.dodgeHistory.map(row => row.afterTurn), [6, 12, 18, 24]);
  assert.equal(state.supply.heal, 5);
  assert.equal(state.phase, 'finished');
  assert.equal(state.playerHP, 0);
  assert.equal(state.bossHP, 1);
});

test('practice waits for the matching release before the eye can start to open', () => {
  const intro = firstPounce();
  assert.equal(intro.phase, 'pounce-intro');
  assert.equal(signal(intro, 'POUNCE_CUE', 99000), intro);
  assert.equal(act(intro, 'STRIKE', {side: 'L', repeat: true, now: 60110}), intro);
  const held = act(intro, 'STRIKE', {side: 'R', now: 60120});
  assert.equal(held.phase, 'pounce-held');
  assert.equal(held.pounce.side, 'R');
  assert.equal(act(held, 'STRIKE', {side: 'L', now: 60130}), held);
  assert.equal(act(held, 'RELEASE', {side: 'L', now: 60140}), held);
  assert.equal(act(held, 'RELEASE', {id: 16, side: 'R', now: 60150}), held);
  const wind = act(held, 'RELEASE', {side: 'R', now: 60160});
  assert.equal(wind.phase, 'pounce-wind');
  assert.ok(wind.pounce.opensAt > 60160);
  assert.equal(wind.pounce.side, null);
  assert.equal(wind.dodgeHistory.length, 0);
  assert.equal(signal(wind, 'POUNCE_CUE', wind.pounce.opensAt - 1), wind);
});

test('practice retries both early and late failures for free until the first successful dodge', () => {
  const first = practiceWind(firstPounce());
  const early = act(first, 'STRIKE', {side: 'R', now: first.pounce.opensAt - 1});
  assert.equal(early.phase, 'pounce-recovery');
  assert.equal(early.playerHP, 10);
  assert.equal(early.trainedDodge, false);
  const second = practiceWind(done(early), early.pounce.recoveryEndsAt + 10);
  assert.notEqual(second.pounce.serial, first.pounce.serial);
  const cue = open(second);
  const late = signal(cue, 'POUNCE_TIMEOUT', cue.pounce.expiresAt);
  assert.equal(late.playerHP, 10);
  assert.equal(late.trainedDodge, false);
  const third = practiceWind(done(late), late.pounce.recoveryEndsAt + 10);
  const passed = done(evade(third, 'R'));
  assert.equal(passed.phase, 'ready');
  assert.equal(passed.trainedDodge, true);
  assert.equal(passed.playerHP, 10);
  assert.deepEqual(passed.dodgeHistory, [
    {afterTurn: 6, side: 'R', outcome: 'early', training: true, damage: 0},
    {afterTurn: 6, side: null, outcome: 'late', training: true, damage: 0},
    {afterTurn: 6, side: 'R', outcome: 'evaded', training: true, damage: 0},
  ]);
});

test('dodge and practice keys neither train the predictor nor break or extend the punch combo', () => {
  const start = firstPounce();
  const failed = act(practiceWind(start), 'STRIKE', {side: 'L', now: 60240});
  const trained = done(evade(practiceWind(done(failed), failed.pounce.recoveryEndsAt + 1), 'R'));
  let classic = newMatch(42, 17);
  for (const row of start.history) {
    classic = gameReducer(classic, {type: 'STRIKE', side: row.side});
    classic = gameReducer(classic, {type: 'FINISH', id: 17, turn: row.turn});
  }
  assert.equal(trained.history, start.history);
  assert.equal(trained.last, start.last);
  assert.equal(trained.combo, 2);
  assert.equal(trained.bossHP, 8);
  assert.equal(trained.rng, classic.rng);
  assert.deepEqual(trained.pending, classic.pending);
  const next = punch(trained, false);
  assert.equal(next.last.turn, 7);
  assert.equal(next.last.burst, true);
});

test('an early formal dodge settles on the first fresh press and costs exactly one HP', () => {
  const wind = firstPounce({trained: true});
  assert.equal(wind.phase, 'pounce-wind');
  const at = wind.pounce.opensAt - 10;
  for (const options of [{side: 'X'}, {side: 'L', repeat: true}, {side: 'R', id: 16}]) {
    assert.equal(act(wind, 'STRIKE', {...options, now: at}), wind);
  }
  const failed = act(wind, 'STRIKE', {side: 'L', now: at});
  assert.equal(failed.playerHP, 9);
  assert.equal(failed.history, wind.history);
  assert.equal(failed.combo, wind.combo);
  assert.equal(act(failed, 'STRIKE', {side: 'R', now: at + 1}), failed);
  assert.equal(signal(failed, 'POUNCE_CUE', at + 1000), failed);
  assert.equal(signal(failed, 'POUNCE_TIMEOUT', at + 2000), failed);
  assert.equal(signal(failed, 'POUNCE_DONE', failed.pounce.recoveryEndsAt - 1), failed);
  const ready = done(failed);
  assert.equal(ready.phase, 'ready');
  assert.equal(ready.playerHP, 9);
  assert.deepEqual(ready.dodgeHistory, [{afterTurn: 6, side: 'L', outcome: 'early', training: false, damage: 1}]);
});

test('either side dodges while the cue is open, and a late event cannot beat the timeout', () => {
  const wind = firstPounce({trained: true});
  const cue = open(wind);
  assert.equal(cue.phase, 'pounce-open');
  const deadline = cue.pounce.expiresAt;
  assert.ok(deadline > wind.pounce.opensAt);
  assert.equal(signal(cue, 'POUNCE_TIMEOUT', deadline - 1), cue);
  for (const side of ['L', 'R']) {
    const pass = act(cue, 'STRIKE', {side, now: deadline - 0.1});
    assert.equal(pass.pounce.outcome, 'evaded');
    assert.equal(pass.playerHP, 10);
    assert.equal(pass.bossHP, 8);
    assert.equal(signal(pass, 'POUNCE_TIMEOUT', deadline), pass);
  }
  for (const timestamp of [deadline, deadline + 200]) {
    const miss = act(cue, 'STRIKE', {side: 'R', now: timestamp});
    assert.equal(miss.pounce.outcome, 'late');
    assert.equal(miss.playerHP, 9);
    assert.equal(signal(miss, 'POUNCE_TIMEOUT', timestamp + 1), miss);
  }
  const missed = signal(cue, 'POUNCE_TIMEOUT', deadline);
  assert.equal(missed.pounce.outcome, 'late');
  assert.equal(missed.pounce.side, null);
  assert.equal(act(missed, 'STRIKE', {side: 'R', now: deadline + 1}), missed);
});

test('a delayed eye-opening callback still leaves time for the visible dodge cue', () => {
  const wind = firstPounce({trained: true});
  const shownAt = wind.pounce.opensAt + 6000;
  const cue = signal(wind, 'POUNCE_CUE', shownAt);
  assert.ok(cue.pounce.expiresAt > shownAt);
  assert.equal(act(cue, 'STRIKE', {side: 'R', now: shownAt + 1}).pounce.outcome, 'evaded');
});

test('slow mode holds the open eye until input, and restoring normal speed grants a fresh window', () => {
  const cue = open(firstPounce({trained: true}));
  const old = cue.pounce.serial;
  const slow = act(cue, 'SET_SLOW', {value: true, now: cue.pounce.opensAt + 1});
  assert.equal(slow.slowDodge, true);
  assert.equal(slow.pounce.expiresAt, null);
  const muchLater = cue.pounce.expiresAt + 60000;
  assert.equal(signal(slow, 'POUNCE_TIMEOUT', muchLater), slow);
  assert.equal(act(slow, 'STRIKE', {side: 'R', now: muchLater}).pounce.outcome, 'evaded');
  const timed = act(slow, 'SET_SLOW', {value: false, now: muchLater});
  assert.ok(timed.pounce.expiresAt > muchLater);
  assert.equal(act(timed, 'POUNCE_TIMEOUT', {serial: old, now: timed.pounce.expiresAt}), timed);
  assert.equal(signal(timed, 'POUNCE_TIMEOUT', timed.pounce.expiresAt).playerHP, 9);
  const slowFromStart = open(firstPounce({trained: true, slow: true}));
  assert.equal(slowFromStart.pounce.expiresAt, null);
});

test('pausing windup or flight discards old deadlines and always shows a fresh windup', () => {
  const wind = firstPounce({trained: true});
  for (const active of [wind, open(wind)]) {
    const old = active.pounce.serial;
    const paused = act(active, 'PAUSE', {now: 62200});
    assert.equal(paused.phase, 'paused');
    assert.equal(act(paused, 'STRIKE', {side: 'L', now: 65000}), paused);
    assert.equal(signal(paused, 'POUNCE_CUE', 65000), paused);
    assert.equal(signal(paused, 'POUNCE_TIMEOUT', 65000), paused);
    const resumed = act(paused, 'RESUME', {now: 90000});
    assert.equal(resumed.phase, 'pounce-wind');
    assert.ok(resumed.pounce.opensAt > 90000);
    assert.notEqual(resumed.pounce.serial, old);
    assert.equal(act(resumed, 'POUNCE_CUE', {serial: old, now: 99900}), resumed);
    const cue = open(resumed);
    assert.equal(act(cue, 'POUNCE_TIMEOUT', {serial: old, now: 99900}), cue);
    assert.equal(cue.playerHP, 10);
    assert.equal(cue.dodgeHistory.length, 0);
  }
});

test('pausing with a tutorial key held gives the player a fresh ready prompt on return', () => {
  const held = act(firstPounce(), 'STRIKE', {side: 'R', now: 60120});
  const paused = act(held, 'PAUSE', {now: 60125});
  const resumed = act(paused, 'RESUME', {now: 90000});
  assert.equal(resumed.phase, 'pounce-intro');
  assert.equal(act(resumed, 'RELEASE', {side: 'R', now: 90001}), resumed);
  assert.equal(practiceWind(resumed, 90010).phase, 'pounce-wind');
});

test('pausing a settled hit cannot re-arm it, duplicate damage, or let the old recovery timer finish', () => {
  const wind = firstPounce({trained: true});
  const hit = act(wind, 'STRIKE', {side: 'L', now: wind.pounce.opensAt - 10});
  const paused = act(hit, 'PAUSE', {now: hit.pounce.recoveryEndsAt - 1});
  const resumed = act(paused, 'RESUME', {now: 90000});
  assert.equal(resumed.phase, 'pounce-recovery');
  assert.equal(resumed.pounce.outcome, 'early');
  assert.equal(resumed.playerHP, 9);
  assert.equal(resumed.dodgeHistory, hit.dodgeHistory);
  assert.equal(act(resumed, 'POUNCE_DONE', {serial: hit.pounce.serial, now: 99999}), resumed);
  assert.equal(done(resumed).playerHP, 9);
});

test('the sixth counter opens the supply first and resuming it plays exactly one queued pounce', () => {
  const supply = Array(6).fill(true).reduce(punch, fresh({trained: true}));
  assert.equal(supply.phase, 'supply');
  assert.equal(supply.playerHP, 6);
  assert.equal(supply.pending, null);
  assert.equal(supply.pounce, null);
  assert.equal(act(supply, 'POUNCE_TIMEOUT', {serial: 1, now: 70000}), supply);
  const wind = takeSupply(supply);
  assert.equal(wind.phase, 'pounce-wind');
  assert.equal(wind.playerHP, 8);
  const ready = done(evade(wind));
  assert.equal(ready.phase, 'ready');
  assert.equal(ready.history.length, 6);
  assert.equal(ready.dodgeHistory.length, 1);
  assert.equal(act(ready, 'CONTINUE_SUPPLY', {now: 68000}), ready);
});

test('when the pounce itself reaches half health, the supply returns to the next punch', () => {
  const wind = [true, true, true, true, true, false].reduce(punch, fresh({trained: true}));
  assert.equal(wind.playerHP, 7);
  const miss = act(wind, 'STRIKE', {side: 'R', now: wind.pounce.opensAt - 10});
  const supply = done(miss);
  assert.equal(supply.phase, 'supply');
  assert.equal(supply.playerHP, 6);
  const ready = takeSupply(supply, 'safe', miss.pounce.recoveryEndsAt + 1);
  assert.equal(ready.phase, 'ready');
  assert.equal(ready.playerHP, 8);
  assert.equal(ready.history.length, 6);
  const seventh = punch(ready, true);
  assert.equal(seventh.history.length, 7);
  assert.equal(seventh.dodgeHistory.length, 1);
  assert.equal(duelReport(seventh).playerDamage, 7);
  assert.equal(duelReport(seventh).playerHealed, 2);
});

test('a KO on the twelfth punch takes priority over its scheduled pounce', () => {
  const supply = Array(6).fill(true).reduce(punch, fresh({trained: true}));
  const ready = done(evade(takeSupply(supply, 'risky')));
  const lost = Array(6).fill(true).reduce(punch, ready);
  assert.equal(lost.phase, 'finished');
  assert.equal(lost.playerHP, 0);
  assert.equal(lost.winner, 'boss');
  assert.deepEqual(lost.dodgeHistory.map(row => row.afterTurn), [6]);
  assert.equal(lost.pending, null);
});

test('a formal pounce can cause the final KO and the report charges it outside the punch counts', () => {
  const supply = Array(6).fill(true).reduce(punch, fresh({trained: true}));
  const ready = done(evade(takeSupply(supply, 'risky')));
  const wind = [false, true, true, true, true, true].reduce(punch, ready);
  assert.equal(wind.playerHP, 1);
  const cue = open(wind);
  const lost = done(signal(cue, 'POUNCE_TIMEOUT', cue.pounce.expiresAt));
  assert.equal(lost.phase, 'finished');
  assert.equal(lost.playerHP, 0);
  assert.equal(lost.winner, 'boss');
  assert.equal(lost.pending, null);
  const report = duelReport(lost);
  assert.equal(report.turns, 12);
  assert.equal(report.correct, 11);
  assert.equal(report.accuracy, 11 / 12);
  assert.equal(report.playerDamage, 12);
  assert.equal(report.bossDamage, 1);
  assert.equal(report.playerHealed, 0);
});

test('rematches start at full health with a fresh read and skip practice only when already learned', () => {
  const passed = done(evade(practiceWind(firstPounce())));
  const restart = act(passed, 'START', {id: 18, seed: 395, trained: passed.trainedDodge, slow: true, now: 0});
  assert.equal(restart.playerHP, 12);
  assert.equal(restart.bossHP, 12);
  assert.equal(restart.pending.pLeft, 0.5);
  assert.equal(restart.slowDodge, true);
  assert.deepEqual(restart.history, []);
  assert.deepEqual(restart.dodgeHistory, []);
  assert.equal(act(restart, 'STRIKE', {id: 17, side: 'L', now: 400}), restart);
  const next = [true, false, true, false, true, false].reduce(punch, restart);
  assert.equal(next.phase, 'pounce-wind');
  assert.equal(act(next, 'POUNCE_CUE', {id: 17, serial: next.pounce.serial, now: next.pounce.opensAt}), next);
  assert.equal(firstPounce({trained: false}).phase, 'pounce-intro');
});
