"use client";

import { Switch } from "@nextui-org/react";

interface ViewToggleProps {
  friendsOnly: boolean;
  onToggle: (friendsOnly: boolean) => void;
  hasFriends: boolean;
}

/**
 * Narrows the feed to friends. A display preference only - the server never
 * returns scores the viewer is not allowed to see either way, so this can
 * subtract from the feed but not add to it.
 */
export function ViewToggle({
  friendsOnly,
  onToggle,
  hasFriends,
}: ViewToggleProps) {
  if (!hasFriends) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3">
      <div>
        <p className="text-sm font-medium">Score view</p>
        <p className="text-xs text-default-500">
          {friendsOnly
            ? "Showing only your friends' scores"
            : "Showing friends plus everyone with public scores"}
        </p>
      </div>
      <Switch
        isSelected={friendsOnly}
        onValueChange={onToggle}
        size="sm"
        color="primary"
        aria-label="Friends only"
      >
        Friends only
      </Switch>
    </div>
  );
}
