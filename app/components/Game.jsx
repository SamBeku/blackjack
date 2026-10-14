'use client';

import { useEffect, useState } from 'react';
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
  dealerShouldHit,
  getResult,
  payout,
} from '@/lib/blackjack';

const START_BALANCE = 1000;
const CHIPS = [10, 20, 50, 100];
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
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  // 'betting' = panuse valimine, 'player' = mängija käik, 'dealer' = diileri käik
  const [phase, setPhase] = useState('betting');
  const [bet, setBet] = useState(0); // järgmise käe panus
  const [stake, setStake] = useState(0); // praeguses käes mängus olev summa
  const [result, setResult] = useState(null);

  const { balance, stats } = save;

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

    setDeck(rest);
    setPlayer(p);
    setDealer(d);
    setStake(bet);
    setResult(null);
    setSave((s) => ({ ...s, balance: s.balance - bet }));

    if (isBlackjack(p) || isBlackjack(d)) {
      finishRound(p, d, bet);
    } else {
      setPhase('player');
    }
  }

  function hit() {
    const { cards, deck: rest } = deal(deck);
    const p = [...player, ...cards];
    setDeck(rest);
    setPlayer(p);

    if (isBust(p)) finishRound(p, dealer, stake);
    else if (handValue(p).total === 21) dealerTurn(p, rest, stake);
  }

  function stand() {
    dealerTurn(player, deck, stake);
  }

  // Double: panus kahekordseks, mängija saab täpselt ühe kaardi
  function double() {
    const doubled = stake * 2;
    const { cards, deck: rest } = deal(deck);
    const p = [...player, ...cards];
    setSave((s) => ({ ...s, balance: s.balance - stake }));
    setStake(doubled);
    setDeck(rest);
    setPlayer(p);

    if (isBust(p)) finishRound(p, dealer, doubled);
    else dealerTurn(p, rest, doubled);
  }

  // Diiler pöörab peidetud kaardi ja võtab kaarte, kuni tal on vähemalt 17
  async function dealerTurn(p, shoe, currentStake) {
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
    finishRound(p, d, currentStake);
  }

  function finishRound(p, d, currentStake) {
    const type = getResult(p, d);
    const won = payout(type, currentStake);
    setResult({ type, change: won - currentStake });
    setPhase('betting');

    setSave((s) => {
      const newBalance = s.balance + won;
      return {
        balance: newBalance,
        stats: {
          hands: s.stats.hands + 1,
          wins: s.stats.wins + (type === 'win' || type === 'blackjack' ? 1 : 0),
          losses: s.stats.losses + (type === 'lose' || type === 'bust' ? 1 : 0),
          pushes: s.stats.pushes + (type === 'push' ? 1 : 0),
          blackjacks: s.stats.blackjacks + (type === 'blackjack' ? 1 : 0),
          peak: Math.max(s.stats.peak, newBalance),
        },
      };
    });
  }

  function startOver() {
    setSave({ balance: START_BALANCE, stats: EMPTY_STATS });
    setBet(0);
    setPlayer([]);
    setDealer([]);
    setResult(null);
  }

  function resetGame() {
    if (window.confirm('Start over with $1000 and clear your stats?')) startOver();
  }

  const canDouble = phase === 'player' && player.length === 2 && balance >= stake;
  const brokeAfterRound = phase === 'betting' && balance < CHIPS[0];

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
                {phase === 'player' && `In play: $${stake}`}
                {phase === 'dealer' && 'Dealer plays…'}
              </p>
            )}
          </div>

          <Hand label="You" cards={player} />
        </div>

        <div className="controls">
          {phase === 'player' && (
            <div className="actions">
              <button className="btn" onClick={hit}>
                Hit
              </button>
              <button className="btn" onClick={stand}>
                Stand
              </button>
              <button className="btn" onClick={double} disabled={!canDouble}>
                Double
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
