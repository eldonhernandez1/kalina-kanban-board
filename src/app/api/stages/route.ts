import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toStage } from '@/lib/rows';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM stages WHERE project_id = ? ORDER BY position ASC', args: [parseInt(projectId)] });
  return NextResponse.json(res.rows.map(toStage));
}

export async function POST(req: Request) {
  const { project_id, name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const db = await getDb();
  const maxRes = await db.execute({ sql: 'SELECT MAX(position) as maxPos FROM stages WHERE project_id = ?', args: [parseInt(project_id)] });
  const maxPos = Number(maxRes.rows[0]?.maxPos ?? -1);
  const ins = await db.execute({ sql: 'INSERT INTO stages (project_id, name, position) VALUES (?, ?, ?)', args: [parseInt(project_id), name.trim(), maxPos + 1] });
  const row = await db.execute({ sql: 'SELECT * FROM stages WHERE id = ?', args: [ins.lastInsertRowid!] });
  return NextResponse.json(toStage(row.rows[0]), { status: 201 });
}
