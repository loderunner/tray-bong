# Now

- setup prop ordering for eslint-plugin-react
- Generate conversation title based on the input message
- Save and restore past conversations - Recent conversations list in menu
- Copy the contents of an assistant message with a little button in the corner
- Regenerate an assistant message

# Later

- Better colors & dark mode
- Show thinking indicator and stream thinking text - hidden revealable text
- Write each IPC like its own little backend service
- Push state to Renderer processes on creation and store in a context
- Expose refresh and mutation functions to Renderer processes through the
  context, based on useSWR, with a custom fetcher that uses the ipcRenderer to
  send messages to the main process
- configure prompts to accept variables, and settings like reasoning budget,
  temperature, topK, etc.
- prompt building interface
