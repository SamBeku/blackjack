// Blackjacki reeglid. Siin pole Reacti, ainult tavalised funktsioonid,
// et neid saaks eraldi testida (`npm test`).

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Mitu kaardipakki on kingas (casinodes tavaliselt 6)
export const DECK_COUNT = 6;

export function createDeck(decks = DECK_COUNT) {
  const cards = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ id: `${d}-${rank}${suit}`, rank, suit });
      }
    }
  }
  return cards;
}

// Fisher-Yates segamine. Tagastab uue massiivi, originaali ei muuda.
export function shuffle(cards, random = Math.random) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Võtab pakist pealt `count` kaarti
export function deal(deck, count = 1) {
  return { cards: deck.slice(0, count), deck: deck.slice(count) };
}

// Kui kingas on alla ühe paki kaarte, segame uue
export function needsShuffle(deck) {
  return deck.length < 52;
}

export function cardValue(card) {
  if (card.rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  return Number(card.rank);
}

// Äss on 11, aga kui summa läheb üle 21, loeme ässa 1-ks.
// `soft` on true, kui mõni äss loeb veel 11-na (nt A+6 = soft 17).
export function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card);
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function isBust(cards) {
  return handValue(cards).total > 21;
}

// Diiler võtab kaarte kuni 17-ni ja jääb ka soft 17 peale seisma
export function dealerShouldHit(cards) {
  return handValue(cards).total < 17;
}

// Tulemus mängija vaatest: 'blackjack' | 'win' | 'push' | 'lose' | 'bust'
export function getResult(player, dealer) {
  const playerBJ = isBlackjack(player);
  const dealerBJ = isBlackjack(dealer);

  if (playerBJ && dealerBJ) return 'push';
  if (playerBJ) return 'blackjack';
  if (isBust(player)) return 'bust';
  if (dealerBJ) return 'lose';
  if (isBust(dealer)) return 'win';

  const p = handValue(player).total;
  const d = handValue(dealer).total;
  if (p > d) return 'win';
  if (p < d) return 'lose';
  return 'push';
}

// Kui palju raha mängija tagasi saab (koos panusega).
// Blackjack maksab 3:2, tavaline võit 1:1, viik tagastab panuse.
export function payout(result, bet) {
  if (result === 'blackjack') return bet + bet * 1.5;
  if (result === 'win') return bet * 2;
  if (result === 'push') return bet;
  return 0;
}
