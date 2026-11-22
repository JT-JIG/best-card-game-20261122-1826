// Aether Duel — the match state machine: turns, mana, health, armour,
// chains, and the win/loss conditions. No DOM here; render.js draws
// whatever this module's state says.

import { CARD_BY_ID, buildDeck } from './cards.js';
import { createPiles, drawCard, discardCard, mulberry32 } from './deck.js';

export const MAX_HEALTH = 30;
export const MAX_ARMOUR = 15;
export const MAX_MANA = 10;
export const HAND_LIMIT = 7;
export const STARTING_HAND = 4;

function newSide(seed) {
  return {
    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    armour: 0,
    mana: 0,
    maxMana: 0,
    hand: [],
    piles: createPiles(buildDeck(), mulberry32(seed)),
  };
}

export function createMatch(seed) {
  const match = {
    seed,
    turn: 1,
    phase: 'title', // title | player | ai | over
    player: newSide(seed),
    foe: newSide(seed + 7919),
    chain: { ember: 0, tide: 0, grove: 0 },
    chainFired: { ember: false, tide: false, grove: false },
    log: [],
    stats: { cardsPlayed: 0, damageDealt: 0, turnsTaken: 0 },
    winner: null,
    lastPlay: null,
  };
  return match;
}

export function logEvent(match, text) {
  match.log.unshift(text);
  if (match.log.length > 40) match.log.length = 40;
}

// Begin a side's turn: one more max mana (up to 10), a full refill,
// one card drawn, and the chain counters reset for the new turn.
export function startTurn(match, side) {
  const s = match[side];
  s.maxMana = Math.min(MAX_MANA, s.maxMana + 1);
  s.mana = s.maxMana;
  match.chain = { ember: 0, tide: 0, grove: 0 };
  match.chainFired = { ember: false, tide: false, grove: false };
  drawIntoHand(match, side, 1);
}

export function drawIntoHand(match, side, count) {
  const s = match[side];
  for (let i = 0; i < count; i += 1) {
    if (s.hand.length >= HAND_LIMIT) return; // hand full: the card is lost
    const id = drawCard(s.piles);
    if (id === null) return;
    s.hand.push(id);
  }
}

function dealDamage(match, side, amount) {
  const s = match[side];
  let left = amount;
  const absorbed = Math.min(s.armour, left);
  s.armour -= absorbed;
  left -= absorbed;
  s.health = Math.max(0, s.health - left);
  return { absorbed, dealt: left };
}

export function canPlay(match, side, handIndex) {
  // The active phase is named 'player' for the player and 'ai' for the
  // foe — a side may only play on its own turn.
  const activePhase = side === 'player' ? 'player' : 'ai';
  if (match.phase !== activePhase) return false;
  const card = CARD_BY_ID[match[side].hand[handIndex]];
  if (!card) return false;
  return match[side].mana >= card.cost;
}

// Play the card at handIndex for side. Returns a report of what the
// card did (for the log and the floating combat text), or null when
// the play is illegal.
export function playCard(match, side, handIndex) {
  if (!canPlay(match, side, handIndex)) return null;
  const me = match[side];
  const other = side === 'player' ? 'foe' : 'player';
  const cardId = me.hand[handIndex];
  const card = CARD_BY_ID[cardId];
  me.mana -= card.cost;
  me.hand.splice(handIndex, 1);
  discardCard(me.piles, cardId);

  // The chain: the second card of an element played this turn fires
  // that element's bonus once.
  match.chain[card.element] += 1;
  let chainBonus = null;
  if (match.chain[card.element] === 2 && !match.chainFired[card.element]) {
    match.chainFired[card.element] = true;
    chainBonus = card.element;
  }

  let damage = card.damage;
  if (chainBonus === 'ember') damage += 2;
  const hit = damage > 0 ? dealDamage(match, other, damage) : { absorbed: 0, dealt: 0 };
  if (side === 'player') match.stats.damageDealt += hit.dealt;

  const armour = card.armour + (chainBonus === 'grove' ? 3 : 0);
  if (armour > 0) me.armour = Math.min(MAX_ARMOUR, me.armour + armour);
  if (card.heal > 0) me.health = Math.min(me.maxHealth, me.health + card.heal);
  const draws = card.draw + (chainBonus === 'tide' ? 1 : 0);
  if (draws > 0) drawIntoHand(match, side, draws);

  match.stats.cardsPlayed += 1;
  const report = {
    side,
    card,
    damageDealt: hit.dealt,
    absorbed: hit.absorbed,
    armourGained: armour,
    healed: card.heal,
    drawn: draws,
    chainBonus,
  };
  match.lastPlay = report;
  checkEnd(match);
  return report;
}

function checkEnd(match) {
  if (match.player.health <= 0) {
    match.phase = 'over';
    match.winner = 'foe';
  } else if (match.foe.health <= 0) {
    match.phase = 'over';
    match.winner = 'player';
  }
}

export function isOver(match) {
  return match.phase === 'over';
}

// Deal the opening hands and start the player's first turn.
export function beginMatch(match) {
  drawIntoHand(match, 'player', STARTING_HAND);
  drawIntoHand(match, 'foe', STARTING_HAND);
  match.phase = 'player';
  match.turn = 1;
  match.stats.turnsTaken = 1;
  startTurn(match, 'player');
  logEvent(match, 'The duel begins. Your move.');
}
