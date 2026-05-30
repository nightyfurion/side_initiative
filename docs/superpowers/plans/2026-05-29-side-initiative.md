# Side Initiative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FoundryVTT v14 module that replaces per-combatant initiative with the Side Initiative variant rule for D&D 5e.

**Architecture:** A `SideInitiativeCombat` class (factory pattern) extends dnd5e's `Combat5e`, overrides `rollInitiative` to roll per-combatant but derive a per-side total, and is registered via `CONFIG.Combat.documentClass` in the `init` hook. UI changes (side coloring, button replacement) are applied via the `renderCombatTracker` hook and CSS.

**Tech Stack:** FoundryVTT v14, dnd5e v4, vanilla ES modules (no build step), Jest 29 (dev-only, for testing pure utility functions)

---

## File Map

| File | Role |
|---|---|
| `module.json` | Module manifest |
| `side_initiative.js` | Entry point: settings registration, subclass wiring, tracker hook |
| `side-utils.js` | Pure functions: `getSide`, `aggregateRolls` — no Foundry globals, Jest-testable |
| `SideInitiativeCombat.js` | Factory function returning a `Combat5e` subclass with all initiative logic |
| `SideInitiativeDialog.js` | Promise-based tie-breaking dialog |
| `templates/tie-dialog.hbs` | Handlebars template for tie-break prompt |
| `styles/side_initiative.css` | Combat tracker side coloring, per-combatant roll button visibility |
| `lang/en.json` | All localization strings |
| `tests/side-utils.test.js` | Jest unit tests for `getSide` and `aggregateRolls` |
| `package.json` | Dev dependencies (Jest) |
| `jest.config.js` | Jest config for native ES modules |

---

### Task 1: Module Scaffold

**Files:**
- Create: `module.json`
- Create: `lang/en.json`
- Create: `styles/side_initiative.css`
- Create: `side_initiative.js`
- Create: `side-utils.js`
- Create: `SideInitiativeCombat.js`
- Create: `SideInitiativeDialog.js`
- Create: `templates/tie-dialog.hbs`

- [ ] **Step 1: Create module.json**

```json
{
  "id": "side_initiative",
  "title": "Side Initiative",
  "description": "Implements the Side Initiative variant rule for D&D 5e.",
  "version": "1.0.0",
  "authors": [{ "name": "Timothy Cook" }],
  "compatibility": { "minimum": "12", "verified": "14" },
  "esmodules": ["side_initiative.js"],
  "styles": ["styles/side_initiative.css"],
  "languages": [{ "lang": "en", "name": "English", "path": "lang/en.json" }],
  "relationships": {
    "systems": [{
      "id": "dnd5e",
      "compatibility": { "minimum": "3.3.0", "verified": "4.0.0" }
    }]
  }
}
```

- [ ] **Step 2: Create stub files**

`lang/en.json`:
```json
{}
```

`styles/side_initiative.css`:
```css
/* Side Initiative styles */
```

`side_initiative.js`:
```javascript
// Entry point
```

`side-utils.js`:
```javascript
// Utility functions
```

`SideInitiativeCombat.js`:
```javascript
// SideInitiativeCombat factory
```

`SideInitiativeDialog.js`:
```javascript
// SideInitiativeDialog
```

`templates/tie-dialog.hbs`:
```hbs
{{! Tie-breaking dialog }}
```

- [ ] **Step 3: Commit**

```bash
git add module.json lang/en.json styles/side_initiative.css side_initiative.js side-utils.js SideInitiativeCombat.js SideInitiativeDialog.js templates/tie-dialog.hbs
git commit -m "feat: scaffold module structure"
```

---

### Task 2: Jest Test Environment

**Files:**
- Create: `package.json`
- Create: `jest.config.js`
- Create: `tests/.gitkeep`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "side_initiative",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

- [ ] **Step 2: Create jest.config.js**

