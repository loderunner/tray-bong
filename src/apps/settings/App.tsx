/// <reference types="./index.d.ts" />
import { useEffect, useState } from 'react';
import { useImmer } from 'use-immer';

import { AnthropicSettings } from './AnthropicSettings';
import { GoogleSettings } from './GoogleSettings';
import { OllamaSettings } from './OllamaSettings';
import { OpenAISettings } from './OpenAISettings';

import type { Provider } from '@/services/settings/models';
import { type Settings } from '@/services/settings/settings';

function handleOpenPromptsFile(): void {
  void SettingsWindow.revealPromptsFile();
}

export default function App() {
  const [settings, updateSettings] = useImmer<Settings | null>(null);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    async function load(): Promise<void> {
      const loadedSettings = await Settings.getSettings();
      updateSettings(loadedSettings);
    }

    void load();
  }, [updateSettings]);

  async function handleSave(): Promise<void> {
    if (settings === null) {
      return;
    }

    await Settings.saveSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  if (settings === null) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

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
            value={settings.provider}
            onChange={(e) => {
              const newProvider = e.target.value as Provider;
              updateSettings((draft) => {
                if (draft === null) {
                  return;
                }
                draft.provider = newProvider;
              });
            }}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>

        <div className={settings.provider === 'anthropic' ? '' : 'hidden'}>
          <AnthropicSettings
            saved={saved}
            settings={settings.anthropic}
            onChange={(anthropic) => {
              updateSettings((draft) => {
                if (draft === null) {
                  return;
                }
                draft.anthropic.model = anthropic.model;
                draft.anthropic.apiKey = anthropic.apiKey;
              });
            }}
          />
        </div>

        <div className={settings.provider === 'openai' ? '' : 'hidden'}>
          <OpenAISettings
            saved={saved}
            settings={settings.openai}
            onChange={(openai) => {
              updateSettings((draft) => {
                if (draft === null) {
                  return;
                }
                draft.openai.model = openai.model;
                draft.openai.apiKey = openai.apiKey;
              });
            }}
          />
        </div>

        <div className={settings.provider === 'google' ? '' : 'hidden'}>
          <GoogleSettings
            saved={saved}
            settings={settings.google}
            onChange={(google) => {
              updateSettings((draft) => {
                if (draft === null) {
                  return;
                }
                draft.google.model = google.model;
                draft.google.apiKey = google.apiKey;
              });
            }}
          />
        </div>

        <div className={settings.provider === 'ollama' ? '' : 'hidden'}>
          <OllamaSettings
            saved={saved}
            settings={settings.ollama}
            onChange={(ollama) => {
              updateSettings((draft) => {
                if (draft === null) {
                  return;
                }
                draft.ollama.model = ollama.model;
                draft.ollama.endpointURL = ollama.endpointURL;
              });
            }}
          />
        </div>

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
