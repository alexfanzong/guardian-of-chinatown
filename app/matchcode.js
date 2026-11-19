/** A short text code for one finished fight, so a player can copy it out by hand.
 *  Format: GC1.<punches>.<the monster's locked reads>, for example GC1.LRLL.LLRL
 *  Nothing is saved or sent; the page only shows the code. */
export function encodeMatch(history) {
  return `GC1.${history.map(round => round.side).join('')}.${history.map(round => round.prediction).join('')}`;
}

/** Returns {moves, predictions}, or null when the text is not a valid code. */
export function decodeMatch(code) {
  const found = /^GC1\.([LR]+)\.([LR]+)$/.exec(String(code).trim());
  if (!found || found[1].length !== found[2].length) return null;
  return {moves: found[1], predictions: found[2]};
}
