import { exposeLoggerFactory } from '@/services/logger/renderer';
import { exposePrompts } from '@/services/prompts/renderer';
import { exposeSettings } from '@/services/settings/renderer';

// Expose logger factory to renderer
exposeLoggerFactory();

// Expose settings service
exposeSettings();

// Expose prompts service
exposePrompts();
