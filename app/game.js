/** Pure combat rules. No browser APIs and no access to the player's future input. */
export const MAX_HP = 12;
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

/** Beta posterior for integer observation counts; no new outcome is consumed here. */
export function betaBelief(alpha, beta) {
  const total=alpha+beta;
  const mean=alpha/total;
  // P(theta > 1/2) = P(Binomial(alpha+beta-1, 1/2) < alpha).
  const n=total-1;
  let logTerm=-n*Math.LN2, tail=0;
  for(let k=0;k<alpha;k++) {
    tail+=Math.exp(logTerm);
    logTerm+=Math.log(n-k)-Math.log(k+1);
  }
  const leftBiasProbability=clamp(tail,0,1);
  const evidence=Math.abs(2*leftBiasProbability-1);
  return {alpha,beta,mean,leftBiasProbability,variance:alpha*beta/(total*total*(total+1)),
    eyeHeat:evidence*Math.abs(2*mean-1)};
}

/** Conditional Bernoulli estimate, using only already-resolved moves. */
export function estimateLeft(history) {
  const moves = history.slice(-32).map(round => round.side);
  let observations = moves;
  let context = '';
  for (const length of [2, 1]) {
    if (moves.length < length) continue;
    const key = moves.slice(-length).join('');
    const matches = [];
    for (let i = length; i < moves.length; i++) {
      if (moves.slice(i - length, i).join('') === key) matches.push(moves[i]);
    }
    if (matches.length >= 3) { observations = matches; context = key; break; }
  }
  const left = observations.filter(side => side === 'L').length;
  const total = observations.length;
  const pLeft = clamp((left + 1) / (total + 2), 0.05, 0.95);
  return {...betaBelief(left+1,total-left+1),pLeft,left,total,context,kind:context?'sequence':total?'frequency':'guess'};
}

function commit(state) {
  const read = estimateLeft(state.history);
  const rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
  const prediction = read.pLeft === 0.5 ? (rng / 4294967296 < 0.5 ? 'L' : 'R') : read.pLeft > 0.5 ? 'L' : 'R';
  return {...state, rng, pending: {...read, prediction, confidence: Math.max(read.pLeft, 1 - read.pLeft)}};
}

export function newMatch(seed, id) {
  return commit({id, rng: seed >>> 0, phase:'ready', resumePhase:null, playerHP:MAX_HP, bossHP:MAX_HP,
    combo:0, history:[], pending:null, last:null, winner:null, supplyUsed:false, supply:null});
}

export function gameReducer(state, action) {
  if (action.type === 'START') return newMatch(action.seed, action.id);
  if (!state) return state;
  if (action.type === 'PAUSE' && ['ready','resolving'].includes(state.phase)) {
    return {...state, phase:'paused', resumePhase:state.phase};
  }
  if (action.type === 'RESUME' && state.phase === 'paused') {
    return {...state, phase:state.resumePhase, resumePhase:null};
  }
  if (action.type === 'SUPPLY') {
    if(state.phase!=='supply'||state.supplyUsed||action.id!==state.id||state.playerHP<=0) return state;
    if(!['safe','risky'].includes(action.choice)) return state;
    if(action.choice==='risky'&&(!Number.isFinite(action.roll)||action.roll<0||action.roll>=1)) return state;
    const offered=action.choice==='safe'?2:action.roll<.5?5:0;
    const heal=Math.min(MAX_HP-state.playerHP,offered);
    return {...state,phase:'supply-reveal',playerHP:state.playerHP+heal,supplyUsed:true,
      supply:{choice:action.choice,heal,offered,turn:state.history.length}};
  }
  if (action.type === 'CONTINUE_SUPPLY') {
    if(state.phase!=='supply-reveal'||action.id!==state.id) return state;
    return commit({...state,phase:'ready'});
  }
  if (action.type === 'STRIKE') {
    if (state.phase !== 'ready' || !state.pending || !['L','R'].includes(action.side) || action.repeat) return state;
    const read = state.pending;
    const correct = read.prediction === action.side;
    const streak = correct ? 0 : state.combo + 1;
    const burst = streak === 3;
    const damage = Math.min(correct ? state.playerHP : state.bossHP, burst ? 2 : 1);
    const playerHP = state.playerHP - (correct ? damage : 0);
    const bossHP = state.bossHP - (correct ? 0 : damage);
    const last = {...read, turn:state.history.length + 1, side:action.side, correct, burst, damage, playerHP, bossHP};
    return {...state, phase:'resolving', pending:null, playerHP, bossHP, combo:burst ? 0 : streak,
      last, history:[...state.history, last]};
  }
  if (action.type === 'FINISH') {
    if (state.phase !== 'resolving' || action.id !== state.id || action.turn !== state.history.length) return state;
    if (state.playerHP === 0 || state.bossHP === 0) {
      return {...state, phase:'finished', pending:null, winner:state.bossHP === 0 ? 'player' : 'boss'};
    }
    if(state.playerHP<=6&&!state.supplyUsed) return {...state,phase:'supply',pending:null};
    return commit({...state, phase:'ready'});
  }
  return state;
}

export function summarize(state) {
  const turns = state.history.length;
  const correct = state.history.filter(round => round.correct).length;
  const left = state.history.filter(round => round.side === 'L').length;
  return {turns, correct, accuracy:turns ? correct / turns : 0, left, right:turns - left,
    bursts:state.history.filter(round => round.burst).length,
    bossDamage:MAX_HP-state.bossHP,
    playerDamage:state.history.reduce((sum,round)=>sum+(round.correct?round.damage:0),0),
    playerHealed:state.supply?.heal??0};
}
