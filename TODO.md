# Now

- Add a error state to the message UI
- Show thinking indicator and stream thinking text - hidden revealable text
- Support markdown in the message UI
- Move the chat window by grabbing anywhere without text or interaction
- setup prop ordering for eslint-plugin-react

# Later

- Write each IPC like its own little backend service
- Better colors & dark mode
- Push state to Renderer processes on creation and store in a context
- Expose refresh and mutation functions to Renderer processes through the
  context, based on useSWR, with a custom fetcher that uses the ipcRenderer to
  send messages to the main process
- Generate conversation title based on the input message
- Save and restore past conversations - Recent conversations list in menu
- Copy the contents of an assistant message with a little button in the corner
- Regenerate an assistant message
