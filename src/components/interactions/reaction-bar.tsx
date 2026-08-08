"use client";

import { useState } from "react";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@nextui-org/react";
import { Smile } from "lucide-react";

import { EmojiType, ReactionSummary } from "@/types/interactions";

interface ReactionBarProps {
  reactions: ReactionSummary;
  onToggleReaction: (emojiType: EmojiType) => Promise<void>;
  isLoading?: boolean;
}

const EMOJI_LABELS: Record<EmojiType, string> = {
  "👍": "Like",
  "🔥": "Fire",
  "😮": "Wow",
  "😂": "Funny",
  "❤️": "Love",
  "🎉": "Celebrate",
};

const ALL_EMOJIS: EmojiType[] = ["👍", "🔥", "😮", "😂", "❤️", "🎉"];

export const ReactionBar = ({
  reactions,
  onToggleReaction,
  isLoading = false,
}: ReactionBarProps) => {
  const [togglingEmoji, setTogglingEmoji] = useState<EmojiType | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleToggleReaction = async (emojiType: EmojiType) => {
    if (togglingEmoji || isLoading) return;

    setTogglingEmoji(emojiType);
    setIsPopoverOpen(false); // Close popover when selecting an emoji

    try {
      await onToggleReaction(emojiType);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    } finally {
      setTogglingEmoji(null);
    }
  };

  const formatUserList = (
    users: Array<{ id: string; name: string | null }>
  ) => {
    if (users.length === 0) return "";
    if (users.length === 1) return users[0].name || "Someone";
    if (users.length === 2) {
      return `${users[0].name || "Someone"} and ${users[1].name || "someone"}`;
    }
    return `${users[0].name || "Someone"}, ${users[1].name || "someone"} and ${users.length - 2} others`;
  };

  // Get emojis that have reactions
  const emojisWithReactions = (
    Object.entries(reactions) as [EmojiType, (typeof reactions)[EmojiType]][]
  ).filter(([, reactionData]) => reactionData.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Show existing reactions */}
      {emojisWithReactions.map(([emojiType, reactionData]) => {
        const userHasReacted = reactionData.userHasReacted;
        const isToggling = togglingEmoji === emojiType;

        return (
          <Tooltip
            key={emojiType}
            content={`${formatUserList(reactionData.users)} reacted with ${EMOJI_LABELS[emojiType]}`}
            placement="top"
            delay={500}
          >
            <Button
              size="sm"
              variant={userHasReacted ? "solid" : "bordered"}
              color={userHasReacted ? "primary" : "default"}
              onClick={() => handleToggleReaction(emojiType)}
              disabled={isLoading || isToggling}
              isLoading={isToggling}
              className={`h-8 min-w-0 px-2 text-sm transition-all duration-200 ${
                userHasReacted
                  ? "scale-105 border-primary bg-primary/20 dark:bg-primary/30"
                  : "border-gray-200 hover:scale-105 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              } ${isToggling ? "animate-pulse" : ""} `}
            >
              <span className="text-base">{emojiType}</span>
              <span className="ml-1 text-xs font-medium">
                {reactionData.count}
              </span>
            </Button>
          </Tooltip>
        );
      })}

      {/* Add reaction button */}
      <Popover
        isOpen={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        placement="top"
      >
        <PopoverTrigger>
          <Button
            size="sm"
            variant="bordered"
            className="h-8 min-w-0 border-dashed border-gray-300 px-2 opacity-70 transition-all duration-200 hover:scale-105 hover:border-gray-400 hover:opacity-100 dark:border-gray-600 dark:hover:border-gray-500"
            disabled={isLoading}
          >
            <Smile size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              React
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex gap-1">
            {ALL_EMOJIS.map((emojiType) => (
              <Tooltip
                key={emojiType}
                content={EMOJI_LABELS[emojiType]}
                placement="top"
                delay={300}
              >
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onClick={() => handleToggleReaction(emojiType)}
                  disabled={isLoading || togglingEmoji === emojiType}
                  className="h-8 w-8 min-w-0 transition-all duration-200 hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="text-base">{emojiType}</span>
                </Button>
              </Tooltip>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
