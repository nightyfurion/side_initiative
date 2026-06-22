import { createSideInitiativeCombat } from './SideInitiativeCombat.js';
import { getCombatantSide, isCombatantOnActiveSide } from './side-utils.js';

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

Hooks.on('renderCombatTracker', (app, htmlOrElement, context) => {
  document.body.classList.toggle('side-initiative-active',
    game.settings.get('side_initiative', 'enabled'));
  if (!game.settings.get('side_initiative', 'enabled')) return;
  const combat = app.viewed ?? game.combat;
  if (!combat) return;

  // Support both ApplicationV1 (jQuery) and ApplicationV2 (HTMLElement)
  const element = htmlOrElement instanceof HTMLElement ? htmlOrElement : htmlOrElement[0];

  // Use the live app root so partial re-renders don't miss other combatant rows
  const root = (app.element instanceof HTMLElement ? app.element : element);

  // Use combat.turns (the array the template was built from) so IDs always match
  const activeSide = combat.combatant
    ? getCombatantSide(combat.combatant)
    : null;

  root.querySelectorAll('[data-combatant-id]').forEach(el => {
    const combatant = combat.turns.find(c => c.id === el.dataset.combatantId);
    if (!combatant) return;
    const side = getCombatantSide(combatant);
    el.dataset.side = side;
    el.dataset.sideActive = activeSide && side === activeSide ? 'true' : 'false';
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

Hooks.once('ready', () => {
  installMonksTokenBarPatch();
});

Hooks.once('monks-tokenbar.ready', installMonksTokenBarPatch);

function installMonksTokenBarPatch() {
  // Monk's Token Bar checks the single active combatant before allowing movement.
  // Side initiative needs every combatant on that active side to pass the same gate.
  if (!game.modules.get('monks-tokenbar')?.active) return;

  const MonksTokenBar = globalThis.MonksTokenBar;
  if (!MonksTokenBar || typeof MonksTokenBar.canMoveCombatant !== 'function') return;
  if (MonksTokenBar.canMoveCombatant._sideInitiativePatched) return;

  const canMoveCombatant = MonksTokenBar.canMoveCombatant;
  MonksTokenBar.canMoveCombatant = function(combatant, tokenId, token) {
    if (
      game.settings.get('side_initiative', 'enabled')
      && game.combat?.started
      && isCombatantOnActiveSide(game.combat, combatant)
    ) {
      return true;
    }
    return canMoveCombatant.call(this, combatant, tokenId, token);
  };
  MonksTokenBar.canMoveCombatant._sideInitiativePatched = true;
}
