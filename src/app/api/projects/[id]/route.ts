import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toProject } from '@/lib/rows';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [parseInt(id)] });
  if (!res.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(toProject(res.rows[0]));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const db = await getDb();
  await db.execute({ sql: 'UPDATE projects SET name = ? WHERE id = ?', args: [name.trim(), parseInt(id)] });
  const res = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [parseInt(id)] });
  return NextResponse.json(toProject(res.rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [parseInt(id)] });
  return NextResponse.json({ success: true });
}
