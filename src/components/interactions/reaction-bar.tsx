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
              className={`h-8 min-w-0 px-2 text-sm transition-colors ${
                userHasReacted
                  ? "border-primary bg-primary/15 text-primary dark:bg-primary/20"
                  : "border-border bg-transparent hover:bg-muted"
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
          {/* Solid, themed fill. The dashed grey outline read as an empty
              drop-zone rather than a button. */}
          <Button
            size="sm"
            variant="flat"
            className="h-8 min-w-0 bg-muted px-2 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            disabled={isLoading}
          >
            <Smile size={14} />
            <span className="ml-1 text-xs font-medium">React</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="border border-border bg-popover p-2">
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
                  className="h-8 w-8 min-w-0 transition-transform duration-150 hover:scale-110 hover:bg-muted"
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
