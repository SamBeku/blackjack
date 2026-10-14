'use client';

import { useEffect, useState } from 'react';

export default function Leaderboard({ balance, hands, canSave }) {
  const [scores, setScores] = useState([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'saving' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        setScores(data);
        setStatus('ready');
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not load the leaderboard');
      });
  }, []);

  async function saveScore(event) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, balance, hands }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setScores(data);
      setMessage(`Saved $${balance} as ${name.trim()}`);
    } catch (err) {
      setMessage(err.message || 'Could not save the score');
    }
    setStatus('ready');
  }

  return (
    <section className="panel">
      <h2>Leaderboard</h2>

      {status === 'loading' && <p className="muted">Loading…</p>}
      {status !== 'loading' && scores.length === 0 && <p className="muted">No scores yet. Be the first!</p>}

      {scores.length > 0 && (
        <ol className="leaderboard">
          {scores.map((score) => (
            <li key={score.id}>
              <span className="lb-name">{score.name}</span>
              <span className="lb-balance">${score.balance}</span>
              <span className="lb-hands">{score.hands} hands</span>
            </li>
          ))}
        </ol>
      )}

      <form className="save-form" onSubmit={saveScore}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          aria-label="Your name"
        />
        <button className="btn btn-gold" disabled={!canSave || !name.trim() || status === 'saving'}>
          {status === 'saving' ? 'Saving…' : `Save $${balance}`}
        </button>
      </form>
      {!canSave && <p className="muted small">Finish a hand to save your balance.</p>}
      {message && <p className="muted small">{message}</p>}
    </section>
  );
}
