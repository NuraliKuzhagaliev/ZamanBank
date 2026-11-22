export const MAX_CHAT_MESSAGE = 1000;
export const MAX_CHAT_HISTORY = 8;
export const MAX_CHAT_BYTES = 8000;

export function serializeChatRequest(message, history, locale) {
  const recent = history.slice(-MAX_CHAT_HISTORY).map(({ role, content }) => ({
    role,
    content: content.slice(0, MAX_CHAT_MESSAGE)
  }));
  const encoder = new TextEncoder();
  while (true) {
    const body = JSON.stringify({ message, history: recent, locale });
    if (recent.length === 0 || encoder.encode(body).byteLength <= MAX_CHAT_BYTES) return body;
    // Each pair is a user message and the assistant's reply.
    recent.splice(0, 2);
  }
}
