'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import Hand from './Hand';
import Stats from './Stats';
import Leaderboard from './Leaderboard';
import {
  createDeck,
  shuffle,
  deal,
  needsShuffle,
  handValue,
  isBlackjack,
  isBust,
  canSplit,
  dealerShouldHit,
  settleHands,
} from '@/lib/blackjack';

const START_BALANCE = 1000;
const CHIPS = [10, 20, 50, 100];
const MAX_HANDS = 4; // splitti saab teha kuni 4 käeni
const STORAGE_KEY = 'blackjack-save';
const EMPTY_STATS = { hands: 0, wins: 0, losses: 0, pushes: 0, blackjacks: 0, peak: START_BALANCE };

const MESSAGES = {
  blackjack: 'Blackjack!',
  win: 'You win!',
  push: 'Push',
  lose: 'Dealer wins',
  bust: 'Bust!',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Saldo ja statistika jäävad brauserisse alles ka pärast lehe värskendamist
function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.balance === 'number') return saved;
  } catch {
    // vigane salvestus, alustame otsast
  }
  return { balance: START_BALANCE, stats: EMPTY_STATS };
}

export default function Game() {
  const [save, setSave] = useState(loadSave);
  const [deck, setDeck] = useState([]);
  // Mängija käed. Ilma splitita on neid üks: [{ cards, stake, done }]
  const [hands, setHands] = useState([]);
  const [active, setActive] = useState(0); // mitmendat kätt praegu mängitakse
  const [dealer, setDealer] = useState([]);
  // 'betting' = panuse valimine, 'player' = mängija käik, 'dealer' = diileri käik
  const [phase, setPhase] = useState('betting');
  const [bet, setBet] = useState(0); // järgmise käe panus
  const [result, setResult] = useState(null);

  const { balance, stats } = save;
  const hand = hands[active];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [save]);

  function addChip(value) {
    if (bet + value <= balance) setBet(bet + value);
  }

  function startRound() {
    const shoe = needsShuffle(deck) ? shuffle(createDeck()) : deck;
    // Kaardid jagatakse vaheldumisi: mängija, diiler, mängija, diiler
    const { cards, deck: rest } = deal(shoe, 4);
    const p = [cards[0], cards[2]];
    const d = [cards[1], cards[3]];
    const first = [{ cards: p, stake: bet, done: false }];

    setDeck(rest);
    setHands(first);
    setActive(0);
    setDealer(d);
    setResult(null);
    setSave((s) => ({ ...s, balance: s.balance - bet }));

    if (isBlackjack(p) || isBlackjack(d)) {
      finishRound(first, d);
    } else {
      setPhase('player');
    }
  }

  // Asendab aktiivse käe uuega
  function withActive(changes) {
    return hands.map((h, i) => (i === active ? { ...h, ...changes } : h));
  }

  // Pärast iga käiku: kas mängida järgmist kätt või on diileri kord
  function continueRound(newHands, shoe) {
    setHands(newHands);
    setDeck(shoe);

    const next = newHands.findIndex((h) => !h.done);
    if (next !== -1) {
      setActive(next);
    } else if (newHands.every((h) => isBust(h.cards))) {
      finishRound(newHands, dealer); // kõik käed bust, diiler ei pea kaarte võtma
    } else {
      dealerTurn(newHands, shoe);
    }
  }

  function hit() {
    const { cards, deck: rest } = deal(deck);
    const newCards = [...hand.cards, ...cards];
    continueRound(withActive({ cards: newCards, done: handValue(newCards).total >= 21 }), rest);
  }

  function stand() {
    continueRound(withActive({ done: true }), deck);
  }

  // Double: panus kahekordseks, mängija saab täpselt ühe kaardi
  function double() {
    const { cards, deck: rest } = deal(deck);
    setSave((s) => ({ ...s, balance: s.balance - hand.stake }));
    continueRound(withActive({ cards: [...hand.cards, ...cards], stake: hand.stake * 2, done: true }), rest);
  }

  // Split: paar jagatakse kaheks käeks, teine käsi saab sama suure panuse.
  // Ässade splitti korral saab kumbki käsi ainult ühe kaardi juurde.
  function split() {
    const { cards, deck: rest } = deal(deck, 2);
    const aces = hand.cards[0].rank === 'A';
    const makeHand = (first, second) => {
      const newCards = [first, second];
      return { cards: newCards, stake: hand.stake, done: aces || handValue(newCards).total === 21 };
    };
    const newHands = [
      ...hands.slice(0, active),
      makeHand(hand.cards[0], cards[0]),
      makeHand(hand.cards[1], cards[1]),
      ...hands.slice(active + 1),
    ];

    setSave((s) => ({ ...s, balance: s.balance - hand.stake }));
    continueRound(newHands, rest);
  }

  // Diiler pöörab peidetud kaardi ja võtab kaarte, kuni tal on vähemalt 17
  async function dealerTurn(finalHands, shoe) {
    setPhase('dealer');
    let d = dealer;
    let rest = shoe;

    while (dealerShouldHit(d)) {
      await sleep(700);
      const next = deal(rest);
      d = [...d, ...next.cards];
      rest = next.deck;
      setDealer(d);
      setDeck(rest);
    }

    await sleep(500);
    finishRound(finalHands, d);
  }

  function finishRound(finalHands, d) {
    const results = settleHands(finalHands, d);
    const staked = finalHands.reduce((sum, h) => sum + h.stake, 0);
    const won = results.reduce((sum, r) => sum + r.won, 0);
    const change = won - staked;
    const count = (...types) => results.filter((r) => types.includes(r.type)).length;

    // Ühe käe puhul näitame selle tulemust, splitti puhul summat kokku
    let type = results[0].type;
    if (results.length > 1) type = change > 0 ? 'win' : change < 0 ? 'lose' : 'push';

    setResult({ type, change, hands: results.map((r) => r.type) });
    setPhase('betting');

    setSave((s) => {
      const newBalance = s.balance + won;
      return {
        balance: newBalance,
        stats: {
          hands: s.stats.hands + results.length,
          wins: s.stats.wins + count('win', 'blackjack'),
          losses: s.stats.losses + count('lose', 'bust'),
          pushes: s.stats.pushes + count('push'),
          blackjacks: s.stats.blackjacks + count('blackjack'),
          peak: Math.max(s.stats.peak, newBalance),
        },
      };
    });
  }

  function startOver() {
    setSave({ balance: START_BALANCE, stats: EMPTY_STATS });
    setBet(0);
    setHands([]);
    setDealer([]);
    setResult(null);
  }

  function resetGame() {
    if (window.confirm('Start over with $1000 and clear your stats?')) startOver();
  }

  const playing = phase === 'player' && hand;
  const canDouble = playing && hand.cards.length === 2 && balance >= hand.stake;
  const canSplitNow = playing && canSplit(hand.cards) && hands.length < MAX_HANDS && balance >= hand.stake;
  const inPlay = hands.reduce((sum, h) => sum + h.stake, 0);
  const isSplit = hands.length > 1;
  const brokeAfterRound = phase === 'betting' && balance < CHIPS[0];

  // Kiirklahvid: H = Hit, S = Stand, D = Double, P = Split
  const onKeyDown = useEffectEvent((event) => {
    if (!playing || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    // Nime kirjutamine edetabeli väljale ei tohi mängus käike teha
    if (event.target.closest?.('input, textarea')) return;

    const key = event.key.toLowerCase();
    if (key === 'h') hit();
    else if (key === 's') stand();
    else if (key === 'd' && canDouble) double();
    else if (key === 'p' && canSplitNow) split();
  });

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="game">
      <div className="table-area">
        <div className="table">
          <Hand label="Dealer" cards={dealer} hideSecond={phase === 'player'} />

          <div className="message">
            {result ? (
              <div className={`result result-${result.type}`}>
                <strong>{MESSAGES[result.type]}</strong>
                <span>
                  {result.change > 0 && `+$${result.change}`}
                  {result.change < 0 && `-$${-result.change}`}
                  {result.change === 0 && 'Bet returned'}
                </span>
              </div>
            ) : (
              <p className="hint">
                {phase === 'betting' && 'Place your bet'}
                {phase === 'player' && `In play: $${inPlay}`}
                {phase === 'dealer' && 'Dealer plays…'}
              </p>
            )}
          </div>

          <div className="player-hands">
            {hands.length === 0 && <Hand label="You" cards={[]} />}
            {hands.map((h, i) => (
              <Hand
                key={i}
                label={isSplit ? `Hand ${i + 1} · $${h.stake}` : 'You'}
                cards={h.cards}
                active={isSplit && phase === 'player' && i === active}
                badge={isSplit && result ? MESSAGES[result.hands[i]] : null}
                badgeType={result?.hands[i]}
              />
            ))}
          </div>
        </div>

        <div className="controls">
          {phase === 'player' && (
            <div className="actions">
              <button className="btn" onClick={hit} title="Hit (H)">
                Hit <kbd>H</kbd>
              </button>
              <button className="btn" onClick={stand} title="Stand (S)">
                Stand <kbd>S</kbd>
              </button>
              <button className="btn" onClick={double} disabled={!canDouble} title="Double (D)">
                Double <kbd>D</kbd>
              </button>
              <button className="btn" onClick={split} disabled={!canSplitNow} title="Split (P)">
                Split <kbd>P</kbd>
              </button>
            </div>
          )}

          {phase === 'betting' && !brokeAfterRound && (
            <div className="betting">
              <div className="chips">
                {CHIPS.map((value) => (
                  <button
                    key={value}
                    className={`chip chip-${value}`}
                    onClick={() => addChip(value)}
                    disabled={bet + value > balance}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="bet-row">
                <span className="bet-amount">Bet: ${bet}</span>
                <button className="btn btn-ghost" onClick={() => setBet(0)} disabled={bet === 0}>
                  Clear
                </button>
                <button className="btn btn-gold" onClick={startRound} disabled={bet === 0 || bet > balance}>
                  Deal
                </button>
              </div>
            </div>
          )}

          {brokeAfterRound && (
            <div className="betting">
              <p className="hint">You are out of chips.</p>
              <button className="btn btn-gold" onClick={startOver}>
                Start over
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="sidebar">
        <section className="panel balance">
          <h2>Balance</h2>
          <p className="balance-amount">${balance}</p>
        </section>
        <Stats stats={stats} onReset={resetGame} />
        <Leaderboard balance={balance} hands={stats.hands} canSave={phase === 'betting' && stats.hands > 0} />
      </aside>
    </div>
  );
}