```javascript
export default {
  transform: {},
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Create tests/ directory and verify Jest runs**

Create an empty file at `tests/.gitkeep`.

Run: `npm test`
Expected: "No tests found" message — confirms Jest launches without errors.

- [ ] **Step 5: Commit**

```bash
git add package.json jest.config.js tests/.gitkeep
git commit -m "feat: add Jest test environment"
```

---

### Task 3: side-utils.js (TDD)

**Files:**
- Create: `tests/side-utils.test.js`
- Modify: `side-utils.js`

- [ ] **Step 1: Write failing tests**

`tests/side-utils.test.js`:
```javascript
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
```

- [ ] **Step 2: Run tests to confirm failures**

Run: `npm test`
Expected: 9 tests fail with "not a function" or "Cannot find module"

- [ ] **Step 3: Implement side-utils.js**

`side-utils.js`:
```javascript
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
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npm test`
Expected: 9 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add side-utils.js tests/side-utils.test.js
git commit -m "feat: add getSide and aggregateRolls with tests"
```

---

### Task 4: Language Strings and Settings

**Files:**
- Modify: `lang/en.json`
- Modify: `side_initiative.js`

- [ ] **Step 1: Populate lang/en.json**

`lang/en.json`:
```json
{
  "SIDE_INITIATIVE": {
    "settings": {
      "enabled": {
        "name": "Enable Side Initiative",
        "hint": "Replace the default per-combatant initiative with the Side Initiative variant rule."
      },
      "aggregation": {
        "name": "Initiative Aggregation",
        "hint": "How the side's initiative value is derived from individual d20 rolls.",
        "highest": "Highest Roll",
        "average": "Average Roll (Rounded)"
      },
      "useModifiers": {
        "name": "Use Initiative Modifiers",
        "hint": "Variant: each combatant adds their initiative modifier to their d20 roll."
      }
    },
    "tieDialog": {
      "title": "Initiative Tie",
      "content": "Both sides rolled the same initiative total. What should happen?",
      "reroll": "Reroll",
      "players": "Players Win",
      "gm": "GM Wins"
    },
    "rollSideInitiative": "Roll Side Initiative",
    "playerSide": "Players",
    "enemySide": "Enemies",
    "aggregation": {
      "highest": "Highest",
      "average": "Average"
    }
  }
}
```

- [ ] **Step 2: Implement settings registration in side_initiative.js**

`side_initiative.js`:
```javascript
import { createSideInitiativeCombat } from './SideInitiativeCombat.js';
import { getSide } from './side-utils.js';

Hooks.once('init', () => {
  game.settings.register('side_initiative', 'enabled', {
    name: 'SIDE_INITIATIVE.settings.enabled.name',
    hint: 'SIDE_INITIATIVE.settings.enabled.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register('side_initiative', 'aggregation', {
    name: 'SIDE_INITIATIVE.settings.aggregation.name',
    hint: 'SIDE_INITIATIVE.settings.aggregation.hint',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      highest: 'SIDE_INITIATIVE.settings.aggregation.highest',
      average: 'SIDE_INITIATIVE.settings.aggregation.average',
    },
    default: 'highest',
  });

  game.settings.register('side_initiative', 'useModifiers', {
    name: 'SIDE_INITIATIVE.settings.useModifiers.name',
    hint: 'SIDE_INITIATIVE.settings.useModifiers.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  const BaseCombat = CONFIG.Combat.documentClass;
  CONFIG.Combat.documentClass = createSideInitiativeCombat(BaseCombat);
});
```

- [ ] **Step 3: Commit**

```bash
git add lang/en.json side_initiative.js
git commit -m "feat: add settings and entry point init hook"
```

---

### Task 5: SideInitiativeDialog

**Files:**
- Modify: `templates/tie-dialog.hbs`
- Modify: `SideInitiativeDialog.js`

- [ ] **Step 1: Implement templates/tie-dialog.hbs**

`templates/tie-dialog.hbs`:
```hbs
<p>{{localize "SIDE_INITIATIVE.tieDialog.content"}}</p>
```

- [ ] **Step 2: Implement SideInitiativeDialog.js**

