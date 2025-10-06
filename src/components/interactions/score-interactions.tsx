"use client";

import { Avatar, Button, Divider } from "@nextui-org/react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { EmojiType, ScoreInteractions as ScoreInteractionsType } from "@/types/interactions";
import { CommentSection } from "./comment-section";
import { ReactionBar } from "./reaction-bar";

interface ScoreInteractionsProps {
    scoreId: string;

    currentUserId: string;
    initialInteractions?: ScoreInteractionsType;
}

export const ScoreInteractions = ({
    scoreId,
    currentUserId,
    initialInteractions,
}: ScoreInteractionsProps) => {
    const [interactions, setInteractions] = useState<ScoreInteractionsType>(
        initialInteractions || {
            comments: [],
            reactions: {
                "👍": { count: 0, users: [], userHasReacted: false },
                "🔥": { count: 0, users: [], userHasReacted: false },
                "😮": { count: 0, users: [], userHasReacted: false },
                "😂": { count: 0, users: [], userHasReacted: false },
                "❤️": { count: 0, users: [], userHasReacted: false },
                "🎉": { count: 0, users: [], userHasReacted: false },
            },
        }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [canInteract, setCanInteract] = useState(true);

    // Fetch interactions if not provided initially
    useEffect(() => {
        const fetchInteractions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/scores/${scoreId}/interactions`);
                if (response.ok) {
                    const data = await response.json();
                    setInteractions(data.interactions);
                    setRetryCount(0);
                    setCanInteract(true);
                } else if (response.status === 403) {
                    // User doesn't have permission to interact
                    setCanInteract(false);
                    setError(null);
                } else {
                    const errorData = await response.json();
                    setError(errorData.message || "Failed to load interactions");
                }
            } catch (error) {
                console.error("Error fetching interactions:", error);
                setError("Unable to connect. Please check your internet connection.");
            } finally {
                setIsLoading(false);
            }
        };

        if (!initialInteractions) {
            fetchInteractions();
        }
    }, [scoreId, initialInteractions, retryCount]);

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

    const handleAddComment = async (content: string) => {
        try {
            const response = await fetch(`/api/scores/${scoreId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to add comment");
            }

            const data = await response.json();
            setInteractions(prev => ({
                ...prev,
                comments: [...prev.comments, data.comment],
            }));
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error; // Re-throw to let the component handle the error display
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            const response = await fetch(`/api/scores/comments/${commentId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to delete comment");
            }

            setInteractions(prev => ({
                ...prev,
                comments: prev.comments.filter(comment => comment.id !== commentId),
            }));
        } catch (error) {
            console.error("Error deleting comment:", error);
            throw error; // Re-throw to let the component handle the error display
        }
    };

    const handleToggleReaction = async (emojiType: EmojiType) => {
        // Store the previous state for rollback
        const previousReactions = { ...interactions.reactions };

        // Optimistically update the UI first
        setInteractions(prev => {
            const newReactions = { ...prev.reactions };
            const currentReaction = newReactions[emojiType];

            if (currentReaction.userHasReacted) {
                // Remove user's reaction
                newReactions[emojiType] = {
                    count: Math.max(0, currentReaction.count - 1),
                    users: currentReaction.users.filter(user => user.id !== currentUserId),
                    userHasReacted: false,
                };
            } else {
                // Add user's reaction
                newReactions[emojiType] = {
                    count: currentReaction.count + 1,
                    users: [...currentReaction.users, { id: currentUserId, name: "You" }],
                    userHasReacted: true,
                };
            }

            return {
                ...prev,
                reactions: newReactions,
            };
        });

        try {
            const response = await fetch(`/api/scores/${scoreId}/reactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ emojiType }),
            });

            if (!response.ok) {
                // Rollback the optimistic update
                setInteractions(prev => ({
                    ...prev,
                    reactions: previousReactions,
                }));

                const error = await response.json();
                throw new Error(error.message || "Failed to toggle reaction");
            }
        } catch (error) {
            // Rollback the optimistic update on any error
            setInteractions(prev => ({
                ...prev,
                reactions: previousReactions,
            }));

            console.error("Error toggling reaction:", error);
            throw error; // Re-throw to let the component handle the error display
        }
    };



    return (
        <div className="flex flex-col gap-4 mt-4">
            <Divider className="bg-gray-200 dark:bg-gray-700" />

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
                    <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onClick={handleRetry}
                        isLoading={isLoading}
                    >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                    </Button>
                </div>
            )}

            {canInteract ? (
                <>
                    {/* Reaction Bar */}
                    <ReactionBar
                        reactions={interactions.reactions}
                        onToggleReaction={handleToggleReaction}
                        isLoading={isLoading}
                    />

                    {/* Comment Section */}
                    <CommentSection
                        comments={interactions.comments}
                        currentUserId={currentUserId}
                        onAddComment={handleAddComment}
                        onDeleteComment={handleDeleteComment}
                        isLoading={isLoading}
                    />
                </>
            ) : (
                <>
                    {/* Read-only Reaction Display */}
                    <div className="flex flex-wrap gap-2 opacity-60">
                        {(Object.entries(interactions.reactions) as [EmojiType, typeof interactions.reactions[EmojiType]][])
                            .filter(([, reactionData]) => reactionData.count > 0)
                            .map(([emojiType, reactionData]) => (
                                <div
                                    key={emojiType}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                                >
                                    <span>{emojiType}</span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{reactionData.count}</span>
                                </div>
                            ))}
                    </div>

                    {/* Read-only Comments Display */}
                    {interactions.comments.length > 0 && (
                        <div className="flex flex-col gap-3 opacity-60">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Comments ({interactions.comments.length})
                            </h4>
                            {interactions.comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                                >
                                    <Avatar
                                        src={comment.user.image}
                                        name={comment.user.name || "User"}
                                        size="sm"
                                        className="flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {comment.user.name || "Anonymous"}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Privacy Message */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                            This user&apos;s interactions are private. Only friends can comment and react.
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};