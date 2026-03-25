export interface Comment {
  id: number;
  content: string;
  author: string;
  article_id: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  children: Comment[];
}

export interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
}
