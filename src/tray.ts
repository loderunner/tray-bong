import { Menu, Tray, nativeImage, shell } from 'electron';

import { createPromptWindow } from './apps/prompt/main';
import { createSettingsWindow } from './apps/settings/main';
import {
  type Conversation,
  type ConversationMetadata,
  createConversationId,
  getConversationsDirectory,
  listConversations,
  loadConversation,
} from './services/conversations/main';
import { loadPrompts } from './services/prompts/main';

let tray: Tray | null = null;
let contextMenu: Menu | null = null;
let needsUpdate = false;

export function markMenuNeedsUpdate(): void {
  needsUpdate = true;
}

function buildConversationsSubmenu(
  conversations: ConversationMetadata[],
): Electron.MenuItemConstructorOptions[] {
  const items: Electron.MenuItemConstructorOptions[] = [];

  for (const conversation of conversations) {
    items.push({
      label: conversation.title,
      click: async () => {
        const loadedConversation = await loadConversation(conversation.id);
        await createPromptWindow(loadedConversation);
      },
    });
  }

  if (conversations.length > 0) {
    items.push({ type: 'separator' });
    items.push({
      label: 'Reveal conversation files...',
      click: () => {
        const directory = getConversationsDirectory();
        void shell.openPath(directory);
      },
    });
  }

  return items;
}

export async function updateTrayMenu(): Promise<void> {
  if (tray === null) {
    return;
  }

  // Reset state
  needsUpdate = false;

  const prompts = await loadPrompts();

  const menuItems: Electron.MenuItemConstructorOptions[] = prompts.map(
    (prompt) => ({
      label: prompt.label,
      click: async () => {
        const conversation = createEmptyConversation(
          prompt.prompt,
          prompt.label,
        );
        await createPromptWindow(conversation);
      },
    }),
  );

  if (prompts.length > 0) {
    menuItems.push({ type: 'separator' });
  }

  const conversations = await listConversations(10, 0);
  if (conversations.length > 0) {
    const submenuItems = buildConversationsSubmenu(conversations);
    const submenu = Menu.buildFromTemplate(submenuItems);
    menuItems.push({
      label: 'Recent conversations',
      submenu,
    });
    menuItems.push({ type: 'separator' });
  }

  menuItems.push({
    label: 'Settings...',
    click: () => {
      createSettingsWindow();
    },
  });

  const newContextMenu = Menu.buildFromTemplate(menuItems);

  // Remove old menu close listener if it exists
  if (contextMenu !== null) {
    contextMenu.removeAllListeners('menu-will-close');
  }

  // Add close listener to new menu
  newContextMenu.on('menu-will-close', () => {
    setImmediate(async () => {
      if (needsUpdate) {
        await updateTrayMenu();
      }
    });
  });

  contextMenu = newContextMenu;
  tray.setContextMenu(contextMenu);
}

export function createTray(): void {
  let image = nativeImage.createFromNamedImage('sparkles');
  image = image.resize({ height: 16 });
  image.setTemplateImage(true);
  tray = new Tray(image);
}

function createEmptyConversation(
  systemPrompt: string,
  label: string,
): Conversation {
  const id = createConversationId();
  const now = Date.now();
  const messages =
    systemPrompt.trim() !== ''
      ? [
          {
            id: 'system',
            role: 'system' as const,
            parts: [{ type: 'text' as const, text: systemPrompt }],
          },
        ]
      : [];

  return {
    id,
    createdAt: now,
    updatedAt: now,
    title: label,
    messages,
  };
}
