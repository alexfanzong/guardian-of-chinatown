import {useEffect, useReducer, useRef, useState} from 'react';
import {gameReducer, MAX_HP, summarize} from './game.js';
import {createSound} from './sound.js';
import {Story, Supply, Celebration} from './scenes.tsx';
import {ExperimentResults} from './ExperimentResults.tsx';
import {MatchChart} from './MatchChart.tsx';
import {encodeMatch} from './matchcode.js';
import street from './street.webp';
import fighters from './fighters.png';
import victorySprite from './victory.png';
import './App.css';

const sideName = side => side === 'L' ? 'left' : 'right';
const pct = value => `${Math.round(value * 100)}%`;
/** What the monster believed just before this punch, in plain words. */
const sureText = round => round.pLeft === 0.5 ? 'It had no idea: 50–50.' : `It was ${pct(round.confidence)} sure of ${sideName(round.prediction)}.`;

function Sprite({who, pose=0}) {
  return <div role="img" aria-label={who === 'hero' ? 'The martial-arts heroine' : 'The purple mind-reading monster'} className="sprite"
    style={{backgroundImage:`url(${fighters})`,backgroundPosition:`${pose * 100 / 3}% ${who === 'hero' ? 0 : 100}%`}} />;
}

function Health({name, hp, boss=false}) {
  return <div className={`health ${boss ? 'boss-health' : ''}`}>
    <div className="health-name"><strong>{name}</strong></div>
    <div className="health-track" role="meter" aria-label={`${name} health`} aria-valuemin={0} aria-valuemax={MAX_HP} aria-valuenow={hp}>
      {Array.from({length:MAX_HP},(_,i)=><i key={i} className={i < hp ? 'filled' : ''} />)}
    </div><span className="hp-number">{hp} / {MAX_HP}</span>
  </div>;
}

