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
        <label htmlFor="openai-model">Model</label>
        <select
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
        <label htmlFor="openai-apiKey">API Key</label>
        <SecureInput
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
