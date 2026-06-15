import { useState, useCallback } from 'react';
import { chatService } from '../services/api';

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  answer:
    "Assalam-o-Alaikum! I'm PakLaw, your AI legal research agent for the Constitution and Acts of Pakistan. Ask me anything — for example, *\"What does Article 25 say about equality?\"* or *\"What is the punishment under Section 489-F?\"* I'll search the legal library, reason through the sources, and give you a cited answer.",
  sources: [],
  usedFallback: false,
  streaming: false,
};

let counter = 0;
const nextId = () => `m${Date.now()}_${(counter += 1)}`;

export function useChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const ask = useCallback(
    async (question) => {
      const text = question.trim();
      if (!text || loading) return;

      // Add the user turn
      const userMsg = { id: nextId(), role: 'user', text };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setStatus('Searching the legal library…');

      // Create a streaming placeholder for the assistant reply
      const assistantId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', answer: '', sources: [], streaming: true, usedFallback: false },
      ]);

      // Build history from real prior messages (exclude welcome, cap at last 4 turns)
      const history = messages
        .filter((m) => m.id !== 'welcome' && (m.role === 'user' || (m.role === 'assistant' && m.answer)))
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.role === 'user' ? m.text : m.answer,
        }))
        .filter((m) => m.content);

      await chatService.askStream(text, history, {
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, answer: m.answer + token } : m)),
          );
        },
        onStatus: (txt) => setStatus(txt),
        onDone: (data) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    streaming: false,
                    sources: data.sources ?? [],
                    citations: data.citations ?? [],
                    usedFallback: data.usedFallback,
                    model: data.model,
                  }
                : m,
            ),
          );
          setLoading(false);
          setStatus('');
        },
        onError: (errMsg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    streaming: false,
                    answer:
                      m.answer ||
                      errMsg ||
                      'Something went wrong while answering. Please make sure the server is running and try again.',
                    sources: [],
                    usedFallback: true,
                    error: true,
                  }
                : m,
            ),
          );
          setLoading(false);
          setStatus('');
        },
      });
    },
    [messages, loading],
  );

  const reset = useCallback(() => {
    setMessages([WELCOME]);
    setStatus('');
  }, []);

  return { messages, loading, status, ask, reset };
}
