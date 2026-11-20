import test from 'node:test';
import assert from 'node:assert/strict';
import {innkeeperTip} from '../app/innkeeper.js';
import {newDuel,duelReducer} from '../app/duel.js';

const match = (history = [], dodgeHistory = []) => ({history, dodgeHistory, playerHP: 4, bossHP: 0, winner: 'player'});
const punch = (side, correct, guarded=false) => ({side, correct, guarded, prediction: correct ? side : side === 'L' ? 'R' : 'L'});

test('a recurring follow-up uses only observed transitions and their real blocks', () => {
  const h = [punch('L',false),punch('R',true),punch('L',false),punch('R',true),punch('L',false),punch('R',false)];
  const s=match(h);
  const en=innkeeperTip(s,'en'), zh=innkeeperTip(s,'zh');
  assert.equal(en.key,'follow-LR');assert.equal(zh.key,en.key);
  assert.match(en.body,/2 of your 3/);assert.match(zh.body,/3 次.*2 次/);
  assert.deepEqual(innkeeperTip(s,'en'),en);
});
test('pounce advice distinguishes an early key from a timeout and a successful dodge', () => {
  const base = {afterTurn:6,training:false,damage:1};
  for(const [outcome, key] of [['early','early'],['late','late']]) {
    const end = {...match([], [{...base,outcome}]),playerHP:0,winner:'boss'};
    assert.equal(innkeeperTip(end,'en').key,key);
  }
  const clean=match([], [{...base,damage:0,outcome:'evaded'}]);
  assert.equal(innkeeperTip(clean,'zh').key,'dodged');
});
test('a guard counter tip is supported by a punch against a visible guard; short runs get plain advice',()=>{
  assert.equal(innkeeperTip(match([punch('R',false,true)]),'en').key,'open-side');
  assert.equal(innkeeperTip(match([punch('R',false)]),'en').key,'start');
});
test('tea and elixir tips use the supply actually chosen and never promise a win',()=>{
  const s={...match([punch('R',false)]),supply:{choice:'risky',heal:0}};
  assert.equal(innkeeperTip(s,'zh').key,'empty-gourd');
  assert.equal(innkeeperTip({...s,supply:null},'zh').key,'start');
});

function fullFight(keepItClose) {
  let s=newDuel(3,1,{trained:true}),now=0;
  const go=(type,fields={})=>{s=duelReducer(s,{id:s.id,type,now:++now,...fields});};
  for(let step=0;s.phase!=='finished' && step<300;step++){
    if(s.phase==='ready'){
      const block=keepItClose && s.history.length<12 && s.history.length%2===0;
      go('STRIKE',{side:block?s.pending.prediction:(s.pending.prediction==='L'?'R':'L')});
    } else if(s.phase==='resolving')go('FINISH',{turn:s.history.length});
    else if(s.phase==='supply')go('SUPPLY',{choice:'safe'});
    else if(s.phase==='supply-reveal')go('CONTINUE_SUPPLY');
    else if(s.phase==='pounce-wind'){now=s.pounce.opensAt;go('POUNCE_CUE',{serial:s.pounce.serial});}
    else if(s.phase==='pounce-open')go('STRIKE',{side:'L'});
    else if(s.phase==='pounce-recovery'){now=s.pounce.recoveryEndsAt;go('POUNCE_DONE',{serial:s.pounce.serial});}
    else throw new Error('Unexpected phase '+s.phase);
  }
  assert.equal(s.phase,'finished');assert.ok(s.history.some(r=>r.guarded));
  return s;
}
test('an actual fight that ends with multiple bursts can award the finisher tip',()=>{
  const s=fullFight(false);assert.ok(s.history.filter(r=>r.burst).length>=2);
  assert.equal(innkeeperTip(s,'en').key,'burst');
});
test('two live dodges can earn their own tip even in a completed fight with palm guards',()=>{
  const s=fullFight(true);assert.ok(s.dodgeHistory.filter(r=>!r.training&&r.outcome==='evaded').length>=2);
  assert.equal(innkeeperTip(s,'zh').key,'dodged');
});
