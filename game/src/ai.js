// Aether Duel — the Warden's brain.
//
// The AI plays by simple, readable rules, and it declares its intent
// before it acts, so the player can read its plan and counter it:
//   attack — it is coming for your health this turn
//   defend — it is shoring up armour or healing
//   gather — it is drawing cards, setting up a later turn
//
// Its card choice, in order: take the kill when it is there; defend
// when its own health is low; otherwise spend mana on the best
// damage-per-mana it can afford, drawing when its hand is thin.

import { CARD_BY_ID } from './cards.js';

export function planIntent(match) {
  const foe = match.foe;
  const player = match.player;
  const playable = foe.hand
    .map((id, i) => ({ card: CARD_BY_ID[id], index: i }))
    .filter(({ card }) => card.cost <= foe.mana);
  if (playable.length === 0) return 'gather';

  const lethal = playable.some(({ card }) => {
    const through = Math.max(0, card.damage - player.armour);
    return through >= player.health;
  });
  if (lethal) return 'attack';

  if (foe.health <= 12 && playable.some(({ card }) => card.armour > 0 || card.heal > 0)) {
    return 'defend';
  }
  if (foe.hand.length <= 2 && playable.some(({ card }) => card.draw > 0)) {
    return 'gather';
  }
  return 'attack';
}

export function describeIntent(intent) {
  if (intent === 'attack') return 'The Warden gathers embers — an attack is coming.';
  if (intent === 'defend') return 'The Warden raises its guard.';
  return 'The Warden draws deep, planning ahead.';
}

// Pick the next card the AI plays: a hand index, or -1 to end its turn.
export function pickCard(match) {
  const foe = match.foe;
  const player = match.player;
  const playable = foe.hand
    .map((id, i) => ({ card: CARD_BY_ID[id], index: i }))
    .filter(({ card }) => card.cost <= foe.mana);
  if (playable.length === 0) return -1;

  // 1. Lethal damage ends the game now.
  const lethal = playable.find(({ card }) => Math.max(0, card.damage - player.armour) >= player.health);
  if (lethal) return lethal.index;

  // 2. Hurt and able to defend: heal first, then armour.
  if (foe.health <= 12) {
    const heal = playable.find(({ card }) => card.heal > 0);
    if (heal) return heal.index;
    const guard = playable
      .filter(({ card }) => card.armour > 0)
      .sort((a, b) => b.card.armour - a.card.armour)[0];
    if (guard) return guard.index;
  }

  // 3. Thin hand and a draw in reach: refill before spending.
  if (foe.hand.length <= 2) {
    const draw = playable
      .filter(({ card }) => card.draw > 0)
      .sort((a, b) => b.card.draw - a.card.draw)[0];
    if (draw) return draw.index;
  }

  // 4. Otherwise the best damage per mana, breaking ties toward the
  // card that also draws or guards.
  const scored = playable.map(({ card, index }) => {
    const value = card.damage * 2 + card.armour + card.heal + card.draw * 2;
    return { index, score: value / Math.max(1, card.cost) };
  });
  scored.sort((a, b) => b.score - a.score);
  // A 0-cost card is always worth playing; a pricey card only when it
  // is clearly the best use of the mana left.
  return scored[0].index;
}
