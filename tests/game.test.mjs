import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newMatch, gameReducer, estimateLeft, summarize, betaBelief} from '../app/game.js';

const opposite = side => side === 'L' ? 'R' : 'L';
const finish = state => gameReducer(state, {type:'FINISH', id:state.id, turn:state.history.length});
function play(state, side) {
  let next=finish(gameReducer(state,{type:'STRIKE',side}));
  if(next.phase==='supply') {
    next=gameReducer(next,{type:'SUPPLY',id:next.id,choice:'safe'});
    next=gameReducer(next,{type:'CONTINUE_SUPPLY',id:next.id});
  }
  return next;
}

function reachSupply(seed=1,id=1) {
  let state=newMatch(seed,id);
  for(let i=0;i<6;i++) state=finish(gameReducer(state,{type:'STRIKE',side:state.pending.prediction}));
  return state;
}

test('a supply appears once at half HP and stops punches and stale animations',()=>{
  const state=reachSupply();
  assert.equal(state.phase,'supply');
  assert.equal(state.playerHP,6);
  assert.equal(state.history.length,6);
  assert.equal(state.pending,null);
  assert.equal(gameReducer(state,{type:'STRIKE',side:'L'}),state);
  assert.equal(finish(state),state);
});

test('safe tea restores two HP once and never changes combat history',()=>{
  const state=reachSupply();
  const selected=gameReducer(state,{type:'SUPPLY',id:state.id,choice:'safe'});
  assert.equal(selected.phase,'supply-reveal');
  assert.equal(selected.playerHP,8);
  assert.equal(selected.supply.heal,2);
  assert.equal(selected.supplyUsed,true);
  assert.deepEqual(selected.history,state.history);
  assert.equal(gameReducer(selected,{type:'SUPPLY',id:state.id,choice:'safe'}),selected);
  let resumed=gameReducer(selected,{type:'CONTINUE_SUPPLY',id:state.id});
  assert.equal(resumed.phase,'ready');
  assert.equal(resumed.pending.pLeft,estimateLeft(state.history).pLeft);
  for(let i=0;i<3;i++)resumed=play(resumed,resumed.pending.prediction);
  assert.equal(resumed.phase,'ready');
  assert.equal(resumed.playerHP,5);
  assert.equal(summarize(resumed).playerDamage,9);
  assert.equal(summarize(resumed).playerHealed,2);
});

test('the elixir is exactly a 50/50 threshold and the reveal cannot be rerolled',()=>{
  const state=reachSupply();
  const win=gameReducer(state,{type:'SUPPLY',id:state.id,choice:'risky',roll:0.499999});
  const miss=gameReducer(state,{type:'SUPPLY',id:state.id,choice:'risky',roll:0.5});
  assert.equal(win.playerHP,11);assert.equal(win.supply.heal,5);
  assert.equal(miss.playerHP,6);assert.equal(miss.supply.heal,0);
  assert.equal(gameReducer(miss,{type:'SUPPLY',id:state.id,choice:'risky',roll:0}),miss);
  assert.equal(gameReducer(state,{type:'SUPPLY',id:state.id,choice:'risky',roll:1}),state);
  assert.equal(gameReducer(state,{type:'SUPPLY',id:state.id,choice:'risky',roll:NaN}),state);
  assert.equal(gameReducer(state,{type:'SUPPLY',id:state.id,choice:'unknown'}),state);
});

test('supply choices cannot cross matches, exceed max HP, or revive a KO',()=>{
  const state=reachSupply(3,10);
  assert.equal(gameReducer(state,{type:'SUPPLY',id:9,choice:'safe'}),state);
  const capped=gameReducer({...state,playerHP:11},{type:'SUPPLY',id:10,choice:'risky',roll:0});
  assert.equal(capped.playerHP,12);assert.equal(capped.supply.heal,1);
  const restarted=gameReducer(state,{type:'START',seed:44,id:11});
  assert.equal(restarted.supplyUsed,false);
  assert.equal(gameReducer(restarted,{type:'CONTINUE_SUPPLY',id:10}),restarted);
  let dead=newMatch(5,3);
  dead={...dead,playerHP:1};
  dead=finish(gameReducer(dead,{type:'STRIKE',side:dead.pending.prediction}));
  assert.equal(dead.phase,'finished');
  assert.equal(gameReducer(dead,{type:'SUPPLY',id:3,choice:'safe'}),dead);
});

