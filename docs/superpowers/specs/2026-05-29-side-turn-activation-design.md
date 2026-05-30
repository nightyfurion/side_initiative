# Side Turn Activation — Design Spec

**Date:** 2026-05-29  
**Module:** `side_initiative`  
**Depends on:** Side Initiative core (2026-05-29-side-initiative-design.md)

---

## Overview

When it is a side's turn, "End Turn" should skip the entire side and jump to the first combatant of the opposing side. All combatants on the currently active side should be visually highlighted simultaneously in the combat tracker, making it immediately clear that the whole team can act.

---

## Changes

### 1. `nextTurn()` override — `SideInitiativeCombat.js`

Add `nextTurn()` to the `SideInitiativeCombat` class.

**Behaviour:**
1. If `game.settings.get('side_initiative', 'enabled')` is false → `return super.nextTurn()`.
2. If `this.combatant` is null → `return super.nextTurn()`.
3. Compute the current side: `getSide(this.combatant.token?.disposition, this.combatant.actor?.type)`.
4. Scan forward through `this.turns` (from index `this.turn + 1`) for the first combatant whose side differs.
5. If found → `return this.update({ turn: foundIndex })`.
6. If not found (current side is last in the round) → `return this.nextRound()`.

**Why `this.update({ turn })` rather than `super.nextTurn()`:** `super.nextTurn()` only increments by one. We need to set an arbitrary index, which requires calling `update` directly — the same mechanism FoundryVTT uses internally.

---

### 2. Side highlighting — `side_initiative.js` + `styles/side_initiative.css`

**Hook change (`side_initiative.js`):**

In the existing `renderCombatTracker` hook, after the `data-side` tagging loop, add:

```javascript
const activeSide = combat.combatant
  ? getSide(combat.combatant.token?.disposition, combat.combatant.actor?.type)
  : null;

element.querySelectorAll('[data-combatant-id]').forEach(el => {
  const isActiveSide = activeSide && el.dataset.side === activeSide;
  el.dataset.sideActive = isActiveSide ? 'true' : 'false';
});
```

**CSS change (`styles/side_initiative.css`):**

Add styles for the active-side state using the existing blue/red palette:

```css
.combatant[data-side="player"][data-side-active="true"] {
  border-left: 3px solid #4a90d9;
  background: rgba(74, 144, 217, 0.08);
}

.combatant[data-side="enemy"][data-side-active="true"] {
  border-left: 3px solid #c0392b;
  background: rgba(192, 57, 43, 0.08);
}
```

The resting border (non-active side) is kept at a lower opacity via the existing rules. The active side's background tint signals the whole group can act without replacing FoundryVTT's own single-combatant active highlight.

---

## Files Changed

| File | Change |
|---|---|
| `SideInitiativeCombat.js` | Add `nextTurn()` method |
| `side_initiative.js` | Add `data-side-active` tagging in `renderCombatTracker` hook |
| `styles/side_initiative.css` | Add active-side background tint rules |

---

## Out of Scope

- `previousTurn()` override (rare use case, left as default)
- Per-combatant "done" tracking within a side's turn
- Multiple sides (more than two)
