import data from './experiment-results.json';
import extra from './posthoc-results.json';
import {AccuracyChart} from './MatchChart.tsx';

const percent=(value:number,digits=2)=>`${(value*100).toFixed(digits)}%`;
const count=(value:number)=>value.toLocaleString('en-US');

export function ExperimentResults(){
  const fair=data.groups.find(g=>g.id==='fair_iid')!;
  const biased=data.groups.find(g=>g.id==='biased80')!;
  const short=extra.shortFights;
  const loop=short.rows.find(row=>row.id==='period4')!;
  return <section className="research-panel">
    <p className="eyebrow">THE EXPERIMENT · SIMULATED DATA</p>
    <h2 id="dialog-title">Can it learn your next punch?</h2>
    <p className="research-lead">I compared six punching strategies to see which ones the monster could learn. Before testing, I expected a fresh, independent coin flip on each punch to be the hardest to predict.</p>

    <h3>How I tested it</h3>
    <div className="research-counts"><span><strong>{count(data.sequences)}</strong>simulated sequences</span><span><strong>{count(data.scoredPunches)}</strong>scored predictions</span></div>
    <p>The model’s rules were fixed before a new test set was generated, locked and evaluated once. Each strategy had {count(data.sequencesPerPolicy)} sequences of {data.turns} punches. The first {data.warmup} punches gave the monster time to learn; I scored punches 17–80. The comparison included a fair coin and a model that only counts lefts and rights.</p>
    <p>Each sequence continued for all 80 punches, so early knockouts could not shorten the test.</p>

    <details><summary>How the prediction works</summary>
      <p>The monster looks for earlier moves that followed the same last two punches. With fewer than 3 matching examples, it tries the last one punch, then the overall left/right count. It remembers up to 32 punches.</p>
      <p>For the selected examples, P(left) = (lefts + 1) / (total + 2). This starts from a neutral Beta(1,1) prior and keeps small samples from giving an extreme estimate. Predictions stay between 5% and 95%. These settings were chosen before testing and were not fitted to the test data.</p>
    </details>

    <h3>What happened</h3>
    <p>After warm-up, the monster read every strictly alternating punch and every punch in the left-left-right-right loop. Independent fair coin flips stayed at {percent(fair.model)}. Their 95% interval was {percent(fair.interval[0])}–{percent(fair.interval[1])}, consistent with guessing at chance.</p>
    <p>Using both hands equally can still leave a pattern in their order.</p>

    <details><summary>Compare all six strategies</summary>
      <AccuracyChart groups={data.groups}/>
      <div className="record-scroll research-table"><table><caption>Correct predictions on punches 17–80 (simulated data)</caption><thead><tr><th scope="col">Punching strategy</th><th scope="col">Monster</th><th scope="col">Counting only</th><th scope="col">Fair coin</th></tr></thead><tbody>{data.groups.map(g=><tr key={g.id}><th scope="row">{g.label}</th><td><strong>{percent(g.model)}</strong></td><td>{percent(g.frequency)}</td><td>{percent(g.coin)}</td></tr>)}</tbody></table></div>
      <p>For independent fair punches, the monster’s average log₁₀ likelihood was {fair.modelLog10.toFixed(3)}. The fair coin scored higher at −0.301.</p>
    </details>

    <h3>Winning before it learns</h3>
    <p>In a separate follow-up using full fights and tea, the left-left-right-right loop won {count(loop.wins)} of {count(short.perStrategy)} simulated fights ({percent(loop.wins/short.perStrategy)}). All those wins came by punch 16.</p>
    <p>A fight can end before the monster has enough time to learn your pattern. Combos and supplies also affect who wins.</p>

    <h3>A few limits</h3>
    <p>The monster can be overconfident, and more history does not always improve its guesses. On independent 80/20 punches, counting only was more accurate: {percent(biased.frequency)} versus {percent(biased.model)}. These results describe the simulated strategies and this version of the game.</p>
    <p className="dialog-note">Data: computer-generated punch sequences and simulated fights.</p>
  </section>;
}
