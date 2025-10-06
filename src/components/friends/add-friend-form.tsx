"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar, Button, Input } from "@nextui-org/react";

interface AddFriendFormProps {
    onSuccess?: () => void;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    image: string;
}

export function AddFriendForm({ onSuccess }: AddFriendFormProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Search for users as the user types
    useEffect(() => {
        const searchUsers = async () => {
            if (email.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(`/api/users/search?q=${encodeURIComponent(email)}`);
                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data.users);
                    setShowSuggestions(data.users.length > 0);
                }
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [email]);

    // Handle clicking outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSuggestionClick = (user: User) => {
        setEmail(user.email);
        setShowSuggestions(false);
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setError("Email is required");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/friends/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to send friend request");
            }

            setSuccess("Friend request sent successfully!");
            setEmail("");
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Friend</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                    <Input
                        ref={inputRef}
                        type="email"
                        label="Friend's Email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        isDisabled={isLoading}
                        isInvalid={!!error}
                        errorMessage={error}
                        endContent={isSearching && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        )}
                    />

                    {showSuggestions && suggestions.length > 0 && (
                        <div
                            ref={suggestionsRef}
                            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {suggestions.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    onClick={() => handleSuggestionClick(user)}
                                >
                                    <Avatar
                                        src={user.image}
                                        name={user.name || user.email}
                                        showFallback
                                        size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {user.name || user.email}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {success && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        {success}
                    </div>
                )}

                <Button
                    type="submit"
                    color="primary"
                    isLoading={isLoading}
                    isDisabled={!email.trim() || isLoading}
                    className="w-full"
                >
                    Send Friend Request
                </Button>
            </form>
        </div>
    );
}