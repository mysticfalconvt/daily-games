"use client";

import { useState } from "react";

import { Avatar, Button } from "@nextui-org/react";

interface FriendRequest {
    id: string;
    senderId: string;
    receiverId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    sender: {
        id: string;
        name: string | null;
        email: string;
        emailVerified: Date | null;
        image: string;
    };
}

interface FriendRequestsListProps {
    requests: FriendRequest[];
    onUpdate?: () => void;
}

export function FriendRequestsList({ requests, onUpdate }: FriendRequestsListProps) {
    const [loadingStates, setLoadingStates] = useState<Record<string, 'accept' | 'decline' | null>>({});

    const handleAccept = async (requestId: string) => {
        setLoadingStates(prev => ({ ...prev, [requestId]: 'accept' }));

        try {
            const response = await fetch("/api/friends/accept", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ requestId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to accept friend request");
            }

            onUpdate?.();
        } catch (error) {
            console.error("Error accepting friend request:", error);
            // You might want to show a toast notification here
        } finally {
            setLoadingStates(prev => ({ ...prev, [requestId]: null }));
        }
    };

    const handleDecline = async (requestId: string) => {
        setLoadingStates(prev => ({ ...prev, [requestId]: 'decline' }));

        try {
            const response = await fetch("/api/friends/decline", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ requestId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to decline friend request");
            }

            onUpdate?.();
        } catch (error) {
            console.error("Error declining friend request:", error);
            // You might want to show a toast notification here
        } finally {
            setLoadingStates(prev => ({ ...prev, [requestId]: null }));
        }
    };

    if (requests.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Friend Requests</h3>
                <p className="text-gray-500">No pending friend requests</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Friend Requests ({requests.length})</h3>
            <div className="space-y-3">
                {requests.map((request) => (
                    <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={request.sender.image}
                                name={request.sender.name || request.sender.email}
                                showFallback
                                size="sm"
                            />
                            <div>
                                <p className="font-medium">
                                    {request.sender.name || request.sender.email}
                                </p>
                                <p className="text-sm text-gray-500">{request.sender.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                isLoading={loadingStates[request.id] === 'accept'}
                                isDisabled={!!loadingStates[request.id]}
                                onClick={() => handleAccept(request.id)}
                            >
                                Accept
                            </Button>
                            <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                isLoading={loadingStates[request.id] === 'decline'}
                                isDisabled={!!loadingStates[request.id]}
                                onClick={() => handleDecline(request.id)}
                            >
                                Decline
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}