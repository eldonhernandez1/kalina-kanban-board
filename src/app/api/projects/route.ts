import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toProject } from '@/lib/rows';

const PROJECT_COLORS = [
  '#0d1b35', '#1a3a5c', '#2d4a3a', '#4a2d1a',
  '#3a1a4a', '#1a3a3a', '#4a3a1a', '#1a1a4a',
];

export async function GET() {
  const db = await getDb();
  const result = await db.execute(`
    SELECT p.id, p.name, p.color, p.created_at,
      COUNT(DISTINCT s.id) as stage_count,
      COUNT(DISTINCT c.id) as card_count
    FROM projects p
    LEFT JOIN stages s ON s.project_id = p.id
    LEFT JOIN cards c ON c.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  return NextResponse.json(result.rows.map(toProject));
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const db = await getDb();
  const countRes = await db.execute('SELECT COUNT(*) as count FROM projects');
  const count = Number(countRes.rows[0]?.count ?? 0);
  const color = PROJECT_COLORS[count % PROJECT_COLORS.length];

  const ins = await db.execute({ sql: 'INSERT INTO projects (name, color) VALUES (?, ?)', args: [name.trim(), color] });
  const row = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [ins.lastInsertRowid!] });
  return NextResponse.json(toProject(row.rows[0]), { status: 201 });
}
