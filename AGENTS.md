# 无限层级评论系统 - 开发指南

> **说明**：基于 NestJS + TypeScript + SQLite 的无限嵌套评论系统，前后端分离架构

## 快速参考

| 属性           | 值                              |
| :------------- | :------------------------------ |
| **仓库路径**   | `nest-infinite-comments/`       |
| **后端框架**   | NestJS 11                       |
| **前端框架**   | React 19 + Vite 8               |
| **语言**       | TypeScript 5                    |
| **数据库**     | SQLite (better-sqlite3)         |
| **包管理器**   | npm                             |

------

## 目录结构

```
nest-infinite-comments/
├── server/                          # NestJS 后端
│   └── src/
│       ├── main.ts                  # 入口文件
│       ├── app.module.ts            # 根模块
│       ├── database/
│       │   ├── database.module.ts   # 数据库模块
│       │   └── database.provider.ts # better-sqlite3 实例提供者
│       ├── articles/
│       │   ├── articles.module.ts
│       │   ├── articles.controller.ts
│       │   └── articles.service.ts  # 原生 SQL 操作
│       └── comments/
│           ├── comments.module.ts
│           ├── comments.controller.ts
│           ├── comments.service.ts  # 原生 SQL + 评论树构建
│           └── dto/
│               └── create-comment.dto.ts
├── client/                          # React 前端
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── ArticleList.tsx      # 文章列表
│       │   ├── ArticleDetail.tsx    # 文章详情 + 评论区
│       │   ├── CommentTree.tsx      # 评论树容器
│       │   ├── CommentItem.tsx      # 单条评论（递归）
│       │   └── CommentForm.tsx      # 评论输入表单
│       ├── api/
│       │   └── index.ts             # API 请求封装
│       └── types/
│           └── index.ts             # TypeScript 类型定义
├── DESIGN.md                        # 详细设计文档
└── README.md
```

------

## 核心模块

### `DatabaseModule` (`server/src/database/`)

数据库初始化与连接管理：

- **职责**：创建 better-sqlite3 实例，执行建表 SQL，配置 WAL 模式和外键约束
- **注入令牌**：`DATABASE_TOKEN`，通过 `@Inject(DATABASE_TOKEN)` 在 Service 中使用
- **注意**：better-sqlite3 是同步 API，所有数据库操作均为同步调用

### `CommentsService` (`server/src/comments/comments.service.ts`)

评论 CRUD 与树构建核心逻辑：

| 方法名              | 说明                 | 参数                                       | 返回值          |
| :------------------ | :------------------- | :----------------------------------------- | :-------------- |
| `findByArticle`     | 获取文章所有评论（树） | `articleId: number`                        | `CommentTree[]` |
| `create`            | 创建评论/回复        | `articleId, content, author, parentId?`     | `{ id: number }` |
| `delete`            | 删除评论（软删除）    | `id: number`                               | `void`          |
| `buildCommentTree`  | 扁平列表 → 树形结构  | `comments: Comment[]`                      | `CommentTree[]` |

### `CommentItem` (`client/src/components/CommentItem.tsx`)

前端递归渲染组件：

- **Props**：`comment`（评论数据）、`depth`（当前嵌套深度）、`onActionSuccess`（操作成功后的刷新回调）
- **递归逻辑**：遍历 `comment.children` 并渲染自身，`depth + 1` 控制缩进，透传 `onActionSuccess`
- **⚠️ 注意**：需要为每层设置合理的 `marginLeft`，避免深层嵌套溢出视窗

------

## 开发规范

### 代码风格

```typescript
// ✅ 正确：使用 prepare 预编译 + 参数化查询
const stmt = this.db.prepare('SELECT * FROM comments WHERE article_id = ?');
const rows = stmt.all(articleId);

// ❌ 错误：字符串拼接 SQL（SQL 注入风险）
const rows = this.db.prepare(`SELECT * FROM comments WHERE article_id = ${articleId}`).all();
```

### 命名规范

| 类型      | 规范        | 示例                |
| :-------- | :---------- | :------------------ |
| 接口/类型 | PascalCase  | `CommentTree`       |
| 函数/变量 | camelCase   | `buildCommentTree`  |
| 常量      | UPPER_SNAKE | `DATABASE_TOKEN`    |
| 组件      | PascalCase  | `CommentItem`       |
| DTO 类    | PascalCase  | `CreateCommentDto`  |
| 数据库字段 | snake_case  | `article_id`       |

### 类型安全

