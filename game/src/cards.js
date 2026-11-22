// Aether Duel — card definitions.
//
// Three elements, told apart by colour AND shape (never text alone):
//   Ember  — red, triangle  ▲  — raw damage
//   Tide   — blue, circle   ●  — card draw and flow
//   Grove  — green, diamond ◆  — armour and healing
//
// Playing two cards of the same element in one turn triggers that
// element's chain bonus (see game.js): Ember +2 damage, Tide +1 draw,
// Grove +3 armour. That is the game's central decision: spend mana on
// the strongest single card, or chain two of an element for the bonus?

export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e5484d', dark: '#8f1d22', glyph: '▲', chain: 'Chain: +2 damage' },
  tide: { name: 'Tide', color: '#3e8ef7', dark: '#14467f', glyph: '●', chain: 'Chain: draw 1 card' },
  grove: { name: 'Grove', color: '#46a758', dark: '#1e4d2a', glyph: '◆', chain: 'Chain: +3 armour' },
};

// One card: id, name, element, mana cost, and its effect numbers.
// damage = health damage to the opponent; armour = block gained;
// heal = health restored to the player; draw = cards drawn.
// text is the one-line rule shown on the card face.
export const CARDS = [
  { id: 'cinder-jab', name: 'Cinder Jab', element: 'ember', cost: 0, damage: 2, armour: 0, heal: 0, draw: 0, text: 'Deal 2 damage.' },
  { id: 'ember-strike', name: 'Ember Strike', element: 'ember', cost: 1, damage: 4, armour: 0, heal: 0, draw: 0, text: 'Deal 4 damage.' },
  { id: 'flame-lash', name: 'Flame Lash', element: 'ember', cost: 2, damage: 7, armour: 0, heal: 0, draw: 0, text: 'Deal 7 damage.' },
  { id: 'wildfire', name: 'Wildfire', element: 'ember', cost: 3, damage: 9, armour: 0, heal: 0, draw: 0, text: 'Deal 9 damage.' },
  { id: 'tide-pull', name: 'Tide Pull', element: 'tide', cost: 1, damage: 0, armour: 0, heal: 0, draw: 2, text: 'Draw 2 cards.' },
  { id: 'undertow', name: 'Undertow', element: 'tide', cost: 2, damage: 3, armour: 0, heal: 0, draw: 1, text: 'Deal 3 damage. Draw 1 card.' },
  { id: 'deep-current', name: 'Deep Current', element: 'tide', cost: 3, damage: 0, armour: 0, heal: 0, draw: 3, text: 'Draw 3 cards.' },
  { id: 'mist-step', name: 'Mist Step', element: 'tide', cost: 1, damage: 0, armour: 5, heal: 0, draw: 1, text: 'Gain 5 armour. Draw 1 card.' },
  { id: 'bark-shield', name: 'Bark Shield', element: 'grove', cost: 1, damage: 0, armour: 6, heal: 0, draw: 0, text: 'Gain 6 armour.' },
  { id: 'thorn-vine', name: 'Thorn Vine', element: 'grove', cost: 2, damage: 3, armour: 4, heal: 0, draw: 0, text: 'Deal 3 damage. Gain 4 armour.' },
  { id: 'lifebloom', name: 'Lifebloom', element: 'grove', cost: 2, damage: 0, armour: 0, heal: 6, draw: 0, text: 'Restore 6 health.' },
  { id: 'root-snare', name: 'Root Snare', element: 'grove', cost: 1, damage: 2, armour: 3, heal: 0, draw: 0, text: 'Deal 2 damage. Gain 3 armour.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// The starting deck: two copies of every card, 24 cards in all.
export function buildDeck() {
  const deck = [];
  for (const card of CARDS) {
    deck.push(card.id, card.id);
  }
  return deck;
}
