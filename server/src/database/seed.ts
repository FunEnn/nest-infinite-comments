import Database from 'better-sqlite3';
import { join } from 'path';

/**
 * 种子数据脚本
 * 运行：npx ts-node src/database/seed.ts
 */
function seed() {
  const db = new Database(join(process.cwd(), 'comments.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 初始化表结构
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
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id)  REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id  ON comments(parent_id);
  `);

  // 清空现有数据（按外键依赖顺序）
  db.exec('DELETE FROM comments');
  db.exec('DELETE FROM articles');

  // 插入文章
  const insertArticle = db.prepare(
    'INSERT INTO articles (title, content, author) VALUES (?, ?, ?)',
  );
  const article1 = insertArticle.run('如何学习编程', '编程是一门需要持续练习的技能...', '张三');
  const article2 = insertArticle.run('TypeScript 入门指南', 'TypeScript 是 JavaScript 的超集...', '李四');

  const articleId1 = article1.lastInsertRowid as number;
  const articleId2 = article2.lastInsertRowid as number;

  // 插入评论（模拟 DESIGN.md 中的树形结构）
  const insertComment = db.prepare(
    'INSERT INTO comments (content, author, article_id, parent_id) VALUES (?, ?, ?, ?)',
  );

  // 文章1 的评论树
  // ├── 评论A："写得很好！"（user1）
  // │   ├── 评论A-1："同意楼上"（user2）
  // │   │   └── 评论A-1-1："我也同意"（user3）
  // │   └── 评论A-2："确实不错"（user4）
  // └── 评论B："有些地方不太对"（user5）
  //     ├── 评论B-1："哪里不对？"（user1）
  //     │   └── 评论B-1-1："第三段的例子"（user5）

  const cA = insertComment.run('写得很好！', 'user1', articleId1, null);
  const cA1 = insertComment.run('同意楼上', 'user2', articleId1, cA.lastInsertRowid);
  insertComment.run('我也同意', 'user3', articleId1, cA1.lastInsertRowid);
  insertComment.run('确实不错', 'user4', articleId1, cA.lastInsertRowid);

  const cB = insertComment.run('有些地方不太对', 'user5', articleId1, null);
  const cB1 = insertComment.run('哪里不对？', 'user1', articleId1, cB.lastInsertRowid);
  insertComment.run('第三段的例子', 'user5', articleId1, cB1.lastInsertRowid);

  // 文章2 的评论
  insertComment.run('讲得很清楚', 'user2', articleId2, null);

  // 验证
  const articleCount = (db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number }).count;
  const commentCount = (db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number }).count;

  console.log(`✅ 种子数据插入完成：${articleCount} 篇文章，${commentCount} 条评论`);

  db.close();
}

seed();
