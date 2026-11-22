// Aether Duel — everything the player sees: the title screen, the
// table, both hands, health and mana, the duel log, and the win/loss
// screens. Pure DOM rendering; game.js owns the rules, this file only
// draws the state it is given.

import { CARD_BY_ID, ELEMENTS } from './cards.js';
import { MAX_HEALTH } from './game.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Build the static shell once: header, table zones, sidebar, overlays.
// Returns the refs main.js wires events to.
export function mountUI(root) {
  root.innerHTML = '';
  const app = el('div', 'app');
  const header = el('header', 'topbar');
  header.append(
    el('div', 'brand', 'AETHER DUEL'),
    Object.assign(el('div', 'top-actions'), {}),
  );
  const muteBtn = el('button', 'icon-btn', 'Sound: on');
  muteBtn.id = 'mute-btn';
  const restartBtn = el('button', 'icon-btn', 'Restart (R)');
  restartBtn.id = 'restart-btn';
  const titleBtn = el('button', 'icon-btn', 'Title (Esc)');
  titleBtn.id = 'title-btn';
  header.querySelector('.top-actions').append(muteBtn, restartBtn, titleBtn);

  const main = el('main', 'layout');
  const table = el('section', 'table');
  table.id = 'table';

  const foeZone = el('div', 'foe-zone');
  const foeInfo = el('div', 'combatant foe-info');
  foeInfo.innerHTML =
    '<div class="portrait foe-portrait">W</div>' +
    '<div class="vitals"><div class="who">The Warden <span class="intent" id="foe-intent"></span></div>' +
    '<div class="health-row"><div class="health-bar"><div class="health-fill" id="foe-health-fill"></div></div>' +
    '<span class="health-num" id="foe-health-num"></span>' +
    '<span class="armour-num" id="foe-armour-num"></span></div></div>' +
    '<div class="piles"><span id="foe-deck-count"></span> deck · <span id="foe-hand-count"></span> in hand</div>';
  const foeHand = el('div', 'hand foe-hand');
  foeHand.id = 'foe-hand';
  foeZone.append(foeInfo, foeHand);

  const center = el('div', 'center');
  center.innerHTML =
    '<div class="turn-banner" id="turn-banner"></div>' +
    '<div class="center-row">' +
    '<div class="played" id="played-slot"><div class="played-empty">The table awaits its first card.</div></div>' +
    '<div class="controls"><div class="mana" id="mana-row"></div>' +
    '<div class="chain-row" id="chain-row"></div>' +
    '<button class="end-turn" id="end-turn-btn">End Turn (Space)</button></div></div>';

  const playerZone = el('div', 'player-zone');
  const playerHand = el('div', 'hand player-hand');
  playerHand.id = 'player-hand';
  const playerInfo = el('div', 'combatant player-info');
  playerInfo.innerHTML =
    '<div class="portrait player-portrait">Y</div>' +
    '<div class="vitals"><div class="who">You</div>' +
    '<div class="health-row"><div class="health-bar"><div class="health-fill" id="player-health-fill"></div></div>' +
    '<span class="health-num" id="player-health-num"></span>' +
    '<span class="armour-num" id="player-armour-num"></span></div></div>' +
    '<div class="piles"><span id="player-deck-count"></span> deck · <span id="player-discard-count"></span> discard</div>';
  playerZone.append(playerHand, playerInfo);

  table.append(foeZone, center, playerZone);

  const side = el('aside', 'sidebar');
  side.innerHTML =
    '<h2>Duel Log</h2><ol class="log" id="duel-log"></ol>' +
    '<h2>Chains</h2><ul class="legend">' +
    '<li><span class="dot ember">▲</span> Ember ×2 in a turn: +2 damage</li>' +
    '<li><span class="dot tide">●</span> Tide ×2 in a turn: draw 1 card</li>' +
    '<li><span class="dot grove">◆</span> Grove ×2 in a turn: +3 armour</li></ul>' +
    '<h2>Keys</h2><p class="keys">1–7 play a card · Space ends your turn · R restarts · Esc goes to the title.</p>';
  main.append(table, side);

  const title = el('div', 'overlay title-screen');
  title.id = 'title-screen';
  title.innerHTML =
    '<div class="title-card"><div class="title-glyphs"><span class="ember">▲</span><span class="tide">●</span><span class="grove">◆</span></div>' +
    '<h1>AETHER DUEL</h1><p class="tagline">A turn-based card battler. Outplay the Warden — chain your elements, guard your health, and take theirs to zero.</p>' +
    '<button class="play-btn" id="play-btn">Play the Duel</button>' +
    '<div class="howto"><h3>How to play</h3><ul>' +
    '<li>Each turn you gain mana and draw a card. Click a card (or press 1–7) to play it.</li>' +
    '<li>Ember deals damage, Tide draws cards, Grove guards and heals.</li>' +
    '<li>Play two cards of one element in a turn to fire its chain bonus.</li>' +
    '<li>The Warden declares its intent before it acts — read it and counter.</li>' +
    '<li>First to 0 health loses.</li></ul></div></div>';

  const end = el('div', 'overlay end-screen hidden');
  end.id = 'end-screen';
  end.innerHTML =
    '<div class="end-card"><h1 id="end-title"></h1><p id="end-line"></p>' +
    '<div class="end-stats" id="end-stats"></div>' +
    '<button class="play-btn" id="again-btn">Play Again</button></div>';

  app.append(header, main, title, end);
  root.append(app);
  return {
    table,
    titleScreen: title,
    playBtn: title.querySelector('#play-btn'),
    endScreen: end,
    endTitle: end.querySelector('#end-title'),
    endLine: end.querySelector('#end-line'),
    endStats: end.querySelector('#end-stats'),
    againBtn: end.querySelector('#again-btn'),
    endTurnBtn: center.querySelector('#end-turn-btn'),
    muteBtn,
    restartBtn,
    titleBtn,
    banner: center.querySelector('#turn-banner'),
    playedSlot: center.querySelector('#played-slot'),
  };
}

