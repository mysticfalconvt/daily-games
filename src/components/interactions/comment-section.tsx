"use client";

import { useState } from "react";

import { Avatar, Button, Textarea } from "@nextui-org/react";
import { AlertCircle, Trash2 } from "lucide-react";

import { ScoreComment } from "@/types/interactions";

interface CommentSectionProps {
  comments: ScoreComment[];
  currentUserId: string;
  /** Owner of the score. They can remove any comment on it. */
  scoreOwnerId?: string;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

export const CommentSection = ({
  comments,
  currentUserId,
  scoreOwnerId,
  onAddComment,
  onDeleteComment,
  isLoading = false,
}: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setCommentError(null);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      setCommentError(
        error instanceof Error ? error.message : "Failed to add comment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await onDeleteComment(commentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const commentDate = typeof date === "string" ? new Date(date) : date;

    // Check if the date is valid
    if (isNaN(commentDate.getTime())) {
      return "unknown";
    }

    const diffInSeconds = Math.floor(
      (now.getTime() - commentDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Comment Input */}
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={500}
          minRows={2}
          maxRows={4}
          disabled={isLoading || isSubmitting}
          classNames={{
            input: "text-sm text-foreground",
            inputWrapper:
              "bg-muted/20 border-border hover:border-border/80 focus-within:border-primary",
            base: "data-[hover=true]:bg-muted/30",
          }}
        />
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            {newComment.length}/500 characters
          </span>
          <Button
            size="sm"
            color="primary"
            onClick={handleSubmitComment}
            disabled={
              !newComment.trim() || isSubmitting || newComment.length > 500
            }
            isLoading={isSubmitting}
            className="font-medium"
          >
            Comment
          </Button>
        </div>

        {/* Comment Error */}
        {commentError && (
          <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{commentError}</span>
          </div>
        )}
      </div>

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="px-1 text-sm font-semibold text-foreground">
            Comments ({comments.length})
          </h4>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 rounded-lg border border-border/30 bg-transparent p-3 transition-all duration-200 hover:bg-muted/20"
            >
              <Avatar
                src={comment.user.image}
                name={comment.user.name || "User"}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.user.name || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                  {comment.content}
                </p>
              </div>
              {(comment.userId === currentUserId ||
                scoreOwnerId === currentUserId) && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  isLoading={deletingCommentId === comment.id}
                  className="flex-shrink-0 opacity-60 transition-opacity duration-200 hover:opacity-100"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
