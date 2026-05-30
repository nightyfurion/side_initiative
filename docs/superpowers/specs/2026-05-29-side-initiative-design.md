# Side Initiative Module — Design Spec

**Date:** 2026-05-29  
**Target:** FoundryVTT v14, dnd5e system  
**Module ID:** `side_initiative`

---

## Overview

A FoundryVTT module that replaces the default per-combatant initiative system with the Side Initiative variant rule from D&D 5e. When enabled, all combatants roll individually but a single initiative value is derived per side, determining which side acts first. Members of the winning side may act in any order.

---

## Module Settings

Registered on `init`, visible to GM only.

| Key | Type | Default | Description |
|---|---|---|---|
| `enabled` | Boolean | `true` | Activates side initiative, replacing the default system |
| `aggregation` | String (select) | `"highest"` | How side initiative is derived from individual rolls: `"highest"` (max roll) or `"average"` (mean, rounded) |
| `useModifiers` | Boolean | `false` | Variant: apply each combatant's initiative modifier to their d20 roll |

---

## File Structure

```
side_initiative/
  module.json
  side_initiative.js         ← entry point: registers settings, subclass, hooks
  SideInitiativeCombat.js    ← Combat5e subclass with all initiative logic
  SideInitiativeDialog.js    ← Tie-breaking dialog (Promise-based)
  templates/
    tie-dialog.hbs            ← Handlebars template for GM tie-break prompt
  styles/
    side_initiative.css       ← Combat tracker UI adjustments
  lang/
    en.json                   ← Localization strings
```

---

## Side Determination

A combatant is on the **player side** if:
- Their token disposition is `CONST.TOKEN_DISPOSITIONS.FRIENDLY`, or
- They are a player character (`combatant.actor.type === "character"` and owned by a player)

All other combatants are on the **enemy side**.

This means friendly NPCs (allied creatures, summoned monsters with friendly disposition) fight alongside the players.

---

## Architecture: SideInitiativeCombat

Extends `dnd5e.documents.Combat5e`. Registered at `init` via `CONFIG.Combat.documentClass = SideInitiativeCombat`, conditional on the `enabled` setting.

### `rollInitiative(ids, options)`

1. For each combatant ID in `ids`, roll a d20.
   - If `useModifiers` is enabled, add the combatant's initiative modifier to the roll.
2. Group rolls by side (player side / enemy side).
3. Aggregate each side's rolls to a single value:
   - `"highest"` → `Math.max(...rolls)`
   - `"average"` → `Math.round(sum / count)`
4. Compare the two side totals:
   - **Tie:** open `SideInitiativeDialog` and `await` the GM's decision (Reroll, Players Win, GM Wins).
     - *Reroll:* recursively call `rollInitiative` for all combatant IDs and return.
     - *Players Win / GM Wins:* treat the chosen side as having rolled higher.
5. Set initiative values on all combatants via `this.setInitiative()`:
   - Winning side → side aggregate value
   - Losing side → side aggregate value minus 1 (ensures correct sort order in tracker)
6. Post one chat roll message per side showing all individual d20 results and the aggregated total. Uses the standard FoundryVTT `Roll` API so Dice So Nice and the dice tray work automatically.

### Tie-breaking: SideInitiativeDialog

A `Dialog` subclass that returns a Promise resolving to `"reroll"`, `"players"`, or `"gm"`. Rendered for the GM only. Template: `templates/tie-dialog.hbs`.

---

## Combat Tracker UI

Changes applied via `Hooks.on("renderCombatTracker", ...)` and CSS — no tracker subclassing.

### Modifications

- Each combatant row receives `data-side="player"` or `data-side="enemy"` during the render hook.
- CSS applies a subtle left border color per side (blue = players, red = enemies).
- A **Roll Side Initiative** button is added to the tracker header, calling `combat.rollInitiative()` on all combatants.
- Per-combatant initiative roll buttons in each row are hidden via CSS when the module is enabled.
- When `useModifiers` is on, a tooltip on each combatant row displays the modifier applied to their roll.

### Initiative Display

Each combatant's initiative value in the tracker is the **side's aggregate roll** (set directly on the combatant document), so the default tracker sorting and display handle it without further patching.

---

## Chat Output

One `ChatMessage` per side per initiative round, containing:
- The side name ("Players" / "Enemies")
- All individual d20 roll results with combatant names
- The aggregated side total and which aggregation mode was used
- If `useModifiers` is on, each roll shown as `d20 + modifier = total`

---

## Variant Rules Summary

| Variant | Setting | Behavior |
|---|---|---|
| Initiative modifiers | `useModifiers: true` | Each combatant adds their initiative modifier to their d20 roll before aggregation |
| Average aggregation | `aggregation: "average"` | Side total = mean of all rolls (rounded), instead of the maximum |

---

## Dependencies

- FoundryVTT v14+
- dnd5e system (required, provides `Combat5e` base class)
- No third-party module dependencies

---

## Out of Scope

- More than two sides (future work)
- Per-scene or per-encounter side configuration
- Custom side names or colors (hardcoded for now)
