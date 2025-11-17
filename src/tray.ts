import fs from 'node:fs';

import { Menu, Tray, nativeImage, shell } from 'electron';

import {
  type SystemPrompt,
  getPromptsFilePath,
  initializePromptsFile,
  loadPrompts,
} from './prompts';

let tray: Tray | null = null;

function updateTrayMenu(trayInstance: Tray, prompts: SystemPrompt[]): void {
  const menuItems: Electron.MenuItemConstructorOptions[] = [];

  for (const prompt of prompts) {
    menuItems.push({
      label: prompt.label,
      click: () => {
        console.log(prompt.prompt);
      },
    });
  }

  if (prompts.length > 0) {
    menuItems.push({ type: 'separator' });
  }

  menuItems.push({
    label: 'Edit Prompts...',
    click: () => {
      const filePath = getPromptsFilePath();
      void shell.openPath(filePath);
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
  updateTrayMenu(tray, prompts);

  const filePath = getPromptsFilePath();
  fs.watch(filePath, (eventType) => {
    if (eventType === 'change' && tray !== null) {
      const trayInstance = tray;
      void loadPrompts().then((updatedPrompts) => {
        updateTrayMenu(trayInstance, updatedPrompts);
      });
    }
  });
}
