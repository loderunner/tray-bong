# Now

- Fix Ollama pull tip text
- Fix global type declarations problems (globals are only for react code,
  exposed over the context bridge)
- Don't make a default logger, make each module create its own logger, with
  context
- Save and restore past conversations - Recent conversations list in menu
- Don't destroy latest conversation, and bring it back up by default (unless a
  new prompt is selected)
- Fix issue that I can't move the window by grabbing the background of a div, if
  there's scrolled content underneath where I'm clicking (+drag when click on
  title). For example, scroll the messages up to below the title bar.

# Later

- Better colors & dark mode
- Show thinking indicator and stream thinking text - hidden revealable text
- configure prompts to accept variables, and settings like reasoning budget,
  temperature, topK, etc.
- prompt building interface
- Memorize settings for each provider
- Move settings file to the user data directory with prompts

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
