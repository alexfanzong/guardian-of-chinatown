import {ResponsiveContainer, ComposedChart, BarChart, Bar, Line, Scatter, XAxis, YAxis, ReferenceLine, CartesianGrid} from 'recharts';

const tick = {fill:'#e9e1d7', fontSize:16};

/** One fight: the chance the monster gave to "left" before each punch, and what the player did. */
export function MatchChart({history}) {
  const rows = history.map(r => ({turn:r.turn, p:Math.round(r.pLeft * 100)}));
  const point = r => ({turn:r.turn, p:r.side === 'L' ? 100 : 0});
  const read = history.filter(r => r.correct).map(point);
  const fooled = history.filter(r => !r.correct).map(point);
  return <figure className="chart-figure" role="img" aria-label={`Chart of this fight: before each of ${history.length} punches, the chance the monster gave to a left punch, with your actual punches marked. The table below has the same numbers.`}>
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={rows} margin={{top:14, right:18, bottom:4, left:0}}>
        <CartesianGrid stroke="#3a3348" vertical={false}/>
        <XAxis dataKey="turn" type="number" domain={[1, Math.max(2, history.length)]} allowDecimals={false} tick={tick} stroke="#8d7f93"/>
        <YAxis dataKey="p" type="number" domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={v => `${v}%`} tick={tick} stroke="#8d7f93" width={62}/>
        <ReferenceLine y={50} stroke="#c9bac6" strokeDasharray="5 5"/>
        <Line dataKey="p" type="stepAfter" stroke="#ffcd69" strokeWidth={3} dot={false} isAnimationActive={false}/>
        <Scatter data={fooled} fill="#9bd6c0" isAnimationActive={false}/>
        <Scatter data={read} fill="#f0766a" shape="square" isAnimationActive={false}/>
      </ComposedChart>
    </ResponsiveContainer>
    <figcaption><b style={{color:'#ffcd69'}}>Yellow line:</b> the chance it gave to LEFT before each punch. Marks at the top are your left punches, marks at the bottom are your right punches. <b style={{color:'#9bd6c0'}}>Green circle:</b> you fooled it. <b style={{color:'#f0766a'}}>Red square:</b> it read you.</figcaption>
  </figure>;
}

/** The sealed simulation: accuracy of three predictors on six punching policies. */
export function AccuracyChart({groups}) {
  const rows = groups.map(g => ({label:g.label, model:+(g.model * 100).toFixed(1), frequency:+(g.frequency * 100).toFixed(1), coin:+(g.coin * 100).toFixed(1)}));
  return <figure className="chart-figure" role="img" aria-label="Bar chart of correct predictions for six simulated punching policies, comparing this model, frequency counting and a fair coin. The table below has the same numbers.">
    <ResponsiveContainer width="100%" height={470}>
      <BarChart data={rows} layout="vertical" margin={{top:6, right:24, bottom:4, left:0}} barCategoryGap="22%">
        <CartesianGrid stroke="#3a3348" horizontal={false}/>
        <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${v}%`} tick={tick} stroke="#8d7f93"/>
        <YAxis type="category" dataKey="label" width={150} tick={tick} stroke="#8d7f93"/>
        <ReferenceLine x={50} stroke="#c9bac6" strokeDasharray="5 5"/>
        <Bar dataKey="model" fill="#9bd6c0" isAnimationActive={false}/>
        <Bar dataKey="frequency" fill="#e0b060" isAnimationActive={false}/>
        <Bar dataKey="coin" fill="#8f93a8" isAnimationActive={false}/>
      </BarChart>
    </ResponsiveContainer>
    <figcaption>Correct predictions after 16 warm-up punches (simulated data). <b style={{color:'#9bd6c0'}}>Green:</b> this model. <b style={{color:'#e0b060'}}>Gold:</b> counting left and right only. <b style={{color:'#b6b9c9'}}>Grey:</b> a fair coin. The dashed line is 50%.</figcaption>
  </figure>;
}
