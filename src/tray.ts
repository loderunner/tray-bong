import { Menu, Tray, nativeImage } from 'electron';

import { createPromptWindow } from './apps/prompt/main';
import { createSettingsWindow } from './apps/settings/main';
import type { SystemPrompt } from './services/prompts/main';

let tray: Tray | null = null;

export function updateTrayMenu(prompts: SystemPrompt[]): void {
  if (tray === null) {
    return;
  }

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
  tray.setContextMenu(contextMenu);
}

export function createTray(): void {
  let image = nativeImage.createFromNamedImage('sparkles');
  image = image.resize({ height: 16 });
  image.setTemplateImage(true);
  tray = new Tray(image);
}
