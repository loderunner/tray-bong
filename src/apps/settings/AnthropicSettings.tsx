import { SecureInput } from './SecureInput';

import { type ModelInfo, Models } from '@/services/settings/models';
import { type AnthropicOptions } from '@/services/settings/settings';

type Props = {
  settings: AnthropicOptions;
  onChange: (settings: AnthropicOptions) => void;
  saved: boolean;
};

export function AnthropicSettings({ settings, onChange, saved }: Props) {
  const models = Models.anthropic;

  return (
    <>
      <div className="card">
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor="anthropic-model"
        >
          Model
        </label>
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          id="anthropic-model"
          value={settings.model}
          onChange={(e) => {
            onChange({
              ...settings,
              model: e.target.value as AnthropicOptions['model'],
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
          htmlFor="anthropic-apiKey"
        >
          API Key
        </label>
        <SecureInput
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          id="anthropic-apiKey"
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
