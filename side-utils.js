// Utility functions

// After — FRIENDLY=1, PARTY=2 in FoundryVTT v12+
export function getSide(disposition, actorType) {
  if (disposition >= 1 || actorType === 'character') return 'player';
  return 'enemy';
}

export function aggregateRolls(rolls, mode) {
  if (rolls.length === 0) return 0;
  if (mode === 'average') {
    return Math.round(rolls.reduce((sum, r) => sum + r, 0) / rolls.length);
  }
  return Math.max(...rolls);
}

export function findNextSideIndex(sides, currentIndex) {
  const currentSide = sides[currentIndex];
  for (let i = currentIndex + 1; i < sides.length; i++) {
    if (sides[i] !== currentSide) return i;
  }
  return -1;
}
