import Markdown from '../common/Markdown';
import SourcesPanel from './SourcesPanel';

export default function MessageBubble({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-600 px-4 py-2.5 text-sm text-white shadow-sm">
          {message.text}
        </div>
      </div>
    );
  }

  const isEmpty = !message.answer;

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[92%] gap-3">
        {/* Agent avatar */}
        <div className="relative mt-1 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-base shadow-sm">
            ⚖
          </span>
          {message.streaming && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            </span>
          )}
        </div>

        <div className="min-w-0 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
          {/* Badges */}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {message.usedFallback && !message.error && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Quoted from sources
              </span>
            )}
            {message.model === 'local-llama' && !message.usedFallback && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AI generated
              </span>
            )}
          </div>

          {/* Content */}
          {isEmpty ? (
            <div className="flex items-center gap-1.5 py-1 text-sm text-gray-400">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" />
            </div>
          ) : (
            <div className="prose-answer">
              <Markdown>{message.answer}</Markdown>
              {message.streaming && (
                <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[1px] animate-[blink_1s_step-end_infinite] bg-primary-600 align-middle" />
              )}
            </div>
          )}

          <SourcesPanel sources={message.sources} />
        </div>
      </div>
    </div>
  );
}
