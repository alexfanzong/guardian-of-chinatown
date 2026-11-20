import {useEffect, useRef, useState} from 'react';
import {encodeMatch} from './matchcode.js';
import {innkeeperTip} from './innkeeper.js';
import {handName, localized} from './language.js';

export function LanguageButton({lang,onLang}) {
  return <button type="button" className="lang-button" lang={lang==='en'?'zh-CN':'en'}
    aria-label={lang==='en'?'Switch to Chinese':'切换到英文'}
    onClick={()=>onLang(lang==='en'?'zh':'en')}>{lang==='en'?'中文':'English'}</button>;
}

export function TipSlip({match,lang}) {
  const tip=innkeeperTip(match,lang);
  return <aside className="tip-slip" data-tip={tip.key} aria-label={localized(lang,'The Innkeeper’s Tip','掌柜的锦囊')}>
    <span className="tip-seal" aria-hidden="true">锦</span>
    <div><p className="tip-byline">{localized(lang,'THE INNKEEPER’S TIP','掌柜的锦囊')}</p>
    <h3>{tip.title}</h3><p className="tip-body">{tip.body}</p></div>
  </aside>;
}

export function Results({match,report,lang,onLang,onAgain,onLog}) {
  const primary=useRef(null);
  useEffect(()=>{primary.current?.focus({preventScroll:true});},[]);
  const t=(en,zh)=>localized(lang,en,zh),won=match.winner==='player';
  return <div className="result-overlay v2-result" role="region" aria-label={t('Fight result','对战结果')}>
    <div className={'result-content '+(won?'victory':'')}>
      <div className="result-top"><p className="eyebrow">{won?t('LANTERNS RELIT','青云客栈'):t('A MOMENT AT THE INN','青云客栈')}</p><LanguageButton lang={lang} onLang={onLang}/></div>
      <h2>{won?t('CHINATOWN IS SAFE.','唐人街守住了。'):t('THE NIGHT ISN’T OVER.','先喘口气。')}</h2>
      <p>{won?t('The neighbors open their doors again.','街坊们又敢开门了。'):t('The innkeeper sets a cup beside you.','掌柜给你倒了杯热茶。')}</p>
      <div className="result-stats"><span><strong>{report.turns}</strong>{t('punches','拳')}</span>
        <span><strong>{report.bursts}</strong>{t('mind breaks','次破心')}</span>
        <span><strong>{match.dodgeHistory.filter(row=>!row.training&&row.outcome==='evaded').length}</strong>{t('live dodges','次躲过飞扑')}</span></div>
      <TipSlip match={match} lang={lang}/>
      <div className="result-actions"><button type="button" className="pixel-button" ref={primary} onClick={onAgain}>{t('PLAY AGAIN','再来一局')}</button>
        <button type="button" className="text-button" onClick={onLog}>{t('Fight log','本局记录')}</button></div>
    </div>
  </div>;
}

export function PauseMenu({lang,onLang,onResume,onRestart,onHelp,onTip,sound,reduced,slow,onSound,onMotion,onSlow}) {
  const ref=useRef(null), t=(en,zh)=>localized(lang,en,zh);
  useEffect(()=>{ref.current?.focus({preventScroll:true});},[]);
  return <div className="pause-overlay v2-pause" role="dialog" aria-modal="true" aria-labelledby="pause-title" onKeyDown={trapTab}>
    <div className="pause-content">
      <h2 id="pause-title">{t('FIGHT PAUSED','歇会儿')}</h2>
      <button type="button" ref={ref} className="pixel-button" onClick={onResume}>{t('RESUME FIGHT','接着打')}</button>
      <div className="pause-options">
        <button className="setting-button" aria-pressed={sound} onClick={onSound}>{sound?t('Sound on','音效已开'):t('Sound off','音效已关')}</button>
        <button className="setting-button" aria-pressed={reduced} onClick={onMotion}>{reduced?t('Less motion','少些晃动'):t('Full motion','全部动画')}</button>
        <button className="setting-button" aria-pressed={slow} onClick={onSlow}>{slow?t('Patient dodge: on','慢练闪避 · 开'):t('Patient dodge: off','慢练闪避 · 关')}</button>
        <LanguageButton lang={lang} onLang={onLang}/>
      </div>
      <div className="pause-links"><button className="text-button" onClick={onHelp}>{t('Controls','出招说明')}</button>
        <button className="text-button" onClick={onTip}>{t('Innkeeper’s tip','看锦囊')}</button>
        <button className="text-button" onClick={onRestart}>{t('Start over','重开一局')}</button></div>
    </div>
  </div>;
}

function trapTab(event) {
  if(event.key!=='Tab') return;
  const buttons=Array.from(event.currentTarget.querySelectorAll('button:not([disabled])')) as HTMLButtonElement[];
  if(!buttons.length) return;
  const first=buttons[0],last=buttons[buttons.length-1];
  if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
}

