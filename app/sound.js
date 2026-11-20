/** Opt-in arcade tones synthesized locally. */
export function createSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  const context = new Audio();
  context.resume().catch(() => {});
  return {
    signal() {
      if (context.state !== 'running') return;
      const at=context.currentTime, bell=context.createOscillator(), volume=context.createGain();
      bell.type='sine';bell.frequency.setValueAtTime(660,at);bell.frequency.setValueAtTime(880,at+.045);
      volume.gain.setValueAtTime(.0001,at);volume.gain.linearRampToValueAtTime(.045,at+.01);
      volume.gain.exponentialRampToValueAtTime(.0001,at+.15);
      bell.connect(volume);volume.connect(context.destination);bell.start(at);bell.stop(at+.16);
    },
    play(blocked, burst) {
      if (context.state !== 'running') return;
      const notes = burst ? [330,440,660] : blocked ? [180,80] : [300,130];
      notes.forEach((frequency,index)=>{
        const at=context.currentTime+index*.065;
        const oscillator=context.createOscillator(), gain=context.createGain();
        oscillator.type='square';
        oscillator.frequency.setValueAtTime(frequency,at);
        oscillator.frequency.exponentialRampToValueAtTime(frequency*.7,at+.07);
        gain.gain.setValueAtTime(.0001,at);
        gain.gain.exponentialRampToValueAtTime(.055,at+.008);
        gain.gain.exponentialRampToValueAtTime(.0001,at+.09);
        oscillator.connect(gain);gain.connect(context.destination);
        oscillator.start(at);oscillator.stop(at+.1);
      });
    },
    close(){context.close().catch(()=>{});},
  };
}
