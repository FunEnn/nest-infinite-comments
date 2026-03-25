import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.provider';
import Database from 'better-sqlite3';

@Injectable()
export class ArticlesService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {}

  findAll() {
    const stmt = this.db.prepare('SELECT * FROM articles ORDER BY created_at DESC');
    return stmt.all();
  }

  findOne(id: number) {
    const stmt = this.db.prepare('SELECT * FROM articles WHERE id = ?');
    return stmt.get(id);
  }
}
