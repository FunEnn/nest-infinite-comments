import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.provider';
import Database from 'better-sqlite3';
import { CreateCommentDto } from './dto/create-comment.dto';

export interface Comment {
  id: number;
  content: string;
  author: string;
  article_id: number;
  parent_id: number | null;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  children?: Comment[];
}

@Injectable()
export class CommentsService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {}

  findByArticle(articleId: number) {
    const stmt = this.db.prepare(
      'SELECT * FROM comments WHERE article_id = ? ORDER BY created_at ASC'
    );
    const comments = stmt.all(articleId) as Comment[];
    return this.buildCommentTree(comments);
  }

  create(dto: CreateCommentDto) {
    const stmt = this.db.prepare(
      'INSERT INTO comments (content, author, article_id, parent_id) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(dto.content, dto.author, dto.article_id, dto.parent_id ?? null);
    return { id: info.lastInsertRowid };
  }

  findOne(id: number) {
    const stmt = this.db.prepare('SELECT * FROM comments WHERE id = ?');
    return stmt.get(id) as Comment | undefined;
  }

  delete(id: number) {
    // 逻辑删除：将 is_deleted 标记位设为 1
    const stmt = this.db.prepare('UPDATE comments SET is_deleted = 1 WHERE id = ?');
    stmt.run(id);
  }

  private buildCommentTree(comments: Comment[]): Comment[] {
    const map = new Map<number, Comment>();
    const roots: Comment[] = [];

    comments.forEach((c) => {
      c.children = [];
      map.set(c.id, c);
    });

    comments.forEach((c) => {
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) {
          parent.children!.push(c);
        } else {
          roots.push(c);
        }
      } else {
        roots.push(c);
      }
    });

    return roots;
  }
}
