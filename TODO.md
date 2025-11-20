# Now

- Save and restore past conversations - Recent conversations list in menu
- Don't destroy latest conversation, and bring it back up by default (unless a
  new prompt is selected)
- Move message component to a separate file
- Fix issue that I can't move the window by grabbing the background of a window,
  if there's scrolled content underneath where I'm clicking (+drag when click on
  title)
- Write each IPC like its own little backend service
- Push state to Renderer processes on creation and store in a context
- Expose refresh and mutation functions to Renderer processes through the
  context, based on useSWR, with a custom fetcher that uses the ipcRenderer to
  send messages to the main process

# Later

- Better colors & dark mode
- Show thinking indicator and stream thinking text - hidden revealable text
- configure prompts to accept variables, and settings like reasoning budget,
  temperature, topK, etc.
- prompt building interface

# Prompt

I want to be able to persist and restore conversations.

Here's what I have in mind:

- Each time a message finishes (user or assistant), we store the entire
  conversation to a file in the user data directory (JSON format, file path is
  `<user-data>/conversations/<uuid>.json`)
- Use uuidv7 with conversation creation timestamp so the files are
  chronologically sorted in the directory listing
- We add a "Recent conversations" submenu to the tray menu that lists the 5 most
  recent conversations. The last item of the submenu is "Show more..." which
  extends the menu with the 5 next conversations.
- Clicking on a conversation name in the submenu opens a new prompt window with
  the conversation loaded.
