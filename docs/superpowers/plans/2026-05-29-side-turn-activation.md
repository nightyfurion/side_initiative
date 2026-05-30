# Side Turn Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When "End Turn" is clicked, skip the entire remaining current side and jump to the first combatant of the opposing side; visually highlight all combatants of the active side simultaneously in the combat tracker.

**Architecture:** A new pure function `findNextSideIndex` is added to `side-utils.js` and tested with Jest. `SideInitiativeCombat` gains a `nextTurn()` override that uses this function. The existing `renderCombatTracker` hook is extended to tag and highlight the entire active side.

**Tech Stack:** FoundryVTT v14, dnd5e v4, vanilla ES modules, Jest 29

---

## File Map

| File | Change |
|---|---|
| `side-utils.js` | Add `findNextSideIndex(sides, currentIndex)` |
| `tests/side-utils.test.js` | Add 5 tests for `findNextSideIndex` |
| `SideInitiativeCombat.js` | Add `findNextSideIndex` to import; add `nextTurn()` method |
| `side_initiative.js` | Add `data-side-active` tagging block in `renderCombatTracker` hook |
| `styles/side_initiative.css` | Add active-side background tint rules |

---

### Task 1: `findNextSideIndex` (TDD)

**Files:**
- Modify: `side-utils.js`
- Modify: `tests/side-utils.test.js`

- [ ] **Step 1: Add failing tests to tests/side-utils.test.js**

Add the following `describe` block at the bottom of the existing test file (after the `aggregateRolls` block):

```javascript
import { getSide, aggregateRolls, findNextSideIndex } from '../side-utils.js';

// (existing getSide and aggregateRolls tests stay unchanged)

describe('findNextSideIndex', () => {
  test('returns index of first combatant on a different side', () => {
    expect(findNextSideIndex(['player', 'player', 'enemy', 'enemy'], 0)).toBe(2);
  });

  test('returns correct index when called mid-side', () => {
    expect(findNextSideIndex(['player', 'player', 'enemy', 'enemy'], 1)).toBe(2);
  });

  test('returns -1 when current side is last in round (player)', () => {
    expect(findNextSideIndex(['enemy', 'enemy', 'player', 'player'], 2)).toBe(-1);
    expect(findNextSideIndex(['enemy', 'enemy', 'player', 'player'], 3)).toBe(-1);
  });

  test('returns -1 for single-side combat', () => {
    expect(findNextSideIndex(['player', 'player', 'player'], 0)).toBe(-1);
  });

  test('works when enemies go first', () => {
    expect(findNextSideIndex(['enemy', 'enemy', 'player', 'player'], 0)).toBe(2);
  });
});
```

Also update the import at the top of the test file to include `findNextSideIndex`:

```javascript
import { getSide, aggregateRolls, findNextSideIndex } from '../side-utils.js';
```

- [ ] **Step 2: Run tests to confirm failures**

Run: `npm test`
Expected: 5 new tests fail with "findNextSideIndex is not a function" or "does not provide an export"

- [ ] **Step 3: Implement `findNextSideIndex` in side-utils.js**

Append to the bottom of `side-utils.js`:

```javascript
export function findNextSideIndex(sides, currentIndex) {
  const currentSide = sides[currentIndex];
  for (let i = currentIndex + 1; i < sides.length; i++) {
    if (sides[i] !== currentSide) return i;
  }
  return -1;
}
```

- [ ] **Step 4: Run tests to confirm all pass**

Run: `npm test`
Expected: All 15 tests pass (10 existing + 5 new), 0 failures.

- [ ] **Step 5: Commit**

```bash
git add side-utils.js tests/side-utils.test.js
git commit -m "feat: add findNextSideIndex with tests"
```

---

### Task 2: `nextTurn()` override

**Files:**
- Modify: `SideInitiativeCombat.js`

- [ ] **Step 1: Update the import line at the top of SideInitiativeCombat.js**

