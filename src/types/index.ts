export interface Project {
  id: number;
  name: string;
  color: string;
  created_at: string;
  stage_count?: number;
  card_count?: number;
}

export interface Stage {
  id: number;
  project_id: number;
  name: string;
  position: number;
}

export interface Card {
  id: number;
  stage_id: number;
  project_id: number;
  title: string;
  description: string;
  position: number;
  created_at: string;
}

export interface Comment {
  id: number;
  card_id: number;
  content: string;
  created_at: string;
}
