import {useEffect, useReducer, useRef, useState} from 'react';
import {MAX_HP} from './game.js';
import {duelReducer, duelReport} from './duel.js';
import {useChoreography, useFightKeys} from './useCombat.js';
import {handName, initialLanguage, localized} from './language.js';
import {createSound} from './sound.js';
import {IntroComic} from './IntroComic';
import {BattleActors} from './BattleActors';
import {Supply, Celebration} from './scenes';
import {PauseMenu, FightDialog, Results} from './FightPanels';
import street from './street.webp';
import './App.css';
import './duel-ui.css';
import './zh-pixel.css';

function Health({name,hp,boss=false,lang}) {
  return <div className={'health '+(boss?'boss-health':'')}>
    <div className="health-name"><strong>{name}</strong></div>
    <div className="health-track" role="meter" aria-label={name+localized(lang,' health','气血')} aria-valuemin={0} aria-valuemax={MAX_HP} aria-valuenow={hp}>
      {Array.from({length:MAX_HP},(_,i)=><i key={i} className={i<hp?'filled':''}/>)}
    </div><span className="hp-number">{hp} / {MAX_HP}</span>
  </div>;
}

function HitZone({side,lang,phase,disabled,onAction}) {
  const held=useRef(null);
  const t=(en,zh)=>localized(lang,en,zh), h=handName(side,lang);
  const dodging=phase==='pounce-wind'||phase==='pounce-open';
  const arming=phase==='pounce-intro'||phase==='pounce-held';
  const label=arming?t('Ready with '+side,'按'+h+'边准备'):dodging?t('Dodge '+handName(side,'en'),'往'+h+'闪'):t((side==='L'?'Left':'Right')+' punch',h+'拳');
  const key=side==='L'?'A':'D';
  return <button type="button" className={'arena-touch '+(side==='L'?'touch-left':'touch-right')}
    disabled={disabled} aria-label={label+' ('+key+')'} data-hand={side}
    onPointerDown={e=>{
      if((e.pointerType!=='touch'&&!e.isPrimary)||e.button!==0||held.current!==null)return;
      held.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);onAction('STRIKE',side);
    }}
    onPointerUp={e=>{
      if(held.current!==e.pointerId)return;
      held.current=null;onAction('RELEASE',side);
    }}
    onLostPointerCapture={e=>{
      // Disabling a target on a resolving hit can release capture before pointerup.
      if(held.current===e.pointerId)held.current=null;
    }}
    onPointerCancel={()=>{held.current=null;onAction('PAUSE');}}
    onClick={e=>{
      // Keyboard activation of a focused native button, or a screen reader action.
      if(e.detail===0){onAction('STRIKE',side);onAction('RELEASE',side);}
    }}/>;
}

function HandLabel({side,phase,lang,active}) {
  const name=handName(side,lang);
  const arming=phase==='pounce-intro'||phase==='pounce-held';
  const dodging=phase==='pounce-wind'||phase==='pounce-open';
  const text=arming?localized(lang,'Ready','准备'):dodging?localized(lang,'Dodge','闪'):localized(lang,name,name+'拳');
  return <span className="hud-hand" data-zone-label={side} aria-hidden="true" data-active={active}>
    <kbd>{side==='L'?'A':'D'}</kbd>{text}
  </span>;
}

function moveText(match,lang) {
  const t=(en,zh)=>localized(lang,en,zh), p=match.pounce;
  if(match.phase==='ready' && match.encounter==='guard') {
    if(match.history.some(row=>row.guarded))return null;
    const left=match.pending.prediction==='L';
    return {title:t('PALM GUARD','看它防哪边'),hint:left?t('Guarding LEFT. Your other hand is open.','它防左拳，打右拳！'):t('Guarding RIGHT. Your other hand is open.','它防右拳，打左拳！')};
  }
  switch(match.phase) {
    case 'pounce-intro':return {title:t('LEARN THE POUNCE','先练一招'),hint:t('Practice is free. Tap either side to get ready.','这回扑中也不掉血。按哪边都能开始。')};
    case 'pounce-held':return {title:t('READY?','松手，看脚下'),hint:t('Release. When its feet lift, tap either side to dodge.','它一离地，按哪边就往哪边闪。')};
    case 'pounce-wind':return {title:t('WATCH ITS FEET','看它的脚'),hint:t('Still crouching…','它还蹲着，先别动。')};
    case 'pounce-open':return {title:t('DODGE!','闪！'),hint:t('Eye open. Tap either side now!','它跳起来了，快按左或右！')};
    case 'pounce-recovery': {
      if(p.outcome==='evaded')return {title:t('IT MISSED!','它扑空了！'),hint:t('You slipped to the '+handName(p.side,'en')+'.','你向'+handName(p.side,'zh')+'闪开了。')};
      return {title:p.outcome==='early'?t('TOO EARLY','早了半拍'):t('TOO LATE','慢了半拍'),
        hint:p.training?t('Practice: no damage. Try the cue again.','练招不掉血，再试一次。'):t('−1 HP. The pounce caught you.','这一扑没躲开，掉了 1 格血。')};
    }
    default:return null;
  }
}

