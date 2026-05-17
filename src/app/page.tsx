import { getDb } from '@/lib/db';
import ProjectsView from '@/components/ProjectsView';
import type { Project } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
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

  const projects: Project[] = result.rows.map(row => ({
    id: Number(row.id),
    name: String(row.name),
    color: String(row.color),
    created_at: String(row.created_at),
    stage_count: Number(row.stage_count ?? 0),
    card_count: Number(row.card_count ?? 0),
  }));

  return <ProjectsView initialProjects={projects} />;
}
