import React, { useState } from 'react';
import { FaUserCircle, FaReply, FaTrashAlt } from 'react-icons/fa';
import { deleteComment } from '../api';
import CommentForm from './CommentForm';
import type { Comment } from '../types';
import './CommentItem.css';

interface CommentItemProps {
  comment: Comment;
  depth: number;
  onActionSuccess?: () => void | Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, depth, onActionSuccess }) => {
  const [isReplying, setIsReplying] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条评论吗？')) return;

    try {
      await deleteComment(comment.id);
      if (onActionSuccess) await onActionSuccess();
    } catch {
      alert('删除失败，请稍后再试');
    }
  };

  const handleReplySuccess = async () => {
    setIsReplying(false);
    if (onActionSuccess) await onActionSuccess();
  };

  return (
    <div className="comment-wrapper">
      <div className="comment-card">
        <div className="comment-header">
          <FaUserCircle className="avatar-icon" />
          <span className="comment-author">{comment.author}</span>
          <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
        </div>

        <div className="comment-content">
          {comment.is_deleted ? <span className="deleted-text">该评论已删除</span> : comment.content}
        </div>

        {!comment.is_deleted && (
          <div className="comment-actions">
            <button
              className={`btn btn-ghost action-btn ${isReplying ? 'active' : ''}`}
              onClick={() => setIsReplying(!isReplying)}
            >
              <FaReply /> {isReplying ? '取消回复' : '回复'}
            </button>
            <button className="btn btn-ghost action-btn delete-btn" onClick={handleDelete}>
              <FaTrashAlt /> 删除
            </button>
          </div>
        )}
      </div>

      {isReplying && (
        <div className="reply-form-wrapper">
          <CommentForm
            articleId={comment.article_id}
            parentId={comment.id}
            onSuccess={handleReplySuccess}
          />
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="comment-children">
          {comment.children.map(child => (
            <CommentItem
              key={child.id}
              comment={child}
              depth={depth + 1}
              onActionSuccess={onActionSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
