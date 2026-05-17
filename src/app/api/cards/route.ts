import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toCard } from '@/lib/rows';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM cards WHERE project_id = ? ORDER BY position ASC', args: [parseInt(projectId)] });
  return NextResponse.json(res.rows.map(toCard));
}

export async function POST(req: Request) {
  const { stage_id, project_id, title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });
  const db = await getDb();
  const maxRes = await db.execute({ sql: 'SELECT MAX(position) as maxPos FROM cards WHERE stage_id = ?', args: [parseInt(stage_id)] });
  const maxPos = Number(maxRes.rows[0]?.maxPos ?? -1);
  const ins = await db.execute({
    sql: 'INSERT INTO cards (stage_id, project_id, title, description, position) VALUES (?, ?, ?, ?, ?)',
    args: [parseInt(stage_id), parseInt(project_id), title.trim(), '', maxPos + 1],
  });
  const row = await db.execute({ sql: 'SELECT * FROM cards WHERE id = ?', args: [ins.lastInsertRowid!] });
  return NextResponse.json(toCard(row.rows[0]), { status: 201 });
}
