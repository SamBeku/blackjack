export default function Stats({ stats, onReset }) {
  const winRate = stats.hands ? Math.round((stats.wins / stats.hands) * 100) : 0;

  return (
    <section className="panel">
      <h2>Stats</h2>
      <dl className="stats">
        <div>
          <dt>Hands</dt>
          <dd>{stats.hands}</dd>
        </div>
        <div>
          <dt>Win rate</dt>
          <dd>{winRate}%</dd>
        </div>
        <div>
          <dt>Wins</dt>
          <dd>{stats.wins}</dd>
        </div>
        <div>
          <dt>Losses</dt>
          <dd>{stats.losses}</dd>
        </div>
        <div>
          <dt>Pushes</dt>
          <dd>{stats.pushes}</dd>
        </div>
        <div>
          <dt>Blackjacks</dt>
          <dd>{stats.blackjacks}</dd>
        </div>
        <div className="wide">
          <dt>Best balance</dt>
          <dd>${stats.peak}</dd>
        </div>
      </dl>
      <button className="link-button" onClick={onReset}>
        Reset game
      </button>
    </section>
  );
}
