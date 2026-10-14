// Kontrollib edetabelisse saadetud andmeid. Brauserist tulevat infot
// ei saa usaldada, seega kontrollime kõik väljad serveris üle.
export function validateScore(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const { balance, hands } = body ?? {};

  if (name.length < 1 || name.length > 20) {
    return { error: 'Name must be 1-20 characters' };
  }
  if (!Number.isInteger(balance) || balance < 0 || balance > 1_000_000) {
    return { error: 'Balance must be a whole number between 0 and 1000000' };
  }
  if (!Number.isInteger(hands) || hands < 1) {
    return { error: 'Play at least one hand before saving' };
  }

  return { score: { name, balance, hands } };
}
