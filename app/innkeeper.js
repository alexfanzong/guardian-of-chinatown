import {handName, localized} from './language.js';

function frequentFollowUp(history) {
  const pairs = new Map();
  const previousCounts = {L: 0, R: 0};
  for (let index = 1; index < history.length; index++) {
    const from = history[index-1].side, {side: to, correct} = history[index];
    previousCounts[from]++;
    const pair = from + to;
    if (!pairs.has(pair)) pairs.set(pair, {from, to, total: 0, blocked: 0});
    const stat = pairs.get(pair);
    stat.total++;
    if (correct) stat.blocked++;
  }
  return [...pairs.values()]
    .filter(row => row.total >= 3 && row.blocked >= 2 &&
      row.total / previousCounts[row.from] >= .70 && row.blocked / row.total >= .5)
    .sort((a,b) => b.blocked - a.blocked || b.total - a.total)[0];
}

export function innkeeperTip(match, lang) {
  const t = (en,zh) => localized(lang,en,zh);
  const make = (key, enTitle, zhTitle, enBody, zhBody) => ({
    key, title: t(enTitle,zhTitle), body: t(enBody,zhBody),
  });
  const history = match.history;
  const live = match.dodgeHistory.filter(dodge => !dodge.training);
  const lastDodge = live.at(-1);
  if (lastDodge && lastDodge.outcome !== 'evaded' &&
      (match.winner === 'boss' || live.filter(d => d.outcome === lastDodge.outcome).length >= 2)) {
    if (lastDodge.outcome === 'early') return make('early','Watch its feet','等它离地',
      'You moved while it was still crouching. Let its feet leave the ground before you dodge.',
      '刚才你闪早了，它还蹲着呢。等它双脚离地再按。');
    return make('late','Move on the flash','眼一睁就闪',
      'The pounce caught you waiting. When its eye opens, tap either side.',
      '刚才那一扑慢了点。下回盯住它额头那只眼，一睁开就按。');
  }
  const dodgeTip=()=>make('dodged','Watch for the lift','就照刚才那样躲',
    'You slipped past it while it was in the air. Watch for that lift next fight.',
    '刚才它一离地你就闪，它扑了个空。下回还看它的脚。');
  const burstTip=()=>make('burst','Save a surprise','第三拳换个手？',
    'Three surprises in a row lifted it off its feet. Try saving a change of hand for that third punch.',
    '你刚才连中三拳，把它挑飞了。下回头两拳得手，第三拳试试换只手。');
  if (live.filter(d=>d.outcome==='evaded').length>=2) return dodgeTip();
  if (history.filter(row=>row.burst).length>=2) return burstTip();
  const follow = frequentFollowUp(history);
  if (follow) {
    const {from,to,total,blocked} = follow, other = to === 'L' ? 'R' : 'L';
    return make('follow-'+from+to,'Change the follow-up','下一拳换只手',
      'It blocked '+blocked+' of your '+total+' '+handName(to,'en')+' punches after a '+handName(from,'en')+'. Try a '+handName(other,'en')+' there next fight.',
      '你有 '+total+' 次打完'+handName(from,'zh')+'拳又出'+handName(to,'zh')+'拳，它挡了 '+blocked+' 次。下回这儿换'+handName(other,'zh')+'拳试试。');
  }
  const caught = history.filter(row => row.guarded && row.correct);
  if (caught.length) {
    const side=caught.at(-1).side;
    return make('guarded','Take the opening','打它没防的那边',
      'It leaned into your '+handName(side,'en')+' and caught the punch. Next time, give it the other hand.',
      '刚才它防'+handName(side,'zh')+'拳，你这拳正撞在它手上。下回看见它架起手，就换一边。');
  }
  if (match.supply?.choice === 'risky' && match.supply.heal === 0)
    return make('empty-gourd','Something to count on','茶总能回两格',
      'The gourd came up empty this fight. If two hearts will buy you another exchange, take the tea.',
      '这回葫芦里是清水。要是差两格血就能再扛一下，下回选茶。');
  const opened = history.findLast(row=>row.guarded && !row.correct);
  if (opened) return make('open-side','Draw that guard again','还打那个空当',
    'Your '+handName(opened.side,'en')+' got around its '+handName(opened.prediction,'en')+' guard. See if you can draw it to the other side next fight.',
    '它防'+handName(opened.prediction,'zh')+'拳，你换'+handName(opened.side,'zh')+'拳就打中了。下回看它架哪只手。');
  if (lastDodge?.outcome === 'evaded') return dodgeTip();
  if (history.some(row=>row.burst)) return burstTip();
  return make('start','Give it a habit','先让它猜几拳',
    'Let it see the same hand a few times. Watch which side it guards when you switch.',
    '先用同一只手打几拳。等它抬手来挡，换另一只手试试。');
}
