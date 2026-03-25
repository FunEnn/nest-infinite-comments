import React, { useState, useEffect, useCallback } from 'react';
import { FaComments } from 'react-icons/fa';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { getArticleById, getCommentsByArticle } from '../api';
import type { Comment, Article } from '../types';

const ArticleDetail: React.FC = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 暂时固定访问 ID 为 1 的文章
  const articleId = 1;

  const fetchData = useCallback(async () => {
    try {
      const [articleData, commentsData] = await Promise.all([
        getArticleById(articleId),
        getCommentsByArticle(articleId)
      ]);
      setArticle(articleData);
      setComments(commentsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!article) {
    return <div className="container">文章未找到</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">
          <span>作者：{article.author}</span>
          <span>发表于：{new Date(article.created_at).toLocaleDateString()}</span>
        </div>
        <div className="article-content">
          {article.content}
        </div>
      </div>

      <div className="comment-section">
        <h2 className="comment-section-title">
          <FaComments /> 全部评论 ({comments.length})
        </h2>
        
        <CommentForm articleId={articleId} onSuccess={fetchData} />

        <div className="comment-list">
          {comments.length > 0 ? (
            comments.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                depth={0} 
                onActionSuccess={fetchData} 
              />
            ))
          ) : (
            <div className="no-comments">暂无评论，快来抢沙发吧！</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
