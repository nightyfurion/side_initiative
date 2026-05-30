// Utility functions

// CONST.TOKEN_DISPOSITIONS.FRIENDLY === 2 in FoundryVTT (stable across all supported versions)
export function getSide(disposition, actorType) {
  if (disposition === 2 || actorType === 'character') return 'player';
  return 'enemy';
}

export function aggregateRolls(rolls, mode) {
  if (rolls.length === 0) return 0;
  if (mode === 'average') {
    return Math.round(rolls.reduce((sum, r) => sum + r, 0) / rolls.length);
  }
  return Math.max(...rolls);
}