- 禁止使用 `any`，优先使用 `unknown` + 类型守卫
- 公共 API 必须显式标注参数类型和返回值类型
- 编译选项：`strict: true`

------

## 开发任务导航

| 任务              | 位置                                          |
| :---------------- | :-------------------------------------------- |
| 添加新 API 端点   | `server/src/[module]/[module].controller.ts`  |
| 修改业务逻辑      | `server/src/[module]/[module].service.ts`     |
| 添加 DTO 验证     | `server/src/[module]/dto/`                    |
| 添加前端组件      | `client/src/components/[Component].tsx`       |
| 修改 API 请求     | `client/src/api/index.ts`                     |
| 定义类型          | `client/src/types/index.ts`                   |
| 修改数据库表结构  | `server/src/database/database.provider.ts`     |

------

## 数据流

```
用户操作（发表评论 / 回复）
    │
    ▼
React 组件（CommentForm）
    │
    ▼
API 请求层（fetch/axios）
    │
    ▼
NestJS Controller（路由分发）
    │
    ▼
NestJS Service（业务逻辑）
    │
    ├──→ better-sqlite3（原生 SQL 读写）
    │
    └──→ buildCommentTree（扁平 → 树形）
              │
              ▼
        JSON 响应 → 前端递归渲染
```

### 核心数据流说明

| 流程方向          | 触发源           | 处理逻辑                                  | 最终效果           |
| :---------------- | :--------------- | :---------------------------------------- | :----------------- |
| 前端 → 后端       | 用户提交评论     | Controller 接收 → Service 执行 INSERT SQL | 评论写入 SQLite    |
| 后端 → 前端       | 页面加载/刷新    | Service 查询全部评论 → 内存构建树 → 返回  | 前端递归渲染评论树 |
| 删除评论          | 用户点击删除     | Service 软删除（更新内容为已删除标记）     | 保留树结构完整性   |

------

## 技术栈

| 层级         | 技术                            |
| :----------- | :------------------------------ |
| **后端框架** | NestJS 11                       |
| **前端框架** | React 19 + Vite 8               |
| **语言**     | TypeScript 5                    |
| **数据库**   | SQLite (better-sqlite3)         |
| **样式方案** | 原生 CSS                        |
| **代码规范** | ESLint + Prettier               |

------

## 最佳实践

### 核心原则

1. **参数化查询**：所有 SQL 使用 `?` 占位符，杜绝 SQL 注入
2. **模块化解耦**：NestJS 模块各自独立，通过依赖注入协作
3. **递归渲染**：前端 `CommentItem` 递归渲染，保持组件单一职责
4. **邻接表模型**：`parent_id` 自引用实现无限嵌套，写入 O(1)，树构建 O(n)

------

## 环境配置

### 开发环境要求

- Node.js：>= 18
- 包管理器：pnpm
- 数据库：SQLite（无需安装，better-sqlite3 内嵌）

### 常用命令

```bash
# 后端（在 server/ 目录下）
npm install          # 安装依赖
npm run start:dev    # 启动开发服务器（热重载）
npm run build        # 构建生产版本
npm run test         # 运行单元测试
npm run lint         # 代码检查

# 前端（在 client/ 目录下）
npm install          # 安装依赖
npm run dev          # 启动 Vite 开发服务器
npm run build        # 构建生产版本
npm run lint         # 代码检查
```

------

## 扩展指南

### 添加新功能模块

1. 使用 NestJS CLI：`nest g module [name]`、`nest g controller [name]`、`nest g service [name]`
2. 在 Service 中注入 `DATABASE_TOKEN` 获取数据库实例
3. 编写原生 SQL 查询，使用 `prepare().all()` / `.get()` / `.run()`
4. 在 Controller 中定义 RESTful 路由
5. 在 `AppModule` 中导入新模块

### 添加新的数据库表

1. 在 `database.provider.ts` 的 `db.exec()` 中添加 `CREATE TABLE IF NOT EXISTS` 语句
2. 创建对应的 TypeScript 接口定义
3. 在相关 Service 中编写 CRUD SQL
4. 如需索引，添加 `CREATE INDEX IF NOT EXISTS` 语句

------

## 注意事项

### 开发时注意

- SQLite 数据库文件 `comments.db` 会在首次启动时自动创建于项目根目录
- better-sqlite3 是**同步 API**，不要在 SQL 调用前加 `await`
- 每次连接都需要手动执行 `PRAGMA foreign_keys = ON`，SQLite 默认不启用外键