function statBits(card) {
  const bits = [];
  if (card.damage > 0) bits.push(`DMG ${card.damage}`);
  if (card.armour > 0) bits.push(`ARM ${card.armour}`);
  if (card.heal > 0) bits.push(`HEAL ${card.heal}`);
  if (card.draw > 0) bits.push(`DRAW ${card.draw}`);
  return bits.join(' · ');
}

function cardFace(card, index, playable) {
  const e = ELEMENTS[card.element];
  const btn = el('button', `card ${card.element}${playable ? '' : ' unplayable'}`);
  btn.dataset.index = String(index);
  btn.title = `${card.name} — ${card.text}`;
  const cost = el('span', 'cost', String(card.cost));
  const glyph = el('span', 'glyph', e.glyph);
  const name = el('span', 'name', card.name);
  const art = el('span', 'art', e.glyph);
  const text = el('span', 'text', card.text);
  const stats = el('span', 'stats', statBits(card));
  btn.append(cost, glyph, name, art, text, stats);
  return btn;
}

function cardBack() {
  const back = el('div', 'card-back');
  back.append(el('span', 'back-glyph', '✦'));
  return back;
}

function setVitals(prefix, side) {
  const fill = document.getElementById(`${prefix}-health-fill`);
  const num = document.getElementById(`${prefix}-health-num`);
  const arm = document.getElementById(`${prefix}-armour-num`);
  fill.style.width = `${Math.round((side.health / side.maxHealth) * 100)}%`;
  num.textContent = `${side.health} / ${side.maxHealth} HP`;
  arm.textContent = side.armour > 0 ? `ARM ${side.armour}` : '';
  arm.classList.toggle('has-armour', side.armour > 0);
}

