"use client";

import { useState } from "react";

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

interface CommentThreadProps {
  taskId: number;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  isAddingComment?: boolean;
}

export function CommentThread({
  comments,
  onAddComment,
  isAddingComment = false,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await onAddComment(newComment);
    setNewComment("");
  };

  return (
    <div className="space-y-6">
      <h3 className="border-b pb-2 text-lg font-medium text-gray-900">
        Comments
      </h3>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to add one!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {comment.authorName}
                  </span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 capitalize">
                    {comment.authorRole.replace("_", " ")}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap text-gray-700">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="mt-6">
        <label htmlFor="new-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          rows={3}
          className="block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Add a comment or update..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isAddingComment}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim() || isAddingComment}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isAddingComment ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
