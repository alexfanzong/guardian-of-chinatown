import cels from './entrances.webp';
import street from './street-clean.webp';
import skyline from './leap-clean.webp';
import './entrances.css';

export function EntranceCels({scene}: {scene: 'crash' | 'roof'}) {
  return <div className={'gc-cel-shot gc-cel-'+scene} aria-hidden="true">
    <div className="gc-cel-location" style={{backgroundImage:`url("${scene==='crash'?street:skyline}")`}}/>
    <div className="gc-cel-ground"/>
    <div className="gc-cel-travel">
      <div className="gc-cel-drawing" style={{backgroundImage:`url("${cels}")`}}/>
    </div>
  </div>;
}
