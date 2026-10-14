'use client';

import dynamic from 'next/dynamic';

// Mäng loeb saldo brauseri localStorage'ist, mida serveris ei ole.
// Seepärast renderdame mängu ainult brauseris (ssr: false).
const Game = dynamic(() => import('./Game'), {
  ssr: false,
  loading: () => <p className="loading">Shuffling the deck…</p>,
});

export default function GameLoader() {
  return <Game />;
}
