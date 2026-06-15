import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import Composer from './Composer';

export default function ChatWindow({ messages, loading, status, onSend }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Only show the status bar while loading but before tokens start arriving
  const streamingMsg = messages.find((m) => m.streaming);
  const showStatus = loading && status && (!streamingMsg || !streamingMsg.answer);

  return (
    <div className="flex h-full flex-col">
      <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {showStatus && (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
              ⚖
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-gray-500">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" />
              </span>
              {status}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <Composer onSend={onSend} loading={loading} />
    </div>
  );
}
