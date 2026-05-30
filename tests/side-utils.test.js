import { getSide, aggregateRolls } from '../side-utils.js';

describe('getSide', () => {
  test('friendly disposition (2) returns player side', () => {
    expect(getSide(2, 'npc')).toBe('player');
  });

  test('character actor type returns player side regardless of disposition', () => {
    expect(getSide(-1, 'character')).toBe('player');
  });

  test('hostile NPC returns enemy side', () => {
    expect(getSide(-1, 'npc')).toBe('enemy');
  });

  test('neutral NPC returns enemy side', () => {
    expect(getSide(0, 'npc')).toBe('enemy');
  });
});

describe('aggregateRolls', () => {
  test('highest mode returns max roll', () => {
    expect(aggregateRolls([5, 12, 8], 'highest')).toBe(12);
  });

  test('average mode returns rounded mean', () => {
    // (5 + 12 + 8) / 3 = 8.33 → 8
    expect(aggregateRolls([5, 12, 8], 'average')).toBe(8);
  });

  test('average rounds half up', () => {
    // (5 + 6) / 2 = 5.5 → 6
    expect(aggregateRolls([5, 6], 'average')).toBe(6);
  });

  test('single roll returns that roll for both modes', () => {
    expect(aggregateRolls([15], 'highest')).toBe(15);
    expect(aggregateRolls([15], 'average')).toBe(15);
  });

  test('empty array returns 0', () => {
    expect(aggregateRolls([], 'highest')).toBe(0);
    expect(aggregateRolls([], 'average')).toBe(0);
  });
});
