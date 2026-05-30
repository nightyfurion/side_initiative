# Side Initiative

A FoundryVTT module that implements the **Side Initiative** variant rule from D&D 5e for faster, more dynamic combat.

## What It Does

Instead of every combatant rolling their own initiative, each side rolls as a group. The side with the highest roll acts first — all members of the winning side can act in any order they choose, then the other side goes.

This makes combat faster and rewards teamwork. On the downside, the winning side can focus-fire before the other side gets a chance to act.

## Requirements

- FoundryVTT v12+ (verified on v14)
- D&D 5e system v3.3.0+ (verified on v4)

## How It Works

1. Add combatants to the combat tracker as normal.
2. Click the **Roll Side Initiative** button (d20 icon) in the tracker header.
3. Every combatant rolls a d20. The module derives a single value per side and sets tracker order accordingly.
4. Two chat messages are posted — one per side — showing each combatant's individual roll and the side total.

**Sides:** Tokens with Friendly or Party disposition, and all player characters, fight on the player side. Everything else is on the enemy side.

**Ties:** If both sides roll the same total, the GM is shown a prompt: Reroll, Players Win, or GM Wins.

## Settings

| Setting | Default | Description |
|---|---|---|
| Enable Side Initiative | On | Activates the module. Toggle off to revert to standard per-combatant initiative without a world reload. |
| Initiative Aggregation | Highest Roll | How the side's initiative total is derived — **Highest Roll** (max of all rolls) or **Average Roll** (mean, rounded). |
| Use Initiative Modifiers | Off | Variant: each combatant adds their initiative modifier to their d20 roll before aggregation. |

## Installation

Install via the FoundryVTT module browser, or paste this manifest URL into **Add-on Modules → Install Module**:

```
https://raw.githubusercontent.com/nightyfurion/side_initiative/main/module.json
```

## License

MIT
