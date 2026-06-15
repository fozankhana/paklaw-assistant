import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow';
import Button from '../components/common/Button';

const SEED_SUGGESTIONS = [
  'Explain Article 19 on freedom of speech',
  'Punishment for qatl-i-amd under Section 302',
  'How is an FIR registered?',
  'When is consent considered free in a contract?',
];

function parseFollowUps(answer) {
  if (!answer) return [];
  const match = answer.match(/\*\*You might also ask:\*\*\s*([\s\S]*?)(?:\n\n---|\n\n_This is|$)/i);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

export default function Chat() {
  const { messages, loading, status, ask, reset } = useChat();
  const [params, setParams] = useSearchParams();
  const handledQuery = useRef(false);

  useEffect(() => {
    const q = params.get('q');
    if (q && !handledQuery.current) {
      handledQuery.current = true;
      ask(q);
      params.delete('q');
      setParams(params, { replace: true });
    }
  }, [params, ask, setParams]);

  // Find the last completed assistant message to extract follow-up chips
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && !m.streaming && !m.error && m.id !== 'welcome' && m.answer);

  const followUps = lastAssistant ? parseFollowUps(lastAssistant.answer) : [];
  const showSeedSuggestions = messages.length <= 1;

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">PakLaw Agent</h1>
          <p className="text-sm text-gray-500">
            AI-powered legal research — grounded in the Constitution and Acts, with citations.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={reset} disabled={loading}>
          New chat
        </Button>
      </div>

      <div className="flex h-[calc(100vh-15rem)] min-h-[460px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
        <ChatWindow messages={messages} loading={loading} status={status} onSend={ask} />
      </div>

      {/* Follow-up suggestions from the agent */}
      {!loading && followUps.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
            Continue the conversation
          </p>
          <div className="flex flex-wrap gap-2">
            {followUps.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={loading}
                className="rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1.5 text-sm text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seed suggestions when chat is empty */}
      {showSeedSuggestions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SEED_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm text-gray-600 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
