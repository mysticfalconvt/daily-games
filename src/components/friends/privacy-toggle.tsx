"use client";

import { useEffect, useState } from "react";

import { Switch } from "@nextui-org/react";

export function PrivacyToggle() {
    const [isPrivate, setIsPrivate] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchPrivacySetting = async () => {
            try {
                const response = await fetch("/api/user/privacy");
                if (response.ok) {
                    const data = await response.json();
                    setIsPrivate(data.isPrivate);
                }
            } catch (error) {
                console.error("Error fetching privacy setting:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrivacySetting();
    }, []);

    const handleToggle = async (newValue: boolean) => {
        setIsUpdating(true);
        try {
            const response = await fetch("/api/user/privacy", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isPrivate: newValue }),
            });

            if (response.ok) {
                setIsPrivate(newValue);
            } else {
                console.error("Failed to update privacy setting");
                // Revert the toggle if the update failed
            }
        } catch (error) {
            console.error("Error updating privacy setting:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-6 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
                <p className="font-medium text-sm">Privacy Setting</p>
                <p className="text-xs text-gray-500">
                    {isPrivate
                        ? "Your scores are only visible to friends"
                        : "Your scores are visible to everyone"
                    }
                </p>
            </div>
            <Switch
                isSelected={isPrivate}
                onValueChange={handleToggle}
                isDisabled={isUpdating}
                size="sm"
                color="primary"
            >
                Private Profile
            </Switch>
        </div>
    );
}