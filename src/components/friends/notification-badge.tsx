"use client";

import { useEffect, useState } from "react";

import { Badge } from "@nextui-org/react";

interface NotificationBadgeProps {
    children: React.ReactNode;
}

export function NotificationBadge({ children }: NotificationBadgeProps) {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCount = async () => {
        try {
            const response = await fetch("/api/friends/requests/count");
            if (response.ok) {
                const data = await response.json();
                setCount(data.count);
            }
        } catch (error) {
            console.error("Error fetching notification count:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCount();

        // Refresh count every 30 seconds
        const interval = setInterval(fetchCount, 30000);

        return () => clearInterval(interval);
    }, []);

    // Refresh count when the component becomes visible (user returns to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchCount();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    if (isLoading || count === 0) {
        return <>{children}</>;
    }

    return (
        <Badge
            content={count}
            color="danger"
            size="sm"
            placement="top-right"
        >
            {children}
        </Badge>
    );
}