export default function App() {
  const [lang,setLang]=useState(()=>initialLanguage(window.location.search));
  const [match,dispatch]=useReducer(duelReducer,null);
  const [arriving,setArriving]=useState(false);
  const [panel,setPanel]=useState(null);
  const [sound,setSound]=useState(false);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [slow,setSlow]=useState(false);
  const [endingDone,setEndingDone]=useState(null);
  const serial=useRef(0), soundPlayer=useRef(null), lastSound=useRef(''), arena=useRef(null);
  const t=(en,zh)=>localized(lang,en,zh);
  const phase=match?.phase, turn=match?.history.length??0;
  const finished=phase==='finished', paused=phase==='paused';
  const victory=finished&&match.winner==='player';
  const celebrating=victory&&endingDone!==match.id&&!reduced;
  const supplyOpen=phase==='supply'||phase==='supply-reveal';
  const resolving=phase==='resolving'||(paused&&match.resumePhase==='resolving');
  const last=match?.last;
  const active=!!match&&!finished&&!paused&&!supplyOpen&&!panel;
  const acceptHand=active&&!arriving&&['ready','pounce-intro','pounce-held','pounce-wind','pounce-open'].includes(phase);
  const stage=useChoreography(match,dispatch);
  useFightKeys(match,arriving?'arrival':panel,dispatch);

  const interfaceLang=match?lang:'en';
  useEffect(()=>{
    document.documentElement.lang=interfaceLang==='zh'?'zh-CN':'en';
    document.title=localized(interfaceLang,'Guardian of Chinatown','守护唐人街');
  },[interfaceLang]);
  useEffect(()=>{
    if(!arriving)return;
    const timer=setTimeout(()=>setArriving(false),760);
    return ()=>clearTimeout(timer);
  },[arriving]);
  useEffect(()=>{if(match)arena.current?.focus({preventScroll:true});},[match?.id]);
  useEffect(()=>{
    if(!celebrating)return;
    const timer=setTimeout(()=>setEndingDone(match.id),2400);return ()=>clearTimeout(timer);
  },[celebrating,match?.id]);
  useEffect(()=>{
    if(!last||!match)return;
    const key=match.id+'-'+last.turn;
    if(lastSound.current===key)return;
    lastSound.current=key;soundPlayer.current?.play(last.correct,last.burst);
  },[match?.id,last]);
  useEffect(()=>{
    if(phase==='supply-reveal')soundPlayer.current?.play(match.supply.heal===0,match.supply.heal===5);
    if(phase==='pounce-open')soundPlayer.current?.signal?.();
  },[phase,match?.id,match?.pounce?.serial]);
  useEffect(()=>()=>soundPlayer.current?.close(),[]);

  function start() {
    setPanel(null);setEndingDone(null);
    dispatch({type:'START',id:++serial.current,seed:Math.floor(Math.random()*4294967296),
      trained:match?.trainedDodge??false,slow,now:performance.now()});
  }
  function enterStreet() {
    setArriving(!reduced);
    start();
  }
  const action=(type,side?)=>dispatch({type,side,id:match.id,now:performance.now()});
  function toggleSlow(){const value=!slow;setSlow(value);dispatch({type:'SET_SLOW',id:match.id,value,now:performance.now()});}
  function chooseSound(enabled) {
    if (!enabled) {
      soundPlayer.current?.close();
      soundPlayer.current=null;
    } else if (!soundPlayer.current) {
      soundPlayer.current=createSound();
    }
    setSound(!!soundPlayer.current);
  }
  const toggleSound=()=>chooseSound(!sound);
  if(!match)return <IntroComic onStart={enterStreet} onSoundChoice={chooseSound}/>;

  const message=moveText(match,lang);
  const silentGuard=phase==='ready'&&match.encounter==='guard'&&!message;
  const heat=match.pending?.eyeHeat??last?.eyeHeat??0;
  const impact=last?.burst?t('MIND BREAK!','破心！'):last?.correct?t('READ YOU!','让它猜着了！'):t('GOTCHA!','打中了！');
  const arenaClass=['arena v2-arena',arriving?'street-arriving':'',victory?'victory-scene':'',celebrating?'celebrating':'',paused?'is-paused':'',
    resolving?'exchange '+(last.correct?'blocked':'hit')+(last.burst?' burst':'')+' stage-'+stage:''].filter(Boolean).join(' ');
  return <main className={'game-shell '+(reduced?'reduce-motion':'')}>
    <section className={arenaClass} ref={arena} tabIndex={-1} data-phase={phase} data-turn={turn}
      aria-label={t('Chinatown fighting arena','唐人街擂台')}>
      <img className="street" src={street} alt={t('Lanterns outside Qingyun Inn on a Chinatown street','唐人街的青云客栈和满街灯笼')}/><div className="scene-shade"/>
      <div className="hud" aria-hidden={celebrating||undefined}>
        <Health name={t('YOU','女侠')} hp={match.playerHP} lang={lang}/>
        <div className="round-counter"><span>{finished?t('FINAL','收招'):t('PUNCH','出拳')}</span>
          <strong>{finished?'KO':String(turn+(phase==='ready'||(paused&&match.resumePhase==='ready')?1:0)).padStart(2,'0')}</strong></div>
        <Health name={t('MIND READER','读心怪')} hp={match.bossHP} lang={lang} boss/>
      </div>
      <BattleActors match={match} stage={stage} celebrating={celebrating} reduced={reduced}/>
      {victory&&<div className="victory-glow" aria-hidden="true"/>}
      {resolving&&!paused&&stage>0&&<div className={'impact-word '+(last.correct?'word-block':'')} aria-hidden="true" key={match.id+'-'+last.turn}>
        {impact}<small>{last.burst?t('RISING PALM','一掌挑飞'):last.correct?t('BLOCK + COUNTER','它还了一拳'):t('CLEAN HIT','钻了个空子')}</small></div>}
      {active&&message&&<div className={'move-sign '+(phase==='pounce-open'?'is-open':'')} role="status" aria-live="polite">
        <strong>{message.title}</strong><span>{message.hint}</span></div>}
      <p className="fight-reader-only" role="status" aria-live="polite" aria-atomic="true">
        {active&&silentGuard?t('Guarding '+handName(match.pending.prediction,'en')+'.','它防'+handName(match.pending.prediction,'zh')+'拳。'):''}
      </p>
      {!finished&&!supplyOpen&&!paused&&<><HitZone key={match.id+'L'} side="L" lang={lang} phase={phase} disabled={!acceptHand} onAction={action}/>
        <HitZone key={match.id+'R'} side="R" lang={lang} phase={phase} disabled={!acceptHand} onAction={action}/></>}
      {active&&<div className="arena-bottom">
        <HandLabel side="L" phase={phase} lang={lang} active={acceptHand}/>
        <HandLabel side="R" phase={phase} lang={lang} active={acceptHand}/>
        <div className="combo-meter" aria-label={t('Mind Break charge: ','破心蓄力 ')+match.combo+'/3'}><span>{t('MIND BREAK','破心')}</span><div>{[0,1,2].map(i=><b key={i} className={i<match.combo?'charged':''}/>)}</div></div>
        <button className="arena-pause" disabled={arriving} onClick={()=>action('PAUSE')} aria-label={t('Pause fight','暂停对战')}>Ⅱ</button>
        <div className="read-meter"><span className="eye" aria-hidden="true">◉</span><div>
          <span>{heat<.15?t('WATCHING','盯着你'):heat<.5?t('READING','摸着路了'):t('CONFIDENT','猜得准了')}</span>
          <div className="heat-track"><i style={{width:(45+heat*55)+'%'}}/></div></div></div>
      </div>}
      {active&&!message&&!silentGuard&&<div className="in-scene-hint" role="status" aria-live="polite">
        {resolving?(last.burst?t('Three clean punches. Mind Break!','连中三拳，把它挑飞了！'):last.correct?t('It caught your '+handName(last.side,'en')+'.','它挡住了你的'+handName(last.side,'zh')+'拳。'):t('You found an opening.','这一拳，它没防住。')):
          turn<2?t('A / D or tap either side','A 出左拳，D 出右拳。手机点左边或右边。'):t('Its guess is locked.','它猜好了。你出哪只手？')}</div>}
      {paused&&!panel&&<PauseMenu lang={lang} onLang={setLang} onResume={()=>action('RESUME')} onRestart={start}
        sound={sound} reduced={reduced} slow={slow} onSlow={toggleSlow} onSound={toggleSound} onMotion={()=>setReduced(v=>!v)}
        onHelp={()=>setPanel('help')} onTip={()=>setPanel('tip')}/>}
      {supplyOpen&&<Supply match={match} lang={lang} onLang={setLang} onChoose={choice=>dispatch({type:'SUPPLY',id:match.id,choice,roll:choice==='risky'?Math.random():undefined,now:performance.now()})}
        onContinue={()=>action('CONTINUE_SUPPLY')}/>}
      {celebrating&&<Celebration lang={lang} onSkip={()=>setEndingDone(match.id)}/>}
      {finished&&!celebrating&&<Results match={match} report={duelReport(match)} lang={lang} onLang={setLang} onAgain={start} onLog={()=>setPanel('log')}/>}
    </section>
    {panel&&<FightDialog name={panel} match={match} lang={lang} onLang={setLang} onClose={()=>setPanel(null)}/>}
  </main>;
}
