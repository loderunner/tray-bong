type SettingsAPI = {
  openPromptsFile: () => Promise<void>;
};

declare global {
  var settingsAPI: SettingsAPI;
}

function handleOpenPromptsFile(): void {
  void settingsAPI.openPromptsFile();
}

export default function App() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>
      <button
        onClick={handleOpenPromptsFile}
        className="rounded-md bg-blue-500 px-4 py-2 text-base text-white"
      >
        Open Prompts File
      </button>
    </>
  );
}
