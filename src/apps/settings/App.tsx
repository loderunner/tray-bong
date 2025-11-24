/// <reference types="./index.d.ts" />
import { useCallback, useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import type { ModelInfo, Provider } from '@/services/settings/main';

function handleOpenPromptsFile(): void {
  void SettingsWindow.revealPromptsFile();
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
      const loadedSettings = await Settings.getSettings();
      setProvider(loadedSettings.provider);
      setModel(loadedSettings.model);
      setApiKey(loadedSettings.apiKey);
      setOriginalApiKey(loadedSettings.apiKey);
      setApiKeyEdited(false);
      setApiKeyFocused(false);
      setOllamaEndpoint(
        loadedSettings.ollamaEndpoint ?? 'http://localhost:11434',
      );
      const providerModels = Settings.PROVIDER_MODELS[loadedSettings.provider];
      setModels(providerModels);
    }

    void load();
  }, []);

  useEffect(() => {
    function updateModels(): void {
      const providerModels = Settings.PROVIDER_MODELS[provider];
      setModels(providerModels);
      // Default to first model when switching provider
      if (providerModels.length > 0) {
        setModel(providerModels[0].id);
      } else {
        // Ollama - allow free text input
        setModel('');
      }
    }

    updateModels();
  }, [provider]);

  async function handleSave(): Promise<void> {
    // Use the edited API key if user was editing, otherwise keep original
    const keyToSave = apiKeyEdited ? apiKey : originalApiKey;
    await Settings.saveSettings({
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
            className="mb-2 block text-sm font-medium text-gray-700"
            htmlFor="provider"
          >
            Provider
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            id="provider"
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as Provider);
            }}
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
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="model"
            >
              Model
            </label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              id="model"
              placeholder="e.g., llama3.2:1b"
              type="text"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
              }}
            />
            <p
              className={twMerge(
                'mt-1 text-xs text-gray-500',
                model.trim() === '' && 'hidden',
              )}
            >
              Tip: Run{' '}
              <code className="rounded bg-gray-100 px-1 select-text">
                ollama pull {model.trim()}
              </code>{' '}
              in a shell to download the model
            </p>
          </div>
        ) : (
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="model"
            >
              Model
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              id="model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
              }}
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
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="apiKey"
            >
              API Key
            </label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              id="apiKey"
              placeholder="Enter API key"
              type="text"
              value={
                apiKeyFocused || apiKeyEdited
                  ? apiKey
                  : maskApiKey(originalApiKey)
              }
              onBlur={handleApiKeyBlur}
              onChange={handleApiKeyChange}
              onFocus={handleApiKeyFocus}
            />
          </div>
        )}

        {isOllama && (
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="ollamaEndpoint"
            >
              Ollama Endpoint
            </label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              id="ollamaEndpoint"
              placeholder="http://localhost:11434"
              type="text"
              value={ollamaEndpoint}
              onChange={(e) => {
                setOllamaEndpoint(e.target.value);
              }}
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            onClick={handleOpenPromptsFile}
          >
            Reveal Prompts File
          </button>
          <button
            className="rounded-md bg-blue-500 px-6 py-2 text-base text-white shadow-sm transition-colors hover:bg-blue-600"
            onClick={handleSave}
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
