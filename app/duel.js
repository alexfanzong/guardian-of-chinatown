import {gameReducer, newMatch, summarize} from './game.js';

const POUNCE_INTERVAL = 6;
const GUARD_INTERVAL = 12;
const GUARD_TURN = 4;
const WINDUP_MS = 900;
const OPEN_MS = 850;
const RECOVERY_MS = 650;

export function newDuel(seed, id, {trained = false, slow = false} = {}) {
  return {
    ...newMatch(seed, id), encounter: 'ordinary', trainedDodge: trained, slowDodge: slow,
    dodgeHistory: [], pounce: null, pounceSerial: 0,
  };
}

// Each restart owns its timers, even if it replays the same turn in the same match.
function arm(state, phase, pounce) {
  const serial = state.pounceSerial + 1;
  return {...state, phase, resumePhase: null, pounceSerial: serial, pounce: {...pounce, serial}};
}

function beginPounce(state, now, wind = state.trainedDodge) {
  return arm(state, wind ? 'pounce-wind' : 'pounce-intro', {
    training: !state.trainedDodge,
    opensAt: wind ? now + WINDUP_MS : null,
    expiresAt: null, recoveryEndsAt: null, side: null, outcome: null,
  });
}

function advance(state, action) {
  const next = gameReducer(state, action);
  if (next === state || next.phase !== 'ready') return next;

  // Only a live fight released from its impact or supply can start another move.
  // Defer the next punch's RNG step and locked read until the pounce is over.
  const turn = state.history.length;
  if (turn % POUNCE_INTERVAL === 0 && state.dodgeHistory.at(-1)?.afterTurn !== turn) {
    return beginPounce(state, action.now);
  }
  const encounter = turn % GUARD_INTERVAL === GUARD_TURN - 1 ? 'guard' : 'ordinary';
  return {...next, encounter};
}

function settle(state, outcome, side, now) {
  const {training} = state.pounce;
  const damage = training || outcome === 'evaded' ? 0 : 1;
  const row = {afterTurn: state.history.length, side, outcome, training, damage};
  return {
    ...state, phase: 'pounce-recovery', playerHP: state.playerHP - damage,
    trainedDodge: state.trainedDodge || outcome === 'evaded',
    dodgeHistory: [...state.dodgeHistory, row],
    pounce: {...state.pounce, side, outcome, recoveryEndsAt: now + RECOVERY_MS},
  };
}

function strike(state, action) {
  const {side, repeat, now} = action;
  if (repeat || (side !== 'L' && side !== 'R')) return state;
  switch (state.phase) {
    case 'ready': {
      const next = gameReducer(state, action);
      if (next === state) return state;
      const last = {...next.last, guarded: state.encounter === 'guard'};
      return {...next, last, history: [...state.history, last]};
    }
    case 'pounce-intro':
      return {...state, phase: 'pounce-held', pounce: {...state.pounce, side}};
    case 'pounce-wind':
      return settle(state, 'early', side, now);
    case 'pounce-open': {
      const {opensAt, expiresAt} = state.pounce;
      if (now < opensAt) return settle(state, 'early', side, now);
      if (expiresAt !== null && now >= expiresAt) return settle(state, 'late', side, now);
      return settle(state, 'evaded', side, now);
    }
    default:
      return state;
  }
}

function onTimer(state, {type, serial, now}) {
  const {pounce, phase} = state;
  if (!pounce || serial !== pounce.serial) return state;
  switch (type) {
    case 'POUNCE_CUE':
      if (phase !== 'pounce-wind' || now < pounce.opensAt) return state;
      // A late frame still gives the player a full window after the eye actually opens.
      return {...state, phase: 'pounce-open', pounce: {
        ...pounce, opensAt: now, expiresAt: state.slowDodge ? null : now + OPEN_MS,
      }};
    case 'POUNCE_TIMEOUT':
      if (phase !== 'pounce-open' || pounce.expiresAt === null || now < pounce.expiresAt) return state;
      return settle(state, 'late', null, now);
    case 'POUNCE_DONE': {
      if (phase !== 'pounce-recovery' || now < pounce.recoveryEndsAt) return state;
      if (pounce.training && pounce.outcome !== 'evaded') return beginPounce(state, now);
      // Use the same KO, supply and next-punch rules as a settled punch.
      const combat = {...state, phase: 'resolving', pounce: null};
      return advance(combat, {type: 'FINISH', id: state.id, turn: state.history.length, now});
    }
    default:
      return state;
  }
}

function resume(state, action) {
  if (state.phase !== 'paused') return state;
  switch (state.resumePhase) {
    case 'pounce-intro':
    case 'pounce-held':
      return beginPounce(state, action.now, false);
    case 'pounce-wind':
    case 'pounce-open':
      return beginPounce(state, action.now, true);
    case 'pounce-recovery':
      return arm(state, 'pounce-recovery', {...state.pounce, recoveryEndsAt: action.now + RECOVERY_MS});
    default:
      return gameReducer(state, action);
  }
}

function setSlow(state, {value, now}) {
  if (typeof value !== 'boolean' || value === state.slowDodge) return state;
  const next = {...state, slowDodge: value};
  if (state.phase !== 'pounce-open') return next;
  return arm(next, 'pounce-open', {...state.pounce, expiresAt: value ? null : now + OPEN_MS});
}

/** All times come from the UI's monotonic clock. Match IDs and serials scope delayed input. */
export function duelReducer(state, action) {
  if (action.type === 'START') {
    return newDuel(action.seed, action.id, {trained: action.trained, slow: action.slow});
  }
  if (!state || !Number.isFinite(action.now)) return state;
  const menu = action.type === 'PAUSE' || action.type === 'RESUME' || action.type === 'SET_SLOW';
  if (action.id !== state.id && !(menu && action.id === undefined)) return state;

  switch (action.type) {
    case 'STRIKE':
      return strike(state, action);
    case 'RELEASE':
      if (state.phase !== 'pounce-held' || action.side !== state.pounce.side) return state;
      return beginPounce(state, action.now, true);
    case 'FINISH':
    case 'CONTINUE_SUPPLY':
      return advance(state, action);
    case 'SUPPLY':
      return gameReducer(state, action);
    case 'POUNCE_CUE':
    case 'POUNCE_TIMEOUT':
    case 'POUNCE_DONE':
      return onTimer(state, action);
    case 'PAUSE':
      if (state.phase.startsWith('pounce-')) return {...state, phase: 'paused', resumePhase: state.phase};
      return gameReducer(state, action);
    case 'RESUME':
      return resume(state, action);
    case 'SET_SLOW':
      return setSlow(state, action);
    default:
      return state;
  }
}

export function duelReport(state) {
  const report = summarize(state);
  const dodgeDamage = state.dodgeHistory.reduce((sum, row) => sum + row.damage, 0);
  return {...report, playerDamage: report.playerDamage + dodgeDamage};
}