export default function App() {
  const [match, dispatch] = useReducer(gameReducer, null);
  const [stage, setStage] = useState(0);
  const [panel, setPanel] = useState(null);
  const [sound, setSound] = useState(false);
  const [storyStep, setStoryStep] = useState(0);
  const [endingDoneId, setEndingDoneId] = useState(null);
  const [copied, setCopied] = useState('');
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const serial = useRef(0);
  const soundPlayer = useRef(null);
  const lastSound = useRef('');
  const dialog = useRef(null);
  const resultButton = useRef(null);
  const ready = match?.phase === 'ready';
  const finished = match?.phase === 'finished';
  const paused = match?.phase === 'paused';
  const victory = finished && match?.winner === 'player';
  const celebrating = victory && endingDoneId !== match.id && !reduced;
  const supplyOpen = ['supply','supply-reveal'].includes(match?.phase);
  const inFight = ['ready','resolving','paused'].includes(match?.phase);
  const resolving = match?.phase === 'resolving' || (paused && match.resumePhase === 'resolving');
  const last = match?.last;
  const report = match ? summarize(match) : null;

  function start() { setPanel(null); setEndingDoneId(null); dispatch({type:'START',seed:Math.floor(Math.random()*4294967296),id:++serial.current}); }
  function advanceStory(){if(storyStep<2)setStoryStep(step=>step+1);else start();}
  function chooseSupply(choice){dispatch({type:'SUPPLY',id:match.id,choice,roll:choice==='risky'?Math.random():undefined});}
  function strike(side, repeat=false) { dispatch({type:'STRIKE',side,repeat}); }
  function pause() { dispatch({type:paused ? 'RESUME' : 'PAUSE'}); }
  function openPanel(name) { if (match && !finished) dispatch({type:'PAUSE'}); setCopied(''); setPanel(name); }
  function copyCode(code) {
    const failed=()=>setCopied('Could not copy. Select the code and copy it by hand.');
    try { navigator.clipboard.writeText(code).then(()=>setCopied('Copied.'),failed); } catch { failed(); }
  }
  function toggleSound() {
    if (sound) {soundPlayer.current?.close();soundPlayer.current=null;setSound(false);}
    else {soundPlayer.current=createSound();setSound(Boolean(soundPlayer.current));}
  }

  useEffect(() => {
    if (match?.phase !== 'resolving') return;
    setStage(0);
    const step=setTimeout(()=>setStage(1),260);
    const end=setTimeout(()=>dispatch({type:'FINISH',id:match.id,turn:match.history.length}),last?.burst?1120:900);
    return ()=>{clearTimeout(step);clearTimeout(end);};
  },[match?.phase,match?.id,match?.history.length]);

  useEffect(() => {
    if (!last || !match) return;
    const key=`${match.id}:${last.turn}`;
    if(lastSound.current===key)return;
    lastSound.current=key;soundPlayer.current?.play(last.correct,last.burst);
  },[match?.id,last]);
  useEffect(()=>()=>soundPlayer.current?.close(),[]);
  useEffect(()=>{
    if(!celebrating)return;
    const id=match.id;
    const end=setTimeout(()=>setEndingDoneId(id),3000);
    return ()=>clearTimeout(end);
  },[celebrating,match?.id]);
  useEffect(()=>{
    if(match?.phase==='supply-reveal')soundPlayer.current?.play(match.supply.heal===0,match.supply.heal===5);
  },[match?.phase,match?.supply]);

  useEffect(() => {
    const onKey=event=>{
      if(event.metaKey||event.ctrlKey||event.altKey||panel)return;
      if(['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
      const key=event.key.toLowerCase();
      if(event.repeat&&['enter',' '].includes(key)&&event.target.tagName==='BUTTON'){event.preventDefault();return;}
      if(!match){
        if(event.repeat)return;
        if(key==='escape'){event.preventDefault();start();}
        else if(['enter',' '].includes(key)&&event.target.tagName!=='BUTTON'){event.preventDefault();advanceStory();}
        return;
      }
      if(['a','d','arrowleft','arrowright'].includes(key)) {
        event.preventDefault();strike(key==='a'||key==='arrowleft'?'L':'R',event.repeat);
      } else if(key==='escape'&&!event.repeat&&!finished){event.preventDefault();pause();}
    };
    const onVisibility=()=>{if(document.hidden)dispatch({type:'PAUSE'});};
    window.addEventListener('keydown',onKey);document.addEventListener('visibilitychange',onVisibility);
    return ()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('visibilitychange',onVisibility);};
  },[panel,match?.phase,finished,storyStep]);
  useEffect(()=>{
    if(!dialog.current)return;
    if(panel){
      if(!dialog.current.open)dialog.current.showModal();
      dialog.current.scrollTop=0;
      dialog.current.querySelector('button')?.focus({preventScroll:true});
    }else if(dialog.current.open)dialog.current.close();
  },[panel]);
  useEffect(()=>{if(finished&&!celebrating)resultButton.current?.focus({preventScroll:true});},[finished,celebrating]);

  const heroPose=resolving?(last?.correct&&stage===1?3:last?.side==='L'?1:2):finished&&match.winner==='boss'?3:0;
  const bossPose=resolving?(last?.correct?(stage===0?1:2):3):finished&&match.winner==='player'?3:0;
  const heat=match?.pending?.eyeHeat??last?.eyeHeat??0;
  const verdict=last?.burst?'MIND BREAK!':last?.correct?'READ YOU!':'GOTCHA!';

  return <main className={`game-shell ${reduced?'reduce-motion':''}`}>
    <section className={`arena ${!match?`intro story-${storyStep}`:''} ${victory?'victory-scene':''} ${celebrating?'celebrating':''} ${paused?'is-paused':''} ${resolving?`exchange ${last?.correct?'blocked':'hit'} ${last?.burst?'burst':''} stage-${stage}`:''}`} aria-label="Chinatown fighting arena">
      <img className="street" src={street} alt="Lantern-lit Chinatown, with Qingyun Inn and Chinese café signs"/><div className="scene-shade"/>
      <div className="hud" aria-hidden={!match||celebrating}><Health name="YOU" hp={match?.playerHP??12}/><div className="round-counter"><span>{!match?'READY?':finished?'FINAL':'ROUND'}</span><strong>{!match?'VS':finished?'KO':String(match.history.length+(match.pending?1:0)).padStart(2,'0')}</strong></div><Health name="MIND READER" hp={match?.bossHP??12} boss/></div>
      <div className="fighter hero-fighter"><div className="ground-shadow"/>{victory?<img className="victory-sprite" src={victorySprite} alt="The heroine raises her fist to celebrate"/>:<Sprite who="hero" pose={heroPose}/>}</div>
      <div className="fighter boss-fighter"><div className="ground-shadow"/><Sprite who="boss" pose={bossPose}/></div>
      {resolving&&<div key={`${match.id}:${last.turn}:${stage}`} aria-hidden="true" className={`impact-word ${last.correct?'word-block':''}`}>{verdict}<small>{last.burst?`${last.damage} DAMAGE`:last.correct?'BLOCK + COUNTER':'YOU BROKE THE READ'}</small></div>}

      <button className="arena-touch touch-left" onClick={()=>strike('L')} disabled={!ready||Boolean(panel)} aria-label="Left punch (A)"/>
      <button className="arena-touch touch-right" onClick={()=>strike('R')} disabled={!ready||Boolean(panel)} aria-label="Right punch (D)"/>

      {!match&&<Story step={storyStep} onNext={advanceStory} onSkip={start} onHelp={()=>openPanel('help')} onResearch={()=>openPanel('experiment')}/>}
      {supplyOpen&&<Supply key={match.id} match={match} onChoose={chooseSupply} onContinue={()=>dispatch({type:'CONTINUE_SUPPLY',id:match.id})}/>}
      {victory&&<div className="victory-glow" aria-hidden="true"/>}
      {celebrating&&<Celebration onSkip={()=>setEndingDoneId(match.id)}/>}
      {paused&&!panel&&<div className="pause-overlay"><div className="pause-content"><p className="eyebrow">TAKE A BREATH</p><h2>FIGHT PAUSED</h2><button className="pixel-button" onClick={pause}>RESUME FIGHT</button><div className="pause-options"><button className="setting-button" onClick={toggleSound} aria-pressed={sound}>{sound?'Sound on':'Sound off'}</button><button className="setting-button" onClick={()=>setReduced(v=>!v)} aria-pressed={reduced}>{reduced?'Motion: low':'Motion: full'}</button></div><div className="pause-links"><button className="text-button" onClick={start}>Restart</button><button className="text-button" onClick={()=>openPanel('help')}>How to play</button><button className="text-button" onClick={()=>openPanel('model')}>How it thinks</button><button className="text-button" onClick={()=>openPanel('experiment')}>The experiment</button></div></div></div>}
      {finished&&!celebrating&&<div className="result-overlay"><div className={`result-content ${victory?'victory':''}`}><p className="eyebrow">{victory?'THE LANTERNS SHINE AGAIN':'THE STREET STILL NEEDS YOU'}</p><h2>{victory?'CHINATOWN IS SAFE.':"THE NIGHT ISN'T OVER."}</h2><p>{victory?'The shops reopen. The neighbors step outside.':'Catch your breath. Change your rhythm. Try again.'}</p><div className="result-stats"><span><strong>{report.turns}</strong>exchanges</span><span><strong>{report.correct}/{report.turns}</strong>reads correct</span><span><strong>{report.bursts}</strong>mind breaks</span></div>{match.supply&&<p className="supply-summary">{match.supply.choice==='safe'?'Steady Tea':'Lucky Elixir'}: +{match.supply.heal} HP</p>}<div className="result-actions"><button className="pixel-button" onClick={start} ref={resultButton}>PLAY AGAIN</button><button className="outline-button" onClick={()=>openPanel('report')}>See the reads</button></div><p className="small-note">The monster guessed {pct(report.accuracy)} of your punches. Try a new rhythm in your next fight.</p><button className="text-button" onClick={()=>openPanel('model')}>How it thinks</button><button className="text-button" onClick={()=>openPanel('experiment')}>The experiment</button></div></div>}
      {inFight&&<div className="arena-bottom"><div className="combo-meter" aria-label={`Mind break charge: ${match.combo} of 3`}><span>MIND BREAK</span><div>{[0,1,2].map(i=><b key={i} className={i<match.combo?'charged':''}/>)}</div></div><button className="arena-pause" onClick={pause} aria-label={paused?'Resume fight':'Pause fight'}>{paused?'▶':'Ⅱ'}</button><div className="read-meter"><span className="eye" aria-hidden="true" style={{opacity:0.45+heat*0.55}}>◉</span><div><span>{heat<.15?'GUESSING':heat<.5?'READING':'CONFIDENT'}</span><div className="heat-track"><i style={{width:`${heat*100}%`}}/></div></div></div></div>}
      {inFight&&!paused&&<div className="in-scene-hint" role="status" aria-live="polite">{resolving?`${sureText(last)} ${last.burst?'Mind broken!':last.correct?'Blocked.':'You fooled it.'}`:(match.history.length<3?'A / D · Or tap either side':'The next read is locked.')}</div>}
    </section>

    <dialog ref={dialog} className={`info-dialog ${panel==='experiment'?'research-dialog':''}`} onCancel={()=>setPanel(null)} onClose={()=>setPanel(null)} aria-labelledby="dialog-title" onClick={e=>{if(e.target===dialog.current)setPanel(null);}}>
      <button className="dialog-close" onClick={()=>setPanel(null)} aria-label="Close dialog">×</button>
      {panel==='experiment'&&<ExperimentResults/>}
      {panel==='help'&&<><p className="eyebrow">TWO MOVES. ONE MIND TO BREAK.</p><h2 id="dialog-title">A little less predictable.</h2><ol className="rules-list"><li><strong>Choose a punch.</strong> Press A or D, the arrow keys, or tap the left/right half of the scene. Take your time.</li><li><strong>Break its read.</strong> The monster locks its guess first. A wrong read costs it 1 HP. A correct read blocks and counters for 1 HP.</li><li><strong>Chain three feints.</strong> Fool it three times in a row: the third punch deals up to 2 damage. Getting read breaks the chain.</li><li><strong>Change your habits.</strong> It learns from your earlier moves. Both fighters start with 12 HP; a rematch clears its memory.</li></ol><p className="dialog-note">Escape or the pause icon opens settings. Sound is optional. Lower motion removes screen shake.</p><button className="pixel-button" onClick={()=>setPanel(null)}>GOT IT</button></>}
      {panel==='model'&&<><p className="eyebrow">HOW IT THINKS</p><h2 id="dialog-title">It learns your habits.</h2><p>The monster looks at your recent punches and checks what usually came next after the same last one or two moves. With too few examples, it uses your overall balance of left and right punches.</p><p>It starts at 50–50, remembers up to 32 punches, and locks its guess before you choose. After each punch, it updates what it has learned.</p><p>Its percentage is an estimate, so a high number can still be wrong. The third eye shows how strongly the evidence favors one side.</p><p className="dialog-note">A rematch gives the monster a fresh start.</p></>}
      {panel==='report'&&match&&<><p className="eyebrow">THE READS, REVEALED</p><h2 id="dialog-title">Your fight, punch by punch.</h2><p>You threw {report.left} left punches and {report.right} right punches. The monster guessed {report.correct} of {report.turns} correctly ({pct(report.accuracy)}).</p><MatchChart history={match.history}/><div className="match-code"><label htmlFor="match-code">Fight code</label><div><input id="match-code" readOnly value={encodeMatch(match.history)} onFocus={e=>e.target.select()}/><button className="outline-button" onClick={()=>copyCode(encodeMatch(match.history))}>Copy</button></div><p role="status">{copied||'Copy the code to keep this fight.'}</p></div><div className="record-scroll"><table><caption>Predictions committed before each punch</caption><thead><tr><th>Turn</th><th>Your punch</th><th>Its read</th><th>P(left)</th><th>Result</th></tr></thead><tbody>{match.history.map(r=><tr key={r.turn}><td>{r.turn}</td><td>{sideName(r.side)}</td><td>{sideName(r.prediction)}</td><td>{pct(r.pLeft)}</td><td>{r.correct?'Counter −1':r.burst?`Mind break −${r.damage}`:`Hit −${r.damage}`}</td></tr>)}</tbody></table></div><p className="dialog-note">A coin averages 50% over many punches. A short fight can land above or below that.</p></>}
    </dialog>
  </main>;
}
