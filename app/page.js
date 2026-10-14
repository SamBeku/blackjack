import GameLoader from './components/GameLoader';

export default function Home() {
  return (
    <main className="page">
      <header className="title">
        <h1>Blackjack</h1>
        <p>Blackjack pays 3:2 · Dealer stands on 17 · 6 decks</p>
      </header>
      <GameLoader />
    </main>
  );
}
