import fs from 'node:fs';

import { app } from 'electron';
import started from 'electron-squirrel-startup';

import { setupConversationsWindowIPC } from './apps/conversations/main';
import { setupPromptWindowIPC } from './apps/prompt/main';
import { setupSettingsWindowIPC } from './apps/settings/main';
import { setupAIIPC } from './services/ai/ipc';
import { setupConversationsIPC } from './services/conversations/ipc';
import { getConversationsDirectory } from './services/conversations/main';
import { setupLoggerIPC } from './services/logger/ipc';
import { init } from './services/logger/main';
import { useLogger } from './services/logger/useLogger';
import { setupPromptsIPC } from './services/prompts/ipc';
import { getPromptsFilePath, loadPrompts } from './services/prompts/main';
import { setupSettingsIPC } from './services/settings/ipc';
import { createTray, markMenuNeedsUpdate, updateTrayMenu } from './tray';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.dock?.hide();
// app.applicationMenu = null;

app.on('ready', async () => {
  await init();
  setupLoggerIPC();

  const logger = useLogger('App');

  setupAIIPC();
  setupSettingsIPC();
  setupPromptsIPC();
  setupConversationsIPC();
  setupPromptWindowIPC();
  setupConversationsWindowIPC();
  setupSettingsWindowIPC();

  logger.info('Application started');

  createTray();

  // Load prompts and update tray menu
  const prompts = await loadPrompts();
  logger.debug(`Loaded ${prompts.length} prompts`);
  await updateTrayMenu();

  // Watch prompts file & conversations directory for changes
  const filePath = getPromptsFilePath();
  fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      logger.info('Prompts file changed, marking menu for update');
      markMenuNeedsUpdate();
    }
  });

  const conversationsDirectory = getConversationsDirectory();
  fs.watch(conversationsDirectory, (eventType) => {
    if (eventType === 'rename') {
      logger.info('Conversations directory changed, marking menu for update');
      markMenuNeedsUpdate();
    }
  });
});

app.on('window-all-closed', () => {});
