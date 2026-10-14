export default function Card({ card, hidden = false }) {
  if (hidden) {
    return <div className="card card-back" aria-label="Hidden card" />;
  }

  const red = card.suit === '♥' || card.suit === '♦';

  return (
    <div className={red ? 'card red' : 'card'} aria-label={`${card.rank}${card.suit}`}>
      <span className="corner">
        {card.rank}
        <br />
        {card.suit}
      </span>
      <span className="pip">{card.suit}</span>
      <span className="corner bottom">
        {card.rank}
        <br />
        {card.suit}
      </span>
    </div>
  );
}
