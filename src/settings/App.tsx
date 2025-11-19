import { useCallback, useEffect, useState } from 'react';

import type { ModelInfo, Provider, ProviderSettings } from '@/settings-data';

type SettingsAPI = {
  openPromptsFile: () => Promise<void>;
  getSettings: () => Promise<ProviderSettings>;
  saveSettings: (settings: ProviderSettings) => Promise<void>;
  getModels: (provider: Provider) => Promise<ModelInfo[]>;
};

declare global {
  var settingsAPI: SettingsAPI;
}

function handleOpenPromptsFile(): void {
  void settingsAPI.openPromptsFile();
}

function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '***';
  }
  const first = key.slice(0, 4);
  const last = key.slice(-4);
  return `${first}***${last}`;
}

export default function App() {
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [model, setModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [originalApiKey, setOriginalApiKey] = useState<string>('');
  const [apiKeyEdited, setApiKeyEdited] = useState<boolean>(false);
  const [apiKeyFocused, setApiKeyFocused] = useState<boolean>(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>(
    'http://localhost:11434',
  );
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    async function load(): Promise<void> {
      const settings = await settingsAPI.getSettings();
      setProvider(settings.provider);
      setModel(settings.model);
      setApiKey(settings.apiKey);
      setOriginalApiKey(settings.apiKey);
      setApiKeyEdited(false);
      setApiKeyFocused(false);
      setOllamaEndpoint(settings.ollamaEndpoint ?? 'http://localhost:11434');
      const providerModels = await settingsAPI.getModels(settings.provider);
      setModels(providerModels);
    }

    void load();
  }, []);

  useEffect(() => {
    async function updateModels(): Promise<void> {
      const providerModels = await settingsAPI.getModels(provider);
      setModels(providerModels);
      // Default to first model when switching provider
      if (providerModels.length > 0) {
        setModel(providerModels[0].id);
      } else {
        // Ollama - allow free text input
        setModel('');
      }
    }

    void updateModels();
  }, [provider]);

  async function handleSave(): Promise<void> {
    // Use the edited API key if user was editing, otherwise keep original
    const keyToSave = apiKeyEdited ? apiKey : originalApiKey;
    await settingsAPI.saveSettings({
      provider,
      model,
      apiKey: keyToSave,
      ollamaEndpoint: provider === 'ollama' ? ollamaEndpoint : undefined,
    });
    // Update original key after save
    setOriginalApiKey(keyToSave);
    setApiKey(keyToSave);
    setApiKeyEdited(false);
    setApiKeyFocused(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  const handleApiKeyFocus = useCallback(() => {
    setApiKeyFocused(true);
    // On focus, reset the text input to empty
    setApiKey('');
    setApiKeyEdited(false);
  }, []);

  const handleApiKeyBlur = useCallback(() => {
    setApiKeyFocused(false);
    // On blur: if user has typed, keep typed key; otherwise restore masked key
    if (!apiKeyEdited) {
      // User didn't type anything, restore masked key
      setApiKey(originalApiKey);
    }
    // If apiKeyEdited is true, keep the typed value (already in apiKey state)
  }, [apiKeyEdited, originalApiKey]);

  const handleApiKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // On type, replace original API key
      if (!apiKeyEdited) {
        setApiKeyEdited(true);
      }
      setApiKey(e.target.value);
    },
    [apiKeyEdited],
  );

  const isOllama = provider === 'ollama';
  const needsApiKey = !isOllama;

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="flex flex-1 flex-col gap-4">
        <div>
          <label
            htmlFor="provider"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Provider
          </label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as Provider);
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>

        {isOllama ? (
          <div>
            <label
              htmlFor="model"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Model
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
              }}
              placeholder="e.g., llama3.2:1b"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tip: Run{' '}
              <code className="rounded bg-gray-100 px-1">
                ollama pull llama3.2:1b
              </code>{' '}
              in a shell to download models
            </p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="model"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsApiKey && (
          <div>
            <label
              htmlFor="apiKey"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              API Key
            </label>
            <input
              id="apiKey"
              type="text"
              value={
                apiKeyFocused || apiKeyEdited
                  ? apiKey
                  : maskApiKey(originalApiKey)
              }
              onFocus={handleApiKeyFocus}
              onBlur={handleApiKeyBlur}
              onChange={handleApiKeyChange}
              placeholder="Enter API key"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        {isOllama && (
          <div>
            <label
              htmlFor="ollamaEndpoint"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Ollama Endpoint
            </label>
            <input
              id="ollamaEndpoint"
              type="text"
              value={ollamaEndpoint}
              onChange={(e) => {
                setOllamaEndpoint(e.target.value);
              }}
              placeholder="http://localhost:11434"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleOpenPromptsFile}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Open Prompts Folder
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-blue-500 px-6 py-2 text-base text-white shadow-sm transition-colors hover:bg-blue-600"
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
