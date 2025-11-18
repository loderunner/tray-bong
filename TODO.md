# Now

- Add a loading state to the message UI
- Add a error state to the message UI
- Setup system prompt from prompt file
- Show system prompt as hidden revealable text
- Show thinking indicator and stream thinking text - hidden revealable text
- Support markdown in the message UI
- Move the chat window by grabbing anywhere without text or interaction

# Later

- Write each IPC like its own little backend service
- Drop stack traces from error messages
- Better colors & dark mode
- Push state to Renderer processes on creation and store in a context
- Expose refresh and mutation functions to Renderer processes through the
  context, based on useSWR, with a custom fetcher that uses the ipcRenderer to
  send messages to the main process
- Generate conversation title based on the input message
- Save and restore past conversations
- Copy the contents of an assistant message
- Regenerate an assistant message
