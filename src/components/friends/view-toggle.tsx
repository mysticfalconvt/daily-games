"use client";

import { Switch } from "@nextui-org/react";

interface ViewToggleProps {
    showAllUsers: boolean;
    onToggle: (showAll: boolean) => void;
    hasFriends: boolean;
}

export function ViewToggle({ showAllUsers, onToggle, hasFriends }: ViewToggleProps) {
    if (!hasFriends) {
        return null; // Don't show toggle if user has no friends
    }

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
                <p className="font-medium text-sm">Score View</p>
                <p className="text-xs text-gray-500">
                    {showAllUsers ? "Showing all users' scores" : "Showing only friends' scores"}
                </p>
            </div>
            <Switch
                isSelected={showAllUsers}
                onValueChange={onToggle}
                size="sm"
                color="primary"
            >
                Show All Users
            </Switch>
        </div>
    );
}