`SideInitiativeDialog.js`:
```javascript
export class SideInitiativeDialog extends Dialog {
  static async prompt() {
    if (!game.user.isGM) return 'reroll';

    return new Promise((resolve) => {
      new SideInitiativeDialog({
        title: game.i18n.localize('SIDE_INITIATIVE.tieDialog.title'),
        content: `<p>${game.i18n.localize('SIDE_INITIATIVE.tieDialog.content')}</p>`,
        buttons: {
          reroll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize('SIDE_INITIATIVE.tieDialog.reroll'),
            callback: () => resolve('reroll'),
          },
          players: {
            icon: '<i class="fas fa-users"></i>',
            label: game.i18n.localize('SIDE_INITIATIVE.tieDialog.players'),
            callback: () => resolve('players'),
          },
          gm: {
            icon: '<i class="fas fa-dragon"></i>',
            label: game.i18n.localize('SIDE_INITIATIVE.tieDialog.gm'),
            callback: () => resolve('gm'),
          },
        },
        default: 'reroll',
        close: () => resolve('reroll'),
      }).render(true);
    });
  }
}
```

- [ ] **Step 3: Manual test in FoundryVTT — verify dialog**

Load the module in a test world. Open the browser console and run:

```javascript
const { SideInitiativeDialog } = await import('/modules/side_initiative/SideInitiativeDialog.js');
const result = await SideInitiativeDialog.prompt();
console.log('Result:', result);
```

Expected: Dialog appears with three buttons (Reroll, Players Win, GM Wins). Clicking each logs `'reroll'`, `'players'`, or `'gm'` respectively.

- [ ] **Step 4: Commit**

```bash
git add templates/tie-dialog.hbs SideInitiativeDialog.js
git commit -m "feat: add tie-breaking dialog"
```

---

### Task 6: SideInitiativeCombat

**Files:**
- Modify: `SideInitiativeCombat.js`

- [ ] **Step 1: Implement SideInitiativeCombat.js**

`SideInitiativeCombat.js`:
```javascript
import { getSide, aggregateRolls } from './side-utils.js';
import { SideInitiativeDialog } from './SideInitiativeDialog.js';

export function createSideInitiativeCombat(BaseCombat) {
  return class SideInitiativeCombat extends BaseCombat {

    async rollInitiative(ids, options = {}) {
      if (!game.settings.get('side_initiative', 'enabled')) {
        return super.rollInitiative(ids, options);
      }

      const aggregationMode = game.settings.get('side_initiative', 'aggregation');
      const useModifiers = game.settings.get('side_initiative', 'useModifiers');

      const rollResults = [];
      for (const id of ids) {
        const combatant = this.combatants.get(id);
        if (!combatant?.actor) continue;

        const initMod = useModifiers
          ? (combatant.actor.system?.attributes?.init?.total ?? 0)
          : 0;
        const formula = initMod !== 0 ? `1d20 + ${initMod}` : '1d20';
        const roll = new Roll(formula);
        await roll.evaluate();

        rollResults.push({
          combatant,
          roll,
          side: getSide(combatant.token?.disposition, combatant.actor?.type),
        });
      }

      if (rollResults.length === 0) return this;

      const playerRolls = rollResults.filter(r => r.side === 'player');
      const enemyRolls = rollResults.filter(r => r.side === 'enemy');

      await this._postSideRollMessage('player', playerRolls, aggregationMode, useModifiers);
      await this._postSideRollMessage('enemy', enemyRolls, aggregationMode, useModifiers);

      // Single-side combat: just set individual roll values
      if (playerRolls.length === 0 || enemyRolls.length === 0) {
        const updates = rollResults.map(({ combatant, roll }) => ({
          _id: combatant.id,
          initiative: roll.total,
        }));
        await this.updateEmbeddedDocuments('Combatant', updates);
        return this;
      }

      const playerTotal = aggregateRolls(playerRolls.map(r => r.roll.total), aggregationMode);
      const enemyTotal = aggregateRolls(enemyRolls.map(r => r.roll.total), aggregationMode);

      let playerWins;
      if (playerTotal === enemyTotal) {
        const result = await SideInitiativeDialog.prompt();
        if (result === 'reroll') return this.rollInitiative(ids, options);
        playerWins = result === 'players';
      } else {
        playerWins = playerTotal > enemyTotal;
      }

      const winValue = Math.max(playerTotal, enemyTotal);
      const loseValue = winValue - 1;

      const updates = rollResults.map(({ combatant, side }) => ({
        _id: combatant.id,
        initiative: (side === 'player') === playerWins ? winValue : loseValue,
      }));

      await this.updateEmbeddedDocuments('Combatant', updates);
      return this;
    }

    async _postSideRollMessage(side, rollData, aggregationMode, useModifiers) {
      if (rollData.length === 0) return;

      const sideLabel = game.i18n.localize(
        side === 'player' ? 'SIDE_INITIATIVE.playerSide' : 'SIDE_INITIATIVE.enemySide'
      );
      const total = aggregateRolls(rollData.map(r => r.roll.total), aggregationMode);
      const modeLabel = game.i18n.localize(
        aggregationMode === 'highest'
          ? 'SIDE_INITIATIVE.aggregation.highest'
          : 'SIDE_INITIATIVE.aggregation.average'
      );

      const lines = rollData.map(({ combatant, roll }) => {
        if (useModifiers) {
          const die = roll.dice[0]?.total ?? roll.total;
          const mod = combatant.actor?.system?.attributes?.init?.total ?? 0;
          const sign = mod >= 0 ? '+' : '-';
          return `${combatant.name}: ${die} ${sign} ${Math.abs(mod)} = ${roll.total}`;
        }
        return `${combatant.name}: ${roll.total}`;
      });

      const content = `
        <div class="side-initiative-chat">
          <strong>${sideLabel}</strong>
          <ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>
          <p><em>${modeLabel}: <strong>${total}</strong></em></p>
        </div>
      `;

      await ChatMessage.create({
        content,
        rolls: rollData.map(r => r.roll),
        speaker: { alias: sideLabel },
      });
    }
  };
}
```

