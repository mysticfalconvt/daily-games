"use client";

import { useState } from "react";

import { Avatar, Button } from "@nextui-org/react";

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
    image: string;
  };
}

interface SentRequestsListProps {
  requests: SentRequest[];
  onUpdate?: () => void;
}

export function SentRequestsList({
  requests,
  onUpdate,
}: SentRequestsListProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleCancel = async (requestId: string) => {
    setLoadingStates((prev) => ({ ...prev, [requestId]: true }));

    try {
      const response = await fetch("/api/friends/cancel", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to cancel friend request");
      }

      onUpdate?.();
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      // You might want to show a toast notification here
    } finally {
      setLoadingStates((prev) => ({ ...prev, [requestId]: false }));
      setShowConfirm(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sent Requests</h3>
        <p className="text-muted-foreground">No pending sent requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Sent Requests ({requests.length})
      </h3>
      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={request.receiver.image}
                name={request.receiver.name || request.receiver.email}
                showFallback
                size="sm"
              />
              <div>
                <p className="font-medium">
                  {request.receiver.name || request.receiver.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {request.receiver.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sent {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {showConfirm === request.id ? (
                <>
                  <Button
                    size="sm"
                    color="danger"
                    variant="solid"
                    isLoading={loadingStates[request.id]}
                    onClick={() => handleCancel(request.id)}
                  >
                    Confirm Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    isDisabled={loadingStates[request.id]}
                    onClick={() => setShowConfirm(null)}
                  >
                    Keep
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  isDisabled={loadingStates[request.id]}
                  onClick={() => setShowConfirm(request.id)}
                >
                  Cancel Request
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
