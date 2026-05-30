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
