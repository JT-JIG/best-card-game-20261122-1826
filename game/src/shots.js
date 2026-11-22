// Aether Duel — screenshot staging.
//
// ?shot=title  the title screen (the game's opening state)
// ?shot=table  a mid-game table: turn 4, both hands out, health and
//              mana mid-fight, a played card on the table
// ?shot=win    the victory screen, with match stats
// ?shot=loss   the defeat screen, with match stats
//
// These states are built from the game's own state and drawn by its
// own renderer, so every screenshot is a real render of the game.
// shots.json names the four queries the maker used.

import { CARD_BY_ID } from './cards.js';
import { beginMatch, logEvent } from './game.js';

function setPiles(side, drawCount, discardCount) {
  side.piles.draw = Array.from({ length: drawCount }, () => 'ember-strike');
  side.piles.discard = Array.from({ length: discardCount }, () => 'bark-shield');
}

function stageTable(match) {
  beginMatch(match);
  match.turn = 4;
  match.phase = 'player';
  match.stats.turnsTaken = 4;
  match.stats.cardsPlayed = 9;
  match.stats.damageDealt = 12;

  const p = match.player;
  p.health = 22;
  p.armour = 5;
  p.maxMana = 6;
  p.mana = 4;
  p.hand = ['flame-lash', 'mist-step', 'thorn-vine', 'ember-strike', 'tide-pull'];
  setPiles(p, 14, 5);

  const f = match.foe;
  f.health = 18;
  f.armour = 2;
  f.hand = ['bark-shield', 'wildfire', 'undertow', 'lifebloom'];
  setPiles(f, 15, 5);

  match.chain = { ember: 1, tide: 0, grove: 1 };
  match.chainFired = { ember: false, tide: false, grove: false };
  match.lastPlay = { side: 'player', card: CARD_BY_ID['ember-strike'] };
  match.log = [
    'Turn 4 begins. Your move.',
    'You played Ember Strike — 4 damage.',
    'The Warden played Bark Shield — 6 armour.',
    'The Warden played Undertow — 3 damage. Drew 1 card.',
    'You played Thorn Vine — 3 damage, 4 armour.',
  ];
}

function stageEnd(match, winner) {
  beginMatch(match);
  match.phase = 'over';
  match.winner = winner;
  match.turn = 7;
  match.stats = { cardsPlayed: 18, damageDealt: 34, turnsTaken: 7 };
  if (winner === 'player') {
    match.player.health = 9;
    match.player.armour = 0;
    match.foe.health = 0;
    match.foe.armour = 0;
    logEvent(match, 'You played Wildfire — 9 damage. The Warden falls!');
  } else {
    match.player.health = 0;
    match.player.armour = 0;
    match.foe.health = 14;
    match.foe.armour = 3;
    logEvent(match, 'The Warden played Flame Lash — 7 damage. You fall.');
  }
}

export function stageShot(match, shot) {
  if (shot === 'table') stageTable(match);
  else if (shot === 'win') stageEnd(match, 'player');
  else if (shot === 'loss') stageEnd(match, 'foe');
  // 'title' and anything else: leave the match at its opening state.
}
