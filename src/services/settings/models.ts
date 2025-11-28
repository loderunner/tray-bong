type ArrayToUnion<T extends readonly string[]> = T[number];

export const Providers = ['openai', 'anthropic', 'google', 'ollama'] as const;

export type Provider = ArrayToUnion<typeof Providers>;

export type ModelInfo = {
  id: string;
  displayName: string;
};

export const anthropicModelIds = [
  'claude-sonnet-4-5',
  'claude-opus-4-5',
  'claude-haiku-4-5',
] as const;
export type AnthropicModelId = ArrayToUnion<typeof anthropicModelIds>;

export const openaiModelIds = [
  'gpt-5.1',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5-pro',
  'gpt-5',
  'gpt-4.1',
] as const;
export type OpenAIModelId = ArrayToUnion<typeof openaiModelIds>;

export const googleModelIds = [
  'gemini-3-pro',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
] as const;
export type GoogleModelId = ArrayToUnion<typeof googleModelIds>;

export type ModelId = AnthropicModelId | OpenAIModelId | GoogleModelId;

// Map IDs to display names
const modelDisplayNames: Record<ModelId, string> = {
  'claude-sonnet-4-5': 'Claude Sonnet 4.5',
  'claude-opus-4-5': 'Claude Opus 4.5',
  'claude-haiku-4-5': 'Claude Haiku 4.5',

  'gpt-5.1': 'GPT-5.1',
  'gpt-5-mini': 'GPT-5 mini',
  'gpt-5-nano': 'GPT-5 nano',
  'gpt-5-pro': 'GPT-5 pro',
  'gpt-5': 'GPT-5',
  'gpt-4.1': 'GPT-4.1',

  'gemini-3-pro': 'Gemini 3 Pro',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
};

// Helper to build model info from IDs
function buildModels(ids: readonly ModelId[]): readonly ModelInfo[] {
  return ids.map((id) => ({
    id,
    displayName: modelDisplayNames[id],
  }));
}

// Build the models object from IDs
export const Models = {
  anthropic: buildModels(anthropicModelIds),
  openai: buildModels(openaiModelIds),
  google: buildModels(googleModelIds),
  ollama: [],
} as const satisfies Record<Provider, readonly ModelInfo[]>;
