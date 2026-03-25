# 无限层级评论系统 — 设计与技术方案

## 一、技术栈
NestJS 11 + TypeScript 5 + SQLite (better-sqlite3) + React 19 + Vite 8

## 二、架构设计（前后端分离 + 模块化注入）
- **Database 数据层**：`DatabaseModule` 负责 better-sqlite3 实例的创建与生命周期管理，通过自定义 Provider（`DATABASE_TOKEN`）将 db 实例注入到各 Service 中，所有 SQL 操作均使用 `prepare()` 预编译 + `?` 参数化查询。
- **Service 业务层**：各功能模块独立封装 CRUD 逻辑，`CommentsService` 内置 O(n) 双遍历树构建算法，将扁平评论列表在内存中转换为嵌套树形结构后返回。
- **Controller 路由层**：RESTful 风格，负责请求参数校验（DTO + class-validator）与路由分发，不包含任何业务逻辑。
- **React 前端层**：`CommentItem` 组件递归渲染 `children` 数组，`depth` 控制缩进层级，`CommentForm` 支持顶级评论与对任意评论的回复。

> 核心原则：Service **只写原生 SQL**，不使用 ORM；better-sqlite3 是同步 API，所有数据库调用**不加 `await`**。

## 三、数据库设计（邻接表模型）

### 存储方案
采用**邻接表（Adjacency List）**实现无限层级：每条评论通过 `parent_id` 指向父评论，`NULL` 表示顶级评论。

## 四、评论树构建（Map 双遍历算法）

### 核心思路
不使用递归 SQL（`WITH RECURSIVE`），而是一次性查出文章全部评论（扁平列表），在 **内存中 O(n) 两遍遍历** 构建树：

### 算法步骤
1. **第一遍**：遍历扁平列表，以 `id` 为 key 建立 `Map<number, CommentTree>`，每个节点初始化 `children: []`。
2. **第二遍**：再次遍历，`parentId === null` 的推入 `roots`，否则通过 Map 找到父节点并 `push` 到其 `children`。

```typescript
buildCommentTree(comments: Comment[]): CommentTree[] {
  const map = new Map<number, CommentTree>();
  const roots: CommentTree[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, children: [] });
  }
  for (const c of comments) {
    const node = map.get(c.id)!;
    c.parentId === null
      ? roots.push(node)
      : map.get(c.parentId)?.children.push(node);
  }
  return roots;
}
```

### 关键机制
1. **写入 O(1)**：新增评论只需 INSERT 一行，`parent_id` 指向目标评论即可。
2. **树构建 O(n)**：Map 哈希查找父节点，避免嵌套循环。
3. **软删除保留结构**：删除评论时将 `content` 替换为 `[该评论已删除]`，保持树上下文连贯性。

## 五、API 设计
```text
GET    /articles                       → 获取文章列表
GET    /articles/:id                   → 获取文章详情
GET    /comments?articleId=:id         → 获取文章下的评论树
POST   /comments                       → 创建评论/回复（parentId 区分顶级/回复）
DELETE /comments/:id                   → 删除评论（软删除）
```

## 六、数据流向
```text
用户发表评论/回复 → CommentForm 收集输入 → fetch POST 到后端 (/comments)
→ Controller 校验 DTO → Service 执行 INSERT SQL → 返回新评论 ID
→ 前端刷新评论列表 (调用 onActionSuccess) → GET 评论树 → CommentItem 递归渲染

删除评论 → CommentItem 确认删除 → fetch DELETE (/comments/:id) 
→ Service 软删除 (UPDATE is_deleted = 1) → 前端刷新列表 (onActionSuccess)
```

## 七、交互逻辑细节
- **回复机制**：`CommentItem` 点击“回复”切换 `isReplying` 状态，展开内嵌的 `CommentForm`。
- **软删除展示**：前端根据 `comment.is_deleted` 字段判断，若为 `1` 则隐藏操作按钮并显示“该评论已删除”。