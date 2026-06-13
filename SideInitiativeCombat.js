import { getSide, aggregateRolls, findNextSideIndex } from './side-utils.js';
import { SideInitiativeDialog } from './SideInitiativeDialog.js';

export function createSideInitiativeCombat(BaseCombat) {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
        const name = escapeHtml(combatant.name);
        if (useModifiers) {
          const die = roll.dice[0]?.total ?? roll.total;
          const mod = combatant.actor?.system?.attributes?.init?.total ?? 0;
          const sign = mod >= 0 ? '+' : '-';
          return `${name}: ${die} ${sign} ${Math.abs(mod)} = ${roll.total}`;
        }
        return `${name}: ${roll.total}`;
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

    async nextTurn() {
      if (!game.settings.get('side_initiative', 'enabled')) {
        return super.nextTurn();
      }
      if (!this.combatant) return super.nextTurn();

      const sides = this.turns.map(c =>
        getSide(c.token?.disposition, c.actor?.type)
      );
      const currentSide = sides[this.turn];
      const nextIndex = findNextSideIndex(sides, this.turn);

      if (nextIndex === -1) return this.nextRound();

      // We skip super.nextTurn() (Combat5e), so call endTurn/startTurn ourselves
      // for the whole side so dnd5e refreshes movement and action economy for everyone.
      for (const c of this.turns) {
        if (getSide(c.token?.disposition, c.actor?.type) === currentSide) {
          await c.endTurn?.(this);
        }
      }

      await this.update({ turn: nextIndex });

      const newSide = sides[nextIndex];
      for (const c of this.turns) {
        if (getSide(c.token?.disposition, c.actor?.type) === newSide) {
          await c.startTurn?.(this);
        }
      }

      return this;
    }

    async startCombat() {
      if (!game.settings.get('side_initiative', 'enabled')) {
        return super.startCombat();
      }
      // super.startCombat() (Combat5e) calls startTurn for this.combatant; handle the rest.
      const result = await super.startCombat();
      if (!this.combatant) return result;
      const activeSide = getSide(this.combatant.token?.disposition, this.combatant.actor?.type);
      for (const c of this.turns) {
        if (c.id === this.combatant.id) continue;
        if (getSide(c.token?.disposition, c.actor?.type) === activeSide) {
          await c.startTurn?.(this);
        }
      }
      return result;
    }

    async nextRound() {
      if (!game.settings.get('side_initiative', 'enabled')) {
        return super.nextRound();
      }
      // End turns for non-"official" current side members before super handles the rest.
      if (this.combatant) {
        const currentSide = getSide(this.combatant.token?.disposition, this.combatant.actor?.type);
        for (const c of this.turns) {
          if (c.id === this.combatant.id) continue;
          if (getSide(c.token?.disposition, c.actor?.type) === currentSide) {
            await c.endTurn?.(this);
          }
        }
      }
      const result = await super.nextRound();
      // Start turns for non-"official" new side members (super handles this.combatant).
      if (this.combatant) {
        const activeSide = getSide(this.combatant.token?.disposition, this.combatant.actor?.type);
        for (const c of this.turns) {
          if (c.id === this.combatant.id) continue;
          if (getSide(c.token?.disposition, c.actor?.type) === activeSide) {
            await c.startTurn?.(this);
          }
        }
      }
      return result;
    }
  };
}
