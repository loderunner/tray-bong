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
        <label htmlFor="anthropic-model">Model</label>
        <select
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
        <label htmlFor="anthropic-apiKey">API Key</label>
        <SecureInput
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
