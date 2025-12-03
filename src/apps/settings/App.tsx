/// <reference types="./index.d.ts" />
import { GearIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
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

  const onChangeProvider = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value as Provider;
      updateSettings((draft) => {
        if (draft === null) {
          return;
        }
        draft.provider = newProvider;
      });
    },
    [updateSettings],
  );

  if (settings === null) {
    return (
      <div className="settings flex h-full items-center justify-center bg-linear-to-br from-cyan-50 via-blue-50 to-indigo-100 p-6 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
        <div className="app-drag-region h-9 w-full"></div>
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings flex h-full flex-col overflow-hidden bg-linear-to-br from-cyan-50 via-blue-50 to-indigo-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="app-drag-region h-9 w-full"></div>
      {/* Header */}
      <div className="border-b border-white/30 bg-white/20 px-8 py-6 backdrop-blur-xl transition-colors duration-300 not-dark:shadow-sm not-dark:shadow-blue-100/20 dark:border-slate-800/50 dark:bg-slate-900/20">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50/80 p-2 not-dark:backdrop-blur-sm dark:bg-slate-800/50">
            <GearIcon className="h-6 w-6 text-blue-600 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Settings
            </h1>
            <p className="text-sm text-slate-600/80 dark:text-slate-400">
              Configure your AI assistant
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
        {/* Provider Section */}
        <div className="card">
          <label className="label">
            <span>Provider</span>
            <p>Select your AI model provider</p>

            <select value={settings.provider} onChange={onChangeProvider}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="ollama">Ollama</option>
            </select>
          </label>
        </div>

        {settings.provider === 'openai' && (
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
        )}

        {settings.provider === 'anthropic' && (
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
        )}

        {settings.provider === 'google' && (
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
        )}

        {settings.provider === 'ollama' && (
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
