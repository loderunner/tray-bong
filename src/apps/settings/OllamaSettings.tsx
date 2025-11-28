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
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor="ollama-model"
        >
          Model
        </label>
        <input
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
          <code className="rounded bg-gray-100 px-1 select-text">
            ollama pull {settings.model.trim()}
          </code>{' '}
          in a shell to download the model
        </p>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor="ollama-endpoint"
        >
          Ollama Endpoint
        </label>
        <input
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
