import { SecureInput } from './SecureInput';

import { type ModelInfo, Models } from '@/services/settings/models';
import { type GoogleOptions } from '@/services/settings/settings';

type Props = {
  settings: GoogleOptions;
  onChange: (settings: GoogleOptions) => void;
  saved: boolean;
};

export function GoogleSettings({ settings, onChange, saved }: Props) {
  const models = Models.google;

  return (
    <>
      <div className="card">
        <label htmlFor="google-model">Model</label>
        <select
          id="google-model"
          value={settings.model}
          onChange={(e) => {
            onChange({
              ...settings,
              model: e.target.value as GoogleOptions['model'],
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
        <label htmlFor="google-apiKey">API Key</label>
        <SecureInput
          id="google-apiKey"
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
