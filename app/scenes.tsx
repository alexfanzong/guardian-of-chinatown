import {useEffect, useRef} from 'react';

import {localized} from './language.js';

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

export function Supply({match,onChoose,onContinue,lang,onLang}) {
  const t=(en,zh)=>localized(lang,en,zh);
  const box=useRef(null);
  useEffect(()=>{box.current?.querySelector('[data-primary]')?.focus({preventScroll:true});},[match.phase]);
  function keepFocus(event) {
    if(event.repeat && ['Enter',' '].includes(event.key)) {event.preventDefault(); return;}
    if(event.key!=='Tab')return;
    const buttons=Array.from(box.current.querySelectorAll('button:not([disabled])'));
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  }
  const choosing=match.phase==='supply';
  return <div className="supply-overlay" ref={box} role="dialog" aria-modal="true" aria-labelledby="supply-title" onKeyDown={keepFocus}>
    <div className="supply-content">
      <button className="text-button supply-lang" lang={lang==='en'?'zh-CN':'en'} onClick={()=>onLang(lang==='en'?'zh':'en')} aria-label={t('Switch to Chinese','切换到英文')}>{t('中文','EN')}</button>
      <p className="eyebrow">{t('A GIFT FROM THE INNKEEPER','青云客栈')}</p>
      <h2 id="supply-title">{t('A little help from Chinatown.','喝茶，还是开葫芦？')}</h2>
      {choosing ? <>
        <p className="supply-story">{t('A red-silk pouch lands at your feet.','掌柜往街心递来一个红布包。')}<br/>{t('“Choose wisely. We only have one.”','“挑一样吧，就这么多了。”')}</p>
        <div className="supply-choices">
          <button data-primary onClick={()=>onChoose('safe')} className="supply-choice safe-tea" aria-label={t('Steady Tea: restore 2 HP','青瓷茶，稳回两格血')}><ItemIcon kind="tea"/><strong>{t('STEADY TEA','青瓷茶')}</strong><span>{t('Restore 2 HP','回 2 格血')}</span><small>{t('Guaranteed','一口就回')}</small></button>
          <button onClick={()=>onChoose('risky')} className="supply-choice lucky-elixir" aria-label={t('Lucky Elixir: half the time it restores 5 HP','药葫芦，一半机会回五格血')}><ItemIcon kind="elixir"/><strong>{t('LUCKY ELIXIR','药葫芦')}</strong><span>{t('Half the time: +5 HP','一半机会回 5 格')}</span><small>{t('Otherwise: +0 HP','另一半是清水，不回血')}</small></button>
        </div>
        <p className="supply-footnote">{t('One gift per fight. Take your time.','一局只送这一回。')}</p>
      </> : <div className="supply-reveal" role="status">
        <ItemIcon kind={match.supply.choice==='safe'?'tea':'elixir'}/>
        <strong className="heal-number">+{match.supply.heal} {t('HP','格血')}</strong>
        <p>{match.supply.choice==='safe'?t('A warm cup. A steady hand.','茶还烫着呢。'):match.supply.heal>0?t('Luck is on your side tonight.','有药！这一口，五格血。'):t('Just water this time.','咦？是清水。')}</p>
        <button data-primary className="pixel-button" onClick={onContinue}>{t('BACK TO THE FIGHT','回去接着打')}</button>
      </div>}
    </div>
  </div>;
}

export function Celebration({onSkip,lang}) {
  const t=(en,zh)=>localized(lang,en,zh);
  const skip=useRef(null);
  useEffect(()=>{skip.current?.focus({preventScroll:true});},[]);
  return <div className="celebration-overlay">
    <div className="celebration-heading" role="status"><p className="eyebrow">{t('THE MIND READER RETREATS','读心怪逃了')}</p><h2>{t('CHINATOWN IS SAFE.','唐人街守住了。')}</h2><p>{t('The lanterns shine again.','街上的灯笼又亮了。')}</p></div>
    <div className="crowd-cheer cheer-left" aria-hidden="true">{t('THANK YOU!','多谢女侠！')}</div><div className="crowd-cheer cheer-right" aria-hidden="true">{t('OUR STREET!','守住喽！')}</div>
    <div className="confetti" aria-hidden="true">{Array.from({length:20},(_,i)=><i key={i} style={{left:`${(i*23)%94+3}%`,animationDelay:`${(i%7)*.12}s`,background:['#ffcd69','#eb665b','#a4d9c2'][i%3]}}/>)}</div>
    <button className="text-button celebration-skip" onClick={onSkip} ref={skip}>{t('See results','看这局战绩')}</button>
  </div>;
}
