/// <reference types="./index.d.ts" />
import { useEffect, useState } from "react";

import type { ConversationMetadata } from "@/services/conversations/main";

function formatDate(date: Date): string {
  const now = Date.now();
  const timestamp = date.getTime();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  return "Just now";
}

function handleRevealDirectory(): void {
  void ConversationsWindow.revealDirectory();
}

async function handleOpenConversation(id: string): Promise<void> {
  await ConversationsWindow.openConversation(id);
}

export default function App() {
  const [conversations, setConversations] = useState<ConversationMetadata[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function loadInitial(): Promise<void> {
      setLoading(true);
      try {
        const initial = await Conversations.listConversations(20, 0);
        setConversations(initial);
        setHasMore(initial.length === 20);
        setOffset(initial.length);
      } finally {
        setLoading(false);
      }
    }

    void loadInitial();
  }, []);

  async function handleLoadMore(): Promise<void> {
    setLoadingMore(true);
    try {
      const next = await Conversations.listConversations(20, offset);
      setConversations([...conversations, ...next]);
      setHasMore(next.length === 20);
      setOffset(offset + next.length);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Conversations</h1>
          <button
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            onClick={handleRevealDirectory}
          >
            Reveal conversation files
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500">No conversations yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <button
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          onClick={handleRevealDirectory}
        >
          Reveal conversation files
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className="rounded-md border border-gray-300 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-gray-50"
            onClick={() => {
              void handleOpenConversation(conversation.id);
            }}
          >
            <div className="font-medium text-gray-900">
              {conversation.title}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {formatDate(conversation.updatedAt)}
            </div>
          </button>
        ))}

        {hasMore && (
          <button
            className="mt-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-base text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            disabled={loadingMore}
            onClick={() => {
              void handleLoadMore();
            }}
          >
            {loadingMore ? "Loading..." : "Show more"}
          </button>
        )}
      </div>
    </div>
  );
}
