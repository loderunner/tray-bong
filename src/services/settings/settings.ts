import {
  type AnthropicModelId,
  type GoogleModelId,
  type OpenAIModelId,
  type Provider,
} from './models';

export type AnthropicOptions = {
  model: AnthropicModelId;
  apiKey: string;
};

export type OpenAIOptions = {
  model: OpenAIModelId;
  apiKey: string;
};

export type GoogleOptions = {
  model: GoogleModelId;
  apiKey: string;
};

export type OllamaOptions = {
  model: string;
  endpointURL: string;
};

export type Settings = {
  version: number;
  provider: Provider;
  anthropic: AnthropicOptions;
  openai: OpenAIOptions;
  google: GoogleOptions;
  ollama: OllamaOptions;
};
