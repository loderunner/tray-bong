import { exposeLogger } from '@/services/logger/renderer';
import { exposePrompts } from '@/services/prompts/renderer';
import { exposeSettings } from '@/services/settings/renderer';

// Expose logger to renderer
exposeLogger('Settings');

// Expose settings service
exposeSettings();

// Expose prompts service
exposePrompts();
