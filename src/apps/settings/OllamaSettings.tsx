import { twMerge } from 'tailwind-merge';

import { type OllamaOptions } from '@/services/settings/settings';

type Props = {
  settings: OllamaOptions;
  onChange: (settings: OllamaOptions) => void;
  saved: boolean;
};

export function OllamaSettings({ settings, onChange }: Props) {
  return (
    <>
      <div className="card">
        <label htmlFor="ollama-model">Model</label>
        <input
          id="ollama-model"
          placeholder="e.g., llama3.2:1b"
          type="text"
          value={settings.model}
          onChange={(e) => {
            onChange({ ...settings, model: e.target.value });
          }}
        />
        <p
          className={twMerge(
            'mt-1 text-xs text-gray-500',
            settings.model.trim() === '' && 'hidden',
          )}
        >
          Tip: Run{' '}
          <code className="rounded bg-gray-100 px-1 select-text dark:bg-slate-700/50 dark:text-slate-300">
            ollama pull {settings.model.trim()}
          </code>{' '}
          in a shell to download the model
        </p>
      </div>

      <div className="card">
        <label htmlFor="ollama-endpoint">Ollama Endpoint</label>
        <input
          id="ollama-endpoint"
          placeholder="http://localhost:11434"
          type="text"
          value={settings.endpointURL}
          onChange={(e) => {
            onChange({ ...settings, endpointURL: e.target.value });
          }}
        />
      </div>
    </>
  );
}
