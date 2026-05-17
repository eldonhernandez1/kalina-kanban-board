import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM comments WHERE id = ?', args: [parseInt(id)] });
  return NextResponse.json({ success: true });
}
