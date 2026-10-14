import { connection } from 'next/server';
import { getTopScores, addScore } from '@/lib/db';
import { validateScore } from '@/lib/score';

// GET /api/leaderboard -> 10 parimat tulemust
export async function GET() {
  // Muidu loeks Next.js andmebaasi ainult buildi ajal ja vastus jääks samaks
  await connection();
  return Response.json(getTopScores());
}

// POST /api/leaderboard { name, balance, hands } -> salvestab tulemuse
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { score, error } = validateScore(body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  addScore(score);
  return Response.json(getTopScores(), { status: 201 });
}
