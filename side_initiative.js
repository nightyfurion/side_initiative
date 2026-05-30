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
