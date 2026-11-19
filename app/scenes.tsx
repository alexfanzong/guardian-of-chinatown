import {useEffect, useRef} from 'react';

const STORY = [
  {chapter:'CHINATOWN · AFTER DARK',title:'The lanterns are fading.',text:'A creature has claimed the street. Every challenger leaves defeated. The shops are closing early.'},
  {chapter:'THE MIND READER',title:'It knows your old tricks.',text:'A repeated step. The same familiar punch. It watches your habits, then moves as if it knows your mind.'},
  {chapter:'TONIGHT, YOU STEP FORWARD',title:'Give them their street back.',text:'Break its predictions. Keep it guessing. The people of Chinatown are counting on you.'},
];

export function Story({step,onNext,onSkip,onHelp,onResearch}) {
  const next=useRef(null);
  useEffect(()=>{next.current?.focus({preventScroll:true});},[step]);
  const beat=STORY[step];
  return <div className={`story-overlay story-beat-${step}`}>
    <button className="story-skip text-button" onClick={onSkip}>Skip intro ↗</button>
    <div className="story-heading"><p className="eyebrow">GUARDIAN OF CHINATOWN</p><h1>{beat.title}</h1></div>
    <div className="story-caption" key={step}><p className="eyebrow">{beat.chapter}</p><p className="story-copy">{beat.text}</p>
      <div className="story-actions"><span className="story-progress" aria-label={`Story ${step+1} of 3`}>{[0,1,2].map(i=><i key={i} className={i===step?'current':''}/>)}</span><button className="pixel-button" onClick={onNext} ref={next}>{step===2?'DEFEND THE STREET':'CONTINUE'} <span aria-hidden="true">→</span></button></div>
      <div className="story-extra"><button className="text-button story-help" onClick={onHelp}>A / D or tap either side · How to play</button><button className="text-button story-help" onClick={onResearch}>The experiment ↗</button></div>
    </div>
  </div>;
}

function ItemIcon({kind}) {
  return <svg className="item-icon" viewBox="0 0 80 80" aria-hidden="true" shapeRendering="crispEdges">
    {kind==='tea'?<>
      <path d="M25 8h4v8h-4v8h-4V14h4zm15-4h4v8h-4v9h-4V10h4zm15 4h4v8h-4v8h-4V14h4z" fill="#d8eee1"/>
      <path d="M12 31h56v8h-4v13h-5v7H21v-7h-5V39h-4z" fill="#172738"/>
      <path d="M17 35h46v6h-4v12h-5v3H26v-3h-5V41h-4z" fill="#73bdb0"/>
      <path d="M20 36h40v6H20z" fill="#bec68a"/><path d="M25 48h29v4H25z" fill="#bbe5ca"/>
      <path d="M9 61h62v5H9zM18 66h44v5H18z" fill="#d5c59e"/>
    </>:<>
      <path d="M33 4h14v10H33z" fill="#e5c48c"/><path d="M30 14h20v6h5v16l-7 5h9l8 12v15l-9 8H24l-9-8V53l8-12h9l-7-5V20h5z" fill="#202338"/>
      <path d="M33 18h14l4 4v12l-9 8 13 4 6 10v10l-8 6H27l-8-6V56l6-10 13-4-9-8V22z" fill="#b17b35"/>
      <path d="M33 22h6v10h-6zM25 53h7v12h-7z" fill="#ebc875"/>
      <path d="M27 35h26v6H27zM39 40h5v20h-5zM44 44h8v5h-8z" fill="#e65858"/>
      <path d="M34 61h15v5H34z" fill="#713c38"/>
    </>}
  </svg>;
}

export function Supply({match,onChoose,onContinue}) {
  const box=useRef(null);
  useEffect(()=>{box.current?.querySelector('button')?.focus({preventScroll:true});},[match.phase]);
  function keepFocus(event) {
    if(event.repeat&&['Enter',' '].includes(event.key)){event.preventDefault();return;}
    if(event.key!=='Tab')return;
    const buttons=Array.from(box.current.querySelectorAll('button:not([disabled])'));
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  const choosing=match.phase==='supply';
  return <div className="supply-overlay" ref={box} role="dialog" aria-modal="true" aria-labelledby="supply-title" onKeyDown={keepFocus}>
    <div className="supply-content">
      <p className="eyebrow">A GIFT FROM THE INNKEEPER</p><h2 id="supply-title">A little help from Chinatown.</h2>
      {choosing?<>
        <p className="supply-story">A red-silk pouch lands at your feet.<br/>“Choose wisely. We only have one.”</p>
        <div className="supply-choices">
          <button onClick={()=>onChoose('safe')} className="supply-choice safe-tea" aria-label="Steady Tea — restore 2 HP"><ItemIcon kind="tea"/><strong>STEADY TEA</strong><span>Restore 2 HP</span><small>Guaranteed</small></button>
          <button onClick={()=>onChoose('risky')} className="supply-choice lucky-elixir" aria-label="Lucky Elixir — 50% chance of 5 HP"><ItemIcon kind="elixir"/><strong>LUCKY ELIXIR</strong><span>50%: +5 HP</span><small>50%: +0 HP</small></button>
        </div><p className="supply-footnote">Once per fight. Your choice. No punches while you decide.</p>
      </>:<div className="supply-reveal" role="status"><ItemIcon kind={match.supply.choice==='safe'?'tea':'elixir'}/><strong className="heal-number">+{match.supply.heal} HP</strong><p>{match.supply.choice==='safe'?'A warm cup. A steady hand.':match.supply.heal>0?'A little luck from Lantern Street.':'Just water this time. That was the risk.'}</p><button className="pixel-button" onClick={onContinue}>BACK TO THE FIGHT →</button></div>}
    </div>
  </div>;
}

export function Celebration({onSkip}) {
  const skip=useRef(null);
  useEffect(()=>{skip.current?.focus({preventScroll:true});},[]);
  return <div className="celebration-overlay">
    <div className="celebration-heading" role="status"><p className="eyebrow">YOU BROKE ITS READ.</p><h2>CHINATOWN IS SAFE.</h2><p>The lanterns shine again.</p></div>
    <div className="crowd-cheer cheer-left" aria-hidden="true">THANK YOU!</div><div className="crowd-cheer cheer-right" aria-hidden="true">OUR STREET!</div>
    <div className="confetti" aria-hidden="true">{Array.from({length:20},(_,i)=><i key={i} style={{left:`${(i*23)%94+3}%`,animationDelay:`${(i%7)*.12}s`,background:['#ffcd69','#eb665b','#a4d9c2'][i%3]}}/>)}</div>
    <button className="text-button celebration-skip" onClick={onSkip} ref={skip}>See results →</button>
  </div>;
}
