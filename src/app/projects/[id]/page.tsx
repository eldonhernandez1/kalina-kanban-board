import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import KanbanBoard from '@/components/KanbanBoard';
import type { Project, Stage, Card } from '@/types';

export const dynamic = 'force-dynamic';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = parseInt(id);
  if (isNaN(projectId)) notFound();

  const db = await getDb();
  const projRes = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [projectId] });
  if (!projRes.rows[0]) notFound();

  const stagesRes = await db.execute({ sql: 'SELECT * FROM stages WHERE project_id = ? ORDER BY position ASC', args: [projectId] });
  const cardsRes = await db.execute({ sql: 'SELECT * FROM cards WHERE project_id = ? ORDER BY position ASC', args: [projectId] });

  const r = projRes.rows[0];
  const project: Project = {
    id: Number(r.id),
    name: String(r.name),
    color: String(r.color),
    created_at: String(r.created_at),
  };

  const stages: Stage[] = stagesRes.rows.map(row => ({
    id: Number(row.id),
    project_id: Number(row.project_id),
    name: String(row.name),
    position: Number(row.position),
  }));

  const cards: Card[] = cardsRes.rows.map(row => ({
    id: Number(row.id),
    stage_id: Number(row.stage_id),
    project_id: Number(row.project_id),
    title: String(row.title),
    description: String(row.description ?? ''),
    position: Number(row.position),
    created_at: String(row.created_at),
  }));

  return <KanbanBoard project={project} initialStages={stages} initialCards={cards} />;
}
