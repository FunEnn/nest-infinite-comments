import { Provider } from '@nestjs/common';
import Database from 'better-sqlite3';
import { join } from 'path';

export const DATABASE_TOKEN = 'DATABASE_CONNECTION';

export const databaseProvider: Provider = {
  provide: DATABASE_TOKEN,
  useFactory: (): Database.Database => {
    const db = new Database(join(process.cwd(), 'comments.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT    NOT NULL,
        content    TEXT    NOT NULL,
        author     TEXT    NOT NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS comments (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        content    TEXT    NOT NULL,
        author     TEXT    NOT NULL,
        article_id INTEGER NOT NULL,
        parent_id  INTEGER DEFAULT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id)  REFERENCES comments(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_comments_parent_id  ON comments(parent_id);
    `);

    // 默认文章数据植入
    db.exec(`
      INSERT OR IGNORE INTO articles (id, title, content, author) 
      VALUES (1, '如何学习 NestJS 编程', 'NestJS 是一个用于构建高效且可扩展的服务端应用程序的框架。本指南将带你一步步构建一个无限嵌套评论系统。', 'enn');
    `);

    console.log('✅ 数据库初始化完成（含默认文章数据）');
    return db;
  },
};
