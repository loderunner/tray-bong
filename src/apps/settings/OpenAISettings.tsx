import { SecureInput } from './SecureInput';

import { type ModelInfo, Models } from '@/services/settings/models';
import { type OpenAIOptions } from '@/services/settings/settings';

type Props = {
  settings: OpenAIOptions;
  onChange: (settings: OpenAIOptions) => void;
  saved: boolean;
};

export function OpenAISettings({ settings, onChange, saved }: Props) {
  const models = Models.openai;

  return (
    <>
      <div className="card">
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor="openai-model"
        >
          Model
        </label>
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          id="openai-model"
          value={settings.model}
          onChange={(e) => {
            onChange({
              ...settings,
              model: e.target.value as OpenAIOptions['model'],
            });
          }}
        >
          {models.map((m: ModelInfo) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor="openai-apiKey"
        >
          API Key
        </label>
        <SecureInput
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          id="openai-apiKey"
          placeholder="Enter API key"
          saved={saved}
          value={settings.apiKey}
          onChange={(apiKey) => {
            onChange({ ...settings, apiKey });
          }}
        />
      </div>
    </>
  );
}
