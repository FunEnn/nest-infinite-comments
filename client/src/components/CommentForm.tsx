import React, { useState } from 'react';
import { createComment } from '../api';
import './CommentForm.css';

interface CommentFormProps {
  articleId: number;
  parentId?: number | null;
  onSuccess?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ articleId, parentId = null, onSuccess }) => {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('匿名用户'); // 暂时硬编码作者，后期可扩展登录
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await createComment({
        content,
        author,
        article_id: articleId,
        parent_id: parentId,
      });
      setContent('');
      if (onSuccess) onSuccess();
    } catch (error) {
      alert('提交评论失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-form-container" onSubmit={handleSubmit}>
      <textarea
        className="comment-textarea"
        placeholder={parentId ? "写下你的回复..." : "写下你的评论..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        disabled={loading}
      />
      <div className="form-footer">
        <button type="submit" className="btn btn-primary" disabled={loading || !content.trim()}>
          {loading ? '提交中...' : (parentId ? '发表回复' : '发表评论')}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