test('Beta starts neutral and reflects the lecture example of three successes and one failure',()=>{
  const prior=betaBelief(1,1);
  assert.equal(prior.mean,.5);
  assert.ok(Math.abs(prior.leftBiasProbability-.5)<1e-12);
  assert.equal(prior.eyeHeat,0);
  const posterior=betaBelief(4,2);
  assert.ok(Math.abs(posterior.mean-2/3)<1e-12);
  assert.ok(Math.abs(posterior.leftBiasProbability-0.8125)<1e-12);
});

test('a sharper belief around 50/50 never implies ability to predict a fair next punch',()=>{
  const belief=betaBelief(17,17);
  assert.equal(belief.mean,.5);
  assert.ok(Math.abs(belief.leftBiasProbability-.5)<1e-12);
  assert.equal(belief.eyeHeat,0);
  assert.ok(belief.variance<betaBelief(1,1).variance);
});

test('at the same estimated preference, more evidence strengthens but does not guarantee the read',()=>{
  const few=betaBelief(3,2), more=betaBelief(12,8);
  assert.equal(few.mean,more.mean);
  assert.ok(more.leftBiasProbability>few.leftBiasProbability);
  assert.ok(more.eyeHeat>few.eyeHeat && more.eyeHeat<1);
  assert.ok(more.variance<few.variance);
  const reversed=betaBelief(8,12);
  assert.ok(Math.abs(more.leftBiasProbability+reversed.leftBiasProbability-1)<1e-12);
});

test('a match starts with 12 HP and a committed, uninformed prediction', () => {
  const state = newMatch(42, 1);
  assert.equal(state.phase, 'ready');
  assert.equal(state.playerHP, 12);
  assert.equal(state.bossHP, 12);
  assert.equal(state.pending.pLeft, 0.5);
  assert.ok(['L','R'].includes(state.pending.prediction));
  assert.equal(state.history.length, 0);
});

test('either current input receives the same previously committed prediction', () => {
  const state = newMatch(85, 3);
  const before = JSON.stringify(state);
  const left = gameReducer(state, {type:'STRIKE', side:'L'});
  const right = gameReducer(state, {type:'STRIKE', side:'R'});
  assert.equal(left.history[0].prediction, right.history[0].prediction);
  assert.equal(left.history[0].pLeft, right.history[0].pLeft);
  assert.equal(left.history[0].prediction, state.pending.prediction);
  assert.equal(left.history[0].correct, !right.history[0].correct);
  assert.equal(JSON.stringify(state), before);
});

test('a correct read blocks and counters once; duplicate input does nothing', () => {
  const state = newMatch(7, 1);
  const next = gameReducer(state, {type:'STRIKE', side:state.pending.prediction});
  assert.equal(next.playerHP, 11);
  assert.equal(next.bossHP, 12);
  assert.equal(next.phase, 'resolving');
  assert.equal(gameReducer(next, {type:'STRIKE', side:'R'}), next);
  assert.equal(next.history.length, 1);
});

test('three consecutive successful feints deal 1 + 1 + 2 and reset the combo', () => {
  let state = newMatch(5, 1);
  for (let i=0; i<3; i++) state=play(state, opposite(state.pending.prediction));
  assert.equal(state.bossHP, 8);
  assert.equal(state.playerHP, 12);
  assert.equal(state.combo, 0);
  assert.deepEqual(state.history.map(r=>r.damage), [1,1,2]);
  assert.deepEqual(state.history.map(r=>r.burst), [false,false,true]);
});

test('being read interrupts the feint chain', () => {
  let state=newMatch(1,1);
  state=play(state, opposite(state.pending.prediction));
  state=play(state, state.pending.prediction);
  assert.equal(state.combo,0);
  state=play(state, opposite(state.pending.prediction));
  assert.equal(state.combo,1);
  assert.equal(state.history.at(-1).burst,false);
});

test('pause retains a pending read and blocks all combat until resume', () => {
  const state=newMatch(3,1);
  const paused=gameReducer(state,{type:'PAUSE'});
  assert.equal(paused.phase,'paused');
  assert.deepEqual(paused.pending,state.pending);
  assert.equal(gameReducer(paused,{type:'STRIKE',side:'L'}),paused);
  assert.equal(finish(paused),paused);
  const resumed=gameReducer(paused,{type:'RESUME'});
  assert.equal(resumed.phase,'ready');
  assert.deepEqual(resumed.pending,state.pending);
});

test('pausing during an impact never reapplies damage on resume', () => {
  const state=newMatch(4,1);
  const hit=gameReducer(state,{type:'STRIKE',side:opposite(state.pending.prediction)});
  const paused=gameReducer(hit,{type:'PAUSE'});
  assert.equal(finish(paused),paused);
  const ready=finish(gameReducer(paused,{type:'RESUME'}));
  assert.equal(ready.bossHP,11);
  assert.equal(ready.history.length,1);
  assert.equal(ready.phase,'ready');
});

