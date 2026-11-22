// Aether Duel — seeded random numbers and the draw/discard piles.
//
// The whole match runs on one seeded generator (mulberry32), so a match
// started with ?seed=N plays out identically every time. Screenshots and
// tests use fixed seeds; a normal game seeds from the clock.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle, driven by the given generator. Returns a new array.
export function shuffle(array, random) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A draw pile with a discard pile: when the draw pile runs out it is
// refilled by shuffling the discard pile back in.
export function createPiles(cardIds, random) {
  return {
    draw: shuffle(cardIds, random),
    discard: [],
    random,
  };
}

// Draw one card id, refilling from the discard pile when empty.
// Returns null only when both piles are empty.
export function drawCard(piles) {
  if (piles.draw.length === 0) {
    if (piles.discard.length === 0) return null;
    piles.draw = shuffle(piles.discard, piles.random);
    piles.discard = [];
  }
  return piles.draw.pop();
}

export function discardCard(piles, cardId) {
  piles.discard.push(cardId);
}
