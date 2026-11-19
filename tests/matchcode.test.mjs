import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeMatch, decodeMatch} from '../app/matchcode.js';
import {newMatch, gameReducer} from '../app/game.js';

test('a fight code round-trips the punches and the locked reads of a real fight', () => {
  let state = newMatch(7, 1);
  const punches = 'LLRLRRLLLR';
  for (const side of punches) {
    if (state.phase !== 'ready') break;
    state = gameReducer(state, {type:'STRIKE', side});
    state = gameReducer(state, {type:'FINISH', id:1, turn:state.history.length});
  }
  const decoded = decodeMatch(encodeMatch(state.history));
  assert.equal(decoded.moves, state.history.map(r => r.side).join(''));
  assert.equal(decoded.predictions, state.history.map(r => r.prediction).join(''));
  assert.equal(decoded.moves.length, state.history.length);
});

test('broken fight codes are rejected instead of being half-read', () => {
  for (const bad of ['', 'GC1.LR.L', 'GC1.LX.LR', 'GC2.LR.LR', 'LR.LR', 'GC1.LR.LR.LR']) {
    assert.equal(decodeMatch(bad), null, bad);
  }
  assert.deepEqual(decodeMatch('  GC1.LR.RL \n'), {moves:'LR', predictions:'RL'});
});