test('stale animation completions do not advance another turn or another match', () => {
  const state=newMatch(1,8);
  const hit=gameReducer(state,{type:'STRIKE',side:'L'});
  assert.equal(gameReducer(hit,{type:'FINISH',id:7,turn:1}),hit);
  assert.equal(gameReducer(hit,{type:'FINISH',id:8,turn:0}),hit);
  const reset=gameReducer(hit,{type:'START',seed:22,id:9});
  assert.equal(gameReducer(reset,{type:'FINISH',id:8,turn:1}),reset);
  assert.equal(reset.history.length,0);
  assert.equal(reset.playerHP,12);
  assert.equal(reset.pending.pLeft,0.5);
});

test('KO clamps health at zero and permanently stops that match', () => {
  let state=newMatch(9,1);
  while(state.phase!=='finished') state=play(state,opposite(state.pending.prediction));
  assert.equal(state.bossHP,0);
  assert.equal(state.winner,'player');
  assert.equal(state.pending,null);
  assert.equal(gameReducer(state,{type:'STRIKE',side:'L'}),state);
  assert.equal(finish(state),state);
  const report=summarize(state);
  assert.equal(report.correct,0);
  assert.equal(report.turns,9);
  assert.equal(report.bursts,3);
  assert.equal(report.bossDamage,12);
});

test('14 counters after the safe supply end the fight and the report counts actual damage', () => {
  let state=newMatch(2,1);
  while(state.phase!=='finished') state=play(state,state.pending.prediction);
  assert.equal(state.playerHP,0);
  assert.equal(state.winner,'boss');
  assert.equal(summarize(state).correct,14);
  assert.equal(summarize(state).playerDamage,14);
  assert.equal(summarize(state).playerHealed,2);
  assert.equal(summarize(state).accuracy,1);
});

test('a final mind break reports only the remaining HP as actual damage', () => {
  let state=newMatch(77,1);
  for(let i=0;i<7;i++) state=play(state,opposite(state.pending.prediction));
  state=play(state,state.pending.prediction);
  for(let i=0;i<3;i++) state=play(state,opposite(state.pending.prediction));
  assert.equal(state.phase,'finished');
  assert.equal(state.last.burst,true);
  assert.equal(state.last.damage,1);
  assert.equal(summarize(state).bossDamage,12);
});

test('invalid actions and held-repeat metadata cannot create extra turns', () => {
  const state=newMatch(11,1);
  assert.equal(gameReducer(state,{type:'STRIKE',side:'X'}),state);
  assert.equal(gameReducer(state,{type:'STRIKE',side:'L',repeat:true}),state);
  assert.equal(gameReducer(state,{type:'FINISH',id:1,turn:0}),state);
});

test('probabilities are bounded and contexts are backed by actual prior occurrences', () => {
  assert.equal(estimateLeft([]).pLeft,0.5);
  const lefts=Array.from({length:20},()=>({side:'L'}));
  const read=estimateLeft(lefts);
  assert.equal(read.context,'LL');
  assert.ok(read.total>=3);
  assert.ok(read.pLeft>0.9 && read.pLeft<=0.95);
  assert.equal(read.left,read.total);
  assert.ok(estimateLeft(Array.from({length:100},()=>({side:'R'}))).pLeft>=0.05);
});

test('the same seed and moves replay identically', () => {
  let a=newMatch(99,2), b=newMatch(99,2);
  for(const side of ['L','L','R','L','R','R']) {a=play(a,side);b=play(b,side);}
  assert.deepEqual(a,b);
});

test('independent random inputs stay near chance across many simulated matches', () => {
  let correct=0, turns=0;
  for(let n=0;n<600;n++) {
    let state=newMatch(n+100, n);
    for(let t=0;state.phase!=='finished';t++) {
      const byte=createHash('sha256').update(`independent-player:${n}:${t}`).digest()[0];
      state=play(state,byte<128?'L':'R');
    }
    const report=summarize(state);correct+=report.correct;turns+=report.turns;
  }
  assert.ok(turns>9000);
  assert.ok(correct/turns>0.47 && correct/turns<0.53, `accuracy=${correct/turns}`);
});

test('a repeatedly identical move is learnable without reading the current move', () => {
  let correct=0, turns=0;
  for(let n=0;n<30;n++) {
    let state=newMatch(n+1000,n);
    while(state.phase!=='finished') state=play(state,'L');
    const report=summarize(state);correct+=report.correct;turns+=report.turns;
  }
  assert.ok(correct/turns>0.8);
});
