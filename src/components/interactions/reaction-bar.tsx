"use client";

import { Button, Popover, PopoverContent, PopoverTrigger, Tooltip } from "@nextui-org/react";
import { Smile } from "lucide-react";
import { useState } from "react";

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

    const formatUserList = (users: Array<{ id: string; name: string | null }>) => {
        if (users.length === 0) return "";
        if (users.length === 1) return users[0].name || "Someone";
        if (users.length === 2) {
            return `${users[0].name || "Someone"} and ${users[1].name || "someone"}`;
        }
        return `${users[0].name || "Someone"}, ${users[1].name || "someone"} and ${users.length - 2} others`;
    };

    // Get emojis that have reactions
    const emojisWithReactions = (Object.entries(reactions) as [EmojiType, typeof reactions[EmojiType]][])
        .filter(([, reactionData]) => reactionData.count > 0);

    return (
        <div className="flex flex-wrap gap-2 items-center">
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
                            className={`
                min-w-0 px-2 h-8 text-sm transition-all duration-200
                ${userHasReacted
                                    ? "bg-primary/20 dark:bg-primary/30 border-primary scale-105"
                                    : "hover:scale-105 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                }
                ${isToggling ? "animate-pulse" : ""}
              `}
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
                        className="min-w-0 px-2 h-8 opacity-70 hover:opacity-100 transition-all duration-200 hover:scale-105 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        disabled={isLoading}
                    >
                        <Smile size={14} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">React</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
                                    className="min-w-0 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
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