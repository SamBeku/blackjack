import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDeck,
  shuffle,
  deal,
  handValue,
  isBlackjack,
  dealerShouldHit,
  getResult,
  payout,
  canSplit,
  settleHands,
} from './blackjack.js';

// Abifunktsioon: hand('A', 'K') -> kaardid
const hand = (...ranks) => ranks.map((rank) => ({ rank, suit: '♠' }));

test('kingas on 6 pakki ehk 312 kaarti, kõik id-d on unikaalsed', () => {
  const deck = createDeck();
  assert.equal(deck.length, 312);
  assert.equal(new Set(deck.map((c) => c.id)).size, 312);
});

test('shuffle ei kaota ega lisa kaarte', () => {
  const deck = createDeck(1);
  const shuffled = shuffle(deck);
  assert.equal(shuffled.length, 52);
  assert.deepEqual(
    [...shuffled].map((c) => c.id).sort(),
    deck.map((c) => c.id).sort(),
  );
});

test('deal võtab kaardid pealt ja tagastab ülejäänud paki', () => {
  const deck = createDeck(1);
  const { cards, deck: rest } = deal(deck, 2);
  assert.deepEqual(cards, deck.slice(0, 2));
  assert.equal(rest.length, 50);
});

test('pildikaardid on 10 ja numbrikaardid oma väärtusega', () => {
  assert.equal(handValue(hand('K', 'Q')).total, 20);
  assert.equal(handValue(hand('7', '8')).total, 15);
});

test('äss on 11, kui see ei vii üle 21', () => {
  assert.deepEqual(handValue(hand('A', '6')), { total: 17, soft: true });
});

test('äss muutub 1-ks, kui muidu läheks üle 21', () => {
  assert.deepEqual(handValue(hand('A', '6', '9')), { total: 16, soft: false });
  assert.equal(handValue(hand('A', 'A', 'A')).total, 13);
  assert.equal(handValue(hand('A', 'A', 'K', 'K')).total, 22);
});

test('blackjack on ainult kahe kaardiga 21', () => {
  assert.equal(isBlackjack(hand('A', 'K')), true);
  assert.equal(isBlackjack(hand('7', '7', '7')), false);
});

test('diiler võtab kuni 16 ja jääb 17 peale seisma (ka soft 17)', () => {
  assert.equal(dealerShouldHit(hand('10', '6')), true);
  assert.equal(dealerShouldHit(hand('10', '7')), false);
  assert.equal(dealerShouldHit(hand('A', '6')), false);
});

test('tulemused', () => {
  assert.equal(getResult(hand('A', 'K'), hand('10', '9')), 'blackjack');
  assert.equal(getResult(hand('A', 'K'), hand('A', 'Q')), 'push');
  assert.equal(getResult(hand('10', '9'), hand('A', 'Q')), 'lose');
  assert.equal(getResult(hand('10', '5', '9'), hand('10', '6', '9')), 'bust');
  assert.equal(getResult(hand('10', '5'), hand('10', '6', '9')), 'win');
  assert.equal(getResult(hand('10', '9'), hand('10', '8')), 'win');
  assert.equal(getResult(hand('10', '7'), hand('10', '8')), 'lose');
  assert.equal(getResult(hand('10', '8'), hand('9', '9')), 'push');
});

test('väljamaksed: blackjack 3:2, võit 1:1, viik tagastab panuse', () => {
  assert.equal(payout('blackjack', 20), 50);
  assert.equal(payout('win', 20), 40);
  assert.equal(payout('push', 20), 20);
  assert.equal(payout('lose', 20), 0);
  assert.equal(payout('bust', 20), 0);
});

test('splitti saab teha ainult kahe sama väärtusega kaardiga', () => {
  assert.equal(canSplit(hand('8', '8')), true);
  assert.equal(canSplit(hand('K', '10')), true);
  assert.equal(canSplit(hand('A', 'A')), true);
  assert.equal(canSplit(hand('8', '9')), false);
  assert.equal(canSplit(hand('8', '8', '2')), false);
});

test('pärast splitti on äss + 10 tavaline 21, mitte blackjack', () => {
  assert.equal(getResult(hand('A', 'K'), hand('10', '9'), true), 'win');
  assert.equal(getResult(hand('A', 'K'), hand('10', '7', '4'), true), 'push');
});

test('settleHands arvutab iga käe eraldi', () => {
  const dealer = hand('10', '8');
  const results = settleHands(
    [
      { cards: hand('10', '9'), stake: 20 },
      { cards: hand('10', '6', 'K'), stake: 20 },
      { cards: hand('A', 'K'), stake: 40 },
    ],
    dealer,
  );
  assert.deepEqual(results, [
    { type: 'win', won: 40 },
    { type: 'bust', won: 0 },
    { type: 'win', won: 80 },
  ]);
});

test('settleHands ühe käega maksab blackjacki 3:2', () => {
  assert.deepEqual(settleHands([{ cards: hand('A', 'K'), stake: 20 }], hand('10', '8')), [
    { type: 'blackjack', won: 50 },
  ]);
});
