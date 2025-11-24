declare global {
  var ConversationsWindow: {
    openConversation: (id: string) => Promise<void>;
    revealDirectory: () => Promise<void>;
  };
}

export {};
