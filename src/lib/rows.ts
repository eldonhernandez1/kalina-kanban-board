import type { Row } from '@libsql/client';
import type { Project, Stage, Card, Comment } from '@/types';

export function toProject(row: Row): Project {
  return {
    id: Number(row.id),
    name: String(row.name),
    color: String(row.color),
    created_at: String(row.created_at),
    stage_count: row.stage_count !== undefined ? Number(row.stage_count) : undefined,
    card_count: row.card_count !== undefined ? Number(row.card_count) : undefined,
  };
}

export function toStage(row: Row): Stage {
  return {
    id: Number(row.id),
    project_id: Number(row.project_id),
    name: String(row.name),
    position: Number(row.position),
  };
}

export function toCard(row: Row): Card {
  return {
    id: Number(row.id),
    stage_id: Number(row.stage_id),
    project_id: Number(row.project_id),
    title: String(row.title),
    description: String(row.description ?? ''),
    position: Number(row.position),
    created_at: String(row.created_at),
  };
}

export function toComment(row: Row): Comment {
  return {
    id: Number(row.id),
    card_id: Number(row.card_id),
    content: String(row.content),
    created_at: String(row.created_at),
  };
}