- [ ] **Step 2: Manual test in FoundryVTT — basic combat**

1. Enable the module in a test world running dnd5e.
2. Create a scene with 2 player tokens (friendly disposition, `character` actor type) and 2 hostile NPC tokens.
3. Select all tokens → right-click → "Toggle Combat State".
4. In the browser console, run:

```javascript
const ids = game.combat.combatants.map(c => c.id);
await game.combat.rollInitiative(ids);
```

Expected:
- Two chat messages appear: one labeled "Players", one labeled "Enemies".
- Each shows individual d20 results and the aggregate total.
- All player combatants share one initiative value in the tracker; all enemies share another value (one apart).
- Winning side appears first in the tracker.

- [ ] **Step 3: Manual test — modifiers variant**

In module settings, enable "Use Initiative Modifiers". Run:

```javascript
const ids = game.combat.combatants.map(c => c.id);
await game.combat.rollInitiative(ids);
```

Expected: The "Players" chat message shows `Name: d20 + mod = total` format for each PC.

- [ ] **Step 4: Commit**

```bash
git add SideInitiativeCombat.js
git commit -m "feat: implement SideInitiativeCombat with rollInitiative"
```

---

### Task 7: Combat Tracker UI

**Files:**
- Modify: `side_initiative.js` (add `renderCombatTracker` hook)
- Modify: `styles/side_initiative.css`

- [ ] **Step 1: Add renderCombatTracker hook to side_initiative.js**

Add the following block after the `Hooks.once('init', ...)` block:

