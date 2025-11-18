# Now

- Add a loading state to the message UI
- Add a error state to the message UI
- Replace the input field with a textarea that automatically resizes to fit the
  content
- Support abortController to abort the stream
- Setup system prompt from prompt file
- Show system prompt as hidden revealable text
- Show thinking indicator and stream thinking text - hidden revealable text
- Support markdown in the message UI
- Scrolling in the message UI scrolls the input field too

# Later

- Better colors & dark mode
- Select a model & API key from the settings ui
- Push state to Renderer processes on creation and store in a context
- Expose refresh and mutation functions to Renderer processes through the
  context, based on useSWR, with a custom fetcher that uses the ipcRenderer to
  send messages to the main process
- Generate conversation title based on the input message
- Save and restore past conversations
