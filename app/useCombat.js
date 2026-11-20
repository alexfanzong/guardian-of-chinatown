import {useEffect, useRef, useState} from 'react';

const mapping = {a:'L',d:'R',arrowleft:'L',arrowright:'R'};

export function useFightKeys(match, panel, dispatch) {
  const live = useRef(null);
  const held = useRef(new Set());
  live.current = {match,panel};
  useEffect(()=>{
    held.current.clear();
  },[match?.id]);
  useEffect(()=>{
    const pressed=held.current;
    const send=(type,side)=> {
      const {match,panel}=live.current;
      if (!match || panel) return;
      dispatch({type,side,id:match.id,now:performance.now()});
    };
    const down=e=>{
      const {match,panel}=live.current;
      if (!match || panel || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)) return;
      const key=e.key.toLowerCase();
      if (key==='escape' && !e.repeat) {
        e.preventDefault(); send(match.phase==='paused'?'RESUME':'PAUSE'); return;
      }
      if (e.repeat && ['enter',' '].includes(key) && e.target?.tagName==='BUTTON') {e.preventDefault();return;}
      const side=mapping[key];
      if (!side || ['finished','paused','supply','supply-reveal'].includes(match.phase)) return;
      e.preventDefault();
      if (e.repeat || pressed.has(key)) return;
      pressed.add(key); send('STRIKE',side);
    };
    const up=e=>{
      const key=e.key.toLowerCase();
      if (pressed.delete(key) && mapping[key]) send('RELEASE',mapping[key]);
    };
    const hide=()=>{
      if (!live.current.match) return;
      pressed.clear();dispatch({type:'PAUSE',id:live.current.match.id,now:performance.now()});
    };
    const visibility=()=>{if(document.hidden)hide();};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    window.addEventListener('blur',hide);document.addEventListener('visibilitychange',visibility);
    return ()=>{
      window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);
      window.removeEventListener('blur',hide);document.removeEventListener('visibilitychange',visibility);
    };
  },[dispatch]);
}

function scheduleAt(deadline, callback) {
  if (!Number.isFinite(deadline)) return ()=>{};
  let timer;
  const tick=()=>{
    const now=performance.now();
    if(now<deadline){timer=setTimeout(tick,Math.max(1,Math.ceil(deadline-now)));return;}
    callback(now);
  };
  timer=setTimeout(tick,Math.max(0,Math.ceil(deadline-performance.now())));
  return ()=>clearTimeout(timer);
}

export function useChoreography(match, dispatch) {
  const [stage, setStage] = useState({id:0,turn:0,beat:0});
  const id=match?.id, phase=match?.phase, turn=match?.history.length, last=match?.last;
  useEffect(()=>{
    if(phase!=='resolving') return;
    const beats=last.burst?[130,275,575,1080]:last.correct?[110,265,495,800]:
      last.side==='R'?[155,285,480,770]:[85,195,370,660];
    setStage({id,turn,beat:0});
    const timers=beats.slice(0,3).map((ms,i)=>setTimeout(()=>setStage({id,turn,beat:i+1}),ms));
    timers.push(setTimeout(()=>dispatch({type:document.hidden?'PAUSE':'FINISH',id,turn,now:performance.now()}),beats[3]));
    return ()=>timers.forEach(clearTimeout);
  },[phase,id,turn,last?.burst,last?.correct,last?.side,dispatch]);
  const pounce=match?.pounce;
  useEffect(()=>{
    const clock={
      'pounce-wind':['POUNCE_CUE',pounce?.opensAt],
      'pounce-open':['POUNCE_TIMEOUT',pounce?.expiresAt],
      'pounce-recovery':['POUNCE_DONE',pounce?.recoveryEndsAt],
    }[phase];
    if (!clock || !pounce) return;
    const serial=pounce.serial;
    return scheduleAt(clock[1], now=>dispatch({type:document.hidden?'PAUSE':clock[0],id,serial,now}));
  },[phase,id,pounce?.serial,pounce?.opensAt,pounce?.expiresAt,pounce?.recoveryEndsAt,dispatch]);
  return stage.id===id && stage.turn===turn ? stage.beat : 0;
}
