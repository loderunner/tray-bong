import fs from 'node:fs';

import { Menu, Tray, nativeImage } from 'electron';

import * as logger from './logger/main';
import { createPromptWindow } from './prompt/main';
import {
  type SystemPrompt,
  getPromptsFilePath,
  initializePromptsFile,
  loadPrompts,
} from './prompts';
import { createSettingsWindow } from './settings/main';

let tray: Tray | null = null;

function updateTrayMenu(trayInstance: Tray, prompts: SystemPrompt[]): void {
  const menuItems: Electron.MenuItemConstructorOptions[] = prompts.map(
    (prompt) => ({
      label: prompt.label,
      click: () => {
        createPromptWindow(prompt);
      },
    }),
  );

  if (prompts.length > 0) {
    menuItems.push({ type: 'separator' });
  }

  menuItems.push({
    label: 'Settings...',
    click: () => {
      createSettingsWindow();
    },
  });

  const contextMenu = Menu.buildFromTemplate(menuItems);
  trayInstance.setContextMenu(contextMenu);
}

export async function createTray(): Promise<void> {
  let image = nativeImage.createFromNamedImage('sparkles');
  image = image.resize({ height: 16 });
  image.setTemplateImage(true);
  tray = new Tray(image);

  await initializePromptsFile();
  const prompts = await loadPrompts();
  logger.debug(`Loaded ${prompts.length} prompts`);
  updateTrayMenu(tray, prompts);

  const filePath = getPromptsFilePath();
  fs.watch(filePath, async (eventType) => {
    if (eventType === 'change' && tray !== null) {
      logger.info('Prompts file changed, reloading prompts');
      const trayInstance = tray;
      const updatedPrompts = await loadPrompts();
      logger.debug(`Reloaded ${updatedPrompts.length} prompts`);
      updateTrayMenu(trayInstance, updatedPrompts);
    }
  });
}