function Help({lang}) {
  const t=(en,zh)=>localized(lang,en,zh);
  return <><h2 id="fight-dialog-title">{t('Two keys to defend the street','两键怎么打')}</h2>
    <dl className="fight-help">
      <dt>{t('Throw a punch','出拳')}</dt><dd>{t('A or ← throws a left. D or → throws a right. On a phone, tap that half of the street.','A 或 ← 出左拳，D 或 → 出右拳。手机上，点哪边就出哪边的拳。')}</dd>
      <dt>{t('Read its guard','看它防哪边')}</dt><dd>{t('When it raises a palm, the mark names the punch it is guarding. Hit with your other hand. Three clean punches in a row trigger Mind Break.','看拳印。它防左拳，你就打右拳。连着三拳没被挡住，就能使出「破心」，一掌把它挑飞。')}</dd>
      <dt>{t('Dodge the pounce','躲飞扑')}</dt><dd>{t('Wait for its third eye to open and its feet to lift, then tap either side. The first lesson is free. After that, an early tap or a missed cue costs one heart.','它还蹲着，先别动。等它睁开额头那只眼、双脚离地，再按左或右。第一回练到躲开为止。往后按早了、慢了，都掉 1 格血。')}</dd>
      <dt>{t('Take your time','想慢点练？')}</dt><dd>{t('Ordinary punches wait for you. In the pause menu, Patient dodge keeps the dodge cue open until you press.','平时出拳可以慢慢想。暂停时打开「慢练闪避」，它跳起来就会等你按键。')}</dd>
    </dl></>;
}

function FightLog({match,lang}) {
  const t=(en,zh)=>localized(lang,en,zh);
  const [copyState,setCopyState]=useState('');
  const code=encodeMatch(match.history);
  async function copy() {
    try { await navigator.clipboard.writeText(code);setCopyState('copied'); }
    catch { setCopyState('manual'); }
  }
  return <><h2 id="fight-dialog-title">{t('Your fight, punch by punch','这局怎么打的')}</h2>
    <div className="record-scroll"><table className="fight-log-table"><caption>{t('Each direction and percentage was estimated before your punch.','它在你出拳前先猜方向。把握是它当时的估计。')}</caption><thead><tr>
      {[t('#','拳'),t('You','你出'),t('It','它猜'),t('Sure','把握'),t('Result','结果')].map(x=><th key={x} scope="col">{x}</th>)}
    </tr></thead><tbody>{match.history.map(row=><tr key={row.turn}><td>{row.turn}</td><td aria-label={handName(row.side,lang)}>{lang==='en'?row.side:handName(row.side,lang)}</td><td aria-label={handName(row.prediction,lang)}>{lang==='en'?row.prediction:handName(row.prediction,lang)}</td>
      <td>{Math.round(row.confidence*100)}%</td>
      <td>{row.correct?t('Blocked','被挡'):row.burst?t('Mind Break','破心'):t('Hit','打中')}{row.guarded&&<small className="record-guard">{t('palm guard','架掌')}</small>}</td></tr>)}</tbody></table></div>
    {match.dodgeHistory.length>0&&<div className="dodge-log"><h3>{t('Pounces','飞扑记录')}</h3><ul>{match.dodgeHistory.map((row,i)=><li key={i}>
      {t('After punch '+row.afterTurn,'第 '+row.afterTurn+' 拳后')} · {row.training?t('practice','练招'):t('live','实战')} · {row.outcome==='evaded'?t('dodged','闪开'):row.outcome==='early'?t('early','早了'):t('late','慢了')}{row.damage?' −1 '+t('HP','格血'):''}</li>)}</ul></div>}
    <div className="match-code"><label htmlFor="fight-code">{t('Punch code (punches and reads only)','出拳码（只记你出的拳和它猜的方向）')}</label><div>
      <input id="fight-code" readOnly value={code} onFocus={e=>e.currentTarget.select()}/><button className="outline-button" onClick={copy}>{t('Copy','复制')}</button></div>
      {copyState&&<p role="status">{copyState==='copied'?t('Copied.','已复制。'):t('Select the code and use your device’s Copy command.','选中出拳码，用系统菜单复制。')}</p>}</div>
  </>;
}

export function FightDialog({name,onClose,match,lang,onLang}) {
  const ref=useRef(null);
  useEffect(()=>{
    const dialog=ref.current;
    if(!dialog.open)dialog.showModal();
    return ()=>{if(dialog.open)dialog.close();};
  },[]);
  const t=(en,zh)=>localized(lang,en,zh);
  return <dialog className="info-dialog fight-dialog" ref={ref} aria-labelledby="fight-dialog-title"
    onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="fight-dialog-inner">
      <div className="dialog-toolbar"><LanguageButton lang={lang} onLang={onLang}/><button className="setting-button" onClick={onClose}>{t('Close','关闭')}</button></div>
      {name==='help'?<Help lang={lang}/>:name==='log'?<FightLog match={match} lang={lang}/>:<>
        <h2 id="fight-dialog-title">{t('A word from the innkeeper','掌柜递来一张锦囊')}</h2><TipSlip match={match} lang={lang}/></>}
    </div>
  </dialog>;
}
