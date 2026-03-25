import request from '../request/axios';
import type { Comment, Article } from '../types';

/**
 * 获取所有文章
 */
export const getArticles = (): Promise<Article[]> => {
  return request.get('/articles');
};

/**
 * 获取文章详情
 */
export const getArticleById = (id: number): Promise<Article> => {
  return request.get(`/articles/${id}`);
};

/**
 * 获取单条评论详情
 */
export const getCommentById = (id: number): Promise<Comment> => {
  return request.get(`/comments/${id}`);
};

/**
 * 获取文章下的所有评论（树形结构）
 */
export const getCommentsByArticle = (articleId: number): Promise<Comment[]> => {
  return request.get('/comments', {
    params: { articleId },
  });
};

/**
 * 创建评论
 */
export interface CreateCommentParams {
  content: string;
  author: string;
  article_id: number;
  parent_id?: number | null;
}

export const createComment = (data: CreateCommentParams): Promise<{ id: number }> => {
  return request.post('/comments', data);
};

/**
 * 删除评论
 */
export const deleteComment = (id: number): Promise<void> => {
  return request.delete(`/comments/${id}`);
};