```javascript
Hooks.on('renderCombatTracker', (app, htmlOrElement, context) => {
  if (!game.settings.get('side_initiative', 'enabled')) return;
  const combat = game.combat;
  if (!combat) return;

  // Support both ApplicationV1 (jQuery) and ApplicationV2 (HTMLElement)
  const element = htmlOrElement instanceof HTMLElement ? htmlOrElement : htmlOrElement[0];

  // Tag each combatant row with its side
  element.querySelectorAll('[data-combatant-id]').forEach(el => {
    const combatant = combat.combatants.get(el.dataset.combatantId);
    if (!combatant) return;
    el.dataset.side = getSide(combatant.token?.disposition, combatant.actor?.type);
  });

  // Replace the "roll all" button with a side initiative roll button
  const rollAllBtn = element.querySelector('[data-action="rollAll"]');
  if (rollAllBtn && !element.querySelector('.side-initiative-roll')) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'side-initiative-roll';
    btn.dataset.tooltip = game.i18n.localize('SIDE_INITIATIVE.rollSideInitiative');
    btn.innerHTML = '<i class="fas fa-dice-d20"></i>';
    btn.addEventListener('click', () => {
      const ids = combat.combatants.map(c => c.id);
      combat.rollInitiative(ids);
    });
    rollAllBtn.replaceWith(btn);
  }
});
```

- [ ] **Step 2: Implement styles/side_initiative.css**

`styles/side_initiative.css`:
```css
/* Side coloring */
.combatant[data-side="player"] {
  border-left: 3px solid #4a90d9;
}

.combatant[data-side="enemy"] {
  border-left: 3px solid #c0392b;
}

/* Hide per-combatant roll buttons when side initiative is active */
.combat-tracker .combatant [data-action="rollInitiative"] {
  display: none;
}

/* Chat message styling */
.side-initiative-chat ul {
  margin: 4px 0;
  padding-left: 16px;
}

.side-initiative-chat li {
  font-size: 0.9em;
}
```

- [ ] **Step 3: Manual test in FoundryVTT — tracker UI**

Reload the Foundry world and open the combat tracker with tokens in combat.

Expected:
- Player combatants have a blue left border.
- Enemy combatants have a red left border.
- The "Roll All" button is replaced by a single d20 icon button.
- Per-combatant initiative roll buttons are not visible.
- Clicking the d20 button triggers side initiative rolling for all combatants.

- [ ] **Step 4: Commit**

```bash
git add side_initiative.js styles/side_initiative.css
git commit -m "feat: combat tracker UI — side colors and roll button"
```

---

### Task 8: Integration Test

No new files. Manual verification of the complete feature.

- [ ] **Step 1: Full combat flow — highest roll, no modifiers**

Settings: `enabled = true`, `aggregation = "highest"`, `useModifiers = false`.

1. Create 3 PC tokens and 2 hostile NPC tokens on a scene.
2. Add all to combat via the combat tracker.
3. Click the side initiative d20 button in the tracker header.

Expected:
- Two chat messages: "Players" and "Enemies", each listing individual d20 results and the highest roll.
- All PCs share one initiative value; all NPCs share another (one apart).
- Winning side's combatants appear first in the tracker.

- [ ] **Step 2: Full combat flow — average roll, with modifiers**

Settings: `enabled = true`, `aggregation = "average"`, `useModifiers = true`.

1. Ensure one PC has a high initiative modifier (DEX 18 = +4) and one has a low modifier (DEX 8 = -1) in their character sheet.
2. Roll side initiative.

Expected:
- Player chat message shows `Name: d20 + mod = total` for each PC.
- Side total is the average (rounded) of all PC totals, not the highest.

- [ ] **Step 3: Tie-breaking flow**

To force a tie, temporarily use the console to set initiative:

```javascript
// After a roll, manually check the side totals in chat, or force-test the dialog:
const { SideInitiativeDialog } = await import('/modules/side_initiative/SideInitiativeDialog.js');
const result = await SideInitiativeDialog.prompt();
console.log(result); // 'reroll', 'players', or 'gm'
```

Then trigger a real combat roll and wait for a natural tie, or verify behavior with each dialog option.

Expected:
- "Reroll" re-posts new chat messages and updates initiative values.
- "Players Win" places all PCs above all NPCs in the tracker.
- "GM Wins" places all NPCs above all PCs.

- [ ] **Step 4: Disabled state**

Set `enabled = false` in Module Settings (no world reload required).

Expected:
- Combat tracker reverts to normal per-combatant roll buttons.
- Rolling initiative uses dnd5e's default behavior.
- Blue/red side borders are absent.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: side initiative module complete"
```
