import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toStage } from '@/lib/rows';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const db = await getDb();
  await db.execute({ sql: 'UPDATE stages SET name = ? WHERE id = ?', args: [name.trim(), parseInt(id)] });
  const res = await db.execute({ sql: 'SELECT * FROM stages WHERE id = ?', args: [parseInt(id)] });
  return NextResponse.json(toStage(res.rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM stages WHERE id = ?', args: [parseInt(id)] });
  return NextResponse.json({ success: true });
}
