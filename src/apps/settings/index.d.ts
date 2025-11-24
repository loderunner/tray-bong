declare global {
  var SettingsWindow: {
    revealPromptsFile: () => Promise<void>;
  };
}

export {};
