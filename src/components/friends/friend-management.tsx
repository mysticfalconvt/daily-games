"use client";

import { useEffect, useState } from "react";

import { Divider } from "@nextui-org/react";

import { AddFriendForm } from "./add-friend-form";
import { FriendRequestsList } from "./friend-requests-list";
import { FriendsList } from "./friends-list";
import { PrivacyToggle } from "./privacy-toggle";
import { SentRequestsList } from "./sent-requests-list";

interface Friend {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string;
}

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

interface SentRequest {
    id: string;
    senderId: string;
    receiverId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    receiver: {
        id: string;
        name: string | null;
        email: string;
        emailVerified: Date | null;
        image: string;
    };
}

export function FriendManagement() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<SentRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setError(null);
            const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
                fetch("/api/friends"),
                fetch("/api/friends/requests/incoming"),
                fetch("/api/friends/requests/outgoing"),
            ]);

            if (friendsRes.ok) {
                const friendsData = await friendsRes.json();
                setFriends(friendsData.friends);
            } else {
                throw new Error("Failed to fetch friends");
            }

            if (incomingRes.ok) {
                const incomingData = await incomingRes.json();
                setIncomingRequests(incomingData.requests);
            } else {
                throw new Error("Failed to fetch incoming requests");
            }

            if (outgoingRes.ok) {
                const outgoingData = await outgoingRes.json();
                setOutgoingRequests(outgoingData.requests);
            } else {
                throw new Error("Failed to fetch outgoing requests");
            }
        } catch (error) {
            console.error("Error fetching friend data:", error);
            setError(error instanceof Error ? error.message : "Failed to load friend data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="text-center p-6 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AddFriendForm onSuccess={fetchData} />

            <Divider />

            <FriendRequestsList requests={incomingRequests} onUpdate={fetchData} />

            <Divider />

            <SentRequestsList requests={outgoingRequests} onUpdate={fetchData} />

            <Divider />

            <FriendsList friends={friends} onUpdate={fetchData} />

            <Divider />

            <PrivacyToggle />
        </div>
    );
}