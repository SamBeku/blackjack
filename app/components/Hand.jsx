import Card from './Card';
import { handValue } from '@/lib/blackjack';

// Diileri teine kaart on mängija käigu ajal tagurpidi (hideSecond).
// Splitti korral näitab `active`, millist kätt praegu mängitakse,
// ja `badge` iga käe tulemust.
export default function Hand({ label, cards, hideSecond = false, active = false, badge = null, badgeType }) {
  const visible = hideSecond ? cards.slice(0, 1) : cards;
  const { total, soft } = handValue(visible);

  return (
    <section className={active ? 'hand active' : 'hand'}>
      <div className="hand-label">
        {label}
        {cards.length > 0 && (
          <span className={total > 21 ? 'hand-total bust' : 'hand-total'}>
            {soft && total < 21 ? `soft ${total}` : total}
          </span>
        )}
        {badge && <span className={`hand-badge result-${badgeType}`}>{badge}</span>}
      </div>
      <div className="cards">
        {cards.map((card, i) => (
          <Card key={card.id} card={card} hidden={hideSecond && i === 1} />
        ))}
      </div>
    </section>
  );
}
