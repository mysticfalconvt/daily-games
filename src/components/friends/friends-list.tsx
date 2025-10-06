"use client";

import { useState } from "react";

import { Avatar, Button } from "@nextui-org/react";

interface Friend {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string;
}

interface FriendsListProps {
    friends: Friend[];
    onUpdate?: () => void;
}

export function FriendsList({ friends, onUpdate }: FriendsListProps) {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [showConfirm, setShowConfirm] = useState<string | null>(null);

    const handleRemoveFriend = async (friendId: string) => {
        setLoadingStates(prev => ({ ...prev, [friendId]: true }));

        try {
            const response = await fetch("/api/friends/remove", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ friendId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to remove friend");
            }

            onUpdate?.();
        } catch (error) {
            console.error("Error removing friend:", error);
            // You might want to show a toast notification here
        } finally {
            setLoadingStates(prev => ({ ...prev, [friendId]: false }));
            setShowConfirm(null);
        }
    };

    if (friends.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">My Friends</h3>
                <p className="text-gray-500">No friends yet. Send some friend requests to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Friends ({friends.length})</h3>
            <div className="space-y-3">
                {friends.map((friend) => (
                    <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={friend.image}
                                name={friend.name || friend.email}
                                showFallback
                                size="sm"
                            />
                            <div>
                                <p className="font-medium">
                                    {friend.name || friend.email}
                                </p>
                                <p className="text-sm text-gray-500">{friend.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {showConfirm === friend.id ? (
                                <>
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="solid"
                                        isLoading={loadingStates[friend.id]}
                                        onClick={() => handleRemoveFriend(friend.id)}
                                    >
                                        Confirm Remove
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        isDisabled={loadingStates[friend.id]}
                                        onClick={() => setShowConfirm(null)}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    isDisabled={loadingStates[friend.id]}
                                    onClick={() => setShowConfirm(friend.id)}
                                >
                                    Remove Friend
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}