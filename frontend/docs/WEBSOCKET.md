# Server-Sent Events (SSE) / WebSocket Streaming

Emora uses SSE (Server-Sent Events) rather than full WebSockets for chat streaming. This is because the communication pattern is primarily uni-directional streaming (server to client) triggered by a standard HTTP POST request.

## Implementation: `useSSEStream` Hook

The `useSSEStream` hook (`hooks/useSSEStream.ts`) encapsulates the complexities of parsing manual SSE streams via the Fetch API.

### How it works:
1. Client makes a standard `fetch` POST request to `/chat/{id}/messages` including the message content and Bearer token.
2. Backend responds with `Transfer-Encoding: chunked` and `Content-Type: text/event-stream`.
3. The hook accesses `response.body.getReader()`.
4. It reads chunks of `Uint8Array`, decodes them to UTF-8 using `TextDecoder`.
5. It buffers the stream and splits it by newlines (`\n`).
6. It looks for lines starting with `data: ` and parses the JSON payload.
7. It appends the `token` string to the local `streamContent` state.
8. When it receives a chunk indicating `[DONE]` or `is_complete: true`, it closes the stream.

### Aborting
The hook utilizes an `AbortController` internally. Calling `cancelStream()` will abort the active fetch request, stopping the generation on the client (and ideally on the backend if configured to handle client disconnects).

### State
- `isStreaming`: Boolean indicating if a stream is active.
- `streamContent`: The accumulated string of the current AI message.
- `error`: Any connection or parsing errors.