// Draw the whole match state. Called after every action.
export function render(match, ui, opts = {}) {
  const inTitle = match.phase === 'title';
  ui.titleScreen.classList.toggle('hidden', !inTitle);
  ui.endScreen.classList.toggle('hidden', match.phase !== 'over');

  setVitals('foe', match.foe);
  setVitals('player', match.player);
  document.getElementById('foe-deck-count').textContent = match.foe.piles.draw.length;
  document.getElementById('foe-hand-count').textContent = match.foe.hand.length;
  document.getElementById('player-deck-count').textContent = match.player.piles.draw.length;
  document.getElementById('player-discard-count').textContent = match.player.piles.discard.length;

  // Opponent's hand: face-down backs, one per card.
  const foeHand = document.getElementById('foe-hand');
  foeHand.innerHTML = '';
  match.foe.hand.forEach(() => foeHand.append(cardBack()));

  // The player's hand: face-up, playable cards lit.
  const playerHand = document.getElementById('player-hand');
  playerHand.innerHTML = '';
  match.player.hand.forEach((id, i) => {
    const card = CARD_BY_ID[id];
    const playable = match.phase === 'player' && match.player.mana >= card.cost;
    playerHand.append(cardFace(card, i, playable));
  });

  // Mana pips.
  const manaRow = document.getElementById('mana-row');
  manaRow.innerHTML = '';
  for (let i = 0; i < match.player.maxMana; i += 1) {
    manaRow.append(el('span', `mana-pip${i < match.player.mana ? ' full' : ''}`, '●'));
  }
  manaRow.append(el('span', 'mana-num', `${match.player.mana}/${match.player.maxMana} mana`));

  // Chain progress this turn.
  const chainRow = document.getElementById('chain-row');
  chainRow.innerHTML = '';
  for (const [key, info] of Object.entries(ELEMENTS)) {
    const n = match.chain[key];
    const chip = el('span', `chain-chip ${key}${n >= 2 ? ' fired' : ''}`, `${info.glyph} ×${n}`);
    chip.title = info.chain;
    chainRow.append(chip);
  }

  // The log, newest first.
  const logEl = document.getElementById('duel-log');
  logEl.innerHTML = '';
  match.log.slice(0, 12).forEach((line) => logEl.append(el('li', '', line)));

  // Intent + banner.
  const intentEl = document.getElementById('foe-intent');
  intentEl.textContent = opts.intent ? `— ${opts.intent}` : '';
  const banner = ui.banner;
  if (match.phase === 'player') banner.textContent = `Your turn — turn ${match.turn}`;
  else if (match.phase === 'ai') banner.textContent = `The Warden's turn — turn ${match.turn}`;
  else banner.textContent = '';

  ui.endTurnBtn.disabled = match.phase !== 'player';

  // The last played card stays on the table as a record of the action.
  if (match.lastPlay) {
    const { card, side } = match.lastPlay;
    const slot = ui.playedSlot;
    slot.innerHTML = '';
    const shown = cardFace(card, -1, true);
    shown.classList.add('played-card');
    shown.disabled = true;
    slot.append(shown, el('div', 'played-by', side === 'player' ? 'You played' : 'The Warden played'));
  }

  if (match.phase === 'over') showEndScreen(match, ui);
}

export function showEndScreen(match, ui) {
  const won = match.winner === 'player';
  ui.endTitle.textContent = won ? 'VICTORY!' : 'DEFEAT';
  ui.endTitle.className = won ? 'win' : 'lose';
  ui.endLine.textContent = won
    ? 'The Warden falls. The aether is yours.'
    : 'The Warden stands. The aether keeps its secrets — for now.';
  ui.endStats.innerHTML = '';
  const rows = [
    ['Turns', match.turn],
    ['Cards played', match.stats.cardsPlayed],
    ['Damage dealt', match.stats.damageDealt],
    ['Your health', `${match.player.health} / ${MAX_HEALTH}`],
  ];
  rows.forEach(([label, value]) => {
    const row = el('div', 'stat-row');
    row.append(el('span', 'stat-label', label), el('span', 'stat-value', String(value)));
    ui.endStats.append(row);
  });
}

// Floating combat text over a target: damage, armour, healing.
export function floatText(container, text, kind) {
  const node = el('div', `float-text ${kind}`, text);
  node.style.left = `${38 + Math.random() * 24}%`;
  node.style.top = `${30 + Math.random() * 20}%`;
  container.append(node);
  setTimeout(() => node.remove(), 1400);
}

export function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth; // restart the animation
  node.classList.add('shake');
}
