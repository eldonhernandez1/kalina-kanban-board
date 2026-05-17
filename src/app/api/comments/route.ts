import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toComment } from '@/lib/rows';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get('card_id');
  if (!cardId) return NextResponse.json({ error: 'card_id required' }, { status: 400 });
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM comments WHERE card_id = ? ORDER BY created_at ASC', args: [parseInt(cardId)] });
  return NextResponse.json(res.rows.map(toComment));
}

export async function POST(req: Request) {
  const { card_id, content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });
  const db = await getDb();
  const ins = await db.execute({ sql: 'INSERT INTO comments (card_id, content) VALUES (?, ?)', args: [parseInt(card_id), content.trim()] });
  const row = await db.execute({ sql: 'SELECT * FROM comments WHERE id = ?', args: [ins.lastInsertRowid!] });
  return NextResponse.json(toComment(row.rows[0]), { status: 201 });
}
