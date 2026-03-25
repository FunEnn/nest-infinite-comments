# nest-infinite-comments 无限层级评论系统

基于 NestJS 11、TypeScript 和 SQLite 实现的支持无限嵌套的评论系统 API，前端使用 React 19 + Vite 进行树形评论展示

## 核心特性

- 支持**无限层级**嵌套评论，通过邻接表（`parent_id` 自引用）实现树形结构
- 使用 `better-sqlite3` 原生 SQL 操作数据库，同步 API，零 ORM 开销
- 服务端 O(n) 时间复杂度构建评论树，两遍遍历完成扁平列表 → 树形结构转换
- 前端 `CommentItem` 组件递归渲染，支持**回复与删除**交互逻辑
- 实现**操作后自动刷新**机制，通过组件回调透传确保 UI 状态同步
- RESTful API 设计，文章与评论模块解耦，职责清晰

## 快速开始

[Node.js >= 18](https://nodejs.org/)  
[npm](https://npm.io/)

```bash
# 1. 安装后端依赖并启动
cd server
npm install
npm run start:dev

# 2. 安装前端依赖并启动
cd client
npm install
npm run dev
```

## 项目结构

```
nest-infinite-comments/
├── server/                # NestJS 后端
│   └── src/
│       ├── database/      # better-sqlite3 数据库初始化
│       ├── articles/      # 文章模块（Controller + Service）
│       └── comments/      # 评论模块（Controller + Service + DTO）
├── client/                # React 前端
│   └── src/
│       ├── components/    # CommentTree / CommentItem / CommentForm
│       ├── api/           # API 请求封装
│       └── types/         # TypeScript 类型定义
└── DESIGN.md              # 详细设计文档
```

## 技术栈

* 后端：NestJS 11 + TypeScript + better-sqlite3
* 前端：React 19 + TypeScript + Vite 8
* 数据库：SQLite（邻接表模型）
* 核心算法：Map 双遍历评论树构建（O(n)）
