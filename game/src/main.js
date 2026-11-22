// Aether Duel — entry point. Wires the table together: the title
// screen, card clicks, keyboard shortcuts, the end-turn button, and
// the Warden's turn, played out card by card so the player can read it.
//
// URL parameters (for tests and screenshots):
//   ?seed=N   fixes the shuffle, so a match replays identically
//   ?shot=    stages a screenshot state (title, table, win, loss)
//   ?fast=1   the Warden plays with no pauses between cards

import { createMatch, beginMatch, startTurn, playCard, isOver, logEvent } from './game.js';
import { planIntent, describeIntent, pickCard } from './ai.js';
import { mountUI, render, floatText, shake } from './render.js';
import { sfx, setMuted, isMuted } from './sound.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const FAST = params.get('fast') === '1';
const seedParam = Number.parseInt(params.get('seed') || '', 10);
const seed = Number.isFinite(seedParam) ? seedParam : Math.floor(Math.random() * 1000000);

const root = document.getElementById('app');
const ui = mountUI(root);
let match = createMatch(seed);
let aiRunning = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describePlay(report) {
  const who = report.side === 'player' ? 'You' : 'The Warden';
  const parts = [];
  if (report.damageDealt > 0) parts.push(`${report.damageDealt} damage`);
  if (report.absorbed > 0) parts.push(`${report.absorbed} absorbed`);
  if (report.armourGained > 0) parts.push(`${report.armourGained} armour`);
  if (report.healed > 0) parts.push(`healed ${report.healed}`);
  if (report.drawn > 0) parts.push(`drew ${report.drawn}`);
  const chain = report.chainBonus ? ` — ${report.card.element} chain!` : '';
  return `${who} played ${report.card.name} — ${parts.join(', ') || 'nothing happens'}${chain}`;
}

function showEffects(report) {
  const table = ui.table;
  if (report.damageDealt > 0) {
    floatText(table, `-${report.damageDealt}`, 'damage');
    sfx.hit();
    shake(report.side === 'player' ? table.querySelector('.foe-zone') : table.querySelector('.player-zone'));
  }
  if (report.armourGained > 0) {
    floatText(table, `+${report.armourGained} ARM`, 'armour');
    sfx.guard();
  }
  if (report.healed > 0) {
    floatText(table, `+${report.healed} HP`, 'heal');
    sfx.heal();
  }
  if (report.drawn > 0) sfx.draw();
}

function endGame() {
  render(match, ui);
  if (match.winner === 'player') sfx.win();
  else sfx.lose();
}

function tryPlayCard(index) {
  if (match.phase !== 'player' || aiRunning) return;
  const report = playCard(match, 'player', index);
  if (!report) return;
  sfx.play();
  logEvent(match, describePlay(report));
  showEffects(report);
  if (isOver(match)) endGame();
  else render(match, ui);
}

async function runAiTurn() {
  if (aiRunning || isOver(match)) return;
  aiRunning = true;
  match.phase = 'ai';
  // The Warden's turn begins like any turn: one more max mana, a full
  // refill, and a card drawn.
  startTurn(match, 'foe');
  const intent = planIntent(match);
  logEvent(match, describeIntent(intent));
  render(match, ui, { intent });
  await sleep(FAST ? 0 : 900);
  while (!isOver(match)) {
    const index = pickCard(match);
    if (index < 0) break;
    const report = playCard(match, 'foe', index);
    if (!report) break;
    logEvent(match, describePlay(report));
    showEffects(report);
    render(match, ui, { intent });
    await sleep(FAST ? 0 : 1100);
  }
  aiRunning = false;
  if (isOver(match)) {
    endGame();
    return;
  }
  match.turn += 1;
  match.stats.turnsTaken += 1;
  match.phase = 'player';
  startTurn(match, 'player');
  logEvent(match, `Turn ${match.turn} begins. Your move.`);
  sfx.turn();
  render(match, ui);
}

function endTurn() {
  if (match.phase !== 'player' || aiRunning) return;
  void runAiTurn();
}

function newMatch(freshSeed) {
  match = createMatch(freshSeed);
  aiRunning = false;
  beginMatch(match);
  render(match, ui);
}

function toTitle() {
  match = createMatch(seed);
  aiRunning = false;
  render(match, ui);
}

// --- events ---------------------------------------------------------------

ui.playBtn.addEventListener('click', () => {
  sfx.turn();
  newMatch(Math.floor(Math.random() * 1000000));
});

ui.againBtn.addEventListener('click', () => {
  sfx.turn();
  newMatch(Math.floor(Math.random() * 1000000));
});

ui.endTurnBtn.addEventListener('click', endTurn);

ui.muteBtn.addEventListener('click', () => {
  setMuted(!isMuted());
  ui.muteBtn.textContent = isMuted() ? 'Sound: off' : 'Sound: on';
});

ui.restartBtn.addEventListener('click', () => {
  if (match.phase === 'title') return;
  newMatch(Math.floor(Math.random() * 1000000));
});

ui.titleBtn.addEventListener('click', toTitle);

ui.table.addEventListener('click', (event) => {
  const cardBtn = event.target.closest('.player-hand .card');
  if (!cardBtn || cardBtn.disabled) return;
  tryPlayCard(Number(cardBtn.dataset.index));
});

document.addEventListener('keydown', (event) => {
  if (event.key >= '1' && event.key <= '7') {
    tryPlayCard(Number(event.key) - 1);
    return;
  }
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    if (match.phase === 'title') ui.playBtn.click();
    else if (match.phase === 'over') ui.againBtn.click();
    else endTurn();
    return;
  }
  if (event.key === 'r' || event.key === 'R') {
    if (match.phase !== 'title') newMatch(Math.floor(Math.random() * 1000000));
    return;
  }
  if (event.key === 'Escape') toTitle();
});

// --- boot -----------------------------------------------------------------

const shot = params.get('shot');
if (shot) {
  stageShot(match, shot);
  render(match, ui);
} else {
  render(match, ui);
}