Change line 1 from:
```javascript
import { getSide, aggregateRolls } from './side-utils.js';
```
To:
```javascript
import { getSide, aggregateRolls, findNextSideIndex } from './side-utils.js';
```

- [ ] **Step 2: Add `nextTurn()` to the SideInitiativeCombat class**

Add the following method inside the `SideInitiativeCombat` class, after the closing brace of `_postSideRollMessage` and before the closing `};` of the class:

```javascript
async nextTurn() {
  if (!game.settings.get('side_initiative', 'enabled')) {
    return super.nextTurn();
  }
  if (!this.combatant) return super.nextTurn();

  const sides = this.turns.map(c =>
    getSide(c.token?.disposition, c.actor?.type)
  );
  const nextIndex = findNextSideIndex(sides, this.turn);

  if (nextIndex === -1) return this.nextRound();
  return this.update({ turn: nextIndex });
}
```

- [ ] **Step 3: Manual test in FoundryVTT — basic next-turn behaviour**

1. Load the module in a test world with dnd5e.
2. Add 2 PC tokens (friendly) and 2 hostile NPC tokens to combat.
3. Roll side initiative.
4. Click "End Turn" on the first combatant (whichever side won).

Expected: The tracker jumps directly to the first combatant of the opposing side — not to the second combatant of the same side.

- [ ] **Step 4: Manual test — end of round**

With the tracker on the final side of the round, click "End Turn".

Expected: The round counter increments and the tracker returns to the top of the initiative order (first combatant of the winning side again).

- [ ] **Step 5: Manual test — disabled module**

Set "Enable Side Initiative" to off in module settings. Click "End Turn".

Expected: Standard one-at-a-time turn advancement.

- [ ] **Step 6: Commit**

```bash
git add SideInitiativeCombat.js
git commit -m "feat: add nextTurn override to skip by side"
```

---

### Task 3: Side highlighting + CSS

**Files:**
- Modify: `side_initiative.js`
- Modify: `styles/side_initiative.css`

- [ ] **Step 1: Add data-side-active tagging to the renderCombatTracker hook in side_initiative.js**

In the `Hooks.on('renderCombatTracker', ...)` callback in `side_initiative.js`, add the following block immediately after the existing `data-side` tagging loop (the `forEach` that sets `el.dataset.side`):

```javascript
// Highlight entire active side
const activeSide = combat.combatant
  ? getSide(combat.combatant.token?.disposition, combat.combatant.actor?.type)
  : null;

element.querySelectorAll('[data-combatant-id]').forEach(el => {
  el.dataset.sideActive = (activeSide && el.dataset.side === activeSide) ? 'true' : 'false';
});
```

- [ ] **Step 2: Add active-side CSS rules to styles/side_initiative.css**

Append to the bottom of `styles/side_initiative.css`:

```css
/* Active side highlight */
.combatant[data-side="player"][data-side-active="true"] {
  border-left: 3px solid #4a90d9;
  background: rgba(74, 144, 217, 0.08);
}

.combatant[data-side="enemy"][data-side-active="true"] {
  border-left: 3px solid #c0392b;
  background: rgba(192, 57, 43, 0.08);
}
```

- [ ] **Step 3: Manual test in FoundryVTT — visual highlight**

1. Start a combat with PCs and NPCs.
2. Roll side initiative.
3. Observe the combat tracker.

Expected:
- All combatants on the winning side have a coloured background tint (blue for players, red for enemies).
- When "End Turn" is clicked and the tracker jumps to the other side, the tint shifts to the opposing side's combatants.
- At the start of a new round, the tint returns to the winning side.

- [ ] **Step 4: Manual test — module disabled**

Set "Enable Side Initiative" to off.

Expected: No background tints appear on any combatant rows.

- [ ] **Step 5: Commit**

```bash
git add side_initiative.js styles/side_initiative.css
git commit -m "feat: highlight entire active side in combat tracker"
```
