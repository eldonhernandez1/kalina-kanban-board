import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toCard } from '@/lib/rows';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM cards WHERE id = ?', args: [parseInt(id)] });
  if (!res.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(toCard(res.rows[0]));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cardId = parseInt(id);
  const body = await req.json();
  const db = await getDb();
  const cur = await db.execute({ sql: 'SELECT * FROM cards WHERE id = ?', args: [cardId] });
  if (!cur.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const c = cur.rows[0];

  const title = body.title !== undefined ? body.title : c.title;
  const description = body.description !== undefined ? body.description : c.description;
  const stage_id = body.stage_id !== undefined ? body.stage_id : c.stage_id;
  const position = body.position !== undefined ? body.position : c.position;

  await db.execute({ sql: 'UPDATE cards SET title = ?, description = ?, stage_id = ?, position = ? WHERE id = ?', args: [title, description, stage_id, position, cardId] });
  const row = await db.execute({ sql: 'SELECT * FROM cards WHERE id = ?', args: [cardId] });
  return NextResponse.json(toCard(row.rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM cards WHERE id = ?', args: [parseInt(id)] });
  return NextResponse.json({ success: true });
}
