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
