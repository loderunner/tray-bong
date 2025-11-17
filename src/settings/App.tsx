type SettingsAPI = {
  openPromptsFile: () => Promise<void>;
};

declare global {
  interface Window {
    settingsAPI: SettingsAPI;
  }
}

function handleOpenPromptsFile(): void {
  void window.settingsAPI.openPromptsFile();
}

export default function App() {
  return (
    <>
      <h1>Settings</h1>
      <button id="open-prompts-file" onClick={handleOpenPromptsFile}>
        Open Prompts File
      </button>
    </>
  );
}
