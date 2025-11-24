# Now

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

- memorize window position and size - per-conversation and use latest
  conversation as default
- Better colors & dark mode
- Show thinking indicator and stream thinking text - hidden revealable text
- configure prompts to accept variables, and settings like reasoning budget,
  temperature, topK, etc.
- prompt building interface
- Memorize settings for each provider
- Move settings file to the user data directory with prompts
- Tests, CI, dependabot, and all that jazz
- Validate settings on save: test model is valid for the provider, test api key
  is valid for the provider, test ollama endpoint is valid, etc.
