"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar, Button, Input } from "@nextui-org/react";

interface AddFriendFormProps {
  onSuccess?: () => void;
}

/** Matches the search API: `email` comes back only for an exact-address match. */
interface UserSuggestion {
  id: string;
  name: string | null;
  image: string;
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddFriendForm({ onSuccess }: AddFriendFormProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.users);
          setShowSuggestions(data.users.length > 0);
        }
      } catch (searchError) {
        console.error("Error searching users:", searchError);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

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

  /** Sends by id or email, whichever the caller has. */
  const sendRequest = async (
    payload: { userId: string } | { email: string }
  ) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send friend request");
      }

      setSuccess("Friend request sent.");
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Picking a suggestion sends by id, so a name match never needs the person's
  // address to reach the browser at all.
  const handleSuggestionClick = (user: UserSuggestion) => {
    setShowSuggestions(false);
    sendRequest({ userId: user.id });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) {
      setError("Enter an email address or name");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setError(
        "Enter a full email address, or pick someone from the search results"
      );
      return;
    }

    await sendRequest({ email: trimmed });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Add Friend</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            label="Email address or name"
            placeholder="jane@example.com"
            description="Search by name to find people with public scores. Anyone else has to be added by their full email address."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setError("");
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            isDisabled={isLoading}
            isInvalid={!!error}
            errorMessage={error}
            endContent={
              isSearching && (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
              )
            }
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-default-200 bg-content1 shadow-lg"
            >
              {suggestions.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-default-100"
                  onClick={() => handleSuggestionClick(user)}
                >
                  <Avatar
                    src={user.image}
                    name={user.name ?? user.email ?? "?"}
                    showFallback
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.name ?? user.email}
                    </p>
                    {/* Only ever set when the searcher typed the address. */}
                    {user.email && (
                      <p className="truncate text-xs text-default-500">
                        {user.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {success && (
          <div className="rounded bg-success-50 p-2 text-sm text-success-700">
            {success}
          </div>
        )}

        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          isDisabled={!query.trim() || isLoading}
          className="w-full"
        >
          Send Friend Request
        </Button>
      </form>
    </div>
  );